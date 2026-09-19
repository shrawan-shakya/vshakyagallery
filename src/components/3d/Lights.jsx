import React, { memo } from 'react';

function Lights() {
  return (
    <>
      {/* 1. Overall ambient fill */}
      <ambientLight intensity={0.18} color="#141422" />

      {/* 2. Hemisphere light for a natural vertical gradient (sky to floor) */}
      <hemisphereLight skyColor="#3a3a4c" groundColor="#1a1a24" intensity={0.28} />

      {/* 3. Key light from the ceiling casting the single static shadow map */}
      <directionalLight
        position={[6, 9, 6]}
        intensity={0.38}
        color="#ffe0c0"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        // Cover the full 20x20 room so the entrance wall (z=+10) never pops
        // in/out of the shadow frustum (default bounds are only ±5)
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />

      {/* 4. Subtle cool fill for ambient depth */}
      <directionalLight position={[-8, 4, -8]} intensity={0.22} color="#424266" />
    </>
  );
}

export default memo(Lights);
