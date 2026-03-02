"use client";
// ============================================================
// Screen 1: Context — GPS + Window Identification
// ============================================================

import { useState } from "react";
import { MapPin, Compass, ChevronRight, Leaf, AlertCircle } from "lucide-react";
import type { GPSCoordinates, WindowOrientation, EnvironmentData } from "@/lib/types";

interface ContextScreenProps {
  onComplete: (data: Pick<EnvironmentData, "gps" | "windowOrientation" | "distanceToWindow">) => void;
}

const ORIENTATIONS: { label: string; value: WindowOrientation; description: string }[] = [
  { label: "North", value: "N", description: "Indirect light only — challenging for most plants" },
  { label: "North-East", value: "NE", description: "Gentle morning light" },
  { label: "East", value: "E", description: "Bright morning sun — great for many plants" },
  { label: "South-East", value: "SE", description: "Long morning light — excellent" },
  { label: "South", value: "S", description: "Maximum light — best in northern hemisphere" },
  { label: "South-West", value: "SW", description: "Warm afternoon sun — very good" },
  { label: "West", value: "W", description: "Bright afternoon sun — good" },
  { label: "North-West", value: "NW", description: "Limited afternoon light" },
];

export default function ContextScreen({ onComplete }: ContextScreenProps) {
  const [gps, setGps] = useState<GPSCoordinates | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<WindowOrientation | null>(null);
  const [distance, setDistance] = useState<number>(2);
  const [compassStatus, setCompassStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // ── GPS Handler ──────────────────────────────────────────
  const handleConnectGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsStatus("success");
      },
      (err) => {
        setGpsStatus("error");
        setGpsError(err.message || "Unable to retrieve location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Compass Handler ──────────────────────────────────────
  const handleDetectOrientation = async () => {
    setCompassStatus("loading");
    try {
      // Try DeviceOrientationEvent (requires permission on iOS 13+)
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        // @ts-expect-error — requestPermission is iOS-specific
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        // @ts-expect-error — iOS permission API
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          throw new Error("Compass permission denied.");
        }
      }

      // Listen for one compass reading
      const handler = (event: DeviceOrientationEvent) => {
        const heading = event.alpha; // degrees from north (0–360)
        if (heading !== null) {
          window.removeEventListener("deviceorientation", handler);
          setOrientation(headingToOrientation(heading));
          setCompassStatus("success");
        }
      };
      window.addEventListener("deviceorientation", handler);

      // Timeout fallback after 3 seconds
      setTimeout(() => {
        window.removeEventListener("deviceorientation", handler);
        if (compassStatus !== "success") {
          setCompassStatus("error");
        }
      }, 3000);
    } catch {
      setCompassStatus("error");
    }
  };

  const canProceed = orientation !== null;

  const handleContinue = () => {
    if (!orientation) return;
    onComplete({ gps, windowOrientation: orientation, distanceToWindow: distance });
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="w-6 h-6 text-[#4ade80]" />
          <span className="text-[#4ade80] text-sm font-medium tracking-widest uppercase">Aura Blooms</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight">
          Where will your<br />
          <span className="text-[#4ade80]">plant live?</span>
        </h1>
        <p className="mt-3 text-neutral-400 text-sm leading-relaxed">
          We need your location and window direction to calculate seasonal light patterns with precision.
        </p>
      </header>

      <div className="flex-1 px-6 space-y-5 pb-8">
        {/* GPS Card */}
        <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#4ade80]" />
                Location
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Used to calculate seasonal sun angles for your hemisphere
              </p>
            </div>
            {gpsStatus === "success" && (
              <span className="text-xs bg-[#4ade80]/20 text-[#4ade80] px-2 py-1 rounded-full">
                ✓ Connected
              </span>
            )}
          </div>

          {gpsStatus === "success" && gps ? (
            <div className="text-xs text-neutral-400 font-mono bg-[#0a0f0a] rounded-lg p-3">
              <div>Lat: {gps.latitude.toFixed(4)}°</div>
              <div>Lon: {gps.longitude.toFixed(4)}°</div>
              <div>Accuracy: ±{Math.round(gps.accuracy)}m</div>
            </div>
          ) : (
            <button
              onClick={handleConnectGPS}
              disabled={gpsStatus === "loading"}
              className="w-full py-3 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-sm font-medium hover:bg-[#4ade80]/20 transition-all disabled:opacity-50"
            >
              {gpsStatus === "loading" ? "Locating…" : "Connect GPS"}
            </button>
          )}

          {gpsStatus === "error" && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{gpsError} — Continuing without GPS (reduced accuracy)</span>
            </div>
          )}
        </div>

        {/* Window Orientation Card */}
        <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#4ade80]" />
                Window Faces
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Which direction does your nearest window face?
              </p>
            </div>
            {compassStatus === "success" && (
              <span className="text-xs bg-[#4ade80]/20 text-[#4ade80] px-2 py-1 rounded-full">
                ✓ Detected
              </span>
            )}
          </div>

          {/* Auto-detect button */}
          {compassStatus !== "success" && (
            <button
              onClick={handleDetectOrientation}
              disabled={compassStatus === "loading"}
              className="w-full py-3 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-sm font-medium hover:bg-[#4ade80]/20 transition-all disabled:opacity-50 mb-3"
            >
              {compassStatus === "loading" ? "Detecting…" : "Auto-Detect with Compass"}
            </button>
          )}

          {/* Manual selection grid */}
          <p className="text-xs text-neutral-500 mb-2">Or select manually:</p>
          <div className="grid grid-cols-2 gap-2">
            {ORIENTATIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setOrientation(o.value)}
                className={`text-left p-3 rounded-xl border text-xs transition-all ${
                  orientation === o.value
                    ? "bg-[#4ade80]/20 border-[#4ade80] text-white"
                    : "bg-[#0a0f0a] border-[#1e3a1e] text-neutral-400 hover:border-[#4ade80]/50"
                }`}
              >
                <div className="font-semibold text-sm mb-0.5">{o.label}</div>
                <div className="text-neutral-500 leading-tight">{o.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Distance Slider */}
        <div className="bg-[#111a11] border border-[#1e3a1e] rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-1">
            Distance to Window
          </h2>
          <p className="text-xs text-neutral-500 mb-4">
            How far is the plant spot from the window? (Inverse Square Law applies)
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0.3}
              max={8}
              step={0.1}
              value={distance}
              onChange={(e) => setDistance(parseFloat(e.target.value))}
              className="flex-1 accent-[#4ade80]"
            />
            <span className="text-[#4ade80] font-mono font-bold text-lg w-16 text-right">
              {distance.toFixed(1)}m
            </span>
          </div>
          <div className="flex justify-between text-xs text-neutral-600 mt-1">
            <span>0.3m (very close)</span>
            <span>8m (far corner)</span>
          </div>
          {/* Light attenuation preview */}
          <div className="mt-3 text-xs text-neutral-500 bg-[#0a0f0a] rounded-lg p-2">
            💡 At {distance.toFixed(1)}m, light intensity is{" "}
            <span className="text-[#4ade80] font-medium">
              {Math.round((1 / (distance * distance)) * 100)}%
            </span>{" "}
            of window brightness (Inverse Square Law)
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!canProceed}
          className="w-full py-4 rounded-2xl bg-[#4ade80] text-[#0a0f0a] font-bold text-base flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Scan My Space
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Heading → Orientation ────────────────────────────────────

function headingToOrientation(heading: number): WindowOrientation {
  const h = ((heading % 360) + 360) % 360;
  if (h >= 337.5 || h < 22.5) return "N";
  if (h < 67.5) return "NE";
  if (h < 112.5) return "E";
  if (h < 157.5) return "SE";
  if (h < 202.5) return "S";
  if (h < 247.5) return "SW";
  if (h < 292.5) return "W";
  return "NW";
}
