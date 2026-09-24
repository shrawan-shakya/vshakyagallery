// NOTE: explicit .js extension so this module also loads under Node ESM
// (server.js seeds the database from it) and not just the Vite bundler.
import { IN, ART_HANG_CENTER } from '../constants.js';

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
];

export const fallbackArtworks = seedArtworks.map((art) => ({
  ...art,
  width: art.widthIn * IN,
  height: art.heightIn * IN,
}));

// Client-side persistent cache key to prevent serverless split-brain / cold start resets
const OVERRIDES_STORAGE_KEY = 'shakya_curator_artworks_v1';

export function getLocalArtworkOverrides() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalArtworkOverride(artwork) {
  if (typeof window === 'undefined' || !artwork?.id) return;
  try {
    const overrides = getLocalArtworkOverrides();
    overrides[artwork.id] = {
      ...artwork,
      _savedAt: Date.now(),
    };
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.warn('Could not save artwork override to localStorage:', e);
  }
}

export function removeLocalArtworkOverride(artworkId) {
  if (typeof window === 'undefined' || !artworkId) return;
  try {
    const overrides = getLocalArtworkOverrides();
    delete overrides[artworkId];
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.warn('Could not remove artwork override from localStorage:', e);
  }
}

function mergeArtworkWithOverrides(serverArtworks, overrides, roomId) {
  const merged = serverArtworks.map((art) => {
    const override = overrides[art.id];
    if (override) {
      const widthIn = override.widthIn ?? art.widthIn;
      const heightIn = override.heightIn ?? art.heightIn;
      return {
        ...art,
        ...override,
        widthIn,
        heightIn,
        width: widthIn * IN,
        height: heightIn * IN,
        position: override.position || art.position,
        rotation: override.rotation || art.rotation,
        wallId: override.wallId || art.wallId,
      };
    }
    return art;
  });

  // Include any freshly uploaded artworks that may only be in local cache
  for (const [id, o] of Object.entries(overrides)) {
    if (!merged.some((a) => a.id === id) && (!roomId || o.roomId === roomId)) {
      const widthIn = o.widthIn || 48;
      const heightIn = o.heightIn || 36;
      merged.push({
        ...o,
        widthIn,
        heightIn,
        width: widthIn * IN,
        height: heightIn * IN,
      });
    }
  }

  return merged;
}

/**
 * Fetch artworks from Express REST API with fallback to static artworks,
 * layered with client-side overrides to guarantee consistent state across serverless containers.
 */
export async function fetchArtworksAPI(roomId = null) {
  const overrides = getLocalArtworkOverrides();
  try {
    const base = roomId ? `/api/artworks?roomId=${encodeURIComponent(roomId)}` : '/api/artworks';
    const sep = base.includes('?') ? '&' : '?';
    const url = `${base}${sep}_t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    const data = await res.json();
    if (!Array.isArray(data)) return mergeArtworkWithOverrides(fallbackArtworks, overrides, roomId);
    return mergeArtworkWithOverrides(data, overrides, roomId);
  } catch (err) {
    console.warn('Could not reach backend API, using fallback local static artworks:', err);
    return mergeArtworkWithOverrides(fallbackArtworks, overrides, roomId);
  }
}

/**
 * Fetch list of rooms from Express REST API
 */
export async function fetchRoomsAPI() {
  try {
    const res = await fetch(`/api/rooms?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch rooms from API:', err);
    return [{ id: 'room-main', title: 'Main Permanent Exhibition', artist_name: 'Featured Contemporary Masters' }];
  }
}

/**
 * Fetch list of artists from Express REST API
 */
export async function fetchArtistsAPI() {
  try {
    const res = await fetch(`/api/artists?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch artists from API:', err);
    return [{ id: 'artist-group', name: 'Featured Contemporary Masters' }];
  }
}
