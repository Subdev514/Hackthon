/// <reference types="vite/client" />
import React, { useState, useCallback } from 'react';
import {
    Shield, AlertTriangle, AlertCircle, Info, CheckCircle2,
    Loader2, ChevronDown, ChevronRight, Zap, Code2,
    Bot, RefreshCw, Copy, Check, Settings
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DebugIssue {
    severity: 'critical' | 'high' | 'warning' | 'info';
    type: string;
    message: string;
    line?: number;
    lineContent?: string;
    suggestion: string;
    ruleId?: string;
}

interface DebugResult {
    language: string;
    issues: DebugIssue[];
    stats: { critical: number; high: number; warning: number; info: number };
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
    aiExplanation?: string | null;
    analyzedAt: string;
    linesAnalyzed: number;
}

interface DebuggerProps {
    code: string;
    /** Backend URL, defaults to localhost:4000 */
    backendUrl?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
    critical: {
        icon: AlertCircle,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        badge: 'bg-red-500/20 text-red-300',
        label: 'Critical',
    },
    high: {
        icon: AlertTriangle,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        badge: 'bg-orange-500/20 text-orange-300',
        label: 'High',
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        badge: 'bg-yellow-500/20 text-yellow-300',
        label: 'Warning',
    },
    info: {
        icon: Info,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        badge: 'bg-blue-500/20 text-blue-300',
        label: 'Info',
    },
};

const GRADE_CONFIG = {
    A: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Excellent' },
    B: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Good' },
    C: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Fair' },
    D: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Poor' },
    F: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Critical' },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function IssueCard({ issue }: { issue: DebugIssue }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const cfg = SEVERITY_CONFIG[issue.severity];
    const Icon = cfg.icon;

    const copySuggestion = () => {
        navigator.clipboard.writeText(issue.suggestion);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}
        >
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-start gap-3 p-4 text-left"
            >
                <Icon size={16} className={`${cfg.color} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
                            {cfg.label}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{issue.type}</span>
                        {issue.line && (
                            <span className="text-[10px] text-zinc-600 font-mono">line {issue.line}</span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-zinc-200 leading-snug">{issue.message}</p>
                    {issue.lineContent && !expanded && (
                        <code className="text-[11px] text-zinc-500 font-mono mt-1 block truncate">
                            {issue.lineContent}
                        </code>
                    )}
                </div>
                {expanded ? <ChevronDown size={14} className="text-zinc-500 shrink-0" /> : <ChevronRight size={14} className="text-zinc-500 shrink-0" />}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-white/5"
                    >
                        {issue.lineContent && (
                            <div className="mt-3 mb-3">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Detected at</p>
                                <code className="text-xs text-red-300 font-mono bg-black/30 rounded px-3 py-2 block">
                                    {issue.lineContent}
                                </code>
                            </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Suggestion</p>
                                <p className="text-sm text-emerald-300 leading-relaxed whitespace-pre-wrap">{issue.suggestion}</p>
                            </div>
                            <button
                                onClick={copySuggestion}
                                className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                title="Copy suggestion"
                            >
                                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-zinc-400" />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function GradeCircle({ grade, score }: { grade: string; score: number }) {
    const cfg = GRADE_CONFIG[grade as keyof typeof GRADE_CONFIG] || GRADE_CONFIG['C'];
    return (
        <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 ${cfg.border} ${cfg.bg}`}>
            <span className={`text-4xl font-black ${cfg.color}`}>{grade}</span>
            <span className="text-xs text-zinc-500 font-semibold">{score}/100</span>
        </div>
    );
}

// ─── Main Debugger Component ──────────────────────────────────────────────────

export default function Debugger({ code, backendUrl = BACKEND }: DebuggerProps) {
    const [result, setResult] = useState<DebugResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useLocalAI, setUseLocalAI] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [showSettings, setShowSettings] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem('groq_api_key') || '');

    const analyze = useCallback(async () => {
        if (!code?.trim()) {
            setError('No code to analyze. Paste some code in the editor first.');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setActiveFilter('all');

        const envKey = import.meta.env.VITE_GROQ_API_KEY;
        const localKey = localStorage.getItem('groq_api_key');
        const apiKey = envKey || localKey || '';

        if (!apiKey.trim()) {
            setError('Groq API Key is missing. Click the settings gear to enter your API Key, or set VITE_GROQ_API_KEY in your .env file.');
            setLoading(false);
            setShowSettings(true);
            return;
        }

        const model = useLocalAI ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';

        try {
            const systemPrompt = `You are an expert code analyzer and debugger. Analyze the user's code for bugs, syntax errors, security vulnerabilities, performance bottlenecks, and style issues.
You MUST return a JSON object that strictly adheres to the following TypeScript interface structure:

interface DebugIssue {
    severity: 'critical' | 'high' | 'warning' | 'info';
    type: string; // e.g., "Syntax Error", "Security", "Performance", "Logic", "Style"
    message: string; // Short description of the issue
    line?: number; // 1-based line number if applicable
    lineContent?: string; // The exact line of code
    suggestion: string; // How to fix it
    ruleId?: string; // e.g., "no-unused-vars", "sql-injection", "redis-timeout"
}

interface DebugResult {
    language: string; // e.g., "JavaScript", "TypeScript", "Python"
    issues: DebugIssue[];
    stats: {
        critical: number;
        high: number;
        warning: number;
        info: number;
    };
    score: number; // 0 to 100 code health score
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string; // High-level summary of code quality
    aiExplanation?: string; // Markdown summary of the analysis and recommendations
}

Rules for scoring:
- Grade A: score >= 90
- Grade B: 80 <= score < 90
- Grade C: 70 <= score < 80
- Grade D: 60 <= score < 70
- Grade F: score < 60
Make sure the stats counts perfectly match the count of issues in the issues array. If there are no issues, stats should all be 0, score should be 100, and grade should be A.
Ensure to escape any code inside JSON strings properly. Do not include markdown formatting or backticks around the JSON.`;

            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Code to analyze:\n\n${code}` }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.1,
                    max_tokens: 4096
                }),
                signal: AbortSignal.timeout(60_000),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error?.message || `Groq API returned error ${res.status}`);
            }

            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('Groq API returned an empty response.');
            }

            const parsedResult = JSON.parse(content);
            parsedResult.linesAnalyzed = code.split('\n').length;
            parsedResult.analyzedAt = new Date().toISOString();

            setResult(parsedResult);
        } catch (err: any) {
            console.error('Error analyzing code:', err);
            if (err.name === 'TimeoutError') {
                setError('Analysis timed out. Try a shorter code snippet.');
            } else {
                setError(err.message || 'Analysis failed. Please verify your API Key and connection.');
            }
        } finally {
            setLoading(false);
        }
    }, [code, useLocalAI]);

    const filteredIssues = result?.issues.filter(i =>
        activeFilter === 'all' ? true : i.severity === activeFilter
    ) ?? [];

    const FILTERS = [
        { key: 'all', label: 'All', count: result?.issues.length ?? 0 },
        { key: 'critical', label: '🔴 Critical', count: result?.stats.critical ?? 0 },
        { key: 'high', label: '🟠 High', count: result?.stats.high ?? 0 },
        { key: 'warning', label: '🟡 Warning', count: result?.stats.warning ?? 0 },
        { key: 'info', label: '🔵 Info', count: result?.stats.info ?? 0 },
    ].filter(f => f.key === 'all' || f.count > 0);

    return (
        <div className="flex flex-col h-full bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <Shield size={15} className="text-emerald-400" />
                    </div>
                    <span className="font-bold text-sm">DebugFlow Analyzer</span>
                    <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full font-mono">v1.0 · Groq Engine</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-xl border transition-colors ${
                            showSettings
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-white/5 border-transparent text-zinc-400 hover:text-white'
                        }`}
                        title="Groq Settings"
                    >
                        <Settings size={14} />
                    </button>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useLocalAI}
                            onChange={e => setUseLocalAI(e.target.checked)}
                            className="w-3 h-3 accent-emerald-500"
                        />
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Bot size={11} /> Local AI
                        </span>
                    </label>
                    <button
                        onClick={analyze}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-xs font-bold text-black disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} className="fill-current" />}
                        {loading ? 'Analyzing…' : 'Run Debugger'}
                    </button>
                </div>
            </div>

            {/* Groq Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-zinc-950/60 border-b border-dark-border px-5 py-3 space-y-2 overflow-hidden"
                    >
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Groq API Key</label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    placeholder="gsk_..."
                                    value={apiKeyInput}
                                    onChange={e => {
                                        setApiKeyInput(e.target.value);
                                        localStorage.setItem('groq_api_key', e.target.value);
                                    }}
                                    className="flex-1 bg-black/40 border border-dark-border rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                                />
                                {apiKeyInput && (
                                    <button
                                        onClick={() => {
                                            setApiKeyInput('');
                                            localStorage.removeItem('groq_api_key');
                                        }}
                                        className="px-2.5 py-1.5 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-zinc-500">
                                Enter your Groq API Key. It is stored locally in your browser. Alternatively, set <code>VITE_GROQ_API_KEY</code> in your <code>.env</code> file.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* Idle state */}
                {!loading && !result && !error && (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <Code2 size={32} className="text-zinc-700 mb-4" />
                        <p className="text-zinc-500 text-sm font-medium">Click "Run Debugger" to analyze the code</p>
                        <p className="text-zinc-600 text-xs mt-1">Supports JavaScript, TypeScript, Python, Java, C++</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Results */}
                {result && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                        {/* Score row */}
                        <div className="flex items-center gap-5 p-4 rounded-2xl bg-dark-bg border border-dark-border">
                            <GradeCircle grade={result.grade} score={result.score} />
                            <div className="flex-1">
                                <p className="text-sm font-semibold mb-1">{result.summary}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                    <span>🔍 {result.linesAnalyzed} lines</span>
                                    <span>💬 {result.language}</span>
                                    <span>🕒 {new Date(result.analyzedAt).toLocaleTimeString()}</span>
                                </div>
                                {/* Stat pills */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {result.stats.critical > 0 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">
                                            {result.stats.critical} Critical
                                        </span>
                                    )}
                                    {result.stats.high > 0 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold">
                                            {result.stats.high} High
                                        </span>
                                    )}
                                    {result.stats.warning > 0 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold">
                                            {result.stats.warning} Warning
                                        </span>
                                    )}
                                    {result.stats.info > 0 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                            {result.stats.info} Info
                                        </span>
                                    )}
                                    {result.issues.length === 0 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                                            <CheckCircle2 size={11} /> Clean
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button onClick={analyze} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <RefreshCw size={14} className="text-zinc-400" />
                            </button>
                        </div>

                        {/* Local AI explanation */}
                        {result.aiExplanation && (
                            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Bot size={14} className="text-indigo-400" />
                                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Local AI Insight</span>
                                </div>
                                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{result.aiExplanation}</p>
                            </div>
                        )}

                        {/* Filter tabs */}
                        {result.issues.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {FILTERS.map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => setActiveFilter(f.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeFilter === f.key
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
                                            }`}
                                    >
                                        {f.label} {f.count > 0 && <span className="ml-1 opacity-70">({f.count})</span>}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Issue list */}
                        <div className="space-y-2">
                            {filteredIssues.map((issue, i) => (
                                <IssueCard key={`${issue.ruleId}-${issue.line}-${i}`} issue={issue} />
                            ))}
                            {filteredIssues.length === 0 && activeFilter !== 'all' && (
                                <p className="text-zinc-500 text-sm text-center py-6">No {activeFilter} issues found.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
