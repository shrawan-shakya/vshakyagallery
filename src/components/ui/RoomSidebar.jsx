import React from 'react';
import { X } from 'lucide-react';

export default function RoomSidebar({
  isOpen,
  rooms = [],
  currentRoomId,
  onSelectRoom,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 max-w-[85vw] z-20 pointer-events-auto flex flex-col font-sans bg-[#F2EDE1] text-[#1A1A1A] rounded-none shadow-[0_24px_60px_rgba(0,0,0,0.5)] border border-[#D4AF37]/30 overflow-hidden animate-slide-in-right">

      {/* HEADER */}
      <div className="relative shrink-0 px-7 pt-6 pb-5 bg-[#E9E3D4] border-b border-[#D4AF37]/30">
        <button
          onClick={onClose}
          aria-label="Close wing picker"
          className="absolute top-3 right-3 w-8 h-8 rounded-none border border-black/30 bg-[#F2EDE1]/90 text-[#1A1A1A] hover:bg-[#F2EDE1] flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="block text-[10px] font-bold uppercase tracking-luxury-extreme text-[#D4AF37] mb-2">
          SHAKYA GALLERIES
        </span>
        <h2 className="font-serif text-[26px] font-medium leading-tight text-[#141110]">
          Choose a Wing
        </h2>
        <p className="mt-1 font-serif italic text-[13px] text-[#45403A]">
          Continue through to another exhibition room
        </p>
      </div>

      {/* ROOM LIST */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 plaque-scrollbar">
        {rooms.length === 0 && (
          <p className="text-xs text-[#6D675C] px-2 py-4">
            No other wings are currently open.
          </p>
        )}
        {rooms.map((room) => {
          const isCurrent = room.id === currentRoomId;
          return (
            <button
              key={room.id}
              disabled={isCurrent}
              onClick={() => onSelectRoom?.(room.id)}
              className={`w-full text-left px-4 py-3 rounded-none border transition-all ${
                isCurrent
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 cursor-default'
                  : 'border-black/15 bg-white/60 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-serif text-sm font-medium leading-snug text-[#141110]">
                  {room.title}
                </span>
                {isCurrent ? (
                  <span className="shrink-0 text-[8px] font-extrabold uppercase tracking-luxury-wide bg-[#111111] text-[#D4AF37] px-2 py-1 mt-0.5">
                    Current
                  </span>
                ) : (
                  <span className="shrink-0 text-[8px] font-extrabold uppercase tracking-luxury-wide text-[#D4AF37] px-2 py-1 mt-0.5 border border-[#D4AF37]/50">
                    Enter →
                  </span>
                )}
              </div>
              {room.artist_name && (
                <span className="block mt-1 font-serif italic text-xs text-[#45403A]">
                  {room.artist_name}
                </span>
              )}
              {room.description && (
                <span className="block mt-1 text-[11px] leading-relaxed text-[#6D675C] line-clamp-2">
                  {room.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="shrink-0 p-4 bg-[#E9E3D4] border-t border-[#D4AF37]/30">
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#111111] text-[#F2EDE1] text-[10px] font-bold uppercase tracking-luxury-extreme hover:bg-[#D4AF37] hover:text-[#111111] transition-all rounded-none shadow-md"
        >
          Return to Gallery
        </button>
      </div>
    </div>
  );
}
