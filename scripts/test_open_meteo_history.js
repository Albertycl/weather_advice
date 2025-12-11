
// No import needed for Node 18+ fetch
async function testHistory() {
    const lat = 25.0330; // Taipei
    const lon = 121.5654;
    const date = '2023-12-25'; // Past date

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
    
    console.log("Fetching:", url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Result:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

testHistory();
