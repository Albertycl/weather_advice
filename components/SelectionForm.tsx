import React from 'react';
import { City } from '../types';
import { MapPin, Calendar, ArrowRight, Sun } from 'lucide-react';

interface SelectionFormProps {
  selectedCity: City;
  setSelectedCity: (city: City) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const SelectionForm: React.FC<SelectionFormProps> = ({
  selectedCity,
  setSelectedCity,
  selectedDate,
  setSelectedDate,
  onGenerate,
  isLoading
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/50 w-full max-w-md mx-auto transform transition-all hover:scale-[1.01]">
      <div className="mb-8 text-center">
        <span className="inline-block p-3 rounded-full bg-amber-100 text-amber-600 mb-3">
          <MapPin size={24} />
        </span>
        <h2 className="text-2xl font-bold text-stone-800 serif-font">開始您的旅程</h2>
        <p className="text-stone-500 mt-2 text-sm">請告訴 Sunny 桑尼 您想去哪裡？</p>
      </div>

      <div className="space-y-6">
        {/* City Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 pl-1">城市 City</label>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as City)}
              className="w-full bg-stone-50 border border-stone-200 text-stone-700 text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none appearance-none transition-all cursor-pointer"
              disabled={isLoading}
            >
              <option value={City.SEOUL}>首爾 (Seoul)</option>
              <option value={City.BUSAN}>釜山 (Busan)</option>
              <option value={City.JEJU}>濟州 (Jeju)</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <ArrowRight size={16} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 pl-1">日期 Date</label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-stone-50 border border-stone-200 text-stone-700 text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all"
              disabled={isLoading}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <Calendar size={20} />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onGenerate}
          disabled={isLoading || !selectedDate}
          className={`w-full mt-4 py-4 rounded-xl text-white font-medium text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300
            ${isLoading || !selectedDate
              ? 'bg-stone-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-amber-500/30 hover:-translate-y-0.5'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sunny 桑尼 思考中...
            </span>
          ) : (
            <>
              預覽天氣與穿搭 <span className="text-xl"><Sun size={20} className="inline"/></span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SelectionForm;