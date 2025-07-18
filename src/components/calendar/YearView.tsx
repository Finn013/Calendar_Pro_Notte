import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import CalendarSettingsView from './CalendarSettingsView';

export default function YearView() {
  const { state, dispatch } = useApp();
  const { selectedDate, days, settings } = state;
  const calendarSettings = settings.calendarSettings || { todayColor: '#EF4444', dayShape: 'rounded', animationType: 'slide' };
  const calendarBackgrounds = state.calendarBackgrounds || { year: '', month: '', week: '' };

  // --- Новое: получаем настройку отображения иконок повторяющихся задач ---
  const [repeatingShowIcons, setRepeatingShowIcons] = useState<{ year: boolean }>({ year: true });
  useEffect(() => {
    const saved = localStorage.getItem('calendar-repeating-showIcons');
    setRepeatingShowIcons(saved ? JSON.parse(saved) : { year: true });
  }, [selectedDate]);
  // --- Получаем повторяющиеся задачи ---
  const [repeatingTasks, setRepeatingTasks] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('calendar-repeating-tasks');
    setRepeatingTasks(saved ? JSON.parse(saved) : []);
  }, [selectedDate]);
  // --- Получаем настройки графика ---
  const [schedule, setSchedule] = useState(() => {
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
    if (!schedule.showIcons?.year) return null;
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

  // Получаем фон и выделение из localStorage
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);

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
            {monthName.toUpperCase()}
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
              } capitalize`}
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
            const isSelected =
              selectedDate.getDate() === day &&
              selectedDate.getMonth() === monthIndex &&
              selectedDate.getFullYear() === currentYear;

            // Определяем форму выделения для сегодняшнего дня
            let shapeClass = 'rounded';
            switch (calendarSettings.dayShape) {
              case 'square': shapeClass = 'rounded-none'; break;
              case 'circle': shapeClass = 'rounded-full'; break;
              case 'octagon': shapeClass = 'octagon-btn'; break;
              default: shapeClass = 'rounded';
            }

            return (
              <button
                key={day}
                onClick={() => handleDateClick(date)}
                className={
                  `aspect-square flex items-center justify-center transition-all duration-200 text-xs font-medium relative ` +
                  (todayCheck
                    ? `${shapeClass} text-white shadow-lg scale-110 z-10`
                    : isSelected
                      ? 'rounded border-2 border-blue-400 z-10'
                      : isWeekend
                        ? settings.theme === 'dark'
                          ? 'text-red-400 hover:bg-gray-600'
                          : 'text-red-500 hover:bg-red-50'
                        : settings.theme === 'dark'
                          ? 'text-gray-200 hover:bg-gray-600'
                          : 'text-gray-700 hover:bg-gray-100'
                  ) +
                  (hasTasksCheck ? ' font-bold' : '')
                }
                style={todayCheck
                  ? { backgroundColor: calendarSettings.todayColor }
                  : {}}
              >
                {day}
                {/* Показываем иконку графика, если включено в настройках графика */}
                {schedule.showIcons?.year && getScheduleIcon(date) && (
                  <span title="График" style={{ fontSize: '1.1em', marginLeft: 2 }}>{getScheduleIcon(date)}</span>
                )}
                {/* Показываем иконки повторяющихся задач всех типов, если включено в настройках */}
                {repeatingShowIcons.year && repeatingTasks.filter(t => {
                  if (t.type === 'yearly') return t.day === day && t.month === (monthIndex + 1);
                  if (t.type === 'monthly') return t.day === day;
                  if (t.type === 'weekly') return t.weekday === date.getDay();
                  return false;
                }).map((t, idx) => (
                  <span key={idx} title={t.text} style={{ color: t.color, fontSize: '1.1em', marginLeft: 2 }}>{t.icon}</span>
                ))}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6" style={(calendarBackgrounds.year || '').startsWith('data:') ? { backgroundImage: `url(${calendarBackgrounds.year})`, backgroundSize: 'cover', backgroundPosition: 'center' } : calendarBackgrounds.year ? { background: calendarBackgrounds.year } : {}}>
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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{currentYear}</h2>
        {/* Кнопка настроек календаря временно удалена */}
      </div>
      {showCalendarSettings && <CalendarSettingsView onClose={() => setShowCalendarSettings(false)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
      </div>
    </div>
  );
}