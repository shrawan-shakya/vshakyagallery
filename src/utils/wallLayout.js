import { ART_HANG_CENTER } from '../constants';
import { getWallConfigs, getHallLayout } from './hallLayouts';

/**
 * Wall Layout Calculation Utility
 * Automatically arranges artworks along the display walls of a hall layout
 * in a balanced, museum-standard hanging layout.
 *
 * Wall inventories are hall-layout specific — see utils/hallLayouts.js.
 */

export { getHallLayout, getWallConfigs };

export function computeWallPosition(wallId, indexOnWall, totalOnWall, hallLayoutId = 'classic') {
  const config = getWallConfigs(hallLayoutId)[wallId];
  if (!config) {
    console.warn(`[wallLayout] Unknown wall "${wallId}" for hall "${hallLayoutId}"`);
    return { position: [0, ART_HANG_CENTER, 0], rotation: [0, 0, 0] };
  }

  const { center, rotation, spanMin, spanMax, axis } = config;

  let offset = center[axis === 'x' ? 0 : 2];
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
