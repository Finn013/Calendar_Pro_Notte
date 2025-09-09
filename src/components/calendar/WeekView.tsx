import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, ChevronRight, Plus, MoreVertical, Trash2, Palette, Star, CheckCircle, ArrowRight, Smile } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AlertDialog from '../shared/AlertDialog';
import { getRepeatingTasksForDate } from '../../utils/calendarUtils';
import { iconLibrary } from './CalendarSettingsView';
import DayDetailView from './DayDetailView';
import { useSwipeGestures } from '../../hooks/useSwipeGestures';

const IconComponent = ({ name, ...props }: { name: string, [key: string]: any }) => {
  const Icon = iconLibrary[name as keyof typeof iconLibrary] || Star;
  return <Icon {...props} />;
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
export default function WeekView({ settings: propSettings }: { settings?: any }) {
  const { state, dispatch } = useApp();
  const { selectedDate, days, settings: contextSettings, repeatingTasks, calendarBackgrounds } = state;
  const settings = propSettings || contextSettings;
  
  // Получаем настройки календаря для применения стилей выделения
  const calendarSettings = settings.calendarSettings || { todayColor: '#EF4444', dayShape: 'rounded' };

  const [currentWeek, setCurrentWeek] = useState(() => getWeekDays(selectedDate));
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [detailViewDate, setDetailViewDate] = useState(new Date());

  // Поддержка свайпов для навигации по неделям
  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => navigateWeek(1),
    onSwipeRight: () => navigateWeek(-1)
  });

  useEffect(() => {
    setCurrentWeek(getWeekDays(selectedDate));
  }, [selectedDate, days, repeatingTasks]);

  const openDetailView = (date: Date) => {
    setDetailViewDate(date);
    setIsDetailViewOpen(true);
  }

  function getWeekDays(date: Date) {
    const start = new Date(date);
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const dayData = days[dateKey];
      const totalMinutes = dayData?.timeEntries?.reduce((acc, curr) => acc + (curr.hours * 60) + curr.minutes, 0) || 0;
      return { 
          date: d, dateKey, name: d.toLocaleString('ru-RU', { weekday: 'long' }), 
          tasks: dayData?.tasks || [], color: dayData?.color, icon: dayData?.icon,
          totalTime: totalMinutes > 0 ? `${Math.floor(totalMinutes/60)}ч ${totalMinutes%60}м` : null
      };
    });
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
  };

  const { weekTime, monthTime } = useMemo(() => {
      let weekMinutes = 0;
      currentWeek.forEach(day => {
          const dayData = days[day.dateKey];
          if(dayData?.timeEntries) {
              weekMinutes += dayData.timeEntries.reduce((acc, curr) => acc + (curr.hours * 60) + curr.minutes, 0);
          }
      });

      let monthMinutes = 0;
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      for (const dateKey in days) {
          const [dYear, dMonth] = dateKey.split('-').map(Number);
          if (dYear === year && dMonth === month + 1) {
              monthMinutes += days[dateKey].timeEntries?.reduce((acc, curr) => acc + (curr.hours * 60) + curr.minutes, 0) || 0;
          }
      }

      return {
          weekTime: weekMinutes > 0 ? `${Math.floor(weekMinutes/60)}ч ${weekMinutes%60}м` : null,
          monthTime: monthMinutes > 0 ? `${Math.floor(monthMinutes/60)}ч ${monthMinutes%60}м` : null,
      }
  }, [currentWeek, days, selectedDate]);

  const handleTaskAdd = (dateKey: string, text: string) => dispatch({ type: 'ADD_TASK', payload: { date: dateKey, task: { id: Date.now().toString(), text, completed: false, createdAt: Date.now() } } });
  const handleTaskUpdate = (dateKey: string, taskId: string, updates: any) => dispatch({ type: 'UPDATE_TASK', payload: { date: dateKey, taskId, updates } });
  const handleTaskDelete = (dateKey: string, taskId: string) => dispatch({ type: 'DELETE_TASK', payload: { date: dateKey, taskId } });
  const handleDayColor = (dateKey: string, color: string) => dispatch({ type: 'SET_DAY_COLOR', payload: { date: dateKey, color } });
  const handleDayIcon = (dateKey: string, icon: string) => dispatch({ type: 'SET_DAY_ICON', payload: { date: dateKey, icon } });
  const handleCompleteAll = (dateKey: string) => { days[dateKey]?.tasks.forEach(t => !t.completed && handleTaskUpdate(dateKey, t.id, { completed: true })); setActiveMenu(null); };
  const handleMoveAll = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const tomorrow = new Date(date); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = `${tomorrow.getFullYear()}-${tomorrow.getMonth() + 1}-${tomorrow.getDate()}`;
    days[dateKey]?.tasks.filter(t => !t.completed).forEach(t => { handleTaskDelete(dateKey, t.id); handleTaskAdd(tomorrowKey, t.text); });
    setActiveMenu(null);
  };

  return (
    <div 
      className="p-2 sm:p-4" 
      onClick={() => setActiveMenu(null)}
      ref={swipeRef as any}
      style={calendarBackgrounds.week ? (
        calendarBackgrounds.week.startsWith('data:') 
          ? { backgroundImage: `url(${calendarBackgrounds.week})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: calendarBackgrounds.week }
      ) : {}}
    >
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigateWeek(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronLeft /></button>
        <div className="text-center">
            <h2 className={`text-xl font-bold tracking-wider ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentWeek[0].date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' }).toUpperCase()}</h2>
            <div className={`text-xs font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} flex justify-center gap-4 mt-1`}>
                {weekTime && <span>Неделя: <span className="text-green-600 dark:text-green-400">{weekTime}</span></span>}
                {monthTime && <span>Месяц: <span className="text-green-600 dark:text-green-400">{monthTime}</span></span>}
            </div>
        </div>
        <button onClick={() => navigateWeek(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronRight /></button>
      </div>
      <div className="space-y-4">
        {currentWeek.map(day => <DayCard key={day.dateKey} day={day} repeatingTasks={repeatingTasks} activeMenu={activeMenu} setActiveMenu={setActiveMenu} onTaskAdd={handleTaskAdd} onTaskUpdate={handleTaskUpdate} onTaskDelete={handleTaskDelete} onSetColor={handleDayColor} onSetIcon={handleDayIcon} onCompleteAll={handleCompleteAll} onMoveAll={handleMoveAll} openDetailView={openDetailView} calendarSettings={calendarSettings} settings={settings} />)}
      </div>
      <DayDetailView isOpen={isDetailViewOpen} onClose={() => setIsDetailViewOpen(false)} date={detailViewDate} />
    </div>
  );
}

// ... (остальные компоненты без изменений)
const DayCard = ({ day, repeatingTasks, activeMenu, setActiveMenu, onTaskAdd, onTaskUpdate, onTaskDelete, onSetColor, onSetIcon, onCompleteAll, onMoveAll, openDetailView, calendarSettings, settings }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const handleAddTask = () => { if (newTaskText.trim()) { onTaskAdd(day.dateKey, newTaskText); setNewTaskText(''); setIsAdding(false); } };
  const sortedTasks = [...day.tasks].sort((a, b) => a.completed === b.completed ? a.createdAt - b.createdAt : a.completed ? 1 : -1);
  const dayRepeatingTasks = getRepeatingTasksForDate(day.date, repeatingTasks);
  
  // Проверяем, является ли этот день сегодняшним
  const today = new Date();
  const isToday = today.toDateString() === day.date.toDateString();
  
  // Получаем настройки выделения дня
  const todayColor = calendarSettings?.todayColor || '#EF4444';
  const dayShape = calendarSettings?.dayShape || 'rounded';
  
  // Функция для получения стилей выделения текущего дня
  const getTodayStyles = () => {
    const baseStyles = {
      backgroundColor: todayColor,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '24px',
      minHeight: '24px'
    };

    switch (dayShape) {
      case 'square':
        return { ...baseStyles, borderRadius: '0' };
      case 'circle':
        return { ...baseStyles, borderRadius: '50%' };
      case 'octagon':
        return { 
          ...baseStyles, 
          borderRadius: '0.375rem', 
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)'
        };
      case 'rounded':
      default:
        return { ...baseStyles, borderRadius: '0.375rem' };
    }
  };

  return (
    <motion.div layout style={{backgroundColor: day.color}} className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="flex items-center justify-between p-3 bg-gray-100/80 dark:bg-gray-700/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          {day.icon && <IconComponent name={day.icon} size={18} className="text-gray-600 dark:text-gray-300"/>}
          <h3 className={`font-bold text-lg capitalize ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{day.name}</h3>
          <span 
            className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} ${isToday ? 'font-bold' : ''}`}
            style={isToday ? getTodayStyles() : {}}
          >
            {day.date.getDate()}
          </span>
          {day.totalTime && <span className="text-xs font-bold text-green-600 dark:text-green-400 ml-2">{day.totalTime}</span>}
          <div className="flex items-center gap-1.5 ml-2">{dayRepeatingTasks.map(task => <IconComponent key={task.id} name={task.icon} size={16} style={{ color: task.color }} title={task.text} />)}</div>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={() => openDetailView(day.date)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><Plus size={18} /></button>
            <div className="relative"><button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === day.dateKey ? null : day.dateKey); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><MoreVertical size={20} /></button><AnimatePresence>{activeMenu === day.dateKey && <DayMenu day={day} onSetColor={onSetColor} onSetIcon={onSetIcon} onCompleteAll={onCompleteAll} onMoveAll={onMoveAll} />}</AnimatePresence></div>
        </div>
      </div>
      <div className="p-4">
        <ul className="space-y-2">{sortedTasks.map(task => (<li key={task.id} className="flex items-center gap-3"><input type="checkbox" checked={task.completed} onChange={() => onTaskUpdate(day.dateKey, task.id, { completed: !task.completed })} className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 bg-transparent" /><span className={`flex-grow ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.text}</span><button onClick={() => onTaskDelete(day.dateKey, task.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button></li>))}</ul>
        
        {/* Постоянная кнопка добавления задачи */}
        <button 
          onClick={() => setIsAdding(true)} 
          className="w-full mt-3 py-2 text-blue-500 dark:text-blue-400 font-semibold flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-700/50 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-500 transition-colors"
        >
          <Plus size={18}/>Добавить задачу
        </button>
        
        {/* Поле ввода для новой задачи */}
        {isAdding && (
          <div className="flex gap-2 mt-3">
            <input 
              type="text" 
              value={newTaskText} 
              onChange={e => setNewTaskText(e.target.value)} 
              onBlur={handleAddTask} 
              onKeyPress={e => e.key === 'Enter' && handleAddTask()} 
              autoFocus 
              className="flex-grow p-2 border rounded dark:bg-gray-700" 
              placeholder="Введите задачу..."
            />
            <button 
              onClick={handleAddTask} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Добавить
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
const DayMenu = ({ day, onSetColor, onSetIcon, onCompleteAll, onMoveAll }: any) => {
  const [showPalette, setShowPalette] = useState(false);
  const [showIconPalette, setShowIconPalette] = useState(false);
  const colors = ['#FFFFFF', '#FEE2E2', '#FFEDD5', '#FEF3C7', '#D1FAE5', '#DBEAFE', '#E0E7FF', '#F3E8FF', '#FCE7F3', '#F0F0F0'];
  const iconsWithColors = [ { name: 'Star', color: '#FBBF24' }, { name: 'Heart', color: '#F43F5E' }, { name: 'Briefcase', color: '#A16207' }, { name: 'Gift', color: '#EC4899' }, { name: 'Pill', color: '#3B82F6' }, { name: 'Dumbbell', color: '#4B5563' }, { name: 'ShoppingCart', color: '#10B981' }, { name: 'Book', color: '#8B5CF6' }, { name: 'Car', color: '#6D28D9' }, { name: 'Plane', color: '#0EA5E9' }, { name: 'Home', color: '#059669' }, { name: 'PawPrint', color: '#D97706' }, ];
  const handleAction = (action: Function) => { action(); setShowPalette(false); setShowIconPalette(false); }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onClick={e => e.stopPropagation()} className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border dark:border-gray-700">
      <ul className="p-1 text-sm text-gray-700 dark:text-gray-200">
        <li onClick={() => {setShowPalette(!showPalette); setShowIconPalette(false);}} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><Palette size={16}/>Цвет дня</li>
        {showPalette && <div className="flex flex-wrap gap-2 p-2 justify-center border-t dark:border-gray-700">{colors.map(color => <button key={color} onClick={() => handleAction(() => onSetColor(day.dateKey, color))} className="w-7 h-7 rounded-full border dark:border-gray-600" style={{backgroundColor: color}} />)}</div>}
        <li onClick={() => {setShowIconPalette(!showIconPalette); setShowPalette(false);}} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><Smile size={16}/>Отметить иконкой</li>
        {showIconPalette && <div className="flex flex-wrap gap-2 p-2 justify-center border-t dark:border-gray-700">{iconsWithColors.map(icon => <button key={icon.name} onClick={() => handleAction(() => onSetIcon(day.dateKey, icon.name))} className={`p-2 rounded-full ${day.icon === icon.name ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}><IconComponent name={icon.name} size={18} style={{color: icon.color}}/></button>)}</div>}
        <div className="border-t my-1 dark:border-gray-700"></div>
        <li onClick={() => handleAction(() => onCompleteAll(day.dateKey))} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><CheckCircle size={16}/>Выполнить все дела</li>
        <li onClick={() => handleAction(() => onMoveAll(day.date))} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><ArrowRight size={16}/>Перенести на завтра</li>
      </ul>
    </motion.div>
  );
};