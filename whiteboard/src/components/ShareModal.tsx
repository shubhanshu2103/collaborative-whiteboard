import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, Search, Link as LinkIcon, UserPlus, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface ShareModalProps {
    roomId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ShareModal({ roomId, isOpen, onClose }: ShareModalProps) {
    const { getToken } = useAuth();
    const [targetUserId, setTargetUserId] = useState('');
    const [role, setRole] = useState('VIEWER');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/boards/${roomId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ targetUserId, role })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to share');
            }

            setSuccessMsg('Board shared successfully! A friend request was sent if not already friends.');
            setTargetUserId('');
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Share Board</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Share Link Row */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Anyone with the link</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                                {window.location.href}
                            </div>
                            <button
                                onClick={copyLink}
                                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 border ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm'}`}
                            >
                                {copied ? <CheckCircle size={16} /> : <LinkIcon size={16} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 my-6 relative">
                        <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-xs font-bold text-slate-300 uppercase">OR INVITE</span>
                    </div>

                    {/* Invite User Form */}
                    <form onSubmit={handleShare} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">User ID to invite</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    required
                                    value={targetUserId}
                                    onChange={e => setTargetUserId(e.target.value)}
                                    placeholder="Enter Clerk User ID..."
                                    className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-slate-700 bg-slate-50 focus:bg-white transition-all"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 ml-1 leading-snug">Inviting a user gives them direct access and adds them as a friend.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Access Role</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 bg-slate-50 appearance-none font-medium text-sm"
                            >
                                <option value="VIEWER">Viewer (Read-only)</option>
                                <option value="EDITOR">Editor (Can edit canvas)</option>
                            </select>
                        </div>

                        {errorMsg && <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-medium">{errorMsg}</div>}
                        {successMsg && <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-medium">{successMsg}</div>}

                        <button
                            type="submit"
                            disabled={loading || !targetUserId}
                            className="w-full mt-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <UserPlus size={18} />
                            {loading ? 'Sending Invite...' : 'Send Invite'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
