// Shared helpers for text painted onto canvas textures (plaques, entrance
// lettering, the wing board). Fonts match the webfonts loaded in index.html.
export const SERIF_FONT = '"Cormorant Garamond", Georgia, serif';
export const SANS_FONT = 'Montserrat, Arial, sans-serif';

// Resolves once the webfonts are usable on a canvas (immediately without DOM)
export const fontsReady =
  typeof document !== 'undefined' && document.fonts?.ready
    ? document.fonts.ready
    : Promise.resolve();

// canvas letterSpacing is missing in older browsers
export function setLetterSpacing(ctx, px) {
  try {
    ctx.letterSpacing = `${px}px`;
  } catch {
    /* unsupported */
  }
}
