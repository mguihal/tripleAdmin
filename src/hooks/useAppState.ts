import useServer from '../state/useServer';
import useNavigation from '../state/useNavigation';
import useQueries from '../state/useQueries';
import { useContext } from 'react';
import { AppStateContext } from '../contexts/appStateContext';
import useAuth from '../state/useAuth';

const useAppState = () => {
  const auth = useAuth();
  const server = useServer();
  const navigation = useNavigation();
  const queries = useQueries();

  return {
    state: {
      auth: auth.state,
      server: server.state,
      navigation: navigation.state,
      queries: queries.state,
    },
    actions: {
      auth: auth.actions,
      server: server.actions,
      navigation: navigation.actions,
      queries: queries.actions,
    },
  };
};

export type AppState = ReturnType<typeof useAppState>;

export default useAppState;

export const useAppStateContext = () => {
  const appState = useContext(AppStateContext);
  return appState;
};
