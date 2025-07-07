import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import YearView from './calendar/YearView';
import MonthView from './calendar/MonthView';
import WeekView from './calendar/WeekView';

interface CalendarViewProps {
  onBack: () => void;
}

export default function CalendarView({ onBack }: CalendarViewProps) {
  const { state, dispatch } = useApp();
  const { currentView, selectedDate, settings } = state;

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-xl';
      default: return 'text-lg';
    }
  };

  const getButtonStyle = () => {
    const baseStyle = `${getFontSizeClass()} font-medium transition-all duration-200`;
    
    switch (settings.buttonStyle) {
      case 'square':
        return `${baseStyle} rounded-none`;
      case 'pill':
        return `${baseStyle} rounded-full`;
      case 'hexagon':
        return `${baseStyle} rounded-lg transform rotate-0 hover:rotate-3`;
      default:
        return `${baseStyle} rounded-lg`;
    }
  };

  const handleViewChange = (view: 'year' | 'month' | 'week') => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  };

  const handleDateChange = (date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  };

  // Touch handling for swipe gestures
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Minimum swipe distance
      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        // Horizontal swipe for all views
        const newDate = new Date(selectedDate);
        
        if (currentView === 'year') {
          newDate.setFullYear(newDate.getFullYear() + (deltaX > 0 ? -1 : 1));
        } else if (currentView === 'month') {
          newDate.setMonth(newDate.getMonth() + (deltaX > 0 ? -1 : 1));
        } else if (currentView === 'week') {
          newDate.setDate(newDate.getDate() + (deltaX > 0 ? -7 : 7));
        }
        
        handleDateChange(newDate);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentView, selectedDate, handleDateChange]);

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className={`${getButtonStyle()} p-2 sm:p-3 text-white`}
            style={{ backgroundColor: settings.buttonColor }}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <h1 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Календарь
          </h1>

          <div className="w-10 sm:w-12" />
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className={`inline-flex rounded-lg p-1 ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            {(['year', 'month', 'week'] as const).map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`
                  px-3 sm:px-4 py-2 ${getFontSizeClass()} font-medium transition-all duration-200
                  ${currentView === view
                    ? 'text-white shadow-md'
                    : settings.theme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }
                  ${settings.buttonStyle === 'pill' ? 'rounded-full' : 'rounded-md'}
                `}
                style={currentView === view ? { backgroundColor: settings.buttonColor } : {}}
              >
                {view === 'year' ? 'Год' : view === 'month' ? 'Месяц' : 'Неделя'}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Content */}
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
          {currentView === 'year' && <YearView />}
          {currentView === 'month' && <MonthView />}
          {currentView === 'week' && <WeekView />}
        </div>
      </div>
    </div>
  );
}