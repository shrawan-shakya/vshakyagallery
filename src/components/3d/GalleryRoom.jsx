import React, { useMemo, memo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import EntranceWall from './EntranceWall';
import CeilingDetail from './CeilingDetail';
import NepaleseCarpet from './NepaleseCarpet';
import AimTargets from './AimTargets';
import { ROOM_H } from '../../constants';
import { buildMiteredLoopGeometry } from '../../utils/moulding';
import { getHallLayout } from '../../utils/hallLayouts';
import { QUALITY_TIERS } from '../../utils/quality';

// Initialize RectAreaLight shader support in Three.js WebGLRenderer
if (typeof window !== 'undefined') {
  RectAreaLightUniformsLib.init();
}

// Classical crown-moulding cross-section (u = inward from wall, v = up from base):
// scribe foot -> bed mould -> cyma cove -> ovolo swell -> projecting corona
// edge -> ceiling soffit. Swept as one mitered loop around the room perimeter.
const CROWN_PROFILE = [
  [0.0, 0.0],
  [0.012, 0.004],
  [0.05, 0.014],
  [0.072, 0.046],
  [0.062, 0.082],
  [0.042, 0.116],
  [0.06, 0.154],
  [0.104, 0.186],
  [0.142, 0.204],
  [0.168, 0.224],
  [0.164, 0.238],
  [0.144, 0.246],
  [0.02, 0.248],
  [0.0, 0.248],
];
const CROWN_H = 0.248;
// Loop outer half-size 10.115 buries the back plane inside the wall solid so
// the wall/crown junction can never show a gap seam
const CORNICE_GEO = buildMiteredLoopGeometry(CROWN_PROFILE, 20.23, 20.23, { grainTile: 0.5 });

// Track-light fixtures share one geometry + material set across every head
const TRACK_MAT = new THREE.MeshStandardMaterial({ color: '#1a1a1a', metalness: 0.8, roughness: 0.15 });
const HEAD_GEO = new THREE.CylinderGeometry(0.042, 0.055, 0.16, 10);
const LENS_GEO = new THREE.CylinderGeometry(0.038, 0.038, 0.014, 10);
const LENS_MAT = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  emissive: '#eaf4ff',
  emissiveIntensity: 2.6,
  roughness: 0.3,
});

const SKIRT_COLOR = '#07070a';
const CROWN_COLOR = '#191922';

// ---------------------------------------------------------------------------
// Procedural surface textures (dark concrete floor, drywall plaster). Built
// once per page; the random grit lives here, outside of render.
// ---------------------------------------------------------------------------
function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return [canvas, canvas.getContext('2d')];
}

function makeRepeatTexture(canvas, repeat) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  return texture;
}

// Concrete slab grout grid: four lines each way across a 512px tile
function drawSlabGrid(ctx, strokeStyle) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 4;
  for (let offset = 0; offset <= 512; offset += 128) {
    ctx.beginPath(); ctx.moveTo(offset, 0); ctx.lineTo(offset, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, offset); ctx.lineTo(512, offset); ctx.stroke();
  }
}

// Random speckle noise; `shade` turns a random [0,1) into a fillStyle
function sprinkle(ctx, size, count, maxDot, shade) {
  for (let i = 0; i < count; i++) {
    const dot = Math.random() * maxDot;
    ctx.fillStyle = shade(Math.random());
    ctx.fillRect(Math.random() * size, Math.random() * size, dot, dot);
  }
}

function grayHex(value) {
  const hex = Math.round(value).toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
}

function makeFloorTexture() {
  const [canvas, ctx] = makeCanvas(512);
  ctx.fillStyle = '#101014';
  ctx.fillRect(0, 0, 512, 512);
  sprinkle(ctx, 512, 6000, 1.5, (r) => `rgba(255, 255, 255, ${r * 0.05})`);
  drawSlabGrid(ctx, '#222229');
  return makeRepeatTexture(canvas, 10);
}

function makeFloorBumpTexture() {
  const [canvas, ctx] = makeCanvas(512);
  ctx.fillStyle = '#808080'; // neutral gray = no height
  ctx.fillRect(0, 0, 512, 512);
  sprinkle(ctx, 512, 8000, 2, (r) => grayHex(128 + r * 24 - 12));
  drawSlabGrid(ctx, '#000000'); // black = deeply recessed grout
  return makeRepeatTexture(canvas, 10);
}

function makeWallBumpTexture() {
  const [canvas, ctx] = makeCanvas(128);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);
  sprinkle(ctx, 128, 4000, 1.5, (r) => grayHex(128 + r * 10 - 5));
  return makeRepeatTexture(canvas, 15);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
function TubeLight({ position, length }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[length + 0.4, 0.06, 0.18]} />
        <meshStandardMaterial color="#15151a" metalness={0.75} roughness={0.35} />
      </mesh>

      <mesh position={[0, -0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, length, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#dff1ff" emissiveIntensity={3} roughness={0.25} />
      </mesh>

      {[-length / 2, length / 2].map((x) => (
        <mesh key={`cap-${x}`} position={[x, -0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.14, 12]} />
          <meshStandardMaterial color="#2b2b33" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// One linear area light per tube ROW rather than per fixture. Rect area
// lights are the most expensive light type in the standard shader, and a
// single strip spanning both tubes gives the same downward wash.
function TubeRowLight({ z, span }) {
  return (
    <rectAreaLight
      position={[0, ROOM_H - 0.2, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      width={span}
      height={0.2}
      intensity={12}
      color="#dfeeff"
    />
  );
}

// Internal partition wall (freestanding slab or perimeter-attached baffle).
// Tall baffles get a crown-style cap; all get a baseboard.
function HallPartition({ p, color, bump }) {
  return (
    <group position={[p.x, p.h / 2, p.z]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[p.w, p.h, p.d]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} bumpMap={bump} bumpScale={0.002} roughness={0.95} />
      </mesh>
      <mesh position={[0, -p.h / 2 + 0.05, 0]}>
        <boxGeometry args={[p.w + 0.02, 0.1, p.d + 0.02]} />
        <meshStandardMaterial color={SKIRT_COLOR} roughness={0.6} />
      </mesh>
      {p.h >= 4.5 && (
        <mesh position={[0, p.h / 2 - 0.04, 0]}>
          <boxGeometry args={[p.w + 0.04, 0.08, p.d + 0.04]} />
          <meshStandardMaterial color={CROWN_COLOR} roughness={0.5} metalness={0} envMapIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// Wrapped grid pillar anchored to a round sculpture plinth — a central
// display island. The pillar reads as structure; the plinth carries works.
function DisplayIsland({ island }) {
  const s = island.size;
  return (
    <group position={[island.x, 0, island.z]}>
      <mesh position={[0, ROOM_H / 2, 0]} castShadow>
        <boxGeometry args={[s, ROOM_H, s]} />
        <meshStandardMaterial color="#17171d" roughness={0.55} metalness={0.25} envMapIntensity={0.45} />
      </mesh>
      <mesh position={[0, 2.62, 0]}>
        <boxGeometry args={[s + 0.05, 0.05, s + 0.05]} />
        <meshStandardMaterial color="#26262e" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.09, 0]} castShadow>
        <boxGeometry args={[s + 0.1, 0.18, s + 0.1]} />
        <meshStandardMaterial color={SKIRT_COLOR} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.475, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.58, 0.95, 24]} />
        <meshStandardMaterial color="#101014" roughness={0.85} metalness={0.02} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.955, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.015, 24]} />
        <meshStandardMaterial color="#26262e" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Narrow-beam accent fixture dedicated to a display island (visual housing +
// one real tight spotlight aimed straight down the plinth)
function AccentSpot({ x, z }) {
  const lightRef = useRef(null);
  // SpotLight aims at its .target object, which must live in the scene graph
  const beamTarget = useMemo(() => {
    const t = new THREE.Object3D();
    t.position.set(x, 0.95, z);
    return t;
  }, [x, z]);
  useEffect(() => {
    if (lightRef.current) lightRef.current.target = beamTarget;
  }, [beamTarget]);

  return (
    <group>
      <primitive object={beamTarget} />
      <group position={[x, ROOM_H - 0.12, z]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.095, 0.22, 12]} />
          <meshStandardMaterial color="#15151a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.03, 12]} />
          <meshStandardMaterial color="#ffffff" emissive="#eaf4ff" emissiveIntensity={3.4} roughness={0.25} />
        </mesh>
      </group>
      <spotLight
        ref={lightRef}
        position={[x, ROOM_H - 0.28, z]}
        angle={0.32}
        penumbra={0.55}
        distance={7}
        intensity={42}
        decay={2}
        color="#e8f1ff"
      />
    </group>
  );
}

// Concealed LED cove strips at the upper soffits — pure emissive so the
// bloom pass bounces soft indirect light off the ceiling plane
function CoveStrips() {
  const y = ROOM_H - 0.3;
  const off = 9.76;
  const len = 19.4;
  return (
    <group>
      {[
        { pos: [0, y, -off], rot: [0, 0, 0] },
        { pos: [0, y, off], rot: [0, 0, 0] },
        { pos: [-off, y, 0], rot: [0, Math.PI / 2, 0] },
        { pos: [off, y, 0], rot: [0, Math.PI / 2, 0] },
      ].map((c, i) => (
        <group key={`cove-${i}`} position={c.pos} rotation={c.rot}>
          <mesh>
            <boxGeometry args={[len, 0.07, 0.05]} />
            <meshStandardMaterial color="#15151a" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.045, 0.005]}>
            <boxGeometry args={[len, 0.022, 0.03]} />
            <meshStandardMaterial color="#fff8ee" emissive="#ffe9c4" emissiveIntensity={2.4} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TrackHead({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={HEAD_GEO} material={TRACK_MAT} />
      <mesh geometry={LENS_GEO} material={LENS_MAT} position={[0, -0.085, 0]} />
    </group>
  );
}

// Perimeter runs parallel to the display walls with heads angled 30 degrees
// off vertical toward the art (glare / shadow control)
function PerimeterTrack({ inset, headSpacing }) {
  const bar = 9.9 - inset;
  const span = bar * 2;
  const tilt = Math.PI / 6;

  const heads = useMemo(() => {
    const list = [];
    for (let v = -bar + headSpacing / 2; v <= bar - 0.01; v += headSpacing) list.push(v);
    return list;
  }, [bar, headSpacing]);

  // Head canister: local -Y is the beam axis. rotX tilts the beam toward
  // -Z (back) / +Z (front); rotZ toward -X (left) / +X (right).
  const sides = [
    { key: 'back', at: (v) => [v, -0.02, -bar], rot: [tilt, 0, 0] },
    { key: 'front', at: (v) => [v, -0.02, bar], rot: [-tilt, 0, 0] },
    { key: 'left', at: (v) => [-bar, -0.02, v], rot: [0, 0, -tilt] },
    { key: 'right', at: (v) => [bar, -0.02, v], rot: [0, 0, tilt] },
  ];

  return (
    <group position={[0, ROOM_H - 0.2, 0]}>
      {[-bar, bar].map((z) => (
        <mesh key={`pt-z-${z}`} position={[0, 0, z]} material={TRACK_MAT}>
          <boxGeometry args={[span, 0.04, 0.05]} />
        </mesh>
      ))}
      {[-bar, bar].map((x) => (
        <mesh key={`pt-x-${x}`} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={TRACK_MAT}>
          <boxGeometry args={[span, 0.04, 0.05]} />
        </mesh>
      ))}
      {sides.flatMap((side) =>
        heads.map((v) => (
          <TrackHead key={`head-${side.key}-${v}`} position={side.at(v)} rotation={side.rot} />
        ))
      )}
    </group>
  );
}

// Classic concentric square track frame at +/-8
function FrameTrack() {
  return (
    <group position={[0, ROOM_H - 0.2, 0]}>
      {[-8, 8].map((z) => (
        <mesh key={`track-x-${z}`} position={[0, 0, z]} material={TRACK_MAT}>
          <boxGeometry args={[16, 0.04, 0.04]} />
        </mesh>
      ))}
      {[-8, 8].map((x) => (
        <mesh key={`track-z-${x}`} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={TRACK_MAT}>
          <boxGeometry args={[16, 0.04, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Room
// ---------------------------------------------------------------------------
function GalleryRoom({ wallColor = '#ffffff', hallLayout = 'classic', quality = QUALITY_TIERS.high }) {
  const hall = useMemo(() => getHallLayout(hallLayout), [hallLayout]);
  const lp = hall.lightingPlan;

  const floorTexture = useMemo(() => makeFloorTexture(), []);
  const floorBumpTexture = useMemo(() => makeFloorBumpTexture(), []);
  const wallBumpTexture = useMemo(() => makeWallBumpTexture(), []);

  // One area light strip per tube row, spanning from the first tube's far
  // end to the last tube's far end
  const tubeSpan = Math.max(...lp.tubeXs) - Math.min(...lp.tubeXs) + lp.tubeLength;

  const wallMat = (
    <meshStandardMaterial
      color={wallColor}
      emissive={wallColor}
      emissiveIntensity={0.18}
      bumpMap={wallBumpTexture}
      bumpScale={0.002}
      roughness={0.95}
    />
  );
  const skirtMat = <meshStandardMaterial color={SKIRT_COLOR} roughness={0.6} metalness={0.05} envMapIntensity={0.4} />;

  const wallRuns = [
    { pos: [0, -9.883], rotY: 0 },
    { pos: [0, 9.883], rotY: Math.PI },
    { pos: [-9.883, 0], rotY: Math.PI / 2 },
    { pos: [9.883, 0], rotY: -Math.PI / 2 },
  ];
  const roomCorners = [
    [-9.85, -9.85],
    [9.85, -9.85],
    [-9.85, 9.85],
    [9.85, 9.85],
  ];

  return (
    <group>
      {/* Structure the walk-mode aim ray may hit or be blocked by */}
      <AimTargets>
        {/* 1. FLOOR (bump-mapped concrete with a soft sheen) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial
            map={floorTexture}
            bumpMap={floorBumpTexture}
            bumpScale={0.004}
            roughness={0.25}
            metalness={0.1}
            envMapIntensity={0.9}
          />
        </mesh>

        {/* 2. WALLS (drywall plaster bump map for micro-shadows) */}
        <mesh position={[0, ROOM_H / 2, -10]} receiveShadow>
          <boxGeometry args={[20, ROOM_H, 0.2]} />
          {wallMat}
        </mesh>
        <mesh position={[-10, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[20, ROOM_H, 0.2]} />
          {wallMat}
        </mesh>
        <mesh position={[10, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[20, ROOM_H, 0.2]} />
          {wallMat}
        </mesh>

        {/* Front wall replaced by entrance assembly: segmented wall, doorway,
            vestibule, double doors and title lettering */}
        <EntranceWall wallBump={wallBumpTexture} wallColor={wallColor} />

        {/* 3. INTERNAL PARTITIONS — hall-layout driven (center partition or baffles) */}
        {hall.partitions.map((p) => (
          <HallPartition key={p.id} p={p} color={wallColor} bump={wallBumpTexture} />
        ))}

        {/* 4. CENTRAL DISPLAY ISLANDS (Chronological Loop): wrapped pillars + plinths */}
        {hall.islands.map((island) => (
          <DisplayIsland key={island.id} island={island} />
        ))}
      </AimTargets>

      {/* Traditional Nepalese hand-knotted wool carpets — procedural */}
      <NepaleseCarpet position={[0, 0.001, -4.0]} size={[4.2, 2.8]} variant="mandala" fringeThreads={quality.fringeThreads} />
      <NepaleseCarpet position={[0, 0.001, 5.5]} size={[4.4, 2.4]} variant="mandala" fringeThreads={quality.fringeThreads} />
      <NepaleseCarpet position={[-5.2, 0.001, -1.0]} size={[3.2, 2.2]} variant="royal_dragon" fringeThreads={quality.fringeThreads} />
      <NepaleseCarpet position={[5.2, 0.001, -1.0]} size={[3.2, 2.2]} variant="royal_dragon" fringeThreads={quality.fringeThreads} />

      {/* 5. CEILING */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <CeilingDetail />

      {/* Ceiling crown cornice — classical swept profile, mitered corners,
          laid flat 2mm below the ceiling plane (no coplanar faces) */}
      <mesh
        geometry={CORNICE_GEO}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, ROOM_H - CROWN_H - 0.002, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={CROWN_COLOR}
          bumpMap={wallBumpTexture}
          bumpScale={0.0012}
          roughness={0.5}
          metalness={0}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Floor skirting (stepped simple cornice) with plinth blocks.
          Front run splits around the entrance opening. */}
      <group>
        {wallRuns.map((run, i) => {
          const isFront = run.pos[1] === 10;
          const offsets = isFront ? [-5.7, 5.7] : [0];
          const spanW = isFront ? 8.6 : 20;
          return (
            <group key={`skirt-${i}`} position={[run.pos[0], 0, run.pos[1]]} rotation={[0, run.rotY, 0]}>
              {offsets.map((ox) => (
                <group key={ox} position={[ox, 0, 0]}>
                  <mesh position={[0, 0.07, 0]} receiveShadow>
                    <boxGeometry args={[spanW, 0.14, 0.035]} />
                    {skirtMat}
                  </mesh>
                  <mesh position={[0, 0.1525, 0.01]}>
                    <boxGeometry args={[spanW, 0.025, 0.055]} />
                    {skirtMat}
                  </mesh>
                </group>
              ))}
            </group>
          );
        })}
        {roomCorners.map(([cx, cz], i) => (
          <mesh key={`plinth-${i}`} position={[cx, 0.0825, cz]} receiveShadow castShadow>
            <boxGeometry args={[0.18, 0.165, 0.18]} />
            {skirtMat}
          </mesh>
        ))}
      </group>

      {/* Baseboards for outer walls */}
      <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0, -9.89]}>
          <boxGeometry args={[20, 0.1, 0.02]} />
          <meshStandardMaterial color={SKIRT_COLOR} />
        </mesh>
        <mesh position={[-9.89, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[20, 0.1, 0.02]} />
          <meshStandardMaterial color={SKIRT_COLOR} />
        </mesh>
        <mesh position={[9.89, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[20, 0.1, 0.02]} />
          <meshStandardMaterial color={SKIRT_COLOR} />
        </mesh>
      </group>

      {/* Ceiling tube lights — rows aligned with the skipped grid axes in
          CeilingDetail — plus one linear area light per row */}
      {lp.tubeRows.flatMap((z) =>
        lp.tubeXs.map((x) => (
          <TubeLight key={`tube-${x}-${z}`} position={[x, ROOM_H - 0.06, z]} length={lp.tubeLength} />
        ))
      )}
      {quality.rectAreaLights &&
        lp.tubeRows.map((z) => <TubeRowLight key={`tube-row-${z}`} z={z} span={tubeSpan} />)}

      {/* Concealed cove lighting — Chronological Loop soffit bounce */}
      {lp.cove && <CoveStrips />}

      {/* Narrow-beam accent spots dedicated to sculpture islands */}
      {lp.accentSpots.map((x) => (
        <AccentSpot key={`accent-${x}`} x={x} z={lp.accentZ} />
      ))}

      {/* Ceiling track lighting */}
      {lp.trackStyle === 'perimeter' ? (
        <PerimeterTrack inset={lp.trackInset} headSpacing={lp.headSpacing} />
      ) : (
        <FrameTrack />
      )}
    </group>
  );
}

export default memo(GalleryRoom);
