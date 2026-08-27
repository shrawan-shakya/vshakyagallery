// NOTE: explicit .js extension so this shared module also loads under
// Node ESM (server.js) and not just the Vite client bundler.
import { ART_HANG_CENTER } from '../constants.js';

/**
 * Hall Layout Registry
 * --------------------
 * A "hall layout" is the architectural design of the entire gallery hall —
 * not just how artworks hang. Each preset defines:
 *
 *   - Wall configuration  : perimeter walls + internal partitions (baffle / T-walls)
 *   - Structural elements : wrapped grid pillars, central display islands
 *   - Circulation path    : how visitors are routed through the hall
 *   - Lighting placement  : primary / ambient / accent layers
 *
 * This module is pure data + math (no DOM, no JSX) so it can be imported
 * by BOTH the Vite client and the Express server (server.js) to drive
 * rendering, collision, artwork slotting, and the curator UI.
 *
 * SCALE CONTRACT: 1 unit = 1 meter. Room footprint 20x20 m, ceiling ROOM_H,
 * inner wall face at +/-9.9, entrance on the front wall (z = +10).
 */

// Shared perimeter display walls (identical in every hall layout)
const PERIMETER_WALLS = {
  back: {
    name: 'Back Wall',
    center: [0, ART_HANG_CENTER, -9.8],
    rotation: [0, 0, 0],
    spanMin: -7.5,
    spanMax: 7.5,
    axis: 'x',
  },
  left: {
    name: 'Left Wall',
    center: [-9.8, ART_HANG_CENTER, 0],
    rotation: [0, Math.PI / 2, 0],
    spanMin: -7.5,
    spanMax: 7.5,
    axis: 'z',
  },
  right: {
    name: 'Right Wall',
    center: [9.8, ART_HANG_CENTER, 0],
    rotation: [0, -Math.PI / 2, 0],
    spanMin: -7.5,
    spanMax: 7.5,
    axis: 'z',
  },
};

export const HALL_LAYOUTS = {
  // ------------------------------------------------------------------
  // CLASSIC — single freestanding center partition, open circulation
  // ------------------------------------------------------------------
  classic: {
    id: 'classic',
    name: 'Classic Center Hall',
    tagline: 'Open & Flexible',
    desc: 'A symmetric universal hall with one freestanding central partition. Suits group shows and flexible hangs where visitors roam freely.',
    wallConfiguration:
      'Continuous peripheral perimeter walls with a single freestanding double-sided center partition dividing the hall into a public forecourt and a quiet rear gallery.',
    circulation: 'Free two-way circulation around both ends of the central partition.',
    lighting: 'Ceiling tube rows for ambient light with a concentric perimeter track frame.',
    partitions: [
      // Freestanding center partition: 8 x 4 x 0.3, floating slab look
      { id: 'center', x: 0, z: 2, w: 8, h: 4, d: 0.3 },
    ],
    islands: [],
    colliders: [
      { minX: -4, maxX: 4, minZ: 1.85, maxZ: 2.15 },
    ],
    slotPlan: {
      back: [0, -2.25, 2.25, -6.75, 6.75],
      left: [0, -5.5, 5.5],
      right: [0, -5.5, 5.5],
      partition_front: [0, -2, 2],
      partition_back: [0, -2, 2],
    },
    walls: {
      ...PERIMETER_WALLS,
      partition_front: {
        name: 'Center Partition (Front)',
        center: [0, ART_HANG_CENTER, 2.2],
        rotation: [0, 0, 0],
        spanMin: -3.2,
        spanMax: 3.2,
        axis: 'x',
      },
      partition_back: {
        name: 'Center Partition (Back)',
        center: [0, ART_HANG_CENTER, 1.8],
        rotation: [0, Math.PI, 0],
        spanMin: -3.2,
        spanMax: 3.2,
        axis: 'x',
      },
    },
    lightingPlan: {
      tubeRows: [-5, 0, 5],
      tubeXs: [-2.9, 2.9],
      tubeLength: 4.5,
      trackStyle: 'frame', // concentric square frame at +/-8
      cove: false,
      accentSpots: [],
    },
  },

  // ------------------------------------------------------------------
  // THE CHRONOLOGICAL LOOP — structured, curated one-way circulation
  // ------------------------------------------------------------------
  loop: {
    id: 'loop',
    name: 'The Chronological Loop',
    tagline: 'Structured & Curated',
    desc: 'Designed for curated narrative exhibitions and historical retrospectives where directing circulation is essential to the viewer experience.',
    wallConfiguration:
      'Continuous peripheral perimeter walls with offset internal baffle partitions (T-walls) that create sub-galleries — "chapels" — guiding visitors in a single direction without feeling overly restrictive.',
    circulation:
      'One-way loop (linear progression) with a central open core reserved for large-scale sculpture or resting zones.',
    lighting:
      'Perimeter recessed track running parallel to the display walls angled 30 degrees to avoid glare and viewer shadows, concealed LED cove lighting bouncing off the upper soffits, and narrow-beam accent spots over the sculpture islands.',
    partitions: [
      // Baffle A — T-wall grown from the LEFT perimeter wall (sub-gallery 1)
      { id: 'baffle_a', x: -7.4, z: -4.5, w: 5, h: 4.6, d: 0.35 },
      // Baffle B — T-wall grown from the RIGHT perimeter wall (sub-gallery 2),
      // offset from A so the route weaves in a single direction
      { id: 'baffle_b', x: 7.4, z: 1.5, w: 5, h: 4.6, d: 0.35 },
    ],
    islands: [
      // Grid pillars wrapped as structural anchors for central display islands
      { id: 'island_l', x: -2.6, z: -1.2, size: 0.6 },
      { id: 'island_r', x: 2.6, z: -1.2, size: 0.6 },
    ],
    colliders: [
      { minX: -9.9, maxX: -4.9, minZ: -4.675, maxZ: -4.325 },
      { minX: 4.9, maxX: 9.9, minZ: 1.325, maxZ: 1.675 },
      { minX: -3.25, maxX: -1.95, minZ: -1.85, maxZ: -0.55 },
      { minX: 1.95, maxX: 3.25, minZ: -1.85, maxZ: -0.55 },
    ],
    slotPlan: {
      back: [0, -3.75, 3.75, -7, 7],
      left: [0, -5.5, 5.5],
      right: [0, -5.5, 5.5],
      baffle_a_front: [-7.4, -8.7, -6.1],
      baffle_a_back: [-7.4, -8.7, -6.1],
      baffle_b_front: [7.4, 8.7, 6.1],
      baffle_b_back: [7.4, 8.7, 6.1],
    },
    walls: {
      ...PERIMETER_WALLS,
      baffle_a_front: {
        name: 'Baffle A (Front Face)',
        center: [-7.4, ART_HANG_CENTER, -4.325],
        rotation: [0, 0, 0],
        spanMin: -9.3,
        spanMax: -5.5,
        axis: 'x',
      },
      baffle_a_back: {
        name: 'Baffle A (Rear Face)',
        center: [-7.4, ART_HANG_CENTER, -4.675],
        rotation: [0, Math.PI, 0],
        spanMin: -9.3,
        spanMax: -5.5,
        axis: 'x',
      },
      baffle_b_front: {
        name: 'Baffle B (Front Face)',
        center: [7.4, ART_HANG_CENTER, 1.675],
        rotation: [0, 0, 0],
        spanMin: 5.5,
        spanMax: 9.3,
        axis: 'x',
      },
      baffle_b_back: {
        name: 'Baffle B (Rear Face)',
        center: [7.4, ART_HANG_CENTER, 1.325],
        rotation: [0, Math.PI, 0],
        spanMin: 5.5,
        spanMax: 9.3,
        axis: 'x',
      },
    },
    lightingPlan: {
      tubeRows: [-5.75, 3.25],
      tubeXs: [-2.9, 2.9],
      tubeLength: 4.5,
      trackStyle: 'perimeter', // bars parallel to display walls, 30-degree heads
      trackInset: 1.35, // distance from inner wall face to the track bar
      headSpacing: 2.4, // spotlight head rhythm along each bar
      cove: true, // concealed LED cove strips at the upper soffits
      accentSpots: [-2.6, 2.6], // X positions of pillar islands receiving narrow beams
      accentZ: -1.2,
    },
  },
};

export const DEFAULT_HALL_LAYOUT = 'classic';

/** All valid layout ids (server-side validation) */
export const HALL_LAYOUT_IDS = Object.keys(HALL_LAYOUTS);

/** Resolve a hall layout id defensively */
export function getHallLayout(hallLayoutId) {
  return HALL_LAYOUTS[hallLayoutId] || HALL_LAYOUTS[DEFAULT_HALL_LAYOUT];
}

/** Wall registry for hanging artworks in this hall */
export function getWallConfigs(hallLayoutId) {
  return getHallLayout(hallLayoutId).walls;
}

/** Raw collider footprints (AABBs, un-padded) for player movement */
export function getColliders(hallLayoutId) {
  return getHallLayout(hallLayoutId).colliders;
}

/** Auto-slotting plan: wallId -> absolute offsets along the wall axis */
export function getSlotPlan(hallLayoutId) {
  return getHallLayout(hallLayoutId).slotPlan;
}

/**
 * Curator UI summary cards for the room-creation form
 */
export function getHallOptions() {
  return Object.values(HALL_LAYOUTS).map((l) => ({
    value: l.id,
    name: l.name,
    tagline: l.tagline,
    desc: l.desc,
    wallConfiguration: l.wallConfiguration,
    circulation: l.circulation,
    lighting: l.lighting,
  }));
}

/**
 * Compute world position + rotation for an artwork hung on a wall of this hall.
 * Mirrors the legacy computeWallPosition contract.
 */
export function computeWallPosition(wallId, indexOnWall, totalOnWall, hallLayoutId) {
  const configs = getWallConfigs(hallLayoutId);
  const config = configs[wallId] || configs.back;
  const { center, rotation, spanMin, spanMax, axis } = config;

  let offset = 0;
  if (totalOnWall > 1) {
    const step = (spanMax - spanMin) / (totalOnWall + 1);
    offset = spanMin + step * (indexOnWall + 1);
  }

  const posX = axis === 'x' ? offset : center[0];
  const posZ = axis === 'z' ? offset : center[2];

  return {
    position: [posX, center[1], posZ],
    rotation,
  };
}
