# Candidate MP3 bundle — technical inspection

Review date: 2026-11-16. Source: user-provided `Архив.zip`. No MP3 or copyrighted audio was uploaded to GitHub. Nine MP3 entries were found (plus macOS resource-fork metadata entries ignored). All nine files passed full FFmpeg audio decoding (`-xerror`) and returned MP3 audio streams in ffprobe.

| Recording | Artist | Duration (rounded) | Bitrate (kbps) | SHA-256 prefix* | Decode |
|---|---|---:|---:|---|---|
| Dreams (Free Stems) | JMHBM | 03:58 | 320 | `5f46ae433685dcab` | PASS |
| Electron (Free Stems) | JMHBM | 03:30 | 320 | `d2723c23900ba6fd` | PASS |
| The Power Of The Beat | Play House | 02:42 | 128 | `af8893511dac27d7` | PASS |
| Vintage | HoliznaCC0 | 02:54 | 320 | `42039b4362a0c8fa` | PASS |
| Ramen | HoliznaCC0 | 01:53 | 320 | `d72b98943805e4f3` | PASS |
| Plants | HoliznaCC0 | 03:53 | 320 | `c8c4e0c09a3885c6` | PASS |
| Windows Down | HoliznaCC0 | 02:46 | 320 | `54dc5dfb84c8ea71` | PASS |
| Waves | HoliznaCC0 | 02:21 | 320 | `cc3ae08b3099d700` | PASS |
| Down Time (LoFi, Peaceful) | HoliznaCC0 | 02:10 | 320 | `cb849614674aca86` | PASS |

*Only short prefixes shown here for identification; use full 64-digit SHA-256 in an offline evidence manifest prior to publishing. The actual source downloads and independently licensed identity were not cryptographically verified. A SHA-256 identifies bytes, not copyright ownership.

**Release status: BLOCKED** until the license/provenance checklist in MUSIC_LICENSES.md is complete. Do not merge this PR as approval to self-host the sound recordings. Previously checked `Everything You Ever Dreamed` is documented separately in music-audits/everything-you-ever-dreamed.md.
