import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash2, CheckSquare, Square } from 'lucide-react';

interface DayDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
}

export default function DayDetailView({ isOpen, onClose, date }: DayDetailViewProps) {
  const { state, dispatch } = useApp();
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const dayData = state.days[dateKey];
  const timeEntries = dayData?.timeEntries || [];
  const tasks = dayData?.tasks || [];

  const [entry, setEntry] = useState({ hours: '', minutes: '', description: '' });
  const [newTaskText, setNewTaskText] = useState('');

  const totalMinutes = useMemo(() => 
    timeEntries.reduce((acc, curr) => acc + (curr.hours * 60) + curr.minutes, 0)
  , [timeEntries]);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const handleAddEntry = () => {
    const hours = parseInt(entry.hours) || 0;
    const minutes = parseInt(entry.minutes) || 0;
    if (hours === 0 && minutes === 0) return;

    dispatch({
      type: 'ADD_TIME_ENTRY',
      payload: {
        date: dateKey,
        entry: {
          id: Date.now().toString(),
          hours,
          minutes,
          description: entry.description
        }
      }
    });
    setEntry({ hours: '', minutes: '', description: '' }); // Reset form
  };

  const handleDeleteEntry = (entryId: string) => {
    dispatch({ type: 'DELETE_TIME_ENTRY', payload: { date: dateKey, entryId } });
  };

  // Функции для работы с задачами
  const handleAddTask = () => {
    const taskText = newTaskText.trim();
    dispatch({
      type: 'ADD_TASK',
      payload: {
        date: dateKey,
        task: {
          id: Date.now().toString(),
          text: taskText || 'Новая задача',
          completed: false,
          createdAt: Date.now()
        }
      }
    });
    setNewTaskText('');
  };

  const handleUpdateTask = (taskId: string, updates: any) => {
    dispatch({ type: 'UPDATE_TASK', payload: { date: dateKey, taskId, updates } });
  };

  const handleDeleteTask = (taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { date: dateKey, taskId } });
  };

  const inputClasses = `w-full p-2 rounded border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md relative"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold">День - {date.toLocaleDateString('ru-RU')}</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20}/></button>
            </div>

            {/* Секция задач */}
            <div className="p-4 space-y-4">
              <h3 className="font-bold text-lg">Задачи</h3>
              
              {/* Список задач */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <button 
                      onClick={() => handleUpdateTask(task.id, { completed: !task.completed })}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                    <input
                      type="text"
                      value={task.text}
                      onChange={(e) => handleUpdateTask(task.id, { text: e.target.value })}
                      className={`flex-1 bg-transparent border-none outline-none ${
                        task.completed ? 'line-through text-gray-500' : ''
                      }`}
                      placeholder="Введите задачу..."
                    />
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-gray-400 text-center py-4">Нет задач</p>
                )}
              </div>
              
              {/* Кнопка добавления задачи */}
              <button 
                onClick={handleAddTask}
                className="w-full p-3 border-2 border-dashed border-blue-300 dark:border-blue-500 text-blue-500 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Добавить задачу
              </button>
              
              {/* Поле для быстрого ввода */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="Быстрое добавление задачи..."
                  className={inputClasses}
                />
                <button 
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
            
            {/* Разделитель */}
            <div className="border-t dark:border-gray-700 mx-4"></div>

            {/* Секция учета времени */}
            <div className="p-4 space-y-4">
              <h3 className="font-bold text-lg">Учет времени</h3>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Часы" value={entry.hours} onChange={e => setEntry({...entry, hours: e.target.value})} className={inputClasses} />
                <input type="number" placeholder="Минуты" value={entry.minutes} onChange={e => setEntry({...entry, minutes: e.target.value})} className={inputClasses} />
              </div>
              <input type="text" placeholder="Описание (необязательно)" value={entry.description} onChange={e => setEntry({...entry, description: e.target.value})} className={inputClasses} />
              <button onClick={handleAddEntry} className="w-full flex items-center justify-center gap-2 p-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600">
                <Plus size={18}/>Добавить запись
              </button>
            </div>

            <div className="p-4 border-t dark:border-gray-700 max-h-60 overflow-y-auto">
              <h4 className="font-semibold mb-2">Записи за день:</h4>
              <ul className="space-y-2 text-sm">
                {timeEntries.map(item => (
                  <li key={item.id} className="flex justify-between items-center p-2 rounded-md bg-gray-100 dark:bg-gray-700/50">
                    <div>
                      <span className="font-semibold">{item.hours} ч {item.minutes} мин</span>
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    </div>
                    <button onClick={() => handleDeleteEntry(item.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                  </li>
                ))}
                {timeEntries.length === 0 && <p className="text-gray-400 text-center py-4">Нет записей</p>}
              </ul>
            </div>

            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
              <p className="text-right font-bold text-lg">Итого за день: {totalHours} ч {remainingMinutes} мин</p>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}