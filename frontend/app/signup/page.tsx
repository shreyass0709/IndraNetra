'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Eye, AlertCircle, Loader2, Info } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PUBLIC_USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('indranetra_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const getRoleDescription = (roleKey: string) => {
    switch (roleKey) {
      case 'VOLUNTEER': return 'Enables responding to live SOS requests, updating availability, and navigating tactical zones.';
      case 'ORGANIZER': return 'Allows creation of crowd monitoring events, setting capacity thresholds, and managing alarms.';
      case 'POLICE': return 'Accesses live overcrowding alarms, incident feeds, and tactical map solving.';
      case 'ADMIN': return 'Full authorization console access to view baseline metrics, YOLO analytics, and logs.';
      default: return 'Allows reporting safety anomalies and initiating immediate SOS emergency location broadcasts.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.register({ name, email, password, role });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Cyber Scanline overlay */}
      <div className="cyber-scanline" />

      {/* Floating Lights */}
      <motion.div 
        animate={{
          scale: [1, 0.9, 1.2, 1],
          opacity: [0.2, 0.4, 0.25, 0.2]
        }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" 
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80 }}
      >
        <Link href="/" className="flex items-center gap-3 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent group-hover:text-glow-blue transition-all">
            IndraNetra
          </span>
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
        className="w-full max-w-md p-8 rounded-2xl glass-card relative z-10 border border-blue-500/15"
      >
        <div className="scan-line" />
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Create Account</h2>
          <p className="text-xs text-zinc-400 font-mono">// Register in Crowd Safety HUD Console</p>
        </div>

        {error && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-red-400 text-xs flex items-center gap-2.5 font-mono shadow-glow-red"
          >
            <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">Full Name</label>
            <input 
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-850 bg-zinc-900/20 text-sm text-white focus:outline-none focus:border-blue-500 focus:shadow-glow-blue transition-all"
              placeholder="Officer / Volunteer / Organizer Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">Email Address</label>
            <input 
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-850 bg-zinc-900/20 text-sm text-white focus:outline-none focus:border-blue-500 focus:shadow-glow-blue transition-all"
              placeholder="name@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">Password</label>
            <input 
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-850 bg-zinc-900/20 text-sm text-white focus:outline-none focus:border-blue-500 focus:shadow-glow-blue transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">Operational Role</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-zinc-850 bg-zinc-900 text-sm text-white focus:outline-none focus:border-blue-500 focus:shadow-glow-blue transition-all appearance-none cursor-pointer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="PUBLIC_USER">Public User (Report Incidents, SOS)</option>
              <option value="VOLUNTEER">Registered Volunteer (Respond to SOS)</option>
              <option value="ORGANIZER">Event Organizer (Manage Events & Capacity)</option>
              <option value="POLICE">Police / Authority (Live Crowd Alerts)</option>
              <option value="ADMIN">System Administrator (Full Dashboard Access)</option>
            </select>
          </div>

          {/* Dynamic Role Description Box */}
          <div className="p-3.5 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-zinc-400 font-mono flex gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>{getRoleDescription(role)}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Registering...
              </>
            ) : (
              'Register Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500 font-mono relative z-10">
          Already registered?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

