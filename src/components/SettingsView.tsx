import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Share, FileText, Database } from 'lucide-react';


interface SettingsViewProps {
  onBack: () => void;
}

export default function SettingsView({ onBack }: SettingsViewProps) {
  // --- Локальное состояние для внешнего вида и порядка разделов ---
  const [localSettings, setLocalSettings] = useState(() => {
    const saved = localStorage.getItem('calendar-settings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      fontSize: 'medium',
      buttonStyle: 'rounded',
      buttonColor: '#3B82F6',
      mainScreenOrder: ['date', 'calendar', 'notes', 'lists'],
    };
  });
  const [sectionBackgrounds, setSectionBackgrounds] = useState<{ main: string; lists: string; notes: string }>(() => {
    const saved = localStorage.getItem('section-backgrounds');
    return saved ? JSON.parse(saved) : { main: '', lists: '', notes: '' };
  });
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

  const getFontSizeClass = () => {
    switch (localSettings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-xl';
      default: return 'text-lg';
    }
  };

  const getButtonStyle = () => {
    const baseStyle = `${getFontSizeClass()} font-medium transition-all duration-200`;
    
    switch (localSettings.buttonStyle) {
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

  // Заменяю updateSettings на работу с локальным состоянием и localStorage
  const updateSettings = (updates: Partial<typeof localSettings>) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);
    localStorage.setItem('calendar-settings', JSON.stringify(newSettings));
  };

  // Удаляю: exportData, importData, clearAllData, dispatch, state, settings, exportFormat, и обращения к days, notes, lists
  // Оставляю только localSettings, updateSettings, drag&drop порядка разделов, и всё, что связано с внешним видом и порядком разделов

  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Для drag&drop порядка разделов:
  const handleDrop = (e: React.DragEvent, targetItem: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetItem) {
      setDraggedItem(null);
      return;
    }

    const newOrder = [...localSettings.mainScreenOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetItem);

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    updateSettings({ mainScreenOrder: newOrder });
    setDraggedItem(null);
  };

  const getDataStats = () => {
    // Удаляю: state, days, notes, lists
    return {
      totalTasks: 0, // Заглушка, пока нет данных
      completedTasks: 0, // Заглушка, пока нет данных
      totalNotes: 0, // Заглушка, пока нет данных
      totalLists: 0, // Заглушка, пока нет данных
      totalListItems: 0, // Заглушка, пока нет данных
      completedListItems: 0 // Заглушка, пока нет данных
    };
  };

  const stats = getDataStats();

  // При монтировании SettingsView обновляем localSettings из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('calendar-settings');
    if (saved) setLocalSettings(JSON.parse(saved));
  }, []);

  // useEffect для применения размера шрифта к body
  useEffect(() => {
    document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    document.body.classList.add(`font-size-${localSettings.fontSize}`);
  }, [localSettings.fontSize]);


  return (
    <div className={`min-h-screen ${localSettings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className={`${getButtonStyle()} p-2 sm:p-3 text-white btn-rotate`}
            style={{ backgroundColor: localSettings.buttonColor }}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <h1 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${localSettings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Настройки
          </h1>

          <div className="w-10 sm:w-12" />
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Appearance Settings */}
          <div className="rounded-xl shadow-lg p-4 sm:p-6 bg-white">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">Внешний вид</h2>
            <div className="space-y-4">
              {/* Тема */}
              <div>
                <label className="block text-sm font-medium mb-2">Тема</label>
                <div className="flex gap-2">
                  <button onClick={() => updateSettings({ theme: 'light' })} className={localSettings.theme === 'light' ? 'bg-blue-200' : ''}>Светлая</button>
                  <button onClick={() => updateSettings({ theme: 'dark' })} className={localSettings.theme === 'dark' ? 'bg-blue-200' : ''}>Тёмная</button>
                </div>
              </div>
              {/* Размер шрифта */}
              <div>
                <label className="block text-sm font-medium mb-2">Размер шрифта</label>
                <div className="flex gap-2">
                  {['small', 'medium', 'large'].map(size => (
                    <button key={size} onClick={() => updateSettings({ fontSize: size })} className={localSettings.fontSize === size ? 'bg-blue-200' : ''}>{size}</button>
                  ))}
                </div>
              </div>
              {/* Стиль кнопок */}
              <div>
                <label className="block text-sm font-medium mb-2">Стиль кнопок</label>
                <div className="flex gap-2">
                  {['rounded', 'square', 'pill', 'octagon'].map(style => (
                    <button key={style} onClick={() => updateSettings({ buttonStyle: style })} className={localSettings.buttonStyle === style ? 'bg-blue-200' : ''}>{style}</button>
                  ))}
                </div>
              </div>
              {/* Цвет кнопок */}
              <div>
                <label className="block text-sm font-medium mb-2">Цвет кнопок</label>
                <div className="flex gap-2">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B'].map(color => (
                    <button key={color} onClick={() => updateSettings({ buttonColor: color })} style={{ backgroundColor: color, width: 32, height: 32, borderRadius: 8, border: localSettings.buttonColor === color ? '2px solid #000' : '1px solid #ccc' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Screen Order */}
          <div className="rounded-xl shadow-lg p-4 sm:p-6 bg-white mt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">Порядок разделов</h2>
            <div className="space-y-2">
              {localSettings.mainScreenOrder.map((item: string, index: number) => (
                <div
                  key={item}
                  draggable
                  onDragStart={e => handleDragStart(e, item)}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, item)}
                  className={`p-3 rounded-lg border-2 border-dashed cursor-move ${draggedItem === item ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                >
                  <span>{index + 1}. {item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${localSettings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${getFontSizeClass()} ${localSettings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              <FileText className="w-5 h-5" />
              Управление данными
            </h2>

            <div className="space-y-4">
              {/* Export format selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${getFontSizeClass()} ${localSettings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Формат экспорта
                </label>
                <div className="flex gap-2">
                  {(['json', 'txt', 'csv'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => {
                        // This functionality was removed, so this button is now a placeholder
                        alert(`Экспорт в формате ${format.toUpperCase()} пока не поддерживается.`);
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${getFontSizeClass()} ${
                        // This functionality was removed, so this button is now a placeholder
                        'border-gray-300 text-gray-700 hover:bg-gray-50'
                      } btn-rotate`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    // This functionality was removed, so this button is now a placeholder
                    alert('Экспорт данных пока не поддерживается.');
                  }}
                  className={`w-full py-3 px-4 text-white rounded-lg flex items-center justify-center gap-2 ${getButtonStyle()} btn-rotate`}
                  style={{ backgroundColor: localSettings.buttonColor }}
                >
                  <Share className="w-5 h-5" />
                  Экспорт данных (JSON)
                </button>

                <label className={`w-full py-3 px-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${getFontSizeClass()} ${
                  localSettings.theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                } btn-rotate`}>
                  <Upload className="w-5 h-5" />
                  Импорт данных (JSON)
                  <input
                    type="file"
                    accept=".json"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          JSON.parse(ev.target?.result as string);
                          // This functionality was removed, so this import is now a placeholder
                          alert('Импорт данных пока не поддерживается.');
                        } catch (error) {
                          alert('Не удалось прочитать файл. Пожалуйста, выберите корректный JSON файл.');
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    // This functionality was removed, so this button is now a placeholder
                    alert('Очистка данных пока не поддерживается.');
                  }}
                  className={`w-full py-3 px-4 border-2 border-red-500 text-red-500 rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-red-50 ${getFontSizeClass()} ${
                    // This functionality was removed, so this button is now a placeholder
                    ''
                  } btn-rotate`}
                >
                  <Database className="w-5 h-5" />
                  Очистить все данные
                </button>
              </div>
            </div>

            <div className={`text-xs mt-4 space-y-1 ${localSettings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p><strong>JSON:</strong> Полная резервная копия для восстановления</p>
              <p><strong>TXT:</strong> Читаемый текстовый формат</p>
              <p><strong>CSV:</strong> Для импорта в Excel/Google Sheets</p>
            </div>
          </div>

          {/* Настройка фона для разделов */}
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

          {/* Кнопка обновления приложения (только для PWA) */}
          {window.matchMedia('(display-mode: standalone)').matches && (
            <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-300 flex flex-col gap-2">
              <button
                className="btn-rotate px-4 py-2 rounded-lg bg-blue-600 text-white font-bold"
                onClick={() => {
                  // This functionality was removed, so this button is now a placeholder
                  alert('Обновление приложения пока не поддерживается.');
                }}
              >
                Обновить приложение
              </button>
              {/* This functionality was removed, so this JSX block is now a placeholder */}
              {/* {showUpdatePrompt && (
                <div className="flex flex-col gap-2 mt-2">
                  <input
                    type="password"
                    placeholder="Введите код обновления"
                    value={updateCode}
                    onChange={e => setUpdateCode(e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                  <button
                    className="btn-rotate px-4 py-2 rounded-lg bg-green-600 text-white font-bold"
                    onClick={handleUpdateApp}
                  >
                    Подтвердить обновление
                  </button>
                  {updateStatus && <div className="text-sm text-red-600">{updateStatus}</div>}
                </div>
              )} */}
            </div>
          )}

          {/* Data Statistics */}
          <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${localSettings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${getFontSizeClass()} ${localSettings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              <Database className="w-5 h-5" />
              Статистика
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${localSettings.theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <div className={`text-2xl font-bold ${localSettings.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  {stats.totalTasks}
                </div>
                <div className={`text-sm ${localSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Задач ({stats.completedTasks} выполнено)
                </div>
              </div>

              <div className={`p-3 rounded-lg ${localSettings.theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}>
                <div className={`text-2xl font-bold ${localSettings.theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  {stats.totalNotes}
                </div>
                <div className={`text-sm ${localSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Заметок
                </div>
              </div>

              <div className={`p-3 rounded-lg ${localSettings.theme === 'dark' ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <div className={`text-2xl font-bold ${localSettings.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                  {stats.totalLists}
                </div>
                <div className={`text-sm ${localSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Списков
                </div>
              </div>

              <div className={`p-3 rounded-lg ${localSettings.theme === 'dark' ? 'bg-gray-700' : 'bg-orange-50'}`}>
                <div className={`text-2xl font-bold ${localSettings.theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                  {stats.totalListItems}
                </div>
                <div className={`text-sm ${localSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Пунктов ({stats.completedListItems} выполнено)
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${localSettings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${getFontSizeClass()} ${localSettings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Информация
            </h2>

            <div className={`space-y-4 text-sm ${getFontSizeClass()} ${localSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <div>
                <h3 className={`font-bold mb-2 ${localSettings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Использованные инструменты:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>React 18 - Библиотека для создания пользовательских интерфейсов</li>
                  <li>TypeScript - Типизированный JavaScript</li>
                  <li>Tailwind CSS - CSS-фреймворк для стилизации</li>
                  <li>Vite - Инструмент сборки и разработки</li>
                  <li>Lucide React - Библиотека иконок</li>
                </ul>
              </div>

              <div>
                <h3 className={`font-bold mb-2 ${localSettings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Языки программирования:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>TypeScript/JavaScript - Основная логика приложения</li>
                  <li>HTML - Структура веб-страниц</li>
                  <li>CSS - Стилизация интерфейса</li>
                </ul>
              </div>

              <div>
                <h3 className={`font-bold mb-2 ${localSettings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Инструкция:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Используйте календарь для планирования задач по дням</li>
                  <li>Добавляйте время выполнения для отслеживания продуктивности</li>
                  <li>Создавайте заметки для важной информации</li>
                  <li>Ведите списки дел и покупок</li>
                  <li>Настраивайте внешний вид под свои предпочтения</li>
                  <li>Экспортируйте данные для резервного копирования</li>
                </ul>
              </div>

              <div className={`pt-4 border-t ${localSettings.theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                <p className={`font-bold ${localSettings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Разработчик: Nott_013
                </p>
                <p className="text-xs mt-1">
                  Версия приложения: 1.0.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}