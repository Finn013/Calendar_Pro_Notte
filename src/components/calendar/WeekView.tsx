import React, { useState } from 'react';
import { Menu, Clock, Plus, X, Check, Copy, Trash2, Palette } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function WeekView() {
  const { state, dispatch } = useApp();
  const { selectedDate, days, settings } = state;
  const [showTimeModal, setShowTimeModal] = useState<string | null>(null);
  const [showDayMenu, setShowDayMenu] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [newTimeEntry, setNewTimeEntry] = useState({ hours: 0, minutes: 0, description: '' });
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; date: string } | null>(null);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  const getWeekDates = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const formatDateKey = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date).replace(/\./g, '-');
  };

  const getDayData = (date: Date) => {
    const key = formatDateKey(date);
    return state.days[key] || { tasks: [], timeEntries: [] };
  };

  const getWeekTime = () => {
    const weekDates = getWeekDates();
    let totalMinutes = 0;
    
    weekDates.forEach(date => {
      const dayData = getDayData(date);
      totalMinutes += dayData.timeEntries.reduce((sum, entry) => 
        sum + (entry.hours * 60) + entry.minutes, 0
      );
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getMonthTime = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
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

  const addTask = (date: Date) => {
    const task = {
      id: Date.now().toString(),
      text: '',
      completed: false,
      createdAt: Date.now()
    };

    dispatch({
      type: 'ADD_TASK',
      payload: { date: formatDateKey(date), task }
    });
  };

  const updateTask = (date: Date, taskId: string, updates: any) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: { date: formatDateKey(date), taskId, updates }
    });
  };

  const deleteTask = (date: Date, taskId: string) => {
    dispatch({
      type: 'DELETE_TASK',
      payload: { date: formatDateKey(date), taskId }
    });
  };

  const reorderTasks = (date: Date, draggedTaskId: string, targetTaskId: string) => {
    const dateKey = formatDateKey(date);
    const dayData = getDayData(date);
    const tasks = [...dayData.tasks];
    
    const draggedIndex = tasks.findIndex(task => task.id === draggedTaskId);
    const targetIndex = tasks.findIndex(task => task.id === targetTaskId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [draggedTask] = tasks.splice(draggedIndex, 1);
    tasks.splice(targetIndex, 0, draggedTask);
    
    dispatch({
      type: 'SET_DAY_DATA',
      payload: { 
        date: dateKey, 
        data: { ...dayData, tasks }
      }
    });
  };

  const addTimeEntry = (date: Date) => {
    if (newTimeEntry.hours > 0 || newTimeEntry.minutes > 0) {
      const entry = {
        id: Date.now().toString(),
        hours: newTimeEntry.hours,
        minutes: newTimeEntry.minutes,
        description: newTimeEntry.description
      };

      dispatch({
        type: 'ADD_TIME_ENTRY',
        payload: { date: formatDateKey(date), entry }
      });

      setNewTimeEntry({ hours: 0, minutes: 0, description: '' });
      setShowTimeModal(null);
    }
  };

  const deleteTimeEntry = (date: Date, entryId: string) => {
    dispatch({
      type: 'DELETE_TIME_ENTRY',
      payload: { date: formatDateKey(date), entryId }
    });
  };

  const getTotalTime = (date: Date) => {
    const dayData = getDayData(date);
    const totalMinutes = dayData.timeEntries.reduce((total, entry) => {
      return total + (entry.hours * 60) + entry.minutes;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes, totalMinutes };
  };

  const handleDayMenuAction = (date: Date, action: string) => {
    const dateKey = formatDateKey(date);
    
    switch (action) {
      case 'complete-all':
        const dayData = getDayData(date);
        dayData.tasks.forEach(task => {
          if (!task.completed) {
            updateTask(date, task.id, { completed: true });
          }
        });
        break;
      case 'copy-tasks':
        const dayToCopy = getDayData(date);
        const tasksText = dayToCopy.tasks.map(task => 
          `${task.completed ? '✓' : '○'} ${task.text}`
        ).join('\n');
        navigator.clipboard.writeText(tasksText);
        break;
      case 'clear-all':
        const dayToClear = getDayData(date);
        dayToClear.tasks.forEach(task => {
          deleteTask(date, task.id);
        });
        break;
      case 'color':
        setShowColorPicker(dateKey);
        break;
    }
    setShowDayMenu(null);
  };

  const setDayColor = (date: Date, color: string) => {
    dispatch({
      type: 'SET_DAY_COLOR',
      payload: { date: formatDateKey(date), color }
    });
    setShowColorPicker(null);
  };

  const handleTaskDragStart = (e: React.DragEvent, taskId: string, date: Date) => {
    setDraggedTask({ taskId, date: formatDateKey(date) });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTaskDrop = (e: React.DragEvent, targetTaskId: string, date: Date) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.date !== formatDateKey(date)) {
      setDraggedTask(null);
      return;
    }
    
    reorderTasks(date, draggedTask.taskId, targetTaskId);
    setDraggedTask(null);
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-xl';
      default: return 'text-lg';
    }
  };

  const weekDates = getWeekDates();
  const today = new Date();
  const weekTime = getWeekTime();
  const monthTime = getMonthTime();

  return (
    <div className="p-4 sm:p-6">
      <div className={`text-center mb-6 ${
        settings.theme === 'dark' ? 'text-white' : 'text-gray-800'
      }`}>
        <div className={`text-lg sm:text-xl font-bold ${getFontSizeClass()}`}>
          Неделя {weekDates[0].getDate()} - {weekDates[6].getDate()} {new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(weekDates[0])}
        </div>
        <div className={`text-sm font-medium mt-1 ${
          settings.theme === 'dark' ? 'text-green-400' : 'text-green-600'
        }`}>
          Неделя: {weekTime} | Месяц: {monthTime}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {weekDates.map((date, index) => {
          const dayData = getDayData(date);
          const isToday = date.toDateString() === today.toDateString();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const dateKey = formatDateKey(date);
          const totalTime = getTotalTime(date);

          // Sort tasks: incomplete first, then completed
          const sortedTasks = [...dayData.tasks].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
          });

          return (
            <div
              key={dateKey}
              className={`rounded-lg border-2 overflow-hidden transition-all duration-200 hover:shadow-xl ${
                isToday
                  ? 'shadow-lg'
                  : isWeekend
                    ? settings.theme === 'dark'
                      ? 'border-red-400 bg-red-900/20'
                      : 'border-red-200 bg-red-50'
                    : settings.theme === 'dark'
                      ? 'border-gray-600 bg-gray-800'
                      : 'border-gray-200 bg-white'
              }`}
              style={
                isToday 
                  ? { borderColor: settings.todayColor }
                  : dayData.color 
                    ? { backgroundColor: dayData.color + '20', borderColor: dayData.color } 
                    : {}
              }
            >
              {/* Day Header */}
              <div className={`p-3 sm:p-4 border-b flex items-center justify-between ${
                isToday
                  ? 'text-black'
                  : isWeekend
                    ? settings.theme === 'dark'
                      ? 'bg-red-800 text-red-100'
                      : 'bg-red-100 text-red-800'
                    : settings.theme === 'dark'
                      ? 'bg-gray-700 text-gray-200'
                      : 'bg-gray-50 text-gray-800'
              }`}
              style={isToday ? { backgroundColor: settings.todayColor } : {}}
            >
                <div>
                  <h3 className={`font-bold ${getFontSizeClass()}`}>
                    {new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date)}
                  </h3>
                  <p className={`text-sm ${getFontSizeClass()}`}>
                    {date.getDate()} {new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(date)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTimeModal(dateKey)}
                    className={`p-2 rounded-lg transition-colors ${
                      isToday
                        ? 'bg-black/20 hover:bg-black/30'
                        : settings.theme === 'dark'
                          ? 'bg-gray-600 hover:bg-gray-500'
                          : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowDayMenu(showDayMenu === dateKey ? null : dateKey)}
                      className={`p-2 rounded-lg transition-colors ${
                        isToday
                          ? 'bg-black/20 hover:bg-black/30'
                          : settings.theme === 'dark'
                            ? 'bg-gray-600 hover:bg-gray-500'
                            : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      <Menu className="w-4 h-4" />
                    </button>

                    {showDayMenu === dateKey && (
                      <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-20 ${
                        settings.theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                      } border`}>
                        <button
                          onClick={() => handleDayMenuAction(date, 'color')}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2`}
                        >
                          <Palette className="w-4 h-4" />
                          Цвет дня
                        </button>
                        <button
                          onClick={() => handleDayMenuAction(date, 'complete-all')}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2`}
                        >
                          <Check className="w-4 h-4" />
                          Выполнить все
                        </button>
                        <button
                          onClick={() => handleDayMenuAction(date, 'copy-tasks')}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2`}
                        >
                          <Copy className="w-4 h-4" />
                          Копировать дела
                        </button>
                        <button
                          onClick={() => handleDayMenuAction(date, 'clear-all')}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2 text-red-500`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Очистить все
                        </button>
                      </div>
                    )}

                    {showColorPicker === dateKey && (
                      <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-30 p-4 ${
                        settings.theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                      } border`}>
                        <div className="grid grid-cols-4 gap-2">
                          {colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setDayColor(date, color)}
                              className="w-8 h-8 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => setShowColorPicker(null)}
                          className={`w-full mt-3 py-1 px-2 text-sm rounded ${
                            settings.theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Отмена
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="p-3 sm:p-4 space-y-2">
                {sortedTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable={!task.completed}
                    onDragStart={(e) => handleTaskDragStart(e, task.id, date)}
                    onDragOver={handleTaskDragOver}
                    onDrop={(e) => handleTaskDrop(e, task.id, date)}
                    className={`flex items-center gap-3 p-2 sm:p-3 rounded-lg cursor-move ${
                      task.completed
                        ? settings.theme === 'dark'
                          ? 'bg-gray-700 opacity-60'
                          : 'bg-gray-100 opacity-60'
                        : settings.theme === 'dark'
                          ? 'bg-gray-700'
                          : 'bg-gray-50'
                    } ${draggedTask?.taskId === task.id ? 'opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => updateTask(date, task.id, { completed: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <input
                      type="text"
                      value={task.text}
                      onChange={(e) => updateTask(date, task.id, { text: e.target.value })}
                      placeholder="Введите задачу..."
                      className={`flex-1 bg-transparent border-none outline-none ${getFontSizeClass()} ${
                        task.completed ? 'line-through text-gray-500' : ''
                      } ${settings.theme === 'dark' ? 'text-gray-200 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
                    />
                    <button
                      onClick={() => deleteTask(date, task.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addTask(date)}
                  className={`w-full p-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors ${getFontSizeClass()} ${
                    settings.theme === 'dark'
                      ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                      : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  Добавить дело
                </button>
              </div>

              {/* Time Display */}
              {totalTime.totalMinutes > 0 && (
                <div className={`px-3 sm:px-4 pb-3 sm:pb-4 ${getFontSizeClass()}`}>
                  <div className={`p-3 rounded-lg ${
                    settings.theme === 'dark' ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
                  }`}>
                    <div className="font-medium flex items-center justify-between">
                      <span>Время за день: {totalTime.hours}ч {totalTime.minutes}м</span>
                    </div>
                    {dayData.timeEntries.map((entry) => (
                      <div key={entry.id} className="text-sm mt-1 flex items-center justify-between">
                        <span>
                          {entry.hours}ч {entry.minutes}м
                          {entry.description && ` - ${entry.description}`}
                        </span>
                        <button
                          onClick={() => deleteTimeEntry(date, entry.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 w-full max-w-md ${
            settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${getFontSizeClass()}`}>Добавить время</h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-1 ${getFontSizeClass()}`}>Часы</label>
                  <select
                    value={newTimeEntry.hours}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, hours: parseInt(e.target.value) })}
                    className={`w-full p-2 border rounded-lg ${getFontSizeClass()} ${
                      settings.theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'border-gray-300'
                    }`}
                  >
                    {Array.from({ length: 25 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-1 ${getFontSizeClass()}`}>Минуты</label>
                  <select
                    value={newTimeEntry.minutes}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, minutes: parseInt(e.target.value) })}
                    className={`w-full p-2 border rounded-lg ${getFontSizeClass()} ${
                      settings.theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'border-gray-300'
                    }`}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${getFontSizeClass()}`}>Описание (необязательно)</label>
                <input
                  type="text"
                  value={newTimeEntry.description}
                  onChange={(e) => setNewTimeEntry({ ...newTimeEntry, description: e.target.value })}
                  placeholder="Что делали?"
                  className={`w-full p-2 border rounded-lg ${getFontSizeClass()} ${
                    settings.theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'border-gray-300 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => addTimeEntry(weekDates.find(d => formatDateKey(d) === showTimeModal)!)}
                className={`flex-1 py-2 px-4 text-white rounded-lg ${getFontSizeClass()}`}
                style={{ backgroundColor: settings.buttonColor }}
              >
                Добавить
              </button>
              <button
                onClick={() => setShowTimeModal(null)}
                className={`flex-1 py-2 px-4 border rounded-lg ${getFontSizeClass()} ${
                  settings.theme === 'dark' 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}