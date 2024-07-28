import AuthPage from "./components/AuthPage/AuthPage";
import "./App.css";
import useStorage from "./hooks/useStorage";
import useGetServer, { ServerAttributes } from "./hooks/useGetServer";
import { useEffect, useState } from "react";
import MainPage from "./components/MainPage/MainPage";
import { ConfigProvider } from "antd";
import theme from "./theme";
import { ServerContext } from "./contexts/serverContext";

const App = () => {
  const { getServer } = useGetServer();
  const { getAuthData } = useStorage();

  const authData = getAuthData();

  const [authStatus, setAuthStatus] = useState<
    "loading" | "notLogged" | "logged"
  >("loading");
  const [serverAttributes, setServerAttributes] = useState<ServerAttributes>();

  useEffect(() => {
    if (authStatus !== "loading") {
      return;
    }

    if (authData.host && authData.credentials) {
      getServer(authData!.host, authData!.credentials)
        .then((response) => {
          setAuthStatus("logged");
          setServerAttributes(response);
        })
        .catch(() => setAuthStatus("notLogged"));
      return;
    }

    setAuthStatus("notLogged");
  }, [authData, getServer, authStatus]);

  const onLogged = (response: ServerAttributes) => {
    setAuthStatus("logged");
    setServerAttributes(response);
  };

  return (
    <ConfigProvider theme={theme}>
      <div className="App">
        {authStatus === "loading" && <div>Loading...</div>}
        {authStatus === "logged" && serverAttributes && (
          <ServerContext.Provider value={serverAttributes}>
            <MainPage host={authData.host!} />
          </ServerContext.Provider>
        )}
        {authStatus === "notLogged" && <AuthPage onLogged={onLogged} />}
      </div>
    </ConfigProvider>
  );
};

export default App;
