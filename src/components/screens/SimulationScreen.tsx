"use client";
// ============================================================
// Screen 4: The Simulation — 24-month growth timeline slider
// ============================================================

import { useState, useMemo } from "react";
import { ChevronRight, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SurvivalPrediction, PlantState } from "@/lib/types";
import { survivalScoreColor } from "@/lib/botanicalEngine";

interface SimulationScreenProps {
  prediction: SurvivalPrediction;
  onComplete: () => void;
  onBack: () => void;
}

/** Returns a CSS transform string for the plant ghost at a given state */
function plantTransform(state: PlantState): string {
  return `scale(${state.scale})`;
}

/** Returns a CSS filter string for the plant ghost at a given state */
function plantFilter(state: PlantState): string {
  return `hue-rotate(${state.hueRotate}deg) saturate(${state.saturate}%) brightness(${state.brightness}%)`;
}

/** Stage badge colour */
function stageBadgeStyle(stage: PlantState["stage"]): { bg: string; text: string } {
  switch (stage) {
    case "Thriving": return { bg: "rgba(74,222,128,0.15)", text: "#4ade80" };
    case "Healthy": return { bg: "rgba(163,230,53,0.15)", text: "#a3e635" };
    case "Adapting": return { bg: "rgba(250,204,21,0.15)", text: "#facc15" };
    case "Stressed": return { bg: "rgba(251,146,60,0.15)", text: "#fb923c" };
    case "Etiolated": return { bg: "rgba(251,146,60,0.15)", text: "#fb923c" };
    case "Declining": return { bg: "rgba(248,113,113,0.15)", text: "#f87171" };
    case "Critical": return { bg: "rgba(239,68,68,0.15)", text: "#ef4444" };
    case "Dead": return { bg: "rgba(100,100,100,0.15)", text: "#6b7280" };
  }
}

export default function SimulationScreen({ prediction, onComplete, onBack }: SimulationScreenProps) {
  const [selectedMonth, setSelectedMonth] = useState(1);

  const currentState = useMemo(
    () => prediction.timeline[selectedMonth - 1],
    [prediction.timeline, selectedMonth]
  );

  const prevState = useMemo(
    () => (selectedMonth > 1 ? prediction.timeline[selectedMonth - 2] : null),
    [prediction.timeline, selectedMonth]
  );

  const healthDelta = prevState ? currentState.health - prevState.health : 0;
  const badgeStyle = stageBadgeStyle(currentState.stage);
  const scoreColor = survivalScoreColor(prediction.survivalScore);

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-10 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-neutral-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase tracking-widest">Step 4 of 4</div>
          <div className="text-sm font-semibold text-white mt-0.5">2-Year Simulation</div>
        </div>
        <div className="w-5" />
      </header>

      {/* Plant Ghost Viewport */}
      <div className="px-6 mb-4">
        <div
          className="relative rounded-2xl overflow-hidden bg-[#111a11] border border-[#1e3a1e] flex items-end justify-center"
          style={{ height: "280px" }}
        >
          {/* Ambient glow based on health */}
          <div
            className="absolute inset-0 transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse at 50% 90%, ${
                currentState.health >= 65
                  ? "rgba(74,222,128,0.2)"
                  : currentState.health >= 35
                  ? "rgba(250,204,21,0.15)"
                  : "rgba(248,113,113,0.1)"
              }, transparent 70%)`,
            }}
          />

          {/* Plant Ghost */}
          <div
            className="relative pb-6 transition-all duration-700"
            style={{
              transform: plantTransform(currentState),
              filter: plantFilter(currentState),
              opacity: currentState.opacity,
              transformOrigin: "bottom center",
            }}
          >
            <SimulationPlantSVG health={currentState.health} month={selectedMonth} />
          </div>

          {/* Month badge */}
          <div className="absolute top-4 left-4 bg-[#0a0f0a]/80 backdrop-blur-sm border border-[#1e3a1e] rounded-xl px-3 py-2">
            <div className="text-lg font-bold text-white">Month {selectedMonth}</div>
            <div className="text-xs text-neutral-500">
              {monthLabel(selectedMonth)}
            </div>
          </div>

          {/* Stage badge */}
          <div className="absolute top-4 right-4">
            <span
              className="text-xs px-2.5 py-1.5 rounded-full font-semibold"
              style={{ background: badgeStyle.bg, color: badgeStyle.text }}
            >
              {currentState.stage}
            </span>
          </div>

          {/* Health delta indicator */}
          {prevState && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1">
              {healthDelta > 0 ? (
                <TrendingUp className="w-4 h-4 text-[#4ade80]" />
              ) : healthDelta < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <Minus className="w-4 h-4 text-neutral-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  healthDelta > 0 ? "text-[#4ade80]" : healthDelta < 0 ? "text-red-400" : "text-neutral-500"
                }`}
              >
                {healthDelta > 0 ? "+" : ""}{healthDelta}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="px-6 mb-4">
        <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-neutral-500">Month 1</span>
            <span className="text-sm font-semibold text-white">
              Drag to simulate growth
            </span>
            <span className="text-xs text-neutral-500">Month 24</span>
          </div>

          <input
            type="range"
            min={1}
            max={24}
            step={1}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full accent-[#4ade80] cursor-pointer"
            style={{ height: "6px" }}
          />

          {/* Month markers */}
          <div className="flex justify-between mt-2">
            {[1, 6, 12, 18, 24].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`text-xs transition-colors ${
                  selectedMonth === m ? "text-[#4ade80] font-semibold" : "text-neutral-600 hover:text-neutral-400"
                }`}
              >
                {m}mo
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Health Stats */}
      <div className="px-6 mb-4">
        <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Plant Health</span>
            <span className="text-2xl font-bold" style={{ color: survivalScoreColor(currentState.health) }}>
              {currentState.health}%
            </span>
          </div>

          {/* Health bar */}
          <div className="h-3 bg-[#0a0f0a] rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${currentState.health}%`,
                background: survivalScoreColor(currentState.health),
              }}
            />
          </div>

          {/* Symptoms */}
          {currentState.symptoms.length > 0 && (
            <div className="space-y-1">
              {currentState.symptoms.map((symptom, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="text-amber-400">⚠</span>
                  {symptom}
                </div>
              ))}
            </div>
          )}

          {currentState.symptoms.length === 0 && (
            <div className="text-xs text-[#4ade80]">✓ No stress symptoms detected at this stage</div>
          )}
        </div>
      </div>

      {/* Timeline mini-chart */}
      <div className="px-6 mb-4">
        <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-4">
          <div className="text-xs text-neutral-500 mb-3">24-Month Health Trajectory</div>
          <div className="flex items-end gap-0.5 h-12">
            {prediction.timeline.map((state) => (
              <button
                key={state.month}
                onClick={() => setSelectedMonth(state.month)}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${Math.max(4, state.health)}%`,
                  background:
                    state.month === selectedMonth
                      ? "#4ade80"
                      : survivalScoreColor(state.health),
                  opacity: state.month === selectedMonth ? 1 : 0.5,
                }}
                title={`Month ${state.month}: ${state.health}%`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-neutral-600 mt-1">
            <span>Now</span>
            <span className="font-semibold" style={{ color: scoreColor }}>
              24mo avg: {prediction.survivalScore}%
            </span>
            <span>2 Years</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-8">
        <button
          onClick={onComplete}
          className="w-full py-4 rounded-2xl bg-[#4ade80] text-[#0a0f0a] font-bold text-base flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all"
        >
          See Full Report
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Simulation Plant SVG ─────────────────────────────────────

function SimulationPlantSVG({ health, month }: { health: number; month: number }) {
  // Leaf count grows with month (up to 8 leaves at month 24 if healthy)
  const leafCount = health <= 0 ? 0 : Math.max(2, Math.min(8, Math.floor(2 + (month / 24) * 6 * (health / 100))));
  const stemHeight = health <= 0 ? 30 : Math.min(120, 40 + (month / 24) * 80 * (health / 100));
  const leafColor = health >= 65 ? "#4ade80" : health >= 35 ? "#a3e635" : "#ca8a04";
  const stemColor = health >= 65 ? "#22c55e" : health >= 35 ? "#84cc16" : "#92400e";

  return (
    <svg width="140" height="200" viewBox="0 0 140 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pot */}
      <path d="M45 175 L50 200 H90 L95 175 Z" fill="#2d4a2d" opacity="0.8" />
      <rect x="40" y="168" width="60" height="10" rx="3" fill="#3d5a3d" opacity="0.8" />

      {/* Stem */}
      {health > 0 && (
        <line
          x1="70"
          y1="168"
          x2="70"
          y2={168 - stemHeight}
          stroke={stemColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />
      )}

      {/* Leaves */}
      {Array.from({ length: leafCount }).map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const yPos = 168 - stemHeight * ((i + 1) / (leafCount + 1));
        const leafSize = 16 + (i / leafCount) * 8;
        const angle = side * (25 + (i % 3) * 10);
        return (
          <ellipse
            key={i}
            cx={70 + side * (leafSize * 0.6)}
            cy={yPos}
            rx={leafSize}
            ry={leafSize * 0.45}
            fill={leafColor}
            opacity={0.7 + (i / leafCount) * 0.2}
            transform={`rotate(${angle} ${70 + side * (leafSize * 0.6)} ${yPos})`}
          />
        );
      })}

      {/* Dead state — fallen leaves */}
      {health <= 0 && (
        <>
          <ellipse cx="45" cy="185" rx="12" ry="5" fill="#6b7280" opacity="0.4" transform="rotate(-15 45 185)" />
          <ellipse cx="95" cy="188" rx="10" ry="4" fill="#6b7280" opacity="0.3" transform="rotate(10 95 188)" />
        </>
      )}
    </svg>
  );
}

// ─── Month Label ──────────────────────────────────────────────

function monthLabel(month: number): string {
  const now = new Date();
  const future = new Date(now.getFullYear(), now.getMonth() + month, 1);
  return future.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
