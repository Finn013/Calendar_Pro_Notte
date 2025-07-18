import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Menu, Copy, QrCode, Trash2, Check, X, Tag, Calendar, CheckSquare, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ListsViewProps {
  onBack: () => void;
}

export default function ListsView({ onBack }: ListsViewProps) {
  const { state, dispatch } = useApp();
  const { lists, settings } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'color' | 'name' | 'progress'>('time');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showListMenu, setShowListMenu] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [newList, setNewList] = useState({
    title: '',
    color: '#3B82F6'
  });

  // Получаем фон списков из localStorage
  const [sectionBackgrounds, setSectionBackgrounds] = useState<{ lists: string }>({ lists: '' });
  useEffect(() => {
    const bg = localStorage.getItem('section-backgrounds');
    setSectionBackgrounds(bg ? JSON.parse(bg) : { lists: '' });
  }, []);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

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

  const getListProgress = (list: any) => {
    if (list.items.length === 0) return 0;
    const completed = list.items.filter((item: any) => item.completed).length;
    return Math.round((completed / list.items.length) * 100);
  };

  const filteredAndSortedLists = lists
    .filter(list => 
      list.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.items.some(item => item.text.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return b.updatedAt - a.updatedAt;
        case 'color':
          return a.color.localeCompare(b.color);
        case 'name':
          return a.title.localeCompare(b.title);
        case 'progress':
          return getListProgress(b) - getListProgress(a);
        default:
          return 0;
      }
    });

  const handleAddList = () => {
    if (newList.title.trim()) {
      const list = {
        id: Date.now().toString(),
        title: newList.title,
        items: [],
        color: newList.color,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      dispatch({ type: 'ADD_LIST', payload: list });
      setNewList({ title: '', color: '#3B82F6' });
      setShowAddForm(false);
    }
  };

  const generateQRCode = (text: string) => {
    const qrData = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  };

  const handleListAction = (listId: string, action: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    switch (action) {
      case 'copy':
        const listText = `${list.title}\n\n${list.items.map(item => `${item.completed ? '✓' : '○'} ${item.text}`).join('\n')}`;
        navigator.clipboard.writeText(listText);
        break;
      case 'qr':
        setShowQRModal(listId);
        break;
      case 'color':
        setShowColorPicker(listId);
        break;
      case 'complete-all':
        list.items.forEach(item => {
          if (!item.completed) {
            updateListItem(listId, item.id, { completed: true });
          }
        });
        break;
      case 'clear-completed':
        const completedItems = list.items.filter(item => item.completed);
        completedItems.forEach(item => {
          deleteListItem(listId, item.id);
        });
        break;
      case 'duplicate':
        const newList = {
          ...list,
          id: Date.now().toString(),
          title: `${list.title} (копия)`,
          items: list.items.map(item => ({
            ...item,
            id: Date.now().toString() + Math.random(),
            completed: false
          })),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        dispatch({ type: 'ADD_LIST', payload: newList });
        break;
      case 'delete':
        if (confirm('Удалить этот список?')) {
          dispatch({ type: 'DELETE_LIST', payload: listId });
        }
        break;
    }
    setShowListMenu(null);
  };

  const updateList = (listId: string, updates: any) => {
    dispatch({ type: 'UPDATE_LIST', payload: { id: listId, updates } });
  };

  const addListItem = (listId: string) => {
    const item = {
      id: Date.now().toString(),
      text: '',
      completed: false,
      createdAt: Date.now()
    };

    dispatch({ type: 'ADD_LIST_ITEM', payload: { listId, item } });
  };

  const updateListItem = (listId: string, itemId: string, updates: any) => {
    dispatch({ type: 'UPDATE_LIST_ITEM', payload: { listId, itemId, updates } });
  };

  const deleteListItem = (listId: string, itemId: string) => {
    dispatch({ type: 'DELETE_LIST_ITEM', payload: { listId, itemId } });
  };

  const setListColor = (listId: string, color: string) => {
    updateList(listId, { color });
    setShowColorPicker(null);
  };

  if (showAddForm) {
    return (
      <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-2xl">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={() => setShowAddForm(false)}
              className={`${getButtonStyle()} p-2 sm:p-3 text-white btn-rotate`}
              style={{ backgroundColor: settings.buttonColor }}
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Новый список
            </h1>
            <div className="w-10 sm:w-12" />
          </div>

          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название списка"
                value={newList.title}
                onChange={(e) => setNewList({ ...newList, title: e.target.value })}
                className={`w-full p-3 sm:p-4 border rounded-lg ${getFontSizeClass()} font-medium ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
              />

              <div>
                <label className={`block text-sm font-medium mb-2 ${getFontSizeClass()} ${
                  settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Цвет списка
                </label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewList({ ...newList, color })}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                        newList.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddList}
                  className={`flex-1 py-3 px-6 text-white rounded-lg ${getFontSizeClass()} btn-rotate`}
                  style={{ backgroundColor: settings.buttonColor }}
                >
                  Создать список
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className={`flex-1 py-3 px-6 border rounded-lg ${getFontSizeClass()} ${
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
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen`} style={sectionBackgrounds.lists ? (sectionBackgrounds.lists.startsWith('data:') ? { backgroundImage: `url(${sectionBackgrounds.lists})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: sectionBackgrounds.lists }) : {}}>
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
            Списки ({filteredAndSortedLists.length})
          </h1>

          <button
            onClick={() => setShowAddForm(true)}
            className={`${getButtonStyle()} p-2 sm:p-3 text-white btn-rotate`}
            style={{ backgroundColor: settings.buttonColor }}
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Search and Sort */}
        <div className={`rounded-xl shadow-lg p-4 mb-4 sm:mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск списков..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg ${getFontSizeClass()} ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-4 py-2 border rounded-lg ${getFontSizeClass()} ${
                settings.theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
              }`}
            >
              <option value="time">По времени</option>
              <option value="color">По цвету</option>
              <option value="name">По названию</option>
              <option value="progress">По прогрессу</option>
            </select>
          </div>

          {/* Quick stats */}
          <div className={`mt-3 text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Всего списков: {lists.length} | Найдено: {filteredAndSortedLists.length}
          </div>
        </div>

        {/* Lists Grid */}
        {filteredAndSortedLists.length === 0 ? (
          <div className={`text-center py-12 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="w-24 h-24 mx-auto mb-4 opacity-50 text-6xl">
              📋
            </div>
            <p className={`text-xl ${getFontSizeClass()}`}>
              {searchTerm ? 'Списки не найдены' : 'Нет списков'}
            </p>
            <p className={getFontSizeClass()}>
              {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Создайте свой первый список'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSortedLists.map((list) => {
              // Sort items: incomplete first, then completed
              const sortedItems = [...list.items].sort((a, b) => {
                if (a.completed === b.completed) return 0;
                return a.completed ? 1 : -1;
              });

              const progress = getListProgress(list);

              return (
                <div
                  key={list.id}
                  className={`rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl ${
                    settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  }`}
                  style={{ borderLeft: `4px solid ${list.color}` }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <input
                        type="text"
                        value={list.title}
                        onChange={(e) => updateList(list.id, { title: e.target.value })}
                        className={`font-bold ${getFontSizeClass()} bg-transparent border-none outline-none flex-1 ${
                          settings.theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                      />
                      
                      <div className="relative">
                        <button
                          onClick={() => setShowListMenu(showListMenu === list.id ? null : list.id)}
                          className={`p-1 rounded hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'} btn-rotate`}
                        >
                          <Menu className="w-4 h-4" />
                        </button>

                        {showListMenu === list.id && (
                          <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-20 ${
                            settings.theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                          } border`}>
                            <button
                              onClick={() => handleListAction(list.id, 'color')}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2 btn-rotate`}
                            >
                              <Palette className="w-4 h-4" />
                              Изменить цвет
                            </button>
                            <button
                              onClick={() => handleListAction(list.id, 'duplicate')}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2 btn-rotate`}
                            >
                              <Copy className="w-4 h-4" />
                              Дублировать
                            </button>
                            <button
                              onClick={() => handleListAction(list.id, 'copy')}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2 btn-rotate`}
                            >
                              <Copy className="w-4 h-4" />
                              Копировать текст
                            </button>
                            <button
                              onClick={() => handleListAction(list.id, 'qr')}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2 btn-rotate`}
                            >
                              <QrCode className="w-4 h-4" />
                              QR-код
                            </button>
                            <button
                              onClick={() => handleListAction(list.id, 'complete-all')}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2 btn-rotate`}
                            >
                              <CheckSquare className="w-4 h-4" />
                              Выполнить все
                            </button>
                            <button
                              onClick={() => handleListAction(list.id, 'clear-completed')}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2 btn-rotate`}
                            >
                              <Check className="w-4 h-4" />
                              Очистить выполненные
                            </button>
                            <button
                              onClick={() => handleListAction(list.id, 'delete')}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2 text-red-500 btn-rotate`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Удалить
                            </button>
                          </div>
                        )}

                        {showColorPicker === list.id && (
                          <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-30 p-4 ${
                            settings.theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                          } border`}>
                            <div className="grid grid-cols-4 gap-2">
                              {colors.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setListColor(list.id, color)}
                                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform btn-rotate"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => setShowColorPicker(null)}
                              className={`w-full mt-3 py-1 px-2 text-sm rounded ${
                                settings.theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'
                              } btn-rotate`}
                            >
                              Отмена
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Прогресс
                        </span>
                        <span className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {progress}%
                        </span>
                      </div>
                      <div className={`w-full bg-gray-200 rounded-full h-2 ${settings.theme === 'dark' ? 'bg-gray-600' : ''}`}>
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: list.color
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                      {sortedItems.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            item.completed
                              ? settings.theme === 'dark'
                                ? 'bg-gray-700 opacity-60'
                                : 'bg-gray-100 opacity-60'
                              : settings.theme === 'dark'
                                ? 'bg-gray-700'
                                : 'bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => updateListItem(list.id, item.id, { completed: e.target.checked })}
                            className="w-4 h-4 rounded btn-rotate"
                          />
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => updateListItem(list.id, item.id, { text: e.target.value })}
                            placeholder="Пункт списка..."
                            className={`flex-1 bg-transparent border-none outline-none ${getFontSizeClass()} ${
                              item.completed ? 'line-through text-gray-500' : ''
                            } ${settings.theme === 'dark' ? 'text-gray-200 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
                          />
                          <button
                            onClick={() => deleteListItem(list.id, item.id)}
                            className="text-red-500 hover:text-red-700 p-1 btn-rotate"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addListItem(list.id)}
                      className={`w-full p-2 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors ${getFontSizeClass()} ${
                        settings.theme === 'dark'
                          ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                          : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                      } btn-rotate`}
                    >
                      <Plus className="w-4 h-4" />
                      Добавить пункт
                    </button>

                    <div className={`mt-3 text-xs flex items-center justify-between ${
                      settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(list.updatedAt).toLocaleDateString('ru-RU')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {list.items.length} пунктов
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg p-6 w-full max-w-md ${
              settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-bold mb-4 ${getFontSizeClass()}`}>QR-код списка</h3>
              
              {(() => {
                const list = lists.find(l => l.id === showQRModal);
                if (!list) return null;
                
                const listText = `${list.title}\n\n${list.items.map(item => `${item.completed ? '✓' : '○'} ${item.text}`).join('\n')}`;
                return (
                  <div className="text-center">
                    <img 
                      src={generateQRCode(listText)} 
                      alt="QR Code" 
                      className="mx-auto mb-4 border rounded"
                    />
                    <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Отсканируйте QR-код для получения списка
                    </p>
                  </div>
                );
              })()}

              <button
                onClick={() => setShowQRModal(null)}
                className={`w-full mt-4 py-2 px-4 border rounded-lg ${getFontSizeClass()} ${
                  settings.theme === 'dark' 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } btn-rotate`}
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}