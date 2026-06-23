'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Eye, EyeOff, Shield, AlertCircle, Loader2, Compass, Radio, Activity } from 'lucide-react';

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
        role: 'PUBLIC_USER' // Default to Public User, profile completion allows role setting
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col lg:grid lg:grid-cols-12 overflow-hidden font-sans relative">
      
      {/* LEFT PANEL: Holographic "Eye of Indra" visual */}
      <div className="lg:col-span-7 bg-slate-900/40 relative overflow-hidden flex flex-col justify-center items-center p-8 border-b lg:border-b-0 lg:border-r border-slate-800/80 min-h-[350px] lg:min-h-screen">
        
        {/* Futuristic Background Grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse delay-1000" />
        
        {/* Animated Concentric Circles ("Eye of Indra" radar) */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center pointer-events-none z-10">
          
          {/* Radar Sweep Line */}
          <motion.div 
            className="absolute inset-0 rounded-full border border-blue-500/25 origin-center"
            style={{
              background: 'conic-gradient(from 0deg, rgba(59,130,246,0.15) 0deg, transparent 90deg, transparent 360deg)'
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          />

          {/* Outer circle */}
          <div className="absolute inset-0 rounded-full border border-dashed border-blue-500/20 animate-[spin_180s_linear_infinite]" />
          
          {/* Middle circle */}
          <div className="absolute w-[75%] h-[75%] rounded-full border border-blue-500/10 animate-[spin_90s_linear_infinite_reverse]" />
          
          {/* Inner circle with tick marks */}
          <div className="absolute w-[50%] h-[50%] rounded-full border border-dashed border-indigo-500/30 animate-[ping_4s_ease-in-out_infinite]" />
          
          {/* Center core: Eye pupil */}
          <motion.div 
            className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40 border border-blue-400/50"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <Compass className="w-6 h-6 text-blue-200 animate-spin" style={{ animationDuration: '25s' }} />
          </motion.div>

          {/* Floating Data Nodes */}
          <div className="absolute top-[10%] left-[20%] p-2 rounded-lg border border-slate-700 bg-slate-900/80 text-[9px] font-mono text-blue-400 backdrop-blur-sm shadow-md flex items-center gap-1.5">
            <Radio className="w-3 h-3 animate-pulse text-red-500" /> SYS.ACTIVE: 99.8%
          </div>
          <div className="absolute bottom-[20%] right-[10%] p-2 rounded-lg border border-slate-700 bg-slate-900/80 text-[9px] font-mono text-indigo-400 backdrop-blur-sm shadow-md flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-indigo-500" /> YOLOv8.NET: LIVE
          </div>
        </div>

        {/* Text descriptions */}
        <div className="mt-8 text-center relative z-10 max-w-md px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black tracking-tight text-white mb-3"
          >
            Eye of Indra
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-slate-400 font-semibold tracking-wide leading-relaxed uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400"
          >
            AI-Powered Crowd Intelligence & <br/>Emergency Response Platform
          </motion.p>
        </div>
      </div>

      {/* RIGHT PANEL: Login Form Card */}
      <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-950 relative z-20 min-h-[500px]">
        
        {/* Brand Link */}
        <div className="mb-8 w-full max-w-sm">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              IndraNetra
            </span>
          </Link>
        </div>

        {/* Login Form Container */}
        <div className="w-full max-w-sm p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl shadow-2xl relative">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Access Terminal</h2>
            <p className="text-xs text-slate-400">Sign in to initialize secure operator session</p>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-5 p-3.5 rounded-xl border border-red-900/40 bg-red-950/20 text-red-400 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
              <input 
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                placeholder="operator@indranetra.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-[11px] text-slate-400 hover:text-blue-400 transition-colors font-semibold">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verification Active...
                </>
              ) : (
                'Initialize Session'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-slate-950 px-3 text-slate-500">Or Continue With</span>
            </div>
          </div>

          {/* Google Login button */}
          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs font-semibold text-slate-200 active:scale-[0.98] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer"
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
            <span>Sign In with Google</span>
          </button>

          {/* Create Account link */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Terminals unassigned?{' '}
            <Link href="/signup" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
              Create account
            </Link>
          </div>
        </div>
      </div>

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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl z-10 flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Choose Google Account</span>
                <button 
                  onClick={() => setShowGoogleModal(false)}
                  className="text-slate-500 hover:text-white transition-colors text-xs font-bold"
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
                    className="w-full p-3 rounded-xl border border-slate-800 hover:border-blue-500 bg-slate-950 flex items-center gap-3 transition-all text-left cursor-pointer"
                  >
                    <img 
                      src={account.avatar} 
                      alt={account.name} 
                      className="w-8 h-8 rounded-full object-cover border border-slate-800"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{account.name}</div>
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
