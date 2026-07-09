'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Shield, Loader2, AlertCircle, Sparkles, User, FileText, Phone } from 'lucide-react';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  // Organizer Profile
  const [organizationName, setOrganizationName] = useState('');
  const [designation, setDesignation] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Volunteer Profile
  const [phoneNumber, setPhoneNumber] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('AVAILABLE');
  
  // Public User Profile
  const [emergencyContact, setEmergencyContact] = useState('');

  useEffect(() => {
    api.getMe()
      .then((user) => {
        if (user.profileComplete) {
          router.push('/dashboard');
          return;
        }
        setCurrentUser(user);
        setRole(user.role);
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    let profileData: any = {};
    if (role === 'ORGANIZER') {
      profileData = { organizationName, designation, contactNumber };
    } else if (role === 'VOLUNTEER') {
      profileData = { phoneNumber, skills, availability };
    } else {
      profileData = { phoneNumber, emergencyContact };
    }

    try {
      await api.completeProfile(role, profileData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Grids & Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full filter blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full filter blur-3xl" />

      {/* Logo */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-xl tracking-tight text-white">IndraNetra</span>
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">Welcome to Eye of Indra</h2>
          <p className="text-xs text-slate-400 mt-1">Complete your operator profile to gain control room clearance.</p>
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
          
          {/* If role is general PUBLIC from Google login, allow role selection! */}
          {currentUser && currentUser.role === 'PUBLIC' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Choose Dashboard Clearance</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all appearance-none cursor-pointer font-sans"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="PUBLIC">Public User (SOS, Incident Reporting)</option>
                  <option value="VOLUNTEER">Volunteer Responder (Rescue Operations)</option>
                  <option value="ORGANIZER">Event Organizer (Crowd Safety Controls)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Role Fields */}
          {role === 'ORGANIZER' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Organization Name</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                  placeholder="e.g. Indra Expo Management"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Designation / Role Title</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                  placeholder="e.g. Safety Coordinator"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Contact Number</label>
                <input 
                  type="tel"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                  placeholder="+91 XXXXX XXXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
            </div>
          )}

          {role === 'VOLUNTEER' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Phone Number</label>
                <input 
                  type="tel"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                  placeholder="+91 XXXXX XXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Special Skills / Qualifications</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                  placeholder="e.g. First Aid, Crowd Control, Bilingual"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Availability Status</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all appearance-none cursor-pointer font-sans"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  >
                    <option value="AVAILABLE">On Duty (Available for Dispatch)</option>
                    <option value="INACTIVE">Off Duty (Unavailable)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {role === 'PUBLIC' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Phone Number</label>
                <input 
                  type="tel"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                  placeholder="+91 XXXXX XXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Emergency Contact Number</label>
                <input 
                  type="tel"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all font-sans"
                  placeholder="Emergency contact phone"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg active:scale-[0.98] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer uppercase tracking-wider mt-6"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Profile...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
