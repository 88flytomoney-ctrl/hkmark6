#!/usr/bin/env python3
"""
Fetch Mark Six draw data from on99.life API and generate AI picks.

on99.life provides a clean JSON API for Hong Kong Mark Six lottery history.
Previous sources (Lottolyzer.com, bet.hkjc.com) were unreliable or removed.
"""
import json
import os
import re
import random
from pathlib import Path
from datetime import datetime, timezone, timedelta
from collections import defaultdict

import requests

OUTPUT_FILE = Path("public/data/draws.json")
HISTORY_DIR = Path("public/data/history")
HK_TZ = timezone(timedelta(hours=8))  # Hong Kong Standard Time (UTC+8)

# on99.life JSON API — returns clean structured lottery history data
API_BASE = "https://on99.life/api/lottery/history"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept": "application/json",
}


def fetch_draws(year=None, max_draws=100):
    """
    Fetch draw data from on99.life API.
    
    Fetches from the current year first, then supplements from the previous
    year if fewer than max_draws results are available.
    """
    if year is None:
        year = datetime.now(HK_TZ).year

    all_draws = []

    # Fetch current year
    print(f"📡 Fetching {API_BASE}?year={year} ...")
    resp = requests.get(f"{API_BASE}?year={year}", headers=HEADERS, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    results = data.get("results", [])
    print(f"  → Got {len(results)} draws for {year}")

    for r in results:
        draw = {
            "drawNumber": r.get("drawId", ""),
            "drawDate": r.get("drawDate", ""),
            "numbers": r.get("winningNumbers", []),
            "bonus": r.get("extraNumber"),
            "jackpot": r.get("jackpotAmount"),
        }
        all_draws.append(draw)

    # Fetch previous year if we need more draws
    if len(all_draws) < max_draws:
        prev_year = year - 1
        print(f"📡 Fetching {API_BASE}?year={prev_year} ...")
        resp2 = requests.get(f"{API_BASE}?year={prev_year}", headers=HEADERS, timeout=30)
        resp2.raise_for_status()
        data2 = resp2.json()

        results2 = data2.get("results", [])
        print(f"  → Got {len(results2)} draws for {prev_year}")

        for r in results2:
            draw = {
                "drawNumber": r.get("drawId", ""),
                "drawDate": r.get("drawDate", ""),
                "numbers": r.get("winningNumbers", []),
                "bonus": r.get("extraNumber"),
                "jackpot": r.get("jackpotAmount"),
            }
            all_draws.append(draw)

    # Deduplicate by draw number (drawId like "26/087")
    seen = set()
    unique = []
    for d in all_draws:
        if d["drawNumber"] not in seen:
            seen.add(d["drawNumber"])
            unique.append(d)

    return unique[:max_draws]


def compute_stats(draws):
    """Compute frequency and last-seen stats for all 49 numbers."""
    frequency = defaultdict(int)
    last_seen = {}

    for i, draw in enumerate(draws):
        for n in draw["numbers"]:
            frequency[n] += 1

    last_appearance = {}
    for i, draw in enumerate(draws):
        for n in draw["numbers"]:
            last_appearance[n] = i

    for n in range(1, 50):
        if n in last_appearance:
            last_seen[n] = last_appearance[n]
        else:
            last_seen[n] = len(draws)

    return {
        "frequency": dict(frequency),
        "lastSeen": last_seen,
        "totalDraws": len(draws),
    }


def generate_ai_picks(draws, stats):
    """Generate 2 sets of 6 numbers based on statistical analysis."""
    frequency = stats["frequency"]
    last_seen = stats["lastSeen"]

    max_freq = max(frequency.values()) if frequency else 1
    max_gap = max(last_seen.values()) if last_seen else 1

    scores = {}
    for n in range(1, 50):
        freq_score = frequency.get(n, 0) / max_freq
        gap_score = last_seen.get(n, 0) / max_gap
        range_score = 1.0 if 11 <= n <= 35 else 0.85
        scores[n] = freq_score * 0.4 + gap_score * 0.4 + range_score * 0.2

    sorted_nums = sorted(scores.keys(), key=lambda n: scores[n], reverse=True)

    set_a = sorted_nums[:6]

    top15 = sorted_nums[:15]
    mid = [n for n in sorted_nums if 16 <= n <= 30]
    extremes = [n for n in sorted_nums if n <= 10 or n >= 36]

    random.seed(datetime.now(HK_TZ).day)
    set_b = (
        random.sample(top15, 3) +
        random.sample(mid, 2) +
        random.sample(extremes, 1)
    )
    set_b = sorted(set_b)

    return {
        "setA": sorted(set_a),
        "setB": set_b,
        "generatedAt": datetime.now(HK_TZ).isoformat(timespec='minutes'),
        "method": "frequency + gap + range balanced",
    }


def main():
    print(f"🚀 Mark Six fetcher started at {datetime.now(HK_TZ).strftime('%Y-%m-%d %H:%M')} HKT")

    # 1. Fetch draws
    draws = fetch_draws()

    if not draws:
        print("❌ No draws fetched, exiting")
        import sys
        sys.exit(1)

    print(f"  → Total draws: {len(draws)}")

    # 2. Compute stats
    stats = compute_stats(draws)

    # 3. Generate AI picks
    ai_picks = generate_ai_picks(draws, stats)
    print(f"🤖 AI Set A: {ai_picks['setA']}")
    print(f"🤖 AI Set B: {ai_picks['setB']}")

    # 4. Load existing archive and append new pick if draw date matches
    archive_file = HISTORY_DIR / "archive.json"
    archive = []
    if archive_file.exists():
        with open(archive_file) as f:
            archive = json.load(f)

    latest_draw = draws[0]
    updated_archive = []
    for entry in archive:
        if entry.get("drawDate") == latest_draw["drawDate"] and "matchA" not in entry:
            actual = set(latest_draw["numbers"])
            entry["matchA"] = len(set(entry["setA"]) & actual)
            entry["matchB"] = len(set(entry["setB"]) & actual)
            entry["actualNumbers"] = latest_draw["numbers"]
        updated_archive.append(entry)

    new_pick = {
        "pickDate": datetime.now(HK_TZ).isoformat(timespec='minutes'),
        "drawDate": latest_draw["drawDate"],
        "drawNumber": latest_draw["drawNumber"],
        "setA": ai_picks["setA"],
        "setB": ai_picks["setB"],
        "matchA": None,
        "matchB": None,
        "actualNumbers": None,
    }
    if not any(e.get("drawDate") == new_pick["drawDate"] for e in updated_archive):
        updated_archive.insert(0, new_pick)

    # 5. Write output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    output = {
        "generatedAt": datetime.now(HK_TZ).isoformat(timespec='minutes'),
        "draws": draws,
        "stats": stats,
        "aiPicks": ai_picks,
        "archive": updated_archive[:50],
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Written to {OUTPUT_FILE}")

    # 6. Save history
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now(HK_TZ).strftime("%Y-%m-%d")
    history_file = HISTORY_DIR / f"{date_str}.json"
    with open(history_file, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"✅ History saved to {history_file}")

    # 7. Write archive
    with open(archive_file, "w", encoding="utf-8") as f:
        json.dump(updated_archive[:50], f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
