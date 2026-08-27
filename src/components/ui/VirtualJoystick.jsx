import React, { useEffect, useRef } from 'react';

const MAX_RADIUS = 44;

export default function VirtualJoystick({ vectorRef }) {
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const activeId = useRef(null);
  const originRef = useRef({ x: 0, y: 0 });

  // If the joystick unmounts mid-drag (e.g. mode switch), zero the movement
  // vector or the walk camera would drift forever in the last direction
  useEffect(() => {
    return () => {
      if (vectorRef) vectorRef.current = { x: 0, y: 0 };
    };
  }, [vectorRef]);

  const updateKnob = (dx, dy) => {
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, MAX_RADIUS);
    const nx = dist === 0 ? 0 : (dx / dist) * clampedDist;
    const ny = dist === 0 ? 0 : (dy / dist) * clampedDist;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }
    if (vectorRef) {
      // Screen up = forward (positive y)
      vectorRef.current = { x: nx / MAX_RADIUS, y: -ny / MAX_RADIUS };
    }
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    activeId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const rect = baseRef.current?.getBoundingClientRect();
    if (rect) {
      originRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      updateKnob(e.clientX - originRef.current.x, e.clientY - originRef.current.y);
    }
  };

  const onPointerMove = (e) => {
    if (activeId.current !== e.pointerId) return;
    updateKnob(e.clientX - originRef.current.x, e.clientY - originRef.current.y);
  };

  const release = (e) => {
    if (activeId.current !== e.pointerId) return;
    activeId.current = null;
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
    if (vectorRef) vectorRef.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={baseRef}
      className="pointer-events-auto relative h-28 w-28 touch-none select-none rounded-full border border-white/15 bg-slate-950/60 shadow-lg backdrop-blur-md"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className="absolute inset-3 rounded-full border border-white/10" />
      <div
        ref={knobRef}
        className="absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 rounded-full border border-amber-300/60 bg-amber-500/90 shadow-lg will-change-transform"
        style={{ transform: 'translate(0px, 0px)' }}
      />
      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest text-slate-400">
        Move
      </span>
    </div>
  );
}
