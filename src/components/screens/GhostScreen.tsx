"use client";
// ============================================================
// Screen 3: The Ghost — AR-lite plant preview with analysis
// ============================================================

import { useEffect, useState } from "react";
import { Loader2, ChevronRight, X, Zap, Eye } from "lucide-react";
import type { LightAnalysis, EnvironmentData } from "@/lib/types";
import { lightScoreToLabel } from "@/lib/botanicalEngine";

interface GhostScreenProps {
  environment: EnvironmentData;
  onAnalysisComplete: (analysis: LightAnalysis) => void;
  onBack: () => void;
}

/** CSS filter string for the ghost plant based on light score */
function ghostFilter(lightScore: number): string {
  if (lightScore >= 65) {
    return "hue-rotate(0deg) saturate(120%) brightness(110%)";
  }
  if (lightScore >= 35) {
    const deficit = (65 - lightScore) / 30;
    return `hue-rotate(${deficit * 15}deg) saturate(${100 - deficit * 20}%) brightness(${100 - deficit * 10}%)`;
  }
  const deficit = (35 - lightScore) / 35;
  return `hue-rotate(${15 + deficit * 30}deg) saturate(${80 - deficit * 50}%) brightness(${90 - deficit * 20}%)`;
}

/** Ambient glow colour based on light score */
function glowColor(lightScore: number): string {
  if (lightScore >= 65) return "rgba(74, 222, 128, 0.3)";
  if (lightScore >= 35) return "rgba(163, 230, 53, 0.2)";
  if (lightScore >= 20) return "rgba(250, 204, 21, 0.2)";
  return "rgba(248, 113, 113, 0.2)";
}

export default function GhostScreen({ environment, onAnalysisComplete, onBack }: GhostScreenProps) {
  const [analysis, setAnalysis] = useState<LightAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plantVisible, setPlantVisible] = useState(false);

  // ── Trigger AI Analysis ──────────────────────────────────
  useEffect(() => {
    const runAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analyze-light", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plantSpotImage: environment.plantSpotImage,
            lightSourceImage: environment.lightSourceImage,
          }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = (await res.json()) as LightAnalysis;
        setAnalysis(data);
        // Animate plant ghost in after analysis
        setTimeout(() => setPlantVisible(true), 300);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        // Use fallback
        const fallback: LightAnalysis = {
          lightScore: 45,
          description: "Using estimated light conditions.",
          lightLevel: "Medium",
          observations: ["Manual estimation applied"],
          confidence: 0.4,
        };
        setAnalysis(fallback);
        setTimeout(() => setPlantVisible(true), 300);
      } finally {
        setIsLoading(false);
      }
    };

    runAnalysis();
  }, [environment]);

  const handleContinue = () => {
    if (analysis) onAnalysisComplete(analysis);
  };

  const lightScore = analysis?.lightScore ?? 0;
  const levelLabel = analysis ? lightScoreToLabel(lightScore) : "";

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-10 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-neutral-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase tracking-widest">Step 3 of 4</div>
          <div className="text-sm font-semibold text-white mt-0.5">Plant Ghost Preview</div>
        </div>
        <div className="w-5" />
      </header>

      {/* Ghost Viewport */}
      <div className="px-6 mb-5">
        <div
          className="relative rounded-2xl overflow-hidden bg-[#111a11] border border-[#1e3a1e]"
          style={{ height: "340px" }}
        >
          {/* Background: plant spot photo or gradient */}
          {environment.plantSpotImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={environment.plantSpotImage}
              alt="Plant spot"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d1a0d] to-[#0a0f0a]" />
          )}

          {/* Ambient glow */}
          {analysis && (
            <div
              className="absolute inset-0 transition-all duration-1000"
              style={{
                background: `radial-gradient(ellipse at 50% 80%, ${glowColor(lightScore)}, transparent 70%)`,
              }}
            />
          )}

          {/* Plant Ghost SVG */}
          <div
            className="absolute inset-0 flex items-end justify-center pb-8 transition-all duration-1000"
            style={{
              opacity: plantVisible ? 1 : 0,
              transform: plantVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
            }}
          >
            <div
              style={{
                filter: analysis ? ghostFilter(lightScore) : "opacity(0.3)",
                transition: "filter 1.5s ease",
              }}
            >
              <PlantGhostSVG lightScore={lightScore} />
            </div>
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f0a]/80 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin mb-3" />
              <p className="text-sm text-neutral-400">Analysing light environment…</p>
              <p className="text-xs text-neutral-600 mt-1">Powered by Gemini Vision</p>
            </div>
          )}

          {/* Light score badge */}
          {analysis && !isLoading && (
            <div className="absolute top-4 right-4">
              <div className="bg-[#0a0f0a]/80 backdrop-blur-sm border border-[#1e3a1e] rounded-xl px-3 py-2 text-center">
                <div className="text-2xl font-bold text-[#4ade80]">{lightScore}</div>
                <div className="text-xs text-neutral-500">Light Score</div>
              </div>
            </div>
          )}

          {/* Eye icon label */}
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-1.5 bg-[#0a0f0a]/60 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Eye className="w-3 h-3 text-[#4ade80]" />
              <span className="text-xs text-neutral-400">Ghost Preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      <div className="flex-1 px-6 space-y-4 pb-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-[#111a11] rounded-full animate-pulse" style={{ width: `${70 + i * 10}%` }} />
            ))}
          </div>
        ) : analysis ? (
          <>
            {/* Light Level Summary */}
            <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Light Environment</span>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    background: lightScore >= 65 ? "rgba(74,222,128,0.15)" : lightScore >= 35 ? "rgba(250,204,21,0.15)" : "rgba(248,113,113,0.15)",
                    color: lightScore >= 65 ? "#4ade80" : lightScore >= 35 ? "#facc15" : "#f87171",
                  }}
                >
                  {levelLabel}
                </span>
              </div>

              {/* Score bar */}
              <div className="h-2 bg-[#0a0f0a] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${lightScore}%`,
                    background: lightScore >= 65 ? "#4ade80" : lightScore >= 35 ? "#facc15" : "#f87171",
                  }}
                />
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">{analysis.description}</p>
            </div>

            {/* Observations */}
            <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                AI Observations
              </h3>
              <ul className="space-y-2">
                {analysis.observations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-neutral-400">
                    <span className="text-[#4ade80] mt-0.5 flex-shrink-0">•</span>
                    {obs}
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs text-neutral-600">
                Confidence: {Math.round(analysis.confidence * 100)}%
              </div>
            </div>

            {error && (
              <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
                ⚠ {error} — Using estimated values.
              </div>
            )}

            {/* Continue */}
            <button
              onClick={handleContinue}
              className="w-full py-4 rounded-2xl bg-[#4ade80] text-[#0a0f0a] font-bold text-base flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all"
            >
              Run 2-Year Simulation
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Plant Ghost SVG ──────────────────────────────────────────

function PlantGhostSVG({ lightScore }: { lightScore: number }) {
  const isHealthy = lightScore >= 65;
  const isStressed = lightScore < 35;

  return (
    <svg
      width="160"
      height="220"
      viewBox="0 0 160 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.75 }}
    >
      {/* Pot */}
      <path d="M50 190 L55 220 H105 L110 190 Z" fill="#2d4a2d" opacity="0.8" />
      <rect x="45" y="182" width="70" height="12" rx="4" fill="#3d5a3d" opacity="0.8" />

      {/* Stem */}
      <path
        d={isStressed ? "M80 182 Q82 150 78 120 Q76 100 80 80" : "M80 182 Q80 150 80 120 Q80 100 80 80"}
        stroke={isStressed ? "#6b8f3a" : "#4ade80"}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Main leaves — healthy */}
      {isHealthy && (
        <>
          <ellipse cx="55" cy="130" rx="28" ry="14" fill="#4ade80" opacity="0.8" transform="rotate(-30 55 130)" />
          <ellipse cx="105" cy="120" rx="28" ry="14" fill="#22c55e" opacity="0.8" transform="rotate(30 105 120)" />
          <ellipse cx="60" cy="100" rx="22" ry="11" fill="#4ade80" opacity="0.7" transform="rotate(-20 60 100)" />
          <ellipse cx="100" cy="95" rx="22" ry="11" fill="#16a34a" opacity="0.7" transform="rotate(20 100 95)" />
          <ellipse cx="80" cy="75" rx="20" ry="10" fill="#4ade80" opacity="0.9" />
          <ellipse cx="80" cy="55" rx="16" ry="8" fill="#22c55e" opacity="0.8" />
        </>
      )}

      {/* Leaves — sub-optimal (slightly etiolated) */}
      {!isHealthy && !isStressed && (
        <>
          <ellipse cx="52" cy="140" rx="22" ry="10" fill="#a3e635" opacity="0.7" transform="rotate(-25 52 140)" />
          <ellipse cx="108" cy="130" rx="22" ry="10" fill="#84cc16" opacity="0.7" transform="rotate(25 108 130)" />
          <ellipse cx="58" cy="110" rx="18" ry="9" fill="#a3e635" opacity="0.6" transform="rotate(-15 58 110)" />
          <ellipse cx="102" cy="105" rx="18" ry="9" fill="#65a30d" opacity="0.6" transform="rotate(15 102 105)" />
          <ellipse cx="80" cy="85" rx="16" ry="8" fill="#a3e635" opacity="0.8" />
          <ellipse cx="80" cy="65" rx="14" ry="7" fill="#84cc16" opacity="0.7" />
          {/* Elongated stem indicating etiolation */}
          <path d="M80 182 Q83 155 77 125 Q74 105 80 80" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        </>
      )}

      {/* Leaves — stressed / dying */}
      {isStressed && (
        <>
          <ellipse cx="50" cy="150" rx="18" ry="8" fill="#ca8a04" opacity="0.5" transform="rotate(-20 50 150)" />
          <ellipse cx="110" cy="140" rx="18" ry="8" fill="#a16207" opacity="0.5" transform="rotate(20 110 140)" />
          <ellipse cx="60" cy="120" rx="14" ry="7" fill="#ca8a04" opacity="0.4" transform="rotate(-10 60 120)" />
          <ellipse cx="100" cy="115" rx="14" ry="7" fill="#92400e" opacity="0.4" transform="rotate(10 100 115)" />
          <ellipse cx="80" cy="95" rx="12" ry="6" fill="#ca8a04" opacity="0.5" />
          {/* Drooping leaves */}
          <path d="M80 182 Q85 160 75 130 Q70 110 80 90" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </>
      )}
    </svg>
  );
}
