
import { fetchWeatherWithOpenMeteo } from '../services/openMeteoService';

async function verifyJeju() {
    const city = "濟州島";
    const date = new Date().toISOString().split('T')[0];

    console.log(`Testing geocoding fix for ${city} on ${date}...`);
    const data = await fetchWeatherWithOpenMeteo(city, date);

    if (data) {
        console.log("✅ Data received:");
        // We can't easily check the internal coordinates here without exposing them,
        // but if we get data, it means geocoding succeeded.
        // Ideally, we'd check if the temperature looks reasonable for Jeju (Lat 33.5) vs Ethiopia (Lat 8).
        // Jeju in winter is ~5-15C. Ethiopia is ~20-30C.
        console.log(`Temp: ${data.minTemp}°C - ${data.maxTemp}°C`);

        if (data.avgTemp < 20) {
            console.log("✅ Temperature looks reasonable for Jeju in winter.");
        } else {
            console.warn("⚠️ Temperature looks too high, might still be Ethiopia?");
        }

    } else {
        console.error("❌ Failed to get data.");
    }
}

verifyJeju();
