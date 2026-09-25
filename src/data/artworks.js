import { IN, ART_HANG_CENTER } from '../constants.js';
import { sanityClient } from '../lib/sanity.js';
import { fetchSanityArtworks } from '../utils/sanityArtworks.js';

// Seed catalogue — the single source for the SQLite seed (server.js) and the
// client's offline fallback when the API is unreachable.
export const seedArtworks = [
  {
    id: 'starry-horizon',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'The Starry Horizon',
    artist: 'Evelyn Vane',
    year: '2024',
    medium: 'Acrylic on Canvas',
    description: 'An expressive landscape capturing the ethereal boundary where a neon twilight meets a starlit mountain range.',
    audioText: 'The Starry Horizon by Evelyn Vane, 2024. Acrylic on Canvas. An expressive landscape capturing the ethereal boundary where a neon twilight meets a starlit mountain range.',
    imageUrl: '/artworks/starry-horizon.jpg',
    imageUrlSm: null,
    wallId: 'back',
    position: [-6.75, ART_HANG_CENTER, -9.8],
    rotation: [0, 0, 0],
    widthIn: 48,
    heightIn: 36,
  },
  {
    id: 'echoes-silence',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Echoes of Silence',
    artist: 'Marcus Thorne',
    year: '2023',
    medium: 'Oil on Canvas',
    description: 'A minimalist monochromatic abstract piece representing quiet solitude. The subtle textures on heavy impasto canvas invite close inspection.',
    audioText: 'Echoes of Silence by Marcus Thorne, 2023. Oil on Canvas. A minimalist monochromatic abstract piece representing quiet solitude.',
    imageUrl: '/artworks/echoes-silence.jpg',
    imageUrlSm: null,
    wallId: 'back',
    position: [-2.25, ART_HANG_CENTER, -9.8],
    rotation: [0, 0, 0],
    widthIn: 40,
    heightIn: 40,
  },
  {
    id: 'golden-symphony',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Golden Symphony',
    artist: 'Clara Dupont',
    year: '2025',
    medium: 'Mixed Media & Gold Leaf',
    description: 'A vibrant abstract composition combining gold leaf sheets with warm-toned oils suggesting musical flow.',
    audioText: 'Golden Symphony by Clara Dupont, 2025. Mixed Media & Gold Leaf. A vibrant abstract composition combining gold leaf sheets with warm-toned oils suggesting musical flow.',
    imageUrl: '/artworks/golden-symphony.jpg',
    imageUrlSm: null,
    wallId: 'back',
    position: [2.25, ART_HANG_CENTER, -9.8],
    rotation: [0, 0, 0],
    widthIn: 36,
    heightIn: 48,
  },
  {
    id: 'neon-prism',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Prism of Neon & Gold',
    artist: 'Lucas Vance',
    year: '2025',
    medium: 'Oil & Metallic Foil on Canvas',
    description: 'A geometric composition exploring light refraction through crystal structures.',
    audioText: 'Prism of Neon & Gold by Lucas Vance, 2025. Oil & Metallic Foil on Canvas. A geometric composition exploring light refraction through crystal structures.',
    imageUrl: '/artworks/starry-horizon.jpg',
    imageUrlSm: null,
    wallId: 'back',
    position: [6.75, ART_HANG_CENTER, -9.8],
    rotation: [0, 0, 0],
    widthIn: 48,
    heightIn: 36,
  },
  {
    id: 'solitude',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Solitude in Blue',
    artist: 'Elena Rostova',
    year: '2022',
    medium: 'Oil on Canvas',
    description: 'A wide-format watercolor depicting a solitary lighthouse shrouded in deep oceanic blue mist.',
    audioText: 'Solitude in Blue by Elena Rostova, 2022. Oil on Canvas. A wide-format watercolor depicting a solitary lighthouse shrouded in deep oceanic blue mist.',
    imageUrl: '/uploads/artwork-1787739512930-915991544.jpeg',
    imageUrlSm: null,
    wallId: 'left',
    position: [-9.8, ART_HANG_CENTER, 2.25],
    rotation: [0, Math.PI / 2, 0],
    widthIn: 24,
    heightIn: 30,
  },
  {
    id: 'velocity-light',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Velocity of Light',
    artist: 'Kenji Sato',
    year: '2024',
    medium: 'Digital Painting on Archival Canvas',
    description: 'An energetic abstract painting depicting light rays bending in hyper-speed with neon strokes.',
    audioText: 'Velocity of Light by Kenji Sato, 2024. Digital Painting on Archival Canvas. An energetic abstract painting depicting light rays bending in hyper-speed.',
    imageUrl: '/artworks/velocity-light.jpg',
    imageUrlSm: null,
    wallId: 'left',
    position: [-9.8, ART_HANG_CENTER, -2.25],
    rotation: [0, Math.PI / 2, 0],
    widthIn: 36,
    heightIn: 48,
  },
  {
    id: 'crimson-mirage',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Crimson Mirage',
    artist: 'Amina Al-Mansoor',
    year: '2023',
    medium: 'Acrylic on Linen',
    description: 'An evocative representation of desert heatwaves with swirling vermillion and crimson tones.',
    audioText: 'Crimson Mirage by Amina Al-Mansoor, 2023. Acrylic on Linen. An evocative representation of desert heatwaves with swirling vermillion and crimson tones.',
    imageUrl: '/artworks/crimson-mirage.jpg',
    imageUrlSm: null,
    wallId: 'right',
    position: [9.8, ART_HANG_CENTER, -2.25],
    rotation: [0, -Math.PI / 2, 0],
    widthIn: 56,
    heightIn: 42,
  },
  {
    id: 'whispering-winds',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Whispering Winds',
    artist: 'Oliver Green',
    year: '2024',
    medium: 'Gouache on Paper',
    description: 'A stylized botanical abstract showcasing large Monstera leaves blowing in the wind.',
    audioText: 'Whispering Winds by Oliver Green, 2024. Gouache on Paper. A stylized botanical abstract showcasing large Monstera leaves blowing in the wind.',
    imageUrl: '/artworks/whispering-winds.jpg',
    imageUrlSm: null,
    wallId: 'left',
    position: [-9.8, ART_HANG_CENTER, -6.75],
    rotation: [0, Math.PI / 2, 0],
    widthIn: 44,
    heightIn: 44,
  },
  {
    id: 'monolith-shadow',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Monolith Shadow',
    artist: 'Diana Vance',
    year: '2025',
    medium: 'Oil on Wood Panel',
    description: 'An architectural study of light and geometry with a singular tall dark structure.',
    audioText: 'Monolith Shadow by Diana Vance, 2025. Oil on Wood Panel. An architectural study of light and geometry with a singular tall dark structure.',
    imageUrl: '/artworks/monolith-shadow.jpg',
    imageUrlSm: null,
    wallId: 'partition_front',
    position: [-2, ART_HANG_CENTER, 2.2],
    rotation: [0, 0, 0],
    widthIn: 36,
    heightIn: 48,
  },
  {
    id: 'uploaded-4',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Shakti — The Divine Trinity',
    artist: 'Traditional Fine Art',
    year: '2024',
    medium: 'Acrylic & Gold Leaf on Canvas',
    description: 'A breathtaking spiritual masterpiece portraying the divine faces of Shakti adorned with third-eye chakra iconography and sacred Sanskrit script.',
    audioText: 'Shaktti by Curator Upload, 2025. Curator Collection. Uploaded artwork collection piece.',
    imageUrl: '/uploads/artwork-1787539762094-366166360.jpg',
    imageUrlSm: null,
    wallId: 'partition_back',
    position: [0, ART_HANG_CENTER, 1.8],
    rotation: [0, Math.PI, 0],
    widthIn: 116,
    heightIn: 66,
  },
  {
    id: 'uploaded-7',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Mount Kailash at Sunset',
    artist: 'C. B. Thapa',
    year: '2023',
    medium: 'Impasto Oil on Canvas',
    description: 'A majestic impasto oil painting capturing the sacred golden glow of Mount Kailash during evening twilight.',
    audioText: 'Mount Kailash at Sunset by C. B. Thapa, 2023. Impasto Oil on Canvas. A majestic impasto oil painting capturing the sacred golden glow of Mount Kailash during evening twilight.',
    imageUrl: '/uploads/artwork-1787542144388-539661655.jpeg',
    imageUrlSm: null,
    wallId: 'right',
    position: [9.8, ART_HANG_CENTER, -6.75],
    rotation: [0, -Math.PI / 2, 0],
    widthIn: 30,
    heightIn: 23,
  },
  {
    id: 'uploaded-8',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Serenity of the Buddha',
    artist: 'Mangol Sutra',
    year: '2024',
    medium: 'Oil & Gold Pigment on Canvas',
    description: 'A serene portrait of Lord Buddha under the sacred Bodhi tree draped with vibrant Himalayan prayer flags.',
    audioText: 'Uploaded Artwork #9 by Curator Upload, 2025. Curator Collection. Uploaded artwork collection piece.',
    imageUrl: '/uploads/artwork-1787547300488-990205731.jpg',
    imageUrlSm: null,
    wallId: 'right',
    position: [9.8, ART_HANG_CENTER, 2.25],
    rotation: [0, -Math.PI / 2, 0],
    widthIn: 41,
    heightIn: 56,
  },
  {
    id: 'uploaded-9',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Tranquil Wisdom — Blue & Gold Buddha',
    artist: 'Modern Fine Art',
    year: '2025',
    medium: 'Textured Mixed Media on Black Canvas',
    description: 'A striking contemporary fine-art depiction of the Meditating Buddha featuring textured gold leaf finishes, vibrant blue Ushnisha, and ritual tika pigments.',
    audioText: 'Tranquil Wisdom — Blue & Gold Buddha by Modern Fine Art, 2025. Textured Mixed Media on Black Canvas. A striking contemporary fine-art depiction of the Meditating Buddha featuring textured gold leaf finishes, vibrant blue Ushnisha, and ritual tika pigments.',
    imageUrl: '/uploads/artwork-1787569990070-721523387.jpeg',
    imageUrlSm: null,
    wallId: 'right',
    position: [9.8, ART_HANG_CENTER, 6.75],
    rotation: [0, -Math.PI / 2, 0],
    widthIn: 15,
    heightIn: 22,
  },
  {
    id: 'uploaded-10',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Heritage Gateway — Golden Courtyard',
    artist: 'A. Thanmani',
    year: '2024',
    medium: 'Palette Knife Oil on Canvas',
    description: 'An expressive impressionistic palette knife painting capturing an ancient heritage courtyard gateway bathed in warm golden light.',
    audioText: 'Uploaded Artwork #11 by Curator Upload, 2025. Curator Collection. Uploaded artwork collection piece.',
    imageUrl: '/uploads/artwork-1787574838038-20891506.jpg',
    imageUrlSm: null,
    wallId: 'partition_front',
    position: [2, ART_HANG_CENTER, 2.2],
    rotation: [0, 0, 0],
    widthIn: 25,
    heightIn: 58,
  },
  {
    id: 'artwork-1790262470466',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: 'Preserve the Nature',
    artist: 'Asha Dangol',
    year: '2025',
    medium: 'Acrylic on Canvas',
    description: 'An evocative masterpiece exploring harmony between ecology and humanity by Asha Dangol.',
    audioText: 'Preserve the Nature by Asha Dangol, 2025. Acrylic on Canvas.',
    imageUrl: '/uploads/artwork-1790262499140-775908889.webp',
    imageUrlSm: '/uploads/artwork-1790262499140-775908889-sm.webp',
    wallId: 'partition_front',
    position: [0, 1.8, 2.2],
    rotation: [0, 0, 0],
    widthIn: 48,
    heightIn: 84,
  },
];

export const fallbackArtworks = seedArtworks.map((art) => ({
  ...art,
  width: art.widthIn * IN,
  height: art.heightIn * IN,
}));

// Persistent curator artwork overrides key for zero-latency instant updates
const OVERRIDES_STORAGE_KEY = 'shakya_curator_artworks_v3';

export function getLocalArtworkOverrides() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveLocalArtworkOverride(art) {
  if (typeof window === 'undefined' || !art || !art.id) return;
  try {
    const map = getLocalArtworkOverrides();
    map[art.id] = {
      ...art,
      updatedAt: Date.now(),
    };
    if (art.sanityId) {
      map[art.sanityId] = map[art.id];
    }
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Could not save local artwork override:', e);
  }
}

export function removeLocalArtworkOverride(id) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const map = getLocalArtworkOverrides();
    delete map[id];
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Could not remove local artwork override:', e);
  }
}

export function clearLocalArtworkOverrides() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OVERRIDES_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear local artwork overrides:', e);
  }
}

/**
 * Fetch artworks from Sanity Content Lake, merged with instant curator overrides
 * and falling back to Express REST API / static catalogue.
 */
export async function fetchArtworksAPI(roomId = null) {
  let list = [];

  // 1. Try querying Sanity Content Lake directly
  try {
    const sanityArtworks = await fetchSanityArtworks();
    if (Array.isArray(sanityArtworks) && sanityArtworks.length > 0) {
      list = sanityArtworks;
    }
  } catch (sanityErr) {
    console.warn('Direct Sanity query failed, falling back to API:', sanityErr);
  }

  // 2. Fallback to Express REST API
  if (list.length === 0) {
    try {
      const base = roomId ? `/api/artworks?roomId=${encodeURIComponent(roomId)}` : '/api/artworks';
      const sep = base.includes('?') ? '&' : '?';
      const url = `${base}${sep}_t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          list = data;
        }
      }
    } catch (err) {
      console.warn('Could not reach backend API, using fallback local static artworks:', err);
    }
  }

  if (list.length === 0) {
    list = fallbackArtworks;
  }

  // 3. Overlay any active curator overrides (instant local changes before CDN purges)
  const overrides = getLocalArtworkOverrides();
  const overriddenIds = new Set();

  let merged = list.map((art) => {
    const override = overrides[art.id] || overrides[art.sanityId];
    if (override) {
      overriddenIds.add(art.id);
      if (art.sanityId) overriddenIds.add(art.sanityId);
      const wIn = override.widthIn !== undefined ? parseFloat(override.widthIn) : art.widthIn;
      const hIn = override.heightIn !== undefined ? parseFloat(override.heightIn) : art.heightIn;
      return {
        ...art,
        ...override,
        position: override.position || art.position,
        rotation: override.rotation || art.rotation,
        wallId: override.wallId || art.wallId,
        widthIn: wIn,
        heightIn: hIn,
        width: wIn * IN,
        height: hIn * IN,
        roomId: override.roomId || art.roomId,
      };
    }
    return art;
  });

  // 4. Also include any locally created artworks that aren't in Sanity yet
  Object.values(overrides).forEach((ov) => {
    if (!overriddenIds.has(ov.id) && ov.title) {
      overriddenIds.add(ov.id);
      const wIn = parseFloat(ov.widthIn) || 48;
      const hIn = parseFloat(ov.heightIn) || 36;
      merged.push({
        ...ov,
        widthIn: wIn,
        heightIn: hIn,
        width: wIn * IN,
        height: hIn * IN,
      });
    }
  });

  // 5. Filter by requested exhibition room
  if (roomId) {
    return merged.filter((a) => !a.roomId || a.roomId === roomId);
  }

  return merged;
}

/**
 * Fetch list of rooms from Express REST API with dynamic Sanity gallery wing discovery
 */
export async function fetchRoomsAPI() {
  const roomMap = new Map();

  // 1. Try fetching configured rooms from backend API
  try {
    const res = await fetch(`/api/rooms?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const dbRooms = await res.json();
      if (Array.isArray(dbRooms)) {
        dbRooms.forEach((r) => roomMap.set(r.id, r));
      }
    }
  } catch (err) {
    console.warn('Could not fetch rooms from API:', err);
  }

  // 2. Ensure main default gallery exists
  if (!roomMap.has('room-main')) {
    roomMap.set('room-main', {
      id: 'room-main',
      title: 'Main Permanent Exhibition',
      artist_name: 'Shakya Gallery Masters',
      hall_layout: 'classic',
    });
  }

  // 3. Scan Sanity artworks to see if any artworks are assigned to secondary wings
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
  } catch (sanityErr) {
    // ignore
  }

  return Array.from(roomMap.values());
}

/**
 * Fetch list of artists from Sanity Content Lake with fallback to Express REST API
 */
export async function fetchArtistsAPI() {
  // 1. Try Sanity Content Lake
  try {
    const artists = await sanityClient.fetch(
      `*[_type == "artist"] | order(name asc) { "id": _id, name, bio, "slug": slug.current }`
    );
    if (Array.isArray(artists) && artists.length > 0) {
      return artists;
    }
  } catch (sanityErr) {
    console.warn('Could not fetch artists from Sanity, trying API:', sanityErr);
  }

  // 2. Fallback to Express REST API
  try {
    const res = await fetch(`/api/artists?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch artists from API:', err);
    return [{ id: 'artist-group', name: 'Shakya Gallery Masters' }];
  }
}
