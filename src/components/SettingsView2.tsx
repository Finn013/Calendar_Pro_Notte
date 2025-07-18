import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Database, Info, Share, Upload, Settings as SettingsIcon, List as ListIcon, FileText as FileTextIcon, Calendar as CalendarIcon } from 'lucide-react';

const BUTTON_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E42', '#A78BFA', '#F472B6', '#FBBF24', '#374151', '#E5E7EB', '#111827', '#22D3EE', '#F87171'
];

const SECTION_LABELS: Record<string, string> = {
  date: 'Дата',
  calendar: 'Календарь',
  notes: 'Заметки',
  lists: 'Списки',
};

const PIN_KEY = 'app_pin';

export default function SettingsView2({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp();
  const settings = state.settings;
  const theme = settings.theme;

  // --- Фон разделов ---
  const [sectionBackgrounds, setSectionBackgrounds] = useState<{ main: string; lists: string; notes: string }>(() => {
    const saved = localStorage.getItem('section-backgrounds');
    return saved ? JSON.parse(saved) : { main: '', lists: '', notes: '' };
  });
  const [bgInput, setBgInput] = useState<{ type: 'image' | 'gradient'; section: 'main' | 'lists' | 'notes'; value: string }>({ type: 'gradient', section: 'main', value: '' });
  const [pendingBg, setPendingBg] = useState<{ [key in 'main' | 'lists' | 'notes']?: string }>({});
  const [pendingGradient, setPendingGradient] = useState<{ [key in 'main' | 'lists' | 'notes']?: { color1: string; color2: string } }>({});
  const defaultGradient = { color1: '#f472b6', color2: '#60a5fa' };
  const colorPalette = [
    '#f472b6', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#f87171', '#fbbf24', '#6b7280', '#f3f4f6', '#1f2937', '#fff', '#000'
  ];
  const handlePendingBg = (section: 'main' | 'lists' | 'notes', value: string) => {
    setPendingBg(bg => ({ ...bg, [section]: value }));
    setPendingGradient(gr => ({ ...gr, [section]: undefined }));
  };
  const handlePendingGradient = (section: 'main' | 'lists' | 'notes', color1: string, color2: string) => {
    setPendingGradient(gr => ({ ...gr, [section]: { color1, color2 } }));
    setPendingBg(bg => ({ ...bg, [section]: `linear-gradient(to bottom, ${color1}, ${color2})` }));
  };

  // Применение темы
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Смена темы
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: newTheme } });
  };

  // Смена размера шрифта
  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { fontSize } });
  };

  // Смена стиля кнопок
  const handleButtonStyleChange = (buttonStyle: 'rounded' | 'square' | 'pill' | 'octagon') => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { buttonStyle } });
  };

  // Смена цвета кнопок
  const handleButtonColorChange = (buttonColor: string) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { buttonColor } });
  };

  // Смена порядка разделов
  const moveSection = (from: number, to: number) => {
    if (to < 0 || to >= settings.mainScreenOrder.length) return;
    const newOrder = [...settings.mainScreenOrder];
    const [removed] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, removed);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { mainScreenOrder: newOrder } });
  };

  // Drag&Drop для порядка разделов с ghost и touch
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragGhostRef = useRef<HTMLLIElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [order, setOrder] = useState(settings.mainScreenOrder);

  // Синхронизируем order с глобальным состоянием
  useEffect(() => { setOrder(settings.mainScreenOrder); }, [settings.mainScreenOrder]);

  const handleDragStart = (idx: number, e?: React.DragEvent | React.TouchEvent) => {
    setDraggedIdx(idx);
    setDragOverIdx(idx);
    if (e && 'dataTransfer' in e) {
      e.dataTransfer.effectAllowed = 'move';
      // Для Firefox
      e.dataTransfer.setData('text/plain', '');
    }
    if (e && 'touches' in e && e.touches.length > 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };
  const handleDragOver = (idx: number, e?: React.DragEvent | React.TouchEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) { setDraggedIdx(null); setDragOverIdx(null); return; }
    const newOrder = [...order];
    const [removed] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(idx, 0, removed);
    setOrder(newOrder);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { mainScreenOrder: newOrder } });
    setDraggedIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDraggedIdx(null); setDragOverIdx(null); };

  // Touch events for mobile
  const handleTouchMove = (idx: number, e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const y = e.touches[0].clientY;
    const delta = y - touchStartY.current;
    if (Math.abs(delta) > 30) {
      let targetIdx = idx;
      if (delta > 0 && idx < order.length - 1) targetIdx = idx + 1;
      if (delta < 0 && idx > 0) targetIdx = idx - 1;
      if (targetIdx !== idx) {
        handleDrop(targetIdx);
        touchStartY.current = y;
      }
    }
  };
  const handleTouchEnd = () => { setDraggedIdx(null); setDragOverIdx(null); touchStartY.current = null; };

  // --- Реальная статистика ---
  const getDataStats = () => {
    // Подсчёт задач
    let totalTasks = 0, completedTasks = 0;
    Object.values(state.days).forEach(day => {
      if (day.tasks) {
        totalTasks += day.tasks.length;
        completedTasks += day.tasks.filter(t => t.completed).length;
      }
    });
    // Подсчёт заметок
    const totalNotes = state.notes.length;
    // Подсчёт списков и пунктов
    const totalLists = state.lists.length;
    let totalListItems = 0, completedListItems = 0;
    state.lists.forEach(list => {
      totalListItems += list.items.length;
      completedListItems += list.items.filter(i => i.completed).length;
    });
    return { totalTasks, completedTasks, totalNotes, totalLists, totalListItems, completedListItems };
  };
  const stats = getDataStats();

  // --- Экспорт данных ---
  const handleExport = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendar-pro-notte-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Импорт данных ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        // Сохраняем в localStorage и перезагружаем страницу
        localStorage.setItem('calendar-app-data', JSON.stringify(data));
        if (data.settings) {
          localStorage.setItem('calendar-settings', JSON.stringify(data.settings));
        }
        alert('Данные успешно импортированы! Приложение будет перезагружено.');
        window.location.reload();
      } catch (error) {
        alert('Ошибка: не удалось прочитать файл. Пожалуйста, выберите корректный JSON-файл.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Очистка данных ---
  const handleClear = () => {
    if (window.confirm('Вы уверены, что хотите удалить все данные? Это действие необратимо!')) {
      localStorage.clear();
      alert('Все данные удалены. Приложение будет перезагружено.');
      window.location.reload();
    }
  };

  // Добавляю определение класса для фона в зависимости от темы
  const bgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';

  return (
    <div className={`min-h-screen w-full ${bgClass} pb-8`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-2xl">
        {/* Кнопка назад */}
        <button
          onClick={onBack}
          className={`mb-4 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow ${theme === 'dark' ? 'bg-gray-800 text-orange-300 hover:bg-gray-700' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
        >
          ← Назад
        </button>
        <h1 className="text-2xl font-bold mb-4">Настройки</h1>

        {/* Тема */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Тема</h2>
          <div className="flex gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={`px-4 py-2 rounded border ${theme === 'light' ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300'}`}
            >
              Светлая
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`px-4 py-2 rounded border ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Тёмная
            </button>
          </div>
        </div>

        {/* Размер шрифта */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Размер шрифта</h2>
          <div className="flex gap-4 items-end">
            <button
              onClick={() => handleFontSizeChange('small')}
              className={`px-4 py-2 rounded border ${settings.fontSize === 'small' ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300'} text-xs`}
              style={{ fontSize: '0.8rem' }}
            >
              Маленький
            </button>
            <button
              onClick={() => handleFontSizeChange('medium')}
              className={`px-4 py-2 rounded border ${settings.fontSize === 'medium' ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300'} text-base`}
              style={{ fontSize: '1rem' }}
            >
              Средний
            </button>
            <button
              onClick={() => handleFontSizeChange('large')}
              className={`px-4 py-2 rounded border ${settings.fontSize === 'large' ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300'} text-xl`}
              style={{ fontSize: '1.3rem' }}
            >
              Большой
            </button>
          </div>
        </div>

        {/* Стиль кнопок */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Стиль кнопок</h2>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handleButtonStyleChange('rounded')}
              className={`px-4 py-2 border ${settings.buttonStyle === 'rounded' ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300'} rounded-lg flex items-center gap-2`}
            >
              <span className="inline-block w-6 h-6 rounded-lg border bg-pink-300"></span> Скруглённые
            </button>
            <button
              onClick={() => handleButtonStyleChange('square')}
              className={`px-4 py-2 border ${settings.buttonStyle === 'square' ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300'} rounded-none flex items-center gap-2`}
            >
              <span className="inline-block w-6 h-6 border bg-yellow-400"></span> Квадратные
            </button>
            <button
              onClick={() => handleButtonStyleChange('pill')}
              className={`px-4 py-2 border ${settings.buttonStyle === 'pill' ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300'} rounded-full flex items-center gap-2`}
            >
              <span className="inline-block w-6 h-6 rounded-full border bg-green-300"></span> Круглые
            </button>
            <button
              onClick={() => handleButtonStyleChange('octagon')}
              className={`px-4 py-2 border ${settings.buttonStyle === 'octagon' ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300'} octagon-btn flex items-center gap-2`}
            >
              <span className="inline-block w-6 h-6 border bg-purple-400 octagon-btn"></span> Октагон
            </button>
          </div>
        </div>

        {/* Цвет кнопок */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Цвет кнопок</h2>
          <div className="flex flex-wrap gap-2">
            {BUTTON_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleButtonColorChange(color)}
                className={`w-8 h-8 rounded-full border-2 ${settings.buttonColor === color ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Порядок разделов (drag&drop с ghost и touch) */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Порядок разделов</h2>
          <ul className="space-y-2">
            {order.map((section, idx) => (
              <li
                key={section}
                ref={draggedIdx === idx ? dragGhostRef : null}
                className={`flex items-center gap-2 p-2 rounded border bg-white shadow cursor-move transition-all duration-150
                ${draggedIdx === idx ? 'opacity-50' : ''}
                ${dragOverIdx === idx && draggedIdx !== null && draggedIdx !== idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                draggable
                onDragStart={e => handleDragStart(idx, e)}
                onDragOver={e => handleDragOver(idx, e)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                // Touch events
                onTouchStart={e => handleDragStart(idx, e)}
                onTouchMove={e => handleTouchMove(idx, e)}
                onTouchEnd={handleTouchEnd}
              >
                {section === 'calendar' && <CalendarIcon className="w-5 h-5 text-blue-500" />}
                {section === 'notes' && <FileTextIcon className="w-5 h-5 text-pink-500" />}
                {section === 'lists' && <ListIcon className="w-5 h-5 text-green-500" />}
                {section === 'date' && <SettingsIcon className="w-5 h-5 text-gray-500" />}
                <span className="flex-1">{SECTION_LABELS[section] || section}</span>
              </li>
            ))}
            {/* Ghost placeholder */}
            {draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx && (
              <li className="h-8 border-2 border-dashed border-blue-400 rounded bg-blue-50 animate-pulse"></li>
            )}
          </ul>
        </div>

        {/* Фон разделов */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 mt-6">
          <b>Фон разделов</b>
          {(['main', 'lists', 'notes'] as const).map(section => (
            <div key={section} className="mt-2 mb-4">
              <div className="font-semibold mb-1">{section === 'main' ? 'Главный экран' : section === 'lists' ? 'Списки' : 'Заметки'}</div>
              <div className="flex flex-col gap-2">
                {/* Кнопка выбора картинки и очистка */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id={`bg-image-input-${section}`}
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        handlePendingBg(section, ev.target?.result as string);
                        setSectionBackgrounds(bg => {
                          const updated = { ...bg, [section]: ev.target?.result as string };
                          localStorage.setItem('section-backgrounds', JSON.stringify(updated));
                          // Применяем фон к body для главного экрана
                          if (section === 'main') {
                            document.body.style.background = ev.target?.result as string;
                            document.body.style.backgroundSize = 'cover';
                            document.body.style.backgroundPosition = 'center';
                          }
                          return updated;
                        });
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                  />
                  <label htmlFor={`bg-image-input-${section}`}
                    className="px-3 py-1 rounded bg-blue-100 text-blue-800 cursor-pointer btn-rotate border border-blue-300 hover:bg-blue-200">
                    Выбрать картинку
                  </label>
                  <button
                    className="px-3 py-1 rounded bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 btn-rotate"
                    onClick={() => {
                      setSectionBackgrounds(bg => {
                        const updated = { ...bg, [section]: '' };
                        localStorage.setItem('section-backgrounds', JSON.stringify(updated));
                        return updated;
                      });
                      setPendingBg(bg => ({ ...bg, [section]: undefined }));
                      setPendingGradient(gr => ({ ...gr, [section]: undefined }));
                    }}
                  >
                    Очистить
                  </button>
                </div>
                {/* Палитра для градиента */}
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex gap-2 items-center">
                    <span>Верхний цвет:</span>
                    {colorPalette.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${pendingGradient[section]?.color1 === color ? 'border-blue-500 scale-110' : 'border-gray-300'} btn-rotate`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          handlePendingGradient(section, color, pendingGradient[section]?.color2 || defaultGradient.color2);
                          const gradient = `linear-gradient(to bottom, ${color}, ${pendingGradient[section]?.color2 || defaultGradient.color2})`;
                          setSectionBackgrounds(bg => {
                            const updated = { ...bg, [section]: gradient };
                            localStorage.setItem('section-backgrounds', JSON.stringify(updated));
                            if (section === 'main') {
                              document.body.style.background = gradient;
                              document.body.style.backgroundSize = '';
                              document.body.style.backgroundPosition = '';
                            }
                            return updated;
                          });
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span>Нижний цвет:</span>
                    {colorPalette.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${pendingGradient[section]?.color2 === color ? 'border-blue-500 scale-110' : 'border-gray-300'} btn-rotate`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          handlePendingGradient(section, pendingGradient[section]?.color1 || defaultGradient.color1, color);
                          const gradient = `linear-gradient(to bottom, ${pendingGradient[section]?.color1 || defaultGradient.color1}, ${color})`;
                          setSectionBackgrounds(bg => {
                            const updated = { ...bg, [section]: gradient };
                            localStorage.setItem('section-backgrounds', JSON.stringify(updated));
                            return updated;
                          });
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="w-full h-8 rounded mt-2" style={{ background: pendingBg[section] || sectionBackgrounds[section] || `linear-gradient(to bottom, ${defaultGradient.color1}, ${defaultGradient.color2})` }} />
                </div>
                {/* Превью текущего фона */}
                <div className="mt-1 text-xs">
                  {sectionBackgrounds[section] ? (
                    sectionBackgrounds[section].startsWith('data:') ? (
                      <img src={sectionBackgrounds[section]} alt="фон" className="max-h-16 rounded shadow" />
                    ) : (
                      <div className="w-full h-8 rounded" style={{ background: sectionBackgrounds[section] }} />
                    )
                  ) : (
                    <span className="text-gray-400">Фон не выбран</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Управление данными */}
        <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <FileText className="w-5 h-5" />
            Управление данными
          </h2>
          <div className="space-y-4">
            {/* Export format selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Формат экспорта</label>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} btn-rotate`}
                >
                  JSON
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className={`w-full py-3 px-4 text-white rounded-lg flex items-center justify-center gap-2 bg-blue-600 btn-rotate`}
              >
                <Share className="w-5 h-5" />
                Экспорт данных (JSON)
              </button>
              <label className={`w-full py-3 px-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'} btn-rotate`}>
                <Upload className="w-5 h-5" />
                Импорт данных (JSON)
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleClear}
                className={`w-full py-3 px-4 border-2 border-red-500 text-red-500 rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-red-50 btn-rotate`}
              >
                <Database className="w-5 h-5" />
                Очистить все данные
              </button>
            </div>
          </div>
          <div className="text-xs mt-4 space-y-1 text-gray-500">
            <p><strong>JSON:</strong> Полная резервная копия для восстановления</p>
          </div>
        </div>

        {/* Статистика */}
        <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <Database className="w-5 h-5" />
            Статистика
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{stats.totalTasks}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Задач ({stats.completedTasks} выполнено)</div>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}>
              <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{stats.totalNotes}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Заметок</div>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-purple-50'}`}>
              <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>{stats.totalLists}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Списков</div>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-orange-50'}`}>
              <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>{stats.totalListItems}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Пунктов ({stats.completedListItems} выполнено)</div>
            </div>
          </div>
        </div>

        <div className={`rounded-xl shadow-lg p-4 mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-lg font-bold mb-2">Блокировка</div>
          <LockSettings />
        </div>
      </div>
    </div>
  );
}

function isBiometryAvailable() {
  return !!(window.PublicKeyCredential && typeof window.PublicKeyCredential === 'function');
}

function LockSettings() {
  const [hasPin, setHasPin] = useState(false);
  const [message, setMessage] = useState('');
  const [biometryEnabled, setBiometryEnabled] = useState(false);
  const [biometryAvailable, setBiometryAvailable] = useState(false);

  useEffect(() => {
    setHasPin(!!localStorage.getItem(PIN_KEY));
    setBiometryAvailable(isBiometryAvailable());
    setBiometryEnabled(localStorage.getItem('biometry_enabled') === '1');
  }, []);

  const handleSet = () => {
    const pin = prompt('Придумайте PIN (минимум 4 цифры):');
    if (pin && pin.length >= 4 && /^\d+$/.test(pin)) {
      localStorage.setItem(PIN_KEY, pin);
      setHasPin(true);
      setMessage('PIN установлен!');
    } else if (pin) {
      setMessage('PIN должен содержать минимум 4 цифры.');
    }
  };

  const handleChange = () => {
    const oldPin = prompt('Введите текущий PIN:');
    if (oldPin !== localStorage.getItem(PIN_KEY)) {
      setMessage('Неверный текущий PIN.');
      return;
    }
    const newPin = prompt('Введите новый PIN (минимум 4 цифры):');
    if (newPin && newPin.length >= 4 && /^\d+$/.test(newPin)) {
      localStorage.setItem(PIN_KEY, newPin);
      setMessage('PIN изменён!');
    } else if (newPin) {
      setMessage('PIN должен содержать минимум 4 цифры.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Сбросить PIN и отключить блокировку?')) {
      localStorage.removeItem(PIN_KEY);
      localStorage.removeItem('biometry_enabled');
      setHasPin(false);
      setBiometryEnabled(false);
      setMessage('PIN сброшен!');
    }
  };

  const handleBiometryToggle = () => {
    if (!biometryEnabled) {
      // Включаем биометрию
      localStorage.setItem('biometry_enabled', '1');
      setBiometryEnabled(true);
      setMessage('Биометрия включена. Для разблокировки можно использовать отпечаток или PIN.');
    } else {
      // Отключаем биометрию
      localStorage.removeItem('biometry_enabled');
      setBiometryEnabled(false);
      setMessage('Биометрия отключена. Для разблокировки используется только PIN.');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!hasPin && (
        <button className="px-4 py-2 rounded bg-orange-500 text-white" onClick={handleSet}>Включить блокировку</button>
      )}
      {hasPin && (
        <>
          <button className="px-4 py-2 rounded bg-orange-500 text-white" onClick={handleChange}>Сменить PIN</button>
          <button className="px-4 py-2 rounded bg-gray-400 text-white" onClick={handleReset}>Сбросить блокировку</button>
          {biometryAvailable && (
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={biometryEnabled} onChange={handleBiometryToggle} />
              <span>Разрешить разблокировку по отпечатку</span>
            </label>
          )}
          {biometryEnabled && <div className="text-xs text-orange-600">Можно использовать отпечаток или PIN</div>}
        </>
      )}
      {message && <div className="text-sm text-orange-600 mt-1">{message}</div>}
    </div>
  );
}