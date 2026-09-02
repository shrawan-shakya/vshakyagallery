import React, { useMemo, memo } from 'react';
import * as THREE from 'three';

/**
 * Draws a traditional Nepalese Endless Knot (Srivatsa / Ashtamangala) motif on a 2D canvas context.
 */
function drawEndlessKnot(ctx, cx, cy, size, color, strokeWidth) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const s = size / 4;
  ctx.beginPath();
  ctx.moveTo(-s, -2 * s);
  ctx.lineTo(s, -2 * s);
  ctx.arcTo(2 * s, -2 * s, 2 * s, -s, s);
  ctx.lineTo(2 * s, s);
  ctx.arcTo(2 * s, 2 * s, s, 2 * s, s);
  ctx.lineTo(-s, 2 * s);
  ctx.arcTo(-2 * s, 2 * s, -2 * s, s, s);
  ctx.lineTo(-2 * s, -s);
  ctx.arcTo(-2 * s, -2 * s, -s, -2 * s, s);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s, 0);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a single stylized Nepalese lotus petal.
 */
function drawLotusPetal(ctx, cx, cy, radiusX, radiusY, angle, fillColor, strokeColor) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(radiusX, -radiusY * 0.6, 0, -radiusY);
  ctx.quadraticCurveTo(-radiusX, -radiusY * 0.6, 0, 0);
  ctx.fillStyle = fillColor;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws a multi-layered Nepalese Mandala lotus medallion.
 */
function drawMandalaMedallion(ctx, cx, cy, maxRadius) {
  // Outer navy ring
  ctx.beginPath();
  ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#112233';
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 5;
  ctx.stroke();

  // 16 Outer Lotus Petals (alternating crimson and gold)
  const numOuter = 16;
  for (let i = 0; i < numOuter; i++) {
    const angle = (i * Math.PI * 2) / numOuter;
    drawLotusPetal(
      ctx,
      cx,
      cy,
      maxRadius * 0.22,
      maxRadius * 0.9,
      angle,
      i % 2 === 0 ? '#A91B2E' : '#E5C158',
      '#4A0000'
    );
  }

  // Middle crimson ring
  ctx.beginPath();
  ctx.arc(cx, cy, maxRadius * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = '#7A0C1E';
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 8 Inner Lotus Petals
  const numInner = 8;
  for (let i = 0; i < numInner; i++) {
    const angle = (i * Math.PI * 2) / numInner + Math.PI / 8;
    drawLotusPetal(
      ctx,
      cx,
      cy,
      maxRadius * 0.25,
      maxRadius * 0.58,
      angle,
      '#F4D03F',
      '#7A0C1E'
    );
  }

  // Center gold ring
  ctx.beginPath();
  ctx.arc(cx, cy, maxRadius * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = '#D4AF37';
  ctx.fill();
  ctx.strokeStyle = '#112233';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center Endless Knot Symbol
  drawEndlessKnot(ctx, cx, cy, maxRadius * 0.38, '#112233', 4);
}

/**
 * Procedurally generates a Nepalese Carpet Texture directly onto an HTML5 Canvas.
 * No external image files required!
 */
function createProceduralNepaleseCarpetTexture(variant = 'mandala') {
  const w = 1024;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const isRunner = variant === 'runner';

  // 1. BASE BACKGROUND FIELD
  const baseColor = isRunner ? '#0D1B2A' : '#7A0C1E'; // Midnight Indigo or Deep Crimson Red
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  // Subtle hand-dyed wool color variation gradient
  const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.7);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 2. OUTER MAROON/NAVY BINDING EDGE
  const borderMargin = 20;
  ctx.strokeStyle = '#2B050B';
  ctx.lineWidth = borderMargin;
  ctx.strokeRect(borderMargin / 2, borderMargin / 2, w - borderMargin, h - borderMargin);

  // 3. MAIN OUTER GEOMETRIC MEANDER BORDER (Gold & Navy)
  const b1 = 70; // Outer border thickness
  ctx.fillStyle = isRunner ? '#7A0C1E' : '#112233';
  ctx.fillRect(borderMargin, borderMargin, w - borderMargin * 2, h - borderMargin * 2);

  ctx.strokeStyle = '#D4AF37'; // Gold
  ctx.lineWidth = 4;
  ctx.strokeRect(borderMargin + 4, borderMargin + 4, w - (borderMargin + 4) * 2, h - (borderMargin + 4) * 2);

  // Repeating geometric key meander strokes along border
  ctx.strokeStyle = '#E5C158';
  ctx.lineWidth = 3;
  const meanderStep = 32;
  ctx.beginPath();
  // Top & Bottom border keys
  for (let x = borderMargin + 20; x < w - borderMargin - 20; x += meanderStep) {
    ctx.moveTo(x, borderMargin + 10);
    ctx.lineTo(x + 16, borderMargin + 10);
    ctx.lineTo(x + 16, borderMargin + 30);
    ctx.lineTo(x + 8, borderMargin + 30);
    ctx.lineTo(x + 8, borderMargin + 20);

    ctx.moveTo(x, h - borderMargin - 10);
    ctx.lineTo(x + 16, h - borderMargin - 10);
    ctx.lineTo(x + 16, h - borderMargin - 30);
    ctx.lineTo(x + 8, h - borderMargin - 30);
    ctx.lineTo(x + 8, h - borderMargin - 20);
  }
  // Left & Right border keys
  for (let y = borderMargin + 20; y < h - borderMargin - 20; y += meanderStep) {
    ctx.moveTo(borderMargin + 10, y);
    ctx.lineTo(borderMargin + 10, y + 16);
    ctx.lineTo(borderMargin + 30, y + 16);
    ctx.lineTo(borderMargin + 30, y + 8);
    ctx.lineTo(borderMargin + 20, y + 8);

    ctx.moveTo(w - borderMargin - 10, y);
    ctx.lineTo(w - borderMargin - 10, y + 16);
    ctx.lineTo(w - borderMargin - 30, y + 16);
    ctx.lineTo(w - borderMargin - 30, y + 8);
    ctx.lineTo(w - borderMargin - 20, y + 8);
  }
  ctx.stroke();

  // 4. INNER BORDER FRAME STRIP (Gold Lotus Vine Guard)
  const innerB = borderMargin + b1;
  ctx.fillStyle = baseColor;
  ctx.fillRect(innerB, innerB, w - innerB * 2, h - innerB * 2);

  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 5;
  ctx.strokeRect(innerB, innerB, w - innerB * 2, h - innerB * 2);

  // 5. INNER FIELD MOTIFS
  const cx = w / 2;
  const cy = h / 2;

  if (variant === 'runner') {
    // RUNNER DESIGN: Multiple repeating Endless Knots & Lotus Flowers along center axis
    const knotPositions = [h * 0.22, h * 0.5, h * 0.78];
    knotPositions.forEach((ky) => {
      // Golden Endless Knot
      drawEndlessKnot(ctx, cx, ky, 160, '#E5C158', 6);

      // Surrounding Lotus Petal accents
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const lx = cx + Math.cos(a) * 120;
        const ly = ky + Math.sin(a) * 120;
        drawLotusPetal(ctx, lx, ly, 14, 30, a + Math.PI / 2, '#F4D03F', '#7A0C1E');
      }
    });

    // Four Corner Spandrels
    const cornerOff = innerB + 60;
    const corners = [
      [cornerOff, cornerOff],
      [w - cornerOff, cornerOff],
      [cornerOff, h - cornerOff],
      [w - cornerOff, h - cornerOff],
    ];
    corners.forEach(([kx, ky]) => {
      drawEndlessKnot(ctx, kx, ky, 80, '#D4AF37', 3);
    });
  } else {
    // MANDALA DESIGN: Large central Mandala Lotus Medallion + Corner Lotus Clouds
    drawMandalaMedallion(ctx, cx, cy, 260);

    // 4 Corner Spandrels with Lotus Clouds & Endless Knots
    const cornerOffset = innerB + 70;
    const corners = [
      [cornerOffset, cornerOffset, 0],
      [w - cornerOffset, cornerOffset, Math.PI / 2],
      [w - cornerOffset, h - cornerOffset, Math.PI],
      [cornerOffset, h - cornerOffset, -Math.PI / 2],
    ];

    corners.forEach(([kx, ky, rot]) => {
      ctx.save();
      ctx.translate(kx, ky);
      ctx.rotate(rot);
      drawEndlessKnot(ctx, 0, 0, 100, '#D4AF37', 4);
      for (let p = -0.5; p <= 0.5; p += 0.5) {
        drawLotusPetal(ctx, 45 * p, 45, 12, 32, p * 0.4, '#F4D03F', '#112233');
      }
      ctx.restore();
    });

    // Secondary accent lotus flowers around central mandala
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const ax = cx + Math.cos(angle) * 340;
      const ay = cy + Math.sin(angle) * 340;
      drawEndlessKnot(ctx, ax, ay, 90, '#E5C158', 3.5);
    }
  }

  // 6. PROCEDURAL WOOL TEXTURE OVERLAY (Hand-knotted pile fibers & knot grid)
  for (let i = 0; i < 25000; i++) {
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    const size = Math.random() * 1.8 + 0.5;
    const alpha = Math.random() * 0.08;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(rx, ry, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates a procedural hand-knotted wool bump texture canvas.
 */
function createWoolKnotBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#404040';
  for (let y = 0; y < 256; y += 4) {
    for (let x = 0; x < 256; x += 4) {
      if ((x + y) % 8 === 0) {
        ctx.fillStyle = '#b0b0b0';
        ctx.fillRect(x + 1, y + 1, 2, 2);
      } else {
        ctx.fillStyle = '#505050';
        ctx.fillRect(x + 1, y + 1, 2, 2);
      }
    }
  }

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
  variant = 'mandala', // 'mandala' | 'runner'
  hasFringes = true,
  fringeSide = 'x', // 'x' for left/right edges, 'z' for front/back edges
  pileThickness = 0.012, // 12mm pile thickness
}) {
  const [width, depth] = size;

  // 1. Generate 100% procedural Nepalese carpet vector canvas texture
  const carpetMap = useMemo(() => createProceduralNepaleseCarpetTexture(variant), [variant]);

  // 2. Generate procedural wool knot bump map
  const knotBumpMap = useMemo(() => createWoolKnotBumpTexture(), []);

  // 3. Compute fringe placements along the short ends
  const fringeData = useMemo(() => {
    if (!hasFringes) return [];
    const count = 52;
    const items = [];
    const span = fringeSide === 'x' ? depth : width;
    const start = -span / 2 + 0.03;
    const step = (span - 0.06) / (count - 1);

    for (let i = 0; i < count; i++) {
      const pos = start + i * step;
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
      {/* 1. MAIN CARPET PILE (3D Box with procedural canvas carpet map and wool bump texture) */}
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
      {[-halfD, halfD].map((z, idx) => (
        <mesh key={`bind-z-${idx}`} position={[0, pileThickness / 2, z]}>
          <boxGeometry args={[width + 0.02, pileThickness + 0.002, 0.02]} />
          <meshStandardMaterial color={variant === 'runner' ? '#0b131f' : '#4a1818'} roughness={0.9} />
        </mesh>
      ))}
      {[-halfW, halfW].map((x, idx) => (
        <mesh key={`bind-x-${idx}`} position={[x, pileThickness / 2, 0]}>
          <boxGeometry args={[0.02, pileThickness + 0.002, depth + 0.02]} />
          <meshStandardMaterial color={variant === 'runner' ? '#0b131f' : '#4a1818'} roughness={0.9} />
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
