import { getWeather } from '../services/weatherService';
import fs from 'fs';
import path from 'path';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_API_KEY=["']?([^"'\n]+)["']?/) || envContent.match(/API_KEY=["']?([^"'\n]+)["']?/);
    if (match) {
        process.env.API_KEY = match[1].trim();
    }
}

async function testCaching() {
    console.log("🧪 Testing Caching Logic...");
    const city = 'Seoul';

    // Use a date far in the future to force Gemini fallback (or fail if quota exceeded)
    // But wait, we want to test caching. Open-Meteo is fine too.
    // Let's use tomorrow.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    console.log("\n--- Call 1: Should fetch from API ---");
    const result1 = await getWeather(city, dateStr);
    console.log("Result 1 Source:", result1.sources?.[0]?.title || "Unknown");

    console.log("\n--- Call 2: Should use Cache ---");
    // We expect the service to log "Using cached weather data"
    const result2 = await getWeather(city, dateStr);
    console.log("Result 2 Source:", result2.sources?.[0]?.title || "Unknown");

    // Verify cache content
    const cacheKey = `weather_${city}_${dateStr}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        console.log("✅ Cache exists in localStorage");
    } else {
        console.error("❌ Cache missing from localStorage");
    }
}

testCaching();
