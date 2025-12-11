import { getWeather } from '../services/weatherService';
import { City } from '../types';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_API_KEY=["']?([^"'\n]+)["']?/) || envContent.match(/API_KEY=["']?([^"'\n]+)["']?/);
    if (match) {
        process.env.API_KEY = match[1].trim();
    }
}

// Mock fetch for Open-Meteo to test fallback if needed, 
// but for now let's just run it and see what happens with real network.
// We can't easily mock fetch in this environment without a test runner, 
// so we will just call the service and log the output.

async function testWeatherService() {
    console.log("🧪 Testing Weather Service...");

    // Test 1: Open-Meteo (Seoul, near future)
    // This should succeed with Open-Meteo
    try {
        console.log("\n--- Test 1: Seoul (Near Future) ---");
        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const result1 = await getWeather('Seoul', dateStr);
        console.log("Result 1:", JSON.stringify(result1, null, 2));

        if (result1.sources?.some(s => s.title.includes('Open-Meteo'))) {
            console.log("✅ Test 1 Passed: Used Open-Meteo");
        } else {
            console.log("⚠️ Test 1: Did not use Open-Meteo (might be fallback or error)");
        }

    } catch (error) {
        console.error("❌ Test 1 Failed:", error);
    }

    // Test 2: Fallback to Gemini (Far future or invalid date for Open-Meteo)
    // Open-Meteo only goes 16 days. Let's try 30 days out.
    try {
        console.log("\n--- Test 2: Seoul (Far Future - Force Fallback) ---");
        const future = new Date();
        future.setDate(future.getDate() + 30);
        const dateStr = future.toISOString().split('T')[0];

        const result2 = await getWeather('Seoul', dateStr);
        console.log("Result 2:", JSON.stringify(result2, null, 2));

        if (result2.sources?.some(s => s.title.includes('Google Search'))) {
            console.log("✅ Test 2 Passed: Used Gemini (Fallback)");
        } else if (result2.tokenUsage) {
            console.log("✅ Test 2 Passed: Token Usage present (implies Gemini)");
        } else {
            console.log("⚠️ Test 2: Did not seem to use Gemini");
        }

    } catch (error) {
        console.error("❌ Test 2 Failed:", error);
    }
}

testWeatherService();
