import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MonthView() {
  const { state, dispatch } = useApp();
  const { selectedDate, days, settings } = state;
  const calendarSettings = settings.calendarSettings || { todayColor: '#EF4444', dayShape: 'rounded', animationType: 'slide' };
  const calendarBackgrounds = state.calendarBackgrounds || { year: '', month: '', week: '' };

  // --- Новое: получаем настройку отображения иконок повторяющихся задач ---
  const [repeatingShowIcons, setRepeatingShowIcons] = useState<{ month: boolean }>({ month: true });
  useEffect(() => {
    const saved = localStorage.getItem('calendar-repeating-showIcons');
    setRepeatingShowIcons(saved ? JSON.parse(saved) : { month: true });
  }, [selectedDate]);
  // --- Получаем повторяющиеся задачи ---
  const [repeatingTasks, setRepeatingTasks] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('calendar-repeating-tasks');
    setRepeatingTasks(saved ? JSON.parse(saved) : []);
  }, [selectedDate]);
  // --- Получаем настройки графика ---
  const [schedule] = useState(() => {
    const saved = localStorage.getItem('calendar-schedule');
    return saved ? JSON.parse(saved) : {
      from: new Date().toISOString().slice(0, 10),
      to: new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10),
      workDays: 5,
      restDays: 2,
      workIcon: '💼',
      restIcon: '🏖️',
      showIcons: { year: true, month: true, week: true }
    };
  });
  // --- Функция для определения, рабочий или выходной день ---
  function getScheduleIcon(date: Date) {
    if (!schedule.showIcons?.month) return null;
    const from = new Date(schedule.from);
    const to = new Date(schedule.to);
    if (date < from || date > to) return null;
    const dayIndex = Math.floor((date.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    const cycle = schedule.workDays + schedule.restDays;
    if (cycle === 0) return null;
    const pos = dayIndex % cycle;
    if (pos < schedule.workDays) return schedule.workIcon;
    return schedule.restIcon;
  }

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
    <div className="p-4 sm:p-6" style={(calendarBackgrounds.month || '').startsWith('data:') ? { backgroundImage: `url(${calendarBackgrounds.month})`, backgroundSize: 'cover', backgroundPosition: 'center' } : calendarBackgrounds.month ? { background: calendarBackgrounds.month } : {}}>
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
            {monthName.toUpperCase()}
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
            } capitalize`}
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

          // Определяем форму выделения для сегодняшнего дня
          let shapeClass = 'rounded-lg';
          switch (calendarSettings.dayShape) {
            case 'square': shapeClass = 'rounded-none'; break;
            case 'circle': shapeClass = 'rounded-full'; break;
            case 'octagon': shapeClass = 'octagon-btn'; break;
            default: shapeClass = 'rounded-lg';
          }

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={
                `aspect-square flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-200 font-medium relative ` +
                (todayCheck
                  ? `${shapeClass} text-white shadow-lg scale-110 z-10`
                  : selectedCheck
                    ? 'rounded-lg border-2 border-blue-400 z-10'
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
                ) +
                (hasTasksCheck ? ' font-bold' : '')
              }
              style={todayCheck
                ? { backgroundColor: calendarSettings.todayColor }
                : {}}
            >
              <span className="text-base sm:text-lg">{day}</span>
              {/* Показываем иконку графика, если включено в настройках графика */}
              {schedule.showIcons?.month && getScheduleIcon(date) && (
                <span title="График" style={{ fontSize: '1.1em', marginLeft: 2 }}>{getScheduleIcon(date)}</span>
              )}
              {/* Показываем иконки повторяющихся задач, если включено в настройках */}
              {repeatingShowIcons.month && repeatingTasks.filter(t => {
                if (t.type === 'monthly') return true;
                if (t.type === 'yearly') return t.month === (currentMonth + 1);
                return false;
              }).filter(t => (t.type === 'monthly' && t.day === day) || (t.type === 'yearly' && t.day === day)).map((t, idx) => (
                <span key={idx} title={t.text} style={{ color: t.color, fontSize: '1.1em', marginLeft: 2 }}>{t.icon}</span>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}