# Active Context: Aura Blooms — Plant Survival Simulator

## Current State

**App Status**: ✅ Fully built and production-ready

Aura Blooms is a complete mobile-first web application that uses AI (Gemini Vision) to analyse a room's physical environment and predict plant survival over a 2-year timeline.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] **Aura Blooms full app implementation**
  - [x] Botanical Logic Engine with Inverse Square Law, seasonal adjustments, orientation multipliers
  - [x] 24-month plant morphology simulation (growth stages, symptoms, CSS transforms)
  - [x] Gemini 1.5 Flash API integration for visual light analysis
  - [x] Screen 1: Context (GPS + compass + distance slider)
  - [x] Screen 2: Camera scan with overlay guides (plant spot + light source)
  - [x] Screen 3: AR-lite Ghost preview with animated SVG plant
  - [x] Screen 4: 24-month simulation with interactive timeline slider
  - [x] Screen 5: Results with survival score ring, rescue kit, alternative plant recommendations
  - [x] Botanical dark theme (deep forest green + white)
  - [x] Zero TypeScript errors, zero lint errors, production build passes

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Root page → AuraBlooms component | ✅ Ready |
| `src/app/layout.tsx` | Root layout with Aura Blooms metadata | ✅ Ready |
| `src/app/globals.css` | Botanical dark theme + range input styles | ✅ Ready |
| `src/app/api/analyze-light/route.ts` | Gemini Vision API route | ✅ Ready |
| `src/lib/types.ts` | All TypeScript types | ✅ Ready |
| `src/lib/botanicalEngine.ts` | Core IP: light physics + growth simulation | ✅ Ready |
| `src/components/AuraBlooms.tsx` | Main app orchestrator / state manager | ✅ Ready |
| `src/components/screens/LandingScreen.tsx` | Splash screen | ✅ Ready |
| `src/components/screens/ContextScreen.tsx` | GPS + orientation + distance | ✅ Ready |
| `src/components/screens/ScanScreen.tsx` | Camera capture interface | ✅ Ready |
| `src/components/screens/GhostScreen.tsx` | AR-lite ghost + AI analysis | ✅ Ready |
| `src/components/screens/SimulationScreen.tsx` | 24-month slider simulation | ✅ Ready |
| `src/components/screens/ResultsScreen.tsx` | Survival report + monetisation | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Key Technical Features

### Botanical Logic Engine
- **Inverse Square Law**: `I = I₀ / d²` — light attenuates with distance
- **Seasonal Multipliers**: Northern/Southern hemisphere monthly light factors
- **Orientation Multipliers**: N=0.30 → S=1.0 window direction factors
- **Growth Zones**: Optimal (≥65), Sub-optimal (35–64), Death Zone (<35)
- **Morphology Simulation**: CSS scale, hue-rotate, saturate, brightness per month

### API Integration
- Gemini 1.5 Flash for visual light analysis
- Graceful fallback mock when `GEMINI_API_KEY` not set
- Returns structured `LightAnalysis` with score, level, observations

### Monetisation
- Rescue Kit (grow light) shown when survival score < 50%
- Alternative plant recommendation (Snake Plant, ZZ Plant, Pothos)

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `GEMINI_API_KEY` | Gemini Vision API key | Optional (mock used if absent) |

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-03-02 | Full Aura Blooms app built — 5 screens, botanical engine, Gemini API, monetisation |
