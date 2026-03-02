"use client";
// ============================================================
// Page 2: Analysis + AR Ghost Preview
// Cinematic reveal of AI analysis with animated plant ghost
// ============================================================

import { useEffect, useState, useRef } from "react";
import { ChevronRight, X, Zap, Eye, Loader2, AlertCircle } from "lucide-react";
import type { LightAnalysis, EnvironmentData } from "@/lib/types";
import { lightScoreToLabel, survivalScoreColor } from "@/lib/botanicalEngine";

interface AnalysisPageProps {
  environment: EnvironmentData;
  onComplete: (analysis: LightAnalysis) => void;
  onBack: () => void;
}

// ─── Particle system for ambient effect ──────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
}

function useParticles(count: number, active: boolean) {
  // Initialise lazily so we never call setState synchronously in an effect
  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.4,
      speed: 0.2 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.3,
    }))
  );

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          y: p.y - p.speed < -5 ? 105 : p.y - p.speed,
          x: p.x + p.drift,
          opacity: 0.1 + Math.random() * 0.4,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, [active]);

  return particles;
}

// ─── Score counter animation ──────────────────────────────────

function useCountUp(target: number, duration: number = 1500, active: boolean = false) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active || target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, active]);

  return current;
}

export default function AnalysisPage({ environment, onComplete, onBack }: AnalysisPageProps) {
  const [analysis, setAnalysis] = useState<LightAnalysis | null>(null);
  const [phase, setPhase] = useState<"scanning" | "processing" | "reveal" | "ready">("scanning");
  const [error, setError] = useState<string | null>(null);
  const [plantVisible, setPlantVisible] = useState(false);
  const [observationIndex, setObservationIndex] = useState(0);
  const particles = useParticles(20, phase === "reveal" || phase === "ready");
  const scoreDisplay = useCountUp(analysis?.lightScore ?? 0, 1800, phase === "reveal" || phase === "ready");
  const hasRun = useRef(false);

  // ── Trigger analysis ─────────────────────────────────────
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      // Phase 1: scanning (1.2s)
      await delay(1200);
      setPhase("processing");

      // Phase 2: API call
      try {
        const res = await fetch("/api/analyze-light", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plantSpotImage: environment.plantSpotImage,
            lightSourceImage: environment.lightSourceImage,
          }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = (await res.json()) as LightAnalysis;
        setAnalysis(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        setAnalysis({
          lightScore: 45,
          description: "Using estimated light conditions based on your configuration.",
          lightLevel: "Medium",
          observations: ["Estimated from window orientation and distance", "Manual parameters applied", "Results may vary"],
          confidence: 0.4,
        });
      }

      // Phase 3: reveal
      await delay(400);
      setPhase("reveal");
      await delay(300);
      setPlantVisible(true);

      // Stagger observations
      await delay(600);
      setObservationIndex(1);
      await delay(400);
      setObservationIndex(2);
      await delay(400);
      setObservationIndex(3);

      await delay(200);
      setPhase("ready");
    };

    run();
  }, [environment]);

  const lightScore = analysis?.lightScore ?? 0;
  const scoreColor = survivalScoreColor(lightScore);
  const levelLabel = analysis ? lightScoreToLabel(lightScore) : "";

  // Ghost filter based on light score
  const ghostFilter = lightScore >= 65
    ? `hue-rotate(0deg) saturate(130%) brightness(110%)`
    : lightScore >= 35
    ? `hue-rotate(${(65 - lightScore) * 0.5}deg) saturate(${100 - (65 - lightScore) * 0.8}%) brightness(${100 - (65 - lightScore) * 0.3}%)`
    : `hue-rotate(${30 + (35 - lightScore) * 1.5}deg) saturate(${60 - (35 - lightScore) * 1.5}%) brightness(${85 - (35 - lightScore) * 0.8}%)`;

  return (
    <div className="min-h-screen bg-[#050905] text-white flex flex-col overflow-hidden">

      {/* ── HEADER ───────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-10 pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <X className="w-4 h-4 text-[#4a5e4a]" />
        </button>
        <div className="text-center">
          <div className="label-caps text-[#4a5e4a]">Analysis</div>
        </div>
        <div className="w-9" />
      </header>

      {/* ── GHOST VIEWPORT ───────────────────────────────── */}
      <div className="relative flex-1 flex flex-col">

        {/* Full-bleed background */}
        <div className="absolute inset-0">
          {/* Plant spot photo as background */}
          {environment.plantSpotImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={environment.plantSpotImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: phase === "ready" ? 0.25 : 0.15, transition: "opacity 1s ease" }}
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050905] via-transparent to-[#050905]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050905]/80 via-transparent to-[#050905]/80" />

          {/* Ambient glow */}
          {analysis && (
            <div
              className="absolute inset-0 transition-all duration-2000"
              style={{
                background: `radial-gradient(ellipse 60% 50% at 50% 70%, ${scoreColor}15, transparent)`,
              }}
            />
          )}

          {/* Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                background: scoreColor,
                filter: "blur(0.5px)",
              }}
            />
          ))}
        </div>

        {/* ── SCANNING PHASE ── */}
        {(phase === "scanning" || phase === "processing") && (
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
            <div className="relative mb-8">
              {/* Outer ring */}
              <div
                className="w-32 h-32 rounded-full border border-[#4ade80]/20 animate-spin-slow"
                style={{ borderTopColor: "#4ade80" }}
              />
              {/* Inner ring */}
              <div
                className="absolute inset-4 rounded-full border border-[#4ade80]/10 animate-spin-slow"
                style={{ animationDirection: "reverse", animationDuration: "8s", borderTopColor: "rgba(74,222,128,0.4)" }}
              />
              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">
                {phase === "scanning" ? "Scanning environment…" : "Analysing with AI…"}
              </h2>
              <p className="text-sm text-[#4a5e4a]">
                {phase === "scanning" ? "Reading light conditions" : "Gemini Vision processing your images"}
              </p>
            </div>

            {/* Scan line animation */}
            <div className="mt-8 w-48 h-px bg-[#4ade80]/20 relative overflow-hidden">
              <div className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-[#4ade80] to-transparent animate-shimmer" />
            </div>
          </div>
        )}

        {/* ── REVEAL PHASE ── */}
        {(phase === "reveal" || phase === "ready") && analysis && (
          <div className="relative z-10 flex-1 flex flex-col">

            {/* Plant Ghost */}
            <div className="flex-1 flex items-end justify-center pb-4 pt-8">
              <div
                className="transition-all duration-1000"
                style={{
                  opacity: plantVisible ? 1 : 0,
                  transform: plantVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.85)",
                  filter: ghostFilter,
                }}
              >
                <GhostPlantSVG lightScore={lightScore} />
              </div>
            </div>

            {/* Score overlay */}
            <div
              className="absolute top-4 right-4 text-right animate-fade-up"
              style={{ opacity: plantVisible ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}
            >
              <div className="text-5xl font-bold" style={{ color: scoreColor }}>
                {scoreDisplay}
              </div>
              <div className="label-caps text-[#4a5e4a] mt-1">Light Score</div>
              <div
                className="mt-1 px-2 py-0.5 rounded-full text-xs font-medium inline-block"
                style={{ background: `${scoreColor}15`, color: scoreColor, border: `1px solid ${scoreColor}30` }}
              >
                {levelLabel}
              </div>
            </div>

            {/* Eye badge */}
            <div className="absolute top-4 left-4">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(5,9,5,0.7)", border: "1px solid rgba(74,222,128,0.15)" }}
              >
                <Eye className="w-3 h-3 text-[#4ade80]" />
                <span className="label-caps text-[#4a5e4a]">Ghost Preview</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ANALYSIS PANEL ───────────────────────────────── */}
      {(phase === "reveal" || phase === "ready") && analysis && (
        <div className="relative z-10 px-6 pb-8 space-y-4">

          {/* Score bar card */}
          <div
            className="glass-raised rounded-2xl p-4 animate-fade-up"
            style={{ animationDelay: "0.1s", opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Light Environment</span>
              <span className="text-xs text-[#4a5e4a]">
                Confidence: {Math.round(analysis.confidence * 100)}%
              </span>
            </div>

            {/* Segmented score bar */}
            <div className="relative h-3 rounded-full overflow-hidden mb-3" style={{ background: "rgba(74,222,128,0.08)" }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1500"
                style={{
                  width: `${lightScore}%`,
                  background: `linear-gradient(90deg, ${lightScore < 35 ? "#dc2626" : lightScore < 65 ? "#ca8a04" : "#22c55e"}, ${scoreColor})`,
                  boxShadow: `0 0 12px ${scoreColor}60`,
                }}
              />
              {/* Zone markers */}
              <div className="absolute inset-y-0 left-[35%] w-px bg-white/10" />
              <div className="absolute inset-y-0 left-[65%] w-px bg-white/10" />
            </div>

            <div className="flex justify-between text-[10px] text-[#2a3a2a]">
              <span>Death Zone</span>
              <span>Sub-optimal</span>
              <span>Optimal</span>
            </div>

            <p className="text-xs text-[#4a5e4a] leading-relaxed mt-3">{analysis.description}</p>
          </div>

          {/* Observations */}
          <div
            className="glass-raised rounded-2xl p-4 animate-fade-up"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">AI Observations</span>
            </div>
            <div className="space-y-2">
              {analysis.observations.slice(0, 3).map((obs, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 transition-all duration-500"
                  style={{
                    opacity: i < observationIndex ? 1 : 0,
                    transform: i < observationIndex ? "translateX(0)" : "translateX(-8px)",
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: scoreColor }}
                  />
                  <span className="text-xs text-[#a3b8a3] leading-relaxed">{obs}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 text-xs text-amber-400 px-3 py-2 rounded-xl animate-fade-up"
              style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", animationDelay: "0.3s", opacity: 0 }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Using estimated values — {error}</span>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => analysis && onComplete(analysis)}
            disabled={phase !== "ready"}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 animate-fade-up disabled:opacity-30"
            style={{ animationDelay: "0.4s", opacity: 0 }}
          >
            Run 2-Year Simulation
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Ghost Plant SVG ──────────────────────────────────────────

function GhostPlantSVG({ lightScore }: { lightScore: number }) {
  const isHealthy = lightScore >= 65;
  const isStressed = lightScore < 35;
  const leafColor = isHealthy ? "#4ade80" : isStressed ? "#ca8a04" : "#a3e635";
  const stemColor = isHealthy ? "#22c55e" : isStressed ? "#92400e" : "#84cc16";
  const leafOpacity = isHealthy ? 0.8 : isStressed ? 0.5 : 0.65;

  return (
    <svg width="180" height="260" viewBox="0 0 180 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.8 }}>
      {/* Pot */}
      <path d="M60 230 L66 260 H114 L120 230 Z" fill="#1a2e1a" opacity="0.9" />
      <rect x="55" y="222" width="70" height="12" rx="5" fill="#243824" opacity="0.9" />

      {/* Stem */}
      <path
        d={isStressed
          ? "M90 222 Q94 185 86 150 Q82 120 90 90"
          : "M90 222 Q90 185 90 150 Q90 120 90 90"}
        stroke={stemColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Leaves */}
      {isHealthy && (
        <>
          <ellipse cx="58" cy="165" rx="34" ry="15" fill={leafColor} opacity={leafOpacity} transform="rotate(-35 58 165)" />
          <ellipse cx="122" cy="152" rx="34" ry="15" fill={leafColor} opacity={leafOpacity - 0.05} transform="rotate(35 122 152)" />
          <ellipse cx="62" cy="130" rx="28" ry="13" fill={leafColor} opacity={leafOpacity - 0.1} transform="rotate(-25 62 130)" />
          <ellipse cx="118" cy="120" rx="28" ry="13" fill={leafColor} opacity={leafOpacity - 0.1} transform="rotate(25 118 120)" />
          <ellipse cx="65" cy="105" rx="24" ry="11" fill={leafColor} opacity={leafOpacity} transform="rotate(-15 65 105)" />
          <ellipse cx="115" cy="98" rx="24" ry="11" fill={leafColor} opacity={leafOpacity} transform="rotate(15 115 98)" />
          <ellipse cx="90" cy="82" rx="22" ry="10" fill={leafColor} opacity={leafOpacity + 0.05} />
          <ellipse cx="90" cy="62" rx="18" ry="9" fill="#86efac" opacity={leafOpacity} />
        </>
      )}

      {!isHealthy && !isStressed && (
        <>
          <ellipse cx="55" cy="172" rx="28" ry="12" fill={leafColor} opacity={leafOpacity} transform="rotate(-28 55 172)" />
          <ellipse cx="125" cy="160" rx="28" ry="12" fill={leafColor} opacity={leafOpacity} transform="rotate(28 125 160)" />
          <ellipse cx="60" cy="138" rx="22" ry="10" fill={leafColor} opacity={leafOpacity - 0.1} transform="rotate(-18 60 138)" />
          <ellipse cx="120" cy="128" rx="22" ry="10" fill={leafColor} opacity={leafOpacity - 0.1} transform="rotate(18 120 128)" />
          <ellipse cx="68" cy="110" rx="18" ry="9" fill={leafColor} opacity={leafOpacity} transform="rotate(-10 68 110)" />
          <ellipse cx="112" cy="104" rx="18" ry="9" fill={leafColor} opacity={leafOpacity} transform="rotate(10 112 104)" />
          <ellipse cx="90" cy="88" rx="16" ry="8" fill={leafColor} opacity={leafOpacity + 0.05} />
        </>
      )}

      {isStressed && (
        <>
          <ellipse cx="52" cy="180" rx="22" ry="9" fill={leafColor} opacity={leafOpacity} transform="rotate(-20 52 180)" />
          <ellipse cx="128" cy="168" rx="22" ry="9" fill={leafColor} opacity={leafOpacity} transform="rotate(20 128 168)" />
          <ellipse cx="58" cy="148" rx="18" ry="8" fill={leafColor} opacity={leafOpacity - 0.1} transform="rotate(-12 58 148)" />
          <ellipse cx="122" cy="138" rx="18" ry="8" fill={leafColor} opacity={leafOpacity - 0.1} transform="rotate(12 122 138)" />
          <ellipse cx="90" cy="118" rx="14" ry="7" fill={leafColor} opacity={leafOpacity} />
          {/* Drooping effect */}
          <path d="M58 180 Q45 195 40 210" stroke={leafColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <path d="M128 168 Q140 183 145 198" stroke={leafColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// ─── Utility ──────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
