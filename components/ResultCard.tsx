import React, { useEffect, useState } from 'react';
import { GenerationResult } from '../types';
import { CloudSun, Thermometer, Wind, RefreshCw, Calendar, Shirt, Sparkles, PenTool, Sun, ExternalLink } from 'lucide-react';

interface ResultCardProps {
  result: GenerationResult;
  onReset: () => void;
  selectedDate: string;
  cityName: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onReset, selectedDate, cityName }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Simple fade-in animation trigger
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // Manually parse YYYY-MM-DD to avoid Timezone issues
    const [year, month, day] = dateStr.split('-');
    return `${year}年 ${parseInt(month)}月 ${parseInt(day)}日`;
  };

  return (
    <div className={`w-full max-w-4xl mx-auto transition-opacity duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Sunny's Message Bubble */}
      <div className="flex items-start gap-4 mb-8 max-w-2xl mx-auto">
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-600 shadow-md z-10">
          <Sun size={32} />
        </div>
        <div className="bg-white p-6 rounded-2xl rounded-tl-none shadow-lg border border-stone-100 relative flex-1">
           <h3 className="text-amber-800 font-bold mb-1 text-sm uppercase tracking-wider">Sunny 桑尼 說：</h3>
           <p className="text-stone-700 text-lg leading-relaxed">
             {result.recommendation.message}
           </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Left: Weather Info */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-white shadow-lg flex flex-col justify-between h-full">
          <div>
            {/* Header: Date and City */}
            <div className="mb-6 border-b border-stone-200/50 pb-4">
              <h2 className="text-2xl font-bold text-stone-800 mb-2">{cityName}</h2>
              <div className="flex items-center gap-2 text-stone-500">
                <Calendar size={18} className="text-amber-500"/>
                <span className="font-medium tracking-wide">{formatDate(selectedDate)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-stone-400 mb-6">
              <CloudSun size={18} />
              <span className="font-medium tracking-wide text-xs uppercase">天氣預報</span>
            </div>
            
            {/* Temperature Block */}
            <div className="py-4 flex items-center justify-center gap-8">
              <div className="flex flex-col items-center w-24">
                <span className="text-stone-400 text-xs uppercase tracking-wider mb-2 font-medium">最低 Low</span>
                <span className="text-5xl font-bold text-stone-800 tracking-tight">
                  {result.weather.minTemp}°
                </span>
              </div>
              
              <div className="h-16 w-px bg-stone-200 rotate-12 mx-2"></div>
              
              <div className="flex flex-col items-center w-24">
                <span className="text-stone-400 text-xs uppercase tracking-wider mb-2 font-medium">最高 High</span>
                <span className="text-5xl font-bold text-stone-800 tracking-tight">
                  {result.weather.maxTemp}°
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white p-4 rounded-2xl border border-stone-100 flex flex-col items-center shadow-sm">
                <Thermometer className="text-amber-500 mb-2" size={20}/>
                <span className="text-stone-400 text-xs uppercase">平均體感</span>
                <span className="text-stone-700 font-bold">{Math.round(result.weather.avgTemp - 2)}°</span>
              </div>
               <div className="bg-white p-4 rounded-2xl border border-stone-100 flex flex-col items-center shadow-sm">
                <Wind className="text-blue-400 mb-2" size={20}/>
                <span className="text-stone-400 text-xs uppercase">風速</span>
                <span className="text-stone-700 font-bold">微風</span>
              </div>
            </div>

            {/* Grounding Sources */}
            {result.weather.sources && result.weather.sources.length > 0 && (
              <div className="mt-8 pt-4 border-t border-stone-100">
                <p className="text-stone-400 text-[10px] uppercase mb-2">資料來源</p>
                <div className="flex flex-wrap gap-2">
                  {result.weather.sources.slice(0, 3).map((source, index) => (
                    <a 
                      key={index} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-stone-500 hover:text-amber-600 bg-white border border-stone-200 rounded-full px-2 py-1 transition-colors truncate max-w-[150px]"
                    >
                      <ExternalLink size={10} />
                      <span className="truncate">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right: Text Description Card (Stylist Note) */}
        <div className="relative group h-full">
           <div className="absolute inset-0 bg-stone-900/5 rounded-3xl transform rotate-1 transition-transform duration-500 group-hover:rotate-0"></div>
           <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-stone-200 h-full flex flex-col">
              
              <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                      <Shirt size={20} />
                   </div>
                   <h4 className="font-bold text-stone-800 text-lg">{result.recommendation.label}</h4>
                </div>
                <Sparkles size={16} className="text-amber-300" />
              </div>

              <div className="flex-1">
                <div className="text-stone-600 font-light leading-relaxed space-y-3">
                  {result.recommendation.outfitDetails.split('\n').map((line, index) => (
                    line.trim() && (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-amber-400 mt-1.5 text-xs">●</span>
                        <span>{line.trim()}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-stone-400 text-xs mb-1">
                     <PenTool size={12} />
                     <span className="uppercase tracking-widest">穿搭筆記</span>
                  </div>
                  <div className="text-amber-600 font-bold text-lg flex items-center gap-1">
                     Sunny 桑尼 ✨
                  </div>
                </div>
              </div>

           </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <button 
          onClick={onReset}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 hover:text-amber-600 transition-colors shadow-sm"
        >
          <RefreshCw size={18} />
          查詢其他日期或城市
        </button>
      </div>

    </div>
  );
};

export default ResultCard;