import { IN, ART_HANG_CENTER } from '../constants';

const rawArtworks = [
  {
    id: "starry-horizon",
    title: "The Starry Horizon",
    artist: "Evelyn Vane",
    year: "2024",
    medium: "Acrylic on Canvas",
    description: "An expressive landscape capturing the ethereal boundary where a neon twilight meets a starlit mountain range.",
    imageUrl: "/artworks/starry-horizon.jpg",
    position: [-6.75, ART_HANG_CENTER, -9.8],
    rotation: [0, 0, 0],
    widthIn: 48,
    heightIn: 36,
    audioText: "You are looking at The Starry Horizon, painted by Evelyn Vane in 2024."
  },
  {
    id: "echoes-silence",
    title: "Echoes of Silence",
    artist: "Marcus Thorne",
    year: "2023",
    medium: "Oil on Canvas",
    description: "A minimalist monochromatic abstract piece representing quiet solitude.",
    imageUrl: "/artworks/echoes-silence.jpg",
    position: [-2.25, ART_HANG_CENTER, -9.8],
    rotation: [0, 0, 0],
    widthIn: 40,
    heightIn: 40,
    audioText: "This is Echoes of Silence, an oil on canvas painting by Marcus Thorne in 2023."
  },
  {
    id: "golden-symphony",
    title: "Golden Symphony",
    artist: "Clara Dupont",
    year: "2025",
    medium: "Mixed Media & Gold Leaf",
    description: "A vibrant abstract composition combining gold leaf sheets with warm-toned oils.",
    imageUrl: "/artworks/golden-symphony.jpg",
    position: [2.25, ART_HANG_CENTER, -9.8],
    rotation: [0, 0, 0],
    widthIn: 36,
    heightIn: 48,
    audioText: "Golden Symphony was created by Clara Dupont in 2025 using mixed media and gold leaf."
  },
  {
    id: "neon-prism",
    title: "Prism of Neon & Gold",
    artist: "Lucas Vance",
    year: "2025",
    medium: "Oil & Metallic Foil on Canvas",
    description: "A geometric composition exploring light refraction through crystal structures.",
    imageUrl: "/artworks/starry-horizon.jpg",
    position: [6.75, ART_HANG_CENTER, -9.8],
    rotation: [0, 0, 0],
    widthIn: 48,
    heightIn: 36,
    audioText: "Prism of Neon & Gold, created by Lucas Vance in 2025."
  },
  {
    id: "solitude",
    title: "Solitude in Blue",
    artist: "Elena Rostova",
    year: "2022",
    medium: "Watercolor & Ink",
    description: "A wide-format watercolor depicting a solitary lighthouse shrouded in deep oceanic blue mist.",
    imageUrl: "/artworks/solitude.jpg",
    position: [-9.8, ART_HANG_CENTER, -4],
    rotation: [0, Math.PI / 2, 0],
    widthIn: 63,
    heightIn: 36,
    audioText: "Solitude in Blue, painted by Elena Rostova in 2022 using watercolor and ink."
  },
  {
    id: "velocity-light",
    title: "Velocity of Light",
    artist: "Kenji Sato",
    year: "2024",
    medium: "Digital Painting on Archival Canvas",
    description: "An energetic abstract painting depicting light rays bending in hyper-speed.",
    imageUrl: "/artworks/velocity-light.jpg",
    position: [-9.8, ART_HANG_CENTER, 4],
    rotation: [0, Math.PI / 2, 0],
    widthIn: 36,
    heightIn: 48,
    audioText: "Velocity of Light is a 2024 digital painting by Kenji Sato."
  },
  {
    id: "crimson-mirage",
    title: "Crimson Mirage",
    artist: "Amina Al-Mansoor",
    year: "2023",
    medium: "Acrylic on Linen",
    description: "An evocative representation of desert heatwaves with swirling vermillion and crimson tones.",
    imageUrl: "/artworks/crimson-mirage.jpg",
    position: [9.8, ART_HANG_CENTER, -4],
    rotation: [0, -Math.PI / 2, 0],
    widthIn: 56,
    heightIn: 42,
    audioText: "This is Crimson Mirage by Amina Al-Mansoor, painted in 2023."
  },
  {
    id: "whispering-winds",
    title: "Whispering Winds",
    artist: "Oliver Green",
    year: "2024",
    medium: "Gouache on Paper",
    description: "A stylized botanical abstract showcasing large Monstera leaves blowing in the wind.",
    imageUrl: "/artworks/whispering-winds.jpg",
    position: [9.8, ART_HANG_CENTER, 4],
    rotation: [0, -Math.PI / 2, 0],
    widthIn: 44,
    heightIn: 44,
    audioText: "Whispering Winds is a gouache painting by Oliver Green in 2024."
  },
  {
    id: "monolith-shadow",
    title: "Monolith Shadow",
    artist: "Diana Vance",
    year: "2025",
    medium: "Oil on Wood Panel",
    description: "An architectural study of light and geometry with a singular tall dark structure.",
    imageUrl: "/artworks/monolith-shadow.jpg",
    position: [0, ART_HANG_CENTER, 1.80],
    rotation: [0, Math.PI, 0],
    widthIn: 36,
    heightIn: 48,
    audioText: "You are viewing Monolith Shadow, an oil painting on wood panel by Diana Vance in 2025."
  }
];

export const fallbackArtworks = rawArtworks.map(({ widthIn, heightIn, ...rest }) => ({
  ...rest,
  widthIn,
  heightIn,
  width: widthIn * IN,
  height: heightIn * IN,
}));

export const artworks = fallbackArtworks;

/**
 * Fetch artworks from Express REST API with fallback to static artworks
 */
export async function fetchArtworksAPI(roomId = null) {
  try {
    const url = roomId ? `/api/artworks?roomId=${encodeURIComponent(roomId)}` : '/api/artworks';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    const data = await res.json();
    // An empty array is a valid answer: the room is genuinely empty.
    // Fallback art is reserved for transport failures below.
    if (!data) return fallbackArtworks;
    return data;
  } catch (err) {
    console.warn("Could not reach backend API, using fallback local static artworks:", err);
    return fallbackArtworks;
  }
}

/**
 * Fetch list of rooms from Express REST API
 */
export async function fetchRoomsAPI() {
  try {
    const res = await fetch('/api/rooms');
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch rooms from API:", err);
    return [{ id: 'room-main', title: 'Main Permanent Exhibition', artist_name: 'Featured Contemporary Masters' }];
  }
}

/**
 * Fetch list of artists from Express REST API
 */
export async function fetchArtistsAPI() {
  try {
    const res = await fetch('/api/artists');
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch artists from API:", err);
    return [{ id: 'artist-group', name: 'Featured Contemporary Masters' }];
  }
}
