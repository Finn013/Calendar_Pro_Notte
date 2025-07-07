import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function YearView() {
  const { state, dispatch } = useApp();
  const { selectedDate, days, settings } = state;

  const currentYear = selectedDate.getFullYear();
  const today = new Date();

  const formatDateKey = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date).replace(/\./g, '-');
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const hasTasks = (date: Date) => {
    const dateKey = formatDateKey(date);
    return days[dateKey] && days[dateKey].tasks.length > 0;
  };

  const getMonthTime = (monthIndex: number) => {
    let totalMinutes = 0;
    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, monthIndex, day);
      const dateKey = formatDateKey(date);
      const dayData = days[dateKey];
      if (dayData && dayData.timeEntries) {
        totalMinutes += dayData.timeEntries.reduce((sum, entry) => 
          sum + (entry.hours * 60) + entry.minutes, 0
        );
      }
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleDateClick = (date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'week' });
  };

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'month' });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-xs';
      case 'large': return 'text-base';
      default: return 'text-sm';
    }
  };

  const renderMonth = (monthIndex: number) => {
    const monthDate = new Date(currentYear, monthIndex, 1);
    const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(monthDate);
    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
    const firstDayWeekday = monthDate.getDay();
    const startDate = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
    const monthTime = getMonthTime(monthIndex);

    return (
      <div
        key={monthIndex}
        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
          settings.theme === 'dark'
            ? 'border-gray-600 bg-gray-700 hover:bg-gray-650'
            : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => handleMonthClick(monthIndex)}
            className={`font-bold capitalize ${getFontSizeClass()} ${
              settings.theme === 'dark' ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'
            } transition-colors`}
          >
            {monthName}
          </button>
          <span className={`text-xs font-medium ${
            settings.theme === 'dark' ? 'text-green-400' : 'text-green-600'
          }`}>
            {monthTime}
          </span>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <div
              key={day}
              className={`text-center py-1 text-xs font-medium ${
                settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startDate }, (_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(currentYear, monthIndex, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const todayCheck = isToday(date);
            const hasTasksCheck = hasTasks(date);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(date)}
                className={`
                  aspect-square flex items-center justify-center transition-all duration-200
                  text-xs font-medium relative rounded
                  ${todayCheck
                    ? 'text-white shadow-lg transform scale-110 z-10'
                    : isWeekend
                      ? settings.theme === 'dark'
                        ? 'text-red-400 hover:bg-gray-600'
                        : 'text-red-500 hover:bg-red-50'
                      : settings.theme === 'dark'
                        ? 'text-gray-200 hover:bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${hasTasksCheck ? 'font-bold' : ''}
                `}
                style={todayCheck ? { backgroundColor: settings.todayColor } : {}}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateYear('prev')}
          className={`p-2 rounded-lg transition-colors ${
            settings.theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className={`text-2xl font-bold ${
          settings.theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          {currentYear}
        </div>

        <button
          onClick={() => navigateYear('next')}
          className={`p-2 rounded-lg transition-colors ${
            settings.theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
      </div>
    </div>
  );
}