/**
 * Touch Gesture Hook
 *
 * Recognizes touch gestures for mobile interactions.
 */

import { useRef, useEffect, useCallback, useState } from 'react';

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeOptions {
  threshold?: number;
  restraint?: number;
  allowedTime?: number;
}

/**
 * Hook for detecting swipe gestures
 */
export function useSwipe(handlers: SwipeHandlers, options: SwipeOptions = {}) {
  const {
    threshold = 50,
    restraint = 100,
    allowedTime = 300,
  } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    touchStart.current = {
      x: touch.screenX,
      y: touch.screenY,
      time: Date.now(),
    };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const distX = touch.screenX - touchStart.current.x;
    const distY = touch.screenY - touchStart.current.y;
    const elapsedTime = Date.now() - touchStart.current.time;

    if (elapsedTime <= allowedTime) {
      if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
        if (distX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
        if (distY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    }

    touchStart.current = null;
  }, [handlers, threshold, restraint, allowedTime]);

  return {
    onTouchStart,
    onTouchEnd,
  };
}

export interface LongPressOptions {
  delay?: number;
  threshold?: number;
}

/**
 * Hook for detecting long press gestures
 */
export function useLongPress(
  onLongPress: () => void,
  options: LongPressOptions = {}
) {
  const { delay = 500, threshold = 10 } = options;
  const [isLongPress, setIsLongPress] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    touchStartRef.current = { x: clientX, y: clientY };

    timeoutRef.current = setTimeout(() => {
      onLongPress();
      setIsLongPress(true);
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLongPress(false);
    touchStartRef.current = null;
  }, []);

  const move = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current || timeoutRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const distX = Math.abs(clientX - touchStartRef.current.x);
    const distY = Math.abs(clientY - touchStartRef.current.y);

    if (distX > threshold || distY > threshold) {
      clear();
    }
  }, [clear, threshold]);

  const handlers = {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseMove: move,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: move,
  };

  return { handlers, isLongPress };
}

export interface PullToRefreshOptions {
  threshold?: number;
  onRefresh: () => void | Promise<void>;
}

export interface PullToRefreshReturn {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

/**
 * Hook for pull-to-refresh gesture
 */
export function usePullToRefresh(options: PullToRefreshOptions): PullToRefreshReturn {
  const { threshold = 80, onRefresh } = options;
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
  }, [isRefreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;

    const touch = e.touches[0];
    const diff = touch.clientY - startY.current;

    // Only allow pull from top
    if (diff > 0 && window.scrollY === 0) {
      e.preventDefault();
      currentY.current = touch.clientY;
      const distance = Math.min(diff * 0.5, threshold * 1.5);
      setPullDistance(distance);
      setIsPulling(distance >= threshold);
    }
  }, [isRefreshing, threshold]);

  const onTouchEnd = useCallback(async () => {
    if (isPulling && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setIsPulling(false);
  }, [isPulling, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}

export default useSwipe;
