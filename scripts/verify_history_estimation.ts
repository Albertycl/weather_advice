
import { fetchWeatherWithOpenMeteo } from '../services/openMeteoService';

async function verify() {
    const city = "Taipei";
    // Set a date far in the future (e.g., 1 year from now)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const dateStr = futureDate.toISOString().split('T')[0];

    console.log(`Testing historical estimation for ${city} on ${dateStr}...`);
    const data = await fetchWeatherWithOpenMeteo(city, dateStr);

    if (data) {
        console.log("✅ Data received:");
        console.log(JSON.stringify(data, null, 2));
        if (data.sources[0].title.includes("Historical Estimate")) {
            console.log("✅ Correctly used historical estimation.");
        } else {
            console.error("❌ Did NOT use historical estimation source title.");
        }
    } else {
        console.error("❌ Failed to get data.");
    }
}

verify();
