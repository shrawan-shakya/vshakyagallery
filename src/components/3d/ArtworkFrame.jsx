import React, { useRef, useState, useEffect, useMemo, memo } from 'react';
import { useCursor, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import DidacticLabel from './DidacticLabel';
import { ROOM_H } from '../../constants';
import { buildMiteredLoopGeometry } from '../../utils/moulding';

// Rectangular moulding ring with a centered opening (extruded along +Z)
function makeRingGeometry(outerW, outerH, border, depth) {
  const ow = outerW / 2;
  const oh = outerH / 2;
  const iw = ow - border;
  const ih = oh - border;

  const shape = new THREE.Shape();
  shape.moveTo(-ow, -oh);
  shape.lineTo(ow, -oh);
  shape.lineTo(ow, oh);
  shape.lineTo(-ow, oh);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-iw, -ih);
  hole.lineTo(iw, -ih);
  hole.lineTo(iw, ih);
  hole.lineTo(-iw, ih);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.003,
    bevelThickness: 0.003,
    curveSegments: 12
  });
  geo.computeVertexNormals();
  return geo;
}

// Classical picture-frame cross-section: sight lip -> raked face -> cove -> bullnose -> wall flange
// [distance inward from outer edge, depth from back plane] — closed loop, wall flange auto-closes
const RAIL_PROFILE = [
  [0.062, 0.098],
  [0.055, 0.109],
  [0.046, 0.112],
  [0.036, 0.105],
  [0.026, 0.089],
  [0.015, 0.091],
  [0.006, 0.106],
  [0.0, 0.098],
  [0.0, 0.03],
  [0.01, 0.004],
  [0.05, 0.0],
  [0.058, 0.012],
];

const RAIL_BACK_Z = -0.035;
const GRAIN_TILE = 0.85;

function ArtworkFrame({
  artwork,
  theme,
  interactive = true,
  onSelect,
  onHoverChange,
}) {
  const { 
    id, 
    title = 'Untitled', 
    artist = 'Unknown Artist', 
    year = '', 
    medium = 'Mixed Media', 
    imageUrl = '', 
    position = [0, 1.55, 0], 
    rotation = [0, 0, 0], 
    width = 1.2, 
    height = 0.9 
  } = artwork || {};

  const safePos = useMemo(() => Array.isArray(position) && position.length === 3 ? position : [0, 1.55, 0], [position]);
  const safeRot = useMemo(() => Array.isArray(rotation) && rotation.length === 3 ? rotation : [0, 0, 0], [rotation]);
  const safeW = typeof width === 'number' && !isNaN(width) && width > 0 ? width : 1.2;
  const safeH = typeof height === 'number' && !isNaN(height) && height > 0 ? height : 0.9;

  const isDark = theme === 'dark';

  const groupRef = useRef();

  // Focus light rig geometry: canopy on ceiling -> drop stem -> knuckle -> barrel aimed at canvas
  const rig = useMemo(() => {
    const mountZ = 0.9;
    const posY = safePos[1] ?? 1.55;
    const ceilingY = ROOM_H - posY;
    const knuckleY = ROOM_H - 0.45 - posY;
    const dir = new THREE.Vector3(0, -knuckleY, -mountZ).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return { mountZ, ceilingY, knuckleY, quat };
  }, [safePos]);

  // Walnut PBR set (CC0 Poly Haven) — cached across all frames by drei
  const woodTex = useTexture({
    map: '/textures/frame/walnut_diff.jpg',
    normalMap: '/textures/frame/walnut_nor_gl.jpg',
    roughnessMap: '/textures/frame/walnut_rough.jpg',
  });

  useMemo(() => {
    woodTex.map.colorSpace = THREE.SRGBColorSpace;
    Object.values(woodTex).forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = 16;
      t.repeat.set(1, 1);
      t.needsUpdate = true;
    });
  }, [woodTex]);

  // Moulding ring geometries (openings reveal the canvas; each layer tucks under the previous)
  const frameGeos = useMemo(
    () => ({
      step: makeRingGeometry(safeW + 0.09, safeH + 0.09, 0.04, 0.095),
      fillet: makeRingGeometry(safeW + 0.02, safeH + 0.02, 0.025, 0.082),
      liner: makeRingGeometry(safeW - 0.02, safeH - 0.02, 0.014, 0.07),
    }),
    [safeW, safeH]
  );

  // Outer swept moulding: grain runs lengthwise per rail, world-unit UVs stay
  // consistent across every frame size
  const railGeo = useMemo(
    () => buildMiteredLoopGeometry(RAIL_PROFILE, safeW + 0.2, safeH + 0.2, {
      grainTile: GRAIN_TILE,
      backZ: RAIL_BACK_Z,
    }),
    [safeW, safeH]
  );

  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState(null);
  const [loading, setLoading] = useState(true);

  // True when the nearest thing under the pointer belongs to THIS frame.
  // R3F delivers click events even when scenery (a wall) was hit first, so
  // without this guard you could inspect art through walls in orbit mode.
  const isEventOnSelf = (e) => {
    const first = e.intersections && e.intersections[0];
    if (!first) return true;
    let node = first.object;
    while (node) {
      if (node === groupRef.current) return true;
      node = node.parent;
    }
    return false;
  };

  // Pointer cursor + "View Details" hint fire only while the didactic
  // plaque is hovered — the callback is handed to DidacticLabel below.
  useCursor(hovered);

  const handlePlaqueHover = (v) => {
    setHovered(v);
    onHoverChange?.(v);
  };

  // Fallback procedural canvas texture to use if texture load fails (CORS or network issues)
  const fallbackTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Create a beautiful linear gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#1e1b4b'); // deep indigo
    grad.addColorStop(0.5, '#311042'); // deep purple
    grad.addColorStop(1, '#090514'); // very dark purple
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Decorative geometric shapes to make it look like abstract art
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)'; // gold outline
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 432, 432);

    ctx.fillStyle = 'rgba(245, 158, 11, 0.06)';
    ctx.beginPath();
    ctx.arc(256, 256, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.lineTo(412, 412);
    ctx.stroke();

    // Text labels
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 220);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText('Gallery Masterpiece', 256, 260);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('[ NETWORK / CORS OFFLINE ]', 256, 310);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, [title]);

  // Loading state placeholder texture
  const loadingTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#111116';
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Curator Loading...', 128, 128);

    return new THREE.CanvasTexture(canvas);
  }, []);

  const { gl } = useThree();
  const maxAniso = useMemo(() => gl?.capabilities?.getMaxAnisotropy?.() ?? 8, [gl]);

  // Asynchronously fetch texture to safely bypass standard React Suspense throws on failure.
  // Oversized uploads are downscaled to MAX_TEX_SIDE before hitting the GPU —
  // a 4000px JPEG spread over one square metre of wall is pure bandwidth waste.
  useEffect(() => {
    let active = true;
    setLoading(true);

    const applyTexture = (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAniso;
      setTexture(tex);
      setLoading(false);
    };

    const MAX_TEX_SIDE = 2048;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    loader.load(
      imageUrl,
      (tex) => {
        if (!active) return;
        const img = tex.image;
        const scale = img ? Math.min(1, MAX_TEX_SIDE / Math.max(img.width, img.height)) : 1;
        if (scale >= 1) {
          applyTexture(tex);
          return;
        }
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        tex.dispose();
        applyTexture(new THREE.CanvasTexture(c));
      },
      undefined,
      (err) => {
        console.warn(`Could not load image texture for "${title}" asynchronously:`, err);
        if (active) {
          setLoading(false);
        }
      }
    );

    return () => {
      active = false;
    };
  }, [imageUrl, title, maxAniso]);

  // Select active texture based on loader status
  const activeTexture = texture ? texture : (loading ? loadingTexture : fallbackTexture);

  return (
    <group position={safePos} rotation={safeRot}>
      {/* Ceiling canopy mount plate */}
      <mesh position={[0, rig.ceilingY - 0.022, rig.mountZ]}>
        <cylinderGeometry args={[0.095, 0.115, 0.045, 24]} />
        <meshStandardMaterial color="#14161a" metalness={0.85} roughness={0.3} envMapIntensity={0.7} />
      </mesh>

      {/* Drop stem rod */}
      <mesh position={[0, (rig.ceilingY + rig.knuckleY) / 2, rig.mountZ]}>
        <cylinderGeometry args={[0.022, 0.022, rig.ceilingY - rig.knuckleY - 0.03, 14]} />
        <meshStandardMaterial color="#14161a" metalness={0.85} roughness={0.3} envMapIntensity={0.7} />
      </mesh>

      {/* Knuckle joint */}
      <mesh position={[0, rig.knuckleY, rig.mountZ]}>
        <sphereGeometry args={[0.062, 20, 20]} />
        <meshStandardMaterial color="#14161a" metalness={0.85} roughness={0.3} envMapIntensity={0.7} />
      </mesh>

      {/* Aimed drum head with glowing lens and retaining ring */}
      <group position={[0, rig.knuckleY, rig.mountZ]} quaternion={rig.quat}>
        <mesh position={[0, 0.05, 0]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[0.1, 24, 18]} />
          <meshStandardMaterial color="#17191d" metalness={0.85} roughness={0.28} envMapIntensity={0.8} />
        </mesh>
        <mesh position={[0, 0.135, 0]}>
          <cylinderGeometry args={[0.11, 0.105, 0.15, 24]} />
          <meshStandardMaterial color="#17191d" metalness={0.85} roughness={0.28} envMapIntensity={0.8} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.094, 0.094, 0.02, 24]} />
          <meshStandardMaterial
            color="#fff3dc"
            emissive={isDark ? "#ffd9a0" : "#ffe9c4"}
            emissiveIntensity={isDark ? 3.0 : 2.0}
          />
        </mesh>
        <mesh position={[0, 0.238, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.096, 0.012, 10, 28]} />
          <meshStandardMaterial color="#14161a" metalness={0.85} roughness={0.3} envMapIntensity={0.7} />
        </mesh>
      </group>

      {/* Outer Clickable Group for Frame, Canvas, and Glass.
          Click opens the artwork anywhere, but the hover hint + pointer
          cursor only come from the didactic plaque (see DidacticLabel). */}
      <group
        ref={groupRef}
        userData={{ artworkId: id }}
        onClick={(e) => {
          if (!interactive) return;
          if (!isEventOnSelf(e)) return;
          e.stopPropagation();
          onSelect(id);
        }}
      >
        {/* 1. OUTER SWEPT MOULDING (smooth walnut PBR + satin varnish look) */}
        <mesh geometry={railGeo} receiveShadow>
          <meshStandardMaterial
            map={woodTex.map}
            normalMap={woodTex.normalMap}
            normalScale={[0.18, 0.18]}
            roughnessMap={woodTex.roughnessMap}
            roughness={0.42}
            metalness={0.04}
            envMapIntensity={1.15}
          />
        </mesh>

        {/* 2. BEVEL STEP RAIL (darker satin inner moulding) */}
        <mesh geometry={frameGeos.step} position={[0, 0, -0.037]} receiveShadow>
          <meshStandardMaterial
            color={isDark ? "#1c130c" : "#241a12"}
            roughness={0.52}
            metalness={0.05}
            envMapIntensity={0.7}
          />
        </mesh>

        {/* 3. GOLD FILLET (SHAKYA metallic gold strip) */}
        <mesh geometry={frameGeos.fillet} position={[0, 0, -0.038]} receiveShadow>
          <meshStandardMaterial
            color="#D4AF37"
            metalness={0.92}
            roughness={0.28}
            envMapIntensity={1.1}
          />
        </mesh>

        {/* 4. LINEN LINER (matte fabric liner overlapping canvas edge) */}
        <mesh geometry={frameGeos.liner} position={[0, 0, -0.034]} receiveShadow>
          <meshStandardMaterial
            color={isDark ? "#d8d2c4" : "#f2ede1"}
            roughness={0.95}
            metalness={0}
            envMapIntensity={0.3}
          />
        </mesh>

        {/* 5. PAINTING CANVAS (realistic physical gallery fine-art canvas with 10% natural lighting absorption) */}
        <mesh position={[0, 0, 0.011]}>
          <boxGeometry args={[safeW, safeH, 0.03]} />
          <meshBasicMaterial
            map={activeTexture}
            color="#fafafa"
            toneMapped={false}
          />
        </mesh>

        {/* 6. GLAZING — thin float-glass pane recessed behind the liner lip.
            Near-zero roughness picks up the studio HDR and the spotlight as a
            soft glazing glare; barely tints the canvas underneath. */}
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[safeW - 0.06, safeH - 0.06, 0.004]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.06}
            roughness={0.02}
            metalness={0}
            envMapIntensity={2.4}
            depthWrite={false}
          />
        </mesh>

        {/* 7. DIDACTIC LABEL — ivory wall plaque beside the frame; the only
              hover-sensitive surface of the artwork */}
        <DidacticLabel
          artworkId={id}
          title={title}
          artist={artist}
          year={year}
          medium={medium}
          width={safeW}
          centerY={safePos[1]}
          onHoverChange={interactive ? handlePlaqueHover : undefined}
          theme={theme}
        />
      </group>
    </group>
  );
}

// Memoized: App re-renders on aim/hover state flips must not re-reconcile frames
export default memo(ArtworkFrame);
