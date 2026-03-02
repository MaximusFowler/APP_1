// ============================================================
// Aura Blooms — Core Type Definitions
// ============================================================

/** GPS coordinates captured from the browser Geolocation API */
export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/** Cardinal window orientation derived from device compass */
export type WindowOrientation = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "Unknown";

/** Raw environmental data collected during the scan phase */
export interface EnvironmentData {
  gps: GPSCoordinates | null;
  windowOrientation: WindowOrientation;
  /** Distance from plant spot to window in metres (user-estimated) */
  distanceToWindow: number;
  /** Base64-encoded JPEG of the plant corner */
  plantSpotImage: string | null;
  /** Base64-encoded JPEG of the window / light source */
  lightSourceImage: string | null;
}

/** Gemini AI analysis result for light conditions */
export interface LightAnalysis {
  /** 0–100 score representing usable photosynthetic light */
  lightScore: number;
  /** Human-readable description of the light environment */
  description: string;
  /** Estimated foot-candles or lux equivalent label */
  lightLevel: "Very Low" | "Low" | "Medium" | "High" | "Very High";
  /** Specific observations from the image */
  observations: string[];
  /** Confidence 0–1 */
  confidence: number;
}

/** Plant morphology state at a given time step */
export interface PlantState {
  /** Month index 1–24 */
  month: number;
  /** 0–100 health score */
  health: number;
  /** CSS scale factor for the ghost model */
  scale: number;
  /** CSS opacity for the ghost model */
  opacity: number;
  /** Hue-rotate degrees (0 = green, 30 = yellow-green, 60 = yellow) */
  hueRotate: number;
  /** Saturate percentage (100 = normal, 50 = desaturated/dying) */
  saturate: number;
  /** Brightness percentage */
  brightness: number;
  /** Descriptive growth stage label */
  stage: GrowthStage;
  /** Visible symptoms */
  symptoms: string[];
}

export type GrowthStage =
  | "Thriving"
  | "Healthy"
  | "Adapting"
  | "Stressed"
  | "Etiolated"
  | "Declining"
  | "Critical"
  | "Dead";

/** Final survival prediction output */
export interface SurvivalPrediction {
  /** 0–100 overall survival probability at 24 months */
  survivalScore: number;
  /** Month at which plant enters critical zone (null if never) */
  criticalMonth: number | null;
  /** Month at which plant is modelled as dead (null if survives) */
  deathMonth: number | null;
  /** Array of 24 monthly plant states */
  timeline: PlantState[];
  /** Recommended plant if current location is sub-optimal */
  alternativePlant: PlantRecommendation | null;
  /** Grow-light product recommendation if score < 50 */
  rescueKit: RescueKit | null;
  /** Summary text for the user */
  summary: string;
}

export interface PlantRecommendation {
  name: string;
  scientificName: string;
  reason: string;
  imageEmoji: string;
  minLightScore: number;
}

export interface RescueKit {
  productName: string;
  description: string;
  affiliateUrl: string;
  priceRange: string;
  boostAmount: number; // how many light score points it adds
}

/** App-level screen navigation */
export type AppScreen = "context" | "scan" | "ghost" | "simulation" | "results";

/** Full application state */
export interface AppState {
  screen: AppScreen;
  environment: EnvironmentData;
  lightAnalysis: LightAnalysis | null;
  prediction: SurvivalPrediction | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  selectedMonth: number;
}
