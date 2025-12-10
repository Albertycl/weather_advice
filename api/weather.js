import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // 1. Get API Key from Environment Variables (Vercel)
  // Vercel injects environment variables automatically.
  // Ensure you set 'GEMINI_API_KEY' (or 'API_KEY') in your Vercel Project Settings.
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Error: API Key not configured' });
  }

  // 2. Initialize Gemini Client
  const ai = new GoogleGenAI({ apiKey });

  // 3. Handle Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 4. Call Google Gemini 2.5 Flash
    // gemini-2.5-flash has higher rate limits (approx 1500 req/day on free tier)
    // compared to Pro models, making it ideal for this app.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable Google Search Grounding
      }
    });

    // 5. Extract Data
    // The new SDK uses getters for .text
    const text = response.text || "";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    res.status(200).json({ text, groundingMetadata });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: 'Failed to generate weather data' });
  }
}