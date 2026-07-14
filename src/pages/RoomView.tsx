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
  Lock,
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
import { getRoom, joinRoom, subscribeToMembers, Room, subscribeToChannel, updateChannelContent } from '../lib/rooms';
import { askDebugAI } from '../lib/api';

const DEFAULT_TEMPLATES = {
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, DebugFlow C Compiler!\\\\n");\n    \n    // Test a basic loop\n    for (int i = 1; i <= 5; i++) {\n        printf("Iteration %d\\\\n", i);\n    }\n    \n    return 0;\n}`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, DebugFlow C++ Compiler!" << std::endl;\n    \n    // Test a basic loop\n    for (int i = 1; i <= 5; i++) {\n        std::cout << "Iteration " << i << std::endl;\n    }\n    \n    return 0;\n}`,
  py: `def greet(name):\n    print(f"Hello, {name}!")\n    \n    # Test a basic loop\n    for i in range(1, 6):\n        print(f"Iteration {i}")\n\ngreet("DebugFlow Python Compiler")\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, DebugFlow Java Compiler!");\n        \n        // Test a basic loop\n        for (int i = 1; i <= 5; i++) {\n            System.out.println("Iteration " + i);\n        }\n    }\n}`,
  js: `console.log("Hello, DebugFlow JavaScript Compiler!");\n\n// Test a basic loop\nfor (let i = 1; i <= 5; i++) {\n    console.log("Iteration " + i);\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, DebugFlow Go Compiler!")\n    \n    // Test a basic loop\n    for i := 1; i <= 5; i++ {\n        fmt.Printf("Iteration %d\\n", i)\n    }\n}`,
};

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

  // Password verification state
  const [roomPassword, setRoomPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [codeSnippet, setCodeSnippet] = useState('');

  // Compiler state
  const [runLoading, setRunLoading] = useState(false);
  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [language, setLanguage] = useState<'c' | 'cpp' | 'py' | 'java' | 'js' | 'go'>('c');
  const [localApiKey, setLocalApiKey] = useState(localStorage.getItem('onlinecompiler_api_key') || '');

  // Chat panel resizing state
  const [chatWidth, setChatWidth] = useState(() => {
    const saved = localStorage.getItem('chat_panel_width');
    return saved ? parseInt(saved, 10) : 384;
  });
  const chatRef = useRef<HTMLDivElement>(null);
  const isResizingChatRef = useRef(false);

  const startResizingChat = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingChatRef.current = true;
  }, []);

  const stopResizingChat = useCallback(() => {
    isResizingChatRef.current = false;
  }, []);

  const resizeChat = useCallback((e: MouseEvent) => {
    if (isResizingChatRef.current && chatRef.current) {
      const rect = chatRef.current.getBoundingClientRect();
      const newWidth = Math.min(Math.max(280, e.clientX - rect.left), 600);
      setChatWidth(newWidth);
      localStorage.setItem('chat_panel_width', String(newWidth));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resizeChat);
    window.addEventListener('mouseup', stopResizingChat);
    return () => {
      window.removeEventListener('mousemove', resizeChat);
      window.removeEventListener('mouseup', stopResizingChat);
    };
  }, [resizeChat, stopResizingChat]);

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

  // Check room unlock status
  useEffect(() => {
    if (!room || !roomId) return;
    const checkUnlock = () => {
      if (!room.hasPassword) return true;
      if (user && room.createdBy === user.uid) return true;
      try {
        const unlocked = JSON.parse(localStorage.getItem('unlocked_rooms') || '{}');
        return !!unlocked[roomId];
      } catch {
        return false;
      }
    };
    setIsUnlocked(checkUnlock());
  }, [room, roomId, user]);

  const handleVerifyPassword = async () => {
    if (!roomId || !user || !room) return;
    setVerifyingPassword(true);
    setPasswordError(null);
    try {
      const { room: joined, error } = await joinRoom({
        roomId,
        uid: user.uid,
        displayName,
        password: roomPassword,
      });

      if (error) {
        setPasswordError(error);
      } else if (joined) {
        const unlocked = JSON.parse(localStorage.getItem('unlocked_rooms') || '{}');
        unlocked[roomId] = true;
        localStorage.setItem('unlocked_rooms', JSON.stringify(unlocked));
        setIsUnlocked(true);
      }
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setVerifyingPassword(false);
    }
  };

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

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  // Subscribe to channel code content
  useEffect(() => {
    if (!roomId || !activeChannelId || !user) return;
    hasLoadedRef.current = false;
    const unsub = subscribeToChannel(roomId, activeChannelId, (data) => {
      if (!hasLoadedRef.current) {
        const initialLang = (data.language as any) || 'c';
        setLanguage(initialLang);
        setCodeSnippet(data.content || DEFAULT_TEMPLATES[initialLang as keyof typeof DEFAULT_TEMPLATES]);
        hasLoadedRef.current = true;
      } else {
        if (data.updatedBy !== user.uid) {
          setCodeSnippet(data.content || '');
          if (data.language) {
            setLanguage(data.language as any);
          }
        }
      }
    });
    return () => {
      unsub();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [roomId, activeChannelId, user]);

  const handleLanguageChange = async (newLang: typeof language) => {
    setLanguage(newLang);
    
    const templateValues = Object.values(DEFAULT_TEMPLATES).map(t => t.trim());
    const isEmptyOrTemplate = !codeSnippet.trim() || templateValues.includes(codeSnippet.trim());
    
    let updatedCode = codeSnippet;
    if (isEmptyOrTemplate) {
      updatedCode = DEFAULT_TEMPLATES[newLang];
      setCodeSnippet(updatedCode);
    }

    if (!roomId || !activeChannelId || !user) return;
    
    await updateChannelContent({
      roomId,
      channelId: activeChannelId,
      content: updatedCode,
      language: newLang,
      uid: user.uid,
    });
  };

  const handleCodeChange = (val: string) => {
    setCodeSnippet(val);
    
    if (!roomId || !activeChannelId || !user) return;
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      await updateChannelContent({
        roomId,
        channelId: activeChannelId,
        content: val,
        language,
        uid: user.uid,
      });
    }, 1000);
  };

  const saveCompilerKey = (key: string) => {
    localStorage.setItem('onlinecompiler_api_key', key);
    setLocalApiKey(key);
  };

  const runCode = async () => {
    if (!codeSnippet.trim()) return;
    setActiveTab('terminal');
    
    const envKey = import.meta.env.VITE_ONLINECOMPILER_API_KEY;
    const localKey = localStorage.getItem('onlinecompiler_api_key');
    const apiKey = envKey || localKey || '';

    if (!apiKey.trim()) {
      setRunOutput(null);
      return;
    }

    setRunLoading(true);
    setRunOutput(null);

    const compilerMap = {
      c: 'gcc-15',
      cpp: 'g++-15',
      py: 'python-3.14',
      java: 'openjdk-25',
      js: 'typescript-deno',
      go: 'go-1.26',
    };

    const compilerId = compilerMap[language] || 'gcc-15';

    try {
      const res = await fetch('/compiler-api/api/run-code-sync/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
        },
        body: JSON.stringify({
          compiler: compilerId,
          code: codeSnippet,
          input: '',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Compiler API returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        setRunOutput(data.error);
      } else {
        setRunOutput(data.output || 'Program compiled and executed with no output.');
      }
    } catch (err: any) {
      setRunOutput(`Error compiling/running code: ${err.message}`);
    } finally {
      setRunLoading(false);
    }
  };

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

  if (room && room.hasPassword && !isUnlocked) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center bg-dark-bg/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-dark-surface border border-dark-border rounded-3xl p-8 shadow-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-yellow-500/10 text-yellow-400 rounded-2xl flex items-center justify-center mx-auto">
            <Lock size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Password Required</h2>
            <p className="text-zinc-500 text-sm">" {room.name} " is a password-protected debug room.</p>
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {passwordError}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Enter room password..."
              value={roomPassword}
              onChange={e => setRoomPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerifyPassword()}
              className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-zinc-200"
            />
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary flex-1 py-3 text-sm"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleVerifyPassword}
                disabled={verifyingPassword}
                className="btn-primary flex-1 py-3 text-sm disabled:opacity-60"
              >
                {verifyingPassword ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Unlock'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-2">
      {/* Chat Panel */}
      <div
        ref={chatRef}
        style={{ width: `${chatWidth}px` }}
        className="flex flex-col bg-dark-surface rounded-2xl border border-dark-border overflow-hidden shrink-0"
      >
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

      {/* Resize Handle */}
      <div
        onMouseDown={startResizingChat}
        className="w-[6px] h-full cursor-col-resize hover:bg-emerald-500/30 active:bg-emerald-500/50 transition-colors shrink-0 flex items-center justify-center rounded-lg z-10"
      >
        <div className="w-[2px] h-8 bg-zinc-850 rounded" />
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
                {tab === 'code' ? 'Editor' : tab === 'terminal' ? 'Output' : 'Debugger'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as any)}
              className="bg-black/40 border border-dark-border rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="py">Python</option>
              <option value="java">Java</option>
              <option value="js">JavaScript</option>
              <option value="go">Go</option>
            </select>
            <button 
              onClick={runCode}
              disabled={runLoading}
              className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {runLoading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} className="fill-current" />}
              Run Code
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
                  onChange={(e) => handleCodeChange(e.target.value)}
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
                className="h-full bg-black/50 p-6 font-mono text-sm text-zinc-300 overflow-y-auto"
              >
                {runLoading ? (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Loader2 size={16} className="animate-spin text-emerald-400" />
                    <span>Compiling and executing code...</span>
                  </div>
                ) : !(import.meta.env.VITE_ONLINECOMPILER_API_KEY || localApiKey) ? (
                  <div className="p-5 bg-zinc-900/60 border border-dark-border rounded-2xl max-w-md mx-auto my-8 space-y-4">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Shield size={16} />
                      <span className="text-sm font-bold">OnlineCompiler.io API Key Required</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      To run your programs, you need an API key from OnlineCompiler.io. You can get a free key by signing up at <a href="https://api.onlinecompiler.io" target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300">api.onlinecompiler.io</a>.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Paste API Key here..."
                        value={localApiKey}
                        onChange={e => setLocalApiKey(e.target.value)}
                        className="flex-1 bg-black/40 border border-dark-border rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                      />
                      <button
                        onClick={() => saveCompilerKey(localApiKey)}
                        className="btn-primary py-1.5 px-3 text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : runOutput ? (
                  <pre className="whitespace-pre-wrap font-mono text-zinc-200">{runOutput}</pre>
                ) : (
                  <div className="text-zinc-500 text-sm">
                    <p>Click "Run Code" to compile and execute your program.</p>
                    <p className="text-xs text-zinc-600 mt-1">Execution is powered by the OnlineCompiler.io API.</p>
                  </div>
                )}
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
