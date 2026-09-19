import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ROOM_H } from '../../constants';
import { useCanvasTexture } from '../../hooks/useCanvasTexture';
import { SERIF_FONT, SANS_FONT, setLetterSpacing } from '../../utils/canvasText';

const OPENING_W = 2.8; // Doorway width
const OPENING_TOP = 3.4; // Doorway header height
const VEST_DEPTH = 1.7; // Vestibule corridor depth beyond the wall
const DOOR_W = OPENING_W / 2 - 0.06;

const TRIM_COLOR = '#241a12';
const VEST_WALL_COLOR = '#101014';

// Vinyl-style exhibition lettering drawn on a transparent canvas
function makeTitleTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = 'rgba(23, 21, 16, 0.93)';
  setLetterSpacing(ctx, 34);
  ctx.font = `700 250px ${SERIF_FONT}`;
  ctx.fillText('SHAKYA', 1030, 185);

  ctx.fillStyle = 'rgba(23, 21, 16, 0.55)';
  ctx.fillRect(1024 - 380, 300, 760, 3);

  ctx.fillStyle = 'rgba(23, 21, 16, 0.72)';
  setLetterSpacing(ctx, 24);
  ctx.font = `500 56px ${SANS_FONT}`;
  ctx.fillText('AUTUMN EXHIBITION · MMXXVI', 1040, 385);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export default function EntranceWall({ wallBump, wallColor = '#ffffff' }) {
  const titleTex = useCanvasTexture(makeTitleTexture, []);

  // Walnut door panels — clone the cached PBR set so repeat tweaks don't
  // affect the picture frames sharing these textures
  const walnut = useTexture({
    map: '/textures/frame/walnut_diff.jpg',
    normalMap: '/textures/frame/walnut_nor_gl.jpg',
    roughnessMap: '/textures/frame/walnut_rough.jpg',
  });
  const doorMats = useMemo(() => {
    const mk = (src) => {
      const t = src.clone();
      t.needsUpdate = true;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(0.7, 1.6);
      return t;
    };
    return {
      map: mk(walnut.map),
      normalMap: mk(walnut.normalMap),
      roughnessMap: mk(walnut.roughnessMap),
    };
  }, [walnut]);
  const doorMaterial = (
    <meshStandardMaterial
      map={doorMats.map}
      normalMap={doorMats.normalMap}
      roughnessMap={doorMats.roughnessMap}
      roughness={0.5}
      metalness={0.05}
      envMapIntensity={0.7}
    />
  );

  const wallMaterial = (
    <meshStandardMaterial color={wallColor} emissive={wallColor} emissiveIntensity={0.18} bumpMap={wallBump} bumpScale={0.002} roughness={0.95} />
  );

  const segW = 10 - OPENING_W / 2; // 8.6
  const segX = -(OPENING_W / 2 + segW / 2); // -5.7
  // Lettering floats proportionally in the band between door header and ceiling
  const titleY = OPENING_TOP + (ROOM_H - OPENING_TOP) * 0.42;

  const doorPanels = [-1, 1].map((side) => ({
    key: `door-${side}`,
    side,
    hingeX: side * (OPENING_W / 2 - 0.03),
    swing: side * -Math.PI / 3,
  }));

  return (
    <group>
      {/* Front wall segments flanking the opening */}
      <mesh position={[segX, ROOM_H / 2, 10]} receiveShadow>
        <boxGeometry args={[segW, ROOM_H, 0.2]} />
        {wallMaterial}
      </mesh>
      <mesh position={[-segX, ROOM_H / 2, 10]} receiveShadow>
        <boxGeometry args={[segW, ROOM_H, 0.2]} />
        {wallMaterial}
      </mesh>
      {/* Header above the doorway */}
      <mesh position={[0, (OPENING_TOP + ROOM_H) / 2, 10]} receiveShadow>
        <boxGeometry args={[OPENING_W, ROOM_H - OPENING_TOP, 0.2]} />
        {wallMaterial}
      </mesh>

      {/* Title lettering above the entrance */}
      <mesh position={[0, titleY, 9.85]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[6.4, 1.6]} />
        <meshBasicMaterial map={titleTex} transparent depthWrite={false} />
      </mesh>

      {/* Architrave trim around the opening.
          Jamb tops rise into the lintel solid and the lintel bottom dips below
          y = OPENING_TOP — no faces share that plane, which killed the z-fighting
          shimmer above the door (header bottom, jamb tops and vestibule ceiling
          were all exactly coplanar at OPENING_TOP). */}
      {[-1, 1].map((s) => (
        <mesh key={`jamb-${s}`} position={[s * (OPENING_W / 2 + 0.06), (OPENING_TOP + 0.06) / 2, 9.98]}>
          <boxGeometry args={[0.13, OPENING_TOP + 0.06, 0.26]} />
          <meshStandardMaterial color={TRIM_COLOR} roughness={0.45} metalness={0.05} />
        </mesh>
      ))}
      <mesh position={[0, OPENING_TOP + 0.055, 9.98]}>
        <boxGeometry args={[OPENING_W + 0.38, 0.15, 0.26]} />
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.45} metalness={0.05} />
      </mesh>

      {/* Threshold bar, lifted 1cm above the floor plane so it can't z-fight */}
      <mesh position={[0, 0.022, 10]} receiveShadow>
        <boxGeometry args={[OPENING_W + 0.1, 0.024, 0.32]} />
        <meshStandardMaterial color="#15151a" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Vestibule shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 10 + VEST_DEPTH / 2]} receiveShadow>
        <planeGeometry args={[OPENING_W + 0.7, VEST_DEPTH]} />
        <meshStandardMaterial color="#131318" roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, OPENING_TOP, 10 + VEST_DEPTH / 2]}>
        <planeGeometry args={[OPENING_W + 0.7, VEST_DEPTH]} />
        <meshStandardMaterial color="#0d0d11" roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`vest-wall-${s}`} position={[s * (OPENING_W / 2 + 0.3), (OPENING_TOP + 0.05) / 2, 10 + VEST_DEPTH / 2]}>
          <boxGeometry args={[0.1, OPENING_TOP + 0.05, VEST_DEPTH]} />
          <meshStandardMaterial color={VEST_WALL_COLOR} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, OPENING_TOP / 2, 10 + VEST_DEPTH + 0.05]}>
        <boxGeometry args={[OPENING_W + 0.7, OPENING_TOP, 0.1]} />
        <meshStandardMaterial color={VEST_WALL_COLOR} roughness={0.95} />
      </mesh>

      {/* Runner mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10.85]} receiveShadow>
        <planeGeometry args={[2.1, 1.15]} />
        <meshStandardMaterial color="#0f0f13" roughness={0.98} />
      </mesh>

      {/* Recessed vestibule downlights */}
      {[-0.7, 0.7].map((x) => (
        <group key={`downlight-${x}`}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[x, OPENING_TOP - 0.04, 10.9]}>
            <circleGeometry args={[0.075, 24]} />
            <meshStandardMaterial
              color="#fff3dc"
              emissive="#ffd9a0"
              emissiveIntensity={2.2}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
          <pointLight position={[x, OPENING_TOP - 0.2, 10.9]} intensity={4} distance={3.6} decay={2} color="#ffe2b8" />
        </group>
      ))}

      {/* Double doors, swung open into the vestibule */}
      {doorPanels.map(({ key, side, hingeX, swing }) => (
        <group key={key} position={[hingeX, 0, 10]} rotation={[0, swing, 0]}>
          <mesh castShadow position={[side * (DOOR_W / 2), OPENING_TOP / 2 - 0.05, 0]}>
            <boxGeometry args={[DOOR_W, OPENING_TOP - 0.14, 0.055]} />
            {doorMaterial}
          </mesh>
          {/* Inset panels */}
          {[0.78, -0.78].map((oy) => (
            <mesh key={oy} position={[side * (DOOR_W / 2), OPENING_TOP / 2 - 0.05 + oy, 0.032]}>
              <boxGeometry args={[DOOR_W - 0.36, 1.05, 0.012]} />
              <meshStandardMaterial color="#1c130c" roughness={0.5} metalness={0.04} />
            </mesh>
          ))}
          {/* Pull handle near the free edge */}
          <mesh position={[side * (DOOR_W - 0.14), 1.55, 0.07]}>
            <cylinderGeometry args={[0.016, 0.016, 0.5, 12]} />
            <meshStandardMaterial color="#8a8578" metalness={0.9} roughness={0.28} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
