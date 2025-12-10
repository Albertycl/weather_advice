import React, { useState, useCallback } from 'react';
import { City, WeatherScenario, OutfitRecommendation, GenerationResult } from './types';
import SelectionForm from './components/SelectionForm';
import ResultCard from './components/ResultCard';
import { fetchWeatherWithGemini } from './services/geminiService';

const App: React.FC = () => {
  const [city, setCity] = useState<City>(City.SEOUL);
  const [date, setDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getCityNameCN = (c: City) => {
    switch (c) {
      case City.SEOUL: return '首爾';
      case City.BUSAN: return '釜山';
      case City.JEJU: return '濟州島';
      default: return c;
    }
  };

  const getRecommendation = (targetCity: City, scenario: WeatherScenario): OutfitRecommendation => {
    const cityName = getCityNameCN(targetCity);

    switch (scenario) {
      case WeatherScenario.COLD:
        return {
          message: `哇！這幾天${cityName}有點凍呢！親愛的，為了不感冒，請務必參考我的保暖建議喔～ ❄️`,
          label: "全套保暖裝備",
          outfitDetails: `建議穿著長版羽絨外套或羊毛大衣
內搭發熱衣與高領毛衣
下身搭配刷毛長褲或厚實裙裝
別忘了圍上喀什米爾圍巾
戴上毛帽既保暖又時尚`,
        };
      case WeatherScenario.COOL:
        return {
          message: `${cityName}現在涼涼的，最適合穿大衣了！這套搭配讓您在景點拍照超好看喔！ ✨`,
          label: "韓系質感層次穿搭",
          outfitDetails: `推薦穿著剪裁俐落的風衣
內搭一件質感針織衫或襯衫
下身選擇修身牛仔褲或長裙
搭配一雙好走的短靴
輕鬆展現韓系優雅風格`,
        };
      case WeatherScenario.COMFORTABLE:
        return {
          message: `${cityName}的天氣超棒的！微風徐徐，穿這樣去逛街或看海最舒服了～ 💖`,
          label: "舒適輕旅行風",
          outfitDetails: `建議穿著輕薄針織開襟衫
搭配棉質 T-shirt 或雪紡上衣
下身選擇休閒寬褲或百褶裙
搭配小白鞋或平底鞋
讓您的腳步更加輕盈`,
        };
      case WeatherScenario.WARM:
        return {
          message: `陽光普照的${cityName}！記得防曬喔，這套輕薄透氣的穿搭送給您！ ☀️🕶️`,
          label: "清爽透氣造型",
          outfitDetails: `建議選擇亞麻或棉質透氣衣物
設計感短袖上衣或洋裝
戴上太陽眼鏡和遮陽帽
搭配一雙透氣的涼鞋
享受清爽的夏日旅程`,
        };
      default:
        return {
           message: `歡迎來到${cityName}！今天天氣不錯！`,
           label: "日常穿搭",
           outfitDetails: `建議穿著舒適的休閒服裝
選擇透氣材質
搭配好走的步行鞋
方便活動為主`,
        };
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!date) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Use Gemini Service to fetch real weather data
      const cityNameCN = getCityNameCN(city);
      const weather = await fetchWeatherWithGemini(cityNameCN, date);
      
      const recommendation = getRecommendation(city, weather.scenario);

      setResult({
        weather,
        recommendation,
      });

    } catch (err) {
      console.error(err);
      setError("哎呀！Sunny 桑尼 正在休息，請稍後再試試看！✨");
    } finally {
      setIsLoading(false);
    }
  }, [date, city]);

  const handleReset = () => {
    setResult(null);
    setDate('');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-20">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/40 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <header className="relative pt-12 pb-6 px-6 text-center z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-2 tracking-tight">
          韓國導遊領隊桑尼Sunny <span className="text-amber-500 text-3xl block mt-2 md:inline md:mt-0 md:text-5xl">穿搭小幫手</span>
        </h1>
        <p className="text-stone-500 font-medium tracking-widest text-xs uppercase">
          您的專屬旅遊穿搭顧問
        </p>
      </header>

      <main className="relative z-10 px-4 md:px-8 max-w-6xl mx-auto">
        {error && (
            <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 text-red-800 rounded-xl border border-red-100 text-center text-sm">
                {error}
            </div>
        )}

        {!result ? (
          <div className="mt-8 md:mt-16">
            <SelectionForm 
              selectedCity={city}
              setSelectedCity={setCity}
              selectedDate={date}
              setSelectedDate={setDate}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <div className="mt-8">
            <ResultCard 
              result={result} 
              onReset={handleReset} 
              selectedDate={date}
              cityName={getCityNameCN(city)}
            />
          </div>
        )}
      </main>
      
      <footer className="relative z-10 mt-20 text-center text-stone-400 text-xs py-8">
        <p>© 2025 韓國導遊領隊桑尼Sunny. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;