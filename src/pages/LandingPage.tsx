import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, Users, Code, ArrowRight, Github, Twitter, Play } from 'lucide-react';
import { motion } from 'motion/react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group">
    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-zinc-400 leading-relaxed">{description}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-bg selection:bg-emerald-500/30">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between bg-dark-bg/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-black fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">DebugFlow</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#enterprise" className="hover:text-white transition-colors">Enterprise</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-sm font-medium hover:text-white transition-colors">Log in</Link>
          <Link to="/auth" className="btn-primary py-2 px-5 text-sm">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full -z-10"></div>
        
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-8 border border-emerald-500/20">
              <Zap size={14} className="fill-current" />
              Now with Gemini 3.1 Pro
            </span>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
              Debug faster with <br />
              <span className="gradient-text">AI-powered</span> collaboration.
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              DebugFlow brings your team together with a shared code editor, real-time chat, and an AI assistant that understands your codebase.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/dashboard" className="btn-primary text-lg px-8">
                Get Started Free <ArrowRight size={20} />
              </Link>
              <button className="btn-secondary text-lg px-8">
                <Play size={20} className="fill-current" /> Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-24 relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-[32px] blur opacity-20"></div>
            <div className="relative rounded-[32px] border border-white/10 bg-dark-surface p-4 shadow-2xl overflow-hidden aspect-video">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                <div className="ml-4 px-3 py-1 rounded-md bg-white/5 text-[10px] text-zinc-500 font-mono">auth-service.ts</div>
              </div>
              <div className="grid grid-cols-12 gap-4 h-full">
                <div className="col-span-3 border-r border-white/5 pr-4">
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-4 bg-white/5 rounded w-full"></div>
                    ))}
                  </div>
                </div>
                <div className="col-span-9 font-mono text-sm text-zinc-400 space-y-2">
                  <p className="text-emerald-400">import {'{'} auth {'}'} from "@debugflow/core";</p>
                  <p>const validateSession = async (token: string) ={'>'} {'{'}</p>
                  <p className="pl-4">try {'{'}</p>
                  <p className="pl-8 text-indigo-400">// AI Suggestion: Check Redis cache first</p>
                  <p className="pl-8">const cached = await redis.get(token);</p>
                  <p className="pl-8">if (cached) return JSON.parse(cached);</p>
                  <p className="pl-4">{'}'} catch (e) {'{'}</p>
                  <p className="pl-8 text-red-400">console.error("Auth failed", e);</p>
                  <p className="pl-4">{'}'}</p>
                  <p>{'}'};</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="px-8 max-w-7xl mx-auto">
          <p className="text-center text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-12">Trusted by engineering teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
            <div className="text-2xl font-bold">Vercel</div>
            <div className="text-2xl font-bold">Stripe</div>
            <div className="text-2xl font-bold">Supabase</div>
            <div className="text-2xl font-bold">Linear</div>
            <div className="text-2xl font-bold">Raycast</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for modern engineering</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">Stop jumping between Slack, Zoom, and VS Code. Everything you need to debug is right here.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Users}
              title="Real-Time Collaboration"
              description="Work together in shared rooms with live cursors, synchronized scrolling, and built-in voice chat."
            />
            <FeatureCard 
              icon={Code}
              title="Shared Code Editor"
              description="A powerful web-based editor with syntax highlighting, IntelliSense, and multi-user editing support."
            />
            <FeatureCard 
              icon={Shield}
              title="AI Debug Assistant"
              description="Our AI understands your context and suggests fixes, explains complex code, and writes tests automatically."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Zap size={20} className="text-black fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight">DebugFlow</span>
            </div>
            <p className="text-zinc-400 max-w-sm mb-8">
              The world's first AI-native debugging platform. Built by engineers, for engineers.
            </p>
            <div className="flex gap-4">
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Github size={20} /></button>
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Twitter size={20} /></button>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>© 2024 DebugFlow Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
