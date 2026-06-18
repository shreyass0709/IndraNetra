'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Map, 
  Users, 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  Compass, 
  ArrowRight,
  Eye,
  CheckCircle,
  Cpu,
  Tv,
  BellRing
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
} as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Cyber Scanline overlay */}
      <div className="cyber-scanline" />

      {/* Floating Ambient Glow Elements */}
      <motion.div 
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.15, 0.9, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 30, -40, 0],
          scale: [1, 0.9, 1.1, 1]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none z-0" 
      />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-all duration-300 relative overflow-hidden">
              <Eye className="w-6 h-6 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent group-hover:text-glow-blue transition-all">
              IndraNetra
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#features" className="hover:text-blue-400 hover:text-glow-blue transition-all duration-200 relative group py-1">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 group-hover:w-full transition-all duration-300 shadow-glow-blue" />
            </a>
            <a href="#architecture" className="hover:text-blue-400 hover:text-glow-blue transition-all duration-200 relative group py-1">
              Architecture
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 group-hover:w-full transition-all duration-300 shadow-glow-blue" />
            </a>
            <a href="#demo" className="hover:text-blue-400 hover:text-glow-blue transition-all duration-200 relative group py-1">
              Live Demo
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 group-hover:w-full transition-all duration-300 shadow-glow-blue" />
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800 transition-all"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-[0.97] transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-28 px-6 z-10 flex-1 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto text-center relative">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 80, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-bold tracking-wider mb-8 hover:bg-blue-500/10 hover:shadow-glow-blue transition-all cursor-pointer uppercase"
          >
            <Zap className="w-3.5 h-3.5 animate-pulse text-blue-400" /> AI-Powered Real-Time Stampede Prevention
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-none"
          >
            <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent">
              CROWD INTELLIGENCE
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(59,130,246,0.35)]">
              REDEFINED.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-3xl mx-auto text-zinc-400 text-lg md:text-2xl leading-relaxed mb-12"
          >
            IndraNetra bridges advanced computer vision, predictive risk scoring, and real-time pathfinding to prevent crowd anomalies before they turn into emergencies.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.04] active:scale-[0.96] transition-all group"
            >
              Launch Platform <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#demo" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-zinc-800 bg-zinc-950/40 text-zinc-300 font-bold flex items-center justify-center gap-2 hover:bg-zinc-900/60 hover:text-white hover:border-zinc-700 hover:shadow-glow-blue transition-all"
            >
              Watch Simulation
            </a>
          </motion.div>

          {/* Hero Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 40, damping: 12, delay: 0.5 }}
            className="mt-20 relative rounded-2xl border border-blue-500/15 bg-zinc-950/90 p-5 shadow-2xl shadow-black/95 max-w-5xl mx-auto overflow-hidden group hover:border-blue-500/25 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-20 pointer-events-none" />
            
            <div className="h-8 flex items-center justify-between border-b border-zinc-900 pb-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 shadow-glow-red" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-glow-orange" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 shadow-glow-emerald" />
                <span className="text-xs text-zinc-500 ml-2 font-mono tracking-widest uppercase">indranetra-hud-console.live</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                <span className="text-[10px] text-blue-400 font-mono uppercase font-bold">STREAM LIVE</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left p-1 z-10 relative">
              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/15 hover:bg-zinc-900/25 transition-colors relative overflow-hidden group/card">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover/card:bg-blue-500/10 transition-all" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Total People Count</span>
                  <Users className="w-5 h-5 text-blue-500 group-hover/card:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-extrabold text-white text-glow-blue">2,419</div>
                <div className="text-[10px] text-zinc-500 mt-2 font-mono">// Live camera crowd index feed</div>
              </div>

              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/15 hover:bg-zinc-900/25 transition-colors relative overflow-hidden group/card">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover/card:bg-emerald-500/10 transition-all" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Live Risk Prediction</span>
                  <Activity className="w-5 h-5 text-emerald-500 group-hover/card:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-500 text-glow-emerald">LOW (8.2%)</div>
                <div className="text-[10px] text-zinc-500 mt-2 font-mono">// Predicted by Random Forest Model</div>
              </div>

              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/15 hover:bg-zinc-900/25 transition-colors relative overflow-hidden group/card">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover/card:bg-red-500/10 transition-all" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Active SOS Signals</span>
                  <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
                </div>
                <div className="text-3xl font-extrabold text-red-500 text-glow-red">0</div>
                <div className="text-[10px] text-zinc-500 mt-2 font-mono">// No anomaly alerts broadcasted</div>
              </div>
            </div>

            <div className="h-52 rounded-xl bg-zinc-950 border border-zinc-900/80 flex flex-col justify-end p-5 mt-4 relative overflow-hidden">
              <div className="scan-line" />
              <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                <Cpu className="w-3.5 h-3.5 text-blue-500 animate-spin" /> Live Density Trend Monitor
              </div>
              <div className="flex items-end gap-2 h-36 relative z-10">
                {[35, 45, 40, 55, 68, 72, 85, 92, 50, 30, 42, 60, 75, 80, 68, 95].map((val, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ height: 0 }}
                    animate={{ height: `${val}%` }}
                    transition={{
                      duration: 1.5,
                      delay: idx * 0.05,
                      repeat: Infinity,
                      repeatType: "reverse",
                      repeatDelay: 2
                    }}
                    className={`w-full rounded-t-sm transition-colors duration-300 ${val > 80 ? 'bg-gradient-to-t from-red-600 to-red-400' : 'bg-gradient-to-t from-blue-600 to-indigo-400'}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 px-6 border-t border-zinc-900 bg-zinc-950/80 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              Tactical Prevention Features
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Equipped with deep learning AI models designed to flag anomalies before overcrowding triggers panic.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {/* Feature 1 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, borderColor: 'rgba(59, 130, 246, 0.4)' }}
              className="p-8 rounded-2xl border border-zinc-900 bg-[#07070a]/90 hover:shadow-glow-blue transition-all flex flex-col items-start group relative overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-blue-600/10 text-blue-500 mb-6 group-hover:scale-110 group-hover:bg-blue-600/20 transition-all">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Camera Analysis</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Connect crowd feeds. The YOLOv8 model counts targets, detects congestion, and segments density parameters instantly.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, borderColor: 'rgba(99, 102, 241, 0.4)' }}
              className="p-8 rounded-2xl border border-zinc-900 bg-[#07070a]/90 hover:shadow-glow-blue transition-all flex flex-col items-start group relative overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-indigo-600/10 text-indigo-500 mb-6 group-hover:scale-110 group-hover:bg-indigo-600/20 transition-all">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Risk Predictions</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Random Forest predictive algorithms analyze utilization curves and density indicators to forecast stampede risk.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, borderColor: 'rgba(168, 85, 247, 0.4)' }}
              className="p-8 rounded-2xl border border-zinc-900 bg-[#07070a]/90 hover:shadow-glow-blue transition-all flex flex-col items-start group relative overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-purple-600/10 text-purple-500 mb-6 group-hover:scale-110 group-hover:bg-purple-600/20 transition-all">
                <Compass className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">A* Escape Routes</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Computes optimal pathways dynamically away from emergency sectors and barriers using smart obstacle heuristics.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, borderColor: 'rgba(239, 68, 68, 0.4)' }}
              className="p-8 rounded-2xl border border-zinc-900 bg-[#07070a]/90 hover:shadow-glow-red transition-all flex flex-col items-start group relative overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-red-600/10 text-red-500 mb-6 group-hover:scale-110 group-hover:bg-red-600/20 transition-all">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Instant SOS Dispatch</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Instantly transmit coordinates to local dispatch controllers and volunteers. Facilitates rapid crowd redirection.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 py-8 px-6 text-center text-xs text-zinc-500 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 IndraNetra. Created as a safety framework.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

