import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import sizeOf from 'image-size';
import { put } from '@vercel/blob';
import {
  HALL_LAYOUT_IDS,
  DEFAULT_HALL_LAYOUT,
  getWallConfigs,
  getSlotPlan,
} from './src/utils/hallLayouts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file for environment variables (ADMIN_PASSWORD, PORT)
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
  /* process.loadEnvFile not available or .env missing */
}

// Fallback manual parser to ensure .env is read cleanly regardless of Node version or quotes
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const rawContent = fs.readFileSync(envPath, 'utf8');
    for (const line of rawContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1).trim();
        }
        process.env[key] = val;
      }
    }
  }
} catch { /* ignore */ }

// ---------------- ADMIN AUTHENTICATION ----------------
// Single shared admin password. Set ADMIN_PASSWORD in .env for production;
// otherwise a random password is generated and printed once at boot.
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
let getAdminPassword = () => (process.env.ADMIN_PASSWORD || '').trim();
if (!getAdminPassword()) {
  const fallback = crypto.randomBytes(18).toString('base64url');
  process.env.ADMIN_PASSWORD = fallback;
  console.warn('⚠️  ADMIN_PASSWORD not set — generated a temporary password for THIS session only:');
  console.warn(`    ${fallback}`);
} else {
  console.log('🔑 Loaded ADMIN_PASSWORD from .env file');
}

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

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

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

  // Initial Artwork List (converted from static data)
  const initialArtworks = [
    {
      id: "starry-horizon",
      title: "The Starry Horizon",
      artist: "Evelyn Vane",
      year: "2024",
      medium: "Acrylic on Canvas",
      description: "An expressive landscape capturing the ethereal boundary where a neon twilight meets a starlit mountain range.",
      imageUrl: "/artworks/starry-horizon.jpg",
      widthIn: 48,
      heightIn: 36,
      wallId: 'back',
      posX: -6.75, posY: 1.55, posZ: -9.8, rotY: 0
    },
    {
      id: "echoes-silence",
      title: "Echoes of Silence",
      artist: "Marcus Thorne",
      year: "2023",
      medium: "Oil on Canvas",
      description: "A minimalist monochromatic abstract piece representing quiet solitude. The subtle textures on heavy impasto canvas invite close inspection.",
      imageUrl: "/artworks/echoes-silence.jpg",
      widthIn: 40,
      heightIn: 40,
      wallId: 'back',
      posX: -2.25, posY: 1.55, posZ: -9.8, rotY: 0
    },
    {
      id: "golden-symphony",
      title: "Golden Symphony",
      artist: "Clara Dupont",
      year: "2025",
      medium: "Mixed Media & Gold Leaf",
      description: "A vibrant abstract composition combining gold leaf sheets with warm-toned oils suggesting musical flow.",
      imageUrl: "/artworks/golden-symphony.jpg",
      widthIn: 36,
      heightIn: 48,
      wallId: 'back',
      posX: 2.25, posY: 1.55, posZ: -9.8, rotY: 0
    },
    {
      id: "neon-prism",
      title: "Prism of Neon & Gold",
      artist: "Lucas Vance",
      year: "2025",
      medium: "Oil & Metallic Foil on Canvas",
      description: "A geometric composition exploring light refraction through crystal structures.",
      imageUrl: "/artworks/starry-horizon.jpg",
      widthIn: 48,
      heightIn: 36,
      wallId: 'back',
      posX: 6.75, posY: 1.55, posZ: -9.8, rotY: 0
    },
    {
      id: "solitude",
      title: "Solitude in Blue",
      artist: "Elena Rostova",
      year: "2022",
      medium: "Watercolor & Ink",
      description: "A wide-format watercolor depicting a solitary lighthouse shrouded in deep oceanic blue mist.",
      imageUrl: "/artworks/solitude.jpg",
      widthIn: 63,
      heightIn: 36,
      wallId: 'left',
      posX: -9.8, posY: 1.55, posZ: -4, rotY: Math.PI / 2
    },
    {
      id: "velocity-light",
      title: "Velocity of Light",
      artist: "Kenji Sato",
      year: "2024",
      medium: "Digital Painting on Archival Canvas",
      description: "An energetic abstract painting depicting light rays bending in hyper-speed with neon strokes.",
      imageUrl: "/artworks/velocity-light.jpg",
      widthIn: 36,
      heightIn: 48,
      wallId: 'left',
      posX: -9.8, posY: 1.55, posZ: 4, rotY: Math.PI / 2
    },
    {
      id: "crimson-mirage",
      title: "Crimson Mirage",
      artist: "Amina Al-Mansoor",
      year: "2023",
      medium: "Acrylic on Linen",
      description: "An evocative representation of desert heatwaves with swirling vermillion and crimson tones.",
      imageUrl: "/artworks/crimson-mirage.jpg",
      widthIn: 56,
      heightIn: 42,
      wallId: 'right',
      posX: 9.8, posY: 1.55, posZ: -4, rotY: -Math.PI / 2
    },
    {
      id: "whispering-winds",
      title: "Whispering Winds",
      artist: "Oliver Green",
      year: "2024",
      medium: "Gouache on Paper",
      description: "A stylized botanical abstract showcasing large Monstera leaves blowing in the wind.",
      imageUrl: "/artworks/whispering-winds.jpg",
      widthIn: 44,
      heightIn: 44,
      wallId: 'right',
      posX: 9.8, posY: 1.55, posZ: 4, rotY: -Math.PI / 2
    },
    {
      id: "monolith-shadow",
      title: "Monolith Shadow",
      artist: "Diana Vance",
      year: "2025",
      medium: "Oil on Wood Panel",
      description: "An architectural study of light and geometry with a singular tall dark structure.",
      imageUrl: "/artworks/monolith-shadow.jpg",
      widthIn: 36,
      heightIn: 48,
      wallId: 'partition_back',
      posX: 0, posY: 1.55, posZ: 1.8, rotY: Math.PI
    }
  ];

  const insertArt = db.prepare(`
    INSERT INTO artworks (id, room_id, artist_id, title, artist, year, medium, description, audio_text, image_url, width_in, height_in, wall_id, pos_x, pos_y, pos_z, rot_y)
    VALUES (@id, ?, ?, @title, @artist, @year, @medium, @description, @audioText, @imageUrl, @widthIn, @heightIn, @wallId, @posX, @posY, @posZ, @rotY)
  `);

  for (const art of initialArtworks) {
    const audioText = `${art.title} by ${art.artist}, ${art.year}. ${art.medium}. ${art.description}`;
    insertArt.run({
      ...art,
      audioText
    }, defaultRoomId, defaultArtistId);
  }
}

// Add the hall-layout column to existing databases created before hall layouts.
// A room's hall layout is the ARCHITECTURE of the whole hall (wall configuration,
// baffle partitions, pillar islands, circulation, lighting) — it supersedes the
// legacy artwork hanging layouts.
try {
  db.prepare("ALTER TABLE rooms ADD COLUMN hall_layout TEXT NOT NULL DEFAULT 'classic'").run();
} catch (e) {
  // Column already exists
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
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'artwork-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => cb(null, IMAGE_MIME_TYPES.has(file.mimetype)),
});

// Helper function to upload image file to Vercel Blob (or fallback to local /uploads URL)
async function uploadImageToBlobOrLocal(file) {
  if (!file) return null;
  let imageUrl = `/uploads/${file.filename}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token || isVercel) {
    try {
      const fileBuffer = fs.readFileSync(file.path);
      const options = {
        access: 'public',
        contentType: file.mimetype || 'image/jpeg',
      };
      if (token) options.token = token;

      const blob = await put(file.filename, fileBuffer, options);
      if (blob && blob.url) {
        imageUrl = blob.url;
        try { fs.unlinkSync(file.path); } catch { /* ignore */ }
      }
    } catch (blobErr) {
      console.warn('⚠️ Vercel Blob notice (falling back to local URL):', blobErr.message);
    }
  }

  return imageUrl;
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
backupDatabase();
setInterval(backupDatabase, 6 * 60 * 60 * 1000).unref(); // every 6 hours

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
app.get('/api/artists', (req, res) => {
  try {
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
app.get('/api/rooms', (req, res) => {
  try {
    const rooms = db.prepare(`
      SELECT rooms.*, artists.name as artist_name, artists.slug as artist_slug
      FROM rooms
      JOIN artists ON rooms.artist_id = artists.id
      ORDER BY rooms.title ASC
    `).all();
    res.json(rooms);
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
    const arts = db.prepare('SELECT image_url FROM artworks WHERE room_id = ?').all(id);
    for (const art of arts) {
      if (art.image_url && art.image_url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, 'public', art.image_url);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
        }
      }
    }

    // Artworks cascade via foreign keys
    db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artworks - Get artworks (optional ?roomId= filter)
app.get('/api/artworks', (req, res) => {
  try {
    const { roomId } = req.query;
    let query = 'SELECT * FROM artworks';
    let params = [];
    if (roomId) {
      query += ' WHERE room_id = ?';
      params.push(roomId);
    }
    query += ' ORDER BY created_at ASC';
    const rows = db.prepare(query).all(...params);

    const IN = 0.0254; // imperial inches -> metric meters
    const artworks = rows.map((art) => ({
      id: art.id,
      roomId: art.room_id,
      artistId: art.artist_id,
      title: art.title,
      artist: art.artist,
      year: art.year,
      medium: art.medium,
      description: art.description,
      audioText: art.audio_text,
      imageUrl: art.image_url,
      widthIn: art.width_in,
      heightIn: art.height_in,
      width: art.width_in * IN,
      height: art.height_in * IN,
      wallId: art.wall_id,
      position: [art.pos_x, art.pos_y, art.pos_z],
      rotation: [0, art.rot_y, 0]
    }));

    res.json(artworks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/artworks/upload - Upload new artwork image + metadata
app.post('/api/artworks/upload', writeLimiter, requireAdmin, upload.single('image'), async (req, res) => {
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

    // Determine dimensions (fallback to image aspect ratio if widthIn/heightIn missing)
    let finalWidthIn = parseFloat(widthIn);
    let finalHeightIn = parseFloat(heightIn);

    if (isNaN(finalWidthIn) || isNaN(finalHeightIn) || finalWidthIn <= 0 || finalHeightIn <= 0) {
      try {
        const dimensions = sizeOf(req.file.path);
        const aspect = dimensions.width / dimensions.height;
        finalHeightIn = 40; // Default height 40 inches
        finalWidthIn = Math.round(40 * aspect);
      } catch (e) {
        finalWidthIn = 48;
        finalHeightIn = 36;
      }
    }

    // Calculate wall position coordinates (use custom values if supplied, otherwise calculate wall slot)
    let wall = wallId || 'back';
    const posYExplicit = req.body.posY !== undefined && !isNaN(parseFloat(req.body.posY));
    let posY = posYExplicit ? parseFloat(req.body.posY) : 1.55;
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
    const imageUrl = (await uploadImageToBlobOrLocal(req.file)) || `/uploads/${req.file.filename}`;
    const audioText = `${title} by ${artist}${year ? `, ${year}` : ''}. ${medium ? `${medium}. ` : ''}${description || ''}`;

    db.prepare(`
      INSERT INTO artworks (id, room_id, artist_id, title, artist, year, medium, description, audio_text, image_url, width_in, height_in, wall_id, pos_x, pos_y, pos_z, rot_y)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      imageUrl,
      finalWidthIn,
      finalHeightIn,
      wall,
      posX,
      posY,
      posZ,
      rotY
    );

    const newArt = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
    const IN = 0.0254;
    res.status(201).json({
      ...newArt,
      roomId: newArt.room_id,
      artistId: newArt.artist_id,
      audioText: newArt.audio_text,
      imageUrl: newArt.image_url,
      widthIn: newArt.width_in,
      heightIn: newArt.height_in,
      width: newArt.width_in * IN,
      height: newArt.height_in * IN,
      wallId: newArt.wall_id,
      position: [newArt.pos_x, newArt.pos_y, newArt.pos_z],
      rotation: [0, newArt.rot_y, 0]
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/artworks/:id - Update or Upsert an existing artwork metadata and optional replacement image
app.put('/api/artworks/:id', writeLimiter, requireAdmin, upload.single('image'), async (req, res) => {
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

    let imageUrl = existing ? existing.image_url : '/artworks/starry-horizon.jpg';

    // If new image file is uploaded, update imageUrl and delete old file if in /uploads/
    if (req.file) {
      if (existing && existing.image_url && existing.image_url.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, 'public', existing.image_url);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
        }
      }
      imageUrl = (await uploadImageToBlobOrLocal(req.file)) || `/uploads/${req.file.filename}`;

      // Recalculate dimensions from new image aspect ratio if width/height not explicitly supplied
      if (isNaN(parseFloat(widthIn)) || isNaN(parseFloat(heightIn))) {
        try {
          const dimensions = sizeOf(req.file.path);
          const aspect = dimensions.width / dimensions.height;
          finalHeightIn = 40;
          finalWidthIn = Math.round(40 * aspect);
        } catch (e) {
          /* keep previous */
        }
      }
    }

    // Calculate wall position coordinates (use custom values if supplied, otherwise calculate wall slot)
    const posYExplicit = req.body.posY !== undefined && !isNaN(parseFloat(req.body.posY));
    let posY = posYExplicit ? parseFloat(req.body.posY) : (existing ? existing.pos_y : 1.55);
    let posX = req.body.posX !== undefined && !isNaN(parseFloat(req.body.posX)) ? parseFloat(req.body.posX) : null;
    let posZ = req.body.posZ !== undefined && !isNaN(parseFloat(req.body.posZ)) ? parseFloat(req.body.posZ) : null;
    let rotY = req.body.rotY !== undefined && !isNaN(parseFloat(req.body.rotY)) ? parseFloat(req.body.rotY) : null;

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
        INSERT INTO artworks (id, room_id, artist_id, title, artist, year, medium, description, audio_text, image_url, width_in, height_in, wall_id, pos_x, pos_y, pos_z, rot_y)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, newRoomId, newArtistId, newTitle, newArtist, newYear, newMedium, newDesc, audioText, imageUrl, finalWidthIn, finalHeightIn, newWallId, posX, posY, posZ, rotY
      );
    } else {
      db.prepare(`
        UPDATE artworks 
        SET room_id = ?, artist_id = ?, title = ?, artist = ?, year = ?, medium = ?, description = ?, audio_text = ?, image_url = ?, width_in = ?, height_in = ?, wall_id = ?, pos_x = ?, pos_y = ?, pos_z = ?, rot_y = ?
        WHERE id = ?
      `).run(
        newRoomId, newArtistId, newTitle, newArtist, newYear, newMedium, newDesc, audioText, imageUrl, finalWidthIn, finalHeightIn, newWallId, posX, posY, posZ, rotY, id
      );
    }

    const updated = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
    const IN = 0.0254;
    res.json({
      ...updated,
      roomId: updated.room_id,
      artistId: updated.artist_id,
      audioText: updated.audio_text,
      imageUrl: updated.image_url,
      widthIn: updated.width_in,
      heightIn: updated.height_in,
      width: updated.width_in * IN,
      height: updated.height_in * IN,
      wallId: updated.wall_id,
      position: [updated.pos_x, updated.pos_y, updated.pos_z],
      rotation: [0, updated.rot_y, 0]
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/artworks/:id - Delete an artwork
app.delete('/api/artworks/:id', writeLimiter, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const art = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
    if (!art) return res.status(404).json({ error: 'Artwork not found' });

    // Delete image file if it is in /uploads/
    if (art.image_url && art.image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, 'public', art.image_url);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
    }

    db.prepare('DELETE FROM artworks WHERE id = ?').run(id);
    res.json({ success: true, id });
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
