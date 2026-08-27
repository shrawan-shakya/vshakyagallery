import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_H } from '../../constants';

// A FIXED number of real spotlights that dynamically reassign themselves to
// the artworks nearest the camera. Keeping the count constant means the
// renderer never recompiles shaders (a visible stutter), while visitors get
// genuine specular highlights and wall pools for the art they're actually
// looking at. The remaining paintings carry the baked wash in ArtworkFrame.
const SLOT_COUNT = 3;
const RESCAN_INTERVAL = 0.33;

export default function NearestPictureLights({ artworks, theme }) {
  const isDark = theme === 'dark';

  const slots = useMemo(
    () =>
      Array.from({ length: SLOT_COUNT }, () => ({
        target: new THREE.Object3D(),
        light: null,
        artId: null,
        level: 0,
        goal: 0,
      })),
    [],
  );

  const scanClock = useRef(RESCAN_INTERVAL);

  const placeLight = (slot, art) => {
    const ry = art.rotation?.[1] ?? 0;
    const posY = art.position[1] ?? 1.55;
    const knuckleY = ROOM_H - 0.45 - posY;
    const lx = 0;
    const ly = knuckleY - 0.14;
    const lz = 0.87;
    const sinY = Math.sin(ry);
    const cosY = Math.cos(ry);
    slot.light?.position.set(
      art.position[0] + lx * cosY + lz * sinY,
      posY + ly,
      art.position[2] - lx * sinY + lz * cosY,
    );
    slot.target.position.set(art.position[0], posY, art.position[2]);
    slot.target.updateMatrixWorld();
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const camPos = state.camera.position;

    // Periodically re-aim the fixed slots at the nearest artworks
    scanClock.current += dt;
    if (scanClock.current >= RESCAN_INTERVAL) {
      scanClock.current = 0;
      const peak = isDark ? 16 : 9.5;
      const ranked = [];
      for (const art of artworks) {
        if (!art || !Array.isArray(art.position)) continue;
        const dx = art.position[0] - camPos.x;
        const dy = art.position[1] - camPos.y;
        const dz = art.position[2] - camPos.z;
        ranked.push([dx * dx + dy * dy + dz * dz, art]);
      }
      ranked.sort((a, b) => a[0] - b[0]);

      // Assignments are sticky: a slot keeps its artwork while that artwork
      // remains among the SLOT_COUNT nearest, so harmless rank flips between
      // two already-lit paintings can't blink the lights. Only genuinely new
      // arrivals take over vacated slots.
      const topIds = new Set(
        ranked.slice(0, SLOT_COUNT).map(([, art]) => art.id),
      );
      const taken = new Set();
      slots.forEach((slot) => {
        if (
          slot.artId &&
          slot.pendingArtId == null &&
          topIds.has(slot.artId)
        ) {
          taken.add(slot.artId);
          slot.goal = peak;
        } else if (slot.artId && !topIds.has(slot.artId)) {
          // Lost its spot: fade out first; retarget once fully dim
          slot.pendingArtId = true;
          slot.goal = 0;
        } else if (slot.artId) {
          // Back in contention: cancel any queued takeover
          slot.nextArtId = null;
          slot.pendingArtId = null;
          slot.goal = peak;
        }
      });

      slots.forEach((slot) => {
        if (slot.goal === peak && slot.artId) return;
        const next = ranked.find(([, art]) => !taken.has(art.id));
        if (!next) return;
        taken.add(next[1].id);
        if (slot.level <= 0.05) {
          // Already dark: snap position now, then fade back in
          slot.artId = next[1].id;
          slot.pendingArtId = null;
          placeLight(slot, next[1]);
          slot.level = 0;
          slot.goal = peak;
        } else if (slot.pendingArtId == null) {
          // Still bright: fade to dark first, retarget next frames
          slot.nextArtId = next[1].id;
          slot.pendingArtId = true;
          slot.goal = 0;
        }
      });
    }

    // Fade intensities toward their goals every frame (cheap, smooth handoffs)
    const damp = 1 - Math.exp(-6 * dt);
    const peak = isDark ? 16 : 9.5;
    for (const slot of slots) {
      if (!slot.light) continue;
      slot.level += (slot.goal - slot.level) * damp;
      if (Math.abs(slot.goal - slot.level) < 0.05) slot.level = slot.goal;

      // Fully dimmed with a queued takeover: move the light, fade back up
      if (
        slot.pendingArtId &&
        slot.nextArtId &&
        Math.abs(slot.goal - slot.level) < 0.05
      ) {
        const art = artworks.find((a) => a?.id === slot.nextArtId);
        if (art) {
          slot.artId = art.id;
          placeLight(slot, art);
          slot.goal = peak;
        }
        slot.pendingArtId = null;
        slot.nextArtId = null;
        slot.level = 0;
      }

      slot.light.intensity = slot.level;
    }
  });

  return (
    <>
      {slots.map((slot, i) => (
        <React.Fragment key={`slot-${i}`}>
          <primitive object={slot.target} />
          <spotLight
            ref={(r) => {
              slot.light = r;
            }}
            target={slot.target}
            angle={Math.PI / 5.2}
            penumbra={1}
            distance={10}
            decay={2}
            color="#ffffff"
            intensity={0}
          />
        </React.Fragment>
      ))}
    </>
  );
}
