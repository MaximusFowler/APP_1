// ============================================================
// Aura Blooms — Gemini Visual Light Analysis API Route
// POST /api/analyze-light
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LightAnalysis } from "@/lib/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

/**
 * Analyses two images (plant spot + light source) using Gemini 1.5 Flash
 * and returns a structured LightAnalysis object.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plantSpotImage, lightSourceImage } = body as {
      plantSpotImage: string | null;
      lightSourceImage: string | null;
    };

    if (!plantSpotImage && !lightSourceImage) {
      return NextResponse.json(
        { error: "At least one image is required." },
        { status: 400 }
      );
    }

    // ── If no API key, return a realistic mock for demo purposes ──
    if (!GEMINI_API_KEY) {
      const mockAnalysis: LightAnalysis = generateMockAnalysis(plantSpotImage, lightSourceImage);
      return NextResponse.json(mockAnalysis);
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build the prompt parts
    const parts: Parameters<typeof model.generateContent>[0] extends { contents: infer C } ? C : never[] = [];

    const systemPrompt = `You are a botanical light analysis expert and computer vision specialist. 
Analyse the provided image(s) of a room environment to assess the quality and quantity of natural light available for plant growth.

Evaluate:
1. Visible light sources (windows, skylights, artificial lights)
2. Shadow depth and direction
3. Window size relative to room
4. Obstructions (curtains, blinds, trees outside, buildings)
5. Time-of-day indicators
6. Surface reflectivity (light walls vs dark walls)

Return ONLY a valid JSON object with this exact structure:
{
  "lightScore": <integer 0-100>,
  "description": "<2-3 sentence description of the light environment>",
  "lightLevel": "<one of: Very Low | Low | Medium | High | Very High>",
  "observations": ["<observation 1>", "<observation 2>", "<observation 3>"],
  "confidence": <float 0.0-1.0>
}

Light score guide:
- 0-20: Very Low (deep interior, no windows visible)
- 21-35: Low (north-facing or heavily obstructed)
- 36-55: Medium (indirect light, moderate window)
- 56-75: High (bright indirect, large window)
- 76-100: Very High (direct sun, south-facing large window)`;

    const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: systemPrompt },
    ];

    // Add plant spot image if available
    if (plantSpotImage) {
      const base64Data = plantSpotImage.replace(/^data:image\/\w+;base64,/, "");
      contentParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      });
      contentParts.push({ text: "Image 1: The plant placement location (corner/spot)" });
    }

    // Add light source image if available
    if (lightSourceImage) {
      const base64Data = lightSourceImage.replace(/^data:image\/\w+;base64,/, "");
      contentParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      });
      contentParts.push({ text: "Image 2: The nearest light source (window)" });
    }

    const result = await model.generateContent(contentParts);
    const responseText = result.response.text();

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in Gemini response");
    }

    const analysis = JSON.parse(jsonMatch[0]) as LightAnalysis;

    // Validate and clamp values
    analysis.lightScore = Math.max(0, Math.min(100, Math.round(analysis.lightScore)));
    analysis.confidence = Math.max(0, Math.min(1, analysis.confidence));

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[analyze-light] Error:", error);

    // Return a fallback mock on error so the app still works
    const fallback: LightAnalysis = {
      lightScore: 45,
      description: "Unable to analyse images automatically. Using estimated medium light conditions.",
      lightLevel: "Medium",
      observations: [
        "Analysis unavailable — using default medium light estimate",
        "Please ensure good lighting when taking photos",
        "Manual distance adjustment will refine the prediction",
      ],
      confidence: 0.3,
    };

    return NextResponse.json(fallback);
  }
}

// ─── Mock Analysis Generator ──────────────────────────────────

/**
 * Generates a realistic mock analysis when no API key is present.
 * Varies the score based on image presence to simulate real behaviour.
 */
function generateMockAnalysis(
  plantSpotImage: string | null,
  lightSourceImage: string | null
): LightAnalysis {
  // Simulate different scenarios based on what was captured
  const hasWindow = lightSourceImage !== null;
  const hasPlantSpot = plantSpotImage !== null;

  if (hasWindow && hasPlantSpot) {
    return {
      lightScore: 62,
      description:
        "The room shows a moderately sized window providing good indirect natural light. The plant placement area receives diffused light throughout the day with some direct sun in the morning.",
      lightLevel: "High",
      observations: [
        "Window appears to be east or south-east facing based on light angle",
        "Minimal obstructions — light curtains allow good light transmission",
        "Wall colour is light, improving ambient light reflection",
      ],
      confidence: 0.78,
    };
  }

  if (hasWindow) {
    return {
      lightScore: 55,
      description:
        "The window provides moderate natural light. Brightness levels suggest indirect light conditions suitable for many common houseplants.",
      lightLevel: "Medium",
      observations: [
        "Window size appears medium — adequate for indirect light plants",
        "Sky brightness indicates overcast or indirect conditions",
        "No major external obstructions visible",
      ],
      confidence: 0.65,
    };
  }

  return {
    lightScore: 35,
    description:
      "Based on the room environment, light levels appear low to moderate. The area may be further from the primary light source.",
    lightLevel: "Low",
    observations: [
      "Limited direct window light visible in this area",
      "Ambient light levels suggest interior placement",
      "Consider supplemental lighting for most plant species",
    ],
    confidence: 0.5,
  };
}
