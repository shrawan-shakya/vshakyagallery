import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { IN, ART_HANG_CENTER } from './src/constants.js';
import { seedArtworks } from './src/data/artworks.js';
import { createClient } from '@sanity/client';
import {
  HALL_LAYOUT_IDS,
  DEFAULT_HALL_LAYOUT,
  getWallConfigs,
  getSlotPlan,
} from './src/utils/hallLayouts.js';
import { fetchSanityArtworks } from './src/utils/sanityArtworks.js';
import { sanityClient } from './src/lib/sanity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file for environment variables (ADMIN_PASSWORD, PORT, SANITY_API_WRITE_TOKEN)
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
  /* process.loadEnvFile not available or .env missing */
}

// Global Sanity Write Client for publishing curator edits directly into Sanity Content Lake
const sanityToken = process.env.SANITY_API_WRITE_TOKEN || 'skJtrwgSINaBKUEMm59QoTx4NuIggrkEh81J6b3rpbt0E9DLsjXg2uAwZDJiX2J0dCkOJUkdYWiPrbwv0iEoYgjgQNbzw0VA6d6so1EmazwIayletFBomDvrObdZeDhyxfp15Iod8VZGuRHi99JD2fyAdZvgqFBmunKPT8c9zBqKIFqy2KLm';
const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'qeqv70yn';
const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export const sanityWriteClient = sanityToken
  ? createClient({
      projectId: sanityProjectId,
      dataset: sanityDataset,
      token: sanityToken,
      apiVersion: '2026-02-06',
      useCdn: false,
    })
  : null;

if (sanityWriteClient) {
  console.log('✨ Sanity write client initialized successfully with author token!');
}


// ---------------- ADMIN AUTHENTICATION ----------------
// Single shared admin password. Set ADMIN_PASSWORD in .env for production;
// defaults to 'shakya'.
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const getAdminPassword = () => (process.env.ADMIN_PASSWORD || 'shakya').trim();
console.log('🔑 Loaded ADMIN_PASSWORD configuration');

function signToken(payload) {
  const pwd = getAdminPassword();
  const sig = crypto.createHmac('sha256', pwd).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

const issueToken = () => signToken(String(Date.now() + TOKEN_TTL_MS));

function verifyToken(token) {
  if (typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const pwd = getAdminPassword();
  const expected = crypto.createHmac('sha256', pwd).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function passwordsMatch(candidate) {
  if (typeof candidate !== 'string') return false;
  const pwd = getAdminPassword();
  const a = Buffer.from(candidate.trim());
  const b = Buffer.from(pwd);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Guards every mutating route; read routes stay public for visitors
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  next();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

const isVercel = process.env.VERCEL === '1';

// Ensure uploads directory exists (use /tmp on Vercel)
const uploadsDir = isVercel
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically with explicit CORS and caching headers
const staticUploadOptions = {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  },
};
const bundledUploadsDir = path.join(__dirname, 'public', 'uploads');
if (fs.existsSync(bundledUploadsDir)) {
  app.use('/uploads', express.static(bundledUploadsDir, staticUploadOptions));
}
app.use('/uploads', express.static(uploadsDir, staticUploadOptions));

const bundledAudioDir = path.join(__dirname, 'public', 'audio');
if (fs.existsSync(bundledAudioDir)) {
  app.use('/audio', express.static(bundledAudioDir, {
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Accept-Ranges', 'bytes');
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));
}

// Image proxy to bypass third-party CDN CORS restrictions in Three.js WebGL
app.get('/api/image-proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).send('Missing url parameter');
    }

    const parsed = new URL(targetUrl);
    if (!parsed.hostname.endsWith('sanity.io')) {
      return res.status(403).send('Untrusted host');
    }

    const upstreamRes = await fetch(targetUrl);
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Upstream error');
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    const buffer = await upstreamRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Image proxy error:', err.message);
    res.status(500).send('Failed to proxy image');
  }
});

// Initialize SQLite database (copy seed db to /tmp on Vercel)
const dbPath = isVercel ? path.join('/tmp', 'gallery.db') : path.join(__dirname, 'gallery.db');
if (isVercel && !fs.existsSync(dbPath)) {
  const sourceDb = path.join(__dirname, 'gallery.db');
  if (fs.existsSync(sourceDb)) {
    try { fs.copyFileSync(sourceDb, dbPath); } catch { /* ignore */ }
  }
}
const db = new Database(dbPath);

// Enable foreign keys, WAL journaling (concurrent visitor reads never block
// admin writes) and a busy timeout so writes wait instead of throwing.
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

// API shape of an artworks row: camelCase fields plus the metric size and the
// position / rotation tuples the 3D scene consumes directly
function toArtworkDTO(row) {
  return {
    id: row.id,
    sanityId: row.id,
    roomId: row.room_id,
    artistId: row.artist_id,
    title: row.title,
    artist: row.artist,
    year: row.year,
    medium: row.medium,
    description: row.description,
    audioText: row.audio_text,
    imageUrl: row.image_url,
    imageUrlSm: row.image_url_sm,
    widthIn: row.width_in,
    heightIn: row.height_in,
    width: row.width_in * IN,
    height: row.height_in * IN,
    wallId: row.wall_id,
    position: [row.pos_x, row.pos_y, row.pos_z],
    rotation: [0, row.rot_y, 0],
    isHung: true,
    unhung: false,
    showIn3D: true,
  };
}

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    slug TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    theme TEXT DEFAULT 'dark',
    wall_color TEXT DEFAULT '#ffffff',
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS artworks (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    artist_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    year TEXT,
    medium TEXT,
    description TEXT,
    audio_text TEXT,
    image_url TEXT NOT NULL,
    width_in REAL NOT NULL,
    height_in REAL NOT NULL,
    wall_id TEXT DEFAULT 'back',
    pos_x REAL,
    pos_y REAL,
    pos_z REAL,
    rot_y REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );
`);

// Seed default artist, room, and artworks if empty
const countArtists = db.prepare('SELECT COUNT(*) as count FROM artists').get();
if (countArtists.count === 0) {
  console.log('Seeding initial gallery database...');
  
  // Seed Artist
  const defaultArtistId = 'artist-group';
  db.prepare(`
    INSERT INTO artists (id, name, bio, slug)
    VALUES (?, ?, ?, ?)
  `).run(defaultArtistId, 'Featured Contemporary Masters', 'A curated selection of modern digital, acrylic, and oil masterpieces.', 'featured');

  // Seed Room
  const defaultRoomId = 'room-main';
  db.prepare(`
    INSERT INTO rooms (id, artist_id, title, description, theme, wall_color)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(defaultRoomId, defaultArtistId, 'Main Permanent Exhibition', 'The primary hall of Shakya Gallery.', 'dark', '#ffffff');

  const insertArt = db.prepare(`
    INSERT INTO artworks (id, room_id, artist_id, title, artist, year, medium, description, audio_text, image_url, width_in, height_in, wall_id, pos_x, pos_y, pos_z, rot_y)
    VALUES (@id, ?, ?, @title, @artist, @year, @medium, @description, @audioText, @imageUrl, @widthIn, @heightIn, @wallId, @posX, @posY, @posZ, @rotY)
  `);

  // The seed catalogue lives in src/data/artworks.js (shared with the client fallback)
  for (const art of seedArtworks) {
    insertArt.run({
      id: art.id,
      title: art.title,
      artist: art.artist,
      year: art.year,
      medium: art.medium,
      description: art.description,
      audioText: `${art.title} by ${art.artist}, ${art.year}. ${art.medium}. ${art.description}`,
      imageUrl: art.imageUrl,
      widthIn: art.widthIn,
      heightIn: art.heightIn,
      wallId: art.wallId,
      posX: art.position[0],
      posY: art.position[1],
      posZ: art.position[2],
      rotY: art.rotation[1],
    }, defaultRoomId, defaultArtistId);
  }
}

// Add the hall-layout column to existing databases created before hall layouts.
// A room's hall layout is the ARCHITECTURE of the whole hall (wall configuration,
// baffle partitions, pillar islands, circulation, lighting) — it supersedes the
// legacy artwork hanging layouts.
try {
  db.prepare("ALTER TABLE rooms ADD COLUMN hall_layout TEXT NOT NULL DEFAULT 'classic'").run();
} catch {
  // Column already exists
}

// Small (1024px) WebP variant of each upload for low-end GPUs and thumbnails
try {
  db.prepare('ALTER TABLE artworks ADD COLUMN image_url_sm TEXT').run();
} catch {
  // Column already exists
}

// Migrate legacy 1.55m hanging height to the new elevated ART_HANG_CENTER
try {
  db.prepare('UPDATE artworks SET pos_y = ? WHERE ABS(pos_y - 1.55) < 0.01').run(ART_HANG_CENTER);
} catch {
  // Ignore
}

// Resolve a hall layout id from a request payload
function safeHallLayout(hallLayout) {
  return HALL_LAYOUT_IDS.includes(hallLayout) ? hallLayout : DEFAULT_HALL_LAYOUT;
}

/**
 * Compute the hanging coordinates for an artwork auto-slotted onto a wall of
 * the room's hall layout. Falls back to the back wall when the requested wall
 * does not exist in that hall's architecture (e.g. a classic partition id in
 * a Chronological Loop room).
 */
function slotOnWall(hallId, roomId, requestedWall, db) {
  const walls = getWallConfigs(hallId);
  const plan = getSlotPlan(hallId);

  const wall = walls[requestedWall] ? requestedWall : 'back';
  const def = walls[wall];

  const existing = db
    .prepare('SELECT pos_x, pos_z FROM artworks WHERE room_id = ? AND wall_id = ?')
    .all(roomId, wall);
  const candidateSlots = plan[wall] || [0];
  const isX = def.axis === 'x';

  let chosenOffset = candidateSlots[0];
  for (const slot of candidateSlots) {
    const isTaken = existing.some(
      (art) => Math.abs((isX ? art.pos_x : art.pos_z) - slot) < 1.0
    );
    if (!isTaken) {
      chosenOffset = slot;
      break;
    }
  }

  const posX = isX ? chosenOffset : def.center[0];
  const posZ = isX ? def.center[2] : chosenOffset;
  const rotY = def.rotation[1];

  return { wall, posX, posZ, rotY };
}

// Multer Storage Configuration — hardened: 15 MB cap, one file,
// image MIME whitelist (jpeg/png/webp only)
const MAX_IMAGE_BYTES = 35 * 1024 * 1024; // 35 MB
const IMAGE_EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/x-png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/tiff': '.tiff',
  'image/bmp': '.bmp',
};
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_EXTS.has(ext) ? ext : (IMAGE_EXT_BY_MIME[mime] || '.jpg');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'artwork-' + uniqueSuffix + safeExt);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (IMAGE_EXT_BY_MIME[mime] || ALLOWED_EXTS.has(ext) || mime.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported image format (${mime || ext}). Please upload a JPG, PNG, or WebP file.`));
    }
  },
});

// Middleware that wraps multer to return clean JSON error responses instead of HTML 500
function handleUpload(field) {
  const uploader = upload.single(field);
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: `Image file is too large (maximum size is ${MAX_IMAGE_BYTES / (1024 * 1024)}MB).` });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
}

// ---------------- IMAGE PIPELINE ----------------
// Every upload is re-encoded to WebP at two sizes: the frame texture cap (2048px)
// and a small variant (1024px) for low-end GPUs, admin thumbnails and the plaque
// header. The original is discarded once both exist.
const IMAGE_VARIANTS = [
  { key: 'imageUrl', suffix: '', maxSide: 2048 },
  { key: 'imageUrlSm', suffix: '-sm', maxSide: 1024 },
];

// Persist one processed file: Vercel Blob when configured, else the local /uploads URL
async function storeImage(localPath, filename, contentType) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return `/uploads/${filename}`;
  try {
    const options = { access: 'public', contentType };
    if (token) options.token = token;
    const blob = await put(filename, fs.readFileSync(localPath), options);
    if (blob?.url) {
      try { fs.unlinkSync(localPath); } catch { /* ignore */ }
      return blob.url;
    }
  } catch (blobErr) {
    console.warn('⚠️ Vercel Blob notice (falling back to local URL):', blobErr.message);
  }
  return `/uploads/${filename}`;
}

// Multer's temp file -> { imageUrl, imageUrlSm, width, height }
async function processUpload(file) {
  try {
    const meta = await sharp(file.path).metadata();
    const base = path.parse(file.filename).name;
    const result = { width: meta.width, height: meta.height };
    for (const variant of IMAGE_VARIANTS) {
      const filename = `${base}${variant.suffix}.webp`;
      const outPath = path.join(uploadsDir, filename);
      await sharp(file.path)
        .rotate() // honour EXIF orientation
        .resize({ width: variant.maxSide, height: variant.maxSide, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outPath);
      result[variant.key] = await storeImage(outPath, filename, 'image/webp');
    }
    return result;
  } finally {
    try { fs.unlinkSync(file.path); } catch { /* ignore */ }
  }
}

// Hanging size when the curator gave none: 40in tall, width from the pixel aspect
function inchesFromAspect({ width, height }) {
  if (!width || !height) return { widthIn: 48, heightIn: 36 };
  return { widthIn: Math.round(40 * (width / height)), heightIn: 40 };
}

// Delete locally stored variants; blob URLs are left alone
function removeLocalImages(...urls) {
  for (const url of urls) {
    if (!url || !url.startsWith('/uploads/')) continue;
    try { fs.unlinkSync(path.join(uploadsDir, path.basename(url))); } catch { /* already gone */ }
  }
}

// ---------------- RATE LIMITING ----------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // brute-force protection on the password route
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in a few minutes.' },
});
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // generous for curators, hostile to scripts
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests. Slow down.' },
});

// ---------------- ROLLING DATABASE BACKUPS ----------------
// Online backup via better-sqlite3's db.backup() (WAL-safe). Keeps last 5.
const BACKUP_DIR = path.join(__dirname, 'backups');
async function backupDatabase() {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await db.backup(path.join(BACKUP_DIR, `gallery-${stamp}.db`));
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('gallery-') && f.endsWith('.db'))
      .sort();
    while (files.length > 5) fs.unlinkSync(path.join(BACKUP_DIR, files.shift()));
    console.log(`🗄️  Database backup complete (${files.length} kept in /backups)`);
  } catch (err) {
    console.error('Database backup failed:', err.message);
  }
}
// Vercel's function bundle is read-only and its instances are short-lived,
// so rolling backups only make sense on a long-running host
if (!isVercel) {
  backupDatabase();
  setInterval(backupDatabase, 6 * 60 * 60 * 1000).unref(); // every 6 hours
}

// ---------------- REST API ROUTES ----------------

// GET /api/health - liveness probe for uptime monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), rooms: db.prepare('SELECT COUNT(*) as c FROM rooms').get().c });
});

// POST /api/auth/login - exchange the admin password for a signed token
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { password } = req.body || {};
  if (!passwordsMatch(password)) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }
  res.json({ token: issueToken(), expiresAt: Date.now() + TOKEN_TTL_MS });
});

// GET /api/artists - Get list of all artists
app.get('/api/artists', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    try {
      const artists = await sanityClient.fetch(
        `*[_type == "artist"] | order(name asc) { "id": _id, name, bio, "slug": slug.current }`
      );
      if (Array.isArray(artists) && artists.length > 0) {
        return res.json(artists);
      }
    } catch (sanityErr) {
      console.warn('Could not fetch artists from Sanity, falling back to SQLite:', sanityErr.message);
    }
    const artists = db.prepare('SELECT * FROM artists ORDER BY name ASC').all();
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/artists - Create new artist
app.post('/api/artists', writeLimiter, requireAdmin, (req, res) => {
  try {
    const { name, bio } = req.body;
    if (!name) return res.status(400).json({ error: 'Artist name is required' });
    
    const id = 'artist-' + Date.now();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;
    
    db.prepare('INSERT INTO artists (id, name, bio, slug) VALUES (?, ?, ?, ?)').run(id, name, bio || '', slug);
    
    // Automatically create a default room for this artist
    const roomId = 'room-' + Date.now();
    db.prepare('INSERT INTO rooms (id, artist_id, title, description) VALUES (?, ?, ?, ?)').run(
      roomId,
      id,
      `${name}'s Gallery Wing`,
      `Solo exhibition of works by ${name}.`
    );

    const artist = db.prepare('SELECT * FROM artists WHERE id = ?').get(id);
    res.status(201).json(artist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms - Get all rooms with artist details
app.get('/api/rooms', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const rooms = db.prepare(`
      SELECT rooms.*, artists.name as artist_name, artists.slug as artist_slug
      FROM rooms
      JOIN artists ON rooms.artist_id = artists.id
      ORDER BY rooms.title ASC
    `).all();

    const roomMap = new Map();
    rooms.forEach((r) => roomMap.set(r.id, r));

    if (!roomMap.has('room-main')) {
      roomMap.set('room-main', {
        id: 'room-main',
        title: 'Main Permanent Exhibition',
        artist_name: 'Shakya Gallery Masters',
        hall_layout: 'classic',
      });
    }

    // Dynamic Sanity gallery wing discovery on server
    try {
      const sanityArtworks = await fetchSanityArtworks();
      if (Array.isArray(sanityArtworks)) {
        sanityArtworks.forEach((art) => {
          if (art.roomId && !roomMap.has(art.roomId)) {
            const isWing2 = art.roomId === 'room-wing-2';
            roomMap.set(art.roomId, {
              id: art.roomId,
              title: isWing2 ? 'Pavilion Wing II' : `Gallery Wing (${art.roomId})`,
              artist_name: 'Shakya Gallery Masters',
              hall_layout: 'classic',
            });
          }
        });
      }
    } catch {
      // fallback
    }

    res.json(Array.from(roomMap.values()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms - Create a room for an artist
app.post('/api/rooms', writeLimiter, requireAdmin, (req, res) => {
  try {
    const { artist_id, title, description, theme, wall_color, hall_layout } = req.body;
    if (!artist_id || !title) return res.status(400).json({ error: 'Artist and Title are required' });

    const safeHall = safeHallLayout(hall_layout);
    const safeWallColor =
      typeof wall_color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(wall_color)
        ? wall_color
        : '#ffffff';

    const id = 'room-' + Date.now();
    db.prepare('INSERT INTO rooms (id, artist_id, title, description, theme, wall_color, hall_layout) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, artist_id, title, description || '', theme || 'dark', safeWallColor, safeHall);

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rooms/:id - Update an existing exhibition / room
app.put('/api/rooms/:id', writeLimiter, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Exhibition not found' });

    const { title, description, theme, wall_color, hall_layout } = req.body;

    const newTitle = title || existing.title;
    const newDescription = description !== undefined ? description : existing.description;
    const newTheme = ['dark', 'light'].includes(theme) ? theme : (existing.theme || 'dark');
    const newWallColor =
      typeof wall_color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(wall_color)
        ? wall_color
        : (existing.wall_color || '#ffffff');
    const newHallLayout =
      hall_layout !== undefined ? safeHallLayout(hall_layout) : (existing.hall_layout || DEFAULT_HALL_LAYOUT);

    db.prepare(
      'UPDATE rooms SET title = ?, description = ?, theme = ?, wall_color = ?, hall_layout = ? WHERE id = ?'
    ).run(newTitle, newDescription, newTheme, newWallColor, newHallLayout, id);

    // If the hall architecture changed, artworks hung on walls that no longer
    // exist in the new hall (e.g. a Classic center partition in a Loop room)
    // are re-slotted onto surviving walls so nothing floats in mid-air.
    if (newHallLayout !== (existing.hall_layout || DEFAULT_HALL_LAYOUT)) {
      const walls = getWallConfigs(newHallLayout);
      const plan = getSlotPlan(newHallLayout);
      const arts = db.prepare('SELECT * FROM artworks WHERE room_id = ?').all(id);

      // Occupied along-axis offsets per still-valid wall
      const occupied = {};
      for (const a of arts) {
        if (!walls[a.wall_id]) continue;
        const def = walls[a.wall_id];
        (occupied[a.wall_id] ||= []).push(def.axis === 'x' ? a.pos_x : a.pos_z);
      }

      const migrate = db.prepare('UPDATE artworks SET wall_id = ?, pos_x = ?, pos_z = ?, rot_y = ? WHERE id = ?');
      for (const a of arts) {
        if (walls[a.wall_id]) continue;
        let placed = false;
        for (const w of Object.keys(walls)) {
          const def = walls[w];
          const isX = def.axis === 'x';
          occupied[w] = occupied[w] || [];
          for (const slot of plan[w] || [0]) {
            if (occupied[w].some((o) => Math.abs(o - slot) < 1.0)) continue;
            const posX = isX ? slot : def.center[0];
            const posZ = isX ? def.center[2] : slot;
            migrate.run(w, posX, posZ, def.rotation[1], a.id);
            occupied[w].push(slot);
            placed = true;
            break;
          }
          if (placed) break;
        }
        // Every slot full: fall back to the back wall center (rare overlap)
        if (!placed) {
          const back = walls.back;
          migrate.run('back', 0, back.center[2], back.rotation[1], a.id);
        }
      }
    }

    const room = db.prepare(`
      SELECT rooms.*, artists.name as artist_name, artists.slug as artist_slug
      FROM rooms JOIN artists ON rooms.artist_id = artists.id
      WHERE rooms.id = ?
    `).get(id);
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rooms/:id - Delete an exhibition and all of its artworks
app.delete('/api/rooms/:id', writeLimiter, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
    if (!room) return res.status(404).json({ error: 'Exhibition not found' });

    // Never leave the gallery without at least one exhibition
    const countRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get();
    if (countRooms.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last remaining exhibition.' });
    }

    // Remove uploaded image files belonging to this room's artworks
    const arts = db.prepare('SELECT image_url, image_url_sm FROM artworks WHERE room_id = ?').all(id);
    for (const art of arts) removeLocalImages(art.image_url, art.image_url_sm);

    // Artworks cascade via foreign keys
    db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artworks - Get artworks (optional ?roomId= and ?includeUnhung= filter)
app.get('/api/artworks', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { roomId, includeUnhung } = req.query;
    const wantAll = includeUnhung === 'true';

    // 1. Prioritize live Sanity Content Lake
    try {
      const sanityArtworks = await fetchSanityArtworks(wantAll);
      if (Array.isArray(sanityArtworks) && sanityArtworks.length > 0) {
        let filtered = sanityArtworks;
        if (!wantAll && roomId) {
          filtered = filtered.filter((a) => !a.roomId || a.roomId === roomId);
        }
        return res.json(filtered);
      }
    } catch (sanityErr) {
      console.warn('⚠️ Sanity query in /api/artworks failed, falling back to local database:', sanityErr.message);
    }

    // 2. Fallback to local SQLite database
    let query = 'SELECT * FROM artworks';
    let params = [];
    if (!wantAll && roomId) {
      query += ' WHERE room_id = ?';
      params.push(roomId);
    }
    query += ' ORDER BY created_at ASC';
    const rows = db.prepare(query).all(...params);

    res.json(rows.map(toArtworkDTO));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/artworks/upload - Upload new artwork image + metadata
app.post('/api/artworks/upload', writeLimiter, requireAdmin, handleUpload('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const {
      roomId,
      artistId,
      title,
      artist,
      year,
      medium,
      description,
      widthIn,
      heightIn,
      wallId
    } = req.body;

    if (!title || !artist || !roomId) {
      return res.status(400).json({ error: 'Title, Artist, and Room are required fields.' });
    }

    // WebP variants + pixel size (processed before anything is written to the DB)
    const image = await processUpload(req.file);

    // Determine dimensions (fallback to image aspect ratio if widthIn/heightIn missing)
    let finalWidthIn = parseFloat(widthIn);
    let finalHeightIn = parseFloat(heightIn);
    if (isNaN(finalWidthIn) || isNaN(finalHeightIn) || finalWidthIn <= 0 || finalHeightIn <= 0) {
      ({ widthIn: finalWidthIn, heightIn: finalHeightIn } = inchesFromAspect(image));
    }

    // Calculate wall position coordinates (use custom values if supplied, otherwise calculate wall slot)
    let wall = wallId || 'back';
    const posYExplicit = req.body.posY !== undefined && !isNaN(parseFloat(req.body.posY));
    let posY = posYExplicit ? parseFloat(req.body.posY) : ART_HANG_CENTER;
    let posX = req.body.posX !== undefined && !isNaN(parseFloat(req.body.posX)) ? parseFloat(req.body.posX) : null;
    let posZ = req.body.posZ !== undefined && !isNaN(parseFloat(req.body.posZ)) ? parseFloat(req.body.posZ) : null;
    let rotY = req.body.rotY !== undefined && !isNaN(parseFloat(req.body.rotY)) ? parseFloat(req.body.rotY) : null;

    if (posX === null || posZ === null || rotY === null) {
      // Hanging plan comes from the room's hall layout architecture
      const roomRow = db.prepare('SELECT hall_layout FROM rooms WHERE id = ?').get(roomId);
      const slotted = slotOnWall(safeHallLayout(roomRow?.hall_layout), roomId, wall, db);

      wall = slotted.wall;
      posX = slotted.posX;
      posZ = slotted.posZ;
      rotY = slotted.rotY;
    }

    const id = 'artwork-' + Date.now();
    const audioText = `${title} by ${artist}${year ? `, ${year}` : ''}. ${medium ? `${medium}. ` : ''}${description || ''}`;

    db.prepare(`
      INSERT INTO artworks (id, room_id, artist_id, title, artist, year, medium, description, audio_text, image_url, image_url_sm, width_in, height_in, wall_id, pos_x, pos_y, pos_z, rot_y)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      roomId,
      artistId || 'artist-group',
      title,
      artist,
      year || '',
      medium || 'Mixed Media',
      description || '',
      audioText,
      image.imageUrl,
      image.imageUrlSm,
      finalWidthIn,
      finalHeightIn,
      wall,
      posX,
      posY,
      posZ,
      rotY
    );

    const newArt = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
    res.status(201).json(toArtworkDTO(newArt));
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/artworks/:id - Update or Upsert an existing artwork metadata and optional replacement image
app.put('/api/artworks/:id', writeLimiter, requireAdmin, handleUpload('image'), async (req, res) => {
  try {
    const { id } = req.params;
    let existing = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);

    const {
      roomId,
      artistId,
      title,
      artist,
      year,
      medium,
      description,
      widthIn,
      heightIn,
      wallId
    } = req.body;

    const newTitle = title || (existing ? existing.title : 'Untitled Artwork');
    const newArtist = artist || (existing ? existing.artist : 'Unknown Artist');
    const newYear = year !== undefined ? year : (existing ? existing.year : '');
    const newMedium = medium !== undefined ? medium : (existing ? existing.medium : 'Oil on Canvas');
    const newDesc = description !== undefined ? description : (existing ? existing.description : '');
    const newRoomId = roomId || (existing ? existing.room_id : 'room-main');
    const newArtistId = artistId || (existing ? existing.artist_id : 'artist-group');
    let newWallId = wallId || (existing ? existing.wall_id : 'back');

    let finalWidthIn = parseFloat(widthIn) || (existing ? existing.width_in : 48);
    let finalHeightIn = parseFloat(heightIn) || (existing ? existing.height_in : 36);

    let imageUrl = req.body.imageUrl || (existing ? existing.image_url : null);
    let imageUrlSm = req.body.imageUrlSm || (existing ? existing.image_url_sm : null);

    // Only fallback to seed image if completely absent and no new image file was uploaded
    if (!imageUrl && !req.file) {
      imageUrl = (existing && existing.image_url) ? existing.image_url : '/artworks/starry-horizon.jpg';
    }

    // A replacement image: re-encode it, then drop the previous local files
    if (req.file) {
      const image = await processUpload(req.file);
      if (existing) removeLocalImages(existing.image_url, existing.image_url_sm);
      imageUrl = image.imageUrl;
      imageUrlSm = image.imageUrlSm;

      // Recalculate dimensions from the new aspect ratio if width/height not explicitly supplied
      if (isNaN(parseFloat(widthIn)) || isNaN(parseFloat(heightIn))) {
        ({ widthIn: finalWidthIn, heightIn: finalHeightIn } = inchesFromAspect(image));
      }
    }

    // Calculate wall position coordinates (use custom values if supplied, otherwise preserve existing or calculate wall slot)
    const posYExplicit = req.body.posY !== undefined && !isNaN(parseFloat(req.body.posY));
    let posY = posYExplicit ? parseFloat(req.body.posY) : (existing ? existing.pos_y : ART_HANG_CENTER);
    
    const isSameWall = existing && (!wallId || wallId === existing.wall_id);
    let posX = req.body.posX !== undefined && !isNaN(parseFloat(req.body.posX)) 
      ? parseFloat(req.body.posX) 
      : (isSameWall ? existing.pos_x : null);
    let posZ = req.body.posZ !== undefined && !isNaN(parseFloat(req.body.posZ)) 
      ? parseFloat(req.body.posZ) 
      : (isSameWall ? existing.pos_z : null);
    let rotY = req.body.rotY !== undefined && !isNaN(parseFloat(req.body.rotY)) 
      ? parseFloat(req.body.rotY) 
      : (isSameWall ? existing.rot_y : null);

    if (posX === null || posZ === null || rotY === null) {
      // Center-out slotting per the room's hall layout architecture
      const roomRow = db.prepare('SELECT hall_layout FROM rooms WHERE id = ?').get(newRoomId);
      const slotted = slotOnWall(safeHallLayout(roomRow?.hall_layout), newRoomId, newWallId, db);

      newWallId = slotted.wall;
      posX = slotted.posX;
      posZ = slotted.posZ;
      rotY = slotted.rotY;
    }

    const audioText = `${newTitle} by ${newArtist}${newYear ? `, ${newYear}` : ''}. ${newMedium ? `${newMedium}. ` : ''}${newDesc || ''}`;

    if (!existing) {
      db.prepare(`
        INSERT INTO artworks (id, room_id, artist_id, title, artist, year, medium, description, audio_text, image_url, image_url_sm, width_in, height_in, wall_id, pos_x, pos_y, pos_z, rot_y)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, newRoomId, newArtistId, newTitle, newArtist, newYear, newMedium, newDesc, audioText, imageUrl, imageUrlSm, finalWidthIn, finalHeightIn, newWallId, posX, posY, posZ, rotY
      );
    } else {
      db.prepare(`
        UPDATE artworks 
        SET room_id = ?, artist_id = ?, title = ?, artist = ?, year = ?, medium = ?, description = ?, audio_text = ?, image_url = ?, image_url_sm = ?, width_in = ?, height_in = ?, wall_id = ?, pos_x = ?, pos_y = ?, pos_z = ?, rot_y = ?
        WHERE id = ?
      `).run(
        newRoomId, newArtistId, newTitle, newArtist, newYear, newMedium, newDesc, audioText, imageUrl, imageUrlSm, finalWidthIn, finalHeightIn, newWallId, posX, posY, posZ, rotY, id
      );
    }

    // Direct Global Synchronization with Sanity Content Lake
    if (sanityWriteClient) {
      try {
        const patchData = {
          'virtualGallery.wallId': newWallId,
          'virtualGallery.position': { x: posX, y: posY, z: posZ },
          'virtualGallery.rotationY': rotY,
          'virtualGallery.roomId': newRoomId,
          'virtualGallery.showIn3D': true,
          'virtualGallery.unhung': false,
          'virtualGallery.isHung': true,
          'virtualGallery.widthIn': finalWidthIn,
          'virtualGallery.heightIn': finalHeightIn,
        };
        if (title) patchData.title = newTitle;
        if (artist) patchData.artistName = newArtist;
        if (year) patchData.year = newYear;
        if (medium) patchData.material = newMedium;

        await sanityWriteClient
          .patch(id)
          .set(patchData)
          .commit({ autoGenerateArrayKeys: true });

        console.log(`✅ Synced artwork "${id}" placement directly to Sanity Content Lake!`);
      } catch (sanityErr) {
        console.warn(`Sanity patch notice for ${id}:`, sanityErr.message);
      }
    }

    const updated = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
    res.json(toArtworkDTO(updated));
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/artworks/:id - Unhang / remove artwork from 3D gallery display
app.delete('/api/artworks/:id', writeLimiter, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let found = false;

    // 1. If Sanity write client is active, unhang in Sanity while preserving the master record
    if (sanityWriteClient) {
      try {
        await sanityWriteClient
          .patch(id)
          .set({
            'virtualGallery.showIn3D': false,
            'virtualGallery.unhung': true,
            'virtualGallery.isHung': false,
          })
          .commit({ autoGenerateArrayKeys: true });
        console.log(`✅ Unhung artwork "${id}" in Sanity Content Lake (preserved catalog record)`);
        found = true;
      } catch (sanityErr) {
        console.warn(`Sanity unhang note for ${id}:`, sanityErr.message);
      }
    }

    // 2. If it exists in local SQLite, remove from SQLite
    const art = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
    if (art) {
      removeLocalImages(art.image_url, art.image_url_sm);
      db.prepare('DELETE FROM artworks WHERE id = ?').run(id);
      found = true;
    }

    if (!found && !sanityWriteClient) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    res.json({ success: true, id, unhung: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { app };

// Start Express Server (local dev & standalone Node.js)
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`✨ Gallery Backend REST API running at http://localhost:${PORT}`);
  });
}
