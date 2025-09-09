import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

// --- ИНТЕРФЕЙСЫ ---
interface Task { id: string; text: string; completed: boolean; createdAt: number; }
interface TimeEntry { id: string; hours: number; minutes: number; description?: string; }
interface DayData { tasks: Task[]; timeEntries: TimeEntry[]; color?: string; icon?: string; }
export interface RepeatingTask { id: string; text: string; type: 'weekly' | 'monthly' | 'yearly'; value: number; icon: string; color: string; }
interface Note { id: string; title: string; content: string; tags: string[]; color: string; createdAt: number; updatedAt: number; }
interface ListItem { id: string; text: string; completed: boolean; createdAt: number; }
interface List { id: string; title: string; items: ListItem[]; color: string; createdAt: number; updatedAt: number; }
interface Settings { theme: 'light' | 'dark'; fontSize: 'small' | 'medium' | 'large'; buttonStyle: 'rounded' | 'square' | 'pill' | 'octagon'; buttonColor: string; mainScreenOrder: string[]; animationType?: any; animationCombo1?: any; animationCombo2?: any; calendarSettings?: any; }

// --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
export type AppState = {
  days: { [key: string]: DayData };
  notes: Note[];
  lists: List[];
  settings: Settings;
  selectedDate: Date;
  currentView: 'year' | 'month' | 'week';
  calendarBackgrounds: { year: string; month: string; week: string };
  repeatingTasks: RepeatingTask[];
};

// --- ДЕЙСТВИЯ ---
type AppAction = 
  | { type: 'SET_DAY_DATA'; payload: { date: string; data: DayData } }
  | { type: 'ADD_TASK'; payload: { date: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { date: string; taskId: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: { date: string; taskId: string } }
  | { type: 'ADD_TIME_ENTRY'; payload: { date: string; entry: TimeEntry } }
  | { type: 'UPDATE_TIME_ENTRY'; payload: { date: string; entryId: string; updates: Partial<TimeEntry> } }
  | { type: 'DELETE_TIME_ENTRY'; payload: { date: string; entryId: string } }
  | { type: 'SET_DAY_COLOR'; payload: { date: string; color: string } }
  | { type: 'SET_DAY_ICON'; payload: { date: string; icon: string } }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: { id: string; updates: Partial<Note> } }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: { id: string; updates: Partial<List> } }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'ADD_LIST_ITEM'; payload: { listId: string; item: ListItem } }
  | { type: 'UPDATE_LIST_ITEM'; payload: { listId: string; itemId: string; updates: Partial<ListItem> } }
  | { type: 'DELETE_LIST_ITEM'; payload: { listId: string; itemId: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_SELECTED_DATE'; payload: Date }
  | { type: 'SET_CURRENT_VIEW'; payload: 'year' | 'month' | 'week' }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'UPDATE_CALENDAR_BACKGROUNDS'; payload: { year: string; month: string; week: string } }
  | { type: 'ADD_REPEATING_TASK'; payload: RepeatingTask }
  | { type: 'UPDATE_REPEATING_TASK'; payload: RepeatingTask }
  | { type: 'DELETE_REPEATING_TASK'; payload: string }
  | { type: 'SET_REPEATING_TASKS'; payload: RepeatingTask[] };

// --- НАСТРОЙКИ ПО УМОЛЧАНИЮ ---
export const defaultSettings: Settings = {
  theme: 'light',
  fontSize: 'medium',
  buttonStyle: 'rounded',
  buttonColor: '#3B82F6',
  mainScreenOrder: ['date', 'calendar', 'notes', 'lists'],
  animationType: 'slide',
  calendarSettings: {
    todayColor: '#EF4444',
    animationType: 'slide',
    dayShape: 'rounded',
    autoSortByTime: false,
  },
};

// --- НАЧАЛЬНОЕ СОСТОЯНИЕ ---
const initialState: AppState = {
  days: {},
  notes: [],
  lists: [],
  settings: defaultSettings,
  selectedDate: new Date(),
  currentView: 'month',
  calendarBackgrounds: { year: '', month: '', week: '' },
  repeatingTasks: [],
};

// --- РЕДЬЮСЕР ---
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        ...action.payload,
        settings: {
          ...defaultSettings,
          ...(action.payload.settings || {}),
          calendarSettings: {
            ...defaultSettings.calendarSettings,
            ...(action.payload.settings?.calendarSettings || {}),
          }
        }
      };
    case 'UPDATE_SETTINGS':
        return {
            ...state,
            settings: {
                ...state.settings,
                ...action.payload,
                calendarSettings: {
                    ...state.settings.calendarSettings,
                    ...(action.payload.calendarSettings || {}),
                }
            }
        };
    case 'SET_CURRENT_VIEW':
        return { ...state, currentView: action.payload };

    case 'SET_SELECTED_DATE':
        return { ...state, selectedDate: action.payload };

    // (остальные кейсы без изменений)
    case 'SET_DAY_DATA': return { ...state, days: { ...state.days, [action.payload.date]: action.payload.data } };
    case 'ADD_TASK':
        const day = state.days[action.payload.date] || { tasks: [], timeEntries: [] };
        return { ...state, days: { ...state.days, [action.payload.date]: { ...day, tasks: [...day.tasks, action.payload.task] } } };
    case 'UPDATE_TASK':
        const dayToUpdate = state.days[action.payload.date];
        if (!dayToUpdate) return state;
        return { ...state, days: { ...state.days, [action.payload.date]: { ...dayToUpdate, tasks: dayToUpdate.tasks.map(t => t.id === action.payload.taskId ? {...t, ...action.payload.updates} : t) } } };
    case 'DELETE_TASK':
        const dayToDelete = state.days[action.payload.date];
        if (!dayToDelete) return state;
        return { ...state, days: { ...state.days, [action.payload.date]: { ...dayToDelete, tasks: dayToDelete.tasks.filter(t => t.id !== action.payload.taskId) } } };
    case 'ADD_REPEATING_TASK': return { ...state, repeatingTasks: [...state.repeatingTasks, action.payload] };
    case 'UPDATE_REPEATING_TASK': return { ...state, repeatingTasks: state.repeatingTasks.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_REPEATING_TASK': return { ...state, repeatingTasks: state.repeatingTasks.filter(t => t.id !== action.payload) };
    case 'SET_REPEATING_TASKS': return { ...state, repeatingTasks: action.payload };

    case 'ADD_TIME_ENTRY':
        const dayForTime = state.days[action.payload.date] || { tasks: [], timeEntries: [] };
        return { ...state, days: { ...state.days, [action.payload.date]: { ...dayForTime, timeEntries: [...dayForTime.timeEntries, action.payload.entry] } } };

    case 'UPDATE_TIME_ENTRY':
        const dayWithTime = state.days[action.payload.date];
        if (!dayWithTime) return state;
        return { ...state, days: { ...state.days, [action.payload.date]: { ...dayWithTime, timeEntries: dayWithTime.timeEntries.map(e => e.id === action.payload.entryId ? {...e, ...action.payload.updates} : e) } } };

    case 'DELETE_TIME_ENTRY':
        const dayWithTimeToDelete = state.days[action.payload.date];
        if (!dayWithTimeToDelete) return state;
        return { ...state, days: { ...state.days, [action.payload.date]: { ...dayWithTimeToDelete, timeEntries: dayWithTimeToDelete.timeEntries.filter(e => e.id !== action.payload.entryId) } } };

    case 'SET_DAY_COLOR':
        const dayForColor = state.days[action.payload.date] || { tasks: [], timeEntries: [] };
        return { ...state, days: { ...state.days, [action.payload.date]: { ...dayForColor, color: action.payload.color } } };

    case 'SET_DAY_ICON':
        const dayForIcon = state.days[action.payload.date] || { tasks: [], timeEntries: [] };
        return { ...state, days: { ...state.days, [action.payload.date]: { ...dayForIcon, icon: action.payload.icon } } };

    // --- Заметки ---
    case 'ADD_NOTE':
        return { ...state, notes: [...state.notes, action.payload] };
    
    case 'UPDATE_NOTE':
        return {
            ...state,
            notes: state.notes.map(note => 
                note.id === action.payload.id 
                    ? { ...note, ...action.payload.updates, updatedAt: Date.now() }
                    : note
            )
        };
    
    case 'DELETE_NOTE':
        return { ...state, notes: state.notes.filter(note => note.id !== action.payload) };

    // --- Списки ---
    case 'ADD_LIST':
        return { ...state, lists: [...state.lists, action.payload] };
    
    case 'UPDATE_LIST':
        return {
            ...state,
            lists: state.lists.map(list => 
                list.id === action.payload.id 
                    ? { ...list, ...action.payload.updates, updatedAt: Date.now() }
                    : list
            )
        };
    
    case 'DELETE_LIST':
        return { ...state, lists: state.lists.filter(list => list.id !== action.payload) };
    
    case 'ADD_LIST_ITEM':
        return {
            ...state,
            lists: state.lists.map(list => 
                list.id === action.payload.listId 
                    ? { ...list, items: [...list.items, action.payload.item], updatedAt: Date.now() }
                    : list
            )
        };
    
    case 'UPDATE_LIST_ITEM':
        return {
            ...state,
            lists: state.lists.map(list => 
                list.id === action.payload.listId 
                    ? {
                        ...list,
                        items: list.items.map(item => 
                            item.id === action.payload.itemId 
                                ? { ...item, ...action.payload.updates }
                                : item
                        ),
                        updatedAt: Date.now()
                    }
                    : list
            )
        };
    
    case 'DELETE_LIST_ITEM':
        return {
            ...state,
            lists: state.lists.map(list => 
                list.id === action.payload.listId 
                    ? {
                        ...list,
                        items: list.items.filter(item => item.id !== action.payload.itemId),
                        updatedAt: Date.now()
                    }
                    : list
            )
        };

    // --- Настройки календаря ---
    case 'UPDATE_CALENDAR_BACKGROUNDS':
        return { ...state, calendarBackgrounds: action.payload };

    default:
      return state;
  }
}

// --- КОНТЕКСТ И ПРОВАЙДЕР ---
const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction>; } | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('calendar-app-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.selectedDate) {
          parsedData.selectedDate = new Date(parsedData.selectedDate);
        }
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('calendar-app-data', JSON.stringify(state));
    }
  }, [state, isLoaded]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// --- ХУК ДЛЯ ДОСТУПА ---
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}