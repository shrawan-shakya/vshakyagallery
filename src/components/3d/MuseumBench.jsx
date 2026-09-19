import React, { useState, memo } from 'react';
import { useCursor } from '@react-three/drei';
import AimTargets from './AimTargets';

const CUSHION_COLOR = '#1a1a1e';
const BASE_COLOR = '#111111';
const GOLD_ACCENT = '#D4AF37';

function MuseumBench({ position = [0, 0, 1.5], onSitBench }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  return (
    <AimTargets
      position={position}
      userData={{ isBench: true }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setHovered(false);
        onSitBench?.();
      }}
    >
      {/* 1. SEAT CUSHION (Leather upholstered top) */}
      <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.6, 0.16, 0.9]} />
        <meshStandardMaterial color={CUSHION_COLOR} roughness={0.45} metalness={0.05} envMapIntensity={0.6} />
      </mesh>

      {/* Button Tufting Seams Accent Lines */}
      {[-0.8, 0, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.535, 0]}>
          <boxGeometry args={[0.02, 0.005, 0.84]} />
          <meshStandardMaterial color="#000000" roughness={0.9} />
        </mesh>
      ))}

      {/* 2. GOLD METALLIC SUB-FRAME TRIM */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[2.64, 0.03, 0.94]} />
        <meshStandardMaterial color={GOLD_ACCENT} metalness={0.9} roughness={0.25} envMapIntensity={1.2} />
      </mesh>

      {/* 3. EBONY WOOD STAND / LEGS */}
      {[-1.05, 1.05].map((x) => (
        <mesh key={`leg-${x}`} position={[x, 0.18, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.18, 0.36, 0.84]} />
          <meshStandardMaterial color={BASE_COLOR} roughness={0.3} metalness={0.1} />
        </mesh>
      ))}

      {/* Center Stretcher Beam */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[2.1, 0.06, 0.1]} />
        <meshStandardMaterial color={BASE_COLOR} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* 4. LEATHER GUESTBOOK / CATALOGUE BOOKLET ON BENCH */}
      <group position={[0.7, 0.54, 0.1]} rotation={[0, -0.2, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.3, 0.025, 0.4]} />
          <meshStandardMaterial color="#3d2417" roughness={0.5} />
        </mesh>
        {/* Gold Leaf Title Stamp on Cover */}
        <mesh position={[0, 0.013, 0]}>
          <boxGeometry args={[0.18, 0.001, 0.1]} />
          <meshStandardMaterial color={GOLD_ACCENT} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </AimTargets>
  );
}

export default memo(MuseumBench);
