'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import { Eye, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

      <Link href="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
          <Eye className="w-6 h-6 text-white" />
        </div>
        <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          IndraNetra
        </span>
      </Link>

      <div className="w-full max-w-md p-8 rounded-2xl glass-card relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-xs text-zinc-400">Join IndraNetra AI Crowd Safety network</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
            <input 
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Officer / Volunteer / Organizer Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="name@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Operational Role</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              style={{ backgroundImage: 'radial-gradient(circle, transparent 50%, white 50%)' }}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
              </>
            ) : (
              'Register Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
