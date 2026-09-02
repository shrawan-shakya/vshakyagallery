import React, { useMemo, memo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

/**
 * Creates a procedural hand-knotted wool bump texture canvas.
 * This simulates the microscopic cross-hatch knot weave of Nepalese Galaincha rugs.
 */
function createWoolKnotBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Base neutral height (128 = zero bump)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  // Knotted weave grid (vertical warp & horizontal weft fibers)
  ctx.fillStyle = '#404040';
  for (let y = 0; y < 256; y += 4) {
    for (let x = 0; x < 256; x += 4) {
      // Alternating knot bumps
      if ((x + y) % 8 === 0) {
        ctx.fillStyle = '#b0b0b0'; // Raised knot peak
        ctx.fillRect(x + 1, y + 1, 2, 2);
      } else {
        ctx.fillStyle = '#505050'; // Recessed knot valley
        ctx.fillRect(x + 1, y + 1, 2, 2);
      }
    }
  }

  // Fine organic wool pile fiber fuzz
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const val = Math.floor(128 + (Math.random() * 24 - 12));
    const hex = val.toString(16).padStart(2, '0');
    ctx.fillStyle = `#${hex}${hex}${hex}`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 24);
  return texture;
}

function NepaleseCarpet({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = [4.2, 2.8], // [width, depth]
  texturePath = '/textures/nepalese_carpet.jpg',
  hasFringes = true,
  fringeSide = 'x', // 'x' for left/right edges, 'z' for front/back edges
  pileThickness = 0.012, // 12mm pile thickness
}) {
  const [width, depth] = size;

  // Load carpet image map
  const carpetMap = useTexture(texturePath);

  // Generate procedural wool knot bump map
  const knotBumpMap = useMemo(() => createWoolKnotBumpTexture(), []);

  // Compute fringe placements along the short ends
  const fringeData = useMemo(() => {
    if (!hasFringes) return [];
    const count = 48; // number of fringe tassels along each end
    const items = [];
    const span = fringeSide === 'x' ? depth : width;
    const start = -span / 2 + 0.03;
    const step = (span - 0.06) / (count - 1);

    for (let i = 0; i < count; i++) {
      const pos = start + i * step;
      // Slight random wobble for natural hand-made look
      const rot = (Math.random() - 0.5) * 0.15;
      const length = 0.14 + (Math.random() - 0.5) * 0.02;
      items.push({ pos, rot, length, id: i });
    }
    return items;
  }, [hasFringes, fringeSide, width, depth]);

  const halfW = width / 2;
  const halfD = depth / 2;
  const fringeY = pileThickness * 0.3;

  return (
    <group position={position} rotation={rotation}>
      {/* 1. MAIN CARPET PILE (3D Box with wool knot texture and soft specular response) */}
      <mesh position={[0, pileThickness / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, pileThickness, depth]} />
        <meshStandardMaterial
          map={carpetMap}
          bumpMap={knotBumpMap}
          bumpScale={0.007}
          roughness={0.82}
          metalness={0.02}
          envMapIntensity={0.35}
        />
      </mesh>

      {/* 2. WOVEN BINDING EDGES (Trim framing all 4 sides) */}
      {/* Front & Back binding */}
      {[-halfD, halfD].map((z, idx) => (
        <mesh key={`bind-z-${idx}`} position={[0, pileThickness / 2, z]}>
          <boxGeometry args={[width + 0.02, pileThickness + 0.002, 0.02]} />
          <meshStandardMaterial color="#4a1818" roughness={0.9} />
        </mesh>
      ))}
      {/* Left & Right binding */}
      {[-halfW, halfW].map((x, idx) => (
        <mesh key={`bind-x-${idx}`} position={[x, pileThickness / 2, 0]}>
          <boxGeometry args={[0.02, pileThickness + 0.002, depth + 0.02]} />
          <meshStandardMaterial color="#4a1818" roughness={0.9} />
        </mesh>
      ))}

      {/* 3. TRADITIONAL HAND-TIED END FRINGES (Ivory wool tassels extending outward) */}
      {hasFringes && fringeSide === 'x' && (
        <>
          {/* Left End Fringes */}
          <group position={[-halfW - 0.07, fringeY, 0]}>
            {fringeData.map((f) => (
              <mesh
                key={`fringe-l-${f.id}`}
                position={[0, 0, f.pos]}
                rotation={[0, f.rot, 0]}
                receiveShadow
              >
                <boxGeometry args={[f.length, 0.003, 0.012]} />
                <meshStandardMaterial color="#f4efe2" roughness={0.95} />
              </mesh>
            ))}
          </group>
          {/* Right End Fringes */}
          <group position={[halfW + 0.07, fringeY, 0]}>
            {fringeData.map((f) => (
              <mesh
                key={`fringe-r-${f.id}`}
                position={[0, 0, f.pos]}
                rotation={[0, -f.rot, 0]}
                receiveShadow
              >
                <boxGeometry args={[f.length, 0.003, 0.012]} />
                <meshStandardMaterial color="#f4efe2" roughness={0.95} />
              </mesh>
            ))}
          </group>
        </>
      )}

      {hasFringes && fringeSide === 'z' && (
        <>
          {/* Front End Fringes */}
          <group position={[0, fringeY, halfD + 0.07]}>
            {fringeData.map((f) => (
              <mesh
                key={`fringe-f-${f.id}`}
                position={[f.pos, 0, 0]}
                rotation={[f.rot, 0, 0]}
                receiveShadow
              >
                <boxGeometry args={[0.012, 0.003, f.length]} />
                <meshStandardMaterial color="#f4efe2" roughness={0.95} />
              </mesh>
            ))}
          </group>
          {/* Back End Fringes */}
          <group position={[0, fringeY, -halfD - 0.07]}>
            {fringeData.map((f) => (
              <mesh
                key={`fringe-b-${f.id}`}
                position={[f.pos, 0, 0]}
                rotation={[-f.rot, 0, 0]}
                receiveShadow
              >
                <boxGeometry args={[0.012, 0.003, f.length]} />
                <meshStandardMaterial color="#f4efe2" roughness={0.95} />
              </mesh>
            ))}
          </group>
        </>
      )}
    </group>
  );
}

export default memo(NepaleseCarpet);
