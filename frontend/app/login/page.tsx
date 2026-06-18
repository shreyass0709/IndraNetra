'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Eye, Shield, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token exists, redirect to dashboard
    const token = localStorage.getItem('indranetra_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Cyber Scanline overlay */}
      <div className="cyber-scanline" />

      {/* Floating Lights */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.3, 0.5, 0.2, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" 
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
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-zinc-400 font-mono">// Access Safety HUD Control Console</p>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500 font-mono relative z-10">
          Need registration?{' '}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-bold">
            Create account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

