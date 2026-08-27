import * as THREE from 'three';

/**
 * Moulding Sweep Utility
 * Sweeps an arbitrary 2D cross-section (classical moulding profiles) around a
 * mitered rectangular loop — used by picture frames and the crown cornice.
 *
 * Profile points are [u, v] pairs: u = distance inward from the outer back
 * plane, v = height from the profile base. The loop auto-closes.
 */

const DEFAULT_GRAIN_TILE = 1;
const DEFAULT_BACK_Z = 0;

/**
 * Subdivides each profile segment with a Catmull-Rom midpoint so crests and
 * coves read as smooth curves; midpoints are clamped to the segment envelope
 * so tight features cannot overshoot the footprint. Degenerate midpoints that
 * collapse onto an endpoint are dropped.
 */
export function smoothClosedLoop(points) {
  const n = points.length;
  const next = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    next.push(p1);
    const mu = THREE.MathUtils.clamp(
      (10 * p1.u + 10 * p2.u - p0.u - p3.u) / 16,
      Math.min(p1.u, p2.u),
      Math.max(p1.u, p2.u)
    );
    const mv = THREE.MathUtils.clamp(
      (10 * p1.v + 10 * p2.v - p0.v - p3.v) / 16,
      Math.min(p1.v, p2.v),
      Math.max(p1.v, p2.v)
    );
    const nearP1 = Math.abs(mu - p1.u) < 1e-9 && Math.abs(mv - p1.v) < 1e-9;
    const nearP2 = Math.abs(mu - p2.u) < 1e-9 && Math.abs(mv - p2.v) < 1e-9;
    if (!nearP1 && !nearP2) next.push({ u: mu, v: mv });
  }
  return next;
}

function makeRailGeometry(profile, length, originX, originY, dirX, dirY, inX, inY, capTris, grainTile, backZ) {
  const n = profile.length;
  const arc = [0];
  for (let i = 1; i <= n; i++) {
    const a = profile[i - 1];
    const b = profile[i % n];
    arc.push(arc[i - 1] + Math.hypot(b.u - a.u, b.v - a.v));
  }

  // Mirrored placements (basis dir x inward pointing away from wall) invert
  // triangle orientation — detect and counter-rotate so normals face outward
  const flipped = dirX * inY - dirY * inX < 0;

  const pos = [];
  const uv = [];

  // 45° miter ends: the cut recedes along the rail axis by the profile's
  // inset u, so adjoining rails share one diagonal cut plane per corner
  const endT = (sign, i) => sign * (length / 2 - profile[((i % n) + n) % n].u);

  const vert = (t, i) => {
    const p = profile[i % n];
    return [
      originX + dirX * t + inX * p.u,
      originY + dirY * t + inY * p.u,
      backZ + p.v,
      arc[i % n] / grainTile,
      t / grainTile,
    ];
  };

  const tri = (a, b, c) => {
    pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    uv.push(a[3], a[4], b[3], b[4], c[3], c[4]);
  };

  for (let i = 0; i < n; i++) {
    const a0 = vert(endT(-1, i), i);
    const b0 = vert(endT(-1, i + 1), i + 1);
    const a1 = vert(endT(1, i), i);
    const b1 = vert(endT(1, i + 1), i + 1);
    if (flipped) {
      tri(a0, a1, b1);
      tri(a0, b1, b0);
    } else {
      tri(a0, b1, a1);
      tri(a0, b0, b1);
    }
  }

  // Mitered end caps: shearing the profile loop onto each cut plane is an
  // affine map, so the ear-clipped triangulation of the (possibly concave)
  // profile stays valid. Winding per end matches the outward rail axis via
  // the projected loop's Newell signed area.
  [1, -1].forEach((sign) => {
    const pts = profile.map((_, i) => vert(endT(sign, i), i));
    let nx = 0;
    let ny = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      nx += (a[1] - b[1]) * (a[2] + b[2]);
      ny += (a[2] - b[2]) * (a[0] + b[0]);
    }
    const outward = sign * (nx * dirX + ny * dirY) >= 0;
    capTris.forEach(([ia, ib, ic]) => {
      if (outward) tri(pts[ia], pts[ib], pts[ic]);
      else tri(pts[ia], pts[ic], pts[ib]);
    });
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/**
 * Builds the full mitered rectangular loop for a moulding profile.
 * All four rails run the full outer dimension and are miter-cut at both ends,
 * so adjoining rails share one 45° diagonal plane per corner with no gap or
 * overlap. Returns a single merged BufferGeometry (positions + uvs + normals).
 */
export function buildMiteredLoopGeometry(profilePairs, outerW, outerH, opts = {}) {
  const grainTile = opts.grainTile ?? DEFAULT_GRAIN_TILE;
  const backZ = opts.backZ ?? DEFAULT_BACK_Z;

  const profile = smoothClosedLoop(
    profilePairs.map(([u, v]) => ({ u, v }))
  );
  const hx = outerW / 2;
  const hy = outerH / 2;

  const contour = profile.map((p) => new THREE.Vector2(p.u, p.v));
  let area2 = 0;
  for (let i = 0; i < contour.length; i++) {
    const a = contour[i];
    const b = contour[(i + 1) % contour.length];
    area2 += a.x * b.y - b.x * a.y;
  }
  // Normalize to CCW without reordering the contour so triangle indices stay
  // aligned with the original profile array used by makeRailGeometry
  const rawTris = THREE.ShapeUtils.triangulateShape(contour, []);
  const capTris = area2 < 0 ? rawTris.map(([a, b, c]) => [a, c, b]) : rawTris;

  const rails = [
    makeRailGeometry(profile, outerW, 0, -hy, 1, 0, 0, 1, capTris, grainTile, backZ),
    makeRailGeometry(profile, outerW, 0, hy, 1, 0, 0, -1, capTris, grainTile, backZ),
    makeRailGeometry(profile, outerH, hx, 0, 0, 1, -1, 0, capTris, grainTile, backZ),
    makeRailGeometry(profile, outerH, -hx, 0, 0, -1, 1, 0, capTris, grainTile, backZ),
  ];

  const total = rails.reduce((s, g) => s + g.attributes.position.count, 0);
  const positions = new Float32Array(total * 3);
  const uvs = new Float32Array(total * 2);
  let offset = 0;
  rails.forEach((g) => {
    positions.set(g.attributes.position.array, offset * 3);
    uvs.set(g.attributes.uv.array, offset * 2);
    offset += g.attributes.position.count;
    g.dispose();
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.computeVertexNormals();
  return merged;
}
