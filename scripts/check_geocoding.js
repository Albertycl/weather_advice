
async function checkGeocoding() {
    const city = "濟州島";
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=zh&format=json`;
    
    console.log(`🔍 Checking Geocoding for: ${city}`);
    console.log(`URL: ${geoUrl}`);

    try {
        const res = await fetch(geoUrl);
        const data = await res.json();
        
        if (data.results) {
            console.log("Found results:");
            data.results.forEach((r, i) => {
                console.log(`[${i}] ${r.name}, ${r.country} (Lat: ${r.latitude}, Lon: ${r.longitude})`);
            });
        } else {
            console.log("No results found.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

checkGeocoding();
