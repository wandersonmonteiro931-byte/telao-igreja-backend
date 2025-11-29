import { useEffect, useState } from 'react';

export function useKeyboardShortcuts(handlers: {
  onToggleProjector?: () => void;
  onF9?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onPauseTransmission?: () => void;
  onF1?: () => void;
  onF2?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+T to toggle projector visibility
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handlers.onToggleProjector?.();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        // Ctrl+Shift+P to pause transmission
        e.preventDefault();
        handlers.onPauseTransmission?.();
      } else if (e.key === 'F1') {
        e.preventDefault();
        handlers.onF1?.();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handlers.onF2?.();
      } else if (e.key === 'F9') {
        e.preventDefault();
        handlers.onF9?.();
      } else if (e.key === 'ArrowLeft') {
        handlers.onArrowLeft?.();
      } else if (e.key === 'ArrowRight') {
        handlers.onArrowRight?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}
