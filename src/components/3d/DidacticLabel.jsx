import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

const PANEL_W = 0.46;
const PANEL_H = 0.302;

function wrapText(ctx, text, cx, startY, maxWidth, lineHeight, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((l, i) => {
    ctx.fillText(l, cx, startY + i * lineHeight);
  });
}

// Ivory museum didactic panel: hairline frame, serif title, tracked
// small-caps credit line, medium line, and four baked-in corner screws
function makeLabelTexture({ title = 'Untitled', artist = 'Unknown Artist', year = '', medium = 'Mixed Media' }) {
  const safeTitle = String(title || 'Untitled');
  const safeArtist = String(artist || 'Unknown Artist');
  const safeYear = String(year || '');
  const safeMedium = String(medium || 'Mixed Media');

  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 336;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f6f2e8';
  ctx.fillRect(0, 0, c.width, c.height);

  // Corner mounting screws
  ctx.fillStyle = '#cfcabf';
  [
    [26, 26],
    [486, 26],
    [26, 310],
    [486, 310],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // Hairline border
  ctx.strokeStyle = 'rgba(25, 21, 16, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 15, 482, 306);

  ctx.textAlign = 'center';

  // Kicker
  ctx.fillStyle = '#8a8478';
  ctx.font = '600 16px Outfit, Arial, sans-serif';
  try {
    ctx.letterSpacing = '7px';
  } catch {
    /* ignore */
  }
  ctx.fillText('NOW VIEWING', 260, 58);

  // Title (serif, wraps to at most two lines)
  ctx.fillStyle = '#141110';
  const titleSize = safeTitle.length > 30 ? 32 : safeTitle.length > 18 ? 38 : 44;
  ctx.font = `700 ${titleSize}px "Playfair Display", Georgia, serif`;
  try {
    ctx.letterSpacing = '1px';
  } catch {
    /* ignore */
  }
  wrapText(ctx, safeTitle, 256, 104, 430, titleSize * 1.2, 2);

  // Rule
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(130, 196);
  ctx.lineTo(382, 196);
  ctx.stroke();

  // Artist · year
  ctx.fillStyle = '#45403a';
  ctx.font = '600 20px Outfit, Arial, sans-serif';
  try {
    ctx.letterSpacing = '5px';
  } catch {
    /* ignore */
  }
  const byline = safeYear ? `${safeArtist} · ${safeYear}` : safeArtist;
  ctx.fillText(byline.toUpperCase(), 258, 236);

  // Medium
  ctx.fillStyle = '#6d675c';
  ctx.font = '400 19px Outfit, Arial, sans-serif';
  try {
    ctx.letterSpacing = '2px';
  } catch {
    /* ignore */
  }
  wrapText(ctx, safeMedium, 256, 272, 420, 24, 1);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 16;
  return tex;
}

export default function DidacticLabel({ artworkId, title, artist, year, medium, width, centerY, onHoverChange, theme }) {
  const texture = useMemo(
    () => makeLabelTexture({ title, artist, year, medium }),
    [title, artist, year, medium],
  );

  const meshRef = useRef();

  // Hover source for the "View Details" hint. The pointer must actually be
  // ON this plaque (first raycast hit) — R3F delivers events to occluded
  // meshes too, so without the guard the hint could trigger through walls.
  const handleOver = (e) => {
    const first = e.intersections && e.intersections[0];
    if (!first || first.object !== meshRef.current) return;
    e.stopPropagation();
    onHoverChange?.(true);
  };

  const handleOut = () => {
    onHoverChange?.(false);
  };

  // Mounted beside the frame on the wall plane, label centre at ~1.52m
  const localX = width / 2 + 0.28 + PANEL_W / 2;
  const localY = 1.52 - centerY;

  return (
    <mesh
      ref={meshRef}
      position={[localX, localY, -0.038]}
      userData={{ isPlaque: true, artworkId }}
      onPointerOver={onHoverChange ? handleOver : undefined}
      onPointerOut={onHoverChange ? handleOut : undefined}
    >
      <planeGeometry args={[PANEL_W, PANEL_H]} />
      <meshStandardMaterial
        map={texture}
        emissive="#ffffff"
        emissiveMap={texture}
        emissiveIntensity={theme === 'dark' ? 0.16 : 0.05}
        roughness={0.92}
        metalness={0}
      />
    </mesh>
  );
}
