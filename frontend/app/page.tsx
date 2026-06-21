'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Users, 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  Compass, 
  ArrowRight,
  Eye,
  CheckCircle,
  Cpu,
  Tv,
  BellRing,
  Mail,
  School,
  ArrowDown,
  Play,
  Map,
  Check,
  AlertCircle
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
} as const;

const stepVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 14 }
  }
} as const;

export default function LandingPage() {
  // Live Telemetry states for section 6
  const [telemetryCount, setTelemetryCount] = useState(12450);
  const [telemetryRisk, setTelemetryRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [telemetryAlerts, setTelemetryAlerts] = useState(3);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulation timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setTelemetryCount(prev => prev + Math.floor(Math.random() * 80) - 20);
        // Randomly adjust alerts and risk
        const roll = Math.random();
        if (roll > 0.85) {
          setTelemetryRisk('HIGH');
          setTelemetryAlerts(5);
        } else if (roll > 0.6) {
          setTelemetryRisk('CRITICAL');
          setTelemetryAlerts(7);
        } else if (roll > 0.3) {
          setTelemetryRisk('MEDIUM');
          setTelemetryAlerts(3);
        } else {
          setTelemetryRisk('LOW');
          setTelemetryAlerts(0);
        }
      }, 1500);
    } else {
      // reset defaults
      setTelemetryCount(12450);
      setTelemetryRisk('MEDIUM');
      setTelemetryAlerts(3);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="min-h-screen bg-white text-[#0f172a] flex flex-col selection:bg-blue-600 selection:text-white relative overflow-x-hidden font-sans">
      
      {/* 1. Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#0f172a]">
              IndraNetra
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500">
            <a href="#hero" className="hover:text-blue-600 transition-colors">Home</a>
            <a href="#problem" className="hover:text-blue-600 transition-colors">Problem</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#preview" className="hover:text-blue-600 transition-colors">Live Preview</a>
            <a href="#events" className="hover:text-blue-600 transition-colors">Events</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-all duration-200"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/30 transition-all duration-250"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="hero" className="relative pt-36 pb-24 px-6 overflow-hidden bg-gradient-to-b from-blue-50/30 via-white to-white flex flex-col items-center justify-center min-h-[90vh]">
        {/* Animated Particles & HUD Simulation Overlays */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Animated concentric HUD circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-blue-500/5 animate-[spin_120s_linear_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-dashed border-blue-500/10 animate-[spin_60s_linear_infinite_reverse]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-blue-500/5 animate-[ping_4s_ease-in-out_infinite]" />

          {/* Floating Flow Lines */}
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

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8 flex flex-col items-center">
          {/* IndraNetra Tagline Badge */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold text-xs tracking-wider uppercase shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>IndraNetra</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.08]"
          >
            AI-Powered Crowd Intelligence & <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Stampede Prevention
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto text-slate-600 text-lg sm:text-xl leading-relaxed"
          >
            Monitor crowds in real time, predict risks, coordinate emergency response, and ensure public safety with state-of-the-art computer vision algorithms.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-slate-700 font-bold flex items-center justify-center gap-2 shadow-sm hover:border-gray-300 transition-all duration-200"
            >
              Explore Features <ArrowDown className="w-4 h-4 text-slate-500" />
            </a>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all duration-200"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              Create Account <ArrowRight className="w-4.5 h-4.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 3. Problem Statement Section */}
      <section id="problem" className="py-24 px-6 border-t border-gray-200 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">The Crowd Management Problem</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-base">
              Traditional monitoring relies heavily on post-event analysis. IndraNetra addresses this with active prevention.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Traditional Column */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="p-8 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-4">// Traditional Systems</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-6">Traditional Crowd Management</h3>
                <ul className="space-y-4">
                  {[
                    { title: "Manual Monitoring", desc: "Security guards stare at dozens of screens, leading to fatigue and missed details." },
                    { title: "Slow Response", desc: "Emergency calls are made only after incidents occur, creating fatal delays." },
                    { title: "Poor Visibility", desc: "No central telemetry; officials lack access to actual venue crowd numbers." },
                    { title: "High Risk", desc: "High vulnerability to rapid congestion, stampedes, and path blockages." }
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">!</div>
                      <div>
                        <strong className="text-slate-900 text-sm font-bold block">{item.title}</strong>
                        <span className="text-slate-600 text-xs">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* IndraNetra Column */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="p-8 rounded-2xl border border-blue-200 bg-white shadow-md relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-4">// Real-Time Security</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-6">IndraNetra Solution</h3>
                <ul className="space-y-4">
                  {[
                    { title: "AI Monitoring", desc: "Computer vision algorithms process live camera frames automatically." },
                    { title: "Live Analytics", desc: "Real-time population counts, densities, and risk vectors mapped to a single HUD." },
                    { title: "Risk Prediction", desc: "Algorithm detects crowding hazards early and calculates evacuation models." },
                    { title: "Fast Response", desc: "Automated volunteer dispatches and emergency alert loops active in seconds." }
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <Check className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <strong className="text-slate-900 text-sm font-bold block">{item.title}</strong>
                        <span className="text-slate-600 text-xs">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 4. Core Features Section */}
      <section id="features" className="py-24 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">// Elite Operations</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Core Platform Features</h2>
            <p className="text-slate-600 max-w-xl mx-auto text-base">
              Unified command systems designed specifically to prevent mass gathering incidents and organize safety response.
            </p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Tv, title: "Live Monitoring", desc: "Simultaneously scan CCTV cameras, local webcams, and server-side RTSP streams on a clean tactical dashboard." },
              { icon: Activity, title: "Crowd Detection", desc: "Run state-of-the-art YOLOv8 object models to calculate instant crowd count and density per square meter." },
              { icon: TrendingUp, title: "Risk Prediction", desc: "Assess danger categories (LOW, MEDIUM, HIGH, CRITICAL) based on crowd density profiles." },
              { icon: Compass, title: "Smart Evacuation", desc: "Find safe evacuation gates automatically using path solvers when risk levels exceed safety margins." },
              { icon: BellRing, title: "SOS Network", desc: "Equip users with GPS-targeted emergency SOS triggers to push distress signals straight to the admin console." },
              { icon: Users, title: "Volunteer Dispatch", desc: "Monitor volunteer duty states and dispatch responders to resolve incidents dynamically." }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={idx}
                  variants={fadeInUp}
                  className="p-6 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-4 group"
                >
                  <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 border-t border-gray-200 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">// The Pipeline</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">How the Platform Works</h2>
            <p className="text-slate-600 max-w-xl mx-auto text-base">
              A automated end-to-end telemetry system linking event hardware with tactical incident response.
            </p>
          </div>

          {/* Flow Timeline */}
          <div className="relative">
            {/* Horizontal line (large screens) */}
            <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
              {[
                { step: "01", title: "Camera Feed", desc: "Local webcams or remote RTSP streams stream video packets to the system." },
                { step: "02", title: "AI Analysis", desc: "FastAPI servers perform fast convolutional passes using YOLOv8 models." },
                { step: "03", title: "Risk Detection", desc: "Crowd density calculations determine risk profiles in real-time." },
                { step: "04", title: "Alert Generation", desc: "Redis pub/sub channels broadcast density and gate warning alerts." },
                { step: "05", title: "Emergency Response", desc: "Admins dispatch volunteers to active SOS targets on the Leaflet Map." }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={stepVariants}
                  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center relative flex flex-col items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-blue-500/20">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Live System Preview */}
      <section id="preview" className="py-24 px-6 bg-white relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">// Interface Simulation</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Interactive Preview Dashboard</h2>
            <p className="text-slate-600 max-w-xl mx-auto text-base">
              Interact with the telemetry simulation below to experience risk escalations and warning notifications.
            </p>
          </div>

          {/* Interactive Widget */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-gray-200 bg-white shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-stretch"
          >
            {/* Controls */}
            <div className="md:w-1/3 flex flex-col justify-between gap-6 border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Simulation Command</h3>
                <p className="text-slate-500 text-xs mb-4">Click to simulate crowd surges and trigger alarm signals in the dashboard preview.</p>
                
                <button 
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSimulating 
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  }`}
                >
                  <Play className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Stop Crowd Surge' : 'Simulate Crowd Surge'}</span>
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-[10px] font-mono text-gray-500 leading-relaxed">
                <div>[STATUS] {isSimulating ? "Surge simulated: YOLOv8 model scanning active frames..." : "Standby: Normal surveillance loop running."}</div>
              </div>
            </div>

            {/* Simulated telemetry output */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              
              <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50/50 flex flex-col justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-bold">Crowd Population</span>
                <div>
                  <div className="text-3xl font-black text-slate-900 transition-all">{telemetryCount.toLocaleString()}</div>
                  <span className="text-[9px] text-gray-400 font-mono">LIVE COUNTER</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50/50 flex flex-col justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-bold">Density Index</span>
                <div>
                  <div className="text-3xl font-black text-slate-900">
                    {isSimulating ? (4.25 + Math.random() * 0.8).toFixed(2) : "1.80"}<span className="text-xs text-gray-400 font-semibold">/m²</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-mono">PEAK DENSITY</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50/50 flex flex-col justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-bold">Risk Level</span>
                <div>
                  <div className={`text-xs font-black px-3 py-1 rounded-full border text-center transition-all inline-block ${
                    telemetryRisk === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-600' :
                    telemetryRisk === 'HIGH' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                    telemetryRisk === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                    'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}>
                    {telemetryRisk}
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono mt-2">ALARM VECTOR</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50/50 flex flex-col justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-bold">Active Alerts</span>
                <div>
                  <div className="text-3xl font-black text-blue-600 transition-all flex items-center gap-2">
                    <AlertCircle className={`w-6 h-6 text-blue-600 ${isSimulating ? 'animate-bounce' : ''}`} />
                    <span>{telemetryAlerts}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-mono">REDIS BROKER LOGS</span>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* 7. Architecture / Technology Section */}
      <section className="py-24 px-6 border-t border-gray-200 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">// Infrastructure</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">System Architecture & Tech Stack</h2>
            <p className="text-slate-600 max-w-xl mx-auto text-base">
              A high-performance technical architecture designed for sub-second processing and visual telemetry.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { tech: "Next.js 16", layer: "Frontend Portal", desc: "React components, Turbopack, TailwindCSS styling." },
              { tech: "FastAPI", layer: "AI Backend Router", desc: "Python framework routing OpenCV streams to YOLO." },
              { tech: "YOLOv8", layer: "Computer Vision", desc: "Convolutional neural network for bounding-box counting." },
              { tech: "Redis", layer: "Alert Pub/Sub", desc: "In-memory caching and messaging for instant warnings." },
              { tech: "Socket.IO", layer: "Real-time Gateway", desc: "Bidirectional WebSockets broadcasting density maps." },
              { tech: "Prisma ORM", layer: "Database Access", desc: "Type-safe Client interfacing with PostgreSQL." },
              { tech: "OpenCV", layer: "Stream Parser", desc: "Grabs video frames directly from RTSP feeds." },
              { tech: "Leaflet.js", layer: "Interactive Mapping", desc: "Draws density circles and exit routes on map layers." }
            ].map((stack, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <strong className="text-sm font-extrabold text-slate-900 block">{stack.tech}</strong>
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider font-mono block mb-2">{stack.layer}</span>
                </div>
                <p className="text-slate-500 text-[10px] leading-relaxed">{stack.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Supported Events Section */}
      <section id="events" className="py-24 px-6 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">// Practical Scenarios</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Supported Event Types</h2>
            <p className="text-slate-600 max-w-xl mx-auto text-base">
              Engineered to support security surveillance across varied public events and venues.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Temple Festivals", details: "Monitor high-density pilgrimage entries and resolve gate blocks." },
              { label: "Concerts", details: "Track stage barriers and calculate evacuations inside arenas." },
              { label: "Cricket Matches", details: "Manage crowd entries, exits, and ticket queues at stadiums." },
              { label: "Political Rallies", details: "Ensure safety corridors and report anomalies across public squares." },
              { label: "Public Gatherings", details: "Track protests, public parks, and general walking zones." }
            ].map((event, idx) => (
              <div 
                key={idx}
                className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-default"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center mb-4 text-xs font-mono">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{event.label}</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed">{event.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Call To Action */}
      <section className="py-20 px-6 border-t border-gray-200 bg-slate-50 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto space-y-6 relative z-10 flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Ready to build safer public events?</h2>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Deploy automated AI video analytics, track crowd utilization indices, and coordinate rescue alerts globally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 w-full sm:w-auto">
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-gray-200 bg-white text-slate-700 font-bold hover:bg-gray-100 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-12 px-6 text-xs text-gray-500 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <strong className="text-sm font-extrabold text-slate-900 tracking-tight">IndraNetra</strong>
            </div>
            <span>© 2026 IndraNetra Framework. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6">
            <a 
              href="https://github.com/shreyass0709/IndraNetra" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-semibold"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg> GitHub
            </a>
            <a 
              href="mailto:support@indranetra.org" 
              className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-semibold"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
            <span className="flex items-center gap-1.5 text-gray-400 font-medium">
              <School className="w-4 h-4 text-gray-300" /> Indra College of Technology
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
}
