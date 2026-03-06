import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Paperclip,
  Smile,
  Code,
  Terminal,
  Sparkles,
  Users,
  Settings,
  MoreHorizontal,
  Play,
  Loader2,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import Debugger from '../components/Debugger';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToMessages,
  sendMessage,
  setTyping,
  clearTyping,
  subscribeToTyping,
  ChatMessage,
} from '../lib/chat';
import { getRoom, subscribeToMembers, Room } from '../lib/rooms';
import { askDebugAI } from '../lib/api';

export default function RoomView() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'terminal' | 'debugger'>('code');
  const [members, setMembers] = useState<Array<{ uid: string; displayName: string }>>([]);
  const [typers, setTypers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [codeSnippet, setCodeSnippet] = useState(`import { auth } from "@debugflow/core";

const validateSession = async (token: string) => {
  try {
    // Check Redis cache first
    const cached = await redis.get(token);
    if (cached) return JSON.parse(cached);

    // If not in cache, verify with DB
    const user = await db.users.findUnique({ where: { token } });
    if (!user) throw new Error("Invalid session");

    return user;
  } catch (error) {
    return null;
  }
};`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeChannelId = room?.channels?.[0]?.id ?? 'general';

  const displayName = profile?.displayName ?? user?.displayName ?? 'User';
  const avatarUrl =
    profile?.avatarUrl ??
    user?.photoURL ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10B981&color=000&bold=true`;

  // Load room meta
  useEffect(() => {
    if (!roomId) return;
    getRoom(roomId).then(({ room: r }) => setRoom(r));
  }, [roomId]);

  // Subscribe to messages
  useEffect(() => {
    if (!roomId || !room) return;
    const unsub = subscribeToMessages(roomId, activeChannelId, msgs => {
      setMessages(msgs);
    });
    return unsub;
  }, [roomId, room, activeChannelId]);

  // Subscribe to members
  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToMembers(roomId, setMembers);
    return unsub;
  }, [roomId]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = subscribeToTyping(roomId, user.uid, setTypers);
    return unsub;
  }, [roomId, user]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !roomId || !user) return;
    setSending(true);
    setInputValue('');
    await sendMessage({
      roomId,
      channelId: activeChannelId,
      text: trimmed,
      senderId: user.uid,
      senderName: displayName,
      senderAvatar: avatarUrl,
    });
    setSending(false);
  }, [inputValue, roomId, user, activeChannelId, displayName, avatarUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (!roomId || !user) return;
    // Debounced typing indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    await setTyping({ roomId, uid: user.uid, displayName });
    typingTimerRef.current = setTimeout(() => {
      clearTyping({ roomId, uid: user!.uid });
    }, 3000);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleAskAI = async () => {
    if (!roomId) return;
    setActiveTab('ai');
    setAiLoading(true);
    try {
      const result = await askDebugAI(roomId, codeSnippet, 'Redis connection failed: Connection timeout');
      setAiResult(result.text);
    } catch (error: any) {
      setAiResult(`Error: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Chat Panel */}
      <div className="w-96 flex flex-col bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-dark-border flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <div>
              <h2 className="font-bold text-sm">{room?.name ?? 'Loading…'}</h2>
              <p className="text-xs text-zinc-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:text-white transition-colors"><Users size={18} /></button>
            <button className="p-2 text-zinc-400 hover:text-white transition-colors"><Settings size={18} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-zinc-600 text-sm mt-8">
              No messages yet. Say hello! 👋
            </div>
          )}
          {messages.map(msg => {
            const isOwn = msg.senderId === user?.uid;
            const senderAvatar =
              msg.senderAvatar ??
              `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=10B981&color=000&bold=true`;
            return (
              <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <img
                  src={senderAvatar}
                  alt={msg.senderName}
                  className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className={`max-w-[80%] ${isOwn ? 'items-end' : ''}`}>
                  <div className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-bold text-zinc-400">{msg.senderName}</span>
                    <span className="text-[10px] text-zinc-600">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-sm leading-relaxed ${isOwn
                      ? 'bg-emerald-500 text-black font-medium'
                      : 'bg-white/5 text-zinc-300 border border-white/10'
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Typing indicator */}
          {typers.length > 0 && (
            <p className="text-xs text-zinc-500 italic px-1">
              {typers.join(', ')} {typers.length === 1 ? 'is' : 'are'} typing…
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white/5 border-t border-dark-border">
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none h-24 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={sending || !inputValue.trim()}
              className="absolute right-3 bottom-3 p-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="flex items-center gap-4 mt-3 px-1">
            <button className="text-zinc-500 hover:text-white transition-colors"><Paperclip size={18} /></button>
            <button className="text-zinc-500 hover:text-white transition-colors"><Smile size={18} /></button>
            <button
              onClick={() => setActiveTab('debugger')}
              className="text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <Shield size={14} className="text-emerald-400" /> Analyze Code
            </button>
          </div>
        </div>
      </div>

      {/* Code / Editor Panel */}
      <div className="flex-1 flex flex-col bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
        <div className="flex items-center justify-between px-4 bg-white/5 border-b border-dark-border">
          <div className="flex">
            {(['code', 'terminal', 'debugger'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === tab
                    ? 'border-emerald-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {tab === 'code' && <Code size={18} />}
                {tab === 'terminal' && <Terminal size={18} />}
                {tab === 'debugger' && <Shield size={18} className="text-emerald-400" />}
                {tab === 'code' ? 'Editor' : tab === 'terminal' ? 'Terminal' : 'Debugger'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary py-1.5 px-4 text-xs">
              <Play size={14} className="fill-current" /> Run Code
            </button>
            <button className="p-2 text-zinc-500 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full font-mono text-sm p-6 overflow-y-auto bg-dark-bg/50"
              >
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="w-full h-full bg-transparent resize-none focus:outline-none"
                  spellCheck="false"
                />
              </motion.div>
            )}

            {activeTab === 'terminal' && (
              <motion.div
                key="terminal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full bg-black/50 p-6 font-mono text-sm text-zinc-300"
              >
                <div className="space-y-2">
                  <p className="text-emerald-400">user@debugflow:~/room$ <span className="text-white">npm run dev</span></p>
                  <p className="text-zinc-500">{'['}vite{']'} server started at http://localhost:3000</p>
                  <p className="text-zinc-500">{'['}auth{']'} Initializing Redis connection...</p>
                  <p className="text-red-400">{'['}error{']'} Redis connection failed: Connection timeout</p>
                  <p className="text-zinc-500">{'['}auth{']'} Retrying in 5s...</p>
                  <div className="flex gap-2">
                    <span className="text-emerald-400">user@debugflow:~/room$</span>
                    <span className="w-2 h-5 bg-zinc-500 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'debugger' && (
              <motion.div
                key="debugger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <Debugger code={codeSnippet} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
