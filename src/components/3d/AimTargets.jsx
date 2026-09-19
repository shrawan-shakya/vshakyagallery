import React, { useLayoutEffect, useRef } from 'react';
import { AIM_LAYER } from '../../constants';

// Everything inside this group becomes a candidate for the walk-mode aim
// raycast: interactables (plaques, bench, board) and the geometry that can
// occlude them (walls, floor, partitions, doors). Decorative meshes stay off
// the layer so the 20 Hz centre-ray never has to test them.
export default function AimTargets({ children, ...groupProps }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    ref.current?.traverse((o) => o.layers.enable(AIM_LAYER));
  });
  return (
    <group ref={ref} {...groupProps}>
      {children}
    </group>
  );
}
