import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ArrowLeft, Check, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function Friends() {
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFriendsData = async () => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            const [friendsRes, requestsRes] = await Promise.all([
                fetch(`${API_URL}/api/friends/list`, { headers }),
                fetch(`${API_URL}/api/friends/requests`, { headers })
            ]);

            if (friendsRes.ok) setFriends(await friendsRes.json());
            if (requestsRes.ok) setRequests(await requestsRes.json());
        } catch (err) {
            console.error('Error fetching friends:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriendsData();
    }, []);

    const handleAccept = async (id: string) => {
        try {
            const token = await getToken();
            await fetch(`${API_URL}/api/friends/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ friendshipId: id })
            });
            fetchFriendsData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleReject = async (id: string) => {
        try {
            const token = await getToken();
            await fetch(`${API_URL}/api/friends/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ friendshipId: id })
            });
            fetchFriendsData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-y-auto">
            {/* Background Map */}
            <div className="absolute inset-0 pointer-events-none opacity-40 -z-10" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 0)', backgroundSize: '32px 32px' }} />

            <div className="max-w-4xl mx-auto px-6 py-12">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-8 font-medium bg-white/50 px-4 py-2 rounded-full border border-slate-200"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <Users size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Friends & Network</h1>
                        <p className="text-slate-500 font-medium">Manage your collaborative connections.</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column: Pending Requests & Add Friend (Placeholder for full Add Logic) */}
                    <div className="space-y-6">
                        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                Pending Requests
                                {requests.length > 0 && (
                                    <span className="bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
                                )}
                            </h2>
                            {loading ? (
                                <p className="text-slate-400">Loading...</p>
                            ) : requests.length === 0 ? (
                                <p className="text-slate-400 italic">No pending requests.</p>
                            ) : (
                                <div className="space-y-3">
                                    {requests.map(req => (
                                        <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-slate-800">{req.requester.name || req.requester.email}</p>
                                                <p className="text-xs text-slate-500">Wants to connect</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAccept(req.id)} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors" title="Accept">
                                                    <Check size={16} strokeWidth={3} />
                                                </button>
                                                <button onClick={() => handleReject(req.id)} className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-200 transition-colors" title="Reject">
                                                    <X size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Friends List */}
                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            My Friends
                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{friends.length}</span>
                        </h2>
                        {loading ? (
                            <p className="text-slate-400">Loading...</p>
                        ) : friends.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                <Users size={32} className="mx-auto mb-3 opacity-50" />
                                <p>You haven't added any friends yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {friends.map(friend => (
                                    <div key={friend.friendshipId} className="flex items-center gap-3 p-3 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-primary-400 text-white flex items-center justify-center font-bold">
                                            {(friend.name || friend.email)[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 leading-tight">{friend.name || friend.email}</p>
                                            {friend.name && <p className="text-xs text-slate-500">{friend.email}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
