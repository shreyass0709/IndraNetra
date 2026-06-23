'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Eye, EyeOff, Shield, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Google Sign-In Simulation States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in by getting user details
    api.getMe()
      .then((res) => {
        if (res) {
          router.push('/dashboard');
        }
      })
      .catch(() => {
        // No active session, stay on login page
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      if (!res.user.profileComplete) {
        router.push('/profile-setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelect = async (mockUser: { email: string; name: string; avatar: string }) => {
    setGoogleLoading(true);
    setShowGoogleModal(false);
    setError('');

    try {
      const res = await api.googleLogin({
        email: mockUser.email,
        name: mockUser.name,
        avatar: mockUser.avatar,
        role: 'PUBLIC_USER' // Default to Public User
      });

      if (!res.user.profileComplete) {
        router.push('/profile-setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      
      {/* Animated Particles & HUD Simulation Overlays (matching homepage) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-blue-500/5 animate-[spin_120s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-dashed border-blue-500/10 animate-[spin_60s_linear_infinite_reverse]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-blue-500/5 animate-[ping_4s_ease-in-out_infinite]" />

        <svg className="absolute w-full h-full opacity-10">
          <motion.path 
            d="M -100 200 C 300 100, 400 500, 1600 300" 
            fill="transparent" 
            stroke="#0b5cff" 
            strokeWidth="2"
            strokeDasharray="10, 15"
            animate={{ strokeDashoffset: [-50, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          />
          <motion.path 
            d="M -50 500 C 600 300, 800 100, 1700 400" 
            fill="transparent" 
            stroke="#0b5cff" 
            strokeWidth="3"
            strokeDasharray="15, 20"
            animate={{ strokeDashoffset: [0, 50] }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          />
        </svg>
      </div>

      {/* Top Brand Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80 }}
        className="relative z-10"
      >
        <Link href="/" className="flex items-center gap-3 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 transition-all">
            IndraNetra
          </span>
        </Link>
      </motion.div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white/80 border border-gray-200 relative z-10 shadow-xl backdrop-blur-md text-slate-900"
      >
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Access Terminal</h2>
          <p className="text-sm text-slate-500">Sign in to initialize secure operator session</p>
        </div>

        {error && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs flex items-center gap-2.5 font-sans"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/85 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all"
              placeholder="operator@indranetra.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white/85 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-blue-600 transition-colors font-semibold">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-semibold">
            <span className="bg-white px-3 text-slate-400">Or</span>
          </div>
        </div>

        {/* Google Login button */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          disabled={loading || googleLoading}
          className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-slate-700 shadow-sm active:scale-[0.98] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer z-10 relative"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        <div className="mt-8 text-center text-xs text-slate-500 relative z-10">
          Need registration?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-500 font-semibold transition-colors">
            Create account
          </Link>
        </div>
      </motion.div>

      {/* Simulated Google Sign-In Chooser Modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoogleModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm p-6 rounded-2xl border border-gray-200 bg-white shadow-2xl z-10 flex flex-col text-slate-900"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <span className="text-sm font-bold text-slate-700">Choose Google Account</span>
                <button 
                  onClick={() => setShowGoogleModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'John Doe', email: 'john.doe@gmail.com', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80' },
                  { name: 'Jane Smith', email: 'jane.smith@gmail.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80' }
                ].map((account, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleGoogleSelect(account)}
                    className="w-full p-3 rounded-xl border border-gray-200 hover:border-blue-500 bg-gray-50 flex items-center gap-3 transition-all text-left cursor-pointer"
                  >
                    <img 
                      src={account.avatar} 
                      alt={account.name} 
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{account.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{account.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
