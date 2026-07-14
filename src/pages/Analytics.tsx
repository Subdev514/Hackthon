import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  Bug as BugIcon,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  Loader2,
} from 'lucide-react';
import { getAnalyticsData } from '../lib/api';

const StatCard = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: any;
  color: string;
}) => (
  <div className="p-6 rounded-3xl bg-dark-surface border border-dark-border relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 blur-[50px] -mr-16 -mt-16 transition-all group-hover:bg-${color}-500/10`} />
    <div className="relative flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-400`}>
        <Icon size={24} />
      </div>
      <div
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
      >
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </div>
    </div>
    <div className="relative">
      <h3 className="text-3xl font-bold mb-1">{value}</h3>
      <p className="text-zinc-500 text-sm font-medium">{title}</p>
    </div>
  </div>
);

// Fallback data if backend is empty
const defaultBugData = [
  { name: 'Mon', critical: 4, high: 7, medium: 12 },
  { name: 'Tue', critical: 3, high: 5, medium: 15 },
  { name: 'Wed', critical: 6, high: 8, medium: 10 },
  { name: 'Thu', critical: 2, high: 4, medium: 18 },
  { name: 'Fri', critical: 5, high: 9, medium: 14 },
  { name: 'Sat', critical: 1, high: 3, medium: 8 },
  { name: 'Sun', critical: 2, high: 5, medium: 11 },
];

const defaultAiData = [
  { name: 'Week 1', accuracy: 85, queries: 120 },
  { name: 'Week 2', accuracy: 88, queries: 145 },
  { name: 'Week 3', accuracy: 87, queries: 190 },
  { name: 'Week 4', accuracy: 92, queries: 250 },
];

const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#8B5CF6'];

export default function Analytics() {
  const [data, setData] = useState<{ metrics: any; recentActivity: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-emerald-500">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics || { totalQueries: 0, activeRooms: 0, bugsFixed: 0 };
  const recentTimeline = data?.recentActivity || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Analytics Overview</h1>
          <p className="text-zinc-500">Track your team's debugging performance and AI usage.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">
            <Calendar size={16} className="text-zinc-400" />
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">
            <Filter size={16} className="text-zinc-400" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bugs Fixed"
          value={metrics.bugsFixed.toString()}
          change="12.5%"
          isPositive={true}
          icon={BugIcon}
          color="emerald"
        />
        <StatCard
          title="Avg. Resolution Time"
          value="4h 12m"
          change="18.2%"
          isPositive={true}
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Active Debug Rooms"
          value={metrics.activeRooms.toString()}
          change="5.4%"
          isPositive={false}
          icon={Users}
          color="orange"
        />
        <StatCard
          title="AI Queries"
          value={metrics.totalQueries.toString()}
          change="24.8%"
          isPositive={true}
          icon={Zap}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bug Fix Activity */}
          <div className="p-8 rounded-3xl bg-dark-surface border border-dark-border">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold mb-1">Bug Resolution Trend</h3>
                <p className="text-sm text-zinc-500">Tickets resolved over the last 7 days</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-zinc-400">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-sm font-medium text-zinc-400">High</span>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={defaultBugData}>
                  <defs>
                    <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525B" tick={{ fill: '#52525B' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#52525B" tick={{ fill: '#52525B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderRadius: '16px', border: '1px solid #27272A' }}
                    itemStyle={{ color: '#E4E4E7' }}
                  />
                  <Area type="monotone" dataKey="critical" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCritical)" />
                  <Area type="monotone" dataKey="high" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorHigh)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Usage Activity */}
          <div className="p-8 rounded-3xl bg-dark-surface border border-dark-border">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold mb-1">AI Debug Performance</h3>
                <p className="text-sm text-zinc-500">Query volume vs Accuracy</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={defaultAiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525B" tick={{ fill: '#52525B' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#52525B" tick={{ fill: '#52525B' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#52525B" tick={{ fill: '#52525B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderRadius: '16px', border: '1px solid #27272A' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="queries" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                  <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-8">
          {/* AI Confidence Distribution */}
          <div className="p-8 rounded-3xl bg-dark-surface border border-dark-border">
            <h3 className="text-xl font-bold mb-6">AI Confidence</h3>
            <div className="h-[200px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'High', value: 400, percentage: 62 },
                      { name: 'Medium', value: 300, percentage: 28 },
                      { name: 'Low', value: 100, percentage: 10 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderRadius: '16px', border: '1px solid #27272A' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {[
                { label: 'High Confidence (>90%)', value: '62%', color: 'bg-emerald-500' },
                { label: 'Medium Confidence (70-90%)', value: '28%', color: 'bg-indigo-500' },
                { label: 'Low Confidence (<70%)', value: '10%', color: 'bg-orange-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm text-zinc-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent AI Queries (from SQLite) */}
          <div className="p-8 rounded-3xl bg-dark-surface border border-dark-border">
            <h3 className="text-xl font-bold mb-6">Recent AI Usage</h3>
            <div className="space-y-6">
              {recentTimeline.length === 0 ? (
                <p className="text-sm text-zinc-500">No recent AI queries.</p>
              ) : (
                recentTimeline.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Zap size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1">AI Debug Query</p>
                      <p className="text-xs text-zinc-500 mb-1">Room: {item.room_id}</p>
                      <p className="text-[10px] text-zinc-600">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="w-full mt-6 py-3 rounded-xl border border-dark-border text-sm font-medium hover:bg-white/5 transition-colors">
              View All Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
