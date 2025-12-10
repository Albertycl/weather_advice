import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    '*.vercel.app',
    'http://localhost:5426',
    'http://localhost:3000'
  ];

  const origin = req.headers.origin;

  const isAllowed = (origin) => {
    if (!origin) return false;
    return allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        return pattern.test(origin);
      }
      return allowed === origin;
    });
  };

  if (origin && isAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (origin && !isAllowed(origin)) {
    return res.status(403).json({ error: 'Forbidden: Invalid Origin' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, city, date } = req.body;
    let targetCity = city;
    let targetDate = date;

    // If prompt is provided (curl), parse it
    if (prompt && !city) {
      const cityMatch = prompt.match(/查詢\s+([^\s]+)\s+在/);
      const dateMatch = prompt.match(/在\s+(\d{4}-\d{2}-\d{2})\s+的/);
      if (cityMatch) targetCity = cityMatch[1];
      if (dateMatch) targetDate = dateMatch[1];
    }

    if (!targetCity || !targetDate) {
      return res.status(400).json({ error: 'City and Date are required' });
    }

    let weatherData = null;
    let source = 'Open-Meteo';

    // Map Traditional Chinese city names to English for better geocoding
    const cityNameMap = {
      '首爾': 'Seoul',
      '釜山': 'Busan',
      '濟州': 'Jeju',
      '濟州島': 'Jeju',
      '大邱': 'Daegu',
      '仁川': 'Incheon',
      '光州': 'Gwangju',
      '大田': 'Daejeon',
      '蔚山': 'Ulsan',
      '東京': 'Tokyo',
      '大阪': 'Osaka',
      '京都': 'Kyoto',
      '北京': 'Beijing',
      '上海': 'Shanghai',
      '台北': 'Taipei',
      '香港': 'Hong Kong',
      '新加坡': 'Singapore',
      '曼谷': 'Bangkok',
      '巴黎': 'Paris',
      '倫敦': 'London',
      '紐約': 'New York',
      '洛杉磯': 'Los Angeles'
    };

    // Try to map the city name to English
    const mappedCity = cityNameMap[targetCity] || targetCity;

    // 1. Try Open-Meteo First
    try {
      console.log(`Attempting Open-Meteo for ${mappedCity} (original: ${targetCity}) on ${targetDate}`);
      
      // Geocoding
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mappedCity)}&format=json&limit=1`;
      const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'WeatherAdviceApp/1.0' } });
      const geoData = await geoRes.json();

      if (geoData && geoData.length > 0) {
        const { lat, lon } = geoData[0];
        
        // Weather
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${targetDate}&end_date=${targetDate}`;
        const weatherRes = await fetch(weatherUrl);
        const weatherJson = await weatherRes.json();

        if (weatherJson.daily && weatherJson.daily.time && weatherJson.daily.time.length > 0) {
           const minTemp = Math.round(weatherJson.daily.temperature_2m_min[0]);
           const maxTemp = Math.round(weatherJson.daily.temperature_2m_max[0]);
           const weatherCode = weatherJson.daily.weather_code[0];
           const condition = getWeatherDescription(weatherCode);
           const avgTemp = Math.round((minTemp + maxTemp) / 2);

           // Determine Scenario
           let scenario = "COMFORTABLE"; // Default string enum match
           if (avgTemp < 5) scenario = "COLD";
           else if (avgTemp >= 5 && avgTemp < 15) scenario = "COOL";
           else if (avgTemp >= 15 && avgTemp < 22) scenario = "COMFORTABLE";
           else scenario = "WARM";

           weatherData = {
             minTemp,
             maxTemp,
             avgTemp,
             condition,
             scenario,
             sources: [{ title: "Open-Meteo", uri: "https://open-meteo.com/" }]
           };
        }
      }
    } catch (err) {
      console.warn("Open-Meteo failed, falling back to Gemini:", err);
    }

    // 2. Fallback to Gemini if Open-Meteo failed
    if (!weatherData) {
      console.log("Falling back to Gemini...");
      source = 'Gemini';
      const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
      const geminiPrompt = `
        請幫我查詢 ${targetCity} 在 ${targetDate} 的天氣預報或歷史天氣數據。
        我需要當天的：
        1. 最低氣溫 (攝氏)
        2. 最高氣溫 (攝氏)
        3. 天氣狀況簡述 (例如：晴朗、多雲、下雨、有雪) - 請用繁體中文回答。

        請根據搜尋結果，嚴格依照以下格式回傳：
        MIN: [最低溫數字]
        MAX: [最高溫數字]
        COND: [天氣狀況簡述]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: geminiPrompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      const text = response.text || "";
      const minMatch = text.match(/MIN:\s*(-?\d+)/i);
      const maxMatch = text.match(/MAX:\s*(-?\d+)/i);
      const condMatch = text.match(/COND:\s*(.+)/i);

      const minTemp = minMatch ? parseInt(minMatch[1]) : 10;
      const maxTemp = maxMatch ? parseInt(maxMatch[1]) : 20;
      const condition = condMatch ? condMatch[1].trim() : "晴時多雲";
      const avgTemp = Math.round((minTemp + maxTemp) / 2);

      let scenario = "COMFORTABLE";
      if (avgTemp < 5) scenario = "COLD";
      else if (avgTemp >= 5 && avgTemp < 15) scenario = "COOL";
      else if (avgTemp >= 15 && avgTemp < 22) scenario = "COMFORTABLE";
      else scenario = "WARM";

      const sources = [];
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
          if (chunk.web) {
            sources.push({ title: chunk.web.title || "天氣資料來源", uri: chunk.web.uri || "#" });
          }
        });
      }

      weatherData = { minTemp, maxTemp, avgTemp, condition, scenario, sources };
    }

    // 3. Return Response
    // If it was a prompt request (curl), return text format
    if (prompt && !city) {
       const outputText = `MIN: ${weatherData.minTemp}\nMAX: ${weatherData.maxTemp}\nCOND: ${weatherData.condition}`;
       res.setHeader('Content-Type', 'application/x-ndjson');
       res.write(JSON.stringify({ text: outputText }) + '\n');
       return res.end();
    }

    // Otherwise return JSON for frontend
    return res.status(200).json(weatherData);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

function getWeatherDescription(code) {
  const codes = {
    0: "晴朗", 1: "晴朗", 2: "多雲", 3: "陰天",
    45: "有霧", 48: "有霧", 51: "毛毛雨", 53: "毛毛雨", 55: "毛毛雨",
    56: "凍雨", 57: "凍雨", 61: "下雨", 63: "下雨", 65: "大雨",
    66: "凍雨", 67: "凍雨", 71: "下雪", 73: "下雪", 75: "大雪",
    77: "雪粒", 80: "陣雨", 81: "陣雨", 82: "強陣雨", 85: "陣雪",
    86: "陣雪", 95: "雷雨", 96: "雷雨", 99: "雷雨伴隨冰雹"
  };
  return codes[code] || "未知天氣";
}