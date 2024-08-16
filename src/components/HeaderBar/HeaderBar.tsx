import React, { useContext } from "react";
import { Layout } from "antd";
import styles from "./HeaderBar.module.scss";
import { AppStateContext } from "../../contexts/appStateContext";

const { Header } = Layout;

const HeaderBar = () => {

  const appState = useContext(AppStateContext);
  const {
    actions: {
      navigation: { navigate },
    },
  } = appState;

  return (
    <Header
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <h1>
        <a href="/" className={styles.titleLink} onClick={(e) => {
          e.preventDefault();
          navigate('/');
        }}>
          TripleAdmin
        </a>
      </h1>
    </Header>
  );
};

export default HeaderBar;
