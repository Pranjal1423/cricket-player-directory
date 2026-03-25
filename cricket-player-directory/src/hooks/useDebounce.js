/**
 * useDebounce.js - Custom React Hook for Debouncing Values
 * 
 * Provides a way to debounce a value updates, typically used for search inputs.
 * 
 * @package CricketPlayerDirectory
 */

import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * @param {any} value - The value to debounce.
 * @param {number} delay - The debounce delay in milliseconds (default 300).
 * @returns {any} The debounced value.
 */
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
