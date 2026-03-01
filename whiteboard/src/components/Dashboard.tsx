import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useUser, UserButton, useAuth } from '@clerk/clerk-react';
import { motion, type Variants } from 'framer-motion';
import { Plus, Users, ArrowRight, Sparkles, LayoutGrid, Globe, Lock, Play, Loader2, FolderClosed } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { user } = useUser();
    const userName = user?.firstName || 'User';

    const [joinSessionId, setJoinSessionId] = useState('');
    const [activeTab, setActiveTab] = useState<'boards' | 'network'>('boards');

    // States for Boards
    const [myBoards, setMyBoards] = useState<any[]>([]);
    const [loadingBoards, setLoadingBoards] = useState(false);

    // States for Network
    const [friends, setFriends] = useState<any[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
    const [friendBoards, setFriendBoards] = useState<any[]>([]);
    const [loadingFriendBoards, setLoadingFriendBoards] = useState(false);

    const createSession = () => {
        const sessionId = uuid();
        navigate(`/session/${sessionId}`);
    };

    const joinSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinSessionId.trim()) navigate(`/session/${joinSessionId.trim()}`);
    };

    useEffect(() => {
        if (activeTab === 'boards') {
            fetchMyBoards();
        } else {
            fetchFriends();
        }
    }, [activeTab]);

    const fetchMyBoards = async () => {
        setLoadingBoards(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/boards/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setMyBoards(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingBoards(false);
        }
    };

    const fetchFriends = async () => {
        setLoadingFriends(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/friends/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setFriends(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFriends(false);
        }
    };

    const fetchFriendBoards = async (friendId: string) => {
        setLoadingFriendBoards(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/boards/friend/${friendId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setFriendBoards(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFriendBoards(false);
        }
    };

    const BoardCard = ({ board }: { board: any }) => (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group h-48">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl group-hover:scale-105 transition-transform">
                        <FolderClosed size={20} strokeWidth={2.5} />
                    </div>
                    {board.isPublic ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            <Globe size={12} /> Public
                        </span>
                    ) : (
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            <Lock size={12} /> Private
                        </span>
                    )}
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight line-clamp-1">{board.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 font-medium">Updated {new Date(board.updatedAt).toLocaleDateString()}</p>
            </div>

            <button
                onClick={() => navigate(`/session/${board.id}`)}
                className="mt-5 w-full py-2.5 bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 border border-slate-200 hover:border-primary-200 rounded-xl font-bold flex text-sm items-center justify-center gap-2 transition-all shadow-sm"
            >
                <Play size={16} /> Open Board
            </button>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col relative font-sans text-slate-900 bg-slate-50 pb-20 overflow-x-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 0)', backgroundSize: '32px 32px' }} />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-gradient-to-tr from-primary-400/20 via-purple-500/20 to-blue-500/20 rounded-full blur-[100px] z-0 pointer-events-none"></div>

            {/* Navbar */}
            <div className="w-full max-w-6xl mx-auto mt-6 px-4 z-10 flex-shrink-0">
                <nav className="px-6 py-3 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/30">
                            <Sparkles size={20} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-800">Sangam</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-500 hidden sm:inline-block bg-slate-100 px-3 py-1.5 rounded-full">
                            Welcome, <span className="text-slate-800 font-semibold">{userName}</span>
                        </span>
                        <div className="w-10 h-10 rounded-full bg-slate-100 p-0.5 border border-slate-200">
                            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-full h-full" } }} />
                        </div>
                    </div>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-6xl mx-auto z-10 px-4 mt-8">

                {/* Hero / Quick Actions */}
                <div className="bg-white/60 backdrop-blur-xl border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Welcome to your workspace</h1>
                        <p className="text-slate-500 font-medium">Create a new canvas or join an existing session instantly.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={createSession}
                            className="w-full md:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md shadow-primary-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
                        >
                            <Plus size={20} /> New Whiteboard
                        </button>

                        <div className="hidden sm:block w-px h-10 bg-slate-200"></div>

                        <form onSubmit={joinSession} className="flex relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Paste Session ID..."
                                value={joinSessionId}
                                onChange={e => setJoinSessionId(e.target.value)}
                                className="w-full sm:w-64 pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!joinSessionId.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors"
                            >
                                <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 mb-8">
                    <button
                        onClick={() => setActiveTab('boards')}
                        className={`px-5 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'boards' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <LayoutGrid size={18} /> My Boards
                    </button>
                    <button
                        onClick={() => setActiveTab('network')}
                        className={`px-5 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'network' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <Users size={18} /> My Network
                    </button>
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">

                    {/* MY BOARDS TAB */}
                    {activeTab === 'boards' && (
                        <div>
                            {loadingBoards ? (
                                <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
                            ) : myBoards.length === 0 ? (
                                <div className="text-center py-20 bg-white/50 border border-slate-200 border-dashed rounded-3xl">
                                    <FolderClosed size={48} className="mx-auto text-slate-300 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-700">No boards yet</h3>
                                    <p className="text-slate-500 mt-1">Create a new whiteboard to get started.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {myBoards.map(b => <BoardCard key={b.id} board={b} />)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MY NETWORK TAB */}
                    {activeTab === 'network' && (
                        <div className="flex flex-col lg:flex-row gap-8">

                            {/* Friends Sidebar */}
                            <div className="w-full lg:w-80 flex-shrink-0">
                                <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 shadow-sm">
                                    <div className="flex justify-between items-center mb-5">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Users size={18} className="text-primary-500" /> Friends List
                                        </h3>
                                        <button onClick={() => navigate('/friends')} className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors">Manage</button>
                                    </div>

                                    {loadingFriends ? (
                                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
                                    ) : friends.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-5 italic">No friends found.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {friends.map(f => {
                                                const friendId = f.id;
                                                const isSelected = selectedFriend?.friendId === friendId;

                                                return (
                                                    <button
                                                        key={f.friendshipId}
                                                        onClick={() => {
                                                            setSelectedFriend({ friendId, name: f.name || f.email });
                                                            fetchFriendBoards(friendId);
                                                        }}
                                                        className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-colors ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 hover:bg-slate-100 border border-transparent'}`}
                                                    >
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-400 to-primary-400 text-white flex items-center justify-center font-bold shadow-sm">
                                                            {(f.name || f.email)?.[0]?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{f.name || f.email}</p>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Friend's Boards */}
                            <div className="flex-1 min-w-0">
                                {!selectedFriend ? (
                                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-white/40 border border-slate-200 border-dashed rounded-3xl p-10 text-center">
                                        <Globe size={48} className="text-slate-300 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-600">Select a friend</h3>
                                        <p className="text-slate-500 max-w-sm mt-2">Click on a friend from your list to view the boards they have made public.</p>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in duration-300">
                                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            {selectedFriend.name}'s Public Boards
                                        </h2>

                                        {loadingFriendBoards ? (
                                            <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
                                        ) : friendBoards.length === 0 ? (
                                            <div className="text-center py-16 bg-white/50 border border-slate-200 rounded-3xl">
                                                <Lock size={40} className="mx-auto text-slate-300 mb-4" />
                                                <p className="text-slate-500 font-medium">This user hasn't made any boards public.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {friendBoards.map(b => <BoardCard key={b.id} board={b} />)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
