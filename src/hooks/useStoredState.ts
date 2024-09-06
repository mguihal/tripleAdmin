import { Dispatch, SetStateAction, useEffect, useState } from "react";

const useStoredState = <T>(key: string, defaultValue: T) => {
  const [storedKey, setStoredKey] = useState(key);
  const [initialValue] = useState<T>(defaultValue);
  const [state, setState] = useState<T>(defaultValue);

  useEffect(() => {
    let newValue: T;

    try {
      newValue = JSON.parse(localStorage.getItem(storedKey) || "");
    } catch (e) {
      newValue = initialValue;
    }

    setState(newValue);
  }, [storedKey, initialValue]);


  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ host: string }>
      setStoredKey(`${key}-${btoa(customEvent.detail.host)}`);
    }

    document.addEventListener('serverInitialized', handler);
    return () => document.removeEventListener('serverInitialized', handler);
  }, [key]);

  useEffect(() => {
    localStorage.setItem(storedKey, JSON.stringify(state));
  }, [storedKey, state]);

  return [state, setState] as [T, Dispatch<SetStateAction<T>>];
};

export default useStoredState;
