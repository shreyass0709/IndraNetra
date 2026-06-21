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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80 }}
      >
        <Link href="/" className="flex items-center gap-3 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/10 group-hover:scale-105 transition-transform">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-foreground transition-all">
            IndraNetra
          </span>
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
        className="w-full max-w-md p-8 rounded-2xl bg-card border border-border relative z-10 shadow-xl"
      >
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Create Account</h2>
          <p className="text-sm text-muted-foreground">Join the safety monitoring network</p>
        </div>

        {error && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-400 text-xs flex items-center gap-2.5 font-sans"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Full Name</label>
            <input 
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Operational Role</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
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
          <div className="p-3.5 rounded-xl border border-border bg-muted/50 text-xs text-muted-foreground flex gap-2">
            <Info className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
            <span>{getRoleDescription(role)}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-sm font-semibold text-white shadow-lg shadow-teal-500/10 active:scale-[0.98] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer"
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

        <div className="mt-8 text-center text-xs text-muted-foreground relative z-10">
          Already registered?{' '}
          <Link href="/login" className="text-teal-600 hover:text-teal-500 font-semibold">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

