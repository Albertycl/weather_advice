export enum City {
  SEOUL = 'Seoul',
  BUSAN = 'Busan',
  JEJU = 'Jeju'
}

export enum WeatherScenario {
  COLD = 'COLD',       // < 5°C
  COOL = 'COOL',       // 5°C - 15°C
  COMFORTABLE = 'COMFORTABLE', // 15°C - 22°C
  WARM = 'WARM'        // > 22°C
}

export interface WeatherData {
  temperature: number;
  condition: string;
  scenario: WeatherScenario;
}

export interface OutfitRecommendation {
  message: string;
  label: string;
  outfitDetails: string; // Changed from imagePrompt to outfitDetails
}

export interface GenerationResult {
  weather: WeatherData;
  recommendation: OutfitRecommendation;
  // imageUrl removed
}