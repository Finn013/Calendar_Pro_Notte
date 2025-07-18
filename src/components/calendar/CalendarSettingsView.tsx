
import { useApp } from '../../context/AppContext';
import { Hexagon, Square, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const animationOptions = [
  { value: 'fade', label: 'Плавное появление' },
  { value: 'slide', label: 'Сдвиг' },
  { value: 'scale', label: 'Масштаб' },
  { value: 'none', label: 'Без анимации' },
  { value: 'flip', label: 'Переворот' },
  { value: 'rotate', label: 'Вращение' },
  { value: 'bounce', label: 'Пружина' },
  { value: 'blur', label: 'Размытие' },
];

const defaultCalendarSettings = {
  todayColor: '#EF4444',
  animationType: 'slide' as const,
  dayShape: 'rounded' as const,
  animationCombo1: 'fade' as const,
  animationCombo2: 'slide' as const,
};

export default function CalendarSettingsView({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const calendarSettings = { ...defaultCalendarSettings, ...settings.calendarSettings };
  const todayColors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];
  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-xl';
      default: return 'text-lg';
    }
  };
  const updateCalendarSettings = (updates: Partial<typeof calendarSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { calendarSettings: { ...calendarSettings, ...updates } } });
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={onClose}>
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md relative`} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className={`text-xl font-bold mb-4 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Настройки календаря</h2>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Цвет выделения текущего дня</label>
            <div className="flex flex-wrap gap-2">
              {todayColors.map((color) => (
                <button
                  key={color}
                  onClick={() => updateCalendarSettings({ todayColor: color })}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 transition-all ${calendarSettings.todayColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'} btn-rotate`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}><Hexagon className="w-4 h-4" />Анимация переходов</label>
            <select
              value={calendarSettings.animationType || 'slide'}
              onChange={e => updateCalendarSettings({ animationType: e.target.value as 'fade' | 'slide' | 'scale' | 'none' | 'flip' | 'rotate' | 'bounce' | 'blur' | 'combo' })}
              className={`w-full py-2 px-4 rounded-lg border transition-colors ${getFontSizeClass()} ${settings.theme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'} btn-rotate`}
            >
              {animationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
              <option value="combo">Комбинированная</option>
            </select>
            {calendarSettings.animationType === 'combo' && (
              <div className="flex gap-2 mt-2">
                <select
                  value={calendarSettings.animationCombo1 || 'fade'}
                  onChange={e => updateCalendarSettings({ animationCombo1: e.target.value as 'fade' | 'slide' | 'scale' | 'none' | 'flip' | 'rotate' | 'bounce' | 'blur' })}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${getFontSizeClass()} ${settings.theme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'} btn-rotate`}
                >
                  {animationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={calendarSettings.animationCombo2 || 'slide'}
                  onChange={e => updateCalendarSettings({ animationCombo2: e.target.value as 'fade' | 'slide' | 'scale' | 'none' | 'flip' | 'rotate' | 'bounce' | 'blur' })}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${getFontSizeClass()} ${settings.theme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'} btn-rotate`}
                >
                  {animationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}><Square className="w-4 h-4" />Вид выделенного дня (год, месяц)</label>
            <div className="grid grid-cols-2 gap-2">
              {(['rounded', 'square', 'circle', 'octagon'] as const).map((shape) => (
                <button
                  key={shape}
                  onClick={() => updateCalendarSettings({ dayShape: shape })}
                  className={`py-2 px-4 border transition-colors ${getFontSizeClass()} ${calendarSettings.dayShape === shape ? 'border-blue-500 bg-blue-50 text-blue-700' : settings.theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} ${shape === 'rounded' ? 'rounded-lg' : shape === 'square' ? 'rounded-none' : shape === 'circle' ? 'rounded-full' : 'octagon-btn'} btn-rotate`}
                >
                  {shape === 'rounded' ? '⬜ Скругленные' : shape === 'square' ? '⬛ Квадратные' : shape === 'circle' ? '⭕ Круглые' : '⯃ Октагон'}
                </button>
              ))}
            </div>
            <div className={`text-xs mt-2 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Применяется только к видам "Год" и "Месяц"</div>
          </div>
        </div>
      </div>
    </div>
  );
} 