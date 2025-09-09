import { useRef, useEffect } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // минимальное расстояние для срабатывания свайпа
  velocityThreshold?: number; // минимальная скорость
  timeThreshold?: number; // максимальное время для свайпа
}

export const useSwipeGestures = (
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) => {
  const elementRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const {
    threshold = 50,
    velocityThreshold = 0.3,
    timeThreshold = 300
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const deltaTime = Date.now() - touchStart.current.time;

      // Проверяем, не превышено ли время
      if (deltaTime > timeThreshold) {
        touchStart.current = null;
        return;
      }

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const velocity = Math.max(absDeltaX, absDeltaY) / deltaTime;

      // Проверяем скорость и расстояние
      if (velocity < velocityThreshold) {
        touchStart.current = null;
        return;
      }

      // Определяем направление свайпа
      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
        // Горизонтальный свайп
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
        // Вертикальный свайп
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }

      touchStart.current = null;
    };

    const handleTouchCancel = () => {
      touchStart.current = null;
    };

    // Добавляем обработчики событий
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handlers, threshold, velocityThreshold, timeThreshold]);

  return elementRef;
};