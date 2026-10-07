import React, { useState } from 'react';
import { RoomType, Room } from '../../types';
import { roomService } from '../../services/roomService';
import { X, Info, Ruler, ArrowRight } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: Room) => void;
}

const ROOM_TYPES: { label: string; value: RoomType }[] = [
  { label: 'Bedroom', value: 'BEDROOM' },
  { label: 'Living Room', value: 'LIVING_ROOM' },
  { label: 'Kitchen', value: 'KITCHEN' },
  { label: 'Dining Room', value: 'DINING_ROOM' },
  { label: 'Office', value: 'OFFICE' },
  { label: 'Study Room', value: 'STUDY_ROOM' },
  { label: 'Other', value: 'OTHER' },
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onRoomCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<RoomType>('LIVING_ROOM');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!name.trim()) {
        throw new Error('Room name is required.');
      }

      const roomData = {
        name: name.trim(),
        type,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
      };

      const createdRoom = await roomService.createRoom(roomData);
      onRoomCreated(createdRoom);
      onClose();
    } catch (err: any) {
      console.error('Error creating room:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to create room entity.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>New Room Details</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Specify room details before initializing the 360° scanning camera wizard.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Room Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Master Bedroom, Sunlit Living Room"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
            />
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Room Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RoomType)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
            >
              {ROOM_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dimensions Section */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-indigo-300 bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Optional:</strong> Dimensions improve cost estimation accuracy (₹/sq.ft) and 3D room WebGL rendering precision. Skip if unknown.
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Length (m)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Width (m)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="e.g. 3.8"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Height (m)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 2.8"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Ruler className="w-4 h-4" />
                <span>Save & Launch Camera Scanner</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
