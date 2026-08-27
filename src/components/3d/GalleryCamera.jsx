import React, { useRef, useEffect, useCallback } from 'react';
import { CameraControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const OVERVIEW_POS = new THREE.Vector3(0, 2.3, 7.5);
const OVERVIEW_TARGET = new THREE.Vector3(0, 1.8, -1.0);

// Reused per-frame vectors (no allocations in the render loop)
const tmpPos = new THREE.Vector3();
const tmpTgt = new THREE.Vector3();

export default function GalleryCamera({ selectedArtwork, isSeated = false, artworks = [], disabled = false }) {
  const controlsRef = useRef();
  const wasDisabled = useRef(false);
  const flight = useRef(null);
  const savedView = useRef(null); // where the user was before flying to a painting
  const { camera } = useThree();

  // Straight-line glide: position AND gaze target lerp together, driven through
  // CameraControls' own instant setLookAt so its internal state stays in perfect
  // sync every frame — nothing fights it and there is no snap at either end
  const beginFlight = useCallback(
    (toPos, toTgt) => {
      const controls = controlsRef.current;
      if (!controls) return;

      const fromPos = camera.position.clone();
      const fromTgt = controls.getTarget(new THREE.Vector3());

      if (fromPos.distanceTo(toPos) < 0.05 && fromTgt.distanceTo(toTgt) < 0.05) {
        return;
      }

      const dist = fromPos.distanceTo(toPos);
      const dur = THREE.MathUtils.clamp(0.6 + dist * 0.08, 0.7, 1.5);

      flight.current = {
        fromPos,
        fromTgt,
        toPos,
        toTgt,
        t: 0,
        dur,
      };
    },
    [camera]
  );

  useEffect(() => {
    if (disabled) return;

    if (isSeated && !selectedArtwork) {
      const seatedPos = new THREE.Vector3(0, 1.05, -4.0);
      const seatedTarget = new THREE.Vector3(0, 1.55, -9.8);
      beginFlight(seatedPos, seatedTarget);
    } else if (selectedArtwork) {
      const art = artworks.find((a) => a.id === selectedArtwork);
      if (!art) return;

      // Remember where the user was before the first focus flight so closing
      // the details can bring them back here
      if (!savedView.current) {
        savedView.current = {
          pos: camera.position.clone(),
          tgt: controlsRef.current ? controlsRef.current.getTarget(new THREE.Vector3()) : OVERVIEW_TARGET.clone(),
        };
      }

      const [x, y, z] = art.position;
      const [, ry] = art.rotation;

      // Balanced camera viewing distance formula (equalized with Walk mode)
      const size = art.width ?? 1.2;
      const dist = THREE.MathUtils.clamp(size * 1.25 + 0.25, 1.2, 2.1);

      const endPos = new THREE.Vector3(x + dist * Math.sin(ry), y, z + dist * Math.cos(ry));
      const endTarget = new THREE.Vector3(x, y, z);
      beginFlight(endPos, endTarget);
    } else if (savedView.current) {
      // Closing details: go back exactly where the user was when they clicked
      const { pos, tgt } = savedView.current;
      savedView.current = null;
      beginFlight(pos, tgt);
    } else {
      beginFlight(OVERVIEW_POS, OVERVIEW_TARGET);
    }
  }, [selectedArtwork, isSeated, artworks, disabled, beginFlight, camera]);

  useFrame((_, rawDelta) => {
    const f = flight.current;
    const controls = controlsRef.current;
    if (!f || !controls) return;

    const delta = Math.min(rawDelta, 0.05); // guard against tab-switch jumps
    f.t = Math.min(f.t + delta / f.dur, 1);

    // Ease-in-out cubic
    const x = f.t;
    const e = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    tmpPos.lerpVectors(f.fromPos, f.toPos, e);
    tmpTgt.lerpVectors(f.fromTgt, f.toTgt, e);
    controls.setLookAt(tmpPos.x, tmpPos.y, tmpPos.z, tmpTgt.x, tmpTgt.y, tmpTgt.z, false);

    if (f.t >= 1) flight.current = null;
  });

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      enabled={!disabled}
      minDistance={0.2}
      maxDistance={11.0}
      maxPolarAngle={Math.PI / 2 - 0.05} // Constrain camera from passing under the floor
      minPolarAngle={Math.PI / 6}        // Prevent camera from looking straight down from ceiling
      draggingSmoothTime={0.2}
      smoothTime={0.8}                  // Time duration of transitions
    />
  );
}
