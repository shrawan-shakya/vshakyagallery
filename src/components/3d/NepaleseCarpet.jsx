import React, { useMemo, memo } from 'react';
import * as THREE from 'three';

// Color Palette Constants for Authentic Nepalese Carpet Weaving
const PALETTE = {
  crimsonDark: '#4A0610',
  crimsonRich: '#7A0C1E',
  crimsonLight: '#A91B2E',
  navyDeep: '#0A1526',
  navyRoyal: '#162A45',
  goldMetallic: '#D4AF37',
  goldBright: '#F4D03F',
  goldWarm: '#E5C158',
  turquoise: '#1CA396',
  coralRed: '#D9381E',
  ivoryWhite: '#F8F4E8',
  ebonyTrim: '#1A0408',
  saffronGold: '#C99700',
  emeraldGreen: '#1E6B44',
};

/**
 * Draws a 3x3 Interlocking Endless Knot (Srivatsa / Khata) with bevel highlights.
 */
function drawEndlessKnot(ctx, cx, cy, size, mainColor, strokeWidth, shadow = true) {
  ctx.save();
  ctx.translate(cx, cy);

  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
  }

  const s = size / 4.2;

  // Outer interlocking band
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

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

  // Inner diagonal loop
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s, 0);
  ctx.closePath();
  ctx.stroke();

  // Inner core cross
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.5);
  ctx.lineTo(s * 0.5, s * 0.5);
  ctx.moveTo(s * 0.5, -s * 0.5);
  ctx.lineTo(-s * 0.5, s * 0.5);
  ctx.strokeStyle = PALETTE.goldBright;
  ctx.lineWidth = strokeWidth * 0.4;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a Double Dorje / Cross Vajra (Vishvavajra) emblem for the center of the Mandala.
 */
function drawVishvavajra(ctx, cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.strokeStyle = PALETTE.goldMetallic;
  ctx.lineWidth = 4;
  ctx.fillStyle = PALETTE.crimsonRich;

  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 2);

    // Vajra prong head
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.15);
    ctx.quadraticCurveTo(size * 0.25, -size * 0.35, 0, -size * 0.7);
    ctx.quadraticCurveTo(-size * 0.25, -size * 0.35, 0, -size * 0.15);
    ctx.fillStyle = PALETTE.goldBright;
    ctx.fill();
    ctx.stroke();

    // Center jewel tip
    ctx.beginPath();
    ctx.arc(0, -size * 0.72, size * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.turquoise;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Center hub sphere
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fill();
  ctx.strokeStyle = PALETTE.goldMetallic;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Center lotus seed
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.coralRed;
  ctx.fill();

  ctx.restore();
}

/**
 * Draws an auspicious Himalayan Ashtamangala symbol icon.
 */
function drawAshtamangalaIcon(ctx, type, cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 6;

  if (type === 'fish') {
    // Golden Fishes (Matsyajugma)
    [-1, 1].forEach((dir) => {
      ctx.save();
      ctx.scale(dir, 1);
      ctx.beginPath();
      ctx.ellipse(-size * 0.2, 0, size * 0.18, size * 0.35, Math.PI / 6, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.goldBright;
      ctx.fill();
      ctx.strokeStyle = PALETTE.navyDeep;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });
  } else if (type === 'conch') {
    // White Right-turning Conch Shell (Shankha)
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.25, size * 0.4, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.ivoryWhite;
    ctx.fill();
    ctx.strokeStyle = PALETTE.goldMetallic;
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (type === 'vase') {
    // Golden Treasure Vase (Kalasha)
    ctx.beginPath();
    ctx.arc(0, size * 0.1, size * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.goldMetallic;
    ctx.fill();
    ctx.strokeStyle = PALETTE.crimsonRich;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Neck & Jewels
    ctx.fillRect(-size * 0.15, -size * 0.3, size * 0.3, size * 0.15);
  } else if (type === 'lotus') {
    // Pink/Gold Lotus Blossom (Padma)
    for (let a = -Math.PI / 3; a <= Math.PI / 3; a += Math.PI / 6) {
      ctx.beginPath();
      ctx.ellipse(
        Math.sin(a) * size * 0.2,
        -Math.cos(a) * size * 0.2,
        size * 0.12,
        size * 0.3,
        a,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = PALETTE.coralRed;
      ctx.fill();
      ctx.strokeStyle = PALETTE.goldBright;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (type === 'wheel') {
    // Golden Wheel of Law (Dharmachakra)
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.goldMetallic;
    ctx.fill();
    ctx.strokeStyle = PALETTE.navyDeep;
    ctx.lineWidth = 3;
    ctx.stroke();
    // 8 Spokes
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * size * 0.35, Math.sin(ang) * size * 0.35);
      ctx.strokeStyle = PALETTE.navyDeep;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else {
    // Default: Golden Endless Knot
    drawEndlessKnot(ctx, 0, 0, size * 0.9, PALETTE.goldBright, 4, false);
  }

  ctx.restore();
}

/**
 * Draws a traditional Himalayan Cloud Scroll (Chintamani Cloud).
 */
function drawHimalayanCloud(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.goldMetallic;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(-size * 0.3, 0, size * 0.25, 0, Math.PI * 2);
  ctx.arc(0, -size * 0.2, size * 0.35, 0, Math.PI * 2);
  ctx.arc(size * 0.3, 0, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a bead / pearl string guard line around carpet borders.
 */
function drawPearlString(ctx, x1, y1, x2, y2, step = 16) {
  ctx.save();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const count = Math.floor(dist / step);

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.ivoryWhite;
    ctx.fill();
    ctx.strokeStyle = PALETTE.goldMetallic;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws an ornate corner spandrel ornament filled with lotus cloud scrolls.
 */
function drawCornerSpandrel(ctx, cx, cy, size, rotation) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // Triangular spandrel background
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.quadraticCurveTo(size * 0.5, size * 0.5, 0, size);
  ctx.closePath();
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fill();
  ctx.strokeStyle = PALETTE.goldMetallic;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Corner cloud & endless knot motif
  drawHimalayanCloud(ctx, size * 0.3, size * 0.3, size * 0.35, PALETTE.turquoise);
  drawEndlessKnot(ctx, size * 0.35, size * 0.35, size * 0.45, PALETTE.goldBright, 3, false);

  ctx.restore();
}

/**
 * Master multi-layered Mandala Medallion (32 Lotus Petals + Vishvavajra Core + Pearl Rings).
 */
function drawGrandMandalaMedallion(ctx, cx, cy, maxRadius) {
  ctx.save();

  // Drop shadow behind main medallion
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;

  // Outer Lapis Navy Ring
  ctx.beginPath();
  ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fill();
  ctx.strokeStyle = PALETTE.goldMetallic;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.shadowColor = 'transparent';

  // 24 Outer Lotus Petals (Alternating Gold & Turquoise with Crimson outline)
  const numOuter = 24;
  for (let i = 0; i < numOuter; i++) {
    const angle = (i * Math.PI * 2) / numOuter;
    const color = i % 2 === 0 ? PALETTE.goldBright : PALETTE.turquoise;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(maxRadius * 0.2, -maxRadius * 0.5, 0, -maxRadius * 0.94);
    ctx.quadraticCurveTo(-maxRadius * 0.2, -maxRadius * 0.5, 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = PALETTE.crimsonDark;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  // Middle Pearl Ring
  const midR = maxRadius * 0.68;
  ctx.beginPath();
  ctx.arc(cx, cy, midR, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.crimsonRich;
  ctx.fill();
  ctx.strokeStyle = PALETTE.goldMetallic;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Pearl beads around middle ring
  const numPearls = 32;
  for (let i = 0; i < numPearls; i++) {
    const a = (i * Math.PI * 2) / numPearls;
    const px = cx + Math.cos(a) * (midR - 8);
    const py = cy + Math.sin(a) * (midR - 8);
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.ivoryWhite;
    ctx.fill();
  }

  // 12 Inner Coral Red Lotus Petals
  const numInner = 12;
  for (let i = 0; i < numInner; i++) {
    const angle = (i * Math.PI * 2) / numInner + Math.PI / 12;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(midR * 0.25, -midR * 0.4, 0, -midR * 0.85);
    ctx.quadraticCurveTo(-midR * 0.25, -midR * 0.4, 0, 0);
    ctx.fillStyle = PALETTE.coralRed;
    ctx.fill();
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Center Double Dorje (Vishvavajra) Emblem
  drawVishvavajra(ctx, cx, cy, maxRadius * 0.5);

  ctx.restore();
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
  const isDragon = variant === 'royal_dragon';
  const isEntrance = variant === 'entrance_welcome';

  // 1. BASE BACKGROUND FIELD
  const baseColor = isRunner
    ? PALETTE.navyDeep
    : isDragon
    ? PALETTE.saffronGold
    : isEntrance
    ? PALETTE.crimsonDark
    : PALETTE.crimsonRich;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  // Radial hand-dyed wool abrash shading
  const grad = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w * 0.72);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 2. OUTER FELT BINDING EDGE
  const borderMargin = 24;
  ctx.fillStyle = PALETTE.ebonyTrim;
  ctx.fillRect(0, 0, w, borderMargin);
  ctx.fillRect(0, h - borderMargin, w, borderMargin);
  ctx.fillRect(0, 0, borderMargin, h);
  ctx.fillRect(w - borderMargin, 0, borderMargin, h);

  // 3. MAIN TIBETAN T-PATTERN MEANDER BORDER
  const b1 = 80; // Outer border width
  const outerBorderColor = isRunner ? PALETTE.crimsonRich : PALETTE.navyDeep;
  ctx.fillStyle = outerBorderColor;
  ctx.fillRect(borderMargin, borderMargin, w - borderMargin * 2, h - borderMargin * 2);

  ctx.strokeStyle = PALETTE.goldMetallic;
  ctx.lineWidth = 4;
  ctx.strokeRect(borderMargin + 2, borderMargin + 2, w - (borderMargin + 2) * 2, h - (borderMargin + 2) * 2);

  // Repeating geometric T-pattern key meander along outer border
  ctx.strokeStyle = PALETTE.goldBright;
  ctx.lineWidth = 3.5;
  const step = 36;

  ctx.beginPath();
  for (let x = borderMargin + 30; x < w - borderMargin - 30; x += step) {
    // Top border key
    ctx.moveTo(x, borderMargin + 12);
    ctx.lineTo(x + 18, borderMargin + 12);
    ctx.lineTo(x + 18, borderMargin + 34);
    ctx.lineTo(x + 8, borderMargin + 34);
    ctx.lineTo(x + 8, borderMargin + 22);
    ctx.lineTo(x + 24, borderMargin + 22);

    // Bottom border key
    ctx.moveTo(x, h - borderMargin - 12);
    ctx.lineTo(x + 18, h - borderMargin - 12);
    ctx.lineTo(x + 18, h - borderMargin - 34);
    ctx.lineTo(x + 8, h - borderMargin - 34);
    ctx.lineTo(x + 8, h - borderMargin - 22);
    ctx.lineTo(x + 24, h - borderMargin - 22);
  }

  for (let y = borderMargin + 30; y < h - borderMargin - 30; y += step) {
    // Left border key
    ctx.moveTo(borderMargin + 12, y);
    ctx.lineTo(borderMargin + 12, y + 18);
    ctx.lineTo(borderMargin + 34, y + 18);
    ctx.lineTo(borderMargin + 34, y + 8);
    ctx.lineTo(borderMargin + 22, y + 8);
    ctx.lineTo(borderMargin + 22, y + 24);

    // Right border key
    ctx.moveTo(w - borderMargin - 12, y);
    ctx.lineTo(w - borderMargin - 12, y + 18);
    ctx.lineTo(w - borderMargin - 34, y + 18);
    ctx.lineTo(w - borderMargin - 34, y + 8);
    ctx.lineTo(w - borderMargin - 22, y + 8);
    ctx.lineTo(w - borderMargin - 22, y + 24);
  }
  ctx.stroke();

  // Four corner Endless Knots in the border
  const bCorners = [
    [borderMargin + 40, borderMargin + 40],
    [w - borderMargin - 40, borderMargin + 40],
    [borderMargin + 40, h - borderMargin - 40],
    [w - borderMargin - 40, h - borderMargin - 40],
  ];
  bCorners.forEach(([bx, by]) => {
    drawEndlessKnot(ctx, bx, by, 50, PALETTE.goldBright, 3, false);
  });

  // 4. PEARL STRING & INNER GUARD BORDER
  const innerB = borderMargin + b1;

  // Inner field background fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(innerB, innerB, w - innerB * 2, h - innerB * 2);

  // Pearl beads string inner border
  drawPearlString(ctx, innerB, innerB, w - innerB, innerB, 20);
  drawPearlString(ctx, w - innerB, innerB, w - innerB, h - innerB, 20);
  drawPearlString(ctx, w - innerB, h - innerB, innerB, h - innerB, 20);
  drawPearlString(ctx, innerB, h - innerB, innerB, innerB, 20);

  ctx.strokeStyle = PALETTE.goldMetallic;
  ctx.lineWidth = 5;
  ctx.strokeRect(innerB + 8, innerB + 8, w - (innerB + 8) * 2, h - (innerB + 8) * 2);

  // 5. INNER FIELD MOTIFS & ASHTAMANGALA SYMBOLS
  const cx = w / 2;
  const cy = h / 2;

  if (isEntrance) {
    // ENTRANCE WELCOME VARIANT: Grand Royal Lotus Mandala + Twin Flanking Ashtamangala Medallions
    drawGrandMandalaMedallion(ctx, cx, cy, 210);

    // Left & Right Welcome Medallions (Treasure Vase & Golden Fishes)
    const leftX = cx - 260;
    const rightX = cx + 260;
    const sideSyms = ['vase', 'fish'];

    [leftX, rightX].forEach((xPos, idx) => {
      ctx.beginPath();
      ctx.arc(xPos, cy, 70, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.navyDeep;
      ctx.fill();
      ctx.strokeStyle = PALETTE.goldMetallic;
      ctx.lineWidth = 5;
      ctx.stroke();

      drawAshtamangalaIcon(ctx, sideSyms[idx], xPos, cy, 110);
      drawHimalayanCloud(ctx, xPos, cy - 110, 35, PALETTE.turquoise);
      drawHimalayanCloud(ctx, xPos, cy + 110, 35, PALETTE.turquoise);
    });

    // Top & Bottom Endless Knots
    [cy - 250, cy + 250].forEach((yPos) => {
      drawEndlessKnot(ctx, cx, yPos, 90, PALETTE.goldBright, 4);
    });

    // 4 Corner Spandrels
    drawCornerSpandrel(ctx, innerB + 10, innerB + 10, 160, 0);
    drawCornerSpandrel(ctx, w - innerB - 10, innerB + 10, 160, Math.PI / 2);
    drawCornerSpandrel(ctx, w - innerB - 10, h - innerB - 10, 160, Math.PI);
    drawCornerSpandrel(ctx, innerB + 10, h - innerB - 10, 160, -Math.PI / 2);
  } else if (isRunner) {
    // RUNNER VARIANT: All Eight Auspicious Symbols (Ashtamangala) lined along center axis
    const symbols = ['knot', 'fish', 'conch', 'vase', 'lotus', 'wheel'];
    const ys = [h * 0.18, h * 0.31, h * 0.44, h * 0.57, h * 0.7, h * 0.83];

    symbols.forEach((sym, idx) => {
      const sy = ys[idx];
      // Golden backdrop medallion
      ctx.beginPath();
      ctx.arc(cx, sy, 62, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.crimsonRich;
      ctx.fill();
      ctx.strokeStyle = PALETTE.goldMetallic;
      ctx.lineWidth = 4;
      ctx.stroke();

      drawAshtamangalaIcon(ctx, sym, cx, sy, 110);

      // Flanking cloud tendrils
      drawHimalayanCloud(ctx, cx - 140, sy, 40, PALETTE.turquoise);
      drawHimalayanCloud(ctx, cx + 140, sy, 40, PALETTE.turquoise);
    });
  } else if (isDragon) {
    // ROYAL DRAGON & CLOUD VARIANT: Twin Cloud Dragons chasing Flaming Pearl + Center Medallion
    drawGrandMandalaMedallion(ctx, cx, cy, 220);

    // Auspicious cloud bursts surrounding field
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const dx = cx + Math.cos(a) * 350;
      const dy = cy + Math.sin(a) * 350;
      drawHimalayanCloud(ctx, dx, dy, 70, PALETTE.turquoise);
      drawEndlessKnot(ctx, dx, dy, 80, PALETTE.goldBright, 3.5);
    }

    // 4 Corner Spandrels
    drawCornerSpandrel(ctx, innerB + 10, innerB + 10, 160, 0);
    drawCornerSpandrel(ctx, w - innerB - 10, innerB + 10, 160, Math.PI / 2);
    drawCornerSpandrel(ctx, w - innerB - 10, h - innerB - 10, 160, Math.PI);
    drawCornerSpandrel(ctx, innerB + 10, h - innerB - 10, 160, -Math.PI / 2);
  } else {
    // MANDALA VARIANT: Grand Durbar 32-Petal Vishvavajra Mandala + 4 Ashtamangala Medallions
    drawGrandMandalaMedallion(ctx, cx, cy, 270);

    // 4 Corner Spandrels
    drawCornerSpandrel(ctx, innerB + 10, innerB + 10, 180, 0);
    drawCornerSpandrel(ctx, w - innerB - 10, innerB + 10, 180, Math.PI / 2);
    drawCornerSpandrel(ctx, w - innerB - 10, h - innerB - 10, 180, Math.PI);
    drawCornerSpandrel(ctx, innerB + 10, h - innerB - 10, 180, -Math.PI / 2);

    // 4 Side Ashtamangala Medallions (Top, Bottom, Left, Right)
    const sideMedallions = [
      { sym: 'fish', x: cx, y: innerB + 100 },
      { sym: 'conch', x: cx, y: h - innerB - 100 },
      { sym: 'vase', x: innerB + 100, y: cy },
      { sym: 'wheel', x: w - innerB - 100, y: cy },
    ];

    sideMedallions.forEach((sm) => {
      ctx.beginPath();
      ctx.arc(sm.x, sm.y, 55, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.navyDeep;
      ctx.fill();
      ctx.strokeStyle = PALETTE.goldMetallic;
      ctx.lineWidth = 4;
      ctx.stroke();

      drawAshtamangalaIcon(ctx, sm.sym, sm.x, sm.y, 90);
    });
  }

  // 6. HIGH-DENSITY ORGANIC WOOL KNOT TEXTURE OVERLAY (40,000 Knot Specks)
  for (let i = 0; i < 40000; i++) {
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    const size = Math.random() * 1.6 + 0.4;
    const alpha = Math.random() * 0.07;
    ctx.fillStyle = Math.random() > 0.48 ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
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
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 1, y + 1, 2, 2);
      } else {
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 1, y + 1, 2, 2);
      }
    }
  }

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const val = Math.floor(128 + (Math.random() * 28 - 14));
    const hex = val.toString(16).padStart(2, '0');
    ctx.fillStyle = `#${hex}${hex}${hex}`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(28, 28);
  return texture;
}

function NepaleseCarpet({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = [4.2, 2.8], // [width, depth]
  variant = 'mandala', // 'mandala' | 'runner' | 'royal_dragon'
  hasFringes = true,
  fringeSide = 'x', // 'x' for left/right edges, 'z' for front/back edges
  pileThickness = 0.014, // 14mm authentic hand-knotted pile thickness
}) {
  const [width, depth] = size;

  // 1. Generate master procedural Nepalese carpet vector canvas texture
  const carpetMap = useMemo(() => createProceduralNepaleseCarpetTexture(variant), [variant]);

  // 2. Generate micro-knot wool bump texture
  const knotBumpMap = useMemo(() => createWoolKnotBumpTexture(), []);

  // 3. Compute fringe placements along the short ends
  const fringeData = useMemo(() => {
    if (!hasFringes) return [];
    const count = 64; // High-density fringe tassels
    const items = [];
    const span = fringeSide === 'x' ? depth : width;
    const start = -span / 2 + 0.03;
    const step = (span - 0.06) / (count - 1);

    for (let i = 0; i < count; i++) {
      const pos = start + i * step;
      const rot = (Math.random() - 0.5) * 0.18;
      const length = 0.15 + (Math.random() - 0.5) * 0.025;
      const tint = Math.random() > 0.3 ? '#f7f2e6' : '#ede5d3';
      items.push({ pos, rot, length, tint, id: i });
    }
    return items;
  }, [hasFringes, fringeSide, width, depth]);

  const halfW = width / 2;
  const halfD = depth / 2;
  const fringeY = pileThickness * 0.35;

  return (
    <group position={position} rotation={rotation}>
      {/* 1. MAIN CARPET PILE (3D Box with procedural canvas carpet map and wool bump texture) */}
      <mesh position={[0, pileThickness / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, pileThickness, depth]} />
        <meshStandardMaterial
          map={carpetMap}
          bumpMap={knotBumpMap}
          bumpScale={0.009}
          roughness={0.8}
          metalness={0.03}
          envMapIntensity={0.4}
        />
      </mesh>

      {/* 2. WOVEN EDGE BINDING (Bevel framing around all 4 perimeter edges) */}
      {[-halfD, halfD].map((z, idx) => (
        <mesh key={`bind-z-${idx}`} position={[0, pileThickness / 2, z]}>
          <boxGeometry args={[width + 0.025, pileThickness + 0.003, 0.025]} />
          <meshStandardMaterial
            color={variant === 'runner' ? PALETTE.navyDeep : PALETTE.ebonyTrim}
            roughness={0.9}
          />
        </mesh>
      ))}
      {[-halfW, halfW].map((x, idx) => (
        <mesh key={`bind-x-${idx}`} position={[x, pileThickness / 2, 0]}>
          <boxGeometry args={[0.025, pileThickness + 0.003, depth + 0.025]} />
          <meshStandardMaterial
            color={variant === 'runner' ? PALETTE.navyDeep : PALETTE.ebonyTrim}
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* 3. TRADITIONAL HAND-TIED END FRINGES (Ivory wool tassels extending outward) */}
      {hasFringes && fringeSide === 'x' && (
        <>
          {/* Left End Fringes */}
          <group position={[-halfW - 0.075, fringeY, 0]}>
            {fringeData.map((f) => (
              <mesh
                key={`fringe-l-${f.id}`}
                position={[0, 0, f.pos]}
                rotation={[0, f.rot, 0]}
                receiveShadow
              >
                <boxGeometry args={[f.length, 0.0035, 0.01]} />
                <meshStandardMaterial color={f.tint} roughness={0.95} />
              </mesh>
            ))}
          </group>
          {/* Right End Fringes */}
          <group position={[halfW + 0.075, fringeY, 0]}>
            {fringeData.map((f) => (
              <mesh
                key={`fringe-r-${f.id}`}
                position={[0, 0, f.pos]}
                rotation={[0, -f.rot, 0]}
                receiveShadow
              >
                <boxGeometry args={[f.length, 0.0035, 0.01]} />
                <meshStandardMaterial color={f.tint} roughness={0.95} />
              </mesh>
            ))}
          </group>
        </>
      )}

      {hasFringes && fringeSide === 'z' && (
        <>
          {/* Front End Fringes */}
          <group position={[0, fringeY, halfD + 0.075]}>
            {fringeData.map((f) => (
              <mesh
                key={`fringe-f-${f.id}`}
                position={[f.pos, 0, 0]}
                rotation={[f.rot, 0, 0]}
                receiveShadow
              >
                <boxGeometry args={[0.01, 0.0035, f.length]} />
                <meshStandardMaterial color={f.tint} roughness={0.95} />
              </mesh>
            ))}
          </group>
          {/* Back End Fringes */}
          <group position={[0, fringeY, -halfD - 0.075]}>
            {fringeData.map((f) => (
              <mesh
                key={`fringe-b-${f.id}`}
                position={[f.pos, 0, 0]}
                rotation={[-f.rot, 0, 0]}
                receiveShadow
              >
                <boxGeometry args={[0.01, 0.0035, f.length]} />
                <meshStandardMaterial color={f.tint} roughness={0.95} />
              </mesh>
            ))}
          </group>
        </>
      )}
    </group>
  );
}

export default memo(NepaleseCarpet);
