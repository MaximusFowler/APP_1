"use client";
// ============================================================
// Page 1: The Setup — Hero + Image Upload + Environment Config
// Award-winning design: cinematic, editorial, premium botanical
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import {
  MapPin, Compass, Camera, Upload, ChevronRight,
  Leaf, Zap, Eye, TrendingUp, X, RefreshCw, CheckCircle2,
  AlertCircle, Sun, Move,
} from "lucide-react";
import type { GPSCoordinates, WindowOrientation, EnvironmentData } from "@/lib/types";

interface SetupPageProps {
  onComplete: (data: EnvironmentData) => void;
}

const ORIENTATIONS: { value: WindowOrientation; label: string; short: string; score: number }[] = [
  { value: "S",  label: "South",      short: "S",  score: 100 },
  { value: "SE", label: "South-East", short: "SE", score: 90  },
  { value: "SW", label: "South-West", short: "SW", score: 88  },
  { value: "E",  label: "East",       short: "E",  score: 75  },
  { value: "W",  label: "West",       short: "W",  score: 72  },
  { value: "NE", label: "North-East", short: "NE", score: 45  },
  { value: "NW", label: "North-West", short: "NW", score: 42  },
  { value: "N",  label: "North",      short: "N",  score: 30  },
];

type UploadTarget = "plant" | "light";

export default function SetupPage({ onComplete }: SetupPageProps) {
  // ── State ────────────────────────────────────────────────
  const [plantImage, setPlantImage] = useState<string | null>(null);
  const [lightImage, setLightImage] = useState<string | null>(null);
  const [gps, setGps] = useState<GPSCoordinates | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [orientation, setOrientation] = useState<WindowOrientation | null>(null);
  const [distance, setDistance] = useState<number>(2);
  const [dragOver, setDragOver] = useState<UploadTarget | null>(null);
  const [cameraTarget, setCameraTarget] = useState<UploadTarget | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=hero, 2=upload, 3=config
  const [mounted, setMounted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const plantInputRef = useRef<HTMLInputElement>(null);
  const lightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Use a timeout to avoid synchronous setState in effect
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  // ── GPS ──────────────────────────────────────────────────
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsStatus("error"); return; }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsStatus("success");
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── File upload ──────────────────────────────────────────
  const processFile = useCallback((file: File, target: UploadTarget) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (target === "plant") setPlantImage(result);
      else setLightImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, target: UploadTarget) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, target);
    e.target.value = "";
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent, target: UploadTarget) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file, target);
  }, [processFile]);

  // ── Camera ───────────────────────────────────────────────
  const startCamera = useCallback(async (target: UploadTarget) => {
    setCameraTarget(target);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError("Camera access denied");
      setCameraTarget(null);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setCameraTarget(null);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraTarget) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (cameraTarget === "plant") setPlantImage(dataUrl);
    else setLightImage(dataUrl);
    stopCamera();
  }, [cameraTarget, stopCamera]);

  // ── Submit ───────────────────────────────────────────────
  const canProceed = orientation !== null;

  const handleSubmit = () => {
    if (!orientation) return;
    onComplete({
      gps,
      windowOrientation: orientation,
      distanceToWindow: distance,
      plantSpotImage: plantImage,
      lightSourceImage: lightImage,
    });
  };

  // ── ISL preview ──────────────────────────────────────────
  const islFactor = Math.round((1 / (distance * distance)) * 100);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050905] text-white overflow-x-hidden">

      {/* ── HERO SECTION ─────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Background: radial botanical gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(74,222,128,0.12),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_80%,rgba(74,222,128,0.06),transparent)]" />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(74,222,128,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 pt-10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-[#4ade80]" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">Aura Blooms</span>
          </div>
          <div className="label-caps text-[#4a5e4a]">Beta</div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-8 pt-4">

          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 self-start animate-fade-up"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="label-caps text-[#4ade80]">AI Botanical Analysis</span>
          </div>

          {/* Headline */}
          <h1 className="display-xl mb-4 animate-fade-up delay-100" style={{ opacity: 0 }}>
            Will your plant<br />
            <span className="text-gradient-green glow-text-green">survive here?</span>
          </h1>

          {/* Sub */}
          <p className="text-[#a3b8a3] text-base leading-relaxed mb-8 max-w-sm animate-fade-up delay-200" style={{ opacity: 0 }}>
            Upload two photos. Get a precise 2-year survival prediction powered by botanical physics and Gemini Vision AI.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-10 animate-fade-up delay-300" style={{ opacity: 0 }}>
            {[
              { icon: <Zap className="w-3 h-3" />, label: "Gemini Vision" },
              { icon: <Eye className="w-3 h-3" />, label: "Ghost Preview" },
              { icon: <TrendingUp className="w-3 h-3" />, label: "24-Month Sim" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#a3b8a3]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-[#4ade80]">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => setStep(2)}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 animate-fade-up delay-400"
            style={{ opacity: 0 }}
          >
            Start Analysis
            <ChevronRight className="w-5 h-5" />
          </button>

          <p className="text-center text-xs text-[#2a3a2a] mt-4 animate-fade-up delay-500" style={{ opacity: 0 }}>
            No account required · Works offline after load
          </p>
        </div>

        {/* Floating plant illustration */}
        <div className="absolute bottom-0 right-0 w-48 h-64 pointer-events-none opacity-20 animate-float">
          <HeroPlantSVG />
        </div>

        {/* Scroll indicator */}
        {step === 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in delay-800" style={{ opacity: 0 }}>
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-[#4ade80]/40" />
            <span className="label-caps text-[#2a3a2a]">Scroll to begin</span>
          </div>
        )}
      </section>

      {/* ── UPLOAD SECTION ───────────────────────────────── */}
      <section className="relative px-6 py-12">

        {/* Section header */}
        <div className="mb-8">
          <div className="label-caps text-[#4ade80] mb-2">Step 01 — Capture</div>
          <h2 className="display-md text-white">
            Show us your<br />
            <span className="text-gradient-green">space</span>
          </h2>
          <p className="text-[#4a5e4a] text-sm mt-2 leading-relaxed">
            Upload or photograph two images to begin the analysis.
          </p>
        </div>

        {/* Upload cards */}
        <div className="space-y-4 mb-8">

          {/* Plant Spot Card */}
          <UploadCard
            target="plant"
            label="Plant Location"
            description="The corner or shelf where you'll place your plant"
            icon={<Leaf className="w-5 h-5" />}
            accentColor="#4ade80"
            image={plantImage}
            dragOver={dragOver === "plant"}
            onDragOver={(e) => { e.preventDefault(); setDragOver("plant"); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, "plant")}
            onFileClick={() => plantInputRef.current?.click()}
            onCameraClick={() => startCamera("plant")}
            onClear={() => setPlantImage(null)}
          />

          {/* Light Source Card */}
          <UploadCard
            target="light"
            label="Light Source"
            description="The nearest window or primary light source"
            icon={<Sun className="w-5 h-5" />}
            accentColor="#fbbf24"
            image={lightImage}
            dragOver={dragOver === "light"}
            onDragOver={(e) => { e.preventDefault(); setDragOver("light"); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, "light")}
            onFileClick={() => lightInputRef.current?.click()}
            onCameraClick={() => startCamera("light")}
            onClear={() => setLightImage(null)}
          />
        </div>

        {/* Hidden file inputs */}
        <input ref={plantInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileInput(e, "plant")} />
        <input ref={lightInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileInput(e, "light")} />

        {/* Skip hint */}
        <p className="text-center text-xs text-[#2a3a2a] mb-8">
          Photos are optional — the AI will use estimated values if skipped
        </p>
      </section>

      {/* ── CONFIG SECTION ───────────────────────────────── */}
      <section className="relative px-6 pb-12">

        {/* Section header */}
        <div className="mb-8">
          <div className="label-caps text-[#4ade80] mb-2">Step 02 — Configure</div>
          <h2 className="display-md text-white">
            Set the<br />
            <span className="text-gradient-green">parameters</span>
          </h2>
        </div>

        <div className="space-y-4">

          {/* GPS Card */}
          <div className="glass-raised rounded-2xl p-5 border-gradient">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4ade80]/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#4ade80]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Location</div>
                  <div className="text-xs text-[#4a5e4a]">Hemisphere & seasonal light</div>
                </div>
              </div>
              {gpsStatus === "success" && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/20">
                  <CheckCircle2 className="w-3 h-3 text-[#4ade80]" />
                  <span className="label-caps text-[#4ade80]">Locked</span>
                </div>
              )}
            </div>

            {gpsStatus === "success" && gps ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Latitude", value: `${gps.latitude.toFixed(3)}°` },
                  { label: "Longitude", value: `${gps.longitude.toFixed(3)}°` },
                  { label: "Accuracy", value: `±${Math.round(gps.accuracy)}m` },
                ].map((item) => (
                  <div key={item.label} className="bg-[#050905] rounded-xl p-2.5 text-center">
                    <div className="text-xs font-mono font-semibold text-white">{item.value}</div>
                    <div className="text-[10px] text-[#4a5e4a] mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={handleGPS}
                disabled={gpsStatus === "loading"}
                className="w-full py-3 rounded-xl text-sm font-medium text-[#4ade80] transition-all disabled:opacity-50"
                style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}
              >
                {gpsStatus === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-[#4ade80] border-t-transparent rounded-full animate-spin" />
                    Locating…
                  </span>
                ) : "Connect GPS"}
              </button>
            )}

            {gpsStatus === "error" && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>Location unavailable — using northern hemisphere defaults</span>
              </div>
            )}
          </div>

          {/* Window Orientation Card */}
          <div className="glass-raised rounded-2xl p-5 border-gradient">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#4ade80]/10 flex items-center justify-center">
                <Compass className="w-4 h-4 text-[#4ade80]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Window Faces</div>
                <div className="text-xs text-[#4a5e4a]">Cardinal direction of nearest window</div>
              </div>
            </div>

            {/* Compass rose grid */}
            <div className="grid grid-cols-4 gap-2">
              {ORIENTATIONS.map((o) => {
                const isSelected = orientation === o.value;
                const barWidth = o.score;
                return (
                  <button
                    key={o.value}
                    onClick={() => setOrientation(o.value)}
                    className="relative rounded-xl p-3 text-center transition-all overflow-hidden"
                    style={{
                      background: isSelected ? "rgba(74,222,128,0.12)" : "rgba(5,9,5,0.8)",
                      border: isSelected ? "1px solid rgba(74,222,128,0.5)" : "1px solid rgba(74,222,128,0.08)",
                      boxShadow: isSelected ? "0 0 20px rgba(74,222,128,0.15)" : "none",
                    }}
                  >
                    {/* Light score bar */}
                    <div
                      className="absolute bottom-0 left-0 h-0.5 transition-all duration-500"
                      style={{
                        width: isSelected ? `${barWidth}%` : "0%",
                        background: "linear-gradient(90deg, #4ade80, #86efac)",
                      }}
                    />
                    <div className={`text-base font-bold mb-0.5 ${isSelected ? "text-[#4ade80]" : "text-[#4a5e4a]"}`}>
                      {o.short}
                    </div>
                    <div className={`text-[9px] ${isSelected ? "text-[#86efac]" : "text-[#2a3a2a]"}`}>
                      {o.score}%
                    </div>
                  </button>
                );
              })}
            </div>

            {orientation && (
              <div className="mt-3 text-xs text-[#4a5e4a] text-center">
                {ORIENTATIONS.find(o => o.value === orientation)?.label} window selected
              </div>
            )}
          </div>

          {/* Distance Card */}
          <div className="glass-raised rounded-2xl p-5 border-gradient">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#4ade80]/10 flex items-center justify-center">
                <Move className="w-4 h-4 text-[#4ade80]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Distance to Window</div>
                <div className="text-xs text-[#4a5e4a]">Inverse Square Law applies</div>
              </div>
            </div>

            {/* Distance display */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <span className="text-4xl font-bold text-white">{distance.toFixed(1)}</span>
                <span className="text-lg text-[#4a5e4a] ml-1">m</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#4ade80]">{islFactor}%</div>
                <div className="text-xs text-[#4a5e4a]">light intensity</div>
              </div>
            </div>

            <input
              type="range"
              min={0.3}
              max={8}
              step={0.1}
              value={distance}
              onChange={(e) => setDistance(parseFloat(e.target.value))}
              style={{ "--range-progress": `${((distance - 0.3) / 7.7) * 100}%` } as React.CSSProperties}
            />

            <div className="flex justify-between text-[10px] text-[#2a3a2a] mt-2">
              <span>0.3m — window sill</span>
              <span>8m — far corner</span>
            </div>

            {/* ISL visualisation */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full overflow-hidden bg-[#050905]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, islFactor)}%`,
                    background: islFactor > 60 ? "linear-gradient(90deg, #22c55e, #4ade80)" :
                                islFactor > 30 ? "linear-gradient(90deg, #ca8a04, #fbbf24)" :
                                "linear-gradient(90deg, #dc2626, #f87171)",
                  }}
                />
              </div>
              <span className="text-xs text-[#4a5e4a] whitespace-nowrap">I = I₀/d²</span>
            </div>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={!canProceed}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
          >
            Analyse My Space
            <ChevronRight className="w-5 h-5" />
          </button>
          {!canProceed && (
            <p className="text-center text-xs text-[#4a5e4a]">
              Select a window orientation to continue
            </p>
          )}
        </div>
      </section>

      {/* ── CAMERA MODAL ─────────────────────────────────── */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="relative flex-1">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

            {/* Overlay frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-4/5 h-3/5 rounded-2xl"
                style={{
                  border: `2px solid ${cameraTarget === "plant" ? "#4ade80" : "#fbbf24"}`,
                  boxShadow: `0 0 0 9999px rgba(0,0,0,0.5)`,
                }}
              />
            </div>

            {/* Label */}
            <div className="absolute bottom-32 left-0 right-0 flex justify-center">
              <div
                className="px-4 py-2 rounded-full text-xs font-medium backdrop-blur-sm"
                style={{
                  background: cameraTarget === "plant" ? "rgba(74,222,128,0.2)" : "rgba(251,191,36,0.2)",
                  border: `1px solid ${cameraTarget === "plant" ? "rgba(74,222,128,0.4)" : "rgba(251,191,36,0.4)"}`,
                  color: cameraTarget === "plant" ? "#4ade80" : "#fbbf24",
                }}
              >
                {cameraTarget === "plant" ? "Frame the plant placement area" : "Frame the window or light source"}
              </div>
            </div>

            {/* Close */}
            <button
              onClick={stopCamera}
              className="absolute top-10 right-5 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Capture button */}
          <div className="p-8 flex justify-center bg-black">
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: cameraTarget === "plant" ? "#4ade80" : "#fbbf24",
                boxShadow: `0 0 0 4px rgba(0,0,0,1), 0 0 0 6px ${cameraTarget === "plant" ? "#4ade80" : "#fbbf24"}`,
              }}
            >
              <Camera className="w-8 h-8 text-black" />
            </button>
          </div>

          {cameraError && (
            <div className="absolute top-20 left-4 right-4 bg-red-900/80 text-red-300 text-xs p-3 rounded-xl">
              {cameraError}
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ─── Upload Card Component ────────────────────────────────────

interface UploadCardProps {
  target: UploadTarget;
  label: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  image: string | null;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileClick: () => void;
  onCameraClick: () => void;
  onClear: () => void;
}

function UploadCard({
  label, description, icon, accentColor, image,
  dragOver, onDragOver, onDragLeave, onDrop,
  onFileClick, onCameraClick, onClear,
}: UploadCardProps) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${dragOver ? "scale-[1.01]" : ""}`}
      style={{
        border: `1px solid ${dragOver ? accentColor : "rgba(74,222,128,0.1)"}`,
        boxShadow: dragOver ? `0 0 30px ${accentColor}20` : "none",
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {image ? (
        /* ── Has image ── */
        <div className="relative h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Label */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
            >
              <span style={{ color: accentColor }}>{icon}</span>
            </div>
            <span className="text-xs font-semibold text-white">{label}</span>
          </div>

          {/* Success badge */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
          >
            <CheckCircle2 className="w-3 h-3" style={{ color: accentColor }} />
            <span className="label-caps" style={{ color: accentColor }}>Captured</span>
          </div>

          {/* Actions */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              onClick={onClear}
              className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Empty state ── */
        <div
          className="upload-zone rounded-2xl p-6"
          style={{ background: `radial-gradient(ellipse at center, ${accentColor}04 0%, transparent 70%)` }}
        >
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20` }}
          >
            <span style={{ color: accentColor }}>{icon}</span>
          </div>

          {/* Text */}
          <div className="text-center mb-5">
            <div className="text-sm font-semibold text-white mb-1">{label}</div>
            <div className="text-xs text-[#4a5e4a] leading-relaxed">{description}</div>
          </div>

          {/* Drag hint */}
          <div
            className="text-center text-xs mb-4 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <span className="text-[#2a3a2a]">Drag & drop an image here</span>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onFileClick}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: `${accentColor}08`,
                border: `1px solid ${accentColor}20`,
                color: accentColor,
              }}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
            <button
              onClick={onCameraClick}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: `${accentColor}08`,
                border: `1px solid ${accentColor}20`,
                color: accentColor,
              }}
            >
              <Camera className="w-3.5 h-3.5" />
              Camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hero Plant SVG ───────────────────────────────────────────

function HeroPlantSVG() {
  return (
    <svg viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M100 260 Q100 200 100 160 Q100 120 100 80" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <ellipse cx="65" cy="170" rx="40" ry="18" fill="#22c55e" opacity="0.5" transform="rotate(-30 65 170)" />
      <ellipse cx="135" cy="155" rx="40" ry="18" fill="#4ade80" opacity="0.5" transform="rotate(30 135 155)" />
      <ellipse cx="70" cy="130" rx="32" ry="14" fill="#16a34a" opacity="0.4" transform="rotate(-20 70 130)" />
      <ellipse cx="130" cy="120" rx="32" ry="14" fill="#4ade80" opacity="0.4" transform="rotate(20 130 120)" />
      <ellipse cx="75" cy="100" rx="28" ry="12" fill="#22c55e" opacity="0.5" transform="rotate(-15 75 100)" />
      <ellipse cx="125" cy="92" rx="28" ry="12" fill="#4ade80" opacity="0.5" transform="rotate(15 125 92)" />
      <ellipse cx="100" cy="75" rx="24" ry="11" fill="#4ade80" opacity="0.6" />
      <ellipse cx="100" cy="55" rx="18" ry="9" fill="#86efac" opacity="0.5" />
      <path d="M75 255 L80 280 H120 L125 255 Z" fill="#1a2e1a" opacity="0.7" />
      <rect x="70" y="248" width="60" height="10" rx="4" fill="#243824" opacity="0.7" />
    </svg>
  );
}
