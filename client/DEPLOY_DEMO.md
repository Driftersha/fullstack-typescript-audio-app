# Audio Player demo deployment

This frontend **does not require a backend**, authentication, or a database. It supports local MP3 selection with browser `URL.createObjectURL` and in-session favorites.

Build from repository root directory `client`: `npm ci && npm run build`. Publish `client/dist` (for a project whose root directory is `client`, output directory is `dist`).

## Adding the optional publicly licensed CC0 library

Audio files must **not** be committed before validating their rights and obtaining production approval. When cleared, place files under `client/public/audio/` with simple ASCII filenames, and a `catalog.json` array with entries `{ "file": "example.mp3", "title": "Title", "artist": "Artist", "sourceUrl": "https://freemusicarchive.org/music/..." }`. The build copies `public/audio` to `dist/audio` only when present. Without the catalog, the UI works as a local MP3 player and displays no fictional tracks.

Users' selected MP3 files stay in the browser tab: no upload or server persistence. Favorites are intentionally in-memory because local object URLs are not usable after reload.

Security: never insert untrusted filenames using `innerHTML`; this implementation assigns dynamic text with `textContent`.

**Copyright:** The CC0 source-page claim is not independent proof of all third-party rights. See the separate draft PR #1 for licensing evidence and pending checks.

Production: Vercel project already exists; **do not deploy until approval**.
