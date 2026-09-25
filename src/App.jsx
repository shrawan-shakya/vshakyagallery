import React, { useState, useEffect, Suspense, useRef, useMemo, useCallback, lazy } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, useProgress, PerformanceMonitor, Preload, Stats } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { fetchArtworksAPI, fetchRoomsAPI, fetchArtistsAPI, fallbackArtworks } from './data/artworks';

// 3D Components
import GalleryRoom from './components/3d/GalleryRoom';
import ArtworkFrame from './components/3d/ArtworkFrame';
import GalleryCamera from './components/3d/GalleryCamera';
import WalkControls from './components/3d/WalkControls';
import Lights from './components/3d/Lights';
import RoomPortal from './components/3d/RoomPortal';
import MuseumBench from './components/3d/MuseumBench';
import NearestPictureLights from './components/3d/NearestPictureLights';
import { getColliders } from './utils/hallLayouts';
import {
  QUALITY_TIERS,
  detectQualityTier,
  lowerTier,
  nextQualityPreference,
  readQualityPreference,
  writeQualityPreference,
} from './utils/quality';

// UI Components
import HUD from './components/ui/HUD';
import VirtualJoystick from './components/ui/VirtualJoystick';
import ArtworkModal from './components/ui/ArtworkModal';
import HoverHint from './components/ui/HoverHint';
import RoomSidebar from './components/ui/RoomSidebar';

// Curator-only panel: its chunk is only fetched the first time it is opened
const AdminModal = lazy(() => import('./components/ui/AdminModal'));

// Fullscreen Luxury Gallery Splash / Loading Screen Overlay
function FullscreenGalleryLoader({ isReady = false }) {
  const { active, progress, item, loaded, total } = useProgress();
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const isDreiDone = !active || progress >= 98 || (total > 0 && loaded >= total);
    // Dismiss only when BOTH the 3D scene AND the server artworks have arrived
    if (isReady && isDreiDone) {
      const fadeTimer = setTimeout(() => setFading(true), 400);
      const unmountTimer = setTimeout(() => setMounted(false), 1100);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [isReady, active, progress, loaded, total]);

  // Safety fallback: Unmount after 9 seconds max so screen can never freeze indefinitely
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setFading(true);
      setTimeout(() => setMounted(false), 700);
    }, 9000);
    return () => clearTimeout(safetyTimer);
  }, []);

  if (!mounted) return null;

  const rawPercent = Math.min(Math.max(Math.round(progress), 0), 100);
  const displayPercent = isReady ? rawPercent : Math.min(Math.round(rawPercent * 0.85), 88);
  const itemName = !isReady
    ? 'Fetching Masterpieces from Gallery Vault...'
    : item ? item.split('/').pop() : '3D Architecture & Lighting';

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#060608] text-[#FAFAFA] font-sans select-none transition-opacity duration-700 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Luxury Emblem Logo */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border border-[#D4AF37]/30 flex items-center justify-center animate-pulse">
          <div className="w-10 h-10 border-2 border-[#D4AF37] rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <span className="-rotate-45 text-[#D4AF37] font-serif text-base font-extrabold tracking-wider">S</span>
          </div>
        </div>
      </div>

      {/* Brand Title */}
      <h1 className="font-serif text-2xl font-bold tracking-[0.3em] uppercase text-[#FAFAFA] mb-1">
        SHAKYA GALLERY
      </h1>
      <p className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37] mb-8 font-mono">
        Loading 3D Architecture & Masterpieces
      </p>

      {/* Progress Bar Container */}
      <div className="w-72 max-w-xs bg-white/5 border border-[#D4AF37]/25 h-2 p-0.5 rounded-none overflow-hidden shadow-inner mb-3">
        <div
          className="bg-gradient-to-r from-[#b8952b] via-[#D4AF37] to-[#fff3dc] h-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(212,175,55,0.8)]"
          style={{ width: `${Math.max(displayPercent, 4)}%` }}
        />
      </div>

      {/* Percentage Counter */}
      <div className="flex items-center justify-between w-72 text-[11px] font-mono text-slate-400">
        <span>Loading Exhibition...</span>
        <span className="text-[#D4AF37] font-bold">{displayPercent}%</span>
      </div>

      {/* Current Loading Item Name */}
      <div className="text-[9px] font-mono text-slate-500 max-w-xs truncate mt-2 uppercase tracking-wider">
        {itemName}
      </div>
    </div>
  );
}

// The gallery is fully static from the lights' point of view, so the shadow
// map only needs to render once (and after scene swaps) instead of every frame.
function StaticShadows({ refreshKey, shadowsEnabled }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  // Toggling the shadow map changes every lit material's shader, and three
  // only recompiles on material.needsUpdate — so flag them all when it flips
  useEffect(() => {
    scene.traverse((o) => {
      if (!o.material) return;
      [].concat(o.material).forEach((m) => {
        m.needsUpdate = true;
      });
    });
  }, [scene, shadowsEnabled]);

  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl, refreshKey, shadowsEnabled]);
  return null;
}

// Stable prop identities so memoized 3D subtrees skip reconciliation
const BENCH_POSITION = [0, 0, -4.0];
const BOARD_POSITION = [2.4, 0, 9.15];
const BOARD_ROTATION = [0, Math.PI + 0.22, 0];
const SHADOW_CONFIG = { type: THREE.PCFShadowMap };

// Specialized Error Boundary around post-processing effects.
// If shaders or context attributes fail, unmount effects without crashing the 3D gallery.
class PostProcessingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Post-processing failed; rendering in direct WebGL mode without bloom/vignette:", error, errorInfo);
    if (this.props.onFallback) {
      this.props.onFallback();
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

// Wraps EffectComposer with WebGL attribute and capability verification.
// Guarantees that strict privacy blockers (e.g. Brave Shields) or missing context attributes
// do not crash the app with "Cannot read properties of null (reading 'alpha')".
function SafeEffectComposer({ children, ...props }) {
  const gl = useThree((s) => s.gl);

  const isPostProcessingSupported = useMemo(() => {
    try {
      if (!gl) return false;
      const ctx = gl.getContext?.();
      if (!ctx) return false;
      if (typeof ctx.isContextLost === 'function' && ctx.isContextLost()) return false;

      // Postprocessing library queries getContextAttributes().alpha
      // Brave Shields or restricted WebGL contexts return null for getContextAttributes()
      const attrs = ctx.getContextAttributes?.();
      if (!attrs || typeof attrs.alpha === 'undefined') {
        console.warn("WebGL context attributes unavailable; running direct rendering mode.");
        return false;
      }
      return true;
    } catch (e) {
      console.warn("WebGL post-processing capability check failed:", e);
      return false;
    }
  }, [gl]);

  const [hasError, setHasError] = useState(false);

  if (!isPostProcessingSupported || hasError) {
    return null;
  }

  return (
    <PostProcessingErrorBoundary onFallback={() => setHasError(true)}>
      <EffectComposer {...props}>
        {children}
      </EffectComposer>
    </PostProcessingErrorBoundary>
  );
}

// Robust Error Boundary to catch WebGL or R3F crashes and show a readable feedback page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Gallery ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200 font-sans z-50">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 p-8 rounded-3xl shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider mb-2">
              WebGL Gallery Crash
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              The 3D simulator encountered an issue initializing WebGL or loading assets. Please ensure hardware acceleration is enabled in your browser settings and privacy shields (e.g. Brave Shields) are not blocking WebGL.
            </p>
            <pre className="text-[10px] bg-slate-950 border border-white/5 p-4 rounded-xl text-red-400 font-mono text-left overflow-auto max-h-40 mb-6 whitespace-pre-wrap">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Restart Simulation
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [artworksList, setArtworksList] = useState([]);
  const [isArtworksLoaded, setIsArtworksLoaded] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const [artistsList, setArtistsList] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState('room-main');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminMounted, setAdminMounted] = useState(false); // fetch the admin chunk on first open
  const [isRoomSidebarOpen, setIsRoomSidebarOpen] = useState(false);

  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [mode, setMode] = useState('walk'); // 'walk' | 'orbit'
  const [isSeated, setIsSeated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockFailed, setLockFailed] = useState(false);
  const [focusTarget, setFocusTarget] = useState(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [artworkHovered, setArtworkHovered] = useState(false);
  const [roomTransition, setRoomTransition] = useState(null);
  const joystickRef = useRef({ x: 0, y: 0 });
  const lockRequestRef = useRef(null);
  const fadeRef = useRef(null);
  const transitionIdRef = useRef(0);

  const isTouchDevice = useMemo(
    () =>
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    [],
  );

  // Rendering quality: the visitor's preference (auto, or a pinned tier) plus
  // the auto-detected tier, which PerformanceMonitor may demote. Resolution
  // floats inside the tier's DPR range, never above the display's own ratio.
  const [qualityPref, setQualityPref] = useState(readQualityPreference);
  const [autoTier, setAutoTier] = useState(detectQualityTier);
  const quality = QUALITY_TIERS[qualityPref === 'auto' ? autoTier : qualityPref];
  const displayDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const [dprRaw, setDprRaw] = useState(quality.dpr[0]);
  const dprMin = quality.dpr[0];
  const dprMax = Math.min(quality.dpr[1], Math.max(displayDpr, dprMin));
  const dpr = THREE.MathUtils.clamp(dprRaw, dprMin, dprMax);

  const handleCycleQuality = useCallback(() => {
    const next = nextQualityPreference(qualityPref);
    writeQualityPreference(next);
    setQualityPref(next);
  }, [qualityPref]);

  // Frame-rate feedback: shave resolution first, then step the auto tier down
  const demoteAutoTier = useCallback(() => {
    if (qualityPref === 'auto') setAutoTier((t) => lowerTier(t));
  }, [qualityPref]);
  const handlePerfDecline = useCallback(() => {
    if (dpr > dprMin + 0.01) setDprRaw(Math.max(dprMin, dpr - 0.2));
    else demoteAutoTier();
  }, [dpr, dprMin, demoteAutoTier]);
  const handlePerfIncline = useCallback(() => setDprRaw(dprMax), [dprMax]);
  const showStats = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('stats'),
    [],
  );

  const isWalkMode = mode === 'walk';

  // If the chosen exhibition was deleted (or never existed), show the first one
  const activeRoomId = useMemo(
    () =>
      roomsList.length === 0 || roomsList.some((r) => r.id === currentRoomId)
        ? currentRoomId
        : roomsList[0].id,
    [roomsList, currentRoomId],
  );
  const currentRoom = useMemo(() => roomsList.find((r) => r.id === activeRoomId), [roomsList, activeRoomId]);

  // Load rooms and artists metadata
  const loadMetadata = useCallback(async () => {
    const [rooms, artists] = await Promise.all([fetchRoomsAPI(), fetchArtistsAPI()]);
    setRoomsList(rooms);
    setArtistsList(artists);
  }, []);

  // Load artworks for active room
  const loadRoomArtworks = useCallback(async (roomId) => {
    try {
      const list = await fetchArtworksAPI(roomId);
      setArtworksList(Array.isArray(list) && list.length > 0 ? list : fallbackArtworks);
    } catch (err) {
      console.warn('Could not load artworks from API:', err);
      setArtworksList(fallbackArtworks);
    } finally {
      setIsArtworksLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    loadRoomArtworks(activeRoomId);
  }, [activeRoomId, loadRoomArtworks]);

  const refreshAllData = useCallback(() => {
    loadMetadata();
    loadRoomArtworks(activeRoomId);
  }, [loadMetadata, loadRoomArtworks, activeRoomId]);

  // Find currently selected artwork object
  const currentArtwork = artworksList.find((art) => art.id === selectedArtwork);

  const handleSelectArtwork = useCallback((id) => {
    setSelectedArtwork(id);
  }, []);

  const handleCloseDetails = useCallback(() => {
    if (selectedArtwork && mode === 'walk' && !isTouchDevice) {
      lockRequestRef.current?.();
      window.setTimeout(() => {
        if (mode === 'walk' && !document.pointerLockElement) {
          lockRequestRef.current?.();
        }
      }, 1500);
    }
    setSelectedArtwork(null);
  }, [selectedArtwork, mode, isTouchDevice]);

  const handleSitBench = useCallback(() => {
    setSelectedArtwork(null);
    setIsSeated(true);
  }, []);

  const handleStandUp = useCallback(() => {
    setIsSeated(false);
  }, []);

  const handleLockChange = useCallback((locked) => setIsLocked(locked), []);
  const handleLockError = useCallback(() => setLockFailed(true), []);
  const handleFocusChange = useCallback((id) => setFocusTarget(id), []);

  // Board click / aim-E opens the wing picker; travel happens only on pick
  const handleOpenWingPicker = useCallback(() => setIsRoomSidebarOpen(true), []);

  const handleOpenAdmin = useCallback(() => {
    setAdminMounted(true);
    setIsAdminOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseDetails();
        setIsRoomSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleCloseDetails]);

  useEffect(() => {
    if ((selectedArtwork || isRoomSidebarOpen) && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [selectedArtwork, isRoomSidebarOpen]);

  const handleResetView = () => {
    setSelectedArtwork(null);
    if (mode === 'walk') setResetSignal((c) => c + 1);
  };

  const handleToggleMode = () => {
    setSelectedArtwork(null);
    setIsLocked(false);
    setFocusTarget(null);
    setLockFailed(false);
    joystickRef.current = { x: 0, y: 0 };
    setMode((m) => (m === 'orbit' ? 'walk' : 'orbit'));
  };

  const handleSelectRoom = (roomId) => {
    setSelectedArtwork(null);
    setCurrentRoomId(roomId);
    if (mode === 'walk') {
      const room = roomsList.find((r) => r.id === roomId);
      transitionIdRef.current += 1;
      setRoomTransition({ id: transitionIdRef.current, title: room?.title ?? '' });
    }
  };

  const handleTransitionDone = useCallback(() => {
    setRoomTransition(null);
  }, []);

  // Find next room for 3D portal
  const nextRoom = useMemo(() => {
    if (roomsList.length <= 1) return null;
    const currentIndex = roomsList.findIndex((r) => r.id === activeRoomId);
    const nextIndex = (currentIndex + 1) % roomsList.length;
    return roomsList[nextIndex];
  }, [roomsList, activeRoomId]);

  // Per-room wall finish chosen at creation time (defaults to matte white)
  const currentWallColor = currentRoom?.wall_color || '#ffffff';

  // Hall architecture preset for the active room (walls, partitions, lighting)
  const currentHallLayout = currentRoom?.hall_layout || 'classic';

  // Player-collision footprints for the active hall's internal architecture,
  // padded by the player radius once so WalkControls only iterates raw boxes
  const hallColliders = useMemo(
    () =>
      getColliders(currentHallLayout).map((c) => ({
        minX: c.minX - 0.35,
        maxX: c.maxX + 0.35,
        minZ: c.minZ - 0.35,
        maxZ: c.maxZ + 0.35,
      })),
    [currentHallLayout]
  );

  // Only the hall architecture and the wing board cast shadows (frames never
  // do), so those are the only changes that need the shadow map re-rendered
  const shadowRefreshKey = `${currentHallLayout}-${nextRoom ? 'board' : 'no-board'}`;

  return (
    <main className="relative w-screen h-screen bg-[#060608] overflow-hidden select-none" style={{ width: '100vw', height: '100vh' }}>
      
      {/* Full-screen Luxury Gallery Loading Screen */}
      <FullscreenGalleryLoader isReady={isArtworksLoaded} />

      {/* 3D R3F Viewport Canvas */}
      <ErrorBoundary>
        <Canvas
          shadows={quality.shadows ? SHADOW_CONFIG : false}
          flat
          dpr={dpr}
          gl={{
            powerPreference: 'high-performance',
            // EffectComposer owns anti-aliasing (multisampling); canvas MSAA is wasted bandwidth
            antialias: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0
          }}
          camera={{ position: [0, 2.3, 7.5], fov: 60, near: 0.1, far: 50 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ width: '100vw', height: '100vh', display: 'block' }}
        >
          <Suspense fallback={null}>
            <StaticShadows refreshKey={shadowRefreshKey} shadowsEnabled={quality.shadows} />
            {showStats && <Stats />}
            <PerformanceMonitor
              bounds={() => [45, 60]}
              flipflops={4}
              onFallback={demoteAutoTier}
              onDecline={handlePerfDecline}
              onIncline={handlePerfIncline}
            />
            <Suspense fallback={null}>
              <Environment files="/hdri/gallery_studio.hdr" environmentIntensity={0.22} />
            </Suspense>

            {/* Gallery Lighting Environment */}
            <Lights />

            {/* Fixed pool of real spotlights that follow the nearest artworks */}
            <NearestPictureLights artworks={artworksList} slotCount={quality.spotSlots} />

            {/* Architectural Geometry — hall layout drives partitions/islands/lighting */}
            <GalleryRoom wallColor={currentWallColor} hallLayout={currentHallLayout} quality={quality} />

            {/* Central Museum Leather Bench */}
            <MuseumBench position={BENCH_POSITION} onSitBench={handleSitBench} />

            {/* Sandwich board by the entrance -> opens the wing-choice sidebar */}
            {nextRoom && (
              <RoomPortal
                position={BOARD_POSITION}
                rotation={BOARD_ROTATION}
                nextRoomTitle={nextRoom.title}
                onEnterPortal={handleOpenWingPicker}
              />
            )}

            {/* Render individual Wall-hanging 2D artwork frames */}
            {artworksList.map((art) => (
              <ArtworkFrame
                key={art.id}
                artwork={art}
                interactive={!isWalkMode}
                onSelect={handleSelectArtwork}
                onHoverChange={setArtworkHovered}
                quality={quality}
              />
            ))}

            {/* Camera rig */}
            {isWalkMode ? (
              <WalkControls
                joystickRef={joystickRef}
                onSelectArtwork={handleSelectArtwork}
                onSitBench={handleSitBench}
                onLockChange={handleLockChange}
                onLockError={handleLockError}
                resetSignal={resetSignal}
                onFocusChange={handleFocusChange}
                lockRequestRef={lockRequestRef}
                selectedArtwork={selectedArtwork}
                artworks={artworksList}
                isSeated={isSeated}
                onStandUp={handleStandUp}
                transitionSignal={roomTransition}
                onTransitionDone={handleTransitionDone}
                fadeRef={fadeRef}
                onEnterPortal={handleOpenWingPicker}
                colliders={hallColliders}
              />
            ) : (
              <GalleryCamera
                selectedArtwork={selectedArtwork}
                isSeated={isSeated}
                artworks={artworksList}
              />
            )}

            {/* Cinematic Post-Processing Effects with Safe Fallback */}
            <SafeEffectComposer multisampling={1}>
              {quality.bloom && (
                <Bloom
                  mipmapBlur
                  levels={quality.bloomLevels}
                  luminanceThreshold={1.0}
                  luminanceSmoothing={0.25}
                  intensity={0.2}
                />
              )}
              <Vignette offset={0.22} darkness={0.35} />
            </SafeEffectComposer>

            {/* Compile every shader and upload every texture while the splash
                screen is still up, instead of hitching on first sight */}
            <Preload all />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      {/* Room-change fade overlay — opacity driven per-frame by WalkControls.
          The label sits inside so it only shows while the screen is dark. */}
      <div
        ref={fadeRef}
        className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black"
        style={{ opacity: 0 }}
      >
        {roomTransition && (
          <div className="flex flex-col items-center gap-2 animate-pulse">
            <div className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37]/70 font-sans">
              Entering
            </div>
            <div className="text-sm uppercase tracking-[0.25em] text-[#D4AF37] font-sans text-center px-6">
              {roomTransition.title || 'Gallery Wing'}
            </div>
          </div>
        )}
      </div>

      {/* Floating Glassmorphic HUD overlay */}
      <HUD
        artworks={artworksList}
        selectedArtwork={selectedArtwork}
        isSeated={isSeated}
        onStandUp={handleStandUp}
        mode={mode}
        isLocked={isLocked}
        lockFailed={lockFailed}
        focusTarget={focusTarget}
        lockRequestRef={lockRequestRef}
        isTouchDevice={isTouchDevice}
        rooms={roomsList}
        currentRoomId={activeRoomId}
        onSelectRoom={handleSelectRoom}
        onOpenAdmin={handleOpenAdmin}
        onToggleMode={handleToggleMode}
        onSelectArtwork={handleSelectArtwork}
        onResetView={handleResetView}
        quality={quality}
        qualityPreference={qualityPref}
        onCycleQuality={handleCycleQuality}
      />

      {/* Touch joystick (walk mode only) */}
      {isWalkMode && isTouchDevice && (
        <div className="absolute bottom-24 left-5 z-20">
          <VirtualJoystick vectorRef={joystickRef} />
        </div>
      )}

      {/* Cursor-following hover hint for artworks */}
      <HoverHint visible={artworkHovered && !selectedArtwork && !isWalkMode} />

      {/* Sidebar Detailed Modal panel */}
      {selectedArtwork && currentArtwork && (
        <ArtworkModal
          artwork={currentArtwork}
          onClose={handleCloseDetails}
        />
      )}

      {/* Wing-choice sidebar (opened from the sandwich board) */}
      <RoomSidebar
        isOpen={isRoomSidebarOpen}
        rooms={roomsList}
        currentRoomId={activeRoomId}
        onSelectRoom={(roomId) => {
          setIsRoomSidebarOpen(false);
          handleSelectRoom(roomId);
        }}
        onClose={() => setIsRoomSidebarOpen(false)}
      />

      {/* Curator Admin Panel Modal — stays mounted after first open so a
          half-filled form survives closing the panel */}
      {adminMounted && (
        <Suspense fallback={null}>
          <AdminModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            rooms={roomsList}
            artists={artistsList}
            artworks={artworksList}
            onRefreshData={refreshAllData}
          />
        </Suspense>
      )}
    </main>
  );
}
