import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Room, RoomScan } from '../../types';
import { roomService } from '../../services/roomService';
import {
  Camera,
  Layers,
  Sparkles,
  User as UserIcon,
  Plus,
  Trash2,
  Maximize2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Move3d,
} from 'lucide-react';
import { Room3DModal } from '../room3d/Room3DModal';

interface DashboardProps {
  onStartNewRoom: () => void;
  onOpenScanWizard: (room: Room, scan: RoomScan) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartNewRoom, onOpenScanWizard }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rooms' | 'designs' | 'recent' | 'profile'>('rooms');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [active3DRoom, setActive3DRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roomService.getRooms();
      setRooms(data);
    } catch (err: any) {
      console.error('Error fetching user rooms:', err);
      setError('Could not load your rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDeleteRoom = async (roomId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this room and its scans?')) return;

    try {
      await roomService.deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err: any) {
      console.error('Failed to delete room:', err);
      alert('Failed to delete room.');
    }
  };

  const handleResumeScan = async (room: Room) => {
    try {
      const scan = await roomService.createScan(room.id);
      onOpenScanWizard(room, scan);
    } catch (err: any) {
      console.error('Failed to initialize scan:', err);
      alert('Failed to initialize scan session.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero / Prominent Primary CTA Banner */}
      <section className="relative px-4 sm:px-8 py-10 sm:py-14 bg-gradient-to-b from-indigo-950/60 via-slate-950 to-slate-950 border-b border-white/10 overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-3 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phase 2 Real Camera Spatial Workflow</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Transform Your Space with <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Real 360° Scans</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Capture your real room surfaces with guided device orientation. Our backend securely maps your spatial boundaries for Phase 3 interior redesign synthesis.
            </p>
          </div>

          {/* PRIMARY CTA BUTTON: SCAN MY ROOM */}
          <div className="w-full md:w-auto shrink-0 flex flex-col items-center">
            <button
              onClick={onStartNewRoom}
              className="group relative w-full sm:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-extrabold text-lg sm:text-xl shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-4 border border-white/20"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="tracking-wide">SCAN MY ROOM</span>
              <ArrowRight className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[11px] text-slate-500 mt-2 font-medium">
              WebRTC Camera Access + Device Orientation Guide
            </span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Workspace Tabs */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'rooms'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>My Rooms</span>
            {rooms.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300">
                {rooms.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('designs')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'designs'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>My Designs</span>
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'recent'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Recent Scans</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>

        {/* TAB 1: MY ROOMS */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Scanned Room Entities</h2>
              <button
                onClick={onStartNewRoom}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Add Room</span>
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400 mt-3">Loading your room entities from PostgreSQL backend...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
                {error}
              </div>
            ) : rooms.length === 0 ? (
              /* PROPER EMPTY STATE AS SPECIFIED IN SPEC */
              <div className="py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="max-w-sm mx-auto">
                  <h3 className="text-lg font-bold text-white">You haven't scanned a room yet.</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Create a new room profile and use your camera to scan all 6 surfaces (Walls, Floor, Ceiling).
                  </p>
                </div>
                <button
                  onClick={onStartNewRoom}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition inline-flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan My Room</span>
                </button>
              </div>
            ) : (
              /* ROOM CARDS GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => {
                  const hasDimensions = room.length && room.width && room.height;
                  return (
                    <div
                      key={room.id}
                      onClick={() => handleResumeScan(room)}
                      className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {room.type}
                            </span>
                            <h3 className="text-lg font-bold text-white mt-1 group-hover:text-indigo-300 transition">
                              {room.name}
                            </h3>
                          </div>
                          <button
                            onClick={(e) => handleDeleteRoom(room.id, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-400">
                          {hasDimensions
                            ? `Dimensions: ${room.length}m × ${room.width}m × ${room.height}m`
                            : 'Dimensions: Unspecified (Skipped)'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActive3DRoom(room);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 font-semibold transition flex items-center gap-1.5"
                        >
                          <Move3d className="w-3.5 h-3.5 text-indigo-400" />
                          <span>3D Virtual Room</span>
                        </button>

                        <span className="font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          <span>Scan Camera</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY DESIGNS (Empty State - Phase 3 feature) */}
        {activeTab === 'designs' && (
          <div className="py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Layers className="w-8 h-8 text-purple-400" />
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-white">No saved designs yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Design synthesis & material style selection (Standard, Modern, Luxury) will be generated after Phase 3 AI analysis.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: RECENT DESIGNS / SCANS (Empty State) */}
        {activeTab === 'recent' && (
          <div className="py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your recent camera capture sessions and uploads will appear here.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-500/30">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{user?.fullName}</h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Authenticated User (JWT Secured)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              <p>User ID: <span className="font-mono text-slate-200">{user?.id}</span></p>
              <p>Account Type: <span className="text-slate-200 font-semibold">Standard Creator</span></p>
            </div>
          </div>
        )}
      </main>

      {/* Phase 4 Interactive 3D Virtual Room Modal */}
      {active3DRoom && (
        <Room3DModal
          room={active3DRoom}
          isOpen={!!active3DRoom}
          onClose={() => setActive3DRoom(null)}
        />
      )}
    </div>
  );
};
