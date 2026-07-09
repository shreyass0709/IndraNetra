'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Eye, EyeOff, Shield, AlertCircle, Loader2, Info, MailCheck } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('PUBLIC');
  
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
    <div className="min-h-screen bg-white text-[#0f172a] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      
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

      {/* Signup Card */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white/80 border border-gray-200 relative z-10 shadow-xl backdrop-blur-md text-slate-900"
      >
        {success ? (
          /* Success confirmation screen */
          <div className="text-center py-4 space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <MailCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Verify Your Email</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              We've sent a verification link to <strong className="text-blue-600">{email}</strong>. 
              Please check your inbox and verify your email to active your account clearance.
            </p>
            <div className="pt-6 border-t border-gray-200 mt-6">
              <Link 
                href="/login" 
                className="inline-block w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <>
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Create Account</h2>
              <p className="text-sm text-slate-500">Join the safety monitoring network</p>
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/85 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/85 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all"
                  placeholder="name@example.com"
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

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white/85 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operational Role</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/85 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all appearance-none cursor-pointer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="PUBLIC">Public User (Report Incidents, SOS)</option>
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

              {/* Dynamic Role Description Box */}
              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 text-xs text-slate-600 flex gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>{getRoleDescription(role)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer"
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

            <div className="mt-8 text-center text-xs text-slate-500 relative z-10">
              Already registered?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-semibold transition-colors">
                Sign In
              </Link>
            </div>
          </>
        )}
      </motion.div>

    </div>
  );
}
