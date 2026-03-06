import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Zap,
  Loader2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../lib/auth';

const SidebarLink = ({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: any;
  label: string;
  active: boolean;
}) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const displayName = profile?.displayName ?? user?.displayName ?? 'User';
  const avatarUrl =
    profile?.avatarUrl ?? user?.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10B981&color=000&bold=true`;

  const handleSignOut = async () => {
    await logOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-dark-border flex flex-col p-4 bg-dark-surface/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 mb-8">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-black fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">DebugFlow</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/dashboard'} />
          <SidebarLink to="/dashboard" icon={MessageSquare} label="Rooms" active={location.pathname.startsWith('/room')} />
          <SidebarLink to="/analytics" icon={BarChart3} label="Analytics" active={location.pathname === '/analytics'} />
          <SidebarLink to="/settings" icon={Settings} label="Settings" active={location.pathname === '/settings'} />
        </nav>

        <div className="mt-auto pt-4 border-t border-dark-border">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-dark-border flex items-center justify-between px-8 bg-dark-surface/30 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Search rooms, bugs, or commands..."
                className="w-full bg-white/5 border border-dark-border rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2 text-zinc-400 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-dark-bg" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-dark-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-zinc-500 capitalize">{profile?.provider ?? 'member'}</p>
              </div>
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-10 h-10 rounded-full border-2 border-emerald-500/20 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
