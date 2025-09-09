import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import YearView from './calendar/YearView';
import MonthView from './calendar/MonthView';
import WeekView from './calendar/WeekView';
import { AnimatePresence, motion } from 'framer-motion';

interface CalendarViewProps {
  onBack: () => void;
  onGoToSettings: () => void;
}

export default function CalendarView({ onBack, onGoToSettings }: CalendarViewProps) {
  const { state, dispatch } = useApp();
  const { currentView, settings } = state;

  const handleViewChange = (view: 'year' | 'month' | 'week') => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  };

  const getButtonStyle = () => {
    const baseStyle = `font-medium transition-all duration-200`;
    switch (settings.buttonStyle) {
      case 'square': return `${baseStyle} rounded-none`;
      case 'pill': return `${baseStyle} rounded-full`;
      case 'octagon': return `${baseStyle} octagon-btn`;
      default: return `${baseStyle} rounded-lg`;
    }
  };

  const calendarBaseVariants = {
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    slide: { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 } },
  };

  function getCalendarVariants(type: string): { initial: any; animate: any; exit: any } {
    const animType = settings.calendarSettings?.animationType || 'slide';
    return calendarBaseVariants[animType as keyof typeof calendarBaseVariants] || calendarBaseVariants['slide'];
  }

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button onClick={onBack} className={`${getButtonStyle()} p-2 sm:p-3 text-white`} style={{ backgroundColor: settings.buttonColor }}>
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h1 className={`text-xl sm:text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Календарь
          </h1>
          <button onClick={onGoToSettings} className={`${getButtonStyle()} p-2 sm:p-3 text-white`} style={{ backgroundColor: settings.buttonColor }}>
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex justify-center mb-4 sm:mb-6">
          <div className={`inline-flex rounded-lg p-1 ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            {(['year', 'month', 'week'] as const).map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-3 sm:px-4 py-2 font-medium transition-all duration-200 ${currentView === view ? 'text-white shadow-md' : settings.theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} ${settings.buttonStyle === 'pill' ? 'rounded-full' : 'rounded-md'}`}
                style={currentView === view ? { backgroundColor: settings.buttonColor } : {}}
              >
                {view === 'year' ? 'Год' : view === 'month' ? 'Месяц' : 'Неделя'}
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-xl shadow-lg overflow-hidden ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <AnimatePresence mode="wait">
            {currentView === 'year' && <motion.div key="year" variants={getCalendarVariants('year')} initial="initial" animate="animate" exit="exit"><YearView settings={settings} /></motion.div>}
            {currentView === 'month' && <motion.div key="month" variants={getCalendarVariants('month')} initial="initial" animate="animate" exit="exit"><MonthView settings={settings} /></motion.div>}
            {currentView === 'week' && <motion.div key="week" variants={getCalendarVariants('week')} initial="initial" animate="animate" exit="exit"><WeekView settings={settings} /></motion.div>}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}