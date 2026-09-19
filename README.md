# Shakya Gallery

A walk-through 3D fine-art gallery. React + Vite + react-three-fiber on the
front end, a small Express + SQLite API for the curator admin (rooms, artists,
artwork uploads), deployable to Vercel.

## Run locally

```bash
npm install
cp .env.example .env   # set ADMIN_PASSWORD
npm run dev            # Vite on :5173, API on :3001 (proxied under /api and /uploads)
```

Open `http://localhost:5173`. Add `?stats` to the URL for an FPS overlay.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server + API with file watching |
| `npm run build` | Production bundle in `dist/` |
| `npm run preview` | Serve `dist/` with the API proxied (start `npm run server` too) |
| `npm run lint` | oxlint |

## Layout

- `src/App.jsx` — scene composition, room/artwork state, HUD wiring
- `src/components/3d/` — room architecture, frames, lights, walk and orbit cameras
- `src/components/ui/` — HUD, artwork plaque modal, wing picker, curator admin
- `src/utils/hallLayouts.js` — hall presets (walls, partitions, lighting, colliders) shared by client and server
- `src/data/artworks.js` — seed catalogue shared by the server seed and the offline fallback
- `server.js` — Express API, SQLite schema, uploads (local disk or Vercel Blob)

Scale contract: 1 scene unit = 1 metre. Artwork sizes are entered in inches
and converted with the `IN` constant in `src/constants.js`.

## Deployment notes

On Vercel the SQLite file is copied to `/tmp` per function instance, so
curator edits do not persist across cold starts. Use a hosted database before
relying on the admin panel in production.
