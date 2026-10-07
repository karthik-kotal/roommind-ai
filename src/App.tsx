import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { AuthModal } from './components/common/AuthModal';
import { CreateRoomModal } from './components/room/CreateRoomModal';
import { RoomScanner } from './components/scanner/RoomScanner';
import { AnalysisResultModal } from './components/analysis/AnalysisResultModal';
import { Dashboard } from './components/dashboard/Dashboard';
import { BeforeAfterSlider } from './components/legacy/BeforeAfterSlider';
import { FloorPlanner } from './components/legacy/FloorPlanner';
import { ShoppingList } from './components/legacy/ShoppingList';
import { Room, RoomScan } from './types';
import { roomService } from './services/roomService';
import { Sparkles, Move3d } from 'lucide-react';
import { Room3DViewer } from './components/room3d/Room3DViewer';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Modals state
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login',
  });
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  // Active Scanner Session State
  const [scannerSession, setScannerSession] = useState<{
    room: Room;
    scan: RoomScan;
  } | null>(null);

  // Phase 3 Analysis Modal State
  const [analysisModalSession, setAnalysisModalSession] = useState<{
    room: Room;
    scan?: RoomScan | null;
  } | null>(null);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalState({ isOpen: true, mode });
  };

  const handleStartNewRoom = () => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setIsCreateRoomOpen(true);
  };

  const handleRoomCreated = async (room: Room) => {
    try {
      const scan = await roomService.createScan(room.id);
      setScannerSession({ room, scan });
    } catch (err) {
      console.error('Failed to create scan for room:', err);
      alert('Could not start room scan session.');
    }
  };

  const handleOpenScanWizard = (room: Room, scan: RoomScan) => {
    setScannerSession({ room, scan });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenScanner={handleStartNewRoom}
      />

      {/* Primary Dashboard */}
      <Dashboard
        onStartNewRoom={handleStartNewRoom}
        onOpenScanWizard={handleOpenScanWizard}
      />

      {/* Legacy Showcase Components Section (Preserved Functionality) */}
      <section className="px-4 sm:px-8 py-12 max-w-6xl w-full mx-auto space-y-8 border-t border-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Interactive Spatial Redesign Showcase</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Explore preset visual tools, floor planners, and material estimation (Preserved from V1).
            </p>
          </div>
        </div>

        {/* Phase 4 Parametric 3D Virtual Room Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Move3d className="w-5 h-5 text-indigo-400" />
              <span>Phase 4 Parametric 3D Virtual Room (Live WebGL Scene)</span>
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
              Interactive WebGL Viewport
            </span>
          </div>

          <Room3DViewer
            dimensions={{ length: 5.5, width: 4.2, height: 2.8 }}
            detectedWallCategory="painted wall"
            detectedFloorCategory="wood-like flooring"
            selectedStyle="MODERN"
            detectedObjects={[
              { className: 'sofa', modelScore: 0.88 },
              { className: 'table', modelScore: 0.79 },
              { className: 'chair', modelScore: 0.82 },
              { className: 'plant', modelScore: 0.74 },
              { className: 'lamp', modelScore: 0.85 },
            ]}
            title="Interactive 3D Virtual Room — Living Room Scene"
            allowSurfaceEditing
          />
        </div>

        {/* Visual Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Before / After Vision Comparison
            </h3>
            <BeforeAfterSlider
              beforeImage="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
              afterImage="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
              beforeLabel="Original Room"
              afterLabel="Japandi Minimalist"
            />
          </div>

          <div className="space-y-6">
            <FloorPlanner />
            <ShoppingList />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-4 py-6 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
        <p>Roommind.AI Phase 3 — Computer Vision Spatial Analysis & Renovation Cost Engine</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalState.isOpen}
        mode={authModalState.mode}
        onClose={() => setAuthModalState({ ...authModalState, isOpen: false })}
        onSwitchMode={(mode) => setAuthModalState({ isOpen: true, mode })}
      />

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onRoomCreated={handleRoomCreated}
      />

      {/* Full-screen Scanner Wizard */}
      {scannerSession && (
        <RoomScanner
          room={scannerSession.room}
          scan={scannerSession.scan}
          onClose={() => setScannerSession(null)}
          onCompleteScan={(updatedScan) => {
            console.log('Scan sequence complete:', updatedScan);
          }}
          onOpenAnalysisModal={() => {
            setAnalysisModalSession({
              room: scannerSession.room,
              scan: scannerSession.scan,
            });
            setScannerSession(null);
          }}
        />
      )}

      {/* Phase 3 Analysis Result Modal */}
      {analysisModalSession && (
        <AnalysisResultModal
          room={analysisModalSession.room}
          scan={analysisModalSession.scan}
          isOpen={!!analysisModalSession}
          onClose={() => setAnalysisModalSession(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
