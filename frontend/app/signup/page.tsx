'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Eye, EyeOff, Shield, AlertCircle, Loader2, Info, Compass, Radio, Activity, MailCheck } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('PUBLIC_USER');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if already logged in by getting user details
    api.getMe()
      .then((res) => {
        if (res) {
          router.push('/dashboard');
        }
      })
      .catch(() => {
        // No active session, stay on signup page
      });
  }, [router]);

  const getRoleDescription = (roleKey: string) => {
    switch (roleKey) {
      case 'ORGANIZER': return 'Allows creation of crowd monitoring events, setting capacity thresholds, and managing alarms.';
      case 'VOLUNTEER': return 'Enables responding to live SOS requests, updating availability, and navigating tactical zones.';
      default: return 'Allows reporting safety anomalies and initiating immediate SOS emergency location broadcasts.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.register({ name, email, password, role });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col lg:grid lg:grid-cols-12 overflow-hidden font-sans relative">
      
      {/* LEFT PANEL: Holographic "Eye of Indra" visual */}
      <div className="lg:col-span-7 bg-slate-900/40 relative overflow-hidden flex flex-col justify-center items-center p-8 border-b lg:border-b-0 lg:border-r border-slate-800/80 min-h-[350px] lg:min-h-screen">
        
        {/* Background grids & orbs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse delay-1000" />
        
        {/* Animated Concentric Circles radar */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center pointer-events-none z-10">
          <motion.div 
            className="absolute inset-0 rounded-full border border-blue-500/25 origin-center"
            style={{
              background: 'conic-gradient(from 0deg, rgba(59,130,246,0.15) 0deg, transparent 90deg, transparent 360deg)'
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          />
          <div className="absolute inset-0 rounded-full border border-dashed border-blue-500/20 animate-[spin_180s_linear_infinite]" />
          <div className="absolute w-[75%] h-[75%] rounded-full border border-blue-500/10 animate-[spin_90s_linear_infinite_reverse]" />
          <div className="absolute w-[50%] h-[50%] rounded-full border border-dashed border-indigo-500/30 animate-[ping_4s_ease-in-out_infinite]" />
          
          <motion.div 
            className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40 border border-blue-400/50"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <Compass className="w-6 h-6 text-blue-200 animate-spin" style={{ animationDuration: '25s' }} />
          </motion.div>

          <div className="absolute top-[10%] left-[20%] p-2 rounded-lg border border-slate-700 bg-slate-900/80 text-[9px] font-mono text-blue-400 backdrop-blur-sm shadow-md flex items-center gap-1.5">
            <Radio className="w-3 h-3 animate-pulse text-red-500" /> SYS.ACTIVE: 99.8%
          </div>
          <div className="absolute bottom-[20%] right-[10%] p-2 rounded-lg border border-slate-700 bg-slate-900/80 text-[9px] font-mono text-indigo-400 backdrop-blur-sm shadow-md flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-indigo-500" /> YOLOv8.NET: LIVE
          </div>
        </div>

        <div className="mt-8 text-center relative z-10 max-w-md px-4">
          <h1 className="text-3xl font-black tracking-tight text-white mb-3">Eye of Indra</h1>
          <p className="text-sm text-slate-400 font-semibold tracking-wide leading-relaxed uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            AI-Powered Crowd Intelligence & <br/>Emergency Response Platform
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Signup Form Card / Success Screen */}
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

        {/* Form Container */}
        <div className="w-full max-w-sm p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl shadow-2xl relative">
          
          {success ? (
            /* Success confirmation screen */
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
                <MailCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Verify Your Email</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                We've sent a verification link to <strong className="text-blue-400">{email}</strong>. 
                Please check your inbox and verify your email to initialize your account.
              </p>
              <div className="pt-4 border-t border-slate-800/80 mt-4">
                <Link 
                  href="/login" 
                  className="inline-block w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg active:scale-[0.98] transition-all"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Create Account</h2>
                <p className="text-xs text-slate-400">Join the safety monitoring network</p>
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input 
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                    placeholder="name@example.com"
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

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Operational Role</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all appearance-none cursor-pointer font-sans"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="PUBLIC_USER">Public User (Report Incidents, SOS)</option>
                      <option value="VOLUNTEER">Registered Volunteer (Respond to SOS)</option>
                      <option value="ORGANIZER">Event Organizer (Manage Events)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Role Description */}
                <div className="p-3 rounded-xl border border-blue-900/30 bg-blue-950/15 text-[11px] text-slate-400 flex gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>{getRoleDescription(role)}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer uppercase tracking-wider"
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

              <div className="mt-6 text-center text-xs text-slate-500">
                Already registered?{' '}
                <Link href="/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
