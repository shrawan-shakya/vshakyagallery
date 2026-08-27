import React, { useState, useMemo, useEffect, memo } from 'react';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';

// Sandwich-board proportions
const BOARD_W = 0.78; // leaf width
const LEAF_L = 1.28; // leaf length (hinge to floor)
const LEAF_T = 0.035; // leaf thickness
const LEAN = 0.16; // half-splay of the A-frame (radians)
const HINGE_Y = LEAF_L * Math.cos(LEAN) + 0.012;

// Open-middle layout: sign panel up top, see-through waist, solid base
const PANEL_TOP_H = 0.66;
const GAP_H = 0.22;
const PANEL_BOT_H = LEAF_L - PANEL_TOP_H - GAP_H;

// Hand-painted sign panel face on canvas
function makeBoardTexture(title) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 440;
  const ctx = c.getContext('2d');

  // Painted cream board face
  ctx.fillStyle = '#efe7d6';
  ctx.fillRect(0, 0, c.width, c.height);

  // Double border
  ctx.strokeStyle = '#241a12';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, c.width - 40, c.height - 40);
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, c.width - 72, c.height - 72);

  ctx.textAlign = 'center';

  // Header
  ctx.fillStyle = '#241a12';
  try {
    ctx.letterSpacing = '9px';
  } catch {
    /* older browsers */
  }
  ctx.font = '600 42px Georgia, serif';
  ctx.fillText('NEXT WING', c.width / 2, 100);

  // Gold divider
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(112, 132);
  ctx.lineTo(c.width - 112, 132);
  ctx.stroke();

  // Wrapped exhibition title, shrunk until it fits the panel
  try {
    ctx.letterSpacing = '2px';
  } catch {
    /* ignore */
  }
  const raw = String(title || 'Gallery').toUpperCase().trim();
  const maxTextW = c.width - 110;
  let size = 54;
  let lines = [];
  for (;;) {
    ctx.font = `700 ${size}px Georgia, serif`;
    lines = [];
    let cur = '';
    for (const word of raw.split(/\s+/)) {
      const test = cur ? `${cur} ${word}` : word;
      if (ctx.measureText(test).width > maxTextW && cur) {
        lines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    const fits =
      lines.length <= 3 &&
      lines.every((l) => ctx.measureText(l).width <= maxTextW);
    const blockH = lines.length * size * 1.2;
    if ((fits && blockH <= 185) || size <= 24) break;
    size -= 5;
  }
  const lh = size * 1.2;
  ctx.textBaseline = 'middle';
  let ty = 150 + (180 - lines.length * lh) / 2 + lh / 2;
  for (const line of lines) {
    ctx.fillText(line, c.width / 2, ty);
    ty += lh;
  }

  // Call-to-action footer
  ctx.fillStyle = '#241a12';
  try {
    ctx.letterSpacing = '6px';
  } catch {
    /* ignore */
  }
  ctx.font = '500 27px Georgia, serif';
  ctx.fillText('CLICK TO CHOOSE', c.width / 2, 388);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// One A-frame leaf: top sign panel, open waist on side stiles, base panel
function Leaf({ withFace, faceTex, hovered, woodColor }) {
  const woodMat = (
    <meshStandardMaterial
      color={withFace ? woodColor : '#3d2b1a'}
      roughness={0.55}
      metalness={0.05}
    />
  );

  return (
    <>
      {/* Top sign panel */}
      <mesh castShadow position={[0, -PANEL_TOP_H / 2, 0]}>
        <boxGeometry args={[BOARD_W, PANEL_TOP_H, LEAF_T]} />
        {woodMat}
      </mesh>

      {/* Side stiles bridging the open middle */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          castShadow
          position={[s * (BOARD_W / 2 - 0.025), -(PANEL_TOP_H + GAP_H / 2), 0]}
        >
          <boxGeometry args={[0.05, GAP_H + 0.06, LEAF_T]} />
          {woodMat}
        </mesh>
      ))}

      {/* Base panel */}
      <mesh castShadow position={[0, -(PANEL_TOP_H + GAP_H + PANEL_BOT_H / 2), 0]}>
        <boxGeometry args={[BOARD_W, PANEL_BOT_H, LEAF_T]} />
        {woodMat}
      </mesh>

      {/* Painted sign face */}
      {withFace && (
        <mesh position={[0, -PANEL_TOP_H / 2, LEAF_T / 2 + 0.003]}>
          <planeGeometry args={[0.7, PANEL_TOP_H - 0.06]} />
          <meshStandardMaterial
            map={faceTex}
            emissive="#f59e0b"
            emissiveMap={faceTex}
            emissiveIntensity={hovered ? 0.22 : 0}
          />
        </mesh>
      )}
    </>
  );
}

// Freestanding A-frame sandwich board beside the entrance. Clicking it (or
// aiming + pressing E in walk mode) opens the wing-choice sidebar.
function RoomPortal({
  position = [2.4, 0, 9.15],
  rotation = [0, Math.PI + 0.22, 0],
  nextRoomTitle = 'Next Artist Wing',
  onEnterPortal
}) {
  const [hovered, setHovered] = useState(false);
  const faceTex = useMemo(() => makeBoardTexture(nextRoomTitle), [nextRoomTitle]);

  useEffect(() => () => faceTex.dispose(), [faceTex]);

  useCursor(hovered);

  return (
    <group position={position} rotation={rotation}>
      <group
        userData={{ isPortal: true }}
        onClick={(e) => {
          e.stopPropagation();
          onEnterPortal?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        {/* Both leaves hang from a shared top hinge */}
        <group position={[0, HINGE_Y, 0]}>
          {/* Invisible oversized hit slab covering the full silhouette —
              makes hover/click targeting forgiving around edges and gaps */}
          <mesh position={[0, -(LEAF_L / 2) * Math.cos(LEAN), 0]}>
            <boxGeometry args={[BOARD_W + 0.1, LEAF_L * Math.cos(LEAN) + 0.1, 0.55]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Hinge pin */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, BOARD_W + 0.08, 12]} />
            <meshStandardMaterial color="#15151a" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Front leaf, splayed toward the reader (top leans back like an easel) */}
          <group rotation={[-LEAN, 0, 0]}>
            <Leaf withFace faceTex={faceTex} hovered={hovered} woodColor={hovered ? '#5c4326' : '#4a3421'} />
          </group>

          {/* Rear leaf */}
          <group rotation={[LEAN, 0, 0]}>
            <Leaf />
          </group>
        </group>
      </group>
    </group>
  );
}

export default memo(RoomPortal);
