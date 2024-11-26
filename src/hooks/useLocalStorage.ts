import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window !== "undefined") {
      try {
        const item = window.localStorage.getItem(key);
        console.log(`Loaded ${key} from localStorage:`, item);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error("Error reading local storage", error);
        return initialValue;
      }
    }
    return initialValue;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        console.log(`Saving ${key} to localStorage:`, storedValue);
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error("Error setting local storage", error);
      }
    }
  }, [key, storedValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prevValue) => {
        const valueToStore =
          value instanceof Function ? value(prevValue) : value;
        console.log(`Updating state for ${key}:`, valueToStore);
        return valueToStore;
      });
    } catch (error) {
      console.error("Error in setValue", error);
    }
  };

  return [storedValue, setValue] as const;
}
