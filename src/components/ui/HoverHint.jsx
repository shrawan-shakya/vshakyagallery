import React, { useEffect, useRef } from 'react';
import { MousePointerClick } from 'lucide-react';

export default function HoverHint({ visible }) {
  const posRef = useRef(null);

  useEffect(() => {
    const move = (e) => {
      if (!posRef.current) return;
      const x = Math.min(e.clientX + 16, window.innerWidth - 190);
      const y = Math.min(e.clientY + 20, window.innerHeight - 48);
      posRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <div ref={posRef} className="pointer-events-none fixed left-0 top-0 z-40 will-change-transform">
      <div
        className={[
          'flex items-center gap-1.5 px-3 py-1.5',
          'bg-[#f6f2e8] ring-1 ring-black/60 shadow-[0_10px_28px_rgba(0,0,0,0.45)]',
          'origin-left transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
        ].join(' ')}
      >
        <MousePointerClick className="h-3 w-3 text-[#191510]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#191510]">
          View Details
        </span>
      </div>
    </div>
  );
}
