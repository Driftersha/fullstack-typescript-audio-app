#!/usr/bin/env python3
"""Audit manually downloaded CC0 candidate MP3s before Audio Player release.

Usage:
  python3 scripts/audit_music.py ~/Downloads/audio-player-cc0
Requires Python 3.10+, standard library only. Does not upload or publish files.
"""
from __future__ import annotations
import hashlib
import json
import pathlib
import sys
from datetime import datetime, timezone

TRACKS = [
    ("01_dreams.mp3", "Dreams (Free Stems)", "JMHBM", "https://freemusicarchive.org/music/beat-mekanik/single/dreams-free-stems/"),
    ("02_electron.mp3", "Electron (Free Stems)", "JMHBM", "https://freemusicarchive.org/music/beat-mekanik/single/electron-free-stems/"),
    ("03_power_of_the_beat.mp3", "The Power Of The Beat", "Play House", "https://freemusicarchive.org/music/play-house/single/the-power-of-the-beat/"),
    ("04_everything_you_ever_dreamed.mp3", "Everything You Ever Dreamed", "HoliznaCC0", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/everything-you-ever-dreamed"),
    ("05_vintage.mp3", "Vintage", "HoliznaCC0", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/vintagemp3/"),
    ("06_ramen.mp3", "Ramen", "HoliznaCC0", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/ramenmp3/"),
    ("07_plants.mp3", "Plants", "HoliznaCC0", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/plantsmp3/"),
    ("08_windows_down.mp3", "Windows Down", "HoliznaCC0", "https://freemusicarchive.org/music/holiznacc0/lazy-summer-lofi-1/windows-downmp3/"),
    ("09_waves.mp3", "Waves", "HoliznaCC0", "https://freemusicarchive.org/music/holiznacc0/lazy-summer-lofi-1/wavesmp3/"),
    ("10_down_time.mp3", "Down Time (LoFi, Peaceful)", "HoliznaCC0", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/down-time-lofi-peaceful-mp3/"),
]

def inspect_mp3(path: pathlib.Path) -> dict:
    """Basic signature check only, not a complete codec/integrity verification."""
    hasher = hashlib.sha256()
    with path.open("rb") as fh:
        prefix = fh.read(4096)
        fh.seek(0)
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            hasher.update(chunk)
    # An ID3v2 tag at the start, or MPEG audio sync bits near the beginning.
    possible_mp3 = prefix.startswith(b"ID3") or any(
        prefix[i] == 0xFF and (prefix[i + 1] & 0xE0) == 0xE0
        for i in range(min(len(prefix) - 1, 4095))
    )
    return {
        "sha256": hasher.hexdigest(),
        "size_bytes": path.stat().st_size,
        "has_mp3_signature": possible_mp3,
    }

def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__.strip())
        return 2
    folder = pathlib.Path(sys.argv[1]).expanduser().resolve()
    if not folder.is_dir():
        print(f"Missing folder: {folder}", file=sys.stderr)
        return 2
    entries = []
    passed = 0
    for filename, title, artist, url in TRACKS:
        path = folder / filename
        item = {
            "file": filename,
            "title": title,
            "artist": artist,
            "source_url": url,
            "license_claim": "CC0 1.0 on FMA track page",
            "rights_clearance": "PENDING independent review",
        }
        if not path.is_file():
            item["status"] = "MISSING"
        else:
            try:
                item.update(inspect_mp3(path))
                item["status"] = "BASIC_FILE_CHECK_OK" if item["has_mp3_signature"] and item["size_bytes"] > 1024 else "CHECK_FAILED"
                passed += item["status"] == "BASIC_FILE_CHECK_OK"
            except OSError as exc:
                item["status"] = f"READ_ERROR: {exc}"
        entries.append(item)
        print(f"{item['status']:<22} {filename}")
    manifest = {
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "note": "SHA-256 documents exact downloaded bytes only. It does NOT verify licensing, rightsholders, samples or lawful distribution. Keep release blocked pending review.",
        "checks_passed": passed,
        "total": len(TRACKS),
        "files": entries,
    }
    out = folder / "music_file_audit.json"
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Manifest: {out}")
    print(f"Basic file checks: {passed}/{len(TRACKS)} (NOT license clearance)")
    return 0 if passed == len(TRACKS) else 1

if __name__ == "__main__":
    raise SystemExit(main())
