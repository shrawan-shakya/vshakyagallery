import React, { useState, useEffect, Suspense, useRef, useMemo, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Loader, Html, PerformanceMonitor, Stats } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { fetchArtworksAPI, fetchRoomsAPI, fetchArtistsAPI, fallbackArtworks } from './data/artworks';

// 3D Loading Fallback component for inside Canvas
function CanvasLoadingFallback() {
  return (
    <Html center className="z-50 pointer-events-none">
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/80 backdrop-blur-md border border-[#D4AF37]/30 text-center font-sans shadow-2xl min-w-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-xs font-bold uppercase tracking-luxury-wide text-[#D4AF37]">Loading Virtual Gallery</div>
        <div className="text-[10px] text-slate-400 mt-1 font-mono">Initializing 3D Architecture...</div>
      </div>
    </Html>
  );
}

// The gallery is fully static from the lights' point of view, so the shadow
// map only needs to render once (and after scene swaps) instead of every frame.
function StaticShadows({ refreshKey }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl, refreshKey]);
  return null;
}

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

// UI Components
import HUD from './components/ui/HUD';
import VirtualJoystick from './components/ui/VirtualJoystick';
import ArtworkModal from './components/ui/ArtworkModal';
import HoverHint from './components/ui/HoverHint';
import AdminModal from './components/ui/AdminModal';
import RoomSidebar from './components/ui/RoomSidebar';

// Stable prop identities so memoized 3D subtrees skip reconciliation
const BENCH_POSITION = [0, 0, -4.0];
const BOARD_POSITION = [2.4, 0, 9.15];
const BOARD_ROTATION = [0, Math.PI + 0.22, 0];

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
              The 3D simulator encountered an issue initializing WebGL or loading assets. Please ensure hardware acceleration is enabled in your browser settings.
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
  const [artworksList, setArtworksList] = useState(fallbackArtworks);
  const [roomsList, setRoomsList] = useState([]);
  const [artistsList, setArtistsList] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState('room-main');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isRoomSidebarOpen, setIsRoomSidebarOpen] = useState(false);

  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [mode, setMode] = useState('walk'); // 'walk' | 'orbit'
  const [isSeated, setIsSeated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hasWalkedOnce, setHasWalkedOnce] = useState(false);
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

  // Adaptive resolution: start conservative at 1.0 and let PerformanceMonitor
  // raise it to the display DPR once the GPU proves it has headroom.
  const maxDpr = useMemo(
    () => Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5),
    [],
  );
  const [dpr, setDpr] = useState(1);
  const showStats = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('stats'),
    [],
  );

  const isWalkMode = mode === 'walk';

  // Load rooms and artists metadata
  const loadMetadata = useCallback(async () => {
    const r = await fetchRoomsAPI();
    setRoomsList(r);
    const a = await fetchArtistsAPI();
    setArtistsList(a);
  }, []);

  // Load artworks for active room
  const loadRoomArtworks = useCallback(async (roomId) => {
    const list = await fetchArtworksAPI(roomId);
    setArtworksList(list);
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    loadRoomArtworks(currentRoomId);
  }, [currentRoomId, loadRoomArtworks]);

  // If the active exhibition is deleted (or missing), fall back to another room
  useEffect(() => {
    if (roomsList.length > 0 && !roomsList.some((r) => r.id === currentRoomId)) {
      setCurrentRoomId(roomsList[0].id);
    }
  }, [roomsList, currentRoomId]);

  const refreshAllData = useCallback(() => {
    loadMetadata();
    loadRoomArtworks(currentRoomId);
  }, [loadMetadata, loadRoomArtworks, currentRoomId]);

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

  const handleLockChange = useCallback((locked) => {
    setIsLocked(locked);
    if (locked) setHasWalkedOnce(true);
  }, []);

  const handleLockError = useCallback(() => {
    setLockFailed(true);
    setHasWalkedOnce(true);
  }, []);

  const handleFocusChange = useCallback((id) => setFocusTarget(id), []);

  // Board click / aim-E opens the wing picker; travel happens only on pick
  const handleOpenWingPicker = useCallback(() => setIsRoomSidebarOpen(true), []);

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
    const currentIndex = roomsList.findIndex((r) => r.id === currentRoomId);
    const nextIndex = (currentIndex + 1) % roomsList.length;
    return roomsList[nextIndex];
  }, [roomsList, currentRoomId]);

  // Per-room wall finish chosen at creation time (defaults to matte white)
  const currentWallColor = useMemo(
    () => roomsList.find((r) => r.id === currentRoomId)?.wall_color || '#ffffff',
    [roomsList, currentRoomId]
  );

  // Hall architecture preset for the active room (walls, partitions, lighting)
  const currentHallLayout = useMemo(
    () => roomsList.find((r) => r.id === currentRoomId)?.hall_layout || 'classic',
    [roomsList, currentRoomId]
  );

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

  return (
    <main className="relative w-screen h-screen bg-[#060608] overflow-hidden select-none" style={{ width: '100vw', height: '100vh' }}>
      
      {/* 3D R3F Viewport Canvas */}
      <ErrorBoundary>
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          flat
          dpr={dpr}
          gl={{
            powerPreference: 'high-performance',
            // EffectComposer owns anti-aliasing (multisampling); canvas MSAA is wasted bandwidth
            antialias: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: theme === 'dark' ? 1.0 : 1.15
          }}
          camera={{ position: [0, 2.3, 7.5], fov: 60, near: 0.1, far: 50 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ width: '100vw', height: '100vh', display: 'block' }}
        >
          <Suspense fallback={<CanvasLoadingFallback />}>
            <StaticShadows refreshKey={`${theme}-${currentRoomId}-${artworksList.length}-${currentHallLayout}`} />
            {showStats && <Stats />}
            <PerformanceMonitor
              bounds={() => [45, 60]}
              flipflops={4}
              onFallback={() => setDpr(1)}
              onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
              onIncline={() => setDpr(maxDpr)}
            />
            <Suspense fallback={null}>
              <Environment files="/hdri/gallery_studio.hdr" environmentIntensity={theme === 'dark' ? 0.22 : 0.5} />
            </Suspense>

            {/* Gallery Lighting Environment */}
            <Lights theme={theme} />

            {/* Fixed pool of real spotlights that follow the nearest artworks */}
            <NearestPictureLights artworks={artworksList} theme={theme} />

            {/* Architectural Geometry — hall layout drives partitions/islands/lighting */}
            <GalleryRoom theme={theme} wallColor={currentWallColor} hallLayout={currentHallLayout} />

            {/* Central Museum Leather Bench */}
            <MuseumBench
              position={BENCH_POSITION}
              theme={theme}
              isSeated={isSeated}
              onSitBench={handleSitBench}
            />

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
                isSelected={selectedArtwork === art.id}
                aimFocused={isWalkMode && focusTarget === art.id}
                theme={theme}
                interactive={!isWalkMode}
                onSelect={handleSelectArtwork}
                onHoverChange={setArtworkHovered}
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

            {/* Cinematic Post-Processing Effects */}
            <EffectComposer multisampling={1}>
              <Bloom
                mipmapBlur
                luminanceThreshold={theme === 'dark' ? 1.0 : 1.2}
                luminanceSmoothing={0.25}
                intensity={theme === 'dark' ? 0.2 : 0.1}
              />
              <Vignette offset={0.22} darkness={theme === 'dark' ? 0.35 : 0.22} />
            </EffectComposer>
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
        theme={theme}
        setTheme={setTheme}
        mode={mode}
        isLocked={isLocked}
        hasWalkedOnce={hasWalkedOnce}
        lockFailed={lockFailed}
        focusTarget={focusTarget}
        lockRequestRef={lockRequestRef}
        isTouchDevice={isTouchDevice}
        rooms={roomsList}
        currentRoomId={currentRoomId}
        onSelectRoom={handleSelectRoom}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onToggleMode={handleToggleMode}
        onSelectArtwork={handleSelectArtwork}
        onResetView={handleResetView}
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
        currentRoomId={currentRoomId}
        onSelectRoom={(roomId) => {
          setIsRoomSidebarOpen(false);
          handleSelectRoom(roomId);
        }}
        onClose={() => setIsRoomSidebarOpen(false)}
      />

      {/* Curator Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        rooms={roomsList}
        artists={artistsList}
        artworks={artworksList}
        onRefreshData={refreshAllData}
      />

      <Loader />
    </main>
  );
}
