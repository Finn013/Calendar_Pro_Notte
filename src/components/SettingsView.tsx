import React, { useState } from 'react';
import { ArrowLeft, Download, Upload, Share, FileText, Database, Smartphone, Palette, Type, Square, Circle, Hexagon, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SettingsViewProps {
  onBack: () => void;
}

export default function SettingsView({ onBack }: SettingsViewProps) {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'txt' | 'csv'>('json');

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
      case 'hexagon':
        return `${baseStyle} rounded-lg transform rotate-0 hover:rotate-3`;
      default:
        return `${baseStyle} rounded-lg`;
    }
  };

  const updateSettings = (updates: Partial<typeof settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
  };

  const exportData = async () => {
    let dataToExport: string;
    let filename: string;
    let mimeType: string;

    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;

    switch (exportFormat) {
      case 'json':
        dataToExport = JSON.stringify({
          ...state,
          exportDate: new Date().toISOString(),
          version: '1.0'
        }, null, 2);
        filename = `calendar_backup_${dateStr}.json`;
        mimeType = 'application/json';
        break;

      case 'txt':
        let txtContent = `Экспорт календаря - ${new Date().toLocaleDateString('ru-RU')}\n\n`;
        
        // Calendar data
        txtContent += '=== КАЛЕНДАРЬ ===\n';
        Object.entries(state.days).forEach(([date, dayData]) => {
          if (dayData.tasks.length > 0 || dayData.timeEntries.length > 0) {
            txtContent += `\n${date}:\n`;
            dayData.tasks.forEach(task => {
              txtContent += `  ${task.completed ? '✓' : '○'} ${task.text}\n`;
            });
            if (dayData.timeEntries.length > 0) {
              const totalMinutes = dayData.timeEntries.reduce((sum, entry) => sum + entry.hours * 60 + entry.minutes, 0);
              txtContent += `  Время: ${Math.floor(totalMinutes / 60)}ч ${totalMinutes % 60}м\n`;
            }
          }
        });

        // Notes
        if (state.notes.length > 0) {
          txtContent += '\n\n=== ЗАМЕТКИ ===\n';
          state.notes.forEach(note => {
            txtContent += `\n${note.title}\n${'-'.repeat(note.title.length)}\n${note.content}\n`;
            if (note.tags.length > 0) {
              txtContent += `Теги: ${note.tags.join(', ')}\n`;
            }
          });
        }

        // Lists
        if (state.lists.length > 0) {
          txtContent += '\n\n=== СПИСКИ ===\n';
          state.lists.forEach(list => {
            txtContent += `\n${list.title}:\n`;
            list.items.forEach(item => {
              txtContent += `  ${item.completed ? '✓' : '○'} ${item.text}\n`;
            });
          });
        }

        dataToExport = txtContent;
        filename = `calendar_export_${dateStr}.txt`;
        mimeType = 'text/plain';
        break;

      case 'csv':
        let csvContent = 'Тип,Дата,Название,Содержание,Статус,Теги\n';
        
        // Calendar tasks
        Object.entries(state.days).forEach(([date, dayData]) => {
          dayData.tasks.forEach(task => {
            csvContent += `Задача,"${date}","${task.text.replace(/"/g, '""')}","","${task.completed ? 'Выполнено' : 'Не выполнено'}",""\n`;
          });
        });

        // Notes
        state.notes.forEach(note => {
          const noteDate = new Date(note.createdAt).toLocaleDateString('ru-RU');
          csvContent += `Заметка,"${noteDate}","${note.title.replace(/"/g, '""')}","${note.content.replace(/"/g, '""')}","","${note.tags.join('; ')}"\n`;
        });

        // Lists
        state.lists.forEach(list => {
          const listDate = new Date(list.createdAt).toLocaleDateString('ru-RU');
          list.items.forEach(item => {
            csvContent += `Список,"${listDate}","${list.title.replace(/"/g, '""')}","${item.text.replace(/"/g, '""')}","${item.completed ? 'Выполнено' : 'Не выполнено'}",""\n`;
          });
        });

        dataToExport = csvContent;
        filename = `calendar_export_${dateStr}.csv`;
        mimeType = 'text/csv';
        break;

      default:
        return;
    }

    const blob = new Blob([dataToExport], { type: mimeType });

    // Try to use Web Share API if available
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: mimeType });
        await navigator.share({
          files: [file],
          title: 'Экспорт календаря',
          text: `Экспорт данных календаря в формате ${exportFormat.toUpperCase()}`
        });
        return;
      } catch (err) {
        console.log('Web Share API failed, falling back to download');
      }
    }

    // Fallback to traditional download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Validate the data structure
        if (importedData.days && importedData.notes && importedData.lists && importedData.settings) {
          if (confirm('Импорт заменит все текущие данные. Продолжить?')) {
            dispatch({ type: 'LOAD_DATA', payload: {
              ...importedData,
              selectedDate: new Date(importedData.selectedDate || Date.now())
            }});
            alert('Данные успешно импортированы!');
          }
        } else {
          alert('Неверный формат файла. Поддерживается только JSON формат.');
        }
      } catch (error) {
        alert('Ошибка при чтении файла. Убедитесь, что файл не поврежден.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const clearAllData = () => {
    if (confirm('Удалить ВСЕ данные? Это действие нельзя отменить!')) {
      if (confirm('Вы уверены? Все задачи, заметки и списки будут удалены!')) {
        dispatch({ 
          type: 'LOAD_DATA', 
          payload: {
            days: {},
            notes: [],
            lists: [],
            settings: settings,
            selectedDate: new Date(),
            currentView: 'month'
          }
        });
        alert('Все данные удалены.');
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItem: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetItem) {
      setDraggedItem(null);
      return;
    }

    const newOrder = [...settings.mainScreenOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetItem);

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    updateSettings({ mainScreenOrder: newOrder });
    setDraggedItem(null);
  };

  const sectionNames = {
    date: 'Текущая дата',
    calendar: 'Календарь',
    notes: 'Быстрые заметки',
    lists: 'Списки'
  };

  const buttonColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#6B7280', '#1F2937'
  ];

  const todayColors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  const getDataStats = () => {
    const totalTasks = Object.values(state.days).reduce((sum, day) => sum + day.tasks.length, 0);
    const completedTasks = Object.values(state.days).reduce((sum, day) => 
      sum + day.tasks.filter(task => task.completed).length, 0);
    const totalListItems = state.lists.reduce((sum, list) => sum + list.items.length, 0);
    const completedListItems = state.lists.reduce((sum, list) => 
      sum + list.items.filter(item => item.completed).length, 0);

    return {
      totalTasks,
      completedTasks,
      totalNotes: state.notes.length,
      totalLists: state.lists.length,
      totalListItems,
      completedListItems
    };
  };

  const stats = getDataStats();

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className={`${getButtonStyle()} p-2 sm:p-3 text-white`}
            style={{ backgroundColor: settings.buttonColor }}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <h1 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Настройки
          </h1>

          <div className="w-10 sm:w-12" />
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Appearance Settings */}
          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              <Palette className="w-5 h-5" />
              Внешний вид
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Тема
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSettings({ theme: 'light' })}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${getFontSizeClass()} ${
                      settings.theme === 'light'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : settings.theme === 'dark'
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ☀️ Светлая
                  </button>
                  <button
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${getFontSizeClass()} ${
                      settings.theme === 'dark'
                        ? 'border-blue-500 bg-blue-900 text-blue-200'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    🌙 Темная
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  <Type className="w-4 h-4" />
                  Размер шрифта
                </label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateSettings({ fontSize: size })}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        settings.fontSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : settings.theme === 'dark'
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{ 
                        fontSize: size === 'small' ? '12px' : size === 'large' ? '20px' : '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      {size === 'small' ? 'Маленький' : size === 'large' ? 'Большой' : 'Средний'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  <Square className="w-4 h-4" />
                  Стиль кнопок
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['rounded', 'square', 'pill', 'hexagon'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => updateSettings({ buttonStyle: style })}
                      className={`py-2 px-4 border transition-colors ${getFontSizeClass()} ${
                        settings.buttonStyle === style
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : settings.theme === 'dark'
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      } ${
                        style === 'rounded' ? 'rounded-lg' : 
                        style === 'square' ? 'rounded-none' : 
                        style === 'pill' ? 'rounded-full' :
                        'rounded-lg transform hover:rotate-3'
                      }`}
                    >
                      {style === 'rounded' ? '⬜ Скругленные' : 
                       style === 'square' ? '⬛ Квадратные' : 
                       style === 'pill' ? '⭕ Круглые' :
                       '⬢ Гексагон'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Цвет кнопок
                </label>
                <div className="flex flex-wrap gap-2">
                  {buttonColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateSettings({ buttonColor: color })}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 transition-all ${
                        settings.buttonColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Цвет выделения текущего дня
                </label>
                <div className="flex flex-wrap gap-2">
                  {todayColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateSettings({ todayColor: color })}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 transition-all ${
                        settings.todayColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Screen Order */}
          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              <Smartphone className="w-5 h-5" />
              Порядок разделов
            </h2>

            <div className="space-y-2">
              {settings.mainScreenOrder.map((item, index) => (
                <div
                  key={item}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item)}
                  className={`p-3 rounded-lg border-2 border-dashed cursor-move transition-colors ${getFontSizeClass()} ${
                    draggedItem === item
                      ? 'border-blue-500 bg-blue-50'
                      : settings.theme === 'dark'
                        ? 'border-gray-600 bg-gray-700 text-gray-200 hover:border-gray-500'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{index + 1}. {sectionNames[item as keyof typeof sectionNames]}</span>
                    <span className="text-gray-400">⋮⋮</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              <FileText className="w-5 h-5" />
              Управление данными
            </h2>

            <div className="space-y-4">
              {/* Export format selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Формат экспорта
                </label>
                <div className="flex gap-2">
                  {(['json', 'txt', 'csv'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => setExportFormat(format)}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${getFontSizeClass()} ${
                        exportFormat === format
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : settings.theme === 'dark'
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={exportData}
                  className={`w-full py-3 px-4 text-white rounded-lg flex items-center justify-center gap-2 ${getButtonStyle()}`}
                  style={{ backgroundColor: settings.buttonColor }}
                >
                  <Share className="w-5 h-5" />
                  Экспорт данных ({exportFormat.toUpperCase()})
                </button>

                <label className={`w-full py-3 px-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${getFontSizeClass()} ${
                  settings.theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                }`}>
                  <Upload className="w-5 h-5" />
                  Импорт данных (JSON)
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={clearAllData}
                  className={`w-full py-3 px-4 border-2 border-red-500 text-red-500 rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-red-50 ${getFontSizeClass()} ${
                    settings.theme === 'dark' ? 'hover:bg-red-900/20' : ''
                  }`}
                >
                  <Database className="w-5 h-5" />
                  Очистить все данные
                </button>
              </div>
            </div>

            <div className={`text-xs mt-4 space-y-1 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p><strong>JSON:</strong> Полная резервная копия для восстановления</p>
              <p><strong>TXT:</strong> Читаемый текстовый формат</p>
              <p><strong>CSV:</strong> Для импорта в Excel/Google Sheets</p>
            </div>
          </div>

          {/* Data Statistics */}
          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              <Database className="w-5 h-5" />
              Статистика
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <div className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  {stats.totalTasks}
                </div>
                <div className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Задач ({stats.completedTasks} выполнено)
                </div>
              </div>

              <div className={`p-3 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}>
                <div className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  {stats.totalNotes}
                </div>
                <div className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Заметок
                </div>
              </div>

              <div className={`p-3 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <div className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                  {stats.totalLists}
                </div>
                <div className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Списков
                </div>
              </div>

              <div className={`p-3 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-orange-50'}`}>
                <div className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                  {stats.totalListItems}
                </div>
                <div className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Пунктов ({stats.completedListItems} выполнено)
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              <Info className="w-5 h-5" />
              Информация
            </h2>

            <div className={`space-y-4 text-sm ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <div>
                <h3 className={`font-bold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
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
                <h3 className={`font-bold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Языки программирования:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>TypeScript/JavaScript - Основная логика приложения</li>
                  <li>HTML - Структура веб-страниц</li>
                  <li>CSS - Стилизация интерфейса</li>
                </ul>
              </div>

              <div>
                <h3 className={`font-bold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
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

              <div className={`pt-4 border-t ${settings.theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                <p className={`font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
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