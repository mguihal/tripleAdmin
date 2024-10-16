import AuthPage from './components/AuthPage/AuthPage';
import './App.css';
import useGetServer from './hooks/useGetServer';
import { useEffect, useMemo, useState } from 'react';
import MainPage from './components/MainPage/MainPage';
import { ConfigProvider } from 'antd';
import theme from './theme';
import { AppStateContext } from './contexts/appStateContext';
import useAppState from './hooks/useAppState';
import { ServerAttributes } from './state/useServer';

const App = () => {
  const appState = useAppState();
  const {
    state: {
      server,
      auth
    },
    actions,
  } = appState;

  const host = useMemo(() => auth.getHost(), [auth]);
  const credentials = useMemo(() => auth.getCredentials(), [auth]);
  const serverInitialize = useMemo(() => actions.server.initialize, [actions]);

  const { getServer } = useGetServer();

  const [authStatus, setAuthStatus] = useState<'loading' | 'notLogged' | 'logged'>('loading');

  useEffect(() => {
    if (authStatus !== 'loading') {
      return;
    }

    if (host && credentials) {
      getServer(host, credentials!)
        .then((response) => {
          setAuthStatus('logged');
          serverInitialize(host, response);
        })
        .catch(() => setAuthStatus('notLogged'));
      return;
    }

    setAuthStatus('notLogged');
  }, [authStatus, getServer, host, credentials, serverInitialize]);

  const onLogged = (response: ServerAttributes) => {
    setAuthStatus('logged');
    serverInitialize(auth.getHost()!, response);
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
