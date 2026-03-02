"use client";
// ============================================================
// Screen 2: The Scan — Camera interface with overlay guides
// ============================================================

import { useState, useRef, useCallback } from "react";
import { Camera, RefreshCw, ChevronRight, Sun, Leaf, CheckCircle2, X } from "lucide-react";

interface ScanScreenProps {
  onComplete: (plantSpotImage: string | null, lightSourceImage: string | null) => void;
  onBack: () => void;
}

type ScanMode = "plant" | "light";

export default function ScanScreen({ onComplete, onBack }: ScanScreenProps) {
  const [mode, setMode] = useState<ScanMode>("plant");
  const [plantImage, setPlantImage] = useState<string | null>(null);
  const [lightImage, setLightImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Camera Controls ──────────────────────────────────────

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setCameraError(msg);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    if (mode === "plant") {
      setPlantImage(dataUrl);
    } else {
      setLightImage(dataUrl);
    }

    stopCamera();
    setCapturing(false);
  }, [mode, stopCamera]);

  const retake = useCallback(() => {
    if (mode === "plant") setPlantImage(null);
    else setLightImage(null);
    startCamera();
  }, [mode, startCamera]);

  // ── Navigation ───────────────────────────────────────────

  const handleNext = () => {
    if (mode === "plant" && plantImage) {
      setMode("light");
      return;
    }
    if (mode === "light") {
      onComplete(plantImage, lightImage);
    }
  };

  const canProceed =
    (mode === "plant" && plantImage !== null) ||
    (mode === "light" && lightImage !== null);

  const currentImage = mode === "plant" ? plantImage : lightImage;

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-10 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-neutral-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase tracking-widest">Step 2 of 4</div>
          <div className="text-sm font-semibold text-white mt-0.5">Scan Your Space</div>
        </div>
        <div className="w-5" />
      </header>

      {/* Progress tabs */}
      <div className="px-6 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => { stopCamera(); setMode("plant"); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              mode === "plant"
                ? "bg-[#4ade80]/20 border border-[#4ade80] text-[#4ade80]"
                : plantImage
                ? "bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80]/70"
                : "bg-[#111a11] border border-[#1e3a1e] text-neutral-500"
            }`}
          >
            {plantImage ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Leaf className="w-3.5 h-3.5" />}
            Plant Spot
          </button>
          <button
            onClick={() => { if (plantImage) { stopCamera(); setMode("light"); } }}
            disabled={!plantImage}
            className={`flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              mode === "light"
                ? "bg-amber-400/20 border border-amber-400 text-amber-400"
                : lightImage
                ? "bg-amber-400/10 border border-amber-400/30 text-amber-400/70"
                : "bg-[#111a11] border border-[#1e3a1e] text-neutral-500"
            }`}
          >
            {lightImage ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            Light Source
          </button>
        </div>
      </div>

      {/* Camera / Preview Area */}
      <div className="flex-1 px-6 flex flex-col">
        <div className="relative rounded-2xl overflow-hidden bg-[#111a11] border border-[#1e3a1e] flex-1 min-h-[300px] flex items-center justify-center">

          {/* Live camera feed */}
          {cameraActive && (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`border-2 rounded-xl w-3/4 h-3/4 ${
                    mode === "plant" ? "border-[#4ade80]" : "border-amber-400"
                  }`}
                  style={{ boxShadow: `0 0 0 9999px rgba(0,0,0,0.4)` }}
                />
              </div>
              {/* Guide label */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div
                  className={`px-4 py-2 rounded-full text-xs font-medium backdrop-blur-sm ${
                    mode === "plant"
                      ? "bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40"
                      : "bg-amber-400/20 text-amber-400 border border-amber-400/40"
                  }`}
                >
                  {mode === "plant"
                    ? "Frame the corner where the plant will sit"
                    : "Frame the window or light source"}
                </div>
              </div>
            </>
          )}

          {/* Captured photo preview */}
          {!cameraActive && currentImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage}
              alt="Captured"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Idle state */}
          {!cameraActive && !currentImage && (
            <div className="text-center p-8">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  mode === "plant" ? "bg-[#4ade80]/10" : "bg-amber-400/10"
                }`}
              >
                {mode === "plant" ? (
                  <Leaf className="w-8 h-8 text-[#4ade80]" />
                ) : (
                  <Sun className="w-8 h-8 text-amber-400" />
                )}
              </div>
              <h3 className="font-semibold text-white mb-2">
                {mode === "plant" ? "Photograph the Plant Spot" : "Photograph the Light Source"}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {mode === "plant"
                  ? "Stand at the corner or shelf where you plan to place your plant."
                  : "Point your camera at the nearest window or light source."}
              </p>
            </div>
          )}

          {/* Camera error */}
          {cameraError && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-900/80 text-red-300 text-xs p-3 rounded-xl">
              {cameraError}
            </div>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action buttons */}
        <div className="mt-4 space-y-3 pb-8">
          {!cameraActive && !currentImage && (
            <button
              onClick={startCamera}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                mode === "plant"
                  ? "bg-[#4ade80] text-[#0a0f0a] hover:bg-[#22c55e]"
                  : "bg-amber-400 text-[#0a0f0a] hover:bg-amber-300"
              }`}
            >
              <Camera className="w-5 h-5" />
              Open Camera
            </button>
          )}

          {cameraActive && (
            <button
              onClick={capturePhoto}
              disabled={capturing}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                mode === "plant"
                  ? "bg-[#4ade80] text-[#0a0f0a] hover:bg-[#22c55e]"
                  : "bg-amber-400 text-[#0a0f0a] hover:bg-amber-300"
              } disabled:opacity-50`}
            >
              <Camera className="w-5 h-5" />
              {capturing ? "Capturing…" : "Capture Photo"}
            </button>
          )}

          {!cameraActive && currentImage && (
            <div className="flex gap-3">
              <button
                onClick={retake}
                className="flex-1 py-3.5 rounded-2xl border border-[#1e3a1e] text-neutral-400 font-medium flex items-center justify-center gap-2 hover:border-neutral-500 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className={`flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === "plant"
                    ? "bg-[#4ade80] text-[#0a0f0a] hover:bg-[#22c55e]"
                    : "bg-amber-400 text-[#0a0f0a] hover:bg-amber-300"
                } disabled:opacity-30`}
              >
                {mode === "plant" ? "Next: Window" : "Analyse"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Skip option */}
          {!cameraActive && !currentImage && (
            <button
              onClick={handleNext}
              className="w-full py-3 text-neutral-600 text-sm hover:text-neutral-400 transition-colors"
            >
              Skip this photo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
