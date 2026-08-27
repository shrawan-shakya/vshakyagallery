import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Pencil,
  Image as ImageIcon, 
  User, 
  FolderPlus, 
  Check, 
  AlertCircle,
  Sparkles,
  RotateCcw,
  Sliders,
  ArrowLeft,
  ArrowRight,
  Circle,
  Eye,
  ArrowUp,
  ArrowDown,
  Compass,
  Layers,
  Lock,
  LogOut
} from 'lucide-react';
import { getHallOptions, getWallConfigs } from '../../utils/hallLayouts';

const HEIGHT_PRESETS = [
  { id: 'low', label: 'Low (1.2m)', height: 1.2, icon: ArrowDown },
  { id: 'eye', label: 'Eye-Level (1.55m)', height: 1.55, icon: Eye },
  { id: 'high', label: 'High (2.0m)', height: 2.0, icon: ArrowUp },
];

// Matte wall finishes for gallery wings (the classic museum tones)
const ROOM_WALL_COLORS = [
  { value: '#ffffff', name: 'Matte White' },
  { value: '#843939', name: 'Matte Red' },
  { value: '#3a5578', name: 'Matte Blue' },
];

// Display metadata for every hangable wall across all hall layouts
const HALL_WALL_META = {
  back: { title: 'Back Wall', label: 'NORTH' },
  left: { title: 'Left Wall', label: 'WEST' },
  right: { title: 'Right Wall', label: 'EAST' },
  partition_front: { title: 'Partition Front', label: 'ENTRY' },
  partition_back: { title: 'Partition Back', label: 'CENTER' },
  baffle_a_front: { title: 'Baffle A Front', label: 'CHAPEL I' },
  baffle_a_back: { title: 'Baffle A Rear', label: 'CHAPEL I' },
  baffle_b_front: { title: 'Baffle B Front', label: 'CHAPEL II' },
  baffle_b_back: { title: 'Baffle B Rear', label: 'CHAPEL II' },
};

// Wall slot presets derived from the wall's real span in the active hall:
// center-out ordering, so a lone artwork hangs dead-center (museum standard)
// and extra pieces fill symmetric columns after.
function presetsForWall(wallId, hallLayoutId) {
  const defs = getWallConfigs(hallLayoutId);
  const def = defs[wallId] || defs.back;
  const mid = (def.spanMin + def.spanMax) / 2;
  const span = def.spanMax - def.spanMin;
  const clamp = (o) =>
    Math.round(Math.min(Math.max(o, def.spanMin + 0.3), def.spanMax - 0.3) * 100) / 100;

  const offsets = [clamp(mid), clamp(mid - span * 0.15), clamp(mid + span * 0.15), clamp(mid - span * 0.45), clamp(mid + span * 0.45)];
  const seen = new Set();
  const unique = offsets.filter((o) => (seen.has(o) ? false : seen.add(o)));
  const icons = [Circle, ArrowLeft, ArrowRight, ArrowLeft, ArrowRight];
  const labels = ['Center', 'Inner L', 'Inner R', 'Outer L', 'Outer R'];

  return unique.map((offset, i) => ({
    id: `${wallId}-${i}`,
    label: labels[i] || `Slot ${i}`,
    meter: `${offset.toFixed(2)}m`,
    offset,
    icon: icons[Math.min(i, icons.length - 1)],
  }));
}

// Hall architecture options for the room-creation form
const HALL_OPTIONS = getHallOptions();

export default function AdminModal({
  isOpen,
  onClose,
  rooms = [],
  artists = [],
  artworks = [],
  onRefreshData
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'rooms' | 'manage'
  const [editingArtwork, setEditingArtwork] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);

  // Curator authentication — signed token from POST /api/auth/login
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem('galleryAdminToken') || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Upload / Edit Artwork Form State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [medium, setMedium] = useState('Oil on Canvas');
  const [description, setDescription] = useState('');
  const [widthIn, setWidthIn] = useState('48');
  const [heightIn, setHeightIn] = useState('36');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  
  // Placement State
  const [selectedWallId, setSelectedWallId] = useState('back');
  const [selectedSlot, setSelectedSlot] = useState(null); // auto-picked per wall by the effect below
  const [selectedHeight, setSelectedHeight] = useState('eye');
  const [showAdvancedPlacement, setShowAdvancedPlacement] = useState(false);
  const [customOffsetNum, setCustomOffsetNum] = useState(0);
  const [customHeightNum, setCustomHeightNum] = useState(1.55);
  // Remembers which wall the slot was auto-picked for, so data refreshes and
  // room switches don't clobber a slot the user chose manually
  const lastAutoWallRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Authenticated fetch wrapper: attaches the admin token and drops the
  // session on any 401 so the login gate re-appears immediately
  const adminFetch = useCallback(async (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      setAuthToken('');
      sessionStorage.removeItem('galleryAdminToken');
    }
    return res;
  }, [authToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginPassword) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setAuthToken(data.token);
      sessionStorage.setItem('galleryAdminToken', data.token);
      setLoginPassword('');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    sessionStorage.removeItem('galleryAdminToken');
    setLoginError(null);
    setLoginPassword('');
  };

  // New Artist Form State
  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistBio, setNewArtistBio] = useState('');

  // New Room Form State
  const [newRoomArtistId, setNewRoomArtistId] = useState('');
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomWallColor, setNewRoomWallColor] = useState('#ffffff');
  const [newRoomHall, setNewRoomHall] = useState('classic');

  // Hall architecture of the room currently targeted by the upload form
  const targetRoomId = selectedRoomId || rooms[0]?.id || 'room-main';
  const targetHallId = useMemo(
    () => rooms.find((r) => r.id === targetRoomId)?.hall_layout || 'classic',
    [rooms, targetRoomId]
  );
  const targetWallDefs = useMemo(() => getWallConfigs(targetHallId), [targetHallId]);

  // Wall picker cards for the active hall (perimeter walls + its partitions/baffles)
  const wallCards = useMemo(
    () =>
      Object.entries(targetWallDefs).map(([id, def]) => ({
        id,
        title: HALL_WALL_META[id]?.title || def.name,
        subtitle: `${def.axis === 'x' ? 'X axis' : 'Z axis'} · ${def.axis === 'x' ? `Z ${def.center[2].toFixed(2)}m` : `X ${def.center[0].toFixed(2)}m`}`,
        label: HALL_WALL_META[id]?.label || 'WALL',
      })),
    [targetWallDefs]
  );

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
    if (artists.length > 0 && !newRoomArtistId) {
      setNewRoomArtistId(artists[0].id);
    }
  }, [rooms, artists, selectedRoomId, newRoomArtistId]);

  // Count paintings per wall in the target room (walls of that hall only)
  const wallCounts = useMemo(() => {
    const counts = {};
    Object.keys(targetWallDefs).forEach((id) => { counts[id] = 0; });
    artworks
      .filter((a) => a.roomId === targetRoomId)
      .forEach((a) => {
        if (counts[a.wallId] !== undefined) counts[a.wallId]++;
      });
    return counts;
  }, [artworks, targetRoomId, targetWallDefs]);

  // Artworks in target room (excluding currently edited artwork) for overlap detection
  const activeRoomArtworks = useMemo(() => {
    return artworks.filter(a => a.roomId === targetRoomId && (!editingArtwork || a.id !== editingArtwork.id));
  }, [artworks, targetRoomId, editingArtwork]);

  // Dynamic wall slot presets from the hall's real wall spans
  const wallSlotPresets = useMemo(
    () => presetsForWall(selectedWallId, targetHallId),
    [selectedWallId, targetHallId]
  );

  // Check if a position along the selected wall is already occupied by an artwork
  const getOccupyingArtwork = useCallback((slotOffset) => {
    const def = targetWallDefs[selectedWallId] || targetWallDefs.back;
    return activeRoomArtworks.find(a => {
      if (a.wallId !== selectedWallId) return false;
      const isXAxis = def.axis === 'x';
      const currentOffset = isXAxis ? (a.position?.[0] ?? 0) : (a.position?.[2] ?? 0);
      return Math.abs(currentOffset - slotOffset) < 1.2;
    });
  }, [activeRoomArtworks, selectedWallId, targetWallDefs]);

  // Keep the chosen wall valid for the targeted room's hall architecture
  useEffect(() => {
    if (!targetWallDefs[selectedWallId]) {
      setSelectedWallId('back');
    }
  }, [targetWallDefs, selectedWallId]);

  // Auto-select first available unoccupied slot — only when the wall changed
  // or the current selection is invalid for this wall (never mid-editing)
  useEffect(() => {
    if (editingArtwork) return;
    const wallChanged = lastAutoWallRef.current !== selectedWallId;
    const slotStillValid = wallSlotPresets.some(s => s.id === selectedSlot);
    if (!wallChanged && slotStillValid) return;
    lastAutoWallRef.current = selectedWallId;
    const available = wallSlotPresets.find(s => !getOccupyingArtwork(s.offset));
    if (available) {
      setSelectedSlot(available.id);
      setCustomOffsetNum(available.offset);
    } else if (wallSlotPresets.length > 0) {
      setSelectedSlot(wallSlotPresets[0].id);
      setCustomOffsetNum(wallSlotPresets[0].offset);
    }
  }, [selectedWallId, wallSlotPresets, editingArtwork, getOccupyingArtwork, selectedSlot]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleStartEditArtwork = (art) => {
    setEditingArtwork(art);
    setTitle(art.title || '');
    setArtist(art.artist || '');
    setYear(art.year || '');
    setMedium(art.medium || 'Oil on Canvas');
    setDescription(art.description || '');
    setWidthIn(art.widthIn?.toString() || '48');
    setHeightIn(art.heightIn?.toString() || '36');
    setSelectedRoomId(art.roomId || rooms[0]?.id || 'room-main');
    setSelectedWallId(art.wallId || 'back');
    
    if (art.position) {
      const h = art.position[1] || 1.55;
      if (Math.abs(h - 1.2) < 0.1) setSelectedHeight('low');
      else if (Math.abs(h - 2.0) < 0.1) setSelectedHeight('high');
      else setSelectedHeight('eye');

      const artHall = rooms.find((r) => r.id === art.roomId)?.hall_layout || 'classic';
      const defs = getWallConfigs(artHall);
      const def = defs[art.wallId] || defs.back;
      const isXAxis = def.axis === 'x';
      const offset = isXAxis ? art.position[0] || 0 : art.position[2] || 0;

      // Snap to the nearest preset slot so editing keeps the artwork where it hangs
      const nearest = presetsForWall(art.wallId || 'back', artHall).reduce(
        (best, s) => (Math.abs(s.offset - offset) < Math.abs(best.offset - offset) ? s : best)
      );
      setSelectedSlot(nearest.id);

      setCustomOffsetNum(offset);
      setCustomHeightNum(h);
    } else {
      const wallPresets = presetsForWall(art.wallId || selectedWallId || 'back', targetHallId);
      setSelectedSlot(wallPresets[0].id);
      setSelectedHeight('eye');
      setCustomOffsetNum(wallPresets[0].offset);
      setCustomHeightNum(1.55);
    }

    setFile(null);
    setPreviewUrl(art.imageUrl || null);
    setStatusMsg(null);
    setActiveTab('upload');
  };

  const handleCancelEdit = () => {
    setEditingArtwork(null);
    setFile(null);
    setPreviewUrl(null);
    setTitle('');
    setArtist('');
    setDescription('');
    const wallPresets = presetsForWall(selectedWallId || 'back', targetHallId);
    setSelectedSlot(wallPresets[0].id);
    setSelectedHeight('eye');
    setCustomOffsetNum(wallPresets[0].offset);
    setCustomHeightNum(1.55);
    setShowAdvancedPlacement(false);
    setStatusMsg(null);
  };

  const handleSaveArtwork = async (e) => {
    e.preventDefault();
    if (!editingArtwork && !file) {
      setStatusMsg({ type: 'error', text: 'Please select an image file to upload.' });
      return;
    }
    if (!title || !artist) {
      setStatusMsg({ type: 'error', text: 'Artwork Title and Artist Name are required.' });
      return;
    }

    setIsUploading(true);
    setStatusMsg(null);

    try {
      const formData = new FormData();
      if (file) formData.append('image', file);
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('year', year);
      formData.append('medium', medium);
      formData.append('description', description);
      formData.append('widthIn', widthIn);
      formData.append('heightIn', heightIn);
      formData.append('roomId', selectedRoomId || rooms[0]?.id || 'room-main');
      formData.append('wallId', selectedWallId);

      const slotObj = wallSlotPresets.find(s => s.id === selectedSlot) || wallSlotPresets[0];
      const heightObj = HEIGHT_PRESETS.find(h => h.id === selectedHeight) || HEIGHT_PRESETS[1];

      const offsetMeters = showAdvancedPlacement ? customOffsetNum : (slotObj ? slotObj.offset : 0);
      const heightMeters = showAdvancedPlacement ? customHeightNum : heightObj.height;

      const occupyingArt = getOccupyingArtwork(offsetMeters);
      if (occupyingArt) {
        setStatusMsg({
          type: 'error',
          text: `Position is already occupied by "${occupyingArt.title}". Please choose an available open slot.`
        });
        setIsUploading(false);
        return;
      }

      // World coordinates come straight from the hall's wall registry
      const def = targetWallDefs[selectedWallId] || targetWallDefs.back;
      const isXAxis = def.axis === 'x';
      const posX = isXAxis ? offsetMeters : def.center[0];
      const posZ = isXAxis ? def.center[2] : offsetMeters;
      const rotY = def.rotation[1];

      formData.append('posX', posX.toString());
      formData.append('posY', heightMeters.toString());
      formData.append('posZ', posZ.toString());
      formData.append('rotY', rotY.toString());

      const endpoint = editingArtwork ? `/api/artworks/${editingArtwork.id}` : '/api/artworks/upload';
      const method = editingArtwork ? 'PUT' : 'POST';

      const res = await adminFetch(endpoint, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Operation failed');
      }

      const isEdit = !!editingArtwork;
      setStatusMsg({ 
        type: 'success', 
        text: isEdit ? `Updated "${title}" placement & details!` : `"${title}" hung successfully in the 3D gallery!` 
      });
      
      handleCancelEdit();
      onRefreshData?.();
    } catch (err) {
      console.error("Save artwork error:", err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save artwork.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateArtist = async (e) => {
    e.preventDefault();
    if (!newArtistName) return;

    try {
      const res = await adminFetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newArtistName, bio: newArtistBio }),
      });
      if (!res.ok) throw new Error('Failed to create artist');
      
      setNewArtistName('');
      setNewArtistBio('');
      setStatusMsg({ type: 'success', text: `Artist "${newArtistName}" created!` });
      onRefreshData?.();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomTitle || !newRoomArtistId) return;

    const payload = JSON.stringify({
      artist_id: newRoomArtistId,
      title: newRoomTitle,
      wall_color: newRoomWallColor,
      hall_layout: newRoomHall,
    });

    try {
      const isEdit = !!editingRoom;
      const res = await adminFetch(isEdit ? `/api/rooms/${editingRoom.id}` : '/api/rooms', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      if (!res.ok) throw new Error(isEdit ? 'Failed to update exhibition' : 'Failed to create gallery room');

      setNewRoomTitle('');
      setNewRoomWallColor('#ffffff');
      setNewRoomHall('classic');
      setStatusMsg({
        type: 'success',
        text: isEdit ? `Exhibition "${newRoomTitle}" updated!` : `Room "${newRoomTitle}" created!`,
      });
      handleCancelEditRoom();
      onRefreshData?.();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setNewRoomArtistId(room.artist_id || artists[0]?.id || '');
    setNewRoomTitle(room.title || '');
    setNewRoomWallColor(room.wall_color || '#ffffff');
    setNewRoomHall(room.hall_layout || 'classic');
    setStatusMsg(null);
  };

  const handleCancelEditRoom = () => {
    setEditingRoom(null);
    setNewRoomArtistId(artists[0]?.id || '');
    setNewRoomTitle('');
    setNewRoomWallColor('#ffffff');
    setNewRoomHall('classic');
  };

  const handleDeleteRoom = async (roomId, roomTitle) => {
    if (!window.confirm(`Delete the exhibition "${roomTitle}"? All of its artworks will be permanently removed.`)) return;

    try {
      const res = await adminFetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete exhibition');
      }
      setStatusMsg({ type: 'success', text: `Deleted exhibition "${roomTitle}".` });
      if (editingRoom?.id === roomId) handleCancelEditRoom();
      onRefreshData?.();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleDeleteArtwork = async (id, artTitle) => {
    if (!window.confirm(`Are you sure you want to remove "${artTitle}" from the exhibition?`)) return;

    try {
      const res = await adminFetch(`/api/artworks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete artwork');
      setStatusMsg({ type: 'success', text: `Removed "${artTitle}".` });
      if (editingArtwork?.id === id) handleCancelEdit();
      onRefreshData?.();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans pointer-events-auto"
    >
      <div className="bg-[#111111] border border-[#D4AF37]/40 rounded-none max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#D4AF37]/30 flex justify-between items-center bg-[#181818]">
          <div className="flex items-center gap-3 text-[#D4AF37]">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-serif text-lg font-semibold tracking-luxury-wide text-[#FAFAFA]">
              SHAKYA CURATOR ADMIN
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {authToken && (
              <button
                onClick={handleLogout}
                title="End curator session"
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-luxury-wide px-2.5 py-1.5 border border-white/10 rounded-none text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all"
              >
                <LogOut className="w-3 h-3" />
                Sign out
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-[#FAFAFA] p-1.5 hover:bg-white/5 transition-all rounded-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LOGIN GATE — everything below requires a curator session */}
        {!authToken ? (
          <form onSubmit={handleLogin} className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="text-center">
              <h3 className="font-serif text-base text-[#FAFAFA]">Curator Access</h3>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Enter the admin password to manage exhibitions
              </p>
            </div>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
              className="w-full max-w-xs bg-[#181818] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none font-mono"
            />
            {loginError && (
              <p className="text-[10px] font-mono text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                {loginError}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoggingIn || !loginPassword}
              className="py-2.5 px-8 bg-[#D4AF37] hover:bg-[#b8952b] disabled:opacity-40 disabled:cursor-not-allowed text-[#111111] font-bold text-xs uppercase tracking-luxury-wide rounded-none transition-all"
            >
              {isLoggingIn ? 'Verifying…' : 'Unlock Dashboard'}
            </button>
          </form>
        ) : (
        <>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#D4AF37]/20 bg-[#111111] px-5 pt-2 gap-2 text-xs font-bold uppercase tracking-luxury-wide">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all rounded-none ${
              activeTab === 'upload'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {editingArtwork ? <Pencil className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {editingArtwork ? 'Edit Artwork' : 'Upload Artwork'}
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all rounded-none ${
              activeTab === 'rooms'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            Artist Wings & Rooms
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all rounded-none ${
              activeTab === 'manage'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Manage Exhibition ({artworks.length})
          </button>
        </div>

        {/* Status Message Alert */}
        {statusMsg && (
          <div className={`mx-5 mt-4 p-3 rounded-none text-xs font-mono flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400' : 'bg-red-500/10 border border-red-500/40 text-red-400'
          }`}>
            {statusMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-200">
          
          {/* TAB 1: UPLOAD / EDIT ARTWORK */}
          {activeTab === 'upload' && (
            <form onSubmit={handleSaveArtwork} className="space-y-5">
              
              {/* Editing Banner */}
              {editingArtwork && (
                <div className="flex items-center justify-between p-3 rounded-none bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    <span>Editing Artwork: <strong>"{editingArtwork.title}"</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-300 hover:text-slate-100 bg-white/10 px-2 py-1 rounded-none"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Cancel Edit
                  </button>
                </div>
              )}

              {/* File Upload Area */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-luxury-wide text-slate-400 mb-2">
                  {editingArtwork ? 'Artwork Image (Optional replacement)' : 'Artwork Image File *'}
                </label>
                <div className="relative border border-dashed border-white/20 hover:border-[#D4AF37] rounded-none p-5 text-center cursor-pointer transition-all bg-[#181818]">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={previewUrl} alt="Preview" className="h-32 object-contain rounded-none border border-white/10" />
                      <span className="text-xs text-[#D4AF37] font-mono">
                        {file ? file.name : 'Current Image (click to replace)'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4 text-slate-400">
                      <Upload className="w-8 h-8 text-[#D4AF37]" />
                      <span className="text-xs font-bold uppercase tracking-luxury-wide">Click or drag image file here</span>
                      <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP high-resolution files</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-slate-400 mb-1">
                    Title *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Celestial Meditation" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-slate-400 mb-1">
                    Artist Name *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Shrawan Shakya" 
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-slate-400 mb-1">
                    Year
                  </label>
                  <input 
                    type="text" 
                    placeholder="2025" 
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-slate-400 mb-1">
                    Medium
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Oil & Gold Leaf on Canvas" 
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              {/* Physical Scale Dimensions */}
              <div className="grid grid-cols-2 gap-4 bg-[#181818] p-4 border border-white/10">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-[#D4AF37] mb-1">
                    Width (Inches)
                  </label>
                  <input 
                    type="number" 
                    value={widthIn}
                    onChange={(e) => setWidthIn(e.target.value)}
                    className="w-full bg-[#111111] border border-white/15 rounded-none px-3 py-2 text-xs text-[#FAFAFA] font-mono focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-[#D4AF37] mb-1">
                    Height (Inches)
                  </label>
                  <input 
                    type="number" 
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="w-full bg-[#111111] border border-white/15 rounded-none px-3 py-2 text-xs text-[#FAFAFA] font-mono focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              {/* Room Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-slate-400 mb-1">
                  Gallery Room Wing
                </label>
                <select 
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.title} ({r.artist_name || 'Group'})</option>
                  ))}
                </select>
              </div>

              {/* STEP 1: CHOOSE TARGET WALL CARDS */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-[#D4AF37]">
                  Step 1: Choose Target Gallery Wall
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {wallCards.map((w) => {
                    const isSelected = selectedWallId === w.id;
                    const count = wallCounts[w.id] || 0;
                    return (
                      <button
                        type="button"
                        key={w.id}
                        onClick={() => setSelectedWallId(w.id)}
                        className={`p-3.5 rounded-none border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#FAFAFA]'
                            : 'bg-[#181818] border-white/10 text-slate-300 hover:border-[#D4AF37]/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold uppercase tracking-luxury-wide px-2 py-0.5 bg-[#111111] border border-white/10 text-[#D4AF37]">
                            {w.label}
                          </span>
                          <span className="text-[9px] font-mono px-2 py-0.5 bg-[#111111] border border-white/10 text-slate-400">
                            {count} hung
                          </span>
                        </div>
                        <div className="mt-3">
                          <h4 className="text-xs font-bold text-[#FAFAFA]">{w.title}</h4>
                          <p className="text-[9px] text-slate-400 truncate">{w.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: CHOOSE POSITION ALONG WALL */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-[#D4AF37]">
                    Step 2: Choose Position Along Wall
                  </label>
                  <span className="text-[9px] font-mono text-slate-400">
                    {wallSlotPresets.length} Slots
                  </span>
                </div>
                
                <div className={`grid gap-2.5 ${wallSlotPresets.length === 5 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-3'}`}>
                  {wallSlotPresets.map((slot) => {
                    const Icon = slot.icon;
                    const isSelected = (selectedSlot === slot.id || Math.abs(customOffsetNum - slot.offset) < 0.1) && !showAdvancedPlacement;
                    const occupyingArt = getOccupyingArtwork(slot.offset);
                    const isOccupied = !!occupyingArt;

                    return (
                      <button
                        type="button"
                        key={slot.id}
                        disabled={isOccupied}
                        onClick={() => {
                          if (isOccupied) return;
                          setSelectedSlot(slot.id);
                          setCustomOffsetNum(slot.offset);
                          setShowAdvancedPlacement(false);
                        }}
                        className={`py-2 px-1.5 rounded-none border text-xs font-bold uppercase tracking-luxury-wide flex flex-col items-center justify-center gap-0.5 transition-all relative ${
                          isOccupied
                            ? 'bg-red-950/20 border-red-500/30 text-red-400/60 cursor-not-allowed opacity-65'
                            : isSelected
                            ? 'bg-[#D4AF37] text-[#111111] border-[#D4AF37] font-extrabold shadow-md'
                            : 'bg-[#181818] border-white/10 text-slate-300 hover:border-[#D4AF37]/50 hover:text-[#FAFAFA]'
                        }`}
                        title={isOccupied ? `Occupied by "${occupyingArt.title}"` : `Position: ${slot.offset}m along wall`}
                      >
                        <div className="flex items-center gap-1 max-w-full">
                          <Icon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{slot.label}</span>
                        </div>
                        <span className={`text-[9px] font-mono leading-none ${isSelected ? 'text-[#111111]/80' : isOccupied ? 'text-red-400/60' : 'text-slate-400'}`}>
                          {slot.meter}
                        </span>
                        {isOccupied ? (
                          <span className="text-[8px] font-mono text-red-400 truncate max-w-full px-1">
                            Taken: {occupyingArt.title}
                          </span>
                        ) : (
                          <span className={`text-[8px] font-mono uppercase ${isSelected ? 'text-[#111111]/70' : 'text-[#D4AF37]'}`}>
                            {isSelected ? 'Selected' : 'Available'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: CHOOSE HANGING HEIGHT PRESET */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-[#D4AF37]">
                  Step 3: Choose Hanging Height
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {HEIGHT_PRESETS.map((h) => {
                    const Icon = h.icon;
                    const isSelected = selectedHeight === h.id && !showAdvancedPlacement;
                    return (
                      <button
                        type="button"
                        key={h.id}
                        onClick={() => {
                          setSelectedHeight(h.id);
                          setShowAdvancedPlacement(false);
                        }}
                        className={`py-2.5 px-3 rounded-none border text-xs font-bold uppercase tracking-luxury-wide flex items-center justify-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-[#D4AF37] text-[#111111] border-[#D4AF37] font-extrabold'
                            : 'bg-[#181818] border-white/10 text-slate-300 hover:border-[#D4AF37]/50 hover:text-[#FAFAFA]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {h.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OPTIONAL: ADVANCED CUSTOM NUMERIC POSITION OVERRIDE */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedPlacement(!showAdvancedPlacement)}
                  className="text-[10px] font-mono text-slate-400 hover:text-[#D4AF37] flex items-center gap-1.5 underline"
                >
                  <Sliders className="w-3 h-3" />
                  {showAdvancedPlacement ? 'Hide Exact Meter Overrides' : 'Advanced: Custom Meter Overrides (Optional)'}
                </button>

                {showAdvancedPlacement && (
                  <div className="mt-3 p-4 bg-[#181818] border border-white/10 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                        Horizontal Meter Offset
                      </label>
                      <input 
                        type="number"
                        step="0.1"
                        value={customOffsetNum}
                        onChange={(e) => setCustomOffsetNum(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#111111] border border-white/10 rounded-none px-3 py-2 text-xs text-[#D4AF37] font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                        Vertical Height (Meters)
                      </label>
                      <input 
                        type="number"
                        step="0.05"
                        value={customHeightNum}
                        onChange={(e) => setCustomHeightNum(parseFloat(e.target.value) || 1.55)}
                        className="w-full bg-[#111111] border border-white/10 rounded-none px-3 py-2 text-xs text-[#D4AF37] font-mono outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-slate-400 mb-1">
                  Curator Description / Notes
                </label>
                <textarea 
                  rows={3}
                  placeholder="Provide background context and curatorial notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#b8952b] text-[#111111] font-bold text-xs uppercase tracking-luxury-extreme rounded-none transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isUploading 
                  ? (editingArtwork ? 'Updating Artwork...' : 'Hanging Artwork in 3D...') 
                  : (editingArtwork ? 'Update Artwork Details' : 'Hang Artwork in 3D Gallery')}
              </button>
            </form>
          )}

          {/* TAB 2: ARTIST WINGS & ROOMS */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              
              {/* Create Artist Form */}
              <form onSubmit={handleCreateArtist} className="bg-[#181818] p-5 border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-luxury-wide">
                  <User className="w-4 h-4" />
                  Add New Artist Profile
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="Artist Full Name"
                  value={newArtistName}
                  onChange={(e) => setNewArtistName(e.target.value)}
                  className="w-full bg-[#111111] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none"
                />
                <textarea 
                  rows={2}
                  placeholder="Artist biography..."
                  value={newArtistBio}
                  onChange={(e) => setNewArtistBio(e.target.value)}
                  className="w-full bg-[#111111] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none resize-none"
                />
                <button 
                  type="submit"
                  className="py-2.5 px-5 bg-white/10 hover:bg-white/20 text-[#FAFAFA] font-bold text-xs uppercase tracking-luxury-wide rounded-none transition-all"
                >
                  Create Artist Profile
                </button>
              </form>

              {/* Create / Edit Room Form */}
              <form onSubmit={handleCreateRoom} className="bg-[#181818] p-5 border border-white/10 space-y-4">
                {editingRoom && (
                  <div className="flex items-center justify-between p-3 rounded-none bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      <span>Editing Exhibition: <strong>"{editingRoom.title}"</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEditRoom}
                      className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-300 hover:text-slate-100 bg-white/10 px-2 py-1 rounded-none"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Cancel Edit
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-luxury-wide">
                  <FolderPlus className="w-4 h-4" />
                  {editingRoom ? 'Edit Exhibition Details' : 'Create Artist Gallery Room / Wing'}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={newRoomArtistId}
                    onChange={(e) => setNewRoomArtistId(e.target.value)}
                    className="w-full bg-[#111111] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none"
                  >
                    {artists.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    required
                    placeholder="Room Title (e.g. Solo Exhibition Hall)"
                    value={newRoomTitle}
                    onChange={(e) => setNewRoomTitle(e.target.value)}
                    className="w-full bg-[#111111] border border-white/15 rounded-none px-3 py-2.5 text-xs text-[#FAFAFA] focus:border-[#D4AF37] outline-none"
                  />
                </div>

                {/* Wall finish swatches */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-[#D4AF37]">
                    Wall Finish
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {ROOM_WALL_COLORS.map((c) => {
                      const isSelected = newRoomWallColor === c.value;
                      return (
                        <button
                          type="button"
                          key={c.value}
                          onClick={() => setNewRoomWallColor(c.value)}
                          className={`flex items-center gap-2.5 p-2.5 border transition-all rounded-none ${
                            isSelected
                              ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                              : 'border-white/10 bg-[#111111] hover:border-[#D4AF37]/50'
                          }`}
                        >
                          <span
                            className="w-7 h-7 shrink-0 border border-white/25"
                            style={{ backgroundColor: c.value }}
                          />
                          <span className={`text-[10px] font-bold uppercase tracking-luxury-wide leading-tight ${isSelected ? 'text-[#FAFAFA]' : 'text-slate-400'}`}>
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hall architecture cards */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-luxury-wide text-[#D4AF37]">
                    Hall Architecture
                  </label>
                  <div className={`grid gap-2.5 ${HALL_OPTIONS.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {HALL_OPTIONS.map((l) => {
                      const isSelected = newRoomHall === l.value;
                      return (
                        <button
                          type="button"
                          key={l.value}
                          onClick={() => setNewRoomHall(l.value)}
                          className={`p-3 border text-left transition-all rounded-none ${
                            isSelected
                              ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                              : 'border-white/10 bg-[#111111] hover:border-[#D4AF37]/50'
                          }`}
                        >
                          <span className={`block text-xs font-bold ${isSelected ? 'text-[#FAFAFA]' : 'text-slate-300'}`}>
                            {l.name}
                          </span>
                          <span className="block mt-0.5 text-[8px] font-bold uppercase tracking-luxury-wide text-[#D4AF37]/80">
                            {l.tagline}
                          </span>
                          <span className="block mt-1 text-[9px] leading-snug text-slate-500">
                            {l.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {HALL_OPTIONS.filter((l) => l.value === newRoomHall).map((l) => (
                    <div key={`${l.value}-detail`} className="p-3 bg-[#111111] border border-white/10 space-y-1.5">
                      <p className="text-[9px] leading-relaxed text-slate-400">
                        <span className="font-bold uppercase tracking-luxury-wide text-slate-300">Walls: </span>
                        {l.wallConfiguration}
                      </p>
                      <p className="text-[9px] leading-relaxed text-slate-400">
                        <span className="font-bold uppercase tracking-luxury-wide text-slate-300">Circulation: </span>
                        {l.circulation}
                      </p>
                      <p className="text-[9px] leading-relaxed text-slate-400">
                        <span className="font-bold uppercase tracking-luxury-wide text-slate-300">Lighting: </span>
                        {l.lighting}
                      </p>
                    </div>
                  ))}
                  <p className="text-[9px] font-mono text-slate-500">
                    The hall architecture defines the walls, baffle partitions, pillar islands, visitor circulation and lighting of this wing — and where newly hung artworks may be placed.
                  </p>
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#D4AF37] hover:bg-[#b8952b] text-[#111111] font-bold text-xs uppercase tracking-luxury-wide rounded-none transition-all"
                >
                  {editingRoom ? 'Update Exhibition' : 'Create Gallery Room'}
                </button>
              </form>

              {/* Manage Existing Exhibitions */}
              <div className="bg-[#181818] p-5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-luxury-wide">
                  <Pencil className="w-4 h-4" />
                  Manage Existing Exhibitions
                </div>
                {rooms.length === 0 && (
                  <p className="text-xs text-slate-400 py-2">No exhibitions yet.</p>
                )}
                {rooms.map((room) => {
                  const isEditing = editingRoom?.id === room.id;
                  const hallName = HALL_OPTIONS.find((h) => h.value === (room.hall_layout || 'classic'))?.name || 'Classic Center Hall';
                  const artCount = artworks.filter((a) => a.roomId === room.id).length;
                  return (
                    <div
                      key={room.id}
                      className={`flex items-center justify-between gap-3 p-3 border transition-all ${
                        isEditing ? 'border-[#D4AF37]/60 bg-[#D4AF37]/10' : 'border-white/10 bg-[#111111]'
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#FAFAFA] truncate">{room.title}</h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {room.artist_name || 'Group'} • {artCount} works • {hallName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="p-2 rounded-none text-slate-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all"
                          title="Edit exhibition title, finish & hall architecture"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id, room.title)}
                          disabled={rooms.length <= 1}
                          className={`p-2 rounded-none transition-all ${
                            rooms.length <= 1
                              ? 'text-slate-600 cursor-not-allowed'
                              : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                          }`}
                          title={rooms.length <= 1 ? 'Cannot delete the last remaining exhibition' : 'Delete exhibition'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: MANAGE EXHIBITION */}
          {activeTab === 'manage' && (
            <div className="space-y-3">
              {artworks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No artworks in current exhibition catalogue.</p>
              ) : (
                artworks.map((art) => (
                  <div key={art.id} className="flex items-center justify-between p-3 bg-[#181818] border border-white/10">
                    <div className="flex items-center gap-3">
                      <img src={art.imageUrl} alt={art.title} className="w-12 h-12 object-cover rounded-none border border-white/10" />
                      <div>
                        <h4 className="text-xs font-bold text-[#FAFAFA]">{art.title}</h4>
                        <p className="text-[10px] text-slate-400">{art.artist} • {art.widthIn}″ × {art.heightIn}″ • Wall: {art.wallId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditArtwork(art)}
                        className="p-2 rounded-none text-slate-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all"
                        title="Edit artwork position & details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArtwork(art.id, art.title)}
                        className="p-2 rounded-none text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Remove artwork"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
             </div>
           )}

        </div>
        </>
        )}
      </div>
    </div>
  );
}
