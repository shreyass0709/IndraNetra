'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Eye, EyeOff, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Google Sign-In states
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
        <div className="w-full flex justify-center z-10 relative">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                setGoogleLoading(true);
                setError('');
                try {
                  const res = await api.googleLogin({
                    idToken: credentialResponse.credential,
                    role: 'PUBLIC_USER'
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
              }
            }}
            onError={() => {
              setError('Google Sign-In authentication failed');
            }}
          />
        </div>


        <div className="mt-8 text-center text-xs text-slate-500 relative z-10">
          Need registration?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-500 font-semibold transition-colors">
            Create account
          </Link>
        </div>
      </motion.div>

      {/* Simulated Google Sign-In Chooser Modal */}
      <AnimatePresence>

      </AnimatePresence>

    </div>
  );
}
