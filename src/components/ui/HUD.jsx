import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Orbit, 
  Footprints, 
  HelpCircle, 
  X, 
  BookOpen, 
  Sun, 
  Moon, 
  Sparkles,
  MousePointerClick,
  Keyboard,
  List,
  RefreshCw,
  Layers,
  Armchair,
  Volume2,
  VolumeX
} from 'lucide-react';
import { ambientSoundscape } from '../../utils/ambientAudio';

export default function HUD({
  mode,
  viewMode,
  onToggleMode,
  selectedArtwork,
  isSeated = false,
  onStandUp,
  onResetView,
  onOpenAdmin,
  artworks = [],
  rooms = [],
  artists = [],
  currentRoomId = 'room-main',
  onSelectRoom,
  onSelectArtwork,
  focusTarget,
  focusedArtwork,
  isLocked = false,
  lockFailed = false,
  lockRequestRef,
  theme: externalTheme,
  setTheme: externalSetTheme,
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [internalTheme, setInternalTheme] = useState('dark');
  const [showWalkOverlay, setShowWalkOverlay] = useState(false);
  const [hasWalkedOnce, setHasWalkedOnce] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  // Auto-start ambient music on load & satisfy browser autoplay policies on first interaction
  useEffect(() => {
    ambientSoundscape.start();
    setIsMusicPlaying(true);

    const unlockAudio = () => {
      ambientSoundscape.start();
      setIsMusicPlaying(true);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const handleToggleMusic = () => {
    const playing = ambientSoundscape.toggle();
    setIsMusicPlaying(playing);
  };

  const currentMode = mode || viewMode || 'orbit';
  const isDark = (externalTheme || internalTheme) === 'dark';
  const isWalkMode = currentMode === 'walk';

  const setTheme = externalSetTheme || setInternalTheme;
  const targetId = focusTarget || focusedArtwork;
  const activeFocusArtwork = typeof targetId === 'object' ? targetId : artworks.find(a => a.id === targetId);

  // Apply light/dark theme class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0
      );
    };
    checkTouch();
  }, []);

  // First time entering walk mode shows quick tutorial popup
  useEffect(() => {
    if (isWalkMode && !hasWalkedOnce) {
      setShowWalkOverlay(true);
      setHasWalkedOnce(true);
    }
  }, [isWalkMode, hasWalkedOnce]);

  const showResumePill =
    isWalkMode &&
    !isTouchDevice &&
    !isLocked &&
    !lockFailed &&
    !selectedArtwork &&
    !showWalkOverlay &&
    !showHelp &&
    hasWalkedOnce;

  const startWalking = () => {
    setShowWalkOverlay(false);
    lockRequestRef?.current?.();
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 font-sans select-none">
      
      {/* 1. TOP BAR */}
      <header className="flex justify-between items-center w-full pointer-events-auto">
        {/* Title Panel */}
        <div className="bg-[#111111]/90 backdrop-blur-md border border-[#D4AF37]/30 px-5 py-3 rounded-none flex items-center gap-3 shadow-md">
          <div className="w-8 h-8 rounded-none bg-[#D4AF37] flex items-center justify-center animate-pulse">
            <Compass className="w-5 h-5 text-[#111111]" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold tracking-luxury-wide text-[#FAFAFA] leading-none">
              SHAKYA GALLERY
            </h1>
            <p className="text-[9px] text-[#D4AF37] tracking-luxury-extreme font-sans uppercase mt-1">
              Interactive 3D Exhibition
            </p>
          </div>
        </div>

        {/* Quick Utility controls */}
        <div className="flex gap-2">
          {/* Curator Admin Dashboard Trigger */}
          <button
            onClick={onOpenAdmin}
            className="px-4 h-10 rounded-none bg-[#D4AF37] hover:bg-[#b8952b] text-[#111111] font-bold text-xs uppercase tracking-luxury-wide flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
            title="Upload artwork & manage rooms"
          >
            <Sparkles className="w-4 h-4 text-[#111111]" />
            <span className="hidden sm:inline">Curator Admin</span>
          </button>

          {/* View Mode Toggle (Orbit <-> Walk) */}
          <button 
            onClick={onToggleMode}
            className="w-10 h-10 rounded-none bg-[#111111]/90 backdrop-blur-md border border-[#D4AF37]/30 text-[#FAFAFA] hover:text-[#D4AF37] hover:border-[#D4AF37] flex items-center justify-center transition-all active:scale-95 shadow-md"
            title={isWalkMode ? 'Switch back to Orbit view' : 'Switch to Walk mode'}
          >
            {isWalkMode ? <Orbit className="w-5 h-5 text-[#D4AF37]" /> : <Footprints className="w-5 h-5 text-[#D4AF37]" />}
          </button>

          {/* Theme Toggler */}
          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-10 h-10 rounded-none bg-[#111111]/90 backdrop-blur-md border border-[#D4AF37]/30 text-[#FAFAFA] hover:text-[#D4AF37] hover:border-[#D4AF37] flex items-center justify-center transition-all active:scale-95 shadow-md"
            title="Toggle Gallery lighting theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-[#D4AF37]" /> : <Moon className="w-5 h-5 text-[#D4AF37]" />}
          </button>

          {/* Ambient Music Soundscape Toggler */}
          <button 
            onClick={handleToggleMusic}
            className={`w-10 h-10 rounded-none backdrop-blur-md border flex items-center justify-center transition-all active:scale-95 shadow-md ${
              isMusicPlaying 
                ? 'bg-[#D4AF37] border-[#D4AF37] text-[#111111]' 
                : 'bg-[#111111]/90 border-[#D4AF37]/30 text-[#FAFAFA] hover:text-[#D4AF37] hover:border-[#D4AF37]'
            }`}
            title={isMusicPlaying ? 'Mute ambient gallery soundscape' : 'Play ambient gallery soundscape'}
          >
            {isMusicPlaying ? <Volume2 className="w-5 h-5 text-[#111111]" /> : <VolumeX className="w-5 h-5 text-[#D4AF37]" />}
          </button>

          {/* Help Button */}
          <button 
            onClick={() => setShowHelp(true)}
            className="w-10 h-10 rounded-none bg-[#111111]/90 backdrop-blur-md border border-[#D4AF37]/30 text-[#FAFAFA] hover:text-[#D4AF37] hover:border-[#D4AF37] flex items-center justify-center transition-all active:scale-95 shadow-md"
            title="How to navigate"
          >
            <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
          </button>
        </div>
      </header>

      {/* 2. CENTER SIDE PANEL (Gallery Guide drawer) */}
      <div className="flex-1 flex items-center pointer-events-none my-4">
        {/* Guide Drawer Trigger */}
        {!showGuide && (
          <button
            onClick={() => setShowGuide(true)}
            className="pointer-events-auto w-10 h-24 rounded-none bg-[#111111]/90 backdrop-blur-md border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#FAFAFA] hover:text-[#D4AF37] flex flex-col items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            title="Open exhibition map guide"
          >
            <List className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[9px] uppercase font-bold tracking-luxury-extreme writing-vertical rotate-180">
              Guide
            </span>
          </button>
        )}

        {/* Actual Guide Side Drawer */}
        {showGuide && (
          <div className="pointer-events-auto w-80 max-h-[80vh] flex flex-col bg-[#111111]/95 backdrop-blur-md border border-[#D4AF37]/40 rounded-none shadow-2xl overflow-hidden animate-slide-in-left">
            <div className="p-4 border-b border-[#D4AF37]/30 flex justify-between items-center bg-[#181818]">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <BookOpen className="w-5 h-5" />
                <span className="font-serif text-sm font-semibold uppercase tracking-luxury-wide text-[#FAFAFA]">
                  EXHIBITION CATALOGUE
                </span>
              </div>
              <button 
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-[#FAFAFA] p-1 hover:bg-white/5 transition-all rounded-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Room Wing Switcher Dropdown */}
            {rooms.length > 0 && (
              <div className="p-3 border-b border-[#D4AF37]/20 bg-[#111111]">
                <label className="block text-[9px] font-bold uppercase tracking-luxury-wide text-slate-400 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-[#D4AF37]" />
                  Select Artist Wing / Hall:
                </label>
                <select
                  value={currentRoomId}
                  onChange={(e) => onSelectRoom?.(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 rounded-none px-2.5 py-1.5 text-xs text-[#D4AF37] font-medium outline-none focus:border-[#D4AF37]"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.artist_name || 'Group'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scrollable list of artworks */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[55vh] custom-scrollbar">
              {artworks.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-mono">
                  No artworks in this wing yet. Click "Curator Admin" to upload!
                </div>
              ) : (
                artworks.map((art) => {
                  const isSelected = selectedArtwork === art.id;
                  return (
                    <button
                      key={art.id}
                      onClick={() => onSelectArtwork(art.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-none text-left border transition-all ${
                        isSelected
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                          : 'bg-[#181818] border-white/10 text-slate-300 hover:border-[#D4AF37]/40 hover:text-[#FAFAFA]'
                      }`}
                    >
                      <img 
                        src={art.imageUrl} 
                        alt={art.title} 
                        className="w-10 h-10 object-cover rounded-none border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">
                          {art.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {art.artist} • {art.year}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM HUD */}
      <footer className="flex justify-between items-end w-full">
        <div className="hidden md:flex bg-[#111111]/90 backdrop-blur-md border border-[#D4AF37]/30 px-4 py-2.5 rounded-none items-center gap-2.5 text-[10px] text-slate-300 font-mono shadow-md">
          {isWalkMode ? (
            isTouchDevice ? (
              <>
                <MousePointerClick className="w-4 h-4 text-[#D4AF37]" />
                <span>JOYSTICK TO MOVE • DRAG SCREEN TO LOOK • TAP ARTWORK TO INSPECT</span>
              </>
            ) : (
              <>
                <Keyboard className="w-4 h-4 text-[#D4AF37]" />
                <span>
                  {isLocked
                    ? 'WASD MOVE • SHIFT RUN • AIM + CLICK/E TO INSPECT • ESC RELEASE CURSOR'
                    : lockFailed
                      ? 'WASD MOVE • DRAG TO LOOK • CLICK PAINTING TO INSPECT'
                      : 'CLICK TO LOCK CURSOR'}
                </span>
              </>
            )
          ) : (
            <>
              <MousePointerClick className="w-4 h-4 text-[#D4AF37]" />
              <span>CLICK ARTWORK TO FOCUS • ROTATE AND ZOOM IN HALL VIEW</span>
            </>
          )}
        </div>

        <div className="flex gap-2 mx-auto md:mx-0 pointer-events-auto">
          {(selectedArtwork || isWalkMode) && (
            <button
              onClick={onResetView}
              className="flex items-center gap-2 px-5 py-3 rounded-none bg-[#D4AF37] text-[#111111] font-bold text-xs uppercase tracking-luxury-wide hover:bg-[#b8952b] transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              {isWalkMode ? 'Back to Entrance' : 'Reset Gallery View'}
            </button>
          )}
        </div>
      </footer>

      {/* Subtle Luxury Aiming Dot / Reticle in walk mode */}
      {isWalkMode && !selectedArtwork && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center justify-center">
          {/* Subtle Aiming Dot */}
          <div
            className={`relative flex items-center justify-center transition-all duration-200 ${
              activeFocusArtwork ? 'w-10 h-10' : 'w-4 h-4'
            }`}
          >
            {activeFocusArtwork ? (
              <div className="absolute inset-0 border-2 border-[#D4AF37] bg-[#D4AF37]/20 shadow-[0_0_12px_#D4AF37] animate-pulse" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] ring-2 ring-black/50 shadow-[0_0_8px_#D4AF37]" />
            )}
          </div>

          {/* Hover Plaque / Bench Preview under aiming dot */}
          <div
            className={`absolute top-full mt-3 w-max max-w-[280px] transition-all duration-200 ${
              (activeFocusArtwork || focusTarget === 'bench' || focusTarget === 'portal') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          >
            {activeFocusArtwork ? (
              <div className="relative px-4 py-3 bg-[#F2EDE1] text-[#1A1A1A] border-2 border-[#D4AF37] shadow-2xl flex flex-col items-center gap-0.5 rounded-none">
                <span className="font-serif text-xs font-bold text-[#111111] leading-tight text-center">
                  {activeFocusArtwork.title}
                </span>
                <span className="text-[9px] uppercase tracking-luxury-wide text-[#6D675C]">
                  {activeFocusArtwork.artist} · {activeFocusArtwork.year}
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-luxury-wide text-[#111111] bg-[#D4AF37] px-2.5 py-0.5 mt-1">
                  Click / Press E — Inspect
                </span>
              </div>
            ) : focusTarget === 'bench' ? (
              <div className="relative px-4 py-2.5 bg-[#111111] text-[#FAFAFA] border-2 border-[#D4AF37] shadow-2xl flex flex-col items-center gap-0.5 rounded-none">
                <span className="font-serif text-xs font-bold text-[#D4AF37] leading-tight text-center flex items-center gap-1.5">
                  <Armchair className="w-3.5 h-3.5 text-[#D4AF37]" />
                  CENTRAL MUSEUM BENCH
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-luxury-wide text-[#111111] bg-[#D4AF37] px-2.5 py-0.5 mt-1">
                  Click / Press E - Sit & Observe
                </span>
              </div>
            ) : focusTarget === 'portal' ? (
              <div className="relative px-4 py-2.5 bg-[#111111] text-[#FAFAFA] border-2 border-[#D4AF37] shadow-2xl flex flex-col items-center gap-0.5 rounded-none">
                <span className="font-serif text-xs font-bold text-[#D4AF37] leading-tight text-center flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5 text-[#D4AF37]" />
                  NEXT WING BOARD
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-luxury-wide text-[#111111] bg-[#D4AF37] px-2.5 py-0.5 mt-1">
                  Click / Press E - Choose Wing
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* First-time walk mode entry overlay */}
      {showWalkOverlay && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
          onClick={startWalking}
        >
          <div
            className="bg-[#111111] border border-[#D4AF37]/40 rounded-none max-w-sm w-full p-8 text-center shadow-2xl animate-slide-in-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowWalkOverlay(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-[#FAFAFA] p-1 transition-all rounded-none"
              title="Close tutorial"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 mx-auto mb-4 rounded-none bg-[#D4AF37] flex items-center justify-center shadow-lg">
              <Footprints className="w-7 h-7 text-[#111111]" />
            </div>
            <h3 className="font-serif text-xl font-bold tracking-luxury-wide text-[#FAFAFA] uppercase">
              Walk Mode
            </h3>
            <p className="text-[10px] text-[#D4AF37] font-sans tracking-luxury-wide mt-1 mb-6 uppercase">
              Explore the gallery at eye level
            </p>

            <div className="space-y-1 text-xs text-slate-300 font-mono text-left">
              {[
                ['MOVE', 'W A S D / ARROWS', true],
                ['RUN', 'HOLD SHIFT', true],
                ['LOOK AROUND', 'MOVE MOUSE', true],
                ['INSPECT PAINTING', 'AIM + CLICK / E', true],
                ['RELEASE CURSOR', 'ESC', false],
              ].map(([label, value, hasBorder]) => (
                <div
                  key={label}
                  className={`flex justify-between py-1.5 ${hasBorder ? 'border-b border-white/10' : ''}`}
                >
                  <span className="text-slate-400">{label}</span>
                  <span className="text-[#D4AF37] font-bold">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={startWalking}
              className="mt-6 w-full py-3.5 bg-[#D4AF37] hover:bg-[#b8952b] text-[#111111] font-bold text-xs uppercase tracking-luxury-extreme transition-all shadow-md flex items-center justify-center gap-2 rounded-none"
            >
              <Footprints className="w-4 h-4" />
              Start Walking
            </button>
          </div>
        </div>
      )}

      {/* Seated Panoramic View Banner */}
      {isSeated && !selectedArtwork && (
        <div className="fixed left-1/2 bottom-20 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-4 px-6 py-3 bg-[#111111]/95 border-2 border-[#D4AF37] text-[#FAFAFA] shadow-2xl animate-slide-in-left rounded-none">
          <Armchair className="w-5 h-5 text-[#D4AF37] shrink-0" />
          <div className="flex flex-col">
            <span className="font-serif text-sm font-bold text-[#FAFAFA]">SEATED PANORAMIC VIEW</span>
            <span className="text-[9px] uppercase tracking-luxury-wide text-[#D4AF37]">Observing exhibition from central museum bench</span>
          </div>
          <button
            onClick={onStandUp}
            className="ml-2 px-4 py-2 bg-[#D4AF37] text-[#111111] font-bold text-xs uppercase tracking-luxury-wide hover:bg-[#b8952b] transition-all rounded-none shadow-md"
          >
            Stand Up
          </button>
        </div>
      )}

      {/* 4. CURSOR LOCK / RELEASE UI PILLS */}
      {/* A. When cursor is UNLOCKED: prompt user to click screen */}
      {showResumePill && !isSeated && (
        <button
          onClick={startWalking}
          className="fixed left-1/2 bottom-24 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2 px-5 py-3 bg-[#111111]/95 backdrop-blur-md border-2 border-[#D4AF37] text-[#FAFAFA] hover:text-[#D4AF37] text-[11px] font-bold uppercase tracking-luxury-wide shadow-2xl transition-all rounded-none animate-bounce-subtle"
        >
          <MousePointerClick className="w-4 h-4 text-[#D4AF37]" />
          Click screen to lock cursor & walk
        </button>
      )}

      {/* B. When cursor IS LOCKED: show clear "Press ESC to release cursor" chip */}
      {isWalkMode && !isTouchDevice && isLocked && !selectedArtwork && (
        <div className="fixed left-1/2 top-16 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2.5 px-4 py-2 bg-[#111111]/90 backdrop-blur-md border border-[#D4AF37]/50 text-[#FAFAFA] text-[11px] font-bold uppercase tracking-luxury-wide shadow-xl rounded-none">
          <kbd className="px-2 py-0.5 bg-[#D4AF37] text-[#111111] font-mono text-[10px] font-extrabold rounded-none shadow">
            ESC
          </kbd>
          <span className="text-slate-200">Press ESC to release cursor</span>
        </div>
      )}

      {/* Pointer-lock unavailable chip fallback */}
      {isWalkMode && !isTouchDevice && lockFailed && !selectedArtwork && (
        <div className="fixed left-1/2 bottom-24 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-3 bg-[#111111]/90 backdrop-blur-md border border-[#D4AF37]/50 text-[#FAFAFA] text-[11px] font-bold uppercase tracking-luxury-wide shadow-lg rounded-none">
          <MousePointerClick className="w-4 h-4 text-[#D4AF37]" />
          Drag to look · WASD to move
        </div>
      )}

      {/* Help Modal Overlay */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto p-4">
          <div className="bg-[#111111] border border-[#D4AF37]/40 rounded-none max-w-sm w-full p-6 text-[#FAFAFA] shadow-2xl relative">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-[#FAFAFA] p-1 hover:bg-white/5 transition-all rounded-none"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-[#D4AF37] mb-4">
              <HelpCircle className="w-6 h-6 text-[#D4AF37]" />
              <h3 className="font-serif font-semibold uppercase tracking-luxury-wide text-base">NAVIGATION GUIDE</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-mono">
              {isWalkMode ? (
                isTouchDevice ? (
                  <>
                    <div className="flex justify-between border-b border-white/10 py-1.5">
                      <span>MOVE</span>
                      <span className="text-[#D4AF37] font-bold">JOYSTICK (BOTTOM LEFT)</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 py-1.5">
                      <span>LOOK AROUND</span>
                      <span className="text-[#D4AF37] font-bold">DRAG SCREEN</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 py-1.5">
                      <span>INSPECT PAINTING</span>
                      <span className="text-[#D4AF37] font-bold">TAP PAINTING</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span>CLOSE DETAILS</span>
                      <span className="text-[#D4AF37] font-bold">RESET BUTTON / ESC</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between border-b border-white/10 py-1.5">
                      <span>LOCK CURSOR</span>
                      <span className="text-[#D4AF37] font-bold">CLICK SCREEN</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 py-1.5">
                      <span>MOVE</span>
                      <span className="text-[#D4AF37] font-bold">W A S D / ARROWS</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 py-1.5">
                      <span>RUN</span>
                      <span className="text-[#D4AF37] font-bold">HOLD SHIFT</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 py-1.5">
                      <span>LOOK AROUND</span>
                      <span className="text-[#D4AF37] font-bold">MOVE MOUSE (LOCKED)</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 py-1.5">
                      <span>INSPECT PAINTING</span>
                      <span className="text-[#D4AF37] font-bold">AIM CROSSHAIR + CLICK / E</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span>RELEASE CURSOR</span>
                      <span className="text-[#D4AF37] font-bold">ESC</span>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="flex justify-between border-b border-white/10 py-1.5">
                    <span>ROTATE CAMERA</span>
                    <span className="text-[#D4AF37] font-bold">LEFT CLICK + DRAG</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 py-1.5">
                    <span>PAN CAMERA</span>
                    <span className="text-[#D4AF37] font-bold">RIGHT CLICK + DRAG</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 py-1.5">
                    <span>ZOOM IN / OUT</span>
                    <span className="text-[#D4AF37] font-bold">SCROLL WHEEL</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 py-1.5">
                    <span>INSPECT PAINTING</span>
                    <span className="text-[#D4AF37] font-bold">LEFT CLICK PAINTING</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>CLOSE DETAILS</span>
                    <span className="text-[#D4AF37] font-bold">RESET BUTTON / ESC</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-2.5 bg-[#D4AF37] text-[#111111] hover:bg-[#b8952b] text-xs font-bold uppercase tracking-luxury-wide transition-all rounded-none"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
