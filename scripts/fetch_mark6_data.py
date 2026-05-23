#!/usr/bin/env python3
"""
Fetch Mark Six draw data from lottolyzer.com and generate AI picks.
"""
import requests
import re
import json
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta
from collections import defaultdict

BASE_URL = "https://en.lottolyzer.com/history/hong-kong/mark-six/page/{page}/per-page/50/summary-view"
OUTPUT_FILE = Path("public/data/draws.json")
HISTORY_DIR = Path("public/data/history")
HK_TZ = timezone(timedelta(hours=8))  # Hong Kong Standard Time (UTC+8)
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}


def fetch_draws():
    """Fetch last 100 draws from lottolyzer history pages."""
    all_rows = []
    for page in range(1, 3):
        url = BASE_URL.format(page=page)
        print(f"📡 Fetching {url}")
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        html = resp.text
        rows = re.findall(
            r'<td>(\d+/\d+)</td>\s*<td[^>]*>([\d-]+)</td>\s*<td[^>]*>([\d,\s]+)</td>\s*<td[^>]*>([\d]+)',
            html
        )
        print(f"  → Found {len(rows)} draws on page {page}")
        all_rows.extend(rows)
    return all_rows


def parse_row(row):
    draw_num, date, nums_str, bonus = row
    numbers = [int(n.strip()) for n in nums_str.split(",")]
    bonus = int(bonus.strip())
    return {
        "drawNumber": draw_num,
        "drawDate": date,
        "numbers": numbers,
        "bonus": bonus,
        "jackpot": None,  # Not shown in history table
    }


def compute_stats(draws):
    """Compute frequency and last-seen stats for all 49 numbers."""
    frequency = defaultdict(int)
    last_seen = {}  # draws since last appearance (0 = just appeared)

    for i, draw in enumerate(draws):
        for n in draw["numbers"]:
            frequency[n] += 1

    # For each number 1-49, find when it last appeared
    last_appearance = {}
    for i, draw in enumerate(draws):
        for n in draw["numbers"]:
            last_appearance[n] = i

    for n in range(1, 50):
        if n in last_appearance:
            last_seen[n] = last_appearance[n]
        else:
            last_seen[n] = len(draws)  # never seen

    return {
        "frequency": dict(frequency),
        "lastSeen": last_seen,
        "totalDraws": len(draws),
    }


def generate_ai_picks(draws, stats):
    """Generate 2 sets of 7 numbers based on statistical analysis."""
    frequency = stats["frequency"]
    last_seen = stats["lastSeen"]

    # Score each number: higher = more likely to appear
    # Factors: hot (frequency), overdue (lastSeen), number range balance
    max_freq = max(frequency.values()) if frequency else 1
    max_gap = max(last_seen.values()) if last_seen else 1

    scores = {}
    for n in range(1, 50):
        freq_score = frequency.get(n, 0) / max_freq
        gap_score = last_seen.get(n, 0) / max_gap
        # Balance: prefer mid-range numbers (11-35) slightly
        range_score = 1.0 if 11 <= n <= 35 else 0.85
        scores[n] = freq_score * 0.4 + gap_score * 0.4 + range_score * 0.2

    sorted_nums = sorted(scores.keys(), key=lambda n: scores[n], reverse=True)

    # Set A: High composite score (hot + overdue balance)
    set_a = sorted_nums[:7]

    # Set B: Diversified - mix of hot, overdue, and range-balanced
    # Pick 3 from top 15, 2 from mid-range 16-30, 2 from extremes
    top15 = sorted_nums[:15]
    mid = [n for n in sorted_nums if 16 <= n <= 30]
    extremes = [n for n in sorted_nums if n <= 10 or n >= 36]

    import random
    random.seed(datetime.now(HK_TZ).day)  # deterministic daily picks
    set_b = (
        random.sample(top15, 3) +
        random.sample(mid, 2) +
        random.sample(extremes, 2)
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
    raw_rows = fetch_draws()
    draws = [parse_row(r) for r in raw_rows]

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

    # Check if any archived pick matches the latest draw
    latest_draw = draws[0]
    updated_archive = []
    for entry in archive:
        if entry.get("drawDate") == latest_draw["drawDate"] and "matchA" not in entry:
            # Cross-reference
            actual = set(latest_draw["numbers"])
            entry["matchA"] = len(set(entry["setA"]) & actual)
            entry["matchB"] = len(set(entry["setB"]) & actual)
            entry["actualNumbers"] = latest_draw["numbers"]
        updated_archive.append(entry)

    # Add today's pick (without match data yet)
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
    # Only add if not already in archive for this draw
    if not any(e.get("drawDate") == new_pick["drawDate"] for e in updated_archive):
        updated_archive.insert(0, new_pick)

    # 5. Write output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    output = {
        "generatedAt": datetime.now(HK_TZ).isoformat(timespec='minutes'),
        "draws": draws,
        "stats": stats,
        "aiPicks": ai_picks,
        "archive": updated_archive[:50],  # keep last 50
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
