import { WeatherData, WeatherScenario, WeatherSource } from "../types";

/**
 * Fetches real weather data by calling the secure backend API.
 * This ensures the API key remains hidden and works on Vercel deployments.
 */
export const fetchWeatherWithGemini = async (city: string, date: string): Promise<WeatherData> => {
  try {
    const prompt = `
      請幫我查詢 ${city} 在 ${date} 的天氣預報或歷史天氣數據。
      我需要當天的：
      1. 最低氣溫 (攝氏)
      2. 最高氣溫 (攝氏)
      3. 天氣狀況簡述 (例如：晴朗、多雲、下雨、有雪) - 請用繁體中文回答。

      請根據搜尋結果，嚴格依照以下格式回傳，方便程式解析 (請只回傳這三行資料，不要有其他引言)：
      MIN: [最低溫數字]
      MAX: [最高溫數字]
      COND: [天氣狀況簡述]
    `;

    // Call the Vercel Serverless Function
    const response = await fetch('/api/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.text || "";
    console.log("Gemini Weather Response:", text);

    // Parse the response using Regex
    const minMatch = text.match(/MIN:\s*(-?\d+)/i);
    const maxMatch = text.match(/MAX:\s*(-?\d+)/i);
    const condMatch = text.match(/COND:\s*(.+)/i);

    // Fallback values if parsing fails
    const minTemp = minMatch ? parseInt(minMatch[1]) : 0;
    const maxTemp = maxMatch ? parseInt(maxMatch[1]) : 10;
    const condition = condMatch ? condMatch[1].trim() : "晴時多雲";
    
    const avgTemp = (minTemp + maxTemp) / 2;

    // Determine Scenario
    let scenario = WeatherScenario.COMFORTABLE;
    if (avgTemp < 5) scenario = WeatherScenario.COLD;
    else if (avgTemp >= 5 && avgTemp < 15) scenario = WeatherScenario.COOL;
    else if (avgTemp >= 15 && avgTemp < 22) scenario = WeatherScenario.COMFORTABLE;
    else scenario = WeatherScenario.WARM;

    // Extract Grounding Sources
    // The API returns groundingMetadata directly
    const sources: WeatherSource[] = [];
    if (data.groundingMetadata?.groundingChunks) {
      data.groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "天氣資料來源",
            uri: chunk.web.uri || "#"
          });
        }
      });
    }

    return { minTemp, maxTemp, avgTemp, condition, scenario, sources };

  } catch (error) {
    console.error("Gemini Weather Fetch Error:", error);
    // Return a safe fallback in case of API error
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