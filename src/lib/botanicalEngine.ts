// ============================================================
// Aura Blooms — Botanical Logic Engine
// The core IP: translates environmental data into plant fate.
// ============================================================

import type {
  GPSCoordinates,
  WindowOrientation,
  LightAnalysis,
  PlantState,
  GrowthStage,
  SurvivalPrediction,
  PlantRecommendation,
  RescueKit,
} from "./types";

// ─── Constants ───────────────────────────────────────────────

/** Seasonal light multipliers by hemisphere and month (Jan–Dec) */
const NORTHERN_SEASONAL: number[] = [0.55, 0.62, 0.72, 0.82, 0.92, 1.0, 0.98, 0.93, 0.82, 0.70, 0.58, 0.52];
const SOUTHERN_SEASONAL: number[] = [1.0, 0.98, 0.93, 0.82, 0.70, 0.58, 0.52, 0.55, 0.62, 0.72, 0.82, 0.92];

/** Orientation multipliers — how much direct light each window face receives */
const ORIENTATION_MULTIPLIERS: Record<WindowOrientation, number> = {
  S: 1.0,   // Best in northern hemisphere
  SE: 0.90,
  SW: 0.88,
  E: 0.75,  // Good morning light
  W: 0.72,  // Good afternoon light
  NE: 0.45,
  NW: 0.42,
  N: 0.30,  // Worst — indirect only
  Unknown: 0.65,
};

/** Alternative plant recommendations for low-light environments */
const LOW_LIGHT_PLANTS: PlantRecommendation[] = [
  {
    name: "Snake Plant",
    scientificName: "Dracaena trifasciata",
    reason: "Thrives in low light and requires minimal watering — nearly indestructible.",
    imageEmoji: "🌿",
    minLightScore: 10,
  },
  {
    name: "ZZ Plant",
    scientificName: "Zamioculcas zamiifolia",
    reason: "Stores water in rhizomes and tolerates deep shade beautifully.",
    imageEmoji: "🪴",
    minLightScore: 10,
  },
  {
    name: "Pothos",
    scientificName: "Epipremnum aureum",
    reason: "Adaptable trailing vine that tolerates low light and irregular watering.",
    imageEmoji: "🌱",
    minLightScore: 15,
  },
];

/** Rescue kit product recommendation */
const GROW_LIGHT_RESCUE: RescueKit = {
  productName: "BarineLux Full-Spectrum Grow Light",
  description: "A compact, clip-on full-spectrum LED grow light that adds ~40 light score points to any corner. Timer-enabled, energy-efficient.",
  affiliateUrl: "https://www.amazon.com/s?k=full+spectrum+grow+light+clip+on",
  priceRange: "$25–$45",
  boostAmount: 40,
};

// ─── Inverse Square Law ──────────────────────────────────────

/**
 * Applies the Inverse Square Law to attenuate light intensity
 * based on distance from the window.
 *
 * Formula: I = I₀ / d²  (normalised so d=1m → factor=1.0)
 *
 * @param baseScore  Raw light score from AI analysis (0–100)
 * @param distanceM  Distance from plant to window in metres
 * @returns Attenuated light score (0–100)
 */
export function applyInverseSquareLaw(baseScore: number, distanceM: number): number {
  // Clamp distance to avoid division by zero or extreme values
  const d = Math.max(0.3, Math.min(distanceM, 10));
  // Normalised: at 1 m the factor is 1.0; at 2 m it's 0.25; at 0.5 m it's 4 (capped)
  const factor = 1 / (d * d);
  // Cap the boost at 2× (very close to window)
  const clampedFactor = Math.min(factor, 2.0);
  return Math.min(100, baseScore * clampedFactor);
}

// ─── Seasonal & Orientation Adjustment ───────────────────────

/**
 * Adjusts the effective light score for the current month,
 * hemisphere, and window orientation.
 */
export function adjustForSeasonAndOrientation(
  lightScore: number,
  orientation: WindowOrientation,
  latitude: number,
  monthIndex: number // 0 = January
): number {
  const seasonal = latitude >= 0 ? NORTHERN_SEASONAL : SOUTHERN_SEASONAL;
  const seasonalFactor = seasonal[monthIndex % 12];
  const orientationFactor = ORIENTATION_MULTIPLIERS[orientation];
  return Math.min(100, lightScore * seasonalFactor * orientationFactor);
}

// ─── Growth Stage Classifier ─────────────────────────────────

/**
 * Classifies a health score into a descriptive growth stage.
 */
function classifyStage(health: number): GrowthStage {
  if (health >= 85) return "Thriving";
  if (health >= 70) return "Healthy";
  if (health >= 55) return "Adapting";
  if (health >= 40) return "Stressed";
  if (health >= 28) return "Etiolated";
  if (health >= 15) return "Declining";
  if (health > 0) return "Critical";
  return "Dead";
}

/**
 * Returns visible symptoms based on health score.
 */
function getSymptoms(health: number, lightScore: number): string[] {
  const symptoms: string[] = [];
  if (health < 70 && lightScore < 40) symptoms.push("Reaching toward light (phototropism)");
  if (health < 55) symptoms.push("Pale, elongated stems (etiolation)");
  if (health < 40) symptoms.push("Lower leaf yellowing");
  if (health < 28) symptoms.push("Leaf drop beginning");
  if (health < 15) symptoms.push("Severe browning & wilting");
  if (health <= 0) symptoms.push("Plant has died");
  return symptoms;
}

// ─── Timeline Simulation ─────────────────────────────────────

/**
 * Simulates 24 months of plant growth given an effective light score.
 *
 * Growth model:
 * - Optimal (score ≥ 65): Exponential growth curve, health stays 80–100
 * - Sub-optimal (35–64): Linear decline from 70 → 45 over 24 months
 * - Death Zone (< 35): Accelerated decline; plant dies between month 6–18
 *
 * @param effectiveLightScore  Light score after all adjustments (0–100)
 * @param startMonth           Calendar month index (0=Jan) for seasonal calc
 * @param latitude             For seasonal adjustments per month
 * @param orientation          Window orientation
 */
export function simulateTimeline(
  effectiveLightScore: number,
  startMonth: number,
  latitude: number,
  orientation: WindowOrientation,
  distanceM: number
): PlantState[] {
  const timeline: PlantState[] = [];

  for (let month = 1; month <= 24; month++) {
    const calendarMonth = (startMonth + month - 1) % 12;

    // Recalculate effective light for this specific month (seasonal variation)
    const seasonal = latitude >= 0 ? NORTHERN_SEASONAL : SOUTHERN_SEASONAL;
    const seasonalFactor = seasonal[calendarMonth];
    const orientationFactor = ORIENTATION_MULTIPLIERS[orientation];
    const monthlyLight = Math.min(
      100,
      applyInverseSquareLaw(effectiveLightScore / (ORIENTATION_MULTIPLIERS[orientation] * seasonal[startMonth % 12] || 1), distanceM) *
        seasonalFactor *
        orientationFactor
    );

    let health: number;
    let scale: number;
    let hueRotate: number;
    let saturate: number;
    let brightness: number;

    if (monthlyLight >= 65) {
      // ── Optimal Zone: Exponential growth ──
      // Health grows from 75 → 100 over 24 months
      health = Math.min(100, 75 + (month / 24) * 25 * (monthlyLight / 100));
      scale = 1 + (month / 24) * 0.6 * (monthlyLight / 100); // grows up to 1.6×
      hueRotate = 0;
      saturate = 100 + (month / 24) * 20; // increasingly lush
      brightness = 100;
    } else if (monthlyLight >= 35) {
      // ── Sub-optimal Zone: Stunted / etiolated ──
      const deficit = (65 - monthlyLight) / 30; // 0–1
      health = Math.max(30, 70 - deficit * 40 * (month / 24));
      scale = 1 + (month / 24) * 0.15 - deficit * 0.1; // minimal growth
      hueRotate = deficit * 20 * (month / 24); // slight yellowing
      saturate = 100 - deficit * 30 * (month / 24);
      brightness = 100 - deficit * 10 * (month / 24);
    } else {
      // ── Death Zone: Accelerated decline ──
      const deficit = (35 - monthlyLight) / 35; // 0–1
      // Death occurs between month 6 (very dark) and month 18 (dim)
      const deathMonth = Math.round(6 + (1 - deficit) * 12);
      const progress = month / deathMonth;

      if (month >= deathMonth) {
        health = 0;
        scale = 0.3;
        hueRotate = 90;
        saturate = 10;
        brightness = 60;
      } else {
        health = Math.max(0, 65 * (1 - progress));
        scale = Math.max(0.3, 1 - progress * 0.7);
        hueRotate = progress * 90;
        saturate = Math.max(10, 100 - progress * 90);
        brightness = Math.max(60, 100 - progress * 40);
      }
    }

    const stage = classifyStage(health);
    const symptoms = getSymptoms(health, monthlyLight);

    timeline.push({
      month,
      health: Math.round(health),
      scale: Math.round(scale * 100) / 100,
      opacity: health <= 0 ? 0.15 : 0.55 + (health / 100) * 0.45,
      hueRotate: Math.round(hueRotate),
      saturate: Math.round(saturate),
      brightness: Math.round(brightness),
      stage,
      symptoms,
    });
  }

  return timeline;
}

// ─── Survival Score ───────────────────────────────────────────

/**
 * Computes the overall 24-month survival score and key milestones.
 */
function computeSurvivalScore(timeline: PlantState[]): {
  survivalScore: number;
  criticalMonth: number | null;
  deathMonth: number | null;
} {
  let criticalMonth: number | null = null;
  let deathMonth: number | null = null;

  for (const state of timeline) {
    if (criticalMonth === null && state.stage === "Critical") {
      criticalMonth = state.month;
    }
    if (deathMonth === null && state.stage === "Dead") {
      deathMonth = state.month;
    }
  }

  // Survival score = average health across all 24 months
  const avgHealth = timeline.reduce((sum, s) => sum + s.health, 0) / timeline.length;
  const survivalScore = Math.round(avgHealth);

  return { survivalScore, criticalMonth, deathMonth };
}

// ─── Main Prediction Function ─────────────────────────────────

/**
 * Master function: takes all environmental inputs and returns
 * a full SurvivalPrediction with 24-month timeline.
 */
export function generatePrediction(
  lightAnalysis: LightAnalysis,
  gps: GPSCoordinates | null,
  orientation: WindowOrientation,
  distanceM: number
): SurvivalPrediction {
  const latitude = gps?.latitude ?? 40; // Default to mid-northern hemisphere
  const currentMonth = new Date().getMonth(); // 0 = January

  // Step 1: Apply Inverse Square Law to AI light score
  const distanceAdjusted = applyInverseSquareLaw(lightAnalysis.lightScore, distanceM);

  // Step 2: Apply seasonal + orientation adjustment for the current month
  const effectiveLight = adjustForSeasonAndOrientation(
    distanceAdjusted,
    orientation,
    latitude,
    currentMonth
  );

  // Step 3: Simulate 24-month timeline
  const timeline = simulateTimeline(effectiveLight, currentMonth, latitude, orientation, distanceM);

  // Step 4: Compute survival metrics
  const { survivalScore, criticalMonth, deathMonth } = computeSurvivalScore(timeline);

  // Step 5: Determine recommendations
  let alternativePlant: PlantRecommendation | null = null;
  let rescueKit: RescueKit | null = null;

  if (survivalScore < 50) {
    rescueKit = GROW_LIGHT_RESCUE;
    // Find the best alternative plant for this light level
    alternativePlant =
      LOW_LIGHT_PLANTS.find((p) => effectiveLight >= p.minLightScore) ?? LOW_LIGHT_PLANTS[0];
  }

  // Step 6: Generate summary
  const summary = generateSummary(survivalScore, effectiveLight, orientation, deathMonth, criticalMonth);

  return {
    survivalScore,
    criticalMonth,
    deathMonth,
    timeline,
    alternativePlant,
    rescueKit,
    summary,
  };
}

// ─── Summary Generator ────────────────────────────────────────

function generateSummary(
  score: number,
  lightScore: number,
  orientation: WindowOrientation,
  deathMonth: number | null,
  criticalMonth: number | null
): string {
  const orientationLabel = orientation === "Unknown" ? "your window" : `a ${orientation}-facing window`;

  if (score >= 80) {
    return `Excellent conditions! Your ${orientationLabel} provides ${Math.round(lightScore)} light units — your plant will thrive and grow lush over the next 2 years.`;
  }
  if (score >= 60) {
    return `Good conditions near ${orientationLabel}. With ${Math.round(lightScore)} light units, your plant will grow steadily, though slightly slower than ideal.`;
  }
  if (score >= 40) {
    if (criticalMonth) {
      return `Marginal light from ${orientationLabel} (${Math.round(lightScore)} units). Your plant will show stress signs around month ${criticalMonth}. Consider a grow light to boost survival.`;
    }
    return `Marginal conditions near ${orientationLabel}. Your plant will survive but may become etiolated (leggy) over time.`;
  }
  if (deathMonth) {
    return `Warning: Only ${Math.round(lightScore)} light units detected. Without intervention, your plant is projected to decline critically by month ${deathMonth}. A grow light is strongly recommended.`;
  }
  return `Very low light detected from ${orientationLabel}. This location is challenging for most plants. Consider a low-light species or a grow light.`;
}

// ─── Utility: Light Score → Label ────────────────────────────

export function lightScoreToLabel(score: number): string {
  if (score >= 75) return "Bright Indirect / Direct";
  if (score >= 55) return "Medium Indirect";
  if (score >= 35) return "Low-Medium";
  if (score >= 20) return "Low";
  return "Very Low";
}

export function survivalScoreColor(score: number): string {
  if (score >= 75) return "#4ade80"; // green-400
  if (score >= 55) return "#a3e635"; // lime-400
  if (score >= 40) return "#facc15"; // yellow-400
  if (score >= 25) return "#fb923c"; // orange-400
  return "#f87171"; // red-400
}
