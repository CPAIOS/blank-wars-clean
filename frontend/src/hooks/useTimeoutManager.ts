import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage timeouts and prevent memory leaks
 * Automatically cleans up all timeouts when component unmounts
 */
export function useTimeoutManager() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      callback();
      timeoutsRef.current.delete(timeoutId);
    }, delay);
    
    timeoutsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

  const clearTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    if (timeoutsRef.current.has(timeoutId)) {
      globalThis.clearTimeout(timeoutId);
      timeoutsRef.current.delete(timeoutId);
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(timeoutId => {
      globalThis.clearTimeout(timeoutId);
    });
    timeoutsRef.current.clear();
  }, []);

  // Clean up all timeouts on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return {
    setTimeout: addTimeout,
    clearTimeout,
    clearAllTimeouts
  };
}