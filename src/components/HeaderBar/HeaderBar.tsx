import React from "react";
import { Layout } from "antd";

const { Header } = Layout;

const HeaderBar = () => {
  return (
    <Header
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <h1>TripleAdmin</h1>
    </Header>
  );
};

export default HeaderBar;
