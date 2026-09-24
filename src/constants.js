// Shared room dimensions — single source of truth for the architecture.
//
// SCALE CONTRACT: 1 scene unit = 1 meter (real-world metric).
// Every physical size in the scene is expressed in meters via these
// conversions, so artwork measurements entered in real units render
// at true scale inside the gallery.
export const ROOM_H = 6; // Ceiling height (m)
export const ROOM_W = 20; // Square floor side length (m)
export const WALL_INNER_FACE = 9.9; // Inner wall plane (walls are ±10 center, 0.2 thick)
export const ART_HANG_CENTER = 1.55; // Museum-standard artwork centerline height (m)

// Artwork display scale multiplier for the 3D gallery.
// Makes artworks (including 15"x22" pieces) visually commanding in the 20m x 20m hall
// while leaving catalog specs, labels, and room architecture intact.
export const ARTWORK_SCALE = 1.6;

// Imperial → metric conversion factors for 3D artwork display (scaled by ARTWORK_SCALE)
export const IN = 0.0254 * ARTWORK_SCALE; // meters per inch in 3D
export const FT = 0.3048 * ARTWORK_SCALE; // meters per foot in 3D

// Object layer tested by the walk-mode aim raycast. Only interactables and
// the geometry that can occlude them are put on it (see AimTargets).
export const AIM_LAYER = 1;
