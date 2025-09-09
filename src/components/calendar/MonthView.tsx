import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getRepeatingTasksForDate } from '../../utils/calendarUtils';
import { iconLibrary } from './CalendarSettingsView';
import DayDetailView from './DayDetailView';
import { useSwipeGestures } from '../../hooks/useSwipeGestures';

const IconComponent = ({ name, ...props }: { name: string, [key: string]: any }) => {
  const Icon = iconLibrary[name as keyof typeof iconLibrary] || null;
  return Icon ? <Icon {...props} /> : null;
};

export default function MonthView({ settings: propSettings }: { settings?: any }) {
  const { state, dispatch } = useApp();
  const { selectedDate, days, settings: contextSettings, repeatingTasks, calendarBackgrounds } = state;
  const settings = propSettings || contextSettings;

  // Получаем настройки календаря для применения стилей выделения
  const calendarSettings = settings.calendarSettings || { todayColor: '#EF4444', dayShape: 'rounded' };
  const todayColor = calendarSettings.todayColor || '#EF4444';
  const dayShape = calendarSettings.dayShape || 'rounded';

  // Функция для получения стилей выделения текущего дня
  const getTodayStyles = () => {
    const baseStyles = {
      backgroundColor: todayColor,
      color: 'white'
    };

    switch (dayShape) {
      case 'square':
        return { ...baseStyles, borderRadius: '0', width: '28px', height: '28px' };
      case 'circle':
        return { ...baseStyles, borderRadius: '50%', width: '28px', height: '28px' };
      case 'octagon':
        return { 
          ...baseStyles, 
          borderRadius: '0.375rem', 
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
          width: '28px', 
          height: '28px' 
        };
      case 'rounded':
      default:
        return { ...baseStyles, borderRadius: '50%', width: '28px', height: '28px' };
    }
  };

  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [detailViewDate] = useState(new Date());

  // Поддержка свайпов для навигации по месяцам
  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => handleDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)),
    onSwipeRight: () => handleDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))
  });

  const handleDateChange = (date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    handleDateChange(newDate);
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'week' });
  };

  const getMonthTime = useMemo(() => {
    let totalMinutes = 0;
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    for (const dateKey in days) {
      const [dYear, dMonth] = dateKey.split('-').map(Number);
      if (dYear === year && dMonth === month + 1) {
        totalMinutes += days[dateKey].timeEntries?.reduce((acc, curr) => acc + (curr.hours * 60) + curr.minutes, 0) || 0;
      }
    }
    return totalMinutes > 0 ? `${Math.floor(totalMinutes/60)}ч ${totalMinutes%60}м` : null;
  }, [days, selectedDate]);

  const renderHeader = () => (
    <div className="flex justify-between items-center p-2">
      <button onClick={() => handleDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronLeft /></button>
      <div className="text-center">
        <h2 className={`text-xl font-bold tracking-wider ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' }).toUpperCase()}</h2>
        {getMonthTime && <p className="text-sm font-bold text-green-600 dark:text-green-400">Общее время: {getMonthTime}</p>}
      </div>
      <button onClick={() => handleDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronRight /></button>
    </div>
  );

  const renderDaysOfWeek = () => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return <div className={`grid grid-cols-7 text-center font-medium text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} p-2`}>{days.map(day => <div key={day}>{day}</div>)}</div>;
  };

  const renderCells = () => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const firstDayIndex = (monthStart.getDay() + 6) % 7;
    const startDate = new Date(monthStart); startDate.setDate(startDate.getDate() - firstDayIndex);
    const rows = [];
    let currentDay = new Date(startDate);
    const today = new Date();
    const startOfTodayWeek = new Date(today.setDate(today.getDate() - (today.getDay() + 6) % 7));

    for (let i = 0; i < 6; i++) {
      const weekDays = [];
      for (let j = 0; j < 7; j++) {
        const day = new Date(currentDay);
        const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
        const isToday = new Date().toDateString() === day.toDateString();
        const dateKey = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
        const dailyRepeatingTasks = getRepeatingTasksForDate(day, repeatingTasks || []);
        const dayTime = days[dateKey]?.timeEntries?.reduce((acc, curr) => acc + (curr.hours * 60) + curr.minutes, 0) || 0;
        
        const isDateInCurrentWeek = day >= startOfTodayWeek && day < new Date(startOfTodayWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

        let cellClass = `h-28 p-1 border-t border-l dark:border-gray-700 text-left flex flex-col relative `;
        if (!isCurrentMonth) {
            cellClass += 'bg-gray-50 dark:bg-gray-800/50';
        } else if (isDateInCurrentWeek) {
            cellClass += 'bg-gray-100 dark:bg-gray-700/50';
        } else {
            cellClass += 'hover:bg-blue-50 dark:hover:bg-gray-700/50 cursor-pointer';
        }

        weekDays.push(
          <div key={day.toString()} onClick={() => isCurrentMonth && handleDayClick(day.getDate())} className={cellClass}>
            <div className={`flex justify-between items-start`}>
              <span 
                className={`text-lg font-medium flex items-center justify-center ${
                  isToday ? '' : (
                    isCurrentMonth 
                      ? (settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-900') 
                      : (settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
                  )
                }`}
                style={isToday ? getTodayStyles() : {}}
              >
                {day.getDate()}
              </span>
              {dayTime > 0 && <span className="text-sm font-bold text-green-600 dark:text-green-400">{`${Math.floor(dayTime/60)}ч${(dayTime%60).toString().padStart(2,'0')}м`}</span>}
            </div>
            <div className="flex-grow overflow-y-auto text-xs mt-1">
              <div className="flex flex-wrap gap-1">{dailyRepeatingTasks.map(task => <IconComponent key={task.id} name={task.icon} size={14} style={{ color: task.color }} title={task.text} />)}</div>
            </div>
          </div>
        );
        currentDay.setDate(currentDay.getDate() + 1);
      }
      rows.push(<div className="grid grid-cols-7" key={i}>{weekDays}</div>);
    }
    return <div>{rows}</div>;
  };

  return (
    <div 
      className="p-2"
      ref={swipeRef as any}
      style={calendarBackgrounds.month ? (
        calendarBackgrounds.month.startsWith('data:') 
          ? { backgroundImage: `url(${calendarBackgrounds.month})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: calendarBackgrounds.month }
      ) : {}}
    >
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
      <DayDetailView isOpen={isDetailViewOpen} onClose={() => setIsDetailViewOpen(false)} date={detailViewDate} />
    </div>
  );
}