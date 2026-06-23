'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { CheckCircle2, XCircle, Loader2, Shield } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    api.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Failed to verify email. The link may have expired.');
      });
  }, [token]);

  return (
    <div className="w-full max-w-sm p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl shadow-2xl relative text-center">
      {status === 'verifying' && (
        <div className="space-y-4 py-6">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Verifying Account</h2>
          <p className="text-xs text-slate-400">Please wait while we secure your operator terminal credentials.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6 animate-[ping_1.5s_ease-in-out_infinite_alternate]" style={{ animationDuration: '3s' }} />
          </div>
          <h2 className="text-xl font-bold text-white">Verification Complete</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <Link 
              href="/login" 
              className="inline-block w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider"
            >
              Sign In to Terminal
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 py-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-2">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Verification Failed</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <Link 
              href="/signup" 
              className="inline-block w-full py-3 px-4 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-300 shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider border border-slate-800"
            >
              Register Again
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background Grids & Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full filter blur-3xl" />
      
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-xl tracking-tight text-white">IndraNetra</span>
      </div>

      <Suspense fallback={
        <div className="w-full max-w-sm p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl shadow-2xl relative text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
