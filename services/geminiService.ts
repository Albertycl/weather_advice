import { GoogleGenAI } from "@google/genai";
import { WeatherData, WeatherScenario, WeatherSource } from "../types";

/**
 * Fetches real weather data using Gemini with Google Search Grounding.
 */
export const fetchWeatherWithGemini = async (city: string, date: string): Promise<WeatherData> => {
  try {
    const response = await fetch('/api/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city, date }),
    });

    if (!response.ok) {
      throw new Error(`Weather API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Weather Fetch Error:", error);
    // Return a safe fallback
    return {
      minTemp: 10,
      maxTemp: 20,
      avgTemp: 15,
      condition: "系統繁忙，請稍後再試",
      scenario: WeatherScenario.COMFORTABLE,
      sources: []
    };
  }
};