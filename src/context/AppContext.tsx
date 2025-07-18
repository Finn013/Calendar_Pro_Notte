import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TimeEntry {
  id: string;
  hours: number;
  minutes: number;
  description?: string;
}

interface DayData {
  tasks: Task[];
  timeEntries: TimeEntry[];
  color?: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  createdAt: number;
  updatedAt: number;
}

interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface List {
  id: string;
  title: string;
  items: ListItem[];
  color: string;
  createdAt: number;
  updatedAt: number;
}

interface Settings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  buttonStyle: 'rounded' | 'square' | 'pill' | 'octagon';
  buttonColor: string;
  mainScreenOrder: string[];
  animationType?: 'fade' | 'slide' | 'scale' | 'none' | 'flip' | 'rotate' | 'bounce' | 'blur' | 'combo';
  animationCombo1?: 'fade' | 'slide' | 'scale' | 'none' | 'flip' | 'rotate' | 'bounce' | 'blur';
  animationCombo2?: 'fade' | 'slide' | 'scale' | 'none' | 'flip' | 'rotate' | 'bounce' | 'blur';
  calendarSettings?: {
    todayColor: string;
    animationType: 'fade' | 'slide' | 'scale' | 'none' | 'flip' | 'rotate' | 'bounce' | 'blur' | 'combo';
    dayShape: 'rounded' | 'square' | 'circle' | 'octagon';
    animationCombo1?: 'fade' | 'slide' | 'scale' | 'none' | 'flip' | 'rotate' | 'bounce' | 'blur';
    animationCombo2?: 'fade' | 'slide' | 'scale' | 'none' | 'flip' | 'rotate' | 'bounce' | 'blur';
  };
}

export type AppState = {
  days: { [key: string]: DayData };
  notes: Note[];
  lists: List[];
  settings: Settings;
  selectedDate: Date;
  currentView: 'year' | 'month' | 'week';
  calendarBackgrounds: { year: string; month: string; week: string };
};

type AppAction = 
  | { type: 'SET_DAY_DATA'; payload: { date: string; data: DayData } }
  | { type: 'ADD_TASK'; payload: { date: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { date: string; taskId: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: { date: string; taskId: string } }
  | { type: 'ADD_TIME_ENTRY'; payload: { date: string; entry: TimeEntry } }
  | { type: 'UPDATE_TIME_ENTRY'; payload: { date: string; entryId: string; updates: Partial<TimeEntry> } }
  | { type: 'DELETE_TIME_ENTRY'; payload: { date: string; entryId: string } }
  | { type: 'SET_DAY_COLOR'; payload: { date: string; color: string } }
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
  | { type: 'LOAD_DATA'; payload: AppState }
  | { type: 'UPDATE_CALENDAR_BACKGROUNDS'; payload: { year: string; month: string; week: string } };

export const defaultSettings: Settings = {
  theme: 'light',
  fontSize: 'medium',
  buttonStyle: 'rounded',
  buttonColor: '#3B82F6',
  mainScreenOrder: ['date', 'calendar', 'notes', 'lists'],
  animationType: 'slide',
  animationCombo1: 'fade',
  animationCombo2: 'slide',
  calendarSettings: {
    todayColor: '#EF4444',
    animationType: 'slide',
    dayShape: 'rounded',
    animationCombo1: 'fade',
    animationCombo2: 'slide',
  },
};

const initialState: AppState = {
  days: {},
  notes: [],
  lists: [],
  settings: defaultSettings,
  selectedDate: new Date(),
  currentView: 'month',
  calendarBackgrounds: { year: '', month: '', week: '' }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DAY_DATA':
      return {
        ...state,
        days: {
          ...state.days,
          [action.payload.date]: action.payload.data
        }
      };

    case 'ADD_TASK':
      const currentDayData = state.days[action.payload.date] || { tasks: [], timeEntries: [] };
      return {
        ...state,
        days: {
          ...state.days,
          [action.payload.date]: {
            ...currentDayData,
            tasks: [...currentDayData.tasks, action.payload.task]
          }
        }
      };

    case 'UPDATE_TASK':
      const dayData = state.days[action.payload.date];
      if (!dayData) return state;
      return {
        ...state,
        days: {
          ...state.days,
          [action.payload.date]: {
            ...dayData,
            tasks: dayData.tasks.map(task =>
              task.id === action.payload.taskId
                ? { ...task, ...action.payload.updates }
                : task
            )
          }
        }
      };

    case 'DELETE_TASK':
      const dayDataForDelete = state.days[action.payload.date];
      if (!dayDataForDelete) return state;
      return {
        ...state,
        days: {
          ...state.days,
          [action.payload.date]: {
            ...dayDataForDelete,
            tasks: dayDataForDelete.tasks.filter(task => task.id !== action.payload.taskId)
          }
        }
      };

    case 'ADD_TIME_ENTRY':
      const dayForTime = state.days[action.payload.date] || { tasks: [], timeEntries: [] };
      return {
        ...state,
        days: {
          ...state.days,
          [action.payload.date]: {
            ...dayForTime,
            timeEntries: [...dayForTime.timeEntries, action.payload.entry]
          }
        }
      };

    case 'UPDATE_TIME_ENTRY':
      const dayWithTime = state.days[action.payload.date];
      if (!dayWithTime) return state;
      return {
        ...state,
        days: {
          ...state.days,
          [action.payload.date]: {
            ...dayWithTime,
            timeEntries: dayWithTime.timeEntries.map(entry =>
              entry.id === action.payload.entryId
                ? { ...entry, ...action.payload.updates }
                : entry
            )
          }
        }
      };

    case 'DELETE_TIME_ENTRY':
      const dayWithTimeToDelete = state.days[action.payload.date];
      if (!dayWithTimeToDelete) return state;
      return {
        ...state,
        days: {
          ...state.days,
          [action.payload.date]: {
            ...dayWithTimeToDelete,
            timeEntries: dayWithTimeToDelete.timeEntries.filter(entry => entry.id !== action.payload.entryId)
          }
        }
      };

    case 'SET_DAY_COLOR':
      const dayForColor = state.days[action.payload.date] || { tasks: [], timeEntries: [] };
      return {
        ...state,
        days: {
          ...state.days,
          [action.payload.date]: {
            ...dayForColor,
            color: action.payload.color
          }
        }
      };

    case 'ADD_NOTE':
      return {
        ...state,
        notes: [...state.notes, action.payload]
      };

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
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload)
      };

    case 'ADD_LIST':
      return {
        ...state,
        lists: [...state.lists, action.payload]
      };

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
      return {
        ...state,
        lists: state.lists.filter(list => list.id !== action.payload)
      };

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

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    case 'SET_SELECTED_DATE':
      return {
        ...state,
        selectedDate: action.payload
      };

    case 'SET_CURRENT_VIEW':
      return {
        ...state,
        currentView: action.payload
      };

    case 'LOAD_DATA':
      return action.payload;

    case 'UPDATE_CALENDAR_BACKGROUNDS':
      return { ...state, calendarBackgrounds: { ...action.payload } };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('calendar-app-data');
    const savedSettings = localStorage.getItem('calendar-settings');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        let loadedSettings = defaultSettings;
        if (savedSettings) {
          // Всегда полностью заменяем settings на сохранённые
          loadedSettings = { ...defaultSettings, ...JSON.parse(savedSettings) };
        } else if (parsedData.settings) {
          loadedSettings = { ...defaultSettings, ...parsedData.settings };
        }
        dispatch({
          type: 'LOAD_DATA',
          payload: {
            ...parsedData,
            selectedDate: new Date(parsedData.selectedDate || Date.now()),
            settings: loadedSettings,
            calendarBackgrounds: parsedData.calendarBackgrounds || { year: '', month: '', week: '' }
          }
        });
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    } else if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: parsedSettings
        });
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save all data to localStorage whenever state changes, но только после загрузки
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('calendar-app-data', JSON.stringify(state));
      localStorage.setItem('calendar-settings', JSON.stringify(state.settings));
    }
  }, [state, isLoaded]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}