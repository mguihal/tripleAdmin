import React, { useContext } from "react";
import {
  Card,
  Col,
  Layout,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";
import { AppStateContext } from "../../contexts/appStateContext";

const { Content } = Layout;

const formatUptime = (value: number) => {
  const days = Math.floor(value / 3600 / 24);
  const hours = Math.floor((value - days * 3600 * 24) / 3600);
  const minutes = Math.floor((value - days * 3600 * 24 - hours * 3600) / 60);
  const seconds = Math.floor(
    value - days * 3600 * 24 - hours * 3600 - minutes * 60
  );

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const HomePage = () => {
  const appState = useContext(AppStateContext);
  const { state: { server: { host, attributes } } } = appState;

  if (!host || !attributes) {
    return;
  }

  return (
    <Layout style={{ padding: "24px", height: "100%" }}>
      <Content style={{ height: "100%" }}>
        <Row style={{ height: "100%" }}>
          <Col offset={0} span={6}>
            <Card title="Server info" bordered={false}>
              <Space direction="vertical">
                <Space direction="vertical" size={0}>
                  <Typography.Text type="secondary">Host</Typography.Text>
                  <Typography.Link href={host} target="_blank">
                    {host}
                  </Typography.Link>
                </Space>
                <Statistic title="Version" value={attributes.version} />
                <Statistic
                  title="Uptime"
                  value={formatUptime(attributes.uptime)}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default HomePage;
