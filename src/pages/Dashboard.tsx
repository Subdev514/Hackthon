import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Bug as BugIcon,
  Zap,
  Clock,
  ArrowUpRight,
  Plus,
  X,
  Loader2,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { getAllRooms, createRoom, joinRoom, Room } from '../lib/rooms';
import { MOCK_BUGS } from '../constants';

const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  trend: string;
  color: string;
}) => (
  <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400`}>
        <Icon size={20} />
      </div>
      <span
        className={`text-xs font-bold ${trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
          } bg-white/5 px-2 py-1 rounded-full`}
      >
        {trend}
      </span>
    </div>
    <p className="text-zinc-500 text-sm font-medium mb-1">{label}</p>
    <h3 className="text-2xl font-bold">{value}</h3>
  </div>
);

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Create Room form state
  const [roomName, setRoomName] = useState('');
  const [channelsInput, setChannelsInput] = useState('general, code, debug');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');

  // Lock modal state
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedLockRoom, setSelectedLockRoom] = useState<Room | null>(null);
  const [lockPassword, setLockPassword] = useState('');
  const [lockError, setLockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const displayName = profile?.displayName ?? user?.displayName ?? 'there';
  const firstName = displayName.split(' ')[0];

  useEffect(() => {
    setLoadingRooms(true);
    getAllRooms().then(r => {
      setRooms(r);
      setLoadingRooms(false);
    });
  }, []);

  const isRoomAccessible = (r: Room) => {
    if (!r.hasPassword) return true;
    if (user && r.createdBy === user.uid) return true;
    try {
      const unlocked = JSON.parse(localStorage.getItem('unlocked_rooms') || '{}');
      return !!unlocked[r.roomId];
    } catch {
      return false;
    }
  };

  const handleRoomClick = (r: Room) => {
    if (isRoomAccessible(r)) {
      navigate(`/room/${r.roomId}`);
    } else {
      setSelectedLockRoom(r);
      setLockPassword('');
      setLockError(null);
      setShowLockModal(true);
    }
  };

  const handleUnlockRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLockRoom || !user) return;
    setUnlocking(true);
    setLockError(null);
    try {
      const { room: joined, error } = await joinRoom({
        roomId: selectedLockRoom.roomId,
        uid: user.uid,
        displayName: displayName,
        password: lockPassword,
      });

      if (error) {
        setLockError(error);
      } else if (joined) {
        const unlocked = JSON.parse(localStorage.getItem('unlocked_rooms') || '{}');
        unlocked[selectedLockRoom.roomId] = true;
        localStorage.setItem('unlocked_rooms', JSON.stringify(unlocked));
        
        setShowLockModal(false);
        navigate(`/room/${selectedLockRoom.roomId}`);
      }
    } catch (err: any) {
      setLockError(err.message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) { setCreateError('Room name is required.'); return; }
    if (!user) return;

    setCreating(true);
    setCreateError(null);
    const channels = channelsInput.split(',').map(s => s.trim()).filter(Boolean);
    const { roomId, error } = await createRoom({
      roomName: roomName.trim(),
      channels: channels.length ? channels : ['general'],
      createdBy: user.uid,
      displayName: displayName,
      password: isPasswordProtected ? roomPassword : '',
    });
    setCreating(false);

    if (error) { setCreateError(error); return; }
    if (roomId) {
      setShowModal(false);
      setRoomName('');
      setChannelsInput('general, code, debug');
      setIsPasswordProtected(false);
      setRoomPassword('');
      // Refresh rooms list
      const updated = await getAllRooms();
      setRooms(updated);
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome back, {firstName} 👋</h1>
          <p className="text-zinc-500">Here's what's happening across your workspace today.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} /> New Debug Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Active Rooms" value={String(rooms.length)} icon={Users} trend="+2" color="emerald" />
        <StatCard label="Bugs Fixed" value="142" icon={BugIcon} trend="+12%" color="indigo" />
        <StatCard label="Team Online" value="8" icon={Zap} trend="+3" color="yellow" />
        <StatCard label="AI Queries" value="1.2k" icon={Zap} trend="+24%" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Rooms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Debug Rooms</h2>
            <button className="text-sm text-emerald-400 font-medium hover:underline">View all</button>
          </div>

          {loadingRooms ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-emerald-400" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-12 rounded-2xl bg-dark-surface border border-dark-border text-center text-zinc-500">
              <p className="mb-4">No rooms yet.</p>
              <button onClick={() => setShowModal(true)} className="btn-primary py-2 px-4 text-sm">
                <Plus size={16} /> Create your first room
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map(room => (
                <div key={room.roomId} onClick={() => handleRoomClick(room)} className="block cursor-pointer">
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="p-5 rounded-2xl bg-dark-surface border border-dark-border flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 transition-colors">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1 flex items-center gap-2">
                          {room.name}
                          {room.hasPassword && (
                            <span className="text-yellow-500" title="Password Protected">
                              <Lock size={14} className="fill-current" />
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {room.channels?.length ?? 0} channels
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {room.roomId}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                      <ArrowUpRight size={20} />
                    </button>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bug Timeline */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Bug Timeline</h2>
          <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border">
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-dark-border">
              {MOCK_BUGS.map(bug => (
                <div key={bug.id} className="relative pl-8">
                  <div
                    className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-dark-surface ${bug.severity === 'critical'
                        ? 'bg-red-500'
                        : bug.severity === 'high'
                          ? 'bg-orange-500'
                          : 'bg-emerald-500'
                      }`}
                  />
                  <div>
                    <p className="text-sm font-bold mb-1">{bug.title}</p>
                    <p className="text-xs text-zinc-500">
                      {bug.room} •{' '}
                      {new Date(bug.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border border-dark-border text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              View Full History
            </button>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-dark-surface border border-dark-border rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">New Debug Room</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {createError && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder="e.g. Authentication Service"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Channels <span className="normal-case text-zinc-600">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={channelsInput}
                    onChange={e => setChannelsInput(e.target.value)}
                    placeholder="general, code, debug"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password Protected</span>
                    <button
                      type="button"
                      onClick={() => setIsPasswordProtected(!isPasswordProtected)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isPasswordProtected ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isPasswordProtected ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {isPasswordProtected && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                      <input
                        type="password"
                        value={roomPassword}
                        onChange={e => setRoomPassword(e.target.value)}
                        placeholder="Enter room password..."
                        className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-zinc-200"
                        required={isPasswordProtected}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1 py-3"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={creating} className="btn-primary flex-1 py-3 disabled:opacity-60">
                    {creating ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Create Room</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Unlock Password Modal */}
      <AnimatePresence>
        {showLockModal && selectedLockRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={e => e.target === e.currentTarget && setShowLockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-dark-surface border border-dark-border rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Password Required</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Enter password for "{selectedLockRoom.name}"</p>
                  </div>
                </div>
                <button onClick={() => setShowLockModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {lockError && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                  {lockError}
                </div>
              )}

              <form onSubmit={handleUnlockRoom} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Room Password</label>
                  <input
                    type="password"
                    value={lockPassword}
                    onChange={e => setLockPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-zinc-200"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLockModal(false)}
                    className="btn-secondary flex-1 py-3"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={unlocking} className="btn-primary flex-1 py-3 disabled:opacity-60">
                    {unlocking ? <Loader2 size={18} className="animate-spin" /> : 'Unlock & Join'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
