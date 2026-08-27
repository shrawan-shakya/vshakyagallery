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

// Imperial → metric conversion factors
export const IN = 0.0254; // one inch in meters
export const FT = 0.3048; // one foot in meters
