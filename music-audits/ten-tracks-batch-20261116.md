# Local audit of 10 downloaded CC0 candidate MP3s

Date: 2026-11-16. Source: the original nine-track ZIP archive and the previously uploaded `Everything You Ever Dreamed` MP3 supplied in this ChatGPT conversation.

**Technical status: 10/10 MP3 decoded successfully with FFmpeg.** Nine were checked in the batch; the tenth was checked separately. Each checksum below corresponds to the exact bytes re-packed into the local release-staging ZIP. Filenames have been normalized **without transcoding**.

| File | Artist — title | Audited duration | Audio bitrate |
|---|---|---:|---:|
| 01_dreams.mp3 | JMHBM — Dreams | 3:58 | 320 kb/s |
| 02_electron.mp3 | JMHBM — Electron | 3:30 | 320 kb/s |
| 03_power_of_the_beat.mp3 | Play House — The Power Of The Beat | 2:42 | 128 kb/s |
| 04_everything_you_ever_dreamed.mp3 | HoliznaCC0 — Everything You Ever Dreamed | 3:40 | 320 kb/s |
| 05_vintage.mp3 | HoliznaCC0 — Vintage | 2:54 | 320 kb/s |
| 06_ramen.mp3 | HoliznaCC0 — Ramen | 1:53 | 320 kb/s |
| 07_plants.mp3 | HoliznaCC0 — Plants | 3:53 | 320 kb/s |
| 08_windows_down.mp3 | HoliznaCC0 — Windows Down | 2:46 | 320 kb/s |
| 09_waves.mp3 | HoliznaCC0 — Waves | 2:21 | 320 kb/s |
| 10_down_time.mp3 | HoliznaCC0 — Down Time | 2:10 | 320 kb/s |

## SHA-256 (bytes actually inspected)

```text
5f46ae433685dcab0b86209e3fad47b235880780db2cbb23e39a5ee86a5274a3  01_dreams.mp3
d2723c23900ba6fd5ebbb58995e399182a9f06d6453792f2855aa7c2b7edba27  02_electron.mp3
af8893511dac27d7cd0cad7d5076460cb05f7386feb82313188aae29b3bd369b  03_power_of_the_beat.mp3
c5a2e0aa16cd92df54bb76322ab49e83b0bff5c30e751fe74d3a603e3ddb030f  04_everything_you_ever_dreamed.mp3
42039b4362a0c8fac40fabba2c63de75e7e21d092b58ba00a701283824f3ebf7  05_vintage.mp3
d72b98943805e4f37c3d7c4ee3b82cd912fbe4a993ea7b6b6d926810635ff202  06_ramen.mp3
c8c4e0c09a3885c6b7e200ec3963a5eb3fbe0a705b130f2426b05defbc4bb2a7  07_plants.mp3
54dc5dfb84c8ea71fa16866c4ad14d10ae4063e68d03f0f284156826ad882fac  08_windows_down.mp3
cc3ae08b3099d700204e84e6868eba1add9c07b64e21153d14ba6907b46d6ab4  09_waves.mp3
cb849614674aca861fdab3599d4e50272bacfc1cd169a91c5ce22725ca4f66a4  10_down_time.mp3
```

## Release gate still open

- [x] Received all 10 files in the current conversation.
- [x] Audio file integrity checked (FFmpeg decode); hashes documented.
- [x] Candidate source pages state CC0.
- [ ] Independently confirm the exact uploaded bytes correspond to the official source recordings.
- [ ] Preserve screenshots of source/license status and validate no third-party unlicensed samples.
- [ ] Obtain explicit approval to move audio files into public hosting and deploy.

**Do not interpret hash checks as copyright clearance.** These MP3s are deliberately **not** committed to the public repository until provenance review and deployment approval.
