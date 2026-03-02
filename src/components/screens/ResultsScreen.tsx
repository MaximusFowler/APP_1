"use client";
// ============================================================
// Screen 5: The Results — Survival report + Monetisation
// ============================================================

import { useState } from "react";
import {
  RefreshCw,
  ExternalLink,
  ShoppingCart,
  Leaf,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Zap,
  Sun,
} from "lucide-react";
import type { SurvivalPrediction, LightAnalysis, EnvironmentData } from "@/lib/types";
import { survivalScoreColor } from "@/lib/botanicalEngine";

interface ResultsScreenProps {
  prediction: SurvivalPrediction;
  lightAnalysis: LightAnalysis;
  environment: EnvironmentData;
  onRestart: () => void;
}

/** Circular progress ring for the survival score */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      {/* Background ring */}
      <circle cx="65" cy="65" r={radius} fill="none" stroke="#1e3a1e" strokeWidth="8" />
      {/* Progress ring */}
      <circle
        cx="65"
        cy="65"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 65 65)"
        style={{ transition: "stroke-dashoffset 1.5s ease" }}
      />
      {/* Score text */}
      <text x="65" y="60" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
        {score}
      </text>
      <text x="65" y="78" textAnchor="middle" fill="#6b7280" fontSize="11">
        SURVIVAL
      </text>
    </svg>
  );
}

export default function ResultsScreen({
  prediction,
  lightAnalysis,
  environment,
  onRestart,
}: ResultsScreenProps) {
  const [rescueExpanded, setRescueExpanded] = useState(false);
  const scoreColor = survivalScoreColor(prediction.survivalScore);
  const isLowSurvival = prediction.survivalScore < 50;

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Leaf className="w-5 h-5 text-[#4ade80]" />
          <span className="text-[#4ade80] text-xs font-medium tracking-widest uppercase">Aura Blooms</span>
        </div>
        <h1 className="text-2xl font-bold">Your Plant Report</h1>
        <p className="text-xs text-neutral-500 mt-1">
          {environment.windowOrientation !== "Unknown"
            ? `${environment.windowOrientation}-facing window · ${environment.distanceToWindow.toFixed(1)}m distance`
            : `${environment.distanceToWindow.toFixed(1)}m from window`}
        </p>
      </header>

      <div className="flex-1 px-6 space-y-4 pb-10">
        {/* Survival Score Card */}
        <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-5">
          <div className="flex items-center gap-6">
            <ScoreRing score={prediction.survivalScore} color={scoreColor} />
            <div className="flex-1">
              <div
                className="text-lg font-bold mb-1"
                style={{ color: scoreColor }}
              >
                {prediction.survivalScore >= 75
                  ? "Excellent Conditions"
                  : prediction.survivalScore >= 55
                  ? "Good Conditions"
                  : prediction.survivalScore >= 40
                  ? "Marginal Conditions"
                  : prediction.survivalScore >= 25
                  ? "Poor Conditions"
                  : "Critical Conditions"}
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {prediction.summary}
              </p>
            </div>
          </div>

          {/* Key milestones */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-[#0a0f0a] rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{lightAnalysis.lightScore}</div>
              <div className="text-xs text-neutral-500">Light Score</div>
            </div>
            <div className="bg-[#0a0f0a] rounded-xl p-3 text-center">
              <div className="text-lg font-bold" style={{ color: prediction.criticalMonth ? "#fb923c" : "#4ade80" }}>
                {prediction.criticalMonth ? `Mo ${prediction.criticalMonth}` : "Never"}
              </div>
              <div className="text-xs text-neutral-500">Critical Point</div>
            </div>
            <div className="bg-[#0a0f0a] rounded-xl p-3 text-center">
              <div className="text-lg font-bold" style={{ color: prediction.deathMonth ? "#f87171" : "#4ade80" }}>
                {prediction.deathMonth ? `Mo ${prediction.deathMonth}` : "Survives"}
              </div>
              <div className="text-xs text-neutral-500">2-Year Fate</div>
            </div>
          </div>
        </div>

        {/* ── RESCUE KIT (shown if survival < 50%) ── */}
        {isLowSurvival && prediction.rescueKit && (
          <div className="bg-gradient-to-br from-amber-950/40 to-[#111a11] border border-amber-800/40 rounded-2xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold">Rescue Kit Recommended</span>
              </div>
              <p className="text-xs text-neutral-400 mb-3">
                Your plant has a{" "}
                <span className="text-amber-400 font-semibold">{prediction.survivalScore}% survival rate</span>{" "}
                in this location. A grow light can boost it significantly.
              </p>

              <button
                onClick={() => setRescueExpanded(!rescueExpanded)}
                className="w-full py-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-amber-400/20 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                {rescueExpanded ? "Hide Details" : "View Rescue Kit"}
              </button>

              {rescueExpanded && (
                <div className="mt-3 space-y-3">
                  <div className="bg-[#0a0f0a] rounded-xl p-3">
                    <div className="font-semibold text-white text-sm mb-1">
                      {prediction.rescueKit.productName}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-2">
                      {prediction.rescueKit.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">
                        {prediction.rescueKit.priceRange}
                      </span>
                      <span className="text-xs text-[#4ade80]">
                        +{prediction.rescueKit.boostAmount} light score
                      </span>
                    </div>
                  </div>
                  <a
                    href={prediction.rescueKit.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-400 text-[#0a0f0a] font-bold text-sm hover:bg-amber-300 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Shop Grow Lights
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BETTER MATCH (alternative plant) ── */}
        {isLowSurvival && prediction.alternativePlant && (
          <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#4ade80]" />
              <span className="text-sm font-semibold text-white">Better Match for This Spot</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-4xl">{prediction.alternativePlant.imageEmoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-white">{prediction.alternativePlant.name}</div>
                <div className="text-xs text-neutral-500 italic mb-1">
                  {prediction.alternativePlant.scientificName}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {prediction.alternativePlant.reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCESS MESSAGE (high survival) ── */}
        {!isLowSurvival && (
          <div className="bg-[#111a11] border border-[#4ade80]/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-[#4ade80]" />
              <span className="text-sm font-semibold text-[#4ade80]">Great Location!</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This spot has excellent conditions for plant growth. Your plant should thrive here over the next 2 years with regular care.
            </p>
          </div>
        )}

        {/* Light Environment Details */}
        <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            Light Environment Details
          </h3>
          <div className="space-y-2">
            <DetailRow label="Light Level" value={lightAnalysis.lightLevel} />
            <DetailRow label="Window Orientation" value={environment.windowOrientation} />
            <DetailRow label="Distance to Window" value={`${environment.distanceToWindow.toFixed(1)}m`} />
            <DetailRow
              label="Inverse Square Attenuation"
              value={`${Math.round((1 / (environment.distanceToWindow ** 2)) * 100)}% of window brightness`}
            />
            {environment.gps && (
              <DetailRow
                label="Hemisphere"
                value={environment.gps.latitude >= 0 ? "Northern" : "Southern"}
              />
            )}
          </div>
        </div>

        {/* AI Observations */}
        <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#4ade80]" />
            AI Analysis
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed mb-3">
            {lightAnalysis.description}
          </p>
          <ul className="space-y-1.5">
            {lightAnalysis.observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-neutral-500">
                <span className="text-[#4ade80] mt-0.5 flex-shrink-0">•</span>
                {obs}
              </li>
            ))}
          </ul>
        </div>

        {/* Restart */}
        <button
          onClick={onRestart}
          className="w-full py-4 rounded-2xl border border-[#1e3a1e] text-neutral-400 font-medium flex items-center justify-center gap-2 hover:border-[#4ade80]/30 hover:text-white transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Scan Another Location
        </button>
      </div>
    </div>
  );
}

// ─── Detail Row ───────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-500">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
