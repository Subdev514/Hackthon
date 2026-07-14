import React, { useState, useRef } from 'react';
import {
  User,
  Shield,
  Bell,
  Globe,
  Palette,
  Zap,
  CreditCard,
  ChevronRight,
  Github,
  Slack,
  MessageSquare,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mergeUserProfile, uploadAvatar } from '../lib/user';

const SettingItem = ({
  icon: Icon,
  title,
  description,
  active,
}: {
  icon: any;
  title: string;
  description: string;
  active?: boolean;
}) => (
  <button
    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${active
        ? 'bg-emerald-500/10 border border-emerald-500/20'
        : 'hover:bg-white/5 border border-transparent'
      }`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>
        <Icon size={20} />
      </div>
      <div className="text-left">
        <p className={`font-bold ${active ? 'text-white' : 'text-zinc-300'}`}>{title}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-zinc-600" />
  </button>
);

export default function Settings() {
  const { user, profile } = useAuth();

  const realName = profile?.displayName ?? user?.displayName ?? '';
  const realEmail = profile?.email ?? user?.email ?? '';
  const provider = profile?.provider ?? 'email';
  const realAvatar =
    profile?.avatarUrl ??
    user?.photoURL ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(realName)}&background=10B981&color=000&bold=true`;

  const [nameInput, setNameInput] = useState(realName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(realAvatar);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await mergeUserProfile(user.uid, { displayName: nameInput.trim() });
    setSaving(false);
    if (error) { setSaveError(error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    const { avatarUrl: newUrl, error } = await uploadAvatar(user.uid, file);
    setAvatarUploading(false);
    if (error) { setSaveError(error); return; }
    if (newUrl) setAvatarUrl(newUrl);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-zinc-500">Manage your account and workspace preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-4 mb-4">General</h3>
          <SettingItem icon={User} title="Profile" description="Manage your personal info" active />
          <SettingItem icon={Shield} title="Security" description="Password and 2FA" />
          <SettingItem icon={Bell} title="Notifications" description="Email and push alerts" />
          <SettingItem icon={Globe} title="Workspace" description="Team and permissions" />

          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-4 mt-8 mb-4">Appearance</h3>
          <SettingItem icon={Palette} title="Theme" description="Dark, light, or system" />
          <SettingItem icon={Zap} title="Shortcuts" description="Keyboard commands" />

          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-4 mt-8 mb-4">Billing</h3>
          <SettingItem icon={CreditCard} title="Subscription" description="Manage your plan" />
        </div>

        <div className="md:col-span-2 space-y-8">
          {/* Profile Section */}
          <div className="p-8 rounded-3xl bg-dark-surface border border-dark-border space-y-8">
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                {avatarUploading ? (
                  <div className="w-24 h-24 rounded-3xl border-2 border-emerald-500/20 bg-dark-border flex items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-emerald-400" />
                  </div>
                ) : (
                  <img
                    src={avatarUrl}
                    className="w-24 h-24 rounded-3xl border-2 border-emerald-500/20 group-hover:opacity-50 transition-opacity object-cover"
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-3xl">
                  <span className="text-xs font-bold">Change</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-1">{realName || 'Your Name'}</h4>
                <p className="text-zinc-500 text-sm capitalize">{provider} account</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    Pro Plan
                  </span>
                  <span className="px-2 py-1 rounded-md bg-white/5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    Member
                  </span>
                </div>
              </div>
            </div>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full bg-white/5 border border-dark-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  defaultValue={realEmail}
                  disabled
                  className="w-full bg-white/5 border border-dark-border rounded-xl py-3 px-4 opacity-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <button onClick={handleSave} disabled={saving} className="btn-primary py-2 px-6 text-sm disabled:opacity-60">
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : saved ? (
                  <><Check size={16} /> Saved!</>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>

          {/* Integrations */}
          <div className="p-8 rounded-3xl bg-dark-surface border border-dark-border">
            <h4 className="text-lg font-bold mb-6">Connected Integrations</h4>
            <div className="space-y-4">
              {/* GitHub — connected if provider is github */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                    <Github size={20} />
                  </div>
                  <div>
                    <p className="font-bold">GitHub</p>
                    <p className={`text-xs ${provider === 'github' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {provider === 'github' ? `Connected as ${realName}` : 'Not connected'}
                    </p>
                  </div>
                </div>
                <button className={`text-xs font-bold hover:underline ${provider === 'github' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {provider === 'github' ? 'Disconnect' : 'Connect'}
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#4A154B] flex items-center justify-center"><Slack size={20} /></div>
                  <div>
                    <p className="font-bold">Slack</p>
                    <p className="text-xs text-zinc-500">Not connected</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-emerald-400 hover:underline">Connect</button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0077B5] flex items-center justify-center"><MessageSquare size={20} /></div>
                  <div>
                    <p className="font-bold">Discord</p>
                    <p className="text-xs text-zinc-500">Not connected</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-emerald-400 hover:underline">Connect</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
