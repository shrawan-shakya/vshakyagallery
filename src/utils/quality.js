// Rendering quality tiers. One tier object drives every scalable knob in the
// scene, so a weak GPU gets a lighter room instead of only a blurrier one.
// Auto-detection is a local heuristic on the WebGL renderer string (no network),
// and PerformanceMonitor in App demotes the auto tier when frames stay slow.
export const QUALITY_TIERS = {
  low: {
    id: 'low',
    label: 'Low',
    dpr: [0.6, 0.8],
    shadows: false,
    bloom: false,
    bloomLevels: 0,
    rectAreaLights: false, // emissive tubes only
    spotSlots: 2,
    anisotropy: 2,
    maxTextureSide: 1024,
    fringeThreads: 60,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    dpr: [0.8, 1.0],
    shadows: true,
    bloom: true,
    bloomLevels: 5,
    rectAreaLights: true,
    spotSlots: 4,
    anisotropy: 4,
    maxTextureSide: 1536,
    fringeThreads: 140,
  },
  high: {
    id: 'high',
    label: 'High',
    dpr: [1.0, 1.5],
    shadows: true,
    bloom: true,
    bloomLevels: 8,
    rectAreaLights: true,
    spotSlots: 4,
    anisotropy: 16,
    maxTextureSide: 2048,
    fringeThreads: 140,
  },
};

export const QUALITY_ORDER = ['low', 'medium', 'high'];
// What the visitor can pick: follow the detector, or pin a tier
export const QUALITY_PREFERENCES = ['auto', ...QUALITY_ORDER];

const STORAGE_KEY = 'galleryQuality';

export function lowerTier(id) {
  return QUALITY_ORDER[Math.max(0, QUALITY_ORDER.indexOf(id) - 1)];
}

export function nextQualityPreference(current) {
  return QUALITY_PREFERENCES[(QUALITY_PREFERENCES.indexOf(current) + 1) % QUALITY_PREFERENCES.length];
}

export function readQualityPreference() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return QUALITY_PREFERENCES.includes(value) ? value : 'auto';
  } catch {
    return 'auto';
  }
}

export function writeQualityPreference(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* private mode / storage blocked: the choice just won't persist */
  }
}

// Unmasked GPU name from a throwaway context, released straight away
function readRendererString() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return '';
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return String(renderer || '');
  } catch {
    return '';
  }
}

export function detectQualityTier() {
  if (typeof document === 'undefined') return 'medium';
  const renderer = readRendererString();
  const cores = navigator.hardwareConcurrency || 4;
  const memoryGb = navigator.deviceMemory || 8; // Chromium only
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Software rasterisers and the basic Windows fallback driver
  if (/swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(renderer)) return 'low';
  // Older Intel integrated parts (HD 4000 … UHD 630) struggle with the forward-lit room;
  // Iris / Xe / Arc are fine
  if (/intel.*\b(hd|uhd) graphics/i.test(renderer) && !/iris|xe|arc/i.test(renderer)) return 'low';
  if (touch || cores <= 4 || memoryGb <= 4) return 'medium';
  if (/apple|nvidia|geforce|rtx|radeon|amd|iris|xe|arc/i.test(renderer)) return 'high';
  return 'medium';
}
