import { fetchWeatherWithGemini } from "./geminiService";
import { fetchWeatherWithOpenMeteo } from "./openMeteoService";
import { WeatherData } from "../types";

const CACHE_DURATION = 1000 * 60 * 60; // 1 Hour

export const getWeather = async (city: string, date: string): Promise<WeatherData> => {
    const cacheKey = `weather_${city}_${date}`;

    // 1. Check Cache
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                console.log(`📦 Using cached weather data for ${city} on ${date}`);
                return data as WeatherData;
            } else {
                console.log(`⌛ Cache expired for ${city} on ${date}`);
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (e) {
        console.warn("Cache check failed:", e);
    }

    let weatherData: WeatherData | null = null;

    // 2. Try Open-Meteo first (Free, Fast)
    try {
        weatherData = await fetchWeatherWithOpenMeteo(city, date);
        if (!weatherData) {
            console.warn("⚠️ Open-Meteo returned null, falling back to Gemini...");
        }
    } catch (error) {
        console.warn("⚠️ Open-Meteo failed, falling back to Gemini...", error);
    }

    // 3. Fallback to Gemini (Paid/Quota, AI-powered)
    if (!weatherData) {
        weatherData = await fetchWeatherWithGemini(city, date);
    }

    // 4. Save to Cache
    try {
        // Only cache if we have data and it's not an error fallback (condition "系統繁忙")
        if (weatherData && weatherData.condition !== "系統繁忙") {
            localStorage.setItem(cacheKey, JSON.stringify({
                data: weatherData,
                timestamp: Date.now()
            }));
            console.log(`💾 Saved weather data to cache for ${city}`);
        } else {
            console.warn("⚠️ Not caching weather data because it seems to be an error fallback.");
        }
    } catch (e) {
        console.warn("Cache save failed:", e);
    }

    return weatherData;
};
