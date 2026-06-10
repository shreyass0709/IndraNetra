'use client';

import React from 'react';
import Link from 'next/link';
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
  CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              IndraNetra
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#demo" className="hover:text-white transition-colors">Live Demo</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/5 text-blue-400 text-xs font-semibold tracking-wide mb-8 hover:bg-blue-500/10 transition-colors cursor-pointer">
            <Zap className="w-3.5 h-3.5" /> AI-Powered Real-Time Stampede Prevention
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Crowd Intelligence
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Redefined.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl leading-relaxed mb-12">
            IndraNetra uses advanced computer vision, predictive risk scoring, and real-time pathfinding to prevent overcrowding disasters and keep public gatherings safe.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all group"
            >
              Launch Platform <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#demo" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 font-semibold flex items-center justify-center gap-2 hover:bg-zinc-900/80 hover:text-white hover:border-zinc-700 transition-all"
            >
              Watch Simulation
            </a>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="mt-20 relative rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 shadow-2xl shadow-black/80 max-w-5xl mx-auto overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
            <div className="h-6 flex items-center gap-1.5 px-3 border-b border-zinc-900 pb-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-zinc-600 ml-2 font-mono">indranetra-live-dashboard.app</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left p-2">
              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/25">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Total People Count</span>
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-3xl font-extrabold text-white">1,482</div>
                <div className="text-[10px] text-zinc-500 mt-2">Active density across 4 sectors</div>
              </div>
              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/25">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Live Risk Prediction</span>
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-500">LOW (12.4%)</div>
                <div className="text-[10px] text-zinc-500 mt-2">Predicted by Random Forest Classifier</div>
              </div>
              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/25">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Active SOS Signals</span>
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                </div>
                <div className="text-3xl font-extrabold text-red-500">0</div>
                <div className="text-[10px] text-zinc-500 mt-2">All volunteers dispatched / standing by</div>
              </div>
            </div>
            <div className="h-48 rounded-xl bg-zinc-900/10 border border-zinc-900 flex items-center justify-center p-8 mt-2">
              <div className="w-full h-full flex flex-col justify-end gap-1">
                <div className="flex justify-between text-xs text-zinc-500 mb-2 font-mono">
                  <span>Crowd Density Over Time</span>
                  <span>19:00 - 19:20 (Live)</span>
                </div>
                <div className="flex items-end gap-1.5 h-32">
                  <div className="w-full bg-blue-600/30 h-[25%] rounded-sm hover:bg-blue-600 transition-colors" />
                  <div className="w-full bg-blue-600/30 h-[35%] rounded-sm hover:bg-blue-600 transition-colors" />
                  <div className="w-full bg-blue-600/30 h-[30%] rounded-sm hover:bg-blue-600 transition-colors" />
                  <div className="w-full bg-blue-600/30 h-[45%] rounded-sm hover:bg-blue-600 transition-colors" />
                  <div className="w-full bg-blue-600/40 h-[60%] rounded-sm hover:bg-blue-600 transition-colors" />
                  <div className="w-full bg-blue-600/40 h-[55%] rounded-sm hover:bg-blue-600 transition-colors" />
                  <div className="w-full bg-blue-600/50 h-[75%] rounded-sm hover:bg-blue-600 transition-colors" />
                  <div className="w-full bg-indigo-600/60 h-[85%] rounded-sm hover:bg-indigo-600 transition-colors" />
                  <div className="w-full bg-emerald-600 h-[40%] rounded-sm hover:bg-emerald-600 transition-colors" />
                  <div className="w-full bg-emerald-600 h-[20%] rounded-sm hover:bg-emerald-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 border-t border-zinc-900 bg-zinc-950 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Advanced Prevention Features
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Equipped with intelligent tools designed to mitigate risks before overcrowding turns into a stampede.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl border border-zinc-900 bg-[#0c0c0e] hover:border-zinc-800 transition-all flex flex-col items-start group">
              <div className="p-3 rounded-xl bg-blue-600/10 text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Video Analysis</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Connect crowd cameras directly. Our AI detects individuals and estimates crowd counts in real-time.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="p-8 rounded-2xl border border-zinc-900 bg-[#0c0c0e] hover:border-zinc-800 transition-all flex flex-col items-start group">
              <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">ML Risk Forecasts</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Scikit-Learn algorithms predict local risk indexes using utilization rates, density distributions, and historical trends.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl border border-zinc-900 bg-[#0c0c0e] hover:border-zinc-800 transition-all flex flex-col items-start group">
              <div className="p-3 rounded-xl bg-purple-600/10 text-purple-500 mb-6 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Dynamic Route Finder</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                A* pathfinding algorithm calculates the safest and least congested evacuation path during anomalies.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl border border-zinc-900 bg-[#0c0c0e] hover:border-zinc-800 transition-all flex flex-col items-start group">
              <div className="p-3 rounded-xl bg-red-600/10 text-red-500 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant SOS Dispatch</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                One-tap SOS immediately broadcasts geolocation details to administrators and nearby registered volunteers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950/80 py-8 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 IndraNetra. Created as a modern safety framework.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
