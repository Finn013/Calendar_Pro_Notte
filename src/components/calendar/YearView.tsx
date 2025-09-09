import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useSwipeGestures } from '../../hooks/useSwipeGestures';

// --- КОМПОНЕНТ МИНИ-КАЛЕНДАРЯ ДЛЯ МЕСЯЦА ---
const MiniMonth = ({ year, month, monthName, totalTime, onMonthClick, calendarSettings, settings }: any) => {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const correctedFirstDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Получаем настройки выделения дня
  const todayColor = calendarSettings?.todayColor || '#EF4444';
  const dayShape = calendarSettings?.dayShape || 'rounded';

  // Функция для получения стилей выделения текущего дня
  const getTodayStyles = () => {
    const baseStyles = {
      backgroundColor: todayColor,
      color: 'white'
    };

    switch (dayShape) {
      case 'square':
        return { ...baseStyles, borderRadius: '0' };
      case 'circle':
        return { ...baseStyles, borderRadius: '50%' };
      case 'octagon':
        return { ...baseStyles, borderRadius: '0.375rem', clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)' };
      case 'rounded':
      default:
        return { ...baseStyles, borderRadius: '50%' };
    }
  };

  const dayCells = Array.from({ length: correctedFirstDay }, (_, i) => (
    <div key={`empty-${i}`} className="w-4 h-4"></div>
  ));

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    dayCells.push(
      <div 
        key={day} 
        className={`w-4 h-4 flex items-center justify-center text-xs ${isToday ? '' : (settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-900')}`}
        style={isToday ? getTodayStyles() : {}}
      >
        {day}
      </div>
    );
  }

  return (
    <div 
      onClick={onMonthClick}
      className="p-3 text-center rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700"
    >
      <p className={`font-semibold capitalize ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{monthName}</p>
      {totalTime && (
        <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-1">
          {totalTime}
        </p>
      )}
      <div className="grid grid-cols-7 gap-1 mt-3">
        {['П', 'В', 'С', 'Ч', 'П', 'С', 'В'].map((d, i) => <div key={i} className={`text-xs font-bold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`}>{d}</div>)}
        {dayCells}
      </div>
    </div>
  );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ВИДА "ГОД" ---
export default function YearView({ settings: propSettings }: { settings?: any }) {
  const { state, dispatch } = useApp();
  const { selectedDate, days, calendarBackgrounds, settings: contextSettings } = state;
  const settings = propSettings || contextSettings;
  const year = selectedDate.getFullYear();
  
  // Получаем настройки календаря для применения стилей выделения
  const calendarSettings = settings.calendarSettings || { todayColor: '#EF4444', dayShape: 'rounded' };

  const handleMonthClick = (month: number) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: new Date(year, month, 1) });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'month' });
  };

  // Поддержка свайпов для навигации по годам
  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => dispatch({ type: 'SET_SELECTED_DATE', payload: new Date(year + 1, 0, 1) }),
    onSwipeRight: () => dispatch({ type: 'SET_SELECTED_DATE', payload: new Date(year - 1, 0, 1) })
  });

  const monthlyTimes = useMemo(() => {
    const times: { [key: number]: string } = {};
    for (let month = 0; month < 12; month++) {
      let totalMinutes = 0;
      for (const dateKey in days) {
        const [dYear, dMonth] = dateKey.split('-').map(Number);
        if (dYear === year && dMonth === month + 1) {
          totalMinutes += days[dateKey].timeEntries?.reduce((acc, curr) => acc + (curr.hours * 60) + curr.minutes, 0) || 0;
        }
      }
      if (totalMinutes > 0) {
        times[month] = `${Math.floor(totalMinutes / 60)}ч ${totalMinutes % 60}м`;
      }
    }
    return times;
  }, [days, year]);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  return (
    <div 
      className="p-4"
      ref={swipeRef as any}
      style={calendarBackgrounds.year ? (
        calendarBackgrounds.year.startsWith('data:') 
          ? { backgroundImage: `url(${calendarBackgrounds.year})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: calendarBackgrounds.year }
      ) : {}}
    >
      <h2 className={`text-2xl font-bold text-center mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{year}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {monthNames.map((monthName, index) => (
          <MiniMonth 
            key={index}
            year={year}
            month={index}
            monthName={monthName}
            totalTime={monthlyTimes[index]}
            onMonthClick={() => handleMonthClick(index)}
            calendarSettings={calendarSettings}
            settings={settings}
          />
        ))}
      </div>
    </div>
  );
}