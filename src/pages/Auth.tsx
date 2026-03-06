import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Github, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGitHub,
  signInWithGoogle,
  resetPassword,
} from '../lib/auth';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === 'reset') {
      const { sent, error: err } = await resetPassword(email);
      setLoading(false);
      if (err) { setError(err); return; }
      if (sent) { setInfo('Password reset email sent! Check your inbox.'); return; }
    }

    if (mode === 'login') {
      const { user, error: err } = await signInWithEmail(email, password);
      setLoading(false);
      if (err) { setError(err); return; }
      if (user) navigate('/dashboard');
    } else {
      if (!displayName.trim()) { setLoading(false); setError('Please enter your full name.'); return; }
      const { user, error: err } = await signUpWithEmail(email, password, displayName.trim());
      setLoading(false);
      if (err) { setError(err); return; }
      if (user) navigate('/dashboard');
    }
  };

  const handleGitHub = async () => {
    setError(null);
    setLoading(true);
    const { user, error: err } = await signInWithGitHub();
    setLoading(false);
    if (err) { setError(err); return; }
    if (user) navigate('/dashboard');
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const { user, error: err } = await signInWithGoogle();
    setLoading(false);
    if (err) { setError(err); return; }
    if (user) navigate('/dashboard');
  };

  const switchMode = (next: 'login' | 'signup' | 'reset') => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full -z-10" />

      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap size={24} className="text-black fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight">DebugFlow</span>
          </Link>
          <h1 className="text-3xl font-bold mb-3">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
          </h1>
          <p className="text-zinc-500">
            {mode === 'login'
              ? 'Enter your credentials to access your workspace.'
              : mode === 'signup'
                ? 'Join 10,000+ engineers debugging faster with AI.'
                : 'Enter your email to receive a reset link.'}
          </p>
        </div>

        <div className="p-8 rounded-[32px] bg-dark-surface border border-dark-border shadow-2xl">
          {/* OAuth Buttons — only on login/signup */}
          {mode !== 'reset' && (
            <>
              <div className="space-y-4 mb-8">
                <button
                  onClick={handleGitHub}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm disabled:opacity-50"
                >
                  <Github size={20} /> Continue with GitHub
                </button>
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm disabled:opacity-50"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  Continue with Google
                </button>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-border" /></div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                  <span className="bg-dark-surface px-4 text-zinc-600">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Error / Info Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
            {info && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm text-center"
              >
                {info}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name — signup only */}
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="displayName"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password — not on reset */}
            {mode !== 'reset' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-[10px] font-bold text-emerald-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : mode === 'login' ? (
                <>Sign In <ArrowRight size={20} /></>
              ) : mode === 'signup' ? (
                <>Create Account <ArrowRight size={20} /></>
              ) : (
                'Send Reset Email'
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-zinc-500 text-sm">
          {mode === 'reset' ? (
            <>
              Remembered it?{' '}
              <button onClick={() => switchMode('login')} className="ml-1 font-bold text-emerald-400 hover:underline">
                Back to Sign In
              </button>
            </>
          ) : mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => switchMode('signup')} className="ml-1 font-bold text-emerald-400 hover:underline">
                Sign up for free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => switchMode('login')} className="ml-1 font-bold text-emerald-400 hover:underline">
                Log in here
              </button>
            </>
          )}
        </p>

        <div className="mt-12 flex items-center justify-center gap-8 text-xs font-bold text-zinc-600 uppercase tracking-widest">
          <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
