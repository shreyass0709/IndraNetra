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
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col selection:bg-teal-600 selection:text-white relative overflow-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#07070a]/90 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/10 transition-all duration-300">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              IndraNetra
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#features" className="hover:text-teal-500 transition-all duration-250">
              Features
            </a>
            <a href="#architecture" className="hover:text-teal-500 transition-all duration-250">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900/60 transition-all"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="px-5 py-2.5 rounded-xl bg-teal-600 text-sm font-semibold text-white hover:bg-teal-500 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 z-10 flex-1 flex flex-col justify-center">
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-white"
          >
            Real-time crowd intelligence and safety monitoring
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl leading-relaxed mb-10"
          >
            IndraNetra helps organizers, emergency responders, and administrators monitor crowd density, predict potential risks, and optimize safety routes in real time.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-teal-500 transition-all"
            >
              Launch Platform <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-zinc-800 bg-zinc-950/40 text-zinc-300 font-bold flex items-center justify-center gap-2 hover:bg-zinc-900/60 hover:text-white hover:border-zinc-700 transition-all"
            >
              Access Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 border-t border-zinc-800 bg-zinc-950/40 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Core Features
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-base">
              Powerful tools designed to assist you in managing security, reporting incidents, and planning safety protocols.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Feature 1 */}
            <motion.div 
              variants={itemVariants}
              className="p-6 rounded-xl border border-zinc-850 bg-zinc-900/10 flex flex-col items-start"
            >
              <div className="p-3 rounded-lg bg-teal-600/10 text-teal-500 mb-5">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Camera Analysis</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Connect live feeds to count people, detect overcrowding, and track density levels in real-time.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              variants={itemVariants}
              className="p-6 rounded-xl border border-zinc-850 bg-zinc-900/10 flex flex-col items-start"
            >
              <div className="p-3 rounded-lg bg-indigo-600/10 text-indigo-500 mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Risk Predictions</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Evaluate risk curves and density factors to identify potential crowd hazards before they escalate.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              variants={itemVariants}
              className="p-6 rounded-xl border border-zinc-850 bg-zinc-900/10 flex flex-col items-start"
            >
              <div className="p-3 rounded-lg bg-purple-600/10 text-purple-500 mb-5">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Escape Routing</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Calculate optimal evacuation and navigation paths away from high-density or high-hazard zones.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              variants={itemVariants}
              className="p-6 rounded-xl border border-zinc-850 bg-zinc-900/10 flex flex-col items-start"
            >
              <div className="p-3 rounded-lg bg-red-600/10 text-red-500 mb-5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Instant SOS Dispatch</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Quickly report security/medical emergencies and coordinate with volunteers on the ground.
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

