import { Dispatch, SetStateAction, useEffect, useState } from "react";

const useStoredState = <T>(key: string, defaultValue: T) => {
  let initialValue: T;

  try {
    initialValue = JSON.parse(localStorage.getItem(key) || "");
  } catch (e) {
    initialValue = defaultValue;
  }

  const [state, setState] = useState<T>(initialValue);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as [T, Dispatch<SetStateAction<T>>];
};

export default useStoredState;
