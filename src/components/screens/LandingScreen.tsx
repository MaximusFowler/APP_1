"use client";
// ============================================================
// Landing Screen — shown on initial load (optional splash)
// ============================================================

import { Leaf, ChevronRight, Zap, Eye, TrendingUp } from "lucide-react";

interface LandingScreenProps {
  onStart: () => void;
}

export default function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center mb-6">
          <Leaf className="w-10 h-10 text-[#4ade80]" />
        </div>

        <div className="text-[#4ade80] text-xs font-medium tracking-widest uppercase mb-3">
          Aura Blooms
        </div>

        <h1 className="text-4xl font-bold leading-tight mb-4">
          Will Your Plant<br />
          <span className="text-[#4ade80]">Survive?</span>
        </h1>

        <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mb-10">
          AI-powered botanical analysis. Point your camera at any room corner and get a precise 2-year plant survival prediction.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {[
            { icon: <Zap className="w-3 h-3" />, label: "Gemini Vision AI" },
            { icon: <Eye className="w-3 h-3" />, label: "AR Ghost Preview" },
            { icon: <TrendingUp className="w-3 h-3" />, label: "24-Month Simulation" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111a11] border border-[#1e3a1e] text-xs text-neutral-400"
            >
              <span className="text-[#4ade80]">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full max-w-xs py-4 rounded-2xl bg-[#4ade80] text-[#0a0f0a] font-bold text-base flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all"
        >
          Start Analysis
          <ChevronRight className="w-5 h-5" />
        </button>

        <p className="text-xs text-neutral-600 mt-4">
          Uses GPS, Camera & Compass · No account required
        </p>
      </div>

      {/* Bottom decoration */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#4ade80]/30 to-transparent" />
    </div>
  );
}
