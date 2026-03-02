"use client";
// ============================================================
// Page 3: The Report — Simulation slider + Full results
// Award-winning: editorial layout, cinematic data viz
// ============================================================

import { useState, useMemo, useEffect } from "react";
import {
  RefreshCw, ExternalLink, ShoppingCart, Leaf,
  AlertTriangle, CheckCircle, TrendingUp, Sun,
  ChevronRight, X, Zap,
} from "lucide-react";
import type { SurvivalPrediction, LightAnalysis, EnvironmentData, PlantState } from "@/lib/types";
import { survivalScoreColor } from "@/lib/botanicalEngine";

interface ReportPageProps {
  prediction: SurvivalPrediction;
  lightAnalysis: LightAnalysis;
  environment: EnvironmentData;
  onRestart: () => void;
}

// ─── Circular Score Ring ──────────────────────────────────────

function ScoreRing({ score, color, size = 140 }: { score: number; color: string; size?: number }) {
  const [animated, setAnimated] = useState(0);
  const radius = size * 0.38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      const start = Date.now();
      const duration = 1800;
      const tick = () => {
        const progress = Math.min((Date.now() - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimated(Math.round(eased * score));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer decorative ring */}
      <circle cx={cx} cy={cy} r={radius + 10} fill="none" stroke="rgba(74,222,128,0.05)" strokeWidth="1" />
      {/* Background track */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(74,222,128,0.08)" strokeWidth="10" />
      {/* Progress arc */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: `drop-shadow(0 0 8px ${color}60)`, transition: "stroke-dashoffset 0.05s linear" }}
      />
      {/* Score */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize={size * 0.2} fontWeight="800">
        {animated}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(74,222,128,0.6)" fontSize={size * 0.07} fontWeight="600" letterSpacing="2">
        SURVIVAL
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="rgba(74,222,128,0.4)" fontSize={size * 0.065} fontWeight="500" letterSpacing="1">
        SCORE
      </text>
    </svg>
  );
}

// ─── Plant state CSS ──────────────────────────────────────────

function getPlantStyle(state: PlantState) {
  return {
    transform: `scale(${state.scale})`,
    filter: `hue-rotate(${state.hueRotate}deg) saturate(${state.saturate}%) brightness(${state.brightness}%)`,
    opacity: state.opacity,
    transformOrigin: "bottom center" as const,
    transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
  };
}

function stageBadge(stage: PlantState["stage"]): { bg: string; text: string; dot: string } {
  const map: Record<PlantState["stage"], { bg: string; text: string; dot: string }> = {
    Thriving:  { bg: "rgba(74,222,128,0.12)",  text: "#4ade80", dot: "#4ade80" },
    Healthy:   { bg: "rgba(163,230,53,0.12)",  text: "#a3e635", dot: "#a3e635" },
    Adapting:  { bg: "rgba(250,204,21,0.12)",  text: "#facc15", dot: "#facc15" },
    Stressed:  { bg: "rgba(251,146,60,0.12)",  text: "#fb923c", dot: "#fb923c" },
    Etiolated: { bg: "rgba(251,146,60,0.12)",  text: "#fb923c", dot: "#fb923c" },
    Declining: { bg: "rgba(248,113,113,0.12)", text: "#f87171", dot: "#f87171" },
    Critical:  { bg: "rgba(239,68,68,0.12)",   text: "#ef4444", dot: "#ef4444" },
    Dead:      { bg: "rgba(107,114,128,0.12)", text: "#6b7280", dot: "#6b7280" },
  };
  return map[stage];
}

export default function ReportPage({ prediction, lightAnalysis, environment, onRestart }: ReportPageProps) {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [rescueExpanded, setRescueExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"simulation" | "report">("simulation");

  const currentState = useMemo(
    () => prediction.timeline[selectedMonth - 1],
    [prediction.timeline, selectedMonth]
  );

  const scoreColor = survivalScoreColor(prediction.survivalScore);
  const isLowSurvival = prediction.survivalScore < 50;
  const badge = stageBadge(currentState.stage);

  // Month label
  const monthLabel = useMemo(() => {
    const now = new Date();
    const future = new Date(now.getFullYear(), now.getMonth() + selectedMonth, 1);
    return future.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }, [selectedMonth]);

  return (
    <div className="min-h-screen bg-[#050905] text-white flex flex-col">

      {/* ── HEADER ───────────────────────────────────────── */}
      <header className="relative z-10 px-6 pt-10 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-[#4ade80]" />
            </div>
            <span className="text-xs font-semibold text-[#4a5e4a]">Aura Blooms</span>
          </div>
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#4a5e4a] transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <RefreshCw className="w-3 h-3" />
            New Scan
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className="flex rounded-2xl p-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {(["simulation", "report"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize"
              style={{
                background: activeTab === tab ? "rgba(74,222,128,0.12)" : "transparent",
                color: activeTab === tab ? "#4ade80" : "#4a5e4a",
                border: activeTab === tab ? "1px solid rgba(74,222,128,0.2)" : "1px solid transparent",
              }}
            >
              {tab === "simulation" ? "2-Year Sim" : "Full Report"}
            </button>
          ))}
        </div>
      </header>

      {/* ── SIMULATION TAB ───────────────────────────────── */}
      {activeTab === "simulation" && (
        <div className="flex-1 flex flex-col px-6 pb-8">

          {/* Plant Ghost Viewport */}
          <div
            className="relative rounded-3xl overflow-hidden mb-5 flex items-end justify-center"
            style={{
              height: "300px",
              background: "radial-gradient(ellipse at 50% 100%, rgba(74,222,128,0.06), transparent 70%), #080e08",
              border: "1px solid rgba(74,222,128,0.08)",
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-0 transition-all duration-700"
              style={{
                background: `radial-gradient(ellipse 60% 40% at 50% 90%, ${survivalScoreColor(currentState.health)}12, transparent)`,
              }}
            />

            {/* Grid floor */}
            <div
              className="absolute bottom-0 left-0 right-0 h-16 opacity-20"
              style={{
                backgroundImage: `linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
                maskImage: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
              }}
            />

            {/* Plant */}
            <div className="relative pb-6" style={getPlantStyle(currentState)}>
              <SimPlantSVG health={currentState.health} month={selectedMonth} />
            </div>

            {/* Month badge */}
            <div
              className="absolute top-4 left-4 px-3 py-2 rounded-xl"
              style={{ background: "rgba(5,9,5,0.85)", border: "1px solid rgba(74,222,128,0.12)" }}
            >
              <div className="text-base font-bold text-white">Month {selectedMonth}</div>
              <div className="text-xs text-[#4a5e4a]">{monthLabel}</div>
            </div>

            {/* Stage badge */}
            <div className="absolute top-4 right-4">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: badge.bg, border: `1px solid ${badge.dot}30` }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: badge.dot }} />
                <span className="text-xs font-semibold" style={{ color: badge.text }}>{currentState.stage}</span>
              </div>
            </div>

            {/* Health indicator */}
            <div className="absolute bottom-4 right-4">
              <div className="text-right">
                <div className="text-xl font-bold" style={{ color: survivalScoreColor(currentState.health) }}>
                  {currentState.health}%
                </div>
                <div className="text-[10px] text-[#4a5e4a]">health</div>
              </div>
            </div>
          </div>

          {/* Slider */}
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: "#080e08", border: "1px solid rgba(74,222,128,0.08)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#4a5e4a]">Drag to simulate</span>
              <span className="text-xs font-semibold text-white">
                {selectedMonth} / 24 months
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ "--range-progress": `${((selectedMonth - 1) / 23) * 100}%` } as React.CSSProperties}
            />

            {/* Quick jump buttons */}
            <div className="flex justify-between mt-3">
              {[1, 6, 12, 18, 24].map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className="text-xs px-2 py-1 rounded-lg transition-all"
                  style={{
                    background: selectedMonth === m ? "rgba(74,222,128,0.12)" : "transparent",
                    color: selectedMonth === m ? "#4ade80" : "#2a3a2a",
                    border: selectedMonth === m ? "1px solid rgba(74,222,128,0.2)" : "1px solid transparent",
                  }}
                >
                  {m}mo
                </button>
              ))}
            </div>
          </div>

          {/* Mini health chart */}
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: "#080e08", border: "1px solid rgba(74,222,128,0.08)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#4a5e4a]">24-Month Trajectory</span>
              <span className="text-xs font-semibold" style={{ color: scoreColor }}>
                Avg: {prediction.survivalScore}%
              </span>
            </div>
            <div className="flex items-end gap-0.5 h-14">
              {prediction.timeline.map((state) => (
                <button
                  key={state.month}
                  onClick={() => setSelectedMonth(state.month)}
                  className="flex-1 rounded-sm transition-all"
                  style={{
                    height: `${Math.max(6, state.health)}%`,
                    background: state.month === selectedMonth
                      ? "#4ade80"
                      : survivalScoreColor(state.health),
                    opacity: state.month === selectedMonth ? 1 : 0.45,
                    boxShadow: state.month === selectedMonth ? "0 0 8px rgba(74,222,128,0.5)" : "none",
                  }}
                />
              ))}
            </div>
            {/* Critical/death markers */}
            {prediction.criticalMonth && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Critical at month {prediction.criticalMonth}
              </div>
            )}
            {prediction.deathMonth && (
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-red-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Projected death at month {prediction.deathMonth}
              </div>
            )}
          </div>

          {/* Symptoms */}
          {currentState.symptoms.length > 0 && (
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.15)" }}
            >
              <div className="text-xs font-semibold text-amber-400 mb-2">Visible Symptoms</div>
              <div className="space-y-1.5">
                {currentState.symptoms.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#a3b8a3]">
                    <span className="text-amber-400">⚠</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentState.symptoms.length === 0 && (
            <div
              className="rounded-2xl p-3 mb-4 flex items-center gap-2"
              style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)" }}
            >
              <CheckCircle className="w-4 h-4 text-[#4ade80]" />
              <span className="text-xs text-[#4ade80]">No stress symptoms at this stage</span>
            </div>
          )}

          <button
            onClick={() => setActiveTab("report")}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
          >
            View Full Report
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ── REPORT TAB ───────────────────────────────────── */}
      {activeTab === "report" && (
        <div className="flex-1 px-6 pb-10 space-y-4">

          {/* Hero score card */}
          <div
            className="rounded-3xl p-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #080e08 0%, #0d160d 100%)",
              border: "1px solid rgba(74,222,128,0.1)",
            }}
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 80% 50%, ${scoreColor}08, transparent 60%)` }}
            />

            <div className="relative flex items-center gap-5">
              <ScoreRing score={prediction.survivalScore} color={scoreColor} size={120} />
              <div className="flex-1">
                <div className="text-lg font-bold text-white mb-1" style={{ color: scoreColor }}>
                  {prediction.survivalScore >= 75 ? "Excellent" :
                   prediction.survivalScore >= 55 ? "Good" :
                   prediction.survivalScore >= 40 ? "Marginal" :
                   prediction.survivalScore >= 25 ? "Poor" : "Critical"}
                </div>
                <p className="text-xs text-[#4a5e4a] leading-relaxed">{prediction.summary}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "Light Score", value: String(lightAnalysis.lightScore), color: scoreColor },
                { label: "Critical", value: prediction.criticalMonth ? `Mo ${prediction.criticalMonth}` : "Never", color: prediction.criticalMonth ? "#fb923c" : "#4ade80" },
                { label: "2yr Fate", value: prediction.deathMonth ? `Mo ${prediction.deathMonth}` : "Survives", color: prediction.deathMonth ? "#f87171" : "#4ade80" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(5,9,5,0.6)", border: "1px solid rgba(74,222,128,0.06)" }}
                >
                  <div className="text-base font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-[10px] text-[#2a3a2a] mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rescue Kit */}
          {isLowSurvival && prediction.rescueKit && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.06), rgba(8,14,8,1))", border: "1px solid rgba(251,191,36,0.2)" }}
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">Rescue Kit</span>
                  <span
                    className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}
                  >
                    {prediction.survivalScore}% survival
                  </span>
                </div>
                <p className="text-xs text-[#4a5e4a] mb-3 leading-relaxed">
                  A grow light can boost your light score by +{prediction.rescueKit.boostAmount} points, potentially saving your plant.
                </p>

                <button
                  onClick={() => setRescueExpanded(!rescueExpanded)}
                  className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    color: "#fbbf24",
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {rescueExpanded ? "Hide" : "View Rescue Kit"}
                </button>

                {rescueExpanded && (
                  <div className="mt-3 space-y-3">
                    <div
                      className="rounded-xl p-3"
                      style={{ background: "rgba(5,9,5,0.6)", border: "1px solid rgba(251,191,36,0.1)" }}
                    >
                      <div className="font-semibold text-white text-sm mb-1">{prediction.rescueKit.productName}</div>
                      <p className="text-xs text-[#4a5e4a] leading-relaxed mb-2">{prediction.rescueKit.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#4a5e4a]">{prediction.rescueKit.priceRange}</span>
                        <span className="text-[#4ade80]">+{prediction.rescueKit.boostAmount} light score</span>
                      </div>
                    </div>
                    <a
                      href={prediction.rescueKit.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all"
                      style={{ background: "#fbbf24", color: "#050905" }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Shop Grow Lights
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alternative plant */}
          {isLowSurvival && prediction.alternativePlant && (
            <div
              className="rounded-2xl p-4"
              style={{ background: "#080e08", border: "1px solid rgba(74,222,128,0.1)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#4ade80]" />
                <span className="text-sm font-semibold text-white">Better Match</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-4xl">{prediction.alternativePlant.imageEmoji}</div>
                <div>
                  <div className="font-semibold text-white text-sm">{prediction.alternativePlant.name}</div>
                  <div className="text-xs text-[#4a5e4a] italic mb-1">{prediction.alternativePlant.scientificName}</div>
                  <p className="text-xs text-[#4a5e4a] leading-relaxed">{prediction.alternativePlant.reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success message */}
          {!isLowSurvival && (
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)" }}
            >
              <CheckCircle className="w-5 h-5 text-[#4ade80] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-[#4ade80] mb-1">Great Location!</div>
                <p className="text-xs text-[#4a5e4a] leading-relaxed">
                  This spot has excellent conditions. Your plant should thrive here over the next 2 years with regular care.
                </p>
              </div>
            </div>
          )}

          {/* Environment details */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "#080e08", border: "1px solid rgba(74,222,128,0.08)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Environment</span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Light Level", value: lightAnalysis.lightLevel },
                { label: "Window Faces", value: environment.windowOrientation },
                { label: "Distance", value: `${environment.distanceToWindow.toFixed(1)}m` },
                { label: "ISL Factor", value: `${Math.round((1 / environment.distanceToWindow ** 2) * 100)}% intensity` },
                ...(environment.gps ? [{ label: "Hemisphere", value: environment.gps.latitude >= 0 ? "Northern" : "Southern" }] : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-[#4a5e4a]">{row.label}</span>
                  <span className="text-xs font-medium text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI analysis */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "#080e08", border: "1px solid rgba(74,222,128,0.08)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-[#4ade80]" />
              <span className="text-sm font-semibold text-white">AI Analysis</span>
            </div>
            <p className="text-xs text-[#4a5e4a] leading-relaxed mb-3">{lightAnalysis.description}</p>
            <div className="space-y-2">
              {lightAnalysis.observations.map((obs, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#4a5e4a]">
                  <div className="w-1 h-1 rounded-full bg-[#4ade80] mt-1.5 flex-shrink-0" />
                  {obs}
                </div>
              ))}
            </div>
          </div>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="btn-ghost w-full py-4 flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Scan Another Location
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Simulation Plant SVG ─────────────────────────────────────

function SimPlantSVG({ health, month }: { health: number; month: number }) {
  const leafCount = health <= 0 ? 0 : Math.max(2, Math.min(10, Math.floor(2 + (month / 24) * 8 * (health / 100))));
  const stemH = health <= 0 ? 20 : Math.min(130, 35 + (month / 24) * 95 * (health / 100));
  const leafColor = health >= 65 ? "#4ade80" : health >= 35 ? "#a3e635" : "#ca8a04";
  const stemColor = health >= 65 ? "#22c55e" : health >= 35 ? "#84cc16" : "#92400e";

  return (
    <svg width="150" height="210" viewBox="0 0 150 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M48 185 L53 210 H97 L102 185 Z" fill="#1a2e1a" opacity="0.9" />
      <rect x="43" y="178" width="64" height="10" rx="4" fill="#243824" opacity="0.9" />
      {health > 0 && (
        <line x1="75" y1="178" x2="75" y2={178 - stemH} stroke={stemColor} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      )}
      {Array.from({ length: leafCount }).map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const yPos = 178 - stemH * ((i + 1) / (leafCount + 1));
        const leafSize = 14 + (i / Math.max(leafCount, 1)) * 10;
        const angle = side * (22 + (i % 3) * 8);
        return (
          <ellipse
            key={i}
            cx={75 + side * (leafSize * 0.55)}
            cy={yPos}
            rx={leafSize}
            ry={leafSize * 0.42}
            fill={leafColor}
            opacity={0.65 + (i / Math.max(leafCount, 1)) * 0.25}
            transform={`rotate(${angle} ${75 + side * (leafSize * 0.55)} ${yPos})`}
          />
        );
      })}
      {health <= 0 && (
        <>
          <ellipse cx="48" cy="192" rx="12" ry="5" fill="#6b7280" opacity="0.3" transform="rotate(-12 48 192)" />
          <ellipse cx="102" cy="195" rx="10" ry="4" fill="#6b7280" opacity="0.25" transform="rotate(8 102 195)" />
        </>
      )}
    </svg>
  );
}
