"use client";
// ============================================================
// Aura Blooms — Main App Orchestrator
// Manages screen navigation and global state
// ============================================================

import { useState, useCallback } from "react";
import type {
  AppScreen,
  EnvironmentData,
  LightAnalysis,
  SurvivalPrediction,
} from "@/lib/types";
import { generatePrediction } from "@/lib/botanicalEngine";

import LandingScreen from "./screens/LandingScreen";
import ContextScreen from "./screens/ContextScreen";
import ScanScreen from "./screens/ScanScreen";
import GhostScreen from "./screens/GhostScreen";
import SimulationScreen from "./screens/SimulationScreen";
import ResultsScreen from "./screens/ResultsScreen";

const DEFAULT_ENVIRONMENT: EnvironmentData = {
  gps: null,
  windowOrientation: "Unknown",
  distanceToWindow: 2,
  plantSpotImage: null,
  lightSourceImage: null,
};

export default function AuraBlooms() {
  const [screen, setScreen] = useState<AppScreen>("context");
  const [environment, setEnvironment] = useState<EnvironmentData>(DEFAULT_ENVIRONMENT);
  const [lightAnalysis, setLightAnalysis] = useState<LightAnalysis | null>(null);
  const [prediction, setPrediction] = useState<SurvivalPrediction | null>(null);

  // ── Screen 1 → 2: Context complete ──────────────────────
  const handleContextComplete = useCallback(
    (data: Pick<EnvironmentData, "gps" | "windowOrientation" | "distanceToWindow">) => {
      setEnvironment((prev) => ({ ...prev, ...data }));
      setScreen("scan");
    },
    []
  );

  // ── Screen 2 → 3: Scan complete ─────────────────────────
  const handleScanComplete = useCallback(
    (plantSpotImage: string | null, lightSourceImage: string | null) => {
      setEnvironment((prev) => ({ ...prev, plantSpotImage, lightSourceImage }));
      setScreen("ghost");
    },
    []
  );

  // ── Screen 3 → 4: Analysis complete ─────────────────────
  const handleAnalysisComplete = useCallback(
    (analysis: LightAnalysis) => {
      setLightAnalysis(analysis);
      // Generate the full 24-month prediction
      const pred = generatePrediction(
        analysis,
        environment.gps,
        environment.windowOrientation,
        environment.distanceToWindow
      );
      setPrediction(pred);
      setScreen("simulation");
    },
    [environment]
  );

  // ── Screen 4 → 5: Simulation complete ───────────────────
  const handleSimulationComplete = useCallback(() => {
    setScreen("results");
  }, []);

  // ── Restart ──────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    setEnvironment(DEFAULT_ENVIRONMENT);
    setLightAnalysis(null);
    setPrediction(null);
    setScreen("context");
  }, []);

  // ── Render ───────────────────────────────────────────────
  switch (screen) {
    case "context":
      return <ContextScreen onComplete={handleContextComplete} />;

    case "scan":
      return (
        <ScanScreen
          onComplete={handleScanComplete}
          onBack={() => setScreen("context")}
        />
      );

    case "ghost":
      return (
        <GhostScreen
          environment={environment}
          onAnalysisComplete={handleAnalysisComplete}
          onBack={() => setScreen("scan")}
        />
      );

    case "simulation":
      if (!prediction) return null;
      return (
        <SimulationScreen
          prediction={prediction}
          onComplete={handleSimulationComplete}
          onBack={() => setScreen("ghost")}
        />
      );

    case "results":
      if (!prediction || !lightAnalysis) return null;
      return (
        <ResultsScreen
          prediction={prediction}
          lightAnalysis={lightAnalysis}
          environment={environment}
          onRestart={handleRestart}
        />
      );

    default:
      return <LandingScreen onStart={() => setScreen("context")} />;
  }
}
