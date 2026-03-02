"use client";
// ============================================================
// Aura Blooms — Main App Orchestrator (3-Page Flow)
// ============================================================

import { useState, useCallback } from "react";
import type { EnvironmentData, LightAnalysis, SurvivalPrediction } from "@/lib/types";
import { generatePrediction } from "@/lib/botanicalEngine";

import SetupPage from "./screens/SetupPage";
import AnalysisPage from "./screens/AnalysisPage";
import ReportPage from "./screens/ReportPage";

type Page = "setup" | "analysis" | "report";

const DEFAULT_ENV: EnvironmentData = {
  gps: null,
  windowOrientation: "Unknown",
  distanceToWindow: 2,
  plantSpotImage: null,
  lightSourceImage: null,
};

export default function AuraBlooms() {
  const [page, setPage] = useState<Page>("setup");
  const [environment, setEnvironment] = useState<EnvironmentData>(DEFAULT_ENV);
  const [lightAnalysis, setLightAnalysis] = useState<LightAnalysis | null>(null);
  const [prediction, setPrediction] = useState<SurvivalPrediction | null>(null);

  // Page 1 → 2
  const handleSetupComplete = useCallback((data: EnvironmentData) => {
    setEnvironment(data);
    setPage("analysis");
  }, []);

  // Page 2 → 3
  const handleAnalysisComplete = useCallback(
    (analysis: LightAnalysis) => {
      setLightAnalysis(analysis);
      const pred = generatePrediction(
        analysis,
        environment.gps,
        environment.windowOrientation,
        environment.distanceToWindow
      );
      setPrediction(pred);
      setPage("report");
    },
    [environment]
  );

  // Restart
  const handleRestart = useCallback(() => {
    setEnvironment(DEFAULT_ENV);
    setLightAnalysis(null);
    setPrediction(null);
    setPage("setup");
  }, []);

  switch (page) {
    case "setup":
      return <SetupPage onComplete={handleSetupComplete} />;

    case "analysis":
      return (
        <AnalysisPage
          environment={environment}
          onComplete={handleAnalysisComplete}
          onBack={() => setPage("setup")}
        />
      );

    case "report":
      if (!prediction || !lightAnalysis) return null;
      return (
        <ReportPage
          prediction={prediction}
          lightAnalysis={lightAnalysis}
          environment={environment}
          onRestart={handleRestart}
        />
      );
  }
}
