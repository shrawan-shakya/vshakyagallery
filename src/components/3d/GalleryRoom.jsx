import React, { useMemo, memo, useEffect } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import EntranceWall from './EntranceWall';
import CeilingDetail from './CeilingDetail';
import NepaleseCarpet from './NepaleseCarpet';
import { ROOM_H } from '../../constants';
import { buildMiteredLoopGeometry } from '../../utils/moulding';
import { getHallLayout } from '../../utils/hallLayouts';

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

function TubeLight({ position, length, isDark }) {
  const capOffsets = [-length / 2, length / 2];

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[length + 0.4, 0.06, 0.18]} />
        <meshStandardMaterial color="#15151a" metalness={0.75} roughness={0.35} />
      </mesh>

      <mesh position={[0, -0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, length, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isDark ? '#dff1ff' : '#fff4e0'}
          emissiveIntensity={isDark ? 3 : 2.1}
          roughness={0.25}
        />
      </mesh>

      {capOffsets.map((x) => (
        <mesh key={`cap-${x}`} position={[x, -0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.14, 12]} />
          <meshStandardMaterial color="#2b2b33" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}

      {/* Linear Rectangular Area Light emitting soft uniform light downward along the length */}
      <rectAreaLight
        position={[0, -0.14, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={length}
        height={0.2}
        intensity={isDark ? 14 : 9}
        color={isDark ? '#dfeeff' : '#fff2dc'}
      />
    </group>
  );
}

// Internal partition wall (freestanding slab or perimeter-attached baffle).
// Tall baffles get a crown-style cap; all get a baseboard.
function HallPartition({ p, color, bump, isDark }) {
  return (
    <group position={[p.x, p.h / 2, p.z]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[p.w, p.h, p.d]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isDark ? 0.18 : 0.1} bumpMap={bump} bumpScale={0.002} roughness={0.95} />
      </mesh>
      <mesh position={[0, -p.h / 2 + 0.05, 0]}>
        <boxGeometry args={[p.w + 0.02, 0.1, p.d + 0.02]} />
        <meshStandardMaterial color={isDark ? '#07070a' : '#322b26'} roughness={0.6} />
      </mesh>
      {p.h >= 4.5 && (
        <mesh position={[0, p.h / 2 - 0.04, 0]}>
          <boxGeometry args={[p.w + 0.04, 0.08, p.d + 0.04]} />
          <meshStandardMaterial color={isDark ? '#191922' : '#f7f3ea'} roughness={0.5} metalness={0} envMapIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// Wrapped grid pillar anchored to a round sculpture plinth — a central
// display island. The pillar reads as structure; the plinth carries works.
function DisplayIsland({ island, isDark }) {
  const s = island.size;
  return (
    <group position={[island.x, 0, island.z]}>
      <mesh position={[0, ROOM_H / 2, 0]} castShadow>
        <boxGeometry args={[s, ROOM_H, s]} />
        <meshStandardMaterial
          color={isDark ? '#17171d' : '#efeae0'}
          roughness={0.55}
          metalness={0.25}
          envMapIntensity={0.45}
        />
      </mesh>
      <mesh position={[0, 2.62, 0]}>
        <boxGeometry args={[s + 0.05, 0.05, s + 0.05]} />
        <meshStandardMaterial color={isDark ? '#26262e' : '#d9d2c4'} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.09, 0]} castShadow>
        <boxGeometry args={[s + 0.1, 0.18, s + 0.1]} />
        <meshStandardMaterial color={isDark ? '#07070a' : '#322b26'} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.475, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.58, 0.95, 24]} />
        <meshStandardMaterial
          color={isDark ? '#101014' : '#f4efe6'}
          roughness={0.85}
          metalness={0.02}
          envMapIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, 0.955, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.015, 24]} />
        <meshStandardMaterial color={isDark ? '#26262e' : '#d9d2c4'} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Narrow-beam accent fixture dedicated to a display island (visual housing +
// one real tight spotlight aimed straight down the plinth)
function AccentSpot({ x, z, isDark }) {
  const lightRef = React.useRef(null);
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
          <meshStandardMaterial
            color="#ffffff"
            emissive={isDark ? '#eaf4ff' : '#fff4e0'}
            emissiveIntensity={isDark ? 3.4 : 2.2}
            roughness={0.25}
          />
        </mesh>
      </group>
      <spotLight
        ref={lightRef}
        position={[x, ROOM_H - 0.28, z]}
        angle={0.32}
        penumbra={0.55}
        distance={7}
        intensity={isDark ? 42 : 20}
        decay={2}
        color={isDark ? '#e8f1ff' : '#fff2dc'}
      />
    </group>
  );
}

// Concealed LED cove strips at the upper soffits — pure emissive so the
// bloom pass bounces soft indirect light off the ceiling plane
function CoveStrips({ isDark }) {
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
            <meshStandardMaterial
              color="#fff8ee"
              emissive={isDark ? '#ffe9c4' : '#fff4e0'}
              emissiveIntensity={isDark ? 2.4 : 1.5}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GalleryRoom({ theme, wallColor = '#ffffff', hallLayout = 'classic' }) {
  const isDark = theme === 'dark';
  const hall = useMemo(() => getHallLayout(hallLayout), [hallLayout]);
  const lp = hall.lightingPlan;

  // 1. Procedural Floor Color Texture (Warm parquet wood or dark concrete)
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (isDark) {
      // Dark theme: Concrete slabs
      ctx.fillStyle = '#101014';
      ctx.fillRect(0, 0, 512, 512);

      // Fine concrete grit noise
      for (let i = 0; i < 6000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 1.5;
        const opacity = Math.random() * 0.05;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(x, y, size, size);
      }

      // Tile borders
      ctx.strokeStyle = '#222229';
      ctx.lineWidth = 4;
      for (let offset = 0; offset <= 512; offset += 128) {
        ctx.beginPath(); ctx.moveTo(offset, 0); ctx.lineTo(offset, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, offset); ctx.lineTo(512, offset); ctx.stroke();
      }
    } else {
      // Light theme: Oak wood parquet
      ctx.fillStyle = '#f5e4cc';
      ctx.fillRect(0, 0, 512, 512);

      // Fine wood grain fibers
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = Math.random() * 120 + 60;
        const opacity = Math.random() * 0.06;
        ctx.fillStyle = `rgba(120, 75, 35, ${opacity})`;
        ctx.fillRect(x, y, len, 1);
      }

      // Plank dividers
      ctx.strokeStyle = '#dabfa3';
      ctx.lineWidth = 2.5;
      for (let y = 0; y <= 512; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();

        const offset = (y % 64 === 0) ? 64 : 0;
        for (let x = 0; x <= 512; x += 128) {
          ctx.beginPath(); ctx.moveTo(x + offset, y); ctx.lineTo(x + offset, y + 32); ctx.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }, [isDark]);

  // 2. Procedural Floor Bump Map (adds displacement depth for wood plank gaps and concrete grit)
  const floorBumpTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Neutral gray background (no bump height)
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    if (isDark) {
      // Concrete roughness noise
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 2;
        const brightness = Math.random() * 24 - 12; // light height variation
        const hex = Math.round(128 + brightness).toString(16).padStart(2, '0');
        ctx.fillStyle = `#${hex}${hex}${hex}`;
        ctx.fillRect(x, y, size, size);
      }

      // Recessed grout lines (black = deeply recessed)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      for (let offset = 0; offset <= 512; offset += 128) {
        ctx.beginPath(); ctx.moveTo(offset, 0); ctx.lineTo(offset, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, offset); ctx.lineTo(512, offset); ctx.stroke();
      }
    } else {
      // Wood plank height variations
      for (let y = 0; y < 512; y += 32) {
        const offset = (y % 64 === 0) ? 64 : 0;
        for (let x = 0; x < 512; x += 128) {
          // Give each wood plank a slightly different height shading
          const heightTint = Math.floor(Math.random() * 8) - 4;
          const hex = (128 + heightTint).toString(16);
          ctx.fillStyle = `#${hex}${hex}${hex}`;
          ctx.fillRect(x + offset, y, 128, 32);
        }
      }

      // Very fine noise for wood grain bump
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = Math.random() * 80 + 30;
        const brightness = Math.random() * 6 - 3;
        const hex = Math.round(128 + brightness).toString(16).padStart(2, '0');
        ctx.fillStyle = `#${hex}${hex}${hex}`;
        ctx.fillRect(x, y, len, 1);
      }

      // Deep grooves between wood planks (black lines)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      for (let y = 0; y <= 512; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
        const offset = (y % 64 === 0) ? 64 : 0;
        for (let x = 0; x <= 512; x += 128) {
          ctx.beginPath(); ctx.moveTo(x + offset, y); ctx.lineTo(x + offset, y + 32); ctx.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }, [isDark]);

  // 3. Procedural Wall Drywall Plaster Bump Texture (makes walls look textured instead of flat CGI)
  const wallBumpTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Neutral gray base
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 128, 128);

    // Fine drywall noise speckles
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const size = Math.random() * 1.5;
      const val = Math.round(128 + (Math.random() * 10 - 5));
      const hex = val.toString(16).padStart(2, '0');
      ctx.fillStyle = `#${hex}${hex}${hex}`;
      ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(15, 15); // Fine repetitions
    return texture;
  }, []);

  const wallColorFinal = wallColor;
  const partitionColor = wallColor;

  const crownColor = isDark ? '#191922' : '#f7f3ea';
  const skirtColor = isDark ? '#07070a' : '#7d6e5d';
  const skirtMat = <meshStandardMaterial color={skirtColor} roughness={0.6} metalness={0.05} envMapIntensity={0.4} />;

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
      {/* 1. FLOOR (Physical Material with bump map and high specularity) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          map={floorTexture}
          bumpMap={floorBumpTexture}
          bumpScale={isDark ? 0.004 : 0.007}
          roughness={isDark ? 0.25 : 0.35}
          metalness={isDark ? 0.1 : 0.02}
          envMapIntensity={isDark ? 0.9 : 0.55}
        />
      </mesh>

      {/* Traditional Nepalese Hand-Knotted Wool Carpets (Galaincha) - Pure Procedural Render */}
      {/* 1. Grand Durbar Vishvavajra Mandala Carpet under central bench */}
      <NepaleseCarpet
        position={[0, 0.001, -4.0]}
        size={[4.2, 2.8]}
        variant="mandala"
        hasFringes={true}
        fringeSide="x"
      />
      {/* 2. Grand Royal Welcome Galaicha Carpet at front entrance */}
      <NepaleseCarpet
        position={[0, 0.001, 5.5]}
        size={[4.4, 2.4]}
        variant="entrance_welcome"
        hasFringes={true}
        fringeSide="z"
      />
      {/* 3. Himalayan Royal Dragon & Cloud Saffron Rug in left wing */}
      <NepaleseCarpet
        position={[-5.2, 0.001, -1.0]}
        size={[3.2, 2.2]}
        variant="royal_dragon"
        hasFringes={true}
        fringeSide="x"
      />
      {/* 4. Imperial Lotus Mandala Accent Rug in right wing */}
      <NepaleseCarpet
        position={[5.2, 0.001, -1.0]}
        size={[3.2, 2.2]}
        variant="mandala"
        hasFringes={true}
        fringeSide="x"
      />

      {/* 2. CEILING */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color='#ffffff' 
          roughness={0.9} 
        />
      </mesh>

      {/* Ceiling detail (perimeter band + subtle cage grid) */}
      <CeilingDetail theme={theme} />

      {/* 3. WALLS (Configured with Drywall plaster bump map for micro-shadows) */}
      {/* Back Wall (Z = -10) */}
      <mesh position={[0, ROOM_H / 2, -10]} receiveShadow>
        <boxGeometry args={[20, ROOM_H, 0.2]} />
        <meshStandardMaterial
          color={wallColorFinal}
          emissive={wallColorFinal}
          emissiveIntensity={isDark ? 0.18 : 0.1}
          bumpMap={wallBumpTexture}
          bumpScale={0.002}
          roughness={0.95}
        />
      </mesh>

      {/* Left Wall (X = -10) */}
      <mesh position={[-10, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[20, ROOM_H, 0.2]} />
        <meshStandardMaterial
          color={wallColorFinal}
          emissive={wallColorFinal}
          emissiveIntensity={isDark ? 0.18 : 0.1}
          bumpMap={wallBumpTexture}
          bumpScale={0.002}
          roughness={0.95}
        />
      </mesh>

      {/* Right Wall (X = 10) */}
      <mesh position={[10, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[20, ROOM_H, 0.2]} />
        <meshStandardMaterial
          color={wallColorFinal}
          emissive={wallColorFinal}
          emissiveIntensity={isDark ? 0.18 : 0.1}
          bumpMap={wallBumpTexture}
          bumpScale={0.002}
          roughness={0.95}
        />
      </mesh>

      {/* Front Wall replaced by entrance assembly: segmented wall, doorway,
          vestibule, double doors and title lettering */}
      <EntranceWall theme={theme} wallBump={wallBumpTexture} wallColor={wallColorFinal} />

      {/* 4. INTERNAL PARTITIONS — hall-layout driven (center partition or baffles) */}
      {hall.partitions.map((p) => (
        <HallPartition key={p.id} p={p} color={partitionColor} bump={wallBumpTexture} isDark={isDark} />
      ))}

      {/* 5. CENTRAL DISPLAY ISLANDS (Chronological Loop): wrapped pillars + plinths */}
      {hall.islands.map((island) => (
        <DisplayIsland key={island.id} island={island} isDark={isDark} />
      ))}

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
          color={crownColor}
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
          <meshStandardMaterial color={isDark ? '#07070a' : '#7d6e5d'} />
        </mesh>
        <mesh position={[-9.89, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[20, 0.1, 0.02]} />
          <meshStandardMaterial color={isDark ? '#07070a' : '#7d6e5d'} />
        </mesh>
        <mesh position={[9.89, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[20, 0.1, 0.02]} />
          <meshStandardMaterial color={isDark ? '#07070a' : '#7d6e5d'} />
        </mesh>
      </group>

      {/* Ceiling Tube Lights — rows aligned with the skipped grid axes in CeilingDetail.
          Each TubeLight fixture embeds its own linear RectAreaLight emitting downward. */}
      {lp.tubeRows.flatMap((z) =>
        lp.tubeXs.map((x) => (
          <TubeLight key={`tube-${x}-${z}`} position={[x, ROOM_H - 0.06, z]} length={lp.tubeLength} isDark={isDark} />
        ))
      )}

      {/* Concealed cove lighting — Chronological Loop soffit bounce */}
      {lp.cove && <CoveStrips isDark={isDark} />}

      {/* Narrow-beam accent spots dedicated to sculpture islands */}
      {lp.accentSpots.map((x) => (
        <AccentSpot key={`accent-${x}`} x={x} z={lp.accentZ} isDark={isDark} />
      ))}

      {/* Ceiling Track Lighting */}
      {lp.trackStyle === 'perimeter' ? (
        /* Perimeter runs parallel to the display walls with heads angled
           30 degrees off vertical toward the art (glare / shadow control) */
        <group position={[0, ROOM_H - 0.2, 0]}>
          {(() => {
            const trackMat = (
              <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.15} />
            );
            const bar = 9.9 - lp.trackInset;
            const span = bar * 2;
            const tilt = Math.PI / 6; // 30 degrees
            // Head canister: local -Y is the beam axis. rotX tilts the beam
            // toward -Z (back) / +Z (front); rotZ toward -X (left) / +X (right).
            const HEAD_ROT = {
              back: [tilt, 0, 0],
              front: [-tilt, 0, 0],
              left: [0, 0, -tilt],
              right: [0, 0, tilt],
            };
            const heads = [];
            for (let v = -bar + lp.headSpacing / 2; v <= bar - 0.01; v += lp.headSpacing) {
              heads.push(v);
            }
            return (
              <>
                {/* Track bars */}
                {[-bar, bar].map((z) => (
                  <mesh key={`pt-z-${z}`} position={[0, 0, z]}>
                    <boxGeometry args={[span, 0.04, 0.05]} />
                    {trackMat}
                  </mesh>
                ))}
                {[-bar, bar].map((x) => (
                  <mesh key={`pt-x-${x}`} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[span, 0.04, 0.05]} />
                    {trackMat}
                  </mesh>
                ))}
                {/* 30-degree angled spotlight heads */}
                {heads.map((v) => (
                  <group key={`head-b-${v}`} position={[v, -0.02, -bar]} rotation={HEAD_ROT.back}>
                    <mesh>
                      <cylinderGeometry args={[0.042, 0.055, 0.16, 10]} />
                      {trackMat}
                    </mesh>
                    <mesh position={[0, -0.085, 0]}>
                      <cylinderGeometry args={[0.038, 0.038, 0.014, 10]} />
                      <meshStandardMaterial
                        color="#ffffff"
                        emissive={isDark ? '#eaf4ff' : '#fff4e0'}
                        emissiveIntensity={isDark ? 2.6 : 1.6}
                        roughness={0.3}
                      />
                    </mesh>
                  </group>
                ))}
                {heads.map((v) => (
                  <group key={`head-f-${v}`} position={[v, -0.02, bar]} rotation={HEAD_ROT.front}>
                    <mesh>
                      <cylinderGeometry args={[0.042, 0.055, 0.16, 10]} />
                      {trackMat}
                    </mesh>
                    <mesh position={[0, -0.085, 0]}>
                      <cylinderGeometry args={[0.038, 0.038, 0.014, 10]} />
                      <meshStandardMaterial
                        color="#ffffff"
                        emissive={isDark ? '#eaf4ff' : '#fff4e0'}
                        emissiveIntensity={isDark ? 2.6 : 1.6}
                        roughness={0.3}
                      />
                    </mesh>
                  </group>
                ))}
                {heads.map((v) => (
                  <group key={`head-l-${v}`} position={[-bar, -0.02, v]} rotation={HEAD_ROT.left}>
                    <mesh>
                      <cylinderGeometry args={[0.042, 0.055, 0.16, 10]} />
                      {trackMat}
                    </mesh>
                    <mesh position={[0, -0.085, 0]}>
                      <cylinderGeometry args={[0.038, 0.038, 0.014, 10]} />
                      <meshStandardMaterial
                        color="#ffffff"
                        emissive={isDark ? '#eaf4ff' : '#fff4e0'}
                        emissiveIntensity={isDark ? 2.6 : 1.6}
                        roughness={0.3}
                      />
                    </mesh>
                  </group>
                ))}
                {heads.map((v) => (
                  <group key={`head-r-${v}`} position={[bar, -0.02, v]} rotation={HEAD_ROT.right}>
                    <mesh>
                      <cylinderGeometry args={[0.042, 0.055, 0.16, 10]} />
                      {trackMat}
                    </mesh>
                    <mesh position={[0, -0.085, 0]}>
                      <cylinderGeometry args={[0.038, 0.038, 0.014, 10]} />
                      <meshStandardMaterial
                        color="#ffffff"
                        emissive={isDark ? '#eaf4ff' : '#fff4e0'}
                        emissiveIntensity={isDark ? 2.6 : 1.6}
                        roughness={0.3}
                      />
                    </mesh>
                  </group>
                ))}
              </>
            );
          })()}
        </group>
      ) : (
        /* Classic concentric frame */
        <group position={[0, ROOM_H - 0.2, 0]}>
          {(() => {
            const trackMat = (
              <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.15} />
            );
            return (
              <>
                {[-8, 8].map((z) => (
                  <mesh key={`track-x-${z}`} position={[0, 0, z]}>
                    <boxGeometry args={[16, 0.04, 0.04]} />
                    {trackMat}
                  </mesh>
                ))}
                {[-8, 8].map((x) => (
                  <mesh key={`track-z-${x}`} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[16, 0.04, 0.04]} />
                    {trackMat}
                  </mesh>
                ))}
              </>
            );
          })()}
        </group>
      )}
    </group>
  );
}

export default memo(GalleryRoom);
