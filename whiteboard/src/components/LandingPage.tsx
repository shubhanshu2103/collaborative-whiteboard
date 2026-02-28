import React from 'react';
import { motion } from 'framer-motion';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { CheckCircle2 } from 'lucide-react';

const LandingPage: React.FC = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
            },
        },
    };

    const features = [
        {
            title: "Real-time Sync",
            description: "See changes instantly as your team draws. Zero lag, pure collaboration.",
            icon: "⚡",
        },
        {
            title: "Secure Login",
            description: "Enterprise-grade security powered by Clerk. Your data is safe with us.",
            icon: "🔒",
        },
        {
            title: "Easy Sharing",
            description: "Create a session, share the ID, and start collaborating in seconds.",
            icon: "🚀",
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <motion.nav
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="px-6 py-6 md:px-12 border-b border-slate-200"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="text-2xl md:text-3xl font-bold text-slate-900">
                        Sangam
                    </div>
                    <div className="flex items-center gap-3">
                        <SignUpButton mode="modal">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-6 py-2.5 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:border-slate-400 hover:bg-slate-50 transition-colors duration-200"
                            >
                                Sign Up
                            </motion.button>
                        </SignUpButton>
                        <SignInButton mode="modal">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-6 py-2.5 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors duration-200 shadow-sm"
                            >
                                Login
                            </motion.button>
                        </SignInButton>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-6 md:px-12 py-20 md:py-32"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Left Column: Hero Text */}
                        <motion.div variants={itemVariants} className="space-y-8">
                            <motion.h1
                                variants={itemVariants}
                                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-slate-900"
                            >
                                Collaborate & Create
                                <br />
                                <span className="text-primary-600">in Real-Time</span>
                            </motion.h1>

                            <motion.p
                                variants={itemVariants}
                                className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-2xl"
                            >
                                Unleash your team's creativity with our secure, real-time whiteboard.
                                Brainstorm, design, and plan together, no matter where you are.
                            </motion.p>

                            <motion.div variants={itemVariants}>
                                <SignInButton mode="modal">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-8 py-4 rounded-lg bg-primary-500 text-white font-semibold text-lg hover:bg-primary-600 transition-colors duration-200 shadow-sm"
                                    >
                                        Start Whiteboarding →
                                    </motion.button>
                                </SignInButton>
                            </motion.div>
                        </motion.div>

                        {/* Right Column: Demo Card */}
                        <motion.div
                            variants={itemVariants}
                            className="relative"
                        >
                            {/* Decorative background blob */}
                            <div className="absolute -inset-1 bg-gradient-to-tr from-primary-400 to-primary-600 rounded-3xl blur-xl opacity-20 animate-pulse"></div>

                            <motion.div
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.3 }}
                                className="relative bg-white/80 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl p-6 md:p-8"
                            >
                                {/* Miniature Whiteboard */}
                                <div
                                    className="relative h-64 bg-slate-50 border border-slate-200 rounded-xl mb-8 overflow-hidden shadow-inner"
                                    style={{
                                        backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 0)',
                                        backgroundSize: '24px 24px'
                                    }}
                                >
                                    {/* Drawing Path Animation */}
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 256" preserveAspectRatio="none">
                                        <motion.path
                                            d="M 50 150 Q 150 50 250 150 T 350 100"
                                            fill="transparent"
                                            stroke="url(#gradient)"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#ec4899" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    {/* Cursor 1: Alex */}
                                    <motion.div
                                        animate={{ x: [40, 220, 100, 40], y: [40, 120, 180, 40] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute top-0 left-0 flex flex-col items-start pointer-events-none drop-shadow-lg z-10"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-pink-500 w-7 h-7">
                                            <path d="M5.65376 3.12657C5.2343 2.7233 4.5 3.02061 4.5 3.6046L4.5 21.0664C4.5 21.6917 5.28639 21.9687 5.68412 21.4851L10.5986 15.5117C10.7419 15.3375 10.9576 15.2356 11.1842 15.2356H19.982C20.5898 15.2356 20.8653 14.469 20.403 14.0728L5.65376 3.12657Z" fill="currentColor" />
                                        </svg>
                                        <div className="bg-pink-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full ml-5 -mt-1 shadow-md whitespace-nowrap tracking-wide">
                                            Alex
                                        </div>
                                    </motion.div>

                                    {/* Cursor 2: Sarah */}
                                    <motion.div
                                        animate={{ x: [260, 150, 280, 260], y: [160, 80, 60, 160] }}
                                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                        className="absolute top-0 left-0 flex flex-col items-start pointer-events-none drop-shadow-lg z-10"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500 w-7 h-7">
                                            <path d="M5.65376 3.12657C5.2343 2.7233 4.5 3.02061 4.5 3.6046L4.5 21.0664C4.5 21.6917 5.28639 21.9687 5.68412 21.4851L10.5986 15.5117C10.7419 15.3375 10.9576 15.2356 11.1842 15.2356H19.982C20.5898 15.2356 20.8653 14.469 20.403 14.0728L5.65376 3.12657Z" fill="currentColor" />
                                        </svg>
                                        <div className="bg-blue-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full ml-5 -mt-1 shadow-md whitespace-nowrap tracking-wide">
                                            Sarah
                                        </div>
                                    </motion.div>

                                    {/* Cursor 3: Mike */}
                                    <motion.div
                                        animate={{ x: [100, 300, 150, 100], y: [200, 220, 100, 200] }}
                                        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                        className="absolute top-0 left-0 flex flex-col items-start pointer-events-none drop-shadow-lg z-10"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-500 w-7 h-7">
                                            <path d="M5.65376 3.12657C5.2343 2.7233 4.5 3.02061 4.5 3.6046L4.5 21.0664C4.5 21.6917 5.28639 21.9687 5.68412 21.4851L10.5986 15.5117C10.7419 15.3375 10.9576 15.2356 11.1842 15.2356H19.982C20.5898 15.2356 20.8653 14.469 20.403 14.0728L5.65376 3.12657Z" fill="currentColor" />
                                        </svg>
                                        <div className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full ml-5 -mt-1 shadow-md whitespace-nowrap tracking-wide">
                                            Mike
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Bullet Points */}
                                <div className="space-y-4">
                                    {[
                                        { text: "Zero-latency sync" },
                                        { text: "Infinite canvas" },
                                        { text: "Secure sharing" }
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-center gap-4"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + i * 0.1 }}
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm">
                                                <CheckCircle2 size={18} className="text-primary-600" />
                                            </div>
                                            <span className="font-semibold text-slate-700 md:text-lg">{item.text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Features Section */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="px-6 md:px-12 py-20 md:py-32 bg-slate-50"
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        variants={itemVariants}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                            Powerful Features
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Everything you need for seamless collaboration
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white border border-slate-200 rounded-xl p-8 hover:border-primary-300 transition-colors duration-200 shadow-sm"
                            >
                                <div className="w-14 h-14 rounded-lg bg-primary-100 flex items-center justify-center text-2xl mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Footer */}
            <motion.footer
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="px-6 md:px-12 py-8 border-t border-slate-200"
            >
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-slate-500 text-sm">
                        Copyright © Collaborative WhiteBoard 2026
                    </p>
                </div>
            </motion.footer>
        </div>
    );
};

export default LandingPage;