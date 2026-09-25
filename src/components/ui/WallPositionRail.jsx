import React, { useMemo, useRef } from 'react';
import { AlertTriangle, CheckCircle, Crosshair, Sparkles } from 'lucide-react';
import { ARTWORK_SCALE } from '../../constants.js';

/**
 * WallPositionRail
 * ----------------
 * Interactive visual rail representing a gallery wall in 2D space.
 * Displays physical spans, existing hung artworks, collision warnings,
 * and allows precision slider dragging or slot snapping.
 */
export default function WallPositionRail({
  wallDef,
  currentOffset = 0,
  onOffsetChange,
  existingArtworks = [],
  editingArtworkId = null,
  artworkWidthIn = 36,
  artworkTitle = '',
  artworkThumbnail = null,
  presets = [],
  onSelectPreset,
}) {
  const railRef = useRef(null);

  const spanMin = wallDef?.spanMin ?? -7.5;
  const spanMax = wallDef?.spanMax ?? 7.5;
  const totalSpan = Math.max(1, spanMax - spanMin);

  // Compute physical width of the artwork being hung (in meters)
  const newWidthMeters = useMemo(() => {
    const rawInches = parseFloat(artworkWidthIn) || 36;
    return Math.max(0.4, (rawInches * 0.0254 * (ARTWORK_SCALE || 1.4)));
  }, [artworkWidthIn]);

  // Convert a meter offset to percentage [0, 100]% along the wall rail
  const toPercent = (meter) => {
    const clamped = Math.max(spanMin, Math.min(spanMax, meter));
    return ((clamped - spanMin) / totalSpan) * 100;
  };

  // Convert percentage back to meter offset
  const toMeter = (pct) => {
    const meter = spanMin + (pct / 100) * totalSpan;
    return Math.round(meter * 100) / 100;
  };

  // Artworks currently on this specific wall (excluding current one being edited)
  const wallArtworks = useMemo(() => {
    return existingArtworks.filter((a) => {
      if (editingArtworkId && (a.id === editingArtworkId || a.sanityId === editingArtworkId)) return false;
      return true;
    }).map((a) => {
      const isX = wallDef?.axis === 'x';
      const offset = isX ? (a.position?.[0] ?? 0) : (a.position?.[2] ?? 0);
      const wIn = parseFloat(a.widthIn) || 36;
      const widthMeters = Math.max(0.4, (wIn * 0.0254 * (a.scale || ARTWORK_SCALE || 1.4)));
      return {
        ...a,
        offset,
        widthMeters,
        leftMeter: offset - widthMeters / 2,
        rightMeter: offset + widthMeters / 2,
      };
    });
  }, [existingArtworks, editingArtworkId, wallDef]);

  // Check collision for current placement against existing hung artworks
  const collision = useMemo(() => {
    const newHalf = newWidthMeters / 2;
    const newLeft = currentOffset - newHalf;
    const newRight = currentOffset + newHalf;
    const BUFFER = 0.15; // 15cm minimum museum separation

    for (const art of wallArtworks) {
      // Overlap occurs if ranges [newLeft, newRight] and [art.leftMeter, art.rightMeter] intersect
      const minDistance = (newWidthMeters + art.widthMeters) / 2 + BUFFER;
      const actualDistance = Math.abs(currentOffset - art.offset);
      
      if (actualDistance < minDistance) {
        const overlap = minDistance - actualDistance;
        return {
          collides: true,
          conflictingArt: art,
          overlapMeters: Math.round(overlap * 100) / 100,
        };
      }
    }
    return { collides: false, conflictingArt: null, overlapMeters: 0 };
  }, [currentOffset, newWidthMeters, wallArtworks]);

  // Click on rail to set position
  const handleRailClick = (e) => {
    if (!railRef.current) return;
    const rect = railRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const newMeter = toMeter(pct);
    onOffsetChange(newMeter);
  };

  // Generate tick marks across the span
  const ticks = useMemo(() => {
    const list = [];
    const step = totalSpan > 10 ? 2 : 1;
    const startTick = Math.ceil(spanMin / step) * step;
    for (let m = startTick; m <= spanMax; m += step) {
      list.push(m);
    }
    return list;
  }, [spanMin, spanMax, totalSpan]);

  const currentPercent = toPercent(currentOffset);
  const newWidthPercent = (newWidthMeters / totalSpan) * 100;

  const wallCenterCoord = wallDef ? (wallDef.axis === 'x' ? wallDef.center[0] : wallDef.center[2]) : 0;

  return (
    <div className="space-y-3 bg-[#141414] border border-white/10 p-4">
      {/* Header with Live Readout & Stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#D4AF37] font-bold text-sm">
            {currentOffset >= 0 ? `+${currentOffset.toFixed(2)}m` : `${currentOffset.toFixed(2)}m`}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            (Span: {(currentOffset - newWidthMeters / 2).toFixed(2)}m to {(currentOffset + newWidthMeters / 2).toFixed(2)}m)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-slate-400">Artwork Width:</span>
          <span className="text-slate-200 font-bold">{newWidthMeters.toFixed(2)}m ({artworkWidthIn}")</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Hung on Wall:</span>
          <span className="text-[#D4AF37] font-bold">{wallArtworks.length} pieces</span>
        </div>
      </div>

      {/* Visual Wall Rail Track */}
      <div className="relative pt-4 pb-6 select-none">
        
        {/* Wall Background Bar */}
        <div
          ref={railRef}
          onClick={handleRailClick}
          className="relative h-14 bg-[#0a0a0a] border border-white/15 cursor-crosshair overflow-hidden group hover:border-[#D4AF37]/50 transition-colors"
        >
          {/* Subtle architectural wall texture lines */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:8px_8px]" />

          {/* Wall Center Line Marker */}
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-white/20 z-0 pointer-events-none"
            style={{ left: `${toPercent(wallCenterCoord)}%` }}
          />

          {/* Existing Hung Artworks on Wall */}
          {wallArtworks.map((art) => {
            const artLeftPct = toPercent(art.leftMeter);
            const artWidthPct = (art.widthMeters / totalSpan) * 100;
            return (
              <div
                key={art.id || art._id}
                className="absolute top-1 bottom-1 bg-[#222222] border border-[#D4AF37]/40 flex flex-col items-center justify-center p-0.5 overflow-hidden z-10 transition-all hover:z-30 hover:border-[#D4AF37] hover:scale-105 shadow-sm group/item"
                style={{
                  left: `${artLeftPct}%`,
                  width: `${Math.max(artWidthPct, 4)}%`,
                }}
                title={`"${art.title}" (${art.widthMeters.toFixed(2)}m @ ${art.offset.toFixed(2)}m)`}
              >
                {art.imageUrl ? (
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="w-full h-full object-cover opacity-75 group-hover/item:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full bg-[#333333] flex items-center justify-center text-[7px] text-slate-400">
                    Art
                  </div>
                )}
                {/* Tiny badge showing title on hover */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/item:flex items-center px-1.5 py-0.5 bg-[#111111] border border-[#D4AF37] text-[8px] font-mono text-[#D4AF37] whitespace-nowrap z-40 pointer-events-none shadow-lg">
                  {art.title} ({art.offset.toFixed(2)}m)
                </div>
              </div>
            );
          })}

          {/* Current New / Edited Artwork Ghost Indicator */}
          <div
            className={`absolute top-0 bottom-0 z-20 pointer-events-none transition-all flex flex-col items-center justify-center ${
              collision.collides
                ? 'border-2 border-red-500 bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'border-2 border-[#D4AF37] bg-[#D4AF37]/25 shadow-[0_0_12px_rgba(212,175,55,0.4)]'
            }`}
            style={{
              left: `${Math.max(0, currentPercent - newWidthPercent / 2)}%`,
              width: `${newWidthPercent}%`,
            }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-0.5 text-center overflow-hidden">
              <span className={`text-[8px] font-mono font-bold leading-tight truncate px-0.5 ${
                collision.collides ? 'text-red-300' : 'text-[#D4AF37]'
              }`}>
                {artworkTitle || 'Current'}
              </span>
              <span className="text-[7px] font-mono text-white/90">
                {currentOffset.toFixed(2)}m
              </span>
            </div>

            {/* Center target crosshair */}
            <div
              className={`absolute top-0 bottom-0 w-[2px] ${
                collision.collides ? 'bg-red-400' : 'bg-[#D4AF37]'
              }`}
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            />
          </div>
        </div>

        {/* Meter Axis Ticks below Wall Track */}
        <div className="relative h-4 mt-1 text-[8px] font-mono text-slate-500 pointer-events-none">
          {ticks.map((meter) => (
            <div
              key={meter}
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${toPercent(meter)}%` }}
            >
              <div className="w-[1px] h-1.5 bg-white/20 mb-0.5" />
              <span>{meter >= 0 ? `+${meter}` : meter}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Precision Slider Control */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>{spanMin.toFixed(1)}m (Left End)</span>
          <span className="text-[#D4AF37] flex items-center gap-1 font-bold">
            <Crosshair className="w-3 h-3" /> Drag Slider to Fine-Tune Position
          </span>
          <span>{spanMax >= 0 ? `+${spanMax.toFixed(1)}` : spanMax.toFixed(1)}m (Right End)</span>
        </div>
        <input
          type="range"
          min={spanMin + 0.3}
          max={spanMax - 0.3}
          step="0.05"
          value={currentOffset}
          onChange={(e) => onOffsetChange(parseFloat(e.target.value))}
          className="w-full accent-[#D4AF37] cursor-pointer bg-white/10 h-1.5 rounded-none"
        />
      </div>

      {/* Collision Warning or Clean Status */}
      {collision.collides ? (
        <div className="p-2.5 bg-red-950/30 border border-red-500/50 flex items-start gap-2.5 text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-[11px]">
              Physical Space Conflict: Overlaps with "{collision.conflictingArt.title}"
            </p>
            <p className="text-[10px] font-mono text-red-300/80">
              Needs at least {collision.overlapMeters.toFixed(2)}m more clearance. Drag the slider or click an available slot preset below.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-2 bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Position clear — no physical artwork collision on this wall.</span>
          </div>
          <span className="text-slate-400">
            {wallArtworks.length} of {Math.floor(totalSpan / 2.2)} spots filled
          </span>
        </div>
      )}

      {/* Slot Presets Grid below Visual Rail */}
      {presets.length > 0 && (
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-luxury-wide text-slate-400">
            <span>Quick-Jump Museum Slots</span>
            <span className="font-mono text-[9px] text-[#D4AF37]">{presets.length} Presets Available</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {presets.map((slot) => {
              const isSelected = Math.abs(currentOffset - slot.offset) < 0.1;
              const slotArt = wallArtworks.find((a) => Math.abs(a.offset - slot.offset) < 0.8);
              const isTaken = !!slotArt;

              return (
                <button
                  type="button"
                  key={slot.id}
                  onClick={() => {
                    onOffsetChange(slot.offset);
                    onSelectPreset?.(slot.id);
                  }}
                  className={`py-1.5 px-1 border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-[#D4AF37] text-[#111111] border-[#D4AF37] font-bold shadow-md'
                      : isTaken
                      ? 'bg-[#1a1212] border-white/10 text-slate-400 hover:border-red-400/50'
                      : 'bg-[#181818] border-white/10 text-slate-300 hover:border-[#D4AF37] hover:text-[#FAFAFA]'
                  }`}
                  title={isTaken ? `Occupied by "${slotArt.title}"` : `Slot offset: ${slot.meter}`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-tight truncate max-w-full">
                    {slot.label}
                  </span>
                  <span className={`text-[8px] font-mono leading-none ${isSelected ? 'text-[#111111]' : 'text-slate-500'}`}>
                    {slot.meter}
                  </span>
                  {isTaken && (
                    <span className="text-[7px] font-mono text-amber-400/90 truncate max-w-full">
                      Taken
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
