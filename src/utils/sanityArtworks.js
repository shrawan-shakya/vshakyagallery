import { sanityClient, urlFor } from '../lib/sanity.js';
import { IN, ART_HANG_CENTER, ARTWORK_SCALE } from '../constants.js';

// Predefined balanced wall spots for Classic Center Hall architecture (27 total spots)
export const HALL_SLOTS = [
  // Center partition front (entrance focal points) - 3 spots
  { wallId: 'partition_front', position: [0, 1.8, 2.2], rotation: [0, 0, 0] },
  { wallId: 'partition_front', position: [-2.2, 1.8, 2.2], rotation: [0, 0, 0] },
  { wallId: 'partition_front', position: [2.2, 1.8, 2.2], rotation: [0, 0, 0] },

  // Center partition back - 3 spots
  { wallId: 'partition_back', position: [0, 1.8, 1.8], rotation: [0, Math.PI, 0] },
  { wallId: 'partition_back', position: [-2.2, 1.8, 1.8], rotation: [0, Math.PI, 0] },
  { wallId: 'partition_back', position: [2.2, 1.8, 1.8], rotation: [0, Math.PI, 0] },

  // Back wall (grand focal wall) - 7 spots
  { wallId: 'back', position: [0, 1.8, -9.8], rotation: [0, 0, 0] },
  { wallId: 'back', position: [-2.25, 1.8, -9.8], rotation: [0, 0, 0] },
  { wallId: 'back', position: [2.25, 1.8, -9.8], rotation: [0, 0, 0] },
  { wallId: 'back', position: [-4.5, 1.8, -9.8], rotation: [0, 0, 0] },
  { wallId: 'back', position: [4.5, 1.8, -9.8], rotation: [0, 0, 0] },
  { wallId: 'back', position: [-6.75, 1.8, -9.8], rotation: [0, 0, 0] },
  { wallId: 'back', position: [6.75, 1.8, -9.8], rotation: [0, 0, 0] },

  // Left wall - 7 spots
  { wallId: 'left', position: [-9.8, 1.8, 0], rotation: [0, Math.PI / 2, 0] },
  { wallId: 'left', position: [-9.8, 1.8, -2.25], rotation: [0, Math.PI / 2, 0] },
  { wallId: 'left', position: [-9.8, 1.8, 2.25], rotation: [0, Math.PI / 2, 0] },
  { wallId: 'left', position: [-9.8, 1.8, -4.5], rotation: [0, Math.PI / 2, 0] },
  { wallId: 'left', position: [-9.8, 1.8, 4.5], rotation: [0, Math.PI / 2, 0] },
  { wallId: 'left', position: [-9.8, 1.8, -6.75], rotation: [0, Math.PI / 2, 0] },
  { wallId: 'left', position: [-9.8, 1.8, 6.75], rotation: [0, Math.PI / 2, 0] },

  // Right wall - 7 spots
  { wallId: 'right', position: [9.8, 1.8, 0], rotation: [0, -Math.PI / 2, 0] },
  { wallId: 'right', position: [9.8, 1.8, -2.25], rotation: [0, -Math.PI / 2, 0] },
  { wallId: 'right', position: [9.8, 1.8, 2.25], rotation: [0, -Math.PI / 2, 0] },
  { wallId: 'right', position: [9.8, 1.8, -4.5], rotation: [0, -Math.PI / 2, 0] },
  { wallId: 'right', position: [9.8, 1.8, 4.5], rotation: [0, -Math.PI / 2, 0] },
  { wallId: 'right', position: [9.8, 1.8, -6.75], rotation: [0, -Math.PI / 2, 0] },
  { wallId: 'right', position: [9.8, 1.8, 6.75], rotation: [0, -Math.PI / 2, 0] },
];

/**
 * Robust dimension string parser.
 * Supports: "61 W x 74 H x 0.1 D cm", "38 W x 56 H x 0.1 cm", "28 W X 38 H CM", "58 H x 25 W CM", etc.
 */
export function parseDimensions(dimStr, imgDimensions) {
  let widthIn = null;
  let heightIn = null;

  if (dimStr && typeof dimStr === 'string') {
    const s = dimStr.toUpperCase();
    const isCm = s.includes('CM');
    const isInch = s.includes('IN') || s.includes('"');

    // Extract W / L
    const wMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:W|L)\b/) || s.match(/(?:W|L)\s*[:=xX]?\s*(\d+(?:\.\d+)?)/);
    // Extract H
    const hMatch = s.match(/(\d+(?:\.\d+)?)\s*H\b/) || s.match(/H\s*[:=xX]?\s*(\d+(?:\.\d+)?)/);

    if (wMatch && hMatch) {
      const rawW = parseFloat(wMatch[1] || wMatch[2]);
      const rawH = parseFloat(hMatch[1] || hMatch[2]);

      // If unit is cm or values look like centimeters (> 25)
      if (isCm || (!isInch && (rawW > 25 || rawH > 25))) {
        widthIn = Math.round(rawW / 2.54);
        heightIn = Math.round(rawH / 2.54);
      } else {
        widthIn = Math.round(rawW);
        heightIn = Math.round(rawH);
      }
    }
  }

  // Fallback to image aspect ratio if text parsing didn't find both numbers
  if (!widthIn || !heightIn || isNaN(widthIn) || isNaN(heightIn)) {
    const imgW = imgDimensions?.width;
    const imgH = imgDimensions?.height;
    if (imgW && imgH) {
      const aspect = imgW / imgH;
      heightIn = 36;
      widthIn = Math.round(36 * aspect);
    } else {
      widthIn = 48;
      heightIn = 36;
    }
  }

  return { widthIn: Math.max(4, widthIn), heightIn: Math.max(4, heightIn) };
}

/**
 * Extracts plain text from Sanity Portable Text block arrays
 */
export function blocksToPlainText(blocks = []) {
  if (typeof blocks === 'string') return blocks;
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map((block) => {
      if (block._type !== 'block' || !block.children) return '';
      return block.children.map((child) => child.text).join('');
    })
    .filter(Boolean)
    .join('\n\n');
}

export function toProxyUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Transforms a Sanity artwork document into the 3D gallery artwork specification
 */
export function mapSanityArtworkTo3D(doc, slotIndex = 0) {
  // If explicitly vaulted / unhung from the 3D exhibition, skip rendering
  if (doc.virtualGallery?.showIn3D === false || doc.virtualGallery?.unhung === true) {
    return null;
  }

  // Check if curator specified an explicit dimension override in virtualGallery
  let finalWidthIn = doc.virtualGallery?.widthIn;
  let finalHeightIn = doc.virtualGallery?.heightIn;

  if (!finalWidthIn || !finalHeightIn || isNaN(finalWidthIn) || isNaN(finalHeightIn)) {
    const imgMeta = doc.mainImage?.asset?.metadata?.dimensions;
    const parsed = parseDimensions(doc.dimensions, imgMeta);
    finalWidthIn = parsed.widthIn;
    finalHeightIn = parsed.heightIn;
  }

  // Determine wall placement: custom virtualGallery override if set, else assign next slot
  const slot = HALL_SLOTS[slotIndex % HALL_SLOTS.length];
  const wallId = doc.virtualGallery?.wallId || slot.wallId;
  const position = doc.virtualGallery?.position
    ? [doc.virtualGallery.position.x, doc.virtualGallery.position.y || ART_HANG_CENTER, doc.virtualGallery.position.z]
    : slot.position;
  const rotation = doc.virtualGallery?.rotationY !== undefined
    ? [0, doc.virtualGallery.rotationY, 0]
    : slot.rotation;

  // High-performance WebP URLs from Sanity CDN routed through image proxy for universal WebGL CORS compatibility
  const rawUrl = doc.mainImage?.asset?.url || '';
  const cdnUrl = doc.mainImage ? urlFor(doc.mainImage).width(2048).auto('format').quality(85).url() : rawUrl;
  const cdnUrlSm = doc.mainImage ? urlFor(doc.mainImage).width(1024).auto('format').quality(80).url() : cdnUrl;

  const imageUrl = toProxyUrl(cdnUrl);
  const imageUrlSm = toProxyUrl(cdnUrlSm);

  const artistName = doc.artistName || doc.artist?.name || 'Featured Master';
  const yearText = doc.year || 'Contemporary';
  const mediumText = doc.material || 'Fine Art';
  const priceDisplay = doc.price ? `$${Number(doc.price).toLocaleString()}` : (doc.startingPrice ? `From $${Number(doc.startingPrice).toLocaleString()}` : 'Price on Request');

  const storyText = blocksToPlainText(doc.description);
  const fullDescription = storyText || `${doc.title} by ${artistName}. ${mediumText}, ${yearText}. ${priceDisplay}.`;
  const audioText = `${doc.title} by ${artistName}, ${yearText}. ${mediumText}. ${storyText || ''}`;

  const assignedRoomId = doc.virtualGallery?.roomId || (slotIndex < HALL_SLOTS.length ? 'room-main' : `room-wing-${Math.floor(slotIndex / HALL_SLOTS.length) + 1}`);

  return {
    id: doc._id,
    sanityId: doc._id,
    sku: doc.sku || '',
    roomId: assignedRoomId,
    artistId: doc.artist?._id || 'artist-group',
    title: doc.title || 'Untitled Artwork',
    artist: artistName,
    year: yearText,
    medium: mediumText,
    description: fullDescription,
    audioText: audioText,
    imageUrl,
    imageUrlSm,
    widthIn: finalWidthIn,
    heightIn: finalHeightIn,
    width: finalWidthIn * IN,
    height: finalHeightIn * IN,
    wallId,
    position,
    rotation,
    price: doc.price,
    status: doc.status || 'available',
  };
}

export const SANITY_ARTWORKS_QUERY = `*[_type == "artwork" && (!defined(status) || status in ["available", "sold"]) && (!defined(virtualGallery.showIn3D) || virtualGallery.showIn3D != false) && (!defined(virtualGallery.unhung) || virtualGallery.unhung != true)] | order(_createdAt asc) {
  _id,
  title,
  slug,
  sku,
  price,
  startingPrice,
  status,
  dimensions,
  material,
  year,
  description,
  "artistName": artist->name,
  "artistBio": artist->bio,
  mainImage {
    asset-> {
      _id,
      url,
      metadata {
        dimensions
      }
    }
  },
  virtualGallery
}`;

/**
 * Fetch all artworks from Sanity Content Lake and map them to 3D gallery specifications
 */
export async function fetchSanityArtworks() {
  const docs = await sanityClient.fetch(SANITY_ARTWORKS_QUERY);
  if (!Array.isArray(docs) || docs.length === 0) {
    throw new Error('No artworks returned from Sanity');
  }
  return docs.map((doc, idx) => mapSanityArtworkTo3D(doc, idx)).filter(Boolean);
}
