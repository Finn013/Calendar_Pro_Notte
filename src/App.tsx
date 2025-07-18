import { useState, useEffect } from 'react';
import { Calendar, FileText, List, Settings, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import CalendarView from './components/CalendarView';
import NotesView from './components/NotesView';
import ListsView from './components/ListsView';
import SettingsView from './components/SettingsView';
import SettingsView2 from './components/SettingsView2';
import LockScreen from './components/LockScreen';

function MainApp() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const calendarSettings = settings.calendarSettings || { todayColor: '#EF4444', dayShape: 'rounded', animationType: 'slide' };
  const [currentView, setCurrentView] = useState<'main' | 'calendar' | 'notes' | 'lists' | 'settings' | 'settings2'>('main');
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Управление историей браузера для поддержки кнопки "Назад"
  useEffect(() => {
    // При монтировании: если не main, добавляем в историю
    if (currentView !== 'main') {
      window.history.pushState({ view: currentView }, '');
    }
    // Обработчик кнопки "Назад"
    const onPopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        setCurrentView('main');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [currentView]);

  // Проверка наличия PIN при запуске
  useEffect(() => {
    const pin = localStorage.getItem('app_pin');
    if (pin) {
      setIsUnlocked(false);
    } else {
      setIsUnlocked(true);
    }
  }, []);

  // Синхронизация класса 'dark' на body с глобальной темой
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [settings.theme]);

  // --- Новый механизм сохранения main-settings и main-app-data ---
  // Сохраняем настройки панели внизу (тема, размер шрифта, стиль кнопок, порядок разделов, статистика)
  useEffect(() => {
    // Формируем объект main-settings
    const mainSettings = {
      theme: settings.theme,
      fontSize: settings.fontSize,
      buttonStyle: settings.buttonStyle,
      buttonColor: settings.buttonColor,
      mainScreenOrder: settings.mainScreenOrder
      // statistics: settings.statistics || null // убрано, такого поля нет
    };
    localStorage.setItem('main-settings', JSON.stringify(mainSettings));

    // Можно добавить main-app-data, если нужно хранить дополнительные данные панели
    const mainAppData = {
      // Здесь можно добавить любые данные, связанные с панелью внизу
      // Например, lastActivePanel: 'calendar', ...
    };
    localStorage.setItem('main-app-data', JSON.stringify(mainAppData));
  }, [settings]);

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
      case 'octagon':
        return `${baseStyle} octagon-btn`;
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
          <div className={`rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center">
              <div className={`text-2xl sm:text-3xl font-bold mb-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {formatDate(new Date()).split(',')[0].toUpperCase()}
              </div>
              <div className={`text-lg sm:text-xl ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-700' : 'text-gray-600'}`}>
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
          <div className={`rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Календарь
              </h2>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`${getButtonStyle()} px-4 py-2 text-white btn-rotate`}
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
          <div className={`rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Быстрые заметки
              </h2>
              <button
                onClick={() => setCurrentView('notes')}
                className={`${getButtonStyle()} px-4 py-2 text-white btn-rotate`}
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
          <div className={`rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Списки
              </h2>
              <button
                onClick={() => setCurrentView('lists')}
                className={`${getButtonStyle()} px-4 py-2 text-white btn-rotate`}
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

  // Получаем фон главного экрана из localStorage
  const [sectionBackgrounds, setSectionBackgrounds] = useState<{ main: string }>({ main: '' });
  useEffect(() => {
    const bg = localStorage.getItem('section-backgrounds');
    setSectionBackgrounds(bg ? JSON.parse(bg) : { main: '' });
  }, []);

  // Для CalendarView используем отдельную анимацию
  const baseVariants: Record<string, any> = {
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
      animate: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300 } },
      exit: { y: -50, opacity: 0 },
    },
    blur: {
      initial: { opacity: 0, filter: 'blur(8px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(8px)' },
    },
  };
  const getPageVariants = (type: string) => {
    const isCalendar = type === 'calendar';
    const animationType = isCalendar ? (calendarSettings.animationType || 'slide') : (settings.animationType || 'slide');
    if (animationType === 'combo') {
      const combo1 = isCalendar ? calendarSettings.animationCombo1 || 'fade' : settings.animationCombo1 || 'fade';
      const combo2 = isCalendar ? calendarSettings.animationCombo2 || 'slide' : settings.animationCombo2 || 'slide';
      // Объединяем варианты: складываем поля initial, animate, exit
      const merge = (a: any, b: any) => ({ ...a, ...b });
      return {
        initial: merge(baseVariants[combo1].initial, baseVariants[combo2].initial),
        animate: merge(baseVariants[combo1].animate, baseVariants[combo2].animate),
        exit: merge(baseVariants[combo1].exit, baseVariants[combo2].exit),
      };
    }
    return baseVariants[animationType] || baseVariants['slide'];
  };

  if (!isUnlocked) {
    return <LockScreen theme={settings.theme} onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <AnimatePresence mode="wait">
      {currentView === 'calendar' && (
        <motion.div
          key="calendar"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={getPageVariants('calendar')}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ height: '100%' }}
        >
          <CalendarView onBack={() => setCurrentView('main')} />
        </motion.div>
      )}
      {currentView === 'notes' && (
        <motion.div
          key="notes"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={getPageVariants('notes')}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ height: '100%' }}
        >
          <NotesView onBack={() => setCurrentView('main')} />
        </motion.div>
      )}
      {currentView === 'lists' && (
        <motion.div
          key="lists"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={getPageVariants('lists')}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ height: '100%' }}
        >
          <ListsView onBack={() => setCurrentView('main')} />
        </motion.div>
      )}
      {currentView === 'settings2' && (
        <motion.div
          key="settings2"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={getPageVariants('settings')}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ height: '100%' }}
        >
          <SettingsView2 onBack={() => setCurrentView('main')} />
        </motion.div>
      )}
      {currentView === 'main' && (
        <motion.div
          key="main"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={getPageVariants('main')}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ height: '100%' }}
        >
          <div className={`min-h-screen`} style={sectionBackgrounds.main ? (sectionBackgrounds.main.startsWith('data:') ? { backgroundImage: `url(${sectionBackgrounds.main})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: sectionBackgrounds.main }) : {}}>
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h1 className={`text-2xl sm:text-3xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Calendar Pro Notte</h1>
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
              <div className={`fixed bottom-0 left-0 right-0 border-t shadow-lg ${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex justify-around py-2 sm:py-3">
                  <button
                    onClick={() => setCurrentView('calendar')}
                    className={`flex flex-col items-center p-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} btn-rotate`}
                  >
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
                    <span className="text-xs">Календарь</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('notes')}
                    className={`flex flex-col items-center p-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} btn-rotate`}
                  >
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
                    <span className="text-xs">Заметки</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('lists')}
                    className={`flex flex-col items-center p-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} btn-rotate`}
                  >
                    <List className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
                    <span className="text-xs">Списки</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('settings2')}
                    className={`flex flex-col items-center p-2 ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} btn-rotate`}
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
        </motion.div>
      )}
    </AnimatePresence>
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