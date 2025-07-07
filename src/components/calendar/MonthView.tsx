import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MonthView() {
  const { state, dispatch } = useApp();
  const { selectedDate, days, settings } = state;

  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const today = new Date();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const startDate = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

  const formatDateKey = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date).replace(/\./g, '-');
  };

  const getMonthTime = () => {
    let totalMinutes = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
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

  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentMonth && 
           selectedDate.getFullYear() === currentYear;
  };

  const hasTasks = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateKey = formatDateKey(date);
    return days[dateKey] && days[dateKey].tasks.length > 0;
  };

  const getWeekOfMonth = (day: number) => {
    return Math.floor((day + startDate - 1) / 7);
  };

  const isInSelectedWeek = (day: number) => {
    const selectedWeek = getWeekOfMonth(selectedDate.getDate());
    const dayWeek = getWeekOfMonth(day);
    return selectedWeek === dayWeek;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'week' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-xl';
      default: return 'text-lg';
    }
  };

  const monthName = new Intl.DateTimeFormat('ru-RU', { 
    month: 'long', 
    year: 'numeric' 
  }).format(selectedDate);

  const monthTime = getMonthTime();

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className={`p-2 rounded-lg transition-colors ${
            settings.theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className={`text-xl sm:text-2xl font-bold capitalize ${
            settings.theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            {monthName}
          </div>
          <div className={`text-sm font-medium ${
            settings.theme === 'dark' ? 'text-green-400' : 'text-green-600'
          }`}>
            Время: {monthTime}
          </div>
        </div>

        <button
          onClick={() => navigateMonth('next')}
          className={`p-2 rounded-lg transition-colors ${
            settings.theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
          <div
            key={day}
            className={`text-center py-2 sm:py-3 font-semibold ${getFontSizeClass()} ${
              index >= 5
                ? 'text-red-500'
                : settings.theme === 'dark'
                  ? 'text-gray-300'
                  : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startDate }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(currentYear, currentMonth, day);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const todayCheck = isToday(day);
          const selectedCheck = isSelected(day);
          const hasTasksCheck = hasTasks(day);
          const inSelectedWeek = isInSelectedWeek(day);

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg transition-all duration-200
                ${getFontSizeClass()} font-medium relative
                ${todayCheck
                  ? 'text-white shadow-lg ring-2 ring-opacity-50'
                  : selectedCheck
                    ? 'text-white shadow-lg'
                    : inSelectedWeek
                      ? settings.theme === 'dark'
                        ? 'bg-gray-600 text-white'
                        : 'bg-blue-100 text-blue-800'
                      : isWeekend
                        ? settings.theme === 'dark'
                          ? 'text-red-400 hover:bg-gray-700'
                          : 'text-red-500 hover:bg-red-50'
                        : settings.theme === 'dark'
                          ? 'text-gray-200 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                }
                ${hasTasksCheck ? 'font-bold' : ''}
              `}
              style={
                todayCheck 
                  ? { backgroundColor: settings.todayColor, ringColor: settings.todayColor }
                  : selectedCheck && !todayCheck 
                    ? { backgroundColor: settings.buttonColor } 
                    : {}
              }
            >
              <span className="text-base sm:text-lg">{day}</span>
              {hasTasksCheck && (
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}