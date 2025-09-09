
import { RepeatingTask } from '../context/AppContext';

/**
 * Вычисляет номер дня в году (от 1 до 366).
 * @param date - Объект Date.
 * @returns номер дня в году.
 */
const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

/**
 * Получает список повторяющихся задач для конкретной даты.
 * @param date - Дата, для которой нужно найти задачи.
 * @param tasks - Массив всех повторяющихся задач.
 * @returns Массив задач, выпадающих на указанную дату.
 */
export const getRepeatingTasksForDate = (date: Date, tasks: RepeatingTask[]): RepeatingTask[] => {
  if (!tasks || tasks.length === 0) {
    return [];
  }

  const dayOfWeek = (date.getDay() + 6) % 7 + 1; // Приводим к формату Пн=1, Вс=7
  const dayOfMonth = date.getDate();
  const dayOfYear = getDayOfYear(date);

  return tasks.filter(task => {
    switch (task.type) {
      case 'weekly':
        return task.value === dayOfWeek;
      case 'monthly':
        return task.value === dayOfMonth;
      case 'yearly':
        // Простое сравнение дня в году
        return task.value === dayOfYear;
      default:
        return false;
    }
  });
};
