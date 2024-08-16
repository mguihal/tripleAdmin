import { createContext } from 'react';
import { AppState } from '../hooks/useAppState';

export const AppStateContext = createContext<AppState>({} as AppState);
