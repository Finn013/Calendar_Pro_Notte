import React, { useState } from 'react';
import { ArrowLeft, Plus, Search, SortAsc, Menu, Copy, QrCode, Palette, Trash2, Tag, Calendar, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NotesViewProps {
  onBack: () => void;
}

export default function NotesView({ onBack }: NotesViewProps) {
  const { state, dispatch } = useApp();
  const { notes, settings } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'color' | 'name' | 'tag'>('time');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNoteMenu, setShowNoteMenu] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: '',
    color: '#3B82F6'
  });

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
      case 'hexagon':
        return `${baseStyle} rounded-lg transform rotate-0 hover:rotate-3`;
      default:
        return `${baseStyle} rounded-lg`;
    }
  };

  const filteredAndSortedNotes = notes
    .filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return b.updatedAt - a.updatedAt;
        case 'color':
          return a.color.localeCompare(b.color);
        case 'name':
          return a.title.localeCompare(b.title);
        case 'tag':
          return (a.tags[0] || '').localeCompare(b.tags[0] || '');
        default:
          return 0;
      }
    });

  const handleAddNote = () => {
    if (newNote.title.trim() || newNote.content.trim()) {
      const note = {
        id: Date.now().toString(),
        title: newNote.title || 'Без названия',
        content: newNote.content,
        tags: newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        color: newNote.color,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      dispatch({ type: 'ADD_NOTE', payload: note });
      setNewNote({ title: '', content: '', tags: '', color: '#3B82F6' });
      setShowAddForm(false);
    }
  };

  const generateQRCode = (text: string) => {
    const qrData = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  };

  const handleNoteAction = (noteId: string, action: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    switch (action) {
      case 'copy':
        const noteText = `${note.title}\n\n${note.content}\n\nТеги: ${note.tags.join(', ')}`;
        navigator.clipboard.writeText(noteText);
        break;
      case 'qr':
        setShowQRModal(noteId);
        break;
      case 'color':
        setShowColorPicker(noteId);
        break;
      case 'delete':
        if (confirm('Удалить эту заметку?')) {
          dispatch({ type: 'DELETE_NOTE', payload: noteId });
        }
        break;
    }
    setShowNoteMenu(null);
  };

  const updateNote = (noteId: string, updates: any) => {
    dispatch({ type: 'UPDATE_NOTE', payload: { id: noteId, updates } });
  };

  const duplicateNote = (note: any) => {
    const newNote = {
      ...note,
      id: Date.now().toString(),
      title: `${note.title} (копия)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    dispatch({ type: 'ADD_NOTE', payload: newNote });
  };

  const setNoteColor = (noteId: string, color: string) => {
    updateNote(noteId, { color });
    setShowColorPicker(null);
  };

  if (showAddForm) {
    return (
      <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-2xl">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={() => setShowAddForm(false)}
              className={`${getButtonStyle()} p-2 sm:p-3 text-white`}
              style={{ backgroundColor: settings.buttonColor }}
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className={`text-xl sm:text-2xl font-bold ${getFontSizeClass()} ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Новая заметка
            </h1>
            <div className="w-10 sm:w-12" />
          </div>

          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Заголовок заметки"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className={`w-full p-3 sm:p-4 border rounded-lg ${getFontSizeClass()} font-medium ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
              />

              <textarea
                placeholder="Содержание заметки"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={10}
                className={`w-full p-3 sm:p-4 border rounded-lg resize-none ${getFontSizeClass()} ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
              />

              <input
                type="text"
                placeholder="Теги (через запятую)"
                value={newNote.tags}
                onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                className={`w-full p-3 sm:p-4 border rounded-lg ${getFontSizeClass()} ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
              />

              <div>
                <label className={`block text-sm font-medium mb-2 ${getFontSizeClass()} ${
                  settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Цвет заметки
                </label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewNote({ ...newNote, color })}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                        newNote.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddNote}
                  className={`flex-1 py-3 px-6 text-white rounded-lg ${getFontSizeClass()}`}
                  style={{ backgroundColor: settings.buttonColor }}
                >
                  Сохранить заметку
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
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl">
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
            Заметки ({filteredAndSortedNotes.length})
          </h1>

          <button
            onClick={() => setShowAddForm(true)}
            className={`${getButtonStyle()} p-2 sm:p-3 text-white`}
            style={{ backgroundColor: settings.buttonColor }}
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Search and Sort */}
        <div className={`bg-white rounded-xl shadow-lg p-4 mb-4 sm:mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : ''}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск заметок..."
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
              <option value="tag">По тегу</option>
            </select>
          </div>

          {/* Quick stats */}
          <div className={`mt-3 text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Всего заметок: {notes.length} | Найдено: {filteredAndSortedNotes.length}
          </div>
        </div>

        {/* Notes Grid */}
        {filteredAndSortedNotes.length === 0 ? (
          <div className={`text-center py-12 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="w-24 h-24 mx-auto mb-4 opacity-50 text-6xl">
              📝
            </div>
            <p className={`text-xl ${getFontSizeClass()}`}>
              {searchTerm ? 'Заметки не найдены' : 'Нет заметок'}
            </p>
            <p className={getFontSizeClass()}>
              {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Создайте свою первую заметку'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSortedNotes.map((note) => (
              <div
                key={note.id}
                className={`rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 ${
                  settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
                style={{ borderLeft: `4px solid ${note.color}` }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <input
                      type="text"
                      value={note.title}
                      onChange={(e) => updateNote(note.id, { title: e.target.value })}
                      className={`font-bold ${getFontSizeClass()} bg-transparent border-none outline-none flex-1 ${
                        settings.theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}
                    />
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowNoteMenu(showNoteMenu === note.id ? null : note.id)}
                        className={`p-1 rounded hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}
                      >
                        <Menu className="w-4 h-4" />
                      </button>

                      {showNoteMenu === note.id && (
                        <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-20 ${
                          settings.theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        } border`}>
                          <button
                            onClick={() => handleNoteAction(note.id, 'color')}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2`}
                          >
                            <Palette className="w-4 h-4" />
                            Изменить цвет
                          </button>
                          <button
                            onClick={() => duplicateNote(note)}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2`}
                          >
                            <Copy className="w-4 h-4" />
                            Дублировать
                          </button>
                          <button
                            onClick={() => handleNoteAction(note.id, 'copy')}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2`}
                          >
                            <Copy className="w-4 h-4" />
                            Копировать текст
                          </button>
                          <button
                            onClick={() => handleNoteAction(note.id, 'qr')}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2`}
                          >
                            <QrCode className="w-4 h-4" />
                            QR-код
                          </button>
                          <button
                            onClick={() => handleNoteAction(note.id, 'delete')}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${settings.theme === 'dark' ? 'hover:bg-gray-600 text-gray-200' : ''} flex items-center gap-2 text-red-500`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Удалить
                          </button>
                        </div>
                      )}

                      {showColorPicker === note.id && (
                        <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-30 p-4 ${
                          settings.theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        } border`}>
                          <div className="grid grid-cols-4 gap-2">
                            {colors.map((color) => (
                              <button
                                key={color}
                                onClick={() => setNoteColor(note.id, color)}
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

                  <textarea
                    value={note.content}
                    onChange={(e) => updateNote(note.id, { content: e.target.value })}
                    className={`w-full bg-transparent border-none outline-none resize-none ${getFontSizeClass()} ${
                      settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}
                    rows={4}
                  />

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {note.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                            settings.theme === 'dark' 
                              ? 'bg-gray-600 text-gray-200' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={`mt-3 text-xs flex items-center justify-between ${
                    settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(note.updatedAt).toLocaleDateString('ru-RU')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg p-6 w-full max-w-md ${
              settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-bold mb-4 ${getFontSizeClass()}`}>QR-код заметки</h3>
              
              {(() => {
                const note = notes.find(n => n.id === showQRModal);
                if (!note) return null;
                
                const noteText = `${note.title}\n\n${note.content}`;
                return (
                  <div className="text-center">
                    <img 
                      src={generateQRCode(noteText)} 
                      alt="QR Code" 
                      className="mx-auto mb-4 border rounded"
                    />
                    <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Отсканируйте QR-код для получения текста заметки
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
                }`}
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