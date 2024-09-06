import AuthPage from './components/AuthPage/AuthPage';
import './App.css';
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
  const {
    state: { server, auth },
    actions,
  } = appState;

  const { getServer } = useGetServer();

  const [authStatus, setAuthStatus] = useState<'loading' | 'notLogged' | 'logged'>('loading');

  useEffect(() => {
    if (authStatus !== 'loading') {
      return;
    }

    const host = auth.getHost();
    const credentials = auth.getCredentials();

    if (host && credentials) {
      getServer(host, credentials!)
        .then((response) => {
          setAuthStatus('logged');
          actions.server.initialize(host, response);
        })
        .catch(() => setAuthStatus('notLogged'));
      return;
    }

    setAuthStatus('notLogged');
  }, [auth, getServer, authStatus, actions.server]);

  const onLogged = (response: ServerAttributes) => {
    setAuthStatus('logged');
    actions.server.initialize(auth.getHost()!, response);
  };

  return (
    <ConfigProvider theme={theme}>
      <AppStateContext.Provider value={appState}>
        <div className="App">
          {authStatus === 'loading' && <div>Loading...</div>}
          {authStatus === 'logged' && server.attributes && <MainPage />}
          {authStatus === 'notLogged' && <AuthPage onLogged={onLogged} />}
        </div>
      </AppStateContext.Provider>
    </ConfigProvider>
  );
};

export default App;
