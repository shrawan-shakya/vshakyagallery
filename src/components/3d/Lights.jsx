import React, { memo } from 'react';

function Lights({ theme }) {
  const isDark = theme === 'dark';

  return (
    <>
      {/* 1. Overall ambient light for a bright, airy hall */}
      <ambientLight 
        intensity={isDark ? 0.18 : 0.48} 
        color={isDark ? "#141422" : "#ffffff"} 
      />

      {/* 2. Hemisphere light for natural vertical gradient color bounce (sky to floor) */}
      <hemisphereLight
        skyColor={isDark ? "#3a3a4c" : "#ffffff"}
        groundColor={isDark ? "#1a1a24" : "#fdf3e3"}
        intensity={isDark ? 0.28 : 0.65}
      />

      {/* 3. Key directional light representing sun/ceiling keylight casting soft shadows */}
<directionalLight
        position={[6, 9, 6]}
        intensity={isDark ? 0.38 : 1.25}
        color={isDark ? "#ffe0c0" : "#fffbf5"}
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

      {/* 4. Subtle cool fill light in dark mode for ambient depth */}
      {isDark && (
        <directionalLight
          position={[-8, 4, -8]}
          intensity={0.22}
          color="#424266"
        />
      )}
    </>
  );
}

export default memo(Lights);

