import React from 'react';

export default function RoomTransitionLoader({
  active = false,
  fading = false,
  roomTitle = 'Gallery Wing',
  artistName = '',
  progress = 0,
  status = 'Preparing Exhibition Wing...',
  itemDetail = '',
}) {
  if (!active) return null;

  const displayPercent = Math.min(Math.max(Math.round(progress), 0), 100);

  return (
    <div
      className={`fixed inset-0 z-[95] flex flex-col items-center justify-center bg-[#060608] text-[#FAFAFA] font-sans select-none transition-opacity duration-500 ease-in-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Luxury Crest Emblem */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border border-[#D4AF37]/30 flex items-center justify-center animate-pulse">
          <div className="w-10 h-10 border-2 border-[#D4AF37] rotate-45 flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.45)]">
            <span className="-rotate-45 text-[#D4AF37] font-serif text-base font-extrabold tracking-wider">
              S
            </span>
          </div>
        </div>
      </div>

      {/* Shakya Gallery Main Brand */}
      <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-[0.3em] uppercase text-[#FAFAFA] mb-1 text-center">
        SHAKYA GALLERY
      </h1>

      {/* Transition Subtitle */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-[1px] bg-[#D4AF37]/40" />
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37] font-mono">
          ENTERING EXHIBITION WING
        </p>
        <span className="w-6 h-[1px] bg-[#D4AF37]/40" />
      </div>

      {/* Destination Wing Title */}
      <div className="text-center px-4 mb-2 max-w-lg">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100 tracking-[0.15em] uppercase drop-shadow-[0_2px_8px_rgba(212,175,55,0.2)]">
          {roomTitle}
        </h2>
        {artistName && (
          <p className="text-xs text-slate-400 font-mono tracking-widest mt-1">
            Featuring Works by {artistName}
          </p>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="w-72 sm:w-84 bg-white/5 border border-[#D4AF37]/30 h-2 p-0.5 rounded-none overflow-hidden shadow-inner mt-4 mb-3">
        <div
          className="bg-gradient-to-r from-[#b8952b] via-[#D4AF37] to-[#fff3dc] h-full transition-all duration-300 ease-out shadow-[0_0_14px_rgba(212,175,55,0.85)]"
          style={{ width: `${Math.max(displayPercent, 6)}%` }}
        />
      </div>

      {/* Percentage & Status Counters */}
      <div className="flex items-center justify-between w-72 sm:w-84 text-[11px] font-mono text-slate-400">
        <span className="truncate pr-2">{status}</span>
        <span className="text-[#D4AF37] font-bold shrink-0">{displayPercent}%</span>
      </div>

      {/* Current item or detail */}
      {itemDetail ? (
        <div className="text-[9px] font-mono text-slate-500 max-w-xs sm:max-w-sm truncate mt-2 uppercase tracking-wider text-center">
          {itemDetail}
        </div>
      ) : (
        <div className="h-4 mt-2" />
      )}
    </div>
  );
}
