import React, { useState } from 'react';
import { Calendar, FileText, List, Settings, Clock } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import CalendarView from './components/CalendarView';
import NotesView from './components/NotesView';
import ListsView from './components/ListsView';
import SettingsView from './components/SettingsView';

function MainApp() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const [currentView, setCurrentView] = useState<'main' | 'calendar' | 'notes' | 'lists' | 'settings'>('main');

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-2xl';
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatDateKey = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date).replace(/\./g, '-');
  };

  const getTodayTasks = () => {
    const today = new Date();
    const todayKey = formatDateKey(today);
    const dayData = state.days[todayKey];
    return dayData ? dayData.tasks : [];
  };

  const getRecentNotes = () => {
    return state.notes
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3);
  };

  const getRecentLists = () => {
    return state.lists
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3);
  };

  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case 'date':
        return (
          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <div className="text-center">
              <div className={`text-2xl sm:text-3xl font-bold mb-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {formatDate(new Date()).split(',')[0]}
              </div>
              <div className={`text-lg sm:text-xl ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {formatDate(new Date()).split(',')[1]}
              </div>
              <div className={`text-sm mt-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock className="w-4 h-4 inline mr-1" />
                {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Календарь
              </h2>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`${getButtonStyle()} px-4 py-2 text-white`}
                style={{ backgroundColor: settings.buttonColor }}
              >
                Открыть
              </button>
            </div>
            
            <div className="space-y-2">
              <h3 className={`font-semibold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Дела на сегодня:
              </h3>
              {getTodayTasks().length === 0 ? (
                <p className={`${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Нет дел на сегодня
                </p>
              ) : (
                <div className="space-y-1">
                  {getTodayTasks().slice(0, 3).map((task) => (
                    <div key={task.id} className={`flex items-center gap-2 ${getFontSizeClass()}`}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        readOnly
                        className="w-4 h-4"
                      />
                      <span className={`${task.completed ? 'line-through text-gray-500' : ''} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {task.text || 'Новая задача'}
                      </span>
                    </div>
                  ))}
                  {getTodayTasks().length > 3 && (
                    <p className={`text-sm ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      И еще {getTodayTasks().length - 3} дел...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Быстрые заметки
              </h2>
              <button
                onClick={() => setCurrentView('notes')}
                className={`${getButtonStyle()} px-4 py-2 text-white`}
                style={{ backgroundColor: settings.buttonColor }}
              >
                Все заметки
              </button>
            </div>
            
            {getRecentNotes().length === 0 ? (
              <p className={`${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Нет заметок
              </p>
            ) : (
              <div className="space-y-3">
                {getRecentNotes().map((note) => (
                  <div key={note.id} className={`p-3 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold mb-1 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {note.title}
                    </h3>
                    <p className={`text-sm ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {note.content.substring(0, 100)}
                      {note.content.length > 100 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'lists':
        return (
          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Списки
              </h2>
              <button
                onClick={() => setCurrentView('lists')}
                className={`${getButtonStyle()} px-4 py-2 text-white`}
                style={{ backgroundColor: settings.buttonColor }}
              >
                Все списки
              </button>
            </div>
            
            {getRecentLists().length === 0 ? (
              <p className={`${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Нет списков
              </p>
            ) : (
              <div className="space-y-3">
                {getRecentLists().map((list) => (
                  <div key={list.id} className={`p-3 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold mb-1 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {list.title}
                    </h3>
                    <p className={`text-sm ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {list.items.length} пунктов
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (currentView === 'calendar') {
    return <CalendarView onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'notes') {
    return <NotesView onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'lists') {
    return <ListsView onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'settings') {
    return <SettingsView onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className={`text-2xl sm:text-3xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Calendar Pro Notte
          </h1>
          <button
            onClick={() => setCurrentView('settings')}
            className={`${getButtonStyle()} p-2 sm:p-3 text-white`}
            style={{ backgroundColor: settings.buttonColor }}
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div>
          {settings.mainScreenOrder.map((sectionType) => (
            <div key={sectionType}>
              {renderSection(sectionType)}
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg ${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-around py-2 sm:py-3">
            <button
              onClick={() => setCurrentView('calendar')}
              className={`flex flex-col items-center p-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span className="text-xs">Календарь</span>
            </button>
            <button
              onClick={() => setCurrentView('notes')}
              className={`flex flex-col items-center p-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
            >
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span className="text-xs">Заметки</span>
            </button>
            <button
              onClick={() => setCurrentView('lists')}
              className={`flex flex-col items-center p-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
            >
              <List className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span className="text-xs">Списки</span>
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`flex flex-col items-center p-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
            >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span className="text-xs">Настройки</span>
            </button>
          </div>
        </div>

        {/* Bottom padding to account for fixed navigation */}
        <div className="h-16 sm:h-20"></div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;