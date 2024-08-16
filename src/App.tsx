import AuthPage from './components/AuthPage/AuthPage';
import './App.css';
import useStorage from './hooks/useStorage';
import useGetServer from './hooks/useGetServer';
import { useEffect, useState } from 'react';
import MainPage from './components/MainPage/MainPage';
import { ConfigProvider } from 'antd';
import theme from './theme';
import { AppStateContext } from './contexts/appStateContext';
import useAppState from './hooks/useAppState';
import { ServerAttributes } from './state/useServer';

const App = () => {
  const appState = useAppState();
  const { state, actions } = appState;

  const { getServer } = useGetServer();
  const { getAuthData } = useStorage();

  const authData = getAuthData();

  const [authStatus, setAuthStatus] = useState<'loading' | 'notLogged' | 'logged'>('loading');

  useEffect(() => {
    if (authStatus !== 'loading') {
      return;
    }

    if (authData.host && authData.credentials) {
      getServer(authData!.host, authData!.credentials)
        .then((response) => {
          setAuthStatus('logged');
          actions.server.initialize(authData.host!, response);
        })
        .catch(() => setAuthStatus('notLogged'));
      return;
    }

    setAuthStatus('notLogged');
  }, [authData, getServer, authStatus, actions.server]);

  const onLogged = (response: ServerAttributes) => {
    setAuthStatus('logged');
    actions.server.initialize(authData.host!, response);
  };

  return (
    <ConfigProvider theme={theme}>
      <div className="App">
        {authStatus === 'loading' && <div>Loading...</div>}
        {authStatus === 'logged' && state.server.attributes && (
          <AppStateContext.Provider value={appState}>
            <MainPage />
          </AppStateContext.Provider>
        )}
        {authStatus === 'notLogged' && <AuthPage onLogged={onLogged} />}
      </div>
    </ConfigProvider>
  );
};

export default App;
