import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const WALK_SPEED = 1.8; // Relaxed, elegant museum stroll pace
const SPRINT_SPEED = 3.2; // Brisk walk pace
const EYE_HEIGHT = 1.7;
const BOUND = 9.45; // Room walls at ±10 minus player radius margin

// Internal architecture (partitions / baffle T-walls / display islands)
// arrives as pre-padded AABBs via the `colliders` prop from the active
// hall layout (see utils/hallLayouts.js).
const INTERACT_DISTANCE = 6; // Max reach (m) for aim-inspect feedback
const FOCUS_SCAN_INTERVAL = 0.05; // Seconds between center-ray focus scans

const EDGE_PAD = 0.28; // Waypoint clearance beyond a collider edge
const SLAB_PAD = 0.05;

// Liang-Barsky: does segment a→b cross the collider footprint (+ tiny pad)?
function segCrossesBox(ax, az, bx, bz, box) {
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dz = bz - az;
  const clip = (p, q) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  return (
    clip(-dx, ax - (box.minX - SLAB_PAD)) &&
    clip(dx, box.maxX + SLAB_PAD - ax) &&
    clip(-dz, az - (box.minZ - SLAB_PAD)) &&
    clip(dz, box.maxZ + SLAB_PAD - az)
  );
}

const inSpan = (v, lo, hi) => v > lo && v < hi;
const pushBefore = (v, lo, hi) => (v < (lo + hi) / 2 ? lo - 0.3 : hi + 0.3);

// Waypoints routing a→b around the nearest edge of the first blocking
// collider, or [] when the straight path already misses every obstacle.
// Chooses whichever side (x-edge vs z-edge) yields the shorter detour.
function planAroundBoxes(ax, az, bx, bz, colliders) {
  const box = (colliders || []).find((c) => segCrossesBox(ax, az, bx, bz, c));
  if (!box) return [];

  const xL = box.minX - EDGE_PAD;
  const xR = box.maxX + EDGE_PAD;
  const zF = box.maxZ + EDGE_PAD;
  const zB = box.minZ - EDGE_PAD;

  const costXL = Math.abs(ax - xL) + Math.abs(bx - xL);
  const costXR = Math.abs(ax - xR) + Math.abs(bx - xR);
  const costZF = Math.abs(az - zF) + Math.abs(bz - zF);
  const costZB = Math.abs(az - zB) + Math.abs(bz - zB);

  const costX = Math.min(costXL, costXR);
  const costZ = Math.min(costZF, costZB);
  const safeZ = (z) => (inSpan(z, box.minZ - SLAB_PAD, box.maxZ + SLAB_PAD) ? pushBefore(z, box.minZ, box.maxZ) : z);
  const safeX = (x) => (inSpan(x, box.minX - SLAB_PAD, box.maxX + SLAB_PAD) ? pushBefore(x, box.minX, box.maxX) : x);

  if (costX <= costZ) {
    const detourX = costXL <= costXR ? xL : xR;
    return [
      { x: detourX, z: safeZ(az) },
      { x: detourX, z: safeZ(bz) },
    ];
  }
  const detourZ = costZB < costZF ? zB : zF;
  return [
    { x: safeX(ax), z: detourZ },
    { x: safeX(bx), z: detourZ },
  ];
}

const SPAWN = { x: 0, y: EYE_HEIGHT, z: 6.5, yaw: 0, pitch: -0.02 };

// Shortest signed angular difference a→b, wrapped to [-π, π]
function angleDelta(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

// Shared scratch euler — avoids allocating every frame in the camera paths
const _EULER = new THREE.Euler(0, 0, 0, 'YXZ');

// Room-change door transition poses:
// EXIT_END  — just past the threshold inside the vestibule (screen fully dark)
// ENTER_START — teleport point inside the vestibule, turned around to face
//               the open doors, then glides out into the room
const EXIT_END_Z = 10.55;
const ENTER_START_Z = 11.15;
const ENTER_FINAL_YAW = 0; // facing -Z, straight into the room
const ENTER_FINAL_PITCH = -0.02;

export default function WalkControls({
  joystickRef,
  onSelectArtwork,
  onSitBench,
  onLockChange,
  onLockError,
  resetSignal,
  onFocusChange,
  lockRequestRef,
  selectedArtwork,
  artworks,
  isSeated,
  onStandUp,
  transitionSignal,
  onTransitionDone,
  fadeRef,
  onEnterPortal,
  colliders = [],
}) {
  const { camera, gl, scene } = useThree();

  const yaw = useRef(SPAWN.yaw);
  const pitch = useRef(SPAWN.pitch);
  const curYaw = useRef(SPAWN.yaw);
  const curPitch = useRef(SPAWN.pitch);
  const keys = useRef({});
  const vel = useRef(new THREE.Vector3());
  const lookDrag = useRef(null); // { id, x, y, sx, sy } active touch/drag for looking
  const raycaster = useRef(new THREE.Raycaster());
  const CENTER = useRef(new THREE.Vector2(0, 0));
  const focusIdRef = useRef(null);
  const focusClock = useRef(0);
  const plBrokenRef = useRef(false); // Pointer lock denied/unsupported → drag-to-look fallback
  const everLockedRef = useRef(false);
  const lastUnlockAt = useRef(0);
  const lockEngagedAt = useRef(0); // Ignore mouse deltas briefly after locking (browser spike)
  // Cinematic zoom state: null | { phase: 'in' | 'back', saved: pose, target: pose }
  const cine = useRef(null);
  const camTarget = useRef(new THREE.Vector3());
  // Room-change door transition: null | { phase: 'exit' | 'enter', ... }
  const transit = useRef(null);

  // Walking camera motion physics (head bobbing, sway, breathing)
  const stepTimer = useRef(0);
  const idleTimer = useRef(0);
  const headBobY = useRef(0);
  const headRollZ = useRef(0);

  const plSupported =
    typeof document !== 'undefined' &&
    typeof gl?.domElement?.requestPointerLock === 'function';
  const plSupportedRef = useRef(plSupported);
  plSupportedRef.current = plSupported;

  const respawn = () => {
    camera.position.set(SPAWN.x, SPAWN.y, SPAWN.z);
    yaw.current = SPAWN.yaw;
    pitch.current = SPAWN.pitch;
    curYaw.current = SPAWN.yaw;
    curPitch.current = SPAWN.pitch;
    vel.current.set(0, 0, 0);
    keys.current = {};
    cine.current = null;
    stepTimer.current = 0;
    idleTimer.current = 0;
    headBobY.current = 0;
    headRollZ.current = 0;
  };

  // Occlusion-aware center picking: raycast the WHOLE scene and let the
  // nearest hit decide. A wall, floor or doorway closer than the target
  // blocks it, so artwork can never be inspected through geometry, and
  // nothing beyond INTERACT_DISTANCE can be selected at all.
  //
  // Artworks resolve ONLY through their didactic plaque (like reading a
  // museum label before approaching the piece) — aiming at the canvas or
  // frame shows no inspect prompt. Benches and portals stay fully clickable.
  const resolveCenterTarget = useCallback(() => {
    if (!scene) return null;
    raycaster.current.setFromCamera(CENTER.current, camera);
    raycaster.current.far = INTERACT_DISTANCE;
    const hits = raycaster.current.intersectObjects(scene.children, true);
    raycaster.current.far = Infinity;
    if (hits.length === 0) return null;

    // Walk up from the nearest struck mesh to find what owns it
    let o = hits[0].object;
    if (o.userData?.isPlaque) return o.userData.artworkId ?? null;
    while (o) {
      const ud = o.userData;
      if (ud && (ud.isBench || ud.isPortal)) {
        if (ud.isBench) return 'bench';
        return 'portal';
      }
      o = o.parent;
    }
    return null;
  }, [camera, scene]);

  // Viewing pose for inspecting an artwork
  const viewPoseFor = useCallback(
    (id) => {
      const art = artworks?.find((a) => a.id === id);
      if (!art) return null;
      const ry = art.rotation?.[1] ?? 0;
      const nx = Math.sin(ry);
      const nz = Math.cos(ry);
      const size = art.width ?? 1.2;
      const dist = THREE.MathUtils.clamp(size * 1.25 + 0.25, 1.2, 2.1);
      const px = THREE.MathUtils.clamp(art.position[0] + nx * dist, -BOUND, BOUND);
      const pz = THREE.MathUtils.clamp(art.position[2] + nz * dist, -BOUND, BOUND);
      const dx = art.position[0] - px;
      const dz = art.position[2] - pz;
      const len = Math.hypot(dx, dz) || 1;
      return {
        x: px,
        y: art.position[1],
        z: pz,
        yaw: Math.atan2(-(dx / len), -(dz / len)),
        pitch: 0,
      };
    },
    [artworks],
  );

  useEffect(() => {
    if (selectedArtwork) {
      const target = viewPoseFor(selectedArtwork);
      if (!target) return;
      if (!cine.current || cine.current.phase === 'back') {
        cine.current = {
          phase: 'in',
          saved: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            yaw: yaw.current,
            pitch: pitch.current,
          },
          target,
          legs: planAroundBoxes(camera.position.x, camera.position.z, target.x, target.z, colliders),
        };
      } else {
        cine.current.target = target;
        cine.current.phase = 'in';
        cine.current.legs = planAroundBoxes(camera.position.x, camera.position.z, target.x, target.z, colliders);
      }
    } else if (cine.current && cine.current.phase !== 'back') {
      cine.current.phase = 'back';
      cine.current.legs = planAroundBoxes(camera.position.x, camera.position.z, cine.current.saved.x, cine.current.saved.z, colliders);
    }
  }, [selectedArtwork, viewPoseFor, camera, colliders]);

  // Enter walk mode
  useEffect(() => {
    camera.rotation.order = 'YXZ';
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    yaw.current = e.y;
    pitch.current = THREE.MathUtils.clamp(e.x, -(Math.PI / 2 - 0.08), Math.PI / 2 - 0.08);
    curYaw.current = yaw.current;
    curPitch.current = pitch.current;
    vel.current.set(0, 0, 0);
    keys.current = {};
    camera.position.y = EYE_HEIGHT;

    const prevFov = camera.fov;
    camera.fov = 75;
    camera.updateProjectionMatrix();

    return () => {
      camera.fov = prevFov;
      camera.updateProjectionMatrix();
      if (typeof document !== 'undefined' && document.pointerLockElement === gl?.domElement) {
        document.exitPointerLock();
      }
      onFocusChange?.(null);
      cine.current = null;
    };
  }, [camera, gl, onFocusChange]);

  // Respawn
  useEffect(() => {
    if (resetSignal > 0) respawn();
  }, [resetSignal]);

  // Room-change door transition: glide out through the entrance, fade to
  // black crossing the threshold, then fade back in inside the vestibule
  // facing the open doors and glide into the new room.
  useEffect(() => {
    if (!transitionSignal || !transitionSignal.id) return;
    if (transit.current) return;

    if (isSeated) onStandUp?.();
    cine.current = null;
    vel.current.set(0, 0, 0);
    keys.current = {};
    lookDrag.current = null;
    if (focusIdRef.current) {
      focusIdRef.current = null;
      onFocusChange?.(null);
    }

    const px = camera.position.x;
    const pz = camera.position.z;
    transit.current = {
      phase: 'exit',
      t: 0,
      from: { x: px, y: camera.position.y, z: pz, yaw: yaw.current, pitch: pitch.current },
      exitX: THREE.MathUtils.clamp(px * 0.22, -0.85, 0.85),
      exitDur: 0.9,
      enterDur: 1.1,
    };
  }, [transitionSignal, camera, isSeated, onStandUp, onFocusChange]);

  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return;

    window.__galleryCamera = camera;

    const isLocked = () =>
      typeof document !== 'undefined' && document.pointerLockElement === dom;

    const handleLockFailure = () => {
      const sinceUnlock = performance.now() - lastUnlockAt.current;
      if (everLockedRef.current && sinceUnlock < 2000) return;
      if (plBrokenRef.current) return;
      plBrokenRef.current = true;
      console.warn('[WalkControls] Pointer lock unavailable — falling back to drag-to-look');
      onLockError?.();
    };
    if (!plSupportedRef.current) handleLockFailure();

    if (lockRequestRef) {
      lockRequestRef.current = () => {
        if (!isLocked() && !plBrokenRef.current) {
          try {
            const p = dom.requestPointerLock();
            if (p && typeof p.catch === 'function') p.catch(handleLockFailure);
          } catch {
            handleLockFailure();
          }
        }
      };
    }

    const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
    const syncCursor = () => {
      const hideCursor =
        !isLocked() && !plBrokenRef.current && MOVE_KEYS.some((c) => keys.current[c]);
      dom.style.cursor = hideCursor ? 'none' : '';
    };

    const onBlur = () => {
      keys.current = {};
      syncCursor();
    };

    const isInputActive = () => {
      if (typeof document === 'undefined') return false;
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable;
    };

    const onKeyDown = (e) => {
      if (isInputActive()) return;

      // Stand up if moving while seated
      if (isSeated && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        onStandUp?.();
      }

      // Key E inspects artwork, sits on bench or enters the next room
      if (e.code === 'KeyE') {
        if (focusIdRef.current === 'bench') {
          onSitBench?.();
          return;
        } else if (focusIdRef.current === 'portal') {
          onEnterPortal?.();
          return;
        } else if (focusIdRef.current) {
          onSelectArtwork(focusIdRef.current);
          return;
        }
      }
      keys.current[e.code] = true;
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
      ) {
        e.preventDefault();
      }
      syncCursor();
    };
    const onKeyUp = (e) => {
      if (isInputActive()) {
        keys.current = {};
        return;
      }
      keys.current[e.code] = false;
      syncCursor();
    };

    // Desktop: click painting to inspect, click bench to sit, or click empty space to lock cursor
    const onMouseDown = (e) => {
      if (isInputActive() || cine.current || transit.current) return;

      const targetId = resolveCenterTarget();
      if (targetId === 'bench') {
        onSitBench?.();
        return;
      }
      if (targetId === 'portal') {
        onEnterPortal?.();
        return;
      }
      if (targetId) {
        onSelectArtwork(targetId);
        return;
      }

      if (plSupportedRef.current && !isLocked() && !plBrokenRef.current) {
        try {
          const p = dom.requestPointerLock();
          if (p && typeof p.catch === 'function') p.catch(handleLockFailure);
        } catch {
          handleLockFailure();
        }
      }
    };

    const onMouseMove = (e) => {
      if (!isLocked() || cine.current || transit.current) return;
      // Browsers can report a huge movement spike right after lock engages,
      // and some high-polling-rate mice emit jitter — both read as the
      // camera "moving by itself". Guard with a grace period + clamp.
      if (performance.now() - lockEngagedAt.current < 120) return;
      const mx = THREE.MathUtils.clamp(e.movementX, -150, 150);
      const my = THREE.MathUtils.clamp(e.movementY, -150, 150);
      yaw.current -= mx * 0.0022;
      pitch.current -= my * 0.0022;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current,
        -(Math.PI / 2 - 0.08),
        Math.PI / 2 - 0.08,
      );
    };

    const onPointerDown = (e) => {
      if (cine.current || transit.current) return;
      if (e.pointerType === 'mouse' && plSupportedRef.current && !plBrokenRef.current) return;
      lookDrag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
    };
    const onPointerMove = (e) => {
      const d = lookDrag.current;
      if (!d || d.id !== e.pointerId || cine.current || transit.current) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      yaw.current -= dx * 0.0045;
      pitch.current -= dy * 0.0045;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current,
        -(Math.PI / 2 - 0.08),
        Math.PI / 2 - 0.08,
      );
    };
    const onPointerUp = (e) => {
      const d = lookDrag.current;
      if (!d || d.id !== e.pointerId) return;
      lookDrag.current = null;

      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 10) return;

      const rect = dom.getBoundingClientRect();
      CENTER.current.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const targetId = resolveCenterTarget();
      if (targetId === 'bench') {
        onSitBench?.();
        return;
      }
      if (targetId === 'portal') {
        onEnterPortal?.();
        return;
      }
      if (targetId) {
        onSelectArtwork(targetId);
        return;
      }
    };

    const onPointerLockChange = () => {
      onLockChange(isLocked());
      if (isLocked()) {
        everLockedRef.current = true;
        lockEngagedAt.current = performance.now();
      } else {
        lastUnlockAt.current = performance.now();
        keys.current = {};
        if (focusIdRef.current) {
          focusIdRef.current = null;
          onFocusChange?.(null);
        }
      }
      syncCursor();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', handleLockFailure);
    dom.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);

    return () => {
      if (lockRequestRef) lockRequestRef.current = null;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('pointerlockerror', handleLockFailure);
      dom.style.cursor = '';
      dom.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
    };
  }, [gl, camera, scene, onSelectArtwork, onSitBench, isSeated, onStandUp, onLockChange, onLockError, onFocusChange, lockRequestRef, resolveCenterTarget]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // ------------------------------
    // ROOM-CHANGE DOOR TRANSITION
    // ------------------------------
    if (transit.current) {
      const T = transit.current;
      const setFade = (o) => {
        if (fadeRef?.current) fadeRef.current.style.opacity = String(o);
      };

      if (T.phase === 'exit') {
        T.t += dt;
        const e = easeInOut(Math.min(T.t / T.exitDur, 1));
        camera.position.set(
          THREE.MathUtils.lerp(T.from.x, T.exitX, e),
          THREE.MathUtils.lerp(T.from.y, EYE_HEIGHT, e),
          THREE.MathUtils.lerp(T.from.z, EXIT_END_Z, e),
        );
        const wy = T.from.yaw + angleDelta(Math.PI, T.from.yaw) * e;
        const wp = T.from.pitch + (0 - T.from.pitch) * e;
        camera.quaternion.setFromEuler(_EULER.set(wp, wy, 0));

        // Darken as the doorway approaches; fully black past the threshold
        setFade(THREE.MathUtils.clamp((camera.position.z - 9.35) / 1.15, 0, 1));

        if (T.t >= T.exitDur) {
          // Through the doors — reappear in the vestibule facing the room
          camera.position.set(0, EYE_HEIGHT, ENTER_START_Z);
          yaw.current = ENTER_FINAL_YAW;
          pitch.current = ENTER_FINAL_PITCH;
          curYaw.current = ENTER_FINAL_YAW;
          curPitch.current = ENTER_FINAL_PITCH;
          headRollZ.current = 0;
          stepTimer.current = 0;
          T.phase = 'enter';
          T.t = 0;
        }
        return;
      }

      // 'enter': fade back in facing inside the room, glide to the spawn point
      T.t += dt;
      const e = easeInOut(Math.min(T.t / T.enterDur, 1));
      camera.position.set(
        SPAWN.x,
        SPAWN.y,
        THREE.MathUtils.lerp(ENTER_START_Z, SPAWN.z, e),
      );
      camera.quaternion.setFromEuler(
        _EULER.set(curPitch.current, curYaw.current, 0),
      );
      setFade(1 - Math.min(T.t / 0.45, 1));

      if (T.t >= T.enterDur) {
        camera.position.set(SPAWN.x, SPAWN.y, SPAWN.z);
        yaw.current = ENTER_FINAL_YAW;
        pitch.current = ENTER_FINAL_PITCH;
        curYaw.current = ENTER_FINAL_YAW;
        curPitch.current = ENTER_FINAL_PITCH;
        vel.current.set(0, 0, 0);
        keys.current = {};
        stepTimer.current = 0;
        idleTimer.current = 0;
        headBobY.current = 0;
        headRollZ.current = 0;
        transit.current = null;
        setFade(0);
        onTransitionDone?.();
      }
      return;
    }

    if (cine.current) {
      const c = cine.current;
      const t = c.phase === 'back' ? c.saved : c.target;
      vel.current.set(0, 0, 0);
      const damp = 1 - Math.exp(-5.5 * dt);

      // Glide around obstacles first (holding eye height), then home on the pose
      if (!Array.isArray(c.legs)) c.legs = [];
      if (c.legs.length > 0) {
        const wp = c.legs[0];
        camTarget.current.set(wp.x, EYE_HEIGHT, wp.z);
        camera.position.lerp(camTarget.current, damp);
        if (camera.position.distanceTo(camTarget.current) < 0.12) c.legs.shift();
      } else {
        camTarget.current.set(t.x, t.y, t.z);
        camera.position.lerp(camTarget.current, damp);
      }

      yaw.current += angleDelta(t.yaw, yaw.current) * damp;
      pitch.current += (t.pitch - pitch.current) * damp;
      curYaw.current = yaw.current;
      curPitch.current = pitch.current;
      camera.quaternion.setFromEuler(_EULER.set(curPitch.current, curYaw.current, 0));
      if (
        c.legs.length === 0 &&
        camera.position.distanceTo(camTarget.current) < 0.01 &&
        Math.abs(angleDelta(t.yaw, yaw.current)) < 0.005 &&
        Math.abs(t.pitch - pitch.current) < 0.005
      ) {
        if (c.phase === 'back') cine.current = null;
      }
      if (focusIdRef.current) {
        focusIdRef.current = null;
        onFocusChange?.(null);
      }
      return;
    }

    const k = keys.current;
    const joy = joystickRef?.current || { x: 0, y: 0 };

    let fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) + (joy.y || 0);
    let strafe = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + (joy.x || 0);

    const len = Math.hypot(fwd, strafe);
    if (len > 1) {
      fwd /= len;
      strafe /= len;
    }

    const sprint = k.ShiftLeft || k.ShiftRight;
    const speed = sprint ? SPRINT_SPEED : WALK_SPEED;

    // Smooth rotational dampening (buttery smooth camera look-around inertia)
    const lookDamp = 1 - Math.exp(-22 * dt);
    curYaw.current += angleDelta(yaw.current, curYaw.current) * lookDamp;
    curPitch.current += (pitch.current - curPitch.current) * lookDamp;

    const sinY = Math.sin(curYaw.current);
    const cosY = Math.cos(curYaw.current);
    const tx = (-sinY * fwd + cosY * strafe) * speed;
    const tz = (-cosY * fwd - sinY * strafe) * speed;

    const damp = 1 - Math.exp(-12 * dt);
    vel.current.x += (tx - vel.current.x) * damp;
    vel.current.z += (tz - vel.current.z) * damp;

    // ----------------------------------------------------
    // WALKING CAMERA MOTION PHYSICS & SWAY
    // ----------------------------------------------------
    const groundSpeed = Math.hypot(vel.current.x, vel.current.z);
    const targetIntensity = (!isSeated && groundSpeed > 0.2) ? 1 : 0;
    const dampIntensity = 1 - Math.exp(-8 * dt);
    
    // Smoothly ramp walking motion intensity on/off
    headBobY.current = THREE.MathUtils.lerp(headBobY.current, targetIntensity, dampIntensity);

    let swayX = 0;
    let swayZ = 0;

    if (isSeated) {
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.05, damp);
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, damp);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, -4.0, damp);
      headRollZ.current = THREE.MathUtils.lerp(headRollZ.current, 0, damp);
    } else {
      const activeIntensity = headBobY.current;

      if (activeIntensity > 0.01) {
        // Step rhythm advances smoothly based on slower speed
        const stepFreq = sprint ? 8.5 : 6.0;
        stepTimer.current += dt * stepFreq;

        // 1. Subtle vertical footstep dips (~2.0 cm - 3.2 cm dip)
        const bobY = -Math.abs(Math.sin(stepTimer.current)) * (sprint ? 0.032 : 0.020) * activeIntensity;

        // 2. Gentle side-to-side body sway (~0.8 cm - 1.5 cm left/right)
        const swayAmount = Math.sin(stepTimer.current * 0.5) * (sprint ? 0.015 : 0.008) * activeIntensity;
        swayX = Math.cos(curYaw.current) * swayAmount;
        swayZ = -Math.sin(curYaw.current) * swayAmount;

        // 3. Very subtle camera roll tilt (~0.4 - 0.7 degrees tilt)
        const targetRollZ = Math.sin(stepTimer.current * 0.5) * (sprint ? 0.012 : 0.007) * activeIntensity;
        headRollZ.current = THREE.MathUtils.lerp(headRollZ.current, targetRollZ, damp);

        camera.position.y = EYE_HEIGHT + bobY;
      } else {
        // Subtle natural breathing oscillation when standing still
        idleTimer.current += dt * 1.5;
        const idleY = Math.sin(idleTimer.current) * 0.003;
        headRollZ.current = THREE.MathUtils.lerp(headRollZ.current, 0, damp);

        camera.position.y = EYE_HEIGHT + idleY;
      }
    }

    // ----------------------------------------------------
    // MOVEMENT & COLLISION RESOLUTION (AABB PUSH-OUT & WALL SLIDE)
    // ----------------------------------------------------
    if (!isSeated) {
      let nx = camera.position.x + vel.current.x * dt + swayX;
      let nz = camera.position.z + vel.current.z * dt + swayZ;

      // 1. Perimeter room walls clamp
      nx = THREE.MathUtils.clamp(nx, -BOUND, BOUND);
      nz = THREE.MathUtils.clamp(nz, -BOUND, BOUND);

      // 2. Internal architecture AABB push-out collision resolution
      //    (partitions, baffle T-walls, display islands — per hall layout)
      for (let i = 0; i < colliders.length; i++) {
        const box = colliders[i];
        if (
          nx > box.minX &&
          nx < box.maxX &&
          nz > box.minZ &&
          nz < box.maxZ
        ) {
          const distMinZ = Math.abs(nz - box.minZ);
          const distMaxZ = Math.abs(nz - box.maxZ);
          const overlapZ = Math.min(distMinZ, distMaxZ);

          const distMinX = Math.abs(nx - box.minX);
          const distMaxX = Math.abs(nx - box.maxX);
          const overlapX = Math.min(distMinX, distMaxX);

          if (overlapZ < overlapX) {
            nz = distMinZ < distMaxZ ? box.minZ : box.maxZ;
            vel.current.z = 0;
          } else {
            nx = distMinX < distMaxX ? box.minX : box.maxX;
            vel.current.x = 0;
          }
        }
      }

      camera.position.x = nx;
      camera.position.z = nz;
    }

    camera.quaternion.setFromEuler(
      _EULER.set(curPitch.current, curYaw.current, headRollZ.current),
    );

    // Aim-focus detection (occlusion-aware, interaction-reach capped)
    focusClock.current += dt;
    if (focusClock.current >= FOCUS_SCAN_INTERVAL) {
      focusClock.current = 0;
      const hitId = resolveCenterTarget();
      if (hitId !== focusIdRef.current) {
        focusIdRef.current = hitId;
        onFocusChange?.(hitId);
      }
    }
  });

  return null;
}
