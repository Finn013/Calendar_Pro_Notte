import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Trash2, GripVertical, Plus, Save, Briefcase, Heart, Gift, Pill, Dumbbell, ShoppingCart, Book, Car, Plane, Home, PawPrint, Star } from 'lucide-react';
import AlertDialog from '../shared/AlertDialog';
import { RepeatingTask } from '../../context/AppContext';

// --- Библиотека иконок ---
export const iconLibrary = {
  Briefcase, Heart, Gift, Pill, Dumbbell, ShoppingCart, Book, Car, Plane, Home, PawPrint, Star
};

const IconComponent = ({ name, ...props }: { name: string, [key: string]: any }) => {
  const Icon = iconLibrary[name as keyof typeof iconLibrary];
  return Icon ? <Icon {...props} /> : <Star {...props} />; // Star as fallback
};

// --- Компонент настроек ---
export default function CalendarSettingsView({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp();
  const { settings, calendarBackgrounds, repeatingTasks } = state;
  const theme = settings.theme;

  // --- Состояния ---
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
  
  // Напоминания
  const [reminders, setReminders] = useState(() => {
      const saved = localStorage.getItem('calendar-reminders');
      return saved ? JSON.parse(saved) : [];
  });
  const [reminderInput, setReminderInput] = useState({ time: '', text: '' });

  // Повторяющиеся задачи
  const initialNewTaskState = { text: '', type: 'weekly' as 'weekly' | 'monthly' | 'yearly', value: 1, icon: 'Star', color: '#3B82F6' };
  const [newTask, setNewTask] = useState(initialNewTaskState);
  const draggedTask = useRef<number | null>(null);

  // Внешний вид
  const [highlightShape, setHighlightShape] = useState(settings.calendarSettings?.dayShape || 'rounded');
  const [highlightColor, setHighlightColor] = useState(settings.calendarSettings?.todayColor || '#EF4444');
  const [backgrounds, setBackgrounds] = useState(calendarBackgrounds);
  const [animationType, setAnimationType] = useState(settings.calendarSettings?.animationType || 'slide');

  // Фоны календаря - состояние для картинок и градиентов
  const [pendingBg, setPendingBg] = useState<{ [key in 'year' | 'month' | 'week']?: string }>({});
  const [pendingGradient, setPendingGradient] = useState<{ [key in 'year' | 'month' | 'week']?: { color1: string; color2: string } }>({});
  const defaultGradient = { color1: '#f472b6', color2: '#60a5fa' };
  const colorPalette = [
    '#f472b6', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#f87171', '#84cc16', '#6b7280', '#f3f4f6', '#1f2937', '#fff', '#000'
  ];
  
  const handlePendingBg = (view: 'year' | 'month' | 'week', value: string) => {
    setPendingBg(bg => ({ ...bg, [view]: value }));
    setPendingGradient(gr => ({ ...gr, [view]: undefined }));
  };
  
  const handlePendingGradient = (view: 'year' | 'month' | 'week', color1: string, color2: string) => {
    setPendingGradient(gr => ({ ...gr, [view]: { color1, color2 } }));
    setPendingBg(bg => ({ ...bg, [view]: `linear-gradient(to bottom, ${color1}, ${color2})` }));
  };

  // --- Эффекты ---
  useEffect(() => {
    localStorage.setItem('calendar-reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Автоматическое сохранение настроек внешнего вида при их изменении
  useEffect(() => {
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { 
        calendarSettings: { 
          ...settings.calendarSettings, 
          todayColor: highlightColor, 
          dayShape: highlightShape, 
          animationType: animationType as any 
        } 
      } 
    });
    dispatch({ type: 'UPDATE_CALENDAR_BACKGROUNDS', payload: backgrounds });
  }, [highlightColor, highlightShape, animationType, backgrounds, dispatch, settings.calendarSettings]);

  // --- Обработчики ---
  const handleAddReminder = () => {
    if (!reminderInput.time || !reminderInput.text.trim()) {
      setAlertContent({ title: 'Ошибка', message: 'Укажите время и текст.', onConfirm: () => setIsAlertOpen(false), onCancel: () => setIsAlertOpen(false) });
      setIsAlertOpen(true);
      return;
    }
    setReminders([...reminders, { id: Date.now().toString(), ...reminderInput, shown: false }]);
    setReminderInput({ time: '', text: '' });
  };

  const openDeleteReminderDialog = (id: string) => {
    setAlertContent({
      title: 'Подтверждение',
      message: 'Удалить это напоминание?',
      onConfirm: () => { setReminders(reminders.filter((r: any) => r.id !== id)); setIsAlertOpen(false); },
      onCancel: () => setIsAlertOpen(false)
    });
    setIsAlertOpen(true);
  };

  const handleAddTask = () => {
    if (!newTask.text.trim()) return;
    dispatch({ type: 'ADD_REPEATING_TASK', payload: { ...newTask, id: Date.now().toString() } });
    setNewTask(initialNewTaskState);
  };

  const openDeleteTaskDialog = (id: string) => {
    setAlertContent({
      title: 'Подтверждение', message: 'Удалить эту задачу?',
      onConfirm: () => { dispatch({ type: 'DELETE_REPEATING_TASK', payload: id }); setIsAlertOpen(false); },
      onCancel: () => setIsAlertOpen(false)
    });
    setIsAlertOpen(true);
  };

  const handleDragStart = (index: number) => { draggedTask.current = index; };
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => { e.preventDefault(); };
  const handleDrop = (index: number) => {
    if (draggedTask.current === null) return;
    const newTasks = [...repeatingTasks];
    const draggedItem = newTasks.splice(draggedTask.current, 1)[0];
    newTasks.splice(index, 0, draggedItem);
    dispatch({ type: 'SET_REPEATING_TASKS', payload: newTasks });
    draggedTask.current = null;
  };

  const handleApplyVisuals = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { calendarSettings: { ...settings.calendarSettings, todayColor: highlightColor, dayShape: highlightShape, animationType: animationType as any } } });
    dispatch({ type: 'UPDATE_CALENDAR_BACKGROUNDS', payload: backgrounds });
    setAlertContent({ title: 'Сохранено', message: 'Настройки вида обновлены.', onConfirm: () => setIsAlertOpen(false), onCancel: () => setIsAlertOpen(false) });
    setIsAlertOpen(true);
  };

  const handleBackWithSave = () => {
    // Сохраняем все настройки перед выходом
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { 
        calendarSettings: { 
          ...settings.calendarSettings, 
          todayColor: highlightColor, 
          dayShape: highlightShape, 
          animationType: animationType as any 
        } 
      } 
    });
    dispatch({ type: 'UPDATE_CALENDAR_BACKGROUNDS', payload: backgrounds });
    onBack();
  };

  // --- UI ---
  const inputClasses = `w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`;
  const buttonClasses = `px-4 py-2 rounded-lg font-bold text-white transition-colors ${settings.buttonStyle === 'pill' ? 'rounded-full' : ''}`;
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <>
      <AlertDialog isOpen={isAlertOpen} {...alertContent} theme={theme} />
      <div className={`min-h-screen p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-6 max-w-4xl mx-auto">
            <button onClick={handleBackWithSave} className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}><ArrowLeft className="w-6 h-6" /></button>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Настройки календаря</h1>
            <div className="w-8"></div>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto pb-16">
            {/* --- Сортировка --- */}
            <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
                <h3 className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Сортировка задач</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.calendarSettings?.autoSortByTime || false} onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { calendarSettings: { ...settings.calendarSettings, autoSortByTime: e.target.checked } } })} className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500" />
                    <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Автоматически сортировать задачи по времени (напр. "09:00")</span>
                </label>
            </div>

            {/* --- Повторяющиеся задачи --- */}
            <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
                <h3 className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Повторяющиеся задачи</h3>
                <div className="space-y-3 p-3 border rounded-lg dark:border-gray-700">
                    <input type="text" placeholder="Текст новой задачи..." value={newTask.text} onChange={e => setNewTask({...newTask, text: e.target.value})} className={inputClasses} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value as any, value: 1})} className={inputClasses}>
                            <option value="weekly">Еженедельно</option>
                            <option value="monthly">Ежемесячно</option>
                            <option value="yearly">Ежегодно</option>
                        </select>
                        {useMemo(() => {
                            switch (newTask.type) {
                                case 'weekly': return <select value={newTask.value} onChange={e => setNewTask({...newTask, value: +e.target.value})} className={inputClasses}>{daysOfWeek.map((day, i) => <option key={i} value={i + 1}>{day}</option>)}</select>;
                                case 'monthly': return <input type="number" min="1" max="31" value={newTask.value} onChange={e => setNewTask({...newTask, value: +e.target.value})} className={inputClasses} placeholder="Число" />;
                                case 'yearly': return <input type="number" min="1" max="366" value={newTask.value} onChange={e => setNewTask({...newTask, value: +e.target.value})} className={inputClasses} placeholder="День в году" />;
                            }
                        }, [newTask.type])}
                    </div>
                    <div className="flex items-center gap-3"><span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Иконка:</span><div className="flex flex-wrap gap-2">{Object.keys(iconLibrary).map(iconName => (<button key={iconName} onClick={() => setNewTask({...newTask, icon: iconName})} className={`p-2 rounded-full ${newTask.icon === iconName ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}><IconComponent name={iconName} size={20} /></button>))}</div></div>
                    <div className="flex items-center gap-3"><span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Цвет:</span><div className="flex flex-wrap gap-2">{['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(color => (<button key={color} onClick={() => setNewTask({...newTask, color})} className={`w-8 h-8 rounded-full border-2 ${newTask.color === color ? 'border-white scale-110' : 'border-transparent'}`} style={{backgroundColor: color}} />))}</div></div>
                    <button onClick={handleAddTask} className={`${buttonClasses} bg-blue-600 hover:bg-blue-500 w-full`}><Plus className="inline-block -mt-1"/> Добавить задачу</button>
                </div>
                <ul className="mt-4 space-y-2">{repeatingTasks.map((task, index) => (<li key={task.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={handleDragOver} onDrop={() => handleDrop(index)} className="flex items-center justify-between p-2 rounded bg-gray-100 dark:bg-gray-700 cursor-grab active:cursor-grabbing"><div className="flex items-center gap-3"><GripVertical className="text-gray-400"/><IconComponent name={task.icon} size={20} style={{ color: task.color }} /><div><span className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{task.text}</span><p className="text-xs text-gray-500 dark:text-gray-400">{task.type === 'weekly' ? `Каждый ${daysOfWeek[task.value - 1]}` : task.type === 'monthly' ? `Каждое ${task.value} число` : `Каждый ${task.value}-й день года`}</p></div></div><button onClick={() => openDeleteTaskDialog(task.id)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={18}/></button></li>))}</ul>
            </div>

            {/* --- Напоминания --- */}
            <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
                <h3 className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Локальные уведомления</h3>
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <input type="datetime-local" value={reminderInput.time} onChange={e => setReminderInput({...reminderInput, time: e.target.value})} className={inputClasses} />
                    <input type="text" placeholder="Что напомнить?" value={reminderInput.text} onChange={e => setReminderInput({...reminderInput, text: e.target.value})} className={inputClasses} />
                    <button onClick={handleAddReminder} className={`${buttonClasses} bg-blue-600 hover:bg-blue-500 w-full sm:w-auto`}><Plus className="inline-block -mt-1"/> Добавить</button>
                </div>
                <ul className="mt-4 space-y-2">{reminders.map((r: any) => (<li key={r.id} className={`flex justify-between items-center p-2 rounded ${new Date(r.time) < new Date() ? 'text-gray-400 line-through' : theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}><span>{new Date(r.time).toLocaleString()} — {r.text}</span><button onClick={() => openDeleteReminderDialog(r.id)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={18}/></button></li>))}</ul>
            </div>

            {/* --- Внешний вид --- */}
            <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
                <h3 className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Внешний вид календаря</h3>
                <div className="mb-4"><h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Вид выделенного дня</h4><div className="flex flex-wrap gap-2 items-center">{['rounded', 'square', 'circle', 'octagon'].map((s, i) => (<button key={s} onClick={() => setHighlightShape(s)} title={s} className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2 ${highlightShape === s ? 'border-blue-500 scale-105' : 'border-gray-300 dark:border-gray-600'} ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}><span>{['⬜', '⬛', '⭕', '⯃'][i]}</span> {s}</button>))}</div><div className="flex flex-wrap gap-2 mt-3 items-center"><span className={`mr-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Цвет:</span>{['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'].map(color => (<button key={color} onClick={() => setHighlightColor(color)} className={`w-8 h-8 rounded-full border-2 ${highlightColor === color ? 'border-blue-500 scale-110' : 'border-gray-300 dark:border-gray-600'}`} style={{ backgroundColor: color }} />))}</div></div>
                <div className="mb-6"><h4 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Настройка фонов календаря</h4>
                {(['year', 'month', 'week'] as const).map(view => (
                  <div key={view} className="mb-6 p-4 border rounded-lg dark:border-gray-600">
                    <div className={`font-semibold mb-3 text-lg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      {view === 'year' ? 'Вид года' : view === 'month' ? 'Вид месяца' : 'Вид недели'}
                    </div>
                    <div className="flex flex-col gap-3">
                      {/* Кнопки выбора картинки и очистки */}
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          id={`bg-image-input-${view}`}
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const imageData = ev.target?.result as string;
                              handlePendingBg(view, imageData);
                              setBackgrounds(bg => ({
                                ...bg,
                                [view]: imageData
                              }));
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                        />
                        <label htmlFor={`bg-image-input-${view}`}
                          className="px-3 py-2 rounded bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors">
                          Выбрать картинку
                        </label>
                        <button
                          className="px-3 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                          onClick={() => {
                            setBackgrounds(bg => ({ ...bg, [view]: '' }));
                            setPendingBg(bg => ({ ...bg, [view]: undefined }));
                            setPendingGradient(gr => ({ ...gr, [view]: undefined }));
                          }}
                        >
                          Очистить
                        </button>
                        <input
                          type="text"
                          placeholder="Или введите URL изображения"
                          value={backgrounds[view] && !backgrounds[view].startsWith('data:') ? backgrounds[view] : ''}
                          onChange={e => {
                            const url = e.target.value;
                            setBackgrounds(bg => ({ ...bg, [view]: url }));
                            if (url) handlePendingBg(view, url);
                          }}
                          className={`${inputClasses} flex-1`}
                        />
                      </div>
                      
                      {/* Палитра для градиента */}
                      <div className="space-y-3">
                        <div className="flex gap-2 items-center flex-wrap">
                          <span className={`text-sm font-medium mr-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Верхний цвет:</span>
                          {colorPalette.map(color => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                pendingGradient[view]?.color1 === color ? 'border-blue-500 scale-110' : 'border-gray-300 dark:border-gray-600'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                const newColor1 = color;
                                const newColor2 = pendingGradient[view]?.color2 || defaultGradient.color2;
                                handlePendingGradient(view, newColor1, newColor2);
                                const gradient = `linear-gradient(to bottom, ${newColor1}, ${newColor2})`;
                                setBackgrounds(bg => ({ ...bg, [view]: gradient }));
                              }}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2 items-center flex-wrap">
                          <span className={`text-sm font-medium mr-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Нижний цвет:</span>
                          {colorPalette.map(color => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                pendingGradient[view]?.color2 === color ? 'border-blue-500 scale-110' : 'border-gray-300 dark:border-gray-600'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                const newColor1 = pendingGradient[view]?.color1 || defaultGradient.color1;
                                const newColor2 = color;
                                handlePendingGradient(view, newColor1, newColor2);
                                const gradient = `linear-gradient(to bottom, ${newColor1}, ${newColor2})`;
                                setBackgrounds(bg => ({ ...bg, [view]: gradient }));
                              }}
                              title={color}
                            />
                          ))}
                        </div>
                        
                        {/* Превью градиента */}
                        <div 
                          className="w-full h-8 rounded border" 
                          style={{ 
                            background: pendingBg[view] || backgrounds[view] || `linear-gradient(to bottom, ${defaultGradient.color1}, ${defaultGradient.color2})`
                          }} 
                        />
                      </div>
                      
                      {/* Превью текущего фона */}
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {backgrounds[view] ? (
                          backgrounds[view].startsWith('data:') ? (
                            <div className="space-y-2">
                              <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Загруженное изображение:</span>
                              <img src={backgrounds[view]} alt="фон" className="max-h-20 rounded shadow border" />
                            </div>
                          ) : backgrounds[view].startsWith('linear-gradient') ? (
                            <div className="space-y-2">
                              <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Градиент:</span>
                              <div className="w-32 h-8 rounded border" style={{ background: backgrounds[view] }} />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>URL изображения:</span>
                              <div className={`text-xs break-all ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{backgrounds[view]}</div>
                            </div>
                          )
                        ) : (
                          <span className="text-gray-400">Фон не выбран (по умолчанию)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
                <div><h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Анимация</h4><div className="flex flex-wrap gap-2">{['slide', 'fade', 'scale', 'none'].map(opt => (<button key={opt} onClick={() => setAnimationType(opt)} className={`${buttonClasses} ${animationType === opt ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'}`}>{opt}</button>))}</div></div>
                {/* Убираем кнопку "Применить и сохранить вид" - настройки сохраняются автоматически */}
            </div>
        </div>
      </div>
    </>
  );
}