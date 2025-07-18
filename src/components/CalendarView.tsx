import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Trash2, Edit2, Check, X as CloseIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import YearView from './calendar/YearView';
import MonthView from './calendar/MonthView';
import WeekView from './calendar/WeekView';
import { AnimatePresence, motion } from 'framer-motion';

interface CalendarViewProps {
  onBack: () => void;
}

export default function CalendarView({ onBack }: CalendarViewProps) {
  const { state, dispatch } = useApp();
  const { currentView, selectedDate, settings } = state;
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);

  // Состояния для напоминаний
  const [reminders, setReminders] = useState<{ time: string; text: string; shown: boolean }[]>(() => {
    const saved = localStorage.getItem('calendar-reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [reminderDate, setReminderDate] = useState(() => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      hour: now.getHours(),
      minute: now.getMinutes()
    };
  });
  const [reminderText, setReminderText] = useState('');
  const [reminderStatus, setReminderStatus] = useState('');

  // --- Состояния для графика работы/выходных ---
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
  const [repeatingTasks, setRepeatingTasks] = useState<{ type: 'monthly' | 'weekly' | 'yearly'; day: number; month?: number; weekday?: number; icon: string; text: string; color: string }[]>(() => {
    const saved = localStorage.getItem('calendar-repeating-tasks');
    const arr = saved ? JSON.parse(saved) : [];
    return arr.map((t: any) => ({ ...t, color: t.color || '#F472B6' }));
  });
  // --- Новое состояние для отображения иконок повторяющихся задач ---
  const [repeatingShowIcons, setRepeatingShowIcons] = useState<{ year: boolean; month: boolean; week: boolean }>(() => {
    const saved = localStorage.getItem('calendar-repeating-showIcons');
    return saved ? JSON.parse(saved) : { year: true, month: true, week: true };
  });
  const colorSet = [
    '#F472B6', // розовый
    '#F59E42', // оранжевый
    '#34D399', // зелёный
    '#60A5FA', // синий
    '#FBBF24', // жёлтый
    '#A78BFA', // фиолетовый
    '#F87171', // красный
    '#6B7280', // серый
    '#F3F4F6', // белый
    '#1F2937'  // чёрный
  ];
  const [newRepeatingTask, setNewRepeatingTask] = useState({
    type: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    day: 1,
    month: 1,
    weekday: 1,
    icon: '💼',
    text: '',
    color: '#F472B6'
  });
  const [editTaskIndex, setEditTaskIndex] = useState<number | null>(null);
  const [editTask, setEditTask] = useState<{ type: 'monthly' | 'weekly' | 'yearly'; day: number; month: number; weekday: number; icon: string; text: string; color: string } | null>(null);
  const [draggedTaskIdx, setDraggedTaskIdx] = useState<number | null>(null);
  const [highlightShape, setHighlightShape] = useState<'rounded' | 'square' | 'circle' | 'octagon'>(() => {
    const saved = localStorage.getItem('calendar-highlight-shape');
    if (saved === 'rounded' || saved === 'square' || saved === 'circle' || saved === 'octagon') return saved;
    return 'rounded';
  });
  const [highlightColor, setHighlightColor] = useState<string>(() => {
    const saved = localStorage.getItem('calendar-highlight-color');
    return saved || '#EF4444';
  });
  const highlightShapes = [
    { value: 'rounded', label: 'Скруглённые', icon: '⬜' },
    { value: 'square', label: 'Квадратные', icon: '⬛' },
    { value: 'circle', label: 'Круглые', icon: '⭕' },
    { value: 'octagon', label: 'Октагон', icon: '⯃' }
  ];
  const highlightColors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#6B7280', '#1F2937'
  ];
  const handleApplyHighlight = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        calendarSettings: {
          todayColor: highlightColor,
          dayShape: highlightShape,
          animationType: settings.calendarSettings?.animationType || 'slide',
          animationCombo1: settings.calendarSettings?.animationCombo1 || 'fade',
          animationCombo2: settings.calendarSettings?.animationCombo2 || 'slide',
        },
      },
    });
    localStorage.setItem('calendar-highlight-shape', highlightShape);
    localStorage.setItem('calendar-highlight-color', highlightColor);
  };
  // --- Для фонов: временное состояние выбора ---
  const [pendingBg, setPendingBg] = useState<{ [key in 'year' | 'month' | 'week']?: string }>({});
  const [pendingGradient, setPendingGradient] = useState<{ [key in 'year' | 'month' | 'week']?: { color1: string; color2: string } }>({});
  const defaultGradient = { color1: '#f472b6', color2: '#60a5fa' };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>, view: 'year' | 'month' | 'week') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      dispatch({ type: 'UPDATE_CALENDAR_BACKGROUNDS', payload: { ...state.calendarBackgrounds, [view]: ev.target?.result as string } });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const handleBgGradientChange = (view: 'year' | 'month' | 'week', value: string) => {
    dispatch({ type: 'UPDATE_CALENDAR_BACKGROUNDS', payload: { ...state.calendarBackgrounds, [view]: value } });
  };

  // Сохраняем напоминания в localStorage
  useEffect(() => {
    localStorage.setItem('calendar-reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Сохраняем график в localStorage
  useEffect(() => {
    localStorage.setItem('calendar-schedule', JSON.stringify(schedule));
  }, [schedule]);

  // Проверка и показ уведомлений
  useEffect(() => {
    if (!('Notification' in window)) return;
    Notification.requestPermission();
    const checkReminders = () => {
      const now = new Date();
      let updated = false;
      const newReminders = reminders.map(r => {
        if (!r.shown && new Date(r.time) <= now) {
          // Показываем уведомление
          new Notification('Напоминание', { body: r.text });
          updated = true;
          return { ...r, shown: true };
        }
        return r;
      });
      if (updated) setReminders(newReminders);
    };
    const interval = setInterval(checkReminders, 30000); // каждые 30 сек
    // При входе в календарь показываем пропущенные
    checkReminders();
    return () => clearInterval(interval);
  }, [reminders]);

  // Добавление напоминания
  const handleAddReminder = () => {
    const date = new Date(reminderDate.year, reminderDate.month - 1, reminderDate.day, reminderDate.hour, reminderDate.minute);
    if (date < new Date()) {
      setReminderStatus('Дата и время уже прошли!');
      return;
    }
    if (!reminderText.trim()) {
      setReminderStatus('Введите текст напоминания!');
      return;
    }
    setReminders([...reminders, { time: date.toISOString(), text: reminderText, shown: false }]);
    setReminderText('');
    setReminderStatus('Напоминание добавлено!');
  };

  // Удаление одного напоминания с подтверждением
  const handleDeleteReminder = (index: number) => {
    if (window.confirm('Удалить это напоминание?')) {
      setReminders((reminders: { time: string; text: string; shown: boolean }[]) => reminders.filter((_, i) => i !== index));
    }
  };
  // Массовое удаление прошедших напоминаний с подтверждением
  const handleDeletePastReminders = () => {
    const now = new Date();
    const hasPast = reminders.some((r: { time: string }) => new Date(r.time) < now);
    if (!hasPast) {
      alert('Нет прошедших напоминаний.');
      return;
    }
    if (window.confirm('Удалить все прошедшие напоминания?')) {
      setReminders((reminders: { time: string; text: string; shown: boolean }[]) => reminders.filter((r: { time: string }) => new Date(r.time) >= now));
    }
  };

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
      case 'octagon':
        return `${baseStyle} octagon-btn`;
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

  // Добавление новой повторяющейся задачи
  const handleAddRepeatingTask = () => {
    if (!newRepeatingTask.text.trim()) return;
    setRepeatingTasks(tasks => {
      const updated = [...tasks, newRepeatingTask];
      localStorage.setItem('calendar-repeating-tasks', JSON.stringify(updated));
      return updated;
    });
    setNewRepeatingTask({
      type: 'monthly',
      day: 1,
      month: 1,
      weekday: 1,
      icon: '💼',
      text: '',
      color: '#F472B6'
    });
  };

  // Удаление повторяющейся задачи
  const handleDeleteRepeatingTask = (index: number) => {
    if (window.confirm('Удалить эту задачу?')) {
      setRepeatingTasks(tasks => {
        const updated = tasks.filter((_, i) => i !== index);
        localStorage.setItem('calendar-repeating-tasks', JSON.stringify(updated));
        return updated;
      });
    }
  };
  // Начать редактирование задачи
  const handleStartEditTask = (index: number) => {
    setEditTaskIndex(index);
    setEditTask({
      ...repeatingTasks[index],
      month: repeatingTasks[index].month ?? 1,
      weekday: repeatingTasks[index].weekday ?? 1,
      color: repeatingTasks[index].color
    });
  };
  // Сохранить изменения задачи
  const handleSaveEditTask = () => {
    if (!editTask || !editTask.text.trim() || editTaskIndex === null) return;
    setRepeatingTasks(tasks => {
      const updated = tasks.map((t, i) => i === editTaskIndex ? editTask : t);
      localStorage.setItem('calendar-repeating-tasks', JSON.stringify(updated));
      return updated;
    });
    setEditTaskIndex(null);
    setEditTask(null);
  };
  // Отмена редактирования
  const handleCancelEditTask = () => {
    setEditTaskIndex(null);
    setEditTask(null);
  };

  // Массовое удаление всех повторяющихся задач
  const handleDeleteAllRepeatingTasks = () => {
    if (window.confirm('Удалить ВСЕ повторяющиеся задачи?')) {
      setRepeatingTasks([]);
      localStorage.setItem('calendar-repeating-tasks', JSON.stringify([]));
    }
  };

  // Функции для drag&drop
  const handleDragStartTask = (idx: number) => setDraggedTaskIdx(idx);
  const handleDropTask = (idx: number) => {
    if (draggedTaskIdx === null || draggedTaskIdx === idx) return;
    setRepeatingTasks(tasks => {
      const updated = [...tasks];
      const [dragged] = updated.splice(draggedTaskIdx, 1);
      updated.splice(idx, 0, dragged);
      localStorage.setItem('calendar-repeating-tasks', JSON.stringify(updated));
      return updated;
    });
    setDraggedTaskIdx(null);
  };
  const handleDragEndTask = () => setDraggedTaskIdx(null);

  // --- Функция переключения чекбоксов отображения иконок повторяющихся задач ---
  const handleToggleRepeatingShowIcon = (view: 'year' | 'month' | 'week') => {
    setRepeatingShowIcons(prev => {
      const updated = { ...prev, [view]: !prev[view] };
      localStorage.setItem('calendar-repeating-showIcons', JSON.stringify(updated));
      return updated;
    });
  };

  // --- Состояния для графиков ---
  const [schedules, setSchedules] = useState<any[]>(() => {
    const saved = localStorage.getItem('calendar-schedules');
    return saved ? JSON.parse(saved) : [];
  });
  const [newSchedule, setNewSchedule] = useState({
    from: new Date().toISOString().slice(0, 10),
    to: new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10),
    workDays: 5,
    restDays: 2,
    workIcon: '💼',
    restIcon: '🏖️',
    showIcons: { year: true, month: true, week: true }
  });
  const [editScheduleIndex, setEditScheduleIndex] = useState<number | null>(null);
  const [editSchedule, setEditSchedule] = useState<any>(null);
  // --- Сохраняем schedules в localStorage ---
  useEffect(() => {
    localStorage.setItem('calendar-schedules', JSON.stringify(schedules));
  }, [schedules]);
  // --- Добавить график ---
  const handleAddScheduleToList = () => {
    setSchedules((arr: any[]) => [...arr, newSchedule]);
    setNewSchedule({
      from: new Date().toISOString().slice(0, 10),
      to: new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10),
      workDays: 5,
      restDays: 2,
      workIcon: '💼',
      restIcon: '🏖️',
      showIcons: { year: true, month: true, week: true }
    });
  };
  // --- Удалить график ---
  const handleDeleteScheduleFromList = (index: number) => {
    if (window.confirm('Удалить этот график?')) {
      setSchedules((arr: any[]) => arr.filter((_: any, i: number) => i !== index));
    }
  };
  // --- Начать редактирование ---
  const handleStartEditSchedule = (index: number) => {
    setEditScheduleIndex(index);
    setEditSchedule({ ...schedules[index] });
  };
  // --- Сохранить изменения ---
  const handleSaveEditSchedule = () => {
    if (editScheduleIndex === null || !editSchedule) return;
    setSchedules((arr: any[]) => arr.map((s, i) => i === editScheduleIndex ? editSchedule : s));
    setEditScheduleIndex(null);
    setEditSchedule(null);
  };
  // --- Отмена редактирования ---
  const handleCancelEditSchedule = () => {
    setEditScheduleIndex(null);
    setEditSchedule(null);
  };

  const calendarBaseVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, x: 40 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -40 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    none: {
      initial: { opacity: 1, x: 0, scale: 1 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 1, x: 0, scale: 1 },
    },
    flip: {
      initial: { opacity: 0, rotateY: 90 },
      animate: { opacity: 1, rotateY: 0 },
      exit: { opacity: 0, rotateY: -90 },
    },
    rotate: {
      initial: { opacity: 0, rotate: 10 },
      animate: { opacity: 1, rotate: 0 },
      exit: { opacity: 0, rotate: -10 },
    },
    bounce: {
      initial: { y: 50, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } },
      exit: { y: -50, opacity: 0 },
    },
    blur: {
      initial: { opacity: 0, filter: 'blur(8px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(8px)' },
    },
  };
  function getCalendarVariants(type: string): { initial: any; animate: any; exit: any } {
    return calendarBaseVariants[type as keyof typeof calendarBaseVariants] || calendarBaseVariants['slide'];
  }

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className={`${getButtonStyle()} p-2 sm:p-3 text-white btn-rotate`}
            style={{ backgroundColor: settings.buttonColor }}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <h1 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Календарь
          </h1>

          {/* Иконка настроек только для вида 'Год' */}
          {currentView === 'year' ? (
            <button
              onClick={() => setShowCalendarSettings(true)}
              className={`${getButtonStyle()} p-2 sm:p-3 text-white btn-rotate`}
              style={{ backgroundColor: settings.buttonColor }}
            >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          ) : (
            <div className="w-10 sm:w-12" />
          )}
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
                      : 'text-gray-700 hover:text-gray-900'
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
        <div className={`rounded-xl shadow-lg overflow-hidden ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <AnimatePresence mode="wait">
            {currentView === 'year' && (
              <motion.div
                key="year"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={getCalendarVariants(settings.calendarSettings?.animationType || 'slide')}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                style={{ height: '100%' }}
              >
                <YearView />
              </motion.div>
            )}
            {currentView === 'month' && (
              <motion.div
                key="month"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={getCalendarVariants(settings.calendarSettings?.animationType || 'slide')}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                style={{ height: '100%' }}
              >
                <MonthView />
              </motion.div>
            )}
            {currentView === 'week' && (
              <motion.div
                key="week"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={getCalendarVariants(settings.calendarSettings?.animationType || 'slide')}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                style={{ height: '100%' }}
              >
                <WeekView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Модальное окно настроек календаря */}
        {showCalendarSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl shadow-lg p-6 w-full max-w-2xl ${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Настройки календаря (Год)</h2>
                <button
                  onClick={() => setShowCalendarSettings(false)}
                  className="btn-rotate p-2 rounded-lg bg-red-500 text-white"
                >
                  Закрыть
                </button>
              </div>
              {/* Здесь будут настройки: уведомления, график, фон, выделение дня */}
              <div className="space-y-6">
                {/* Локальные уведомления (напоминания) */}
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                  <b>Локальные уведомления (напоминания)</b>
                  <div className="text-xs mt-1 text-blue-700">Приложение напомнит только если оно включено или свернуто. Если приложение было закрыто, при следующем входе в календарь появится уведомление о пропущенных событиях.</div>
                  <div className="flex flex-wrap gap-2 mt-2 items-end">
                    <select value={reminderDate.day} onChange={e => setReminderDate(d => ({ ...d, day: +e.target.value }))}>
                      {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                    </select>
                    <select value={reminderDate.month} onChange={e => setReminderDate(d => ({ ...d, month: +e.target.value }))}>
                      {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                    </select>
                    <select value={reminderDate.year} onChange={e => setReminderDate(d => ({ ...d, year: +e.target.value }))}>
                      {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() + i}>{new Date().getFullYear() + i}</option>)}
                    </select>
                    <select value={reminderDate.hour} onChange={e => setReminderDate(d => ({ ...d, hour: +e.target.value }))}>
                      {[...Array(24)].map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>)}
                    </select>
                    <select value={reminderDate.minute} onChange={e => setReminderDate(d => ({ ...d, minute: +e.target.value }))}>
                      {[...Array(60)].map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Что напомнить?"
                      value={reminderText}
                      onChange={e => setReminderText(e.target.value)}
                      className="border rounded px-2 py-1 flex-1"
                    />
                    <button className="btn-rotate px-4 py-2 rounded-lg bg-blue-600 text-white font-bold" onClick={handleAddReminder}>
                      Добавить
                    </button>
                  </div>
                  {reminderStatus && <div className="text-xs mt-1 text-green-700">{reminderStatus}</div>}
                  <div className="mt-2 text-xs">
                    <b>Ваши напоминания:</b>
                    <button
                      className="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 text-xs btn-rotate"
                      onClick={handleDeletePastReminders}
                    >
                      Удалить все прошедшие
                    </button>
                    <ul className="list-disc list-inside mt-1">
                      {reminders.map((r: { time: string; text: string; shown: boolean }, i: number) => (
                        <li key={i} className={r.shown ? 'line-through text-gray-400 flex items-center' : 'flex items-center'}>
                          <span>
                            {new Date(r.time).toLocaleString()} — {r.text}
                          </span>
                          <button
                            className="ml-2 text-red-500 hover:text-red-700 btn-rotate"
                            title="Удалить напоминание"
                            onClick={() => handleDeleteReminder(i)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {/* Повторяющиеся задачи (новый блок) */}
                <div className="p-4 rounded-lg bg-pink-50 border border-pink-200 text-pink-900">
                  <b>Повторяющиеся задачи</b>
                  <div className="flex flex-wrap gap-2 mt-2 items-end">
                    <select value={newRepeatingTask.type} onChange={e => setNewRepeatingTask(t => ({ ...t, type: e.target.value as any }))}>
                      <option value="monthly">Ежемесячно (день месяца)</option>
                      <option value="weekly">Еженедельно (день недели)</option>
                      <option value="yearly">Ежегодно (дата)</option>
                    </select>
                    {newRepeatingTask.type === 'monthly' && (
                      <input type="number" min={1} max={31} value={newRepeatingTask.day} onChange={e => setNewRepeatingTask(t => ({ ...t, day: +e.target.value }))} className="border rounded px-2 py-1 w-20" placeholder="День" />
                    )}
                    {newRepeatingTask.type === 'weekly' && (
                      <select value={newRepeatingTask.weekday} onChange={e => setNewRepeatingTask(t => ({ ...t, weekday: +e.target.value }))} className="border rounded px-2 py-1">
                        <option value={1}>Понедельник</option>
                        <option value={2}>Вторник</option>
                        <option value={3}>Среда</option>
                        <option value={4}>Четверг</option>
                        <option value={5}>Пятница</option>
                        <option value={6}>Суббота</option>
                        <option value={0}>Воскресенье</option>
                      </select>
                    )}
                    {newRepeatingTask.type === 'yearly' && (
                      <>
                        <input type="number" min={1} max={31} value={newRepeatingTask.day} onChange={e => setNewRepeatingTask(t => ({ ...t, day: +e.target.value }))} className="border rounded px-2 py-1 w-20" placeholder="День" />
                        <select value={newRepeatingTask.month} onChange={e => setNewRepeatingTask(t => ({ ...t, month: +e.target.value }))} className="border rounded px-2 py-1">
                          {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                        </select>
                      </>
                    )}
                    <select value={newRepeatingTask.icon} onChange={e => setNewRepeatingTask(t => ({ ...t, icon: e.target.value }))} className="border rounded px-2 py-1">
                      {['💼', '🏖️', '🎉', '🎂', '🎁', '🎈', '🎀', '🎊', '🎈', '🎉'].map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                    <input type="text" value={newRepeatingTask.text} onChange={e => setNewRepeatingTask(t => ({ ...t, text: e.target.value }))} className="border rounded px-2 py-1 flex-1" placeholder="Текст задачи" />
                    <select value={newRepeatingTask.color} onChange={e => setNewRepeatingTask(t => ({ ...t, color: e.target.value }))} className="border rounded px-2 py-1">
                      {colorSet.map(color => (
                        <option key={color} value={color} style={{ backgroundColor: color, color: color === '#F3F4F6' ? '#222' : '#fff' }}>{color}</option>
                      ))}
                    </select>
                    <button className="btn-rotate px-4 py-2 rounded-lg bg-pink-600 text-white font-bold" onClick={handleAddRepeatingTask} disabled={!newRepeatingTask.text.trim()} title="Сохранить задачу">
                      Добавить
                    </button>
                  </div>
                  {/* Новые чекбоксы отображения иконок — стиль как в "График" */}
                  <div className="flex gap-4 mt-2 items-center">
                    <label><input type="checkbox" checked={repeatingShowIcons.year} onChange={() => handleToggleRepeatingShowIcon('year')} className="mr-1" /> Показывать иконки в годовом виде</label>
                    <label><input type="checkbox" checked={repeatingShowIcons.month} onChange={() => handleToggleRepeatingShowIcon('month')} className="mr-1" /> Показывать в месяце</label>
                    <label><input type="checkbox" checked={repeatingShowIcons.week} onChange={() => handleToggleRepeatingShowIcon('week')} className="mr-1" /> Показывать в неделе</label>
                  </div>
                  <div className="mt-2 text-xs">
                    <b>Ваши повторяющиеся задачи:</b>
                    {/* Кнопка массового удаления */}
                    {repeatingTasks.length > 0 && (
                      <button
                        className="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 text-xs btn-rotate"
                        onClick={handleDeleteAllRepeatingTasks}
                      >
                        Удалить все
                      </button>
                    )}
                    <ul className="list-disc list-inside mt-1">
                      {repeatingTasks.map((t, i) => (
                        <li
                          key={i}
                          className={`flex items-center gap-2 ${draggedTaskIdx === i ? 'bg-yellow-100' : ''}`}
                          draggable
                          onDragStart={() => handleDragStartTask(i)}
                          onDrop={() => handleDropTask(i)}
                          onDragEnd={handleDragEndTask}
                          style={{ cursor: 'grab' }}
                        >
                          {editTaskIndex === i && editTask ? (
                            <>
                              <select value={editTask.type} onChange={e => setEditTask(et => et ? { ...et, type: e.target.value as any } : et)}>
                                <option value="monthly">Ежемесячно (день месяца)</option>
                                <option value="weekly">Еженедельно (день недели)</option>
                                <option value="yearly">Ежегодно (дата)</option>
                              </select>
                              {editTask.type === 'monthly' && (
                                <input type="number" min={1} max={31} value={editTask.day} onChange={e => setEditTask(et => et ? { ...et, day: +e.target.value } : et)} className="border rounded px-2 py-1 w-20" placeholder="День" />
                              )}
                              {editTask.type === 'weekly' && (
                                <select value={editTask.weekday} onChange={e => setEditTask(et => et ? { ...et, weekday: +e.target.value } : et)} className="border rounded px-2 py-1">
                                  <option value={1}>Понедельник</option>
                                  <option value={2}>Вторник</option>
                                  <option value={3}>Среда</option>
                                  <option value={4}>Четверг</option>
                                  <option value={5}>Пятница</option>
                                  <option value={6}>Суббота</option>
                                  <option value={0}>Воскресенье</option>
                                </select>
                              )}
                              {editTask.type === 'yearly' && (
                                <>
                                  <input type="number" min={1} max={31} value={editTask.day} onChange={e => setEditTask(et => et ? { ...et, day: +e.target.value } : et)} className="border rounded px-2 py-1 w-20" placeholder="День" />
                                  <select value={editTask.month} onChange={e => setEditTask(et => et ? { ...et, month: +e.target.value } : et)} className="border rounded px-2 py-1">
                                    {[...Array(12)].map((_, j) => <option key={j+1} value={j+1}>{j+1}</option>)}
                                  </select>
                                </>
                              )}
                              <select value={editTask.icon} onChange={e => setEditTask(et => et ? { ...et, icon: e.target.value } : et)} className="border rounded px-2 py-1">
                                {['💼', '🏖️', '🎉', '🎂', '🎁', '🎈', '🎀', '🎊', '🎈', '🎉'].map(icon => <option key={icon} value={icon}>{icon}</option>)}
                              </select>
                              <input type="text" value={editTask.text} onChange={e => setEditTask(et => et ? { ...et, text: e.target.value } : et)} className="border rounded px-2 py-1 flex-1" placeholder="Текст задачи" />
                              <select value={editTask.color} onChange={e => setEditTask(et => et ? { ...et, color: e.target.value } : et)} className="border rounded px-2 py-1">
                                {colorSet.map(color => (
                                  <option key={color} value={color} style={{ backgroundColor: color, color: color === '#F3F4F6' ? '#222' : '#fff' }}>{color}</option>
                                ))}
                              </select>
                              <button className="btn-rotate px-2 py-1 rounded bg-green-600 text-white" onClick={handleSaveEditTask} title="Сохранить"><Check className="w-4 h-4" /></button>
                              <button className="btn-rotate px-2 py-1 rounded bg-gray-300 text-gray-700" onClick={handleCancelEditTask} title="Отмена"><CloseIcon className="w-4 h-4" /></button>
                            </>
                          ) : (
                            <>
                              <span title={t.text}>{t.icon}</span>
                              <span title={t.text}>{t.text}</span>
                              <span className="text-gray-500">(
                                {t.type === 'monthly' && `ежемесячно, ${t.day} число`}
                                {t.type === 'weekly' && `еженедельно, ${['вс','пн','вт','ср','чт','пт','сб'][t.weekday??1]}`}
                                {t.type === 'yearly' && `ежегодно, ${t.day}.${t.month}`}
                              )</span>
                              <button className="ml-1 text-blue-500 hover:text-blue-700 btn-rotate" onClick={() => handleStartEditTask(i)} title="Редактировать"><Edit2 className="w-4 h-4" /></button>
                              <button className="ml-1 text-red-500 hover:text-red-700 btn-rotate" onClick={() => handleDeleteRepeatingTask(i)} title="Удалить"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {/* График */}
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-900">
                  <b>График</b>
                  {/* Форма добавления нового графика */}
                  <div className="flex flex-wrap gap-2 mt-2 items-end">
                    <label>Период с
                      <input type="date" value={newSchedule.from} onChange={e => setNewSchedule(s => ({ ...s, from: e.target.value }))} className="border rounded px-2 py-1 mx-1" />
                    </label>
                    <label>по
                      <input type="date" value={newSchedule.to} onChange={e => setNewSchedule(s => ({ ...s, to: e.target.value }))} className="border rounded px-2 py-1 mx-1" />
                    </label>
                    <label>Рабочих дней
                      <input type="number" min={1} max={31} value={newSchedule.workDays} onChange={e => setNewSchedule(s => ({ ...s, workDays: +e.target.value }))} className="border rounded px-2 py-1 mx-1 w-16" />
                    </label>
                    <label>Выходных дней
                      <input type="number" min={1} max={31} value={newSchedule.restDays} onChange={e => setNewSchedule(s => ({ ...s, restDays: +e.target.value }))} className="border rounded px-2 py-1 mx-1 w-16" />
                    </label>
                    <label>Иконка работы
                      <select value={newSchedule.workIcon} onChange={e => setNewSchedule(s => ({ ...s, workIcon: e.target.value }))} className="border rounded px-2 py-1 mx-1">
                        {['💼', '🏖️', '🎉', '🎂', '🎁', '🎈', '🎀', '🎊', '🎈', '🎉'].map(icon => <option key={icon} value={icon}>{icon}</option>)}
                      </select>
                    </label>
                    <label>Иконка отдыха
                      <select value={newSchedule.restIcon} onChange={e => setNewSchedule(s => ({ ...s, restIcon: e.target.value }))} className="border rounded px-2 py-1 mx-1">
                        {['💼', '🏖️', '🎉', '🎂', '🎁', '🎈', '🎀', '🎊', '🎈', '🎉'].map(icon => <option key={icon} value={icon}>{icon}</option>)}
                      </select>
                    </label>
                    <button className="btn-rotate px-4 py-2 rounded-lg bg-green-600 text-white font-bold" onClick={handleAddScheduleToList} title="Добавить график">Добавить</button>
                  </div>
                  {/* Список графиков */}
                  <div className="mt-2 text-xs">
                    <b>Ваши графики:</b>
                    <ul className="list-disc list-inside mt-1">
                      {schedules.length === 0 && <li>Нет графиков</li>}
                      {schedules.map((sch, i) => (
                        <li key={i} className="flex items-center gap-2">
                          {editScheduleIndex === i && editSchedule ? (
                            <>
                              <input type="date" value={editSchedule.from} onChange={e => setEditSchedule((s: any) => ({ ...s, from: e.target.value }))} className="border rounded px-2 py-1 w-28" />
                              <input type="date" value={editSchedule.to} onChange={e => setEditSchedule((s: any) => ({ ...s, to: e.target.value }))} className="border rounded px-2 py-1 w-28" />
                              <input type="number" min={1} max={31} value={editSchedule.workDays} onChange={e => setEditSchedule((s: any) => ({ ...s, workDays: +e.target.value }))} className="border rounded px-2 py-1 w-16" />
                              <input type="number" min={1} max={31} value={editSchedule.restDays} onChange={e => setEditSchedule((s: any) => ({ ...s, restDays: +e.target.value }))} className="border rounded px-2 py-1 w-16" />
                              <select value={editSchedule.workIcon} onChange={e => setEditSchedule((s: any) => ({ ...s, workIcon: e.target.value }))} className="border rounded px-2 py-1">
                                {['💼', '🏖️', '🎉', '🎂', '🎁', '🎈', '🎀', '🎊', '🎈', '🎉'].map(icon => <option key={icon} value={icon}>{icon}</option>)}
                              </select>
                              <select value={editSchedule.restIcon} onChange={e => setEditSchedule((s: any) => ({ ...s, restIcon: e.target.value }))} className="border rounded px-2 py-1">
                                {['💼', '🏖️', '🎉', '🎂', '🎁', '🎈', '🎀', '🎊', '🎈', '🎉'].map(icon => <option key={icon} value={icon}>{icon}</option>)}
                              </select>
                              <button className="btn-rotate px-2 py-1 rounded bg-green-600 text-white" onClick={handleSaveEditSchedule} title="Сохранить"><Check className="w-4 h-4" /></button>
                              <button className="btn-rotate px-2 py-1 rounded bg-gray-300 text-gray-700" onClick={handleCancelEditSchedule} title="Отмена"><CloseIcon className="w-4 h-4" /></button>
                            </>
                          ) : (
                            <>
                              <span>{sch.from} — {sch.to}, {sch.workDays} раб., {sch.restDays} вых., {sch.workIcon}/{sch.restIcon}</span>
                              <button className="ml-1 text-blue-500 hover:text-blue-700 btn-rotate" onClick={() => handleStartEditSchedule(i)} title="Редактировать"><Edit2 className="w-4 h-4" /></button>
                              <button className="ml-1 text-red-500 hover:text-red-700 btn-rotate" onClick={() => handleDeleteScheduleFromList(i)} title="Удалить"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {/* Настройка фона календаря */}
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 text-purple-900">
                  <b>Фон календаря</b>
                  {(['year', 'month', 'week'] as const).map(view => (
                    <div key={view} className="mt-2 mb-4">
                      <div className="font-semibold mb-1">{view === 'year' ? 'Год' : view === 'month' ? 'Месяц' : 'Неделя'}</div>
                      <div className="flex flex-col gap-2">
                        {/* Кнопка выбора картинки */}
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            id={`bg-image-input-${view}`}
                            style={{ display: 'none' }}
                            onChange={e => handleBgFileChange(e, view)}
                          />
                          <label htmlFor={`bg-image-input-${view}`}
                            className="px-3 py-1 rounded bg-blue-100 text-blue-800 cursor-pointer btn-rotate border border-blue-300 hover:bg-blue-200">
                            Выбрать картинку
                          </label>
                          {/* Кнопка очистки */}
                          <button
                            className="px-3 py-1 rounded bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 btn-rotate"
                            onClick={() => {
                              dispatch({ type: 'UPDATE_CALENDAR_BACKGROUNDS', payload: { ...state.calendarBackgrounds, [view]: '' } });
                              setPendingBg(bg => ({ ...bg, [view]: undefined }));
                              setPendingGradient(gr => ({ ...gr, [view]: undefined }));
                            }}
                          >
                            Очистить
                          </button>
                        </div>
                        {/* Палитра для градиента */}
                        <div className="flex flex-col gap-2 mt-1">
                          <div className="flex gap-2 items-center">
                            <span>Верхний цвет:</span>
                            {colorSet.map(color => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-full border-2 ${pendingBg[view] === color ? 'border-blue-500 scale-110' : 'border-gray-300'} btn-rotate`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleBgGradientChange(view, color)}
                                title={color}
                              />
                            ))}
                          </div>
                          <div className="flex gap-2 items-center">
                            <span>Нижний цвет:</span>
                            {colorSet.map(color => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-full border-2 ${pendingGradient[view]?.color2 === color ? 'border-blue-500 scale-110' : 'border-gray-300'} btn-rotate`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleBgGradientChange(view, color)}
                                title={color}
                              />
                            ))}
                          </div>
                          <div className="w-full h-8 rounded mt-2" style={{ background: pendingBg[view] || state.calendarBackgrounds[view] || `linear-gradient(to bottom, ${defaultGradient.color1}, ${defaultGradient.color2})` }} />
                        </div>
                        {/* Превью текущего фона */}
                        <div className="mt-1 text-xs">
                          {state.calendarBackgrounds[view] ? (
                            state.calendarBackgrounds[view].startsWith('data:') ? (
                              <img src={state.calendarBackgrounds[view]} alt="фон" className="max-h-16 rounded shadow" />
                            ) : (
                              <div className="w-full h-8 rounded" style={{ background: state.calendarBackgrounds[view] }} />
                            )
                          ) : (
                            <span className="text-gray-400">Фон не выбран</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Настройка выделения дня */}
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-900">
                  <b>Вид выделенного дня</b>
                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    {highlightShapes.map(s => (
                      <button
                        key={s.value}
                        className={`px-3 py-2 rounded border-2 flex items-center gap-1 ${highlightShape === s.value ? 'border-blue-500 scale-105' : 'border-gray-300'} btn-rotate`}
                        onClick={() => setHighlightShape(s.value as any)}
                        title={s.label}
                      >
                        <span>{s.icon}</span> {s.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <span className="mr-2">Цвет:</span>
                    {highlightColors.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${highlightColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'} btn-rotate`}
                        style={{ backgroundColor: color }}
                        onClick={() => setHighlightColor(color)}
                        title={color}
                      />
                    ))}
                    <button className="ml-4 px-3 py-2 rounded bg-blue-600 text-white font-bold btn-rotate" onClick={handleApplyHighlight}>
                      Применить
                    </button>
                  </div>
                </div>
                {/* Раздел анимация */}
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-900 mt-6">
                  <b>Анимация переходов</b>
                  <div className="flex flex-wrap gap-4 mt-2 items-center">
                    <label className="font-medium">Тип анимации:
                      <select
                        className="ml-2 px-3 py-2 rounded border border-gray-300"
                        value={settings.calendarSettings?.animationType || 'slide'}
                        onChange={e => dispatch({
                          type: 'UPDATE_SETTINGS',
                          payload: {
                            calendarSettings: {
                              animationType: e.target.value as any,
                              todayColor: settings.calendarSettings?.todayColor || '#EF4444',
                              dayShape: settings.calendarSettings?.dayShape || 'rounded',
                              animationCombo1: settings.calendarSettings?.animationCombo1,
                              animationCombo2: settings.calendarSettings?.animationCombo2,
                            },
                          },
                        })}
                      >
                        <option value="none">Без анимации</option>
                        <option value="fade">Плавное появление</option>
                        <option value="slide">Слайд</option>
                        <option value="scale">Масштабирование</option>
                        <option value="flip">Переворот</option>
                        <option value="rotate">Поворот</option>
                        <option value="bounce">Прыжок</option>
                        <option value="blur">Размытие</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}