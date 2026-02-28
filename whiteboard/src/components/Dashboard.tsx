import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useUser, UserButton } from '@clerk/clerk-react';
import { motion, type Variants } from 'framer-motion';
import { Plus, Users, ArrowRight, Sparkles } from 'lucide-react';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [joinSessionId, setJoinSessionId] = useState('');

    // Clerk instantly provides the logged-in user's data
    const { user } = useUser();
    const userName = user?.firstName || 'User';

    const createSession = () => {
        const sessionId = uuid();
        navigate(`/session/${sessionId}`);
    };

    const joinSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinSessionId.trim()) {
            navigate(`/session/${joinSessionId.trim()}`);
        }
    };

    // Animation variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden font-sans text-slate-900 bg-slate-50">
            {/* --- Background Elements (-z-10) --- */}
            <div
                className="absolute inset-0 -z-10 opacity-40 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 0)',
                    backgroundSize: '32px 32px'
                }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-gradient-to-tr from-primary-400/30 via-purple-500/30 to-blue-500/30 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            {/* --- Navbar Section --- */}
            <div className="w-full max-w-5xl mx-auto mt-6 px-4 z-10 flex-shrink-0">
                <motion.nav
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="px-6 py-3 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-full flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/30">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-800">Sangam</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-500 hidden sm:inline-block bg-slate-100 px-3 py-1.5 rounded-full">
                            Welcome, <span className="text-slate-800 font-semibold">{userName}</span>
                        </span>
                        <div className="w-10 h-10 rounded-full bg-slate-100 p-0.5 border border-slate-200">
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{ elements: { avatarBox: "w-full h-full" } }}
                            />
                        </div>
                    </div>
                </motion.nav>
            </div>

            {/* --- Main Content Area --- */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto z-10 px-6"
            >
                {/* Hero Text */}
                <div className="flex flex-col items-center text-center mb-12 mt-auto pt-20">
                    <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 text-slate-900">
                        Where teams <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">create together.</span>
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-xl sm:text-2xl text-slate-500 max-w-2xl font-medium">
                        Launch a new infinite canvas or jump back into a recent project.
                    </motion.p>
                </div>

                {/* Action Buttons */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-8 w-full justify-center items-center">

                    {/* Glow Gradient Create Button */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={createSession}
                        className="group relative w-full md:w-auto p-[2px] rounded-2xl bg-gradient-to-r from-primary-400 via-purple-500 to-pink-500 shadow-2xl shadow-primary-500/25"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center gap-4 bg-white/95 backdrop-blur-xl px-8 py-5 rounded-[14px] h-full w-full border border-white/50">
                            <div className="w-12 h-12 flex-shrink-0 rounded-full bg-primary-50 flex items-center justify-center">
                                <Plus className="text-primary-600 w-6 h-6 group-hover:scale-125 transition-transform duration-300" />
                            </div>
                            <div className="text-left pr-4">
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-primary-600 transition-colors">Start Whiteboard</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">New Session</p>
                            </div>
                        </div>
                    </motion.button>

                    {/* Separators */}
                    <div className="hidden md:block w-px h-16 bg-slate-200/60 font-bold backdrop-blur"></div>
                    <div className="md:hidden w-16 h-px bg-slate-200/60 font-bold backdrop-blur"></div>

                    {/* Join Session Command Bar */}
                    <form onSubmit={joinSession} className="w-full md:w-auto relative group">
                        <div className="relative flex items-center bg-white/70 backdrop-blur-2xl rounded-2xl shadow-xl shadow-slate-200/40 border-2 border-slate-200/60 p-2 focus-within:ring-4 focus-within:ring-primary-500/20 focus-within:border-primary-500 focus-within:bg-white transition-all overflow-hidden">
                            {/* Inner Shadow simulate inset */}
                            <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)] pointer-events-none"></div>
                            <div className="pl-5 pr-3 text-slate-400 z-10">
                                <Users className="w-6 h-6 group-focus-within:text-primary-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter Session ID..."
                                value={joinSessionId}
                                onChange={(e) => setJoinSessionId(e.target.value)}
                                className="flex-1 w-full md:w-64 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 text-lg font-medium px-2 py-4 z-10"
                            />
                            <motion.button
                                type="submit"
                                disabled={!joinSessionId.trim()}
                                whileHover={joinSessionId.trim() ? { scale: 1.05 } : {}}
                                whileTap={joinSessionId.trim() ? { scale: 0.95 } : {}}
                                className={`ml-2 px-6 py-4 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all z-10 ${joinSessionId.trim()
                                    ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md cursor-pointer'
                                    : 'bg-slate-100/50 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                Join <ArrowRight className="w-5 h-5 -mr-1" />
                            </motion.button>
                        </div>
                    </form>

                </motion.div>

                {/* Footer Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="mt-auto pb-8 text-sm text-gray-400 text-center"
                >
                    <p className="font-medium">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mr-1 opacity-80">✨</span>
                        Pro tip: Share your Session ID instantly with your team.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
