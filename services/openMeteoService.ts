import { WeatherData, WeatherScenario } from "../types";

interface GeoResult {
    results?: {
        latitude: number;
        longitude: number;
        name: string;
        country: string;
    }[];
}

interface OpenMeteoWeather {
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weather_code: number[];
    };
}

// WMO Weather interpretation codes (WW)
function getWeatherCondition(code: number): string {
    if (code === 0) return "晴朗";
    if (code === 1 || code === 2 || code === 3) return "多雲";
    if (code === 45 || code === 48) return "有霧";
    if (code >= 51 && code <= 55) return "毛毛雨";
    if (code >= 61 && code <= 65) return "下雨";
    if (code >= 71 && code <= 77) return "下雪";
    if (code >= 80 && code <= 82) return "陣雨";
    if (code >= 95) return "雷雨";
    return "多雲"; // Default
}

export const fetchWeatherWithOpenMeteo = async (city: string, date: string): Promise<WeatherData | null> => {
    try {
        console.log(`🌍 Fetching weather for ${city} from Open-Meteo...`);

        // 1. Geocoding
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
        console.log(`🔍 Geocoding URL: ${geoUrl}`);
        const geoRes = await fetch(geoUrl);
        const geoData: GeoResult = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            console.warn(`❌ Open-Meteo Geocoding failed for ${city}`);
            return null;
        }

        const { latitude, longitude, name } = geoData.results[0];
        console.log(`📍 Found location: ${name} (${latitude}, ${longitude})`);

        // 2. Weather Forecast
        // Open-Meteo allows up to 16 days forecast.
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData: OpenMeteoWeather = await weatherRes.json();

        if (!weatherData.daily) {
            console.warn("❌ Open-Meteo returned no daily data.");
            return null;
        }

        // Find the index for the requested date
        // Open-Meteo returns dates in YYYY-MM-DD format
        // The input 'date' is likely "YYYY-MM-DD" or similar. Let's try to match.
        // If date is not found (e.g. far future), we might need to fallback or pick closest.
        // For simplicity, if date match fails, we return null to trigger fallback (or maybe today's weather?)
        // Let's try to find exact match.

        // Ensure date format matches YYYY-MM-DD
        const targetDate = new Date(date).toISOString().split('T')[0];
        const index = weatherData.daily.time.findIndex((d: string) => d === targetDate);

        if (index === -1) {
            console.warn(`⚠️ Date ${targetDate} not found in Open-Meteo forecast (limit 16 days). Trying historical estimation...`);
            return await fetchHistoricalEstimation(latitude, longitude, targetDate);
        }

        const minTemp = weatherData.daily.temperature_2m_min[index];
        const maxTemp = weatherData.daily.temperature_2m_max[index];
        const weatherCode = weatherData.daily.weather_code[index];
        const condition = getWeatherCondition(weatherCode);
        const avgTemp = (minTemp + maxTemp) / 2;

        // Determine Scenario
        let scenario = WeatherScenario.COMFORTABLE;
        if (avgTemp < 5) scenario = WeatherScenario.COLD;
        else if (avgTemp >= 5 && avgTemp < 15) scenario = WeatherScenario.COOL;
        else if (avgTemp >= 15 && avgTemp < 22) scenario = WeatherScenario.COMFORTABLE;
        else scenario = WeatherScenario.WARM;

        return {
            minTemp,
            maxTemp,
            avgTemp,
            condition,
            scenario,
            sources: [{ title: "Open-Meteo", uri: "https://open-meteo.com/" }]
        };

    } catch (error) {
        console.error("Open-Meteo Error:", error);
        return null;
    }
};

const fetchHistoricalEstimation = async (lat: number, lon: number, targetDate: string): Promise<WeatherData | null> => {
    try {
        // Calculate date 1 year ago
        const dateObj = new Date(targetDate);
        dateObj.setFullYear(dateObj.getFullYear() - 1);
        const pastDate = dateObj.toISOString().split('T')[0];

        console.log(`🕰️ Fetching historical data for estimation from ${pastDate}...`);

        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${pastDate}&end_date=${pastDate}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
        const res = await fetch(url);
        const data: OpenMeteoWeather = await res.json();

        if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
            console.warn("❌ No historical data found.");
            return null;
        }

        const minTemp = data.daily.temperature_2m_min[0];
        const maxTemp = data.daily.temperature_2m_max[0];
        const weatherCode = data.daily.weather_code[0];
        const condition = getWeatherCondition(weatherCode);
        const avgTemp = (minTemp + maxTemp) / 2;

        // Determine Scenario
        let scenario = WeatherScenario.COMFORTABLE;
        if (avgTemp < 5) scenario = WeatherScenario.COLD;
        else if (avgTemp >= 5 && avgTemp < 15) scenario = WeatherScenario.COOL;
        else if (avgTemp >= 15 && avgTemp < 22) scenario = WeatherScenario.COMFORTABLE;
        else scenario = WeatherScenario.WARM;

        return {
            minTemp,
            maxTemp,
            avgTemp,
            condition,
            scenario,
            sources: [{ title: "Open-Meteo (Historical Estimate)", uri: "https://open-meteo.com/" }]
        };

    } catch (error) {
        console.error("Historical Estimation Error:", error);
        return null;
    }
};
