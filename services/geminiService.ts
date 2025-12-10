import { GoogleGenAI } from "@google/genai";
import { WeatherData, WeatherScenario, WeatherSource } from "../types";

/**
 * Fetches real weather data using the Google GenAI SDK directly from the client.
 * Suitable for self-hosted environments where a backend proxy is not used.
 */
export const fetchWeatherWithGemini = async (city: string, date: string): Promise<WeatherData> => {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.error("❌ 找不到 API Key！請確認您的專案根目錄下是否有 '.env' 檔案，並且內容包含 'API_KEY=您的金鑰'。");
      throw new Error("API Key is missing. Please check your .env file.");
    }

    // Initialize the Gemini client with the API key from environment variables.
    const ai = new GoogleGenAI({ apiKey });

    // 更精確的 Prompt 工程，區分「短期預報」與「歷史平均」
    const prompt = `
      Action: Use Google Search to find the weather for ${city} on ${date}.
      
      Instructions:
      1. If the date is within the next 10 days, find the specific weather forecast numbers.
      2. If the date is far in the future (more than 10 days), find the "historical average temperature" for ${city} in that month.
      3. Extract the Maximum Temperature (Highest) and Minimum Temperature (Lowest) in Celsius.
      4. Summarize the condition (e.g., Sunny, Cloudy, Snow) in Traditional Chinese. If using historical data, append "(歷史平均)" to the condition.

      Output Format (Strictly follow this):
      MIN: <number>
      MAX: <number>
      COND: <text>
      
      Example:
      MIN: -5
      MAX: 3
      COND: 多雲時陰
    `;

    // Call Google Gemini 2.5 Flash directly
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable Google Search Grounding for real-time weather
      }
    });

    const text = response.text || "";
    console.log("Gemini Weather Response:", text);

    // Parse the response using more flexible Regex
    const minMatch = text.match(/MIN:\s*([-\d]+)/i);
    const maxMatch = text.match(/MAX:\s*([-\d]+)/i);
    const condMatch = text.match(/COND:\s*(.+)/i);

    let minTemp = minMatch ? parseInt(minMatch[1], 10) : null;
    let maxTemp = maxMatch ? parseInt(maxMatch[1], 10) : null;
    let condition = condMatch ? condMatch[1].trim() : "晴時多雲";

    // Smart Fallback based on Month if parsing fails completely
    // This avoids showing "0-10" for every error case which looks fake.
    if (minTemp === null || maxTemp === null) {
        console.warn("Weather parsing failed, using seasonal fallback.");
        const month = new Date(date).getMonth() + 1;
        
        // Simple seasonal estimation for Korea (Seoul base)
        if (month >= 12 || month <= 2) { // Winter
            minTemp = -8; maxTemp = 2; condition = "寒冷 (季節估算)";
        } else if (month >= 3 && month <= 5) { // Spring
            minTemp = 8; maxTemp = 18; condition = "涼爽 (季節估算)";
        } else if (month >= 6 && month <= 8) { // Summer
            minTemp = 22; maxTemp = 30; condition = "炎熱 (季節估算)";
        } else { // Autumn
            minTemp = 10; maxTemp = 20; condition = "舒適 (季節估算)";
        }
    }
    
    const avgTemp = (minTemp + maxTemp) / 2;

    // Determine Scenario
    let scenario = WeatherScenario.COMFORTABLE;
    if (avgTemp < 5) scenario = WeatherScenario.COLD;
    else if (avgTemp >= 5 && avgTemp < 15) scenario = WeatherScenario.COOL;
    else if (avgTemp >= 15 && avgTemp < 22) scenario = WeatherScenario.COMFORTABLE;
    else scenario = WeatherScenario.WARM;

    // Extract Grounding Sources
    const sources: WeatherSource[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Google Search 來源",
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
      condition: "系統繁忙",
      scenario: WeatherScenario.COMFORTABLE,
      sources: []
    };
  }
};