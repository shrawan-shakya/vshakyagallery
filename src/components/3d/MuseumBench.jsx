import React, { useState, memo } from 'react';
import * as THREE from 'three';

function MuseumBench({
  position = [0, 0, 1.5], 
  theme = 'dark',
  isSeated = false,
  onSitBench 
}) {
  const [hovered, setHovered] = useState(false);
  const isDark = theme === 'dark';

  const cushionColor = isDark ? '#1a1a1e' : '#e8e2d5';
  const baseColor = '#111111';
  const goldAccent = '#D4AF37';

  return (
    <group 
      position={position} 
      userData={{ isBench: true }}
      onPointerOver={(e) => { 
        e.stopPropagation(); 
        setHovered(true); 
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => { 
        setHovered(false); 
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => { 
        e.stopPropagation(); 
        document.body.style.cursor = 'auto';
        onSitBench?.(); 
      }}
    >
      {/* 1. SEAT CUSHION (Leather upholstered top) */}
      <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.6, 0.16, 0.9]} />
        <meshStandardMaterial 
          color={cushionColor} 
          roughness={0.45}
          metalness={0.05}
          envMapIntensity={0.6}
        />
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
        <meshStandardMaterial 
          color={goldAccent} 
          metalness={0.9}
          roughness={0.25}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* 3. EBONY WOOD STAND / LEGS */}
      {/* Left Block Leg */}
      <mesh position={[-1.05, 0.18, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.18, 0.36, 0.84]} />
        <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Right Block Leg */}
      <mesh position={[1.05, 0.18, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.18, 0.36, 0.84]} />
        <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Center Stretcher Beam */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[2.1, 0.06, 0.1]} />
        <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.1} />
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
          <meshStandardMaterial color={goldAccent} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

export default memo(MuseumBench);
