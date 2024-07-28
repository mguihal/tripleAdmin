import React, { useEffect, useState } from "react";
import {
  Col,
  Divider,
  Layout,
  Row,
  Space,
  Statistic,
  theme,
  Tree,
  TreeDataNode,
} from "antd";
import {
  DatabaseOutlined,
  NodeIndexOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import HeaderBar from "../HeaderBar/HeaderBar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { EventDataNode } from "antd/es/tree";
import useGetGraphs from "../../hooks/useGetGraphs";
import { useServerContext } from "../../contexts/serverContext";

const { Content, Sider } = Layout;

const formatUptime = (value: number) => {
  const days = Math.floor(value / 3600 / 24);
  const hours = Math.floor((value - days * 3600 * 24) / 3600);
  const minutes = Math.floor((value - days * 3600 * 24 - hours * 3600) / 60);
  const seconds = Math.floor(
    value - days * 3600 * 24 - hours * 3600 - minutes * 60
  );

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

type DBNavigatorNode = TreeDataNode & {
  nodeType: "dataset" | "graph";
};

type Props = {
  host: string;
};

const MainPage = ({ host }: Props) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [treeData, setTreeData] = useState<DBNavigatorNode[]>([]);
  const serverAttributes = useServerContext();
  const { getGraphs } = useGetGraphs();

  useEffect(() => {
    setTreeData(
      serverAttributes.datasets.map((dataset) => {
        return {
          title: dataset["ds.name"],
          key: dataset["ds.name"],
          icon: <DatabaseOutlined />,
          selectable: false,
          nodeType: "dataset",
        };
      })
    );
  }, [serverAttributes]);

  const onLoadData = (treeNode: EventDataNode<DBNavigatorNode>) => {
    if (treeNode.nodeType === "dataset") {
      return getGraphs(treeNode.key as string).then((graphs) => {
        setTreeData((oldTreeData) =>
          oldTreeData.map((d) => {
            if (d.key === treeNode.key) {
              const nd = { ...d };
              nd.children = [
                {
                  title: "Default graph",
                  key: `${d.key}-defaultGraph`,
                  icon: <NodeIndexOutlined />,
                  selectable: false,
                  nodeType: 'graph',
                  children: [
                    {
                      title: "Triples",
                      key: `${d.key}-defaultGraph-triples`,
                      icon: <UnorderedListOutlined />,
                      isLeaf: true,
                    },
                  ],
                },
                ...graphs.map((graph) => ({
                  title: graph,
                  key: `${d.key}-${graph}`,
                  icon: <NodeIndexOutlined />,
                  selectable: false,
                  nodeType: 'graph',
                  children: [
                    {
                      title: "Triples",
                      key: `${d.key}-${graph}-triples`,
                      icon: <UnorderedListOutlined />,
                      isLeaf: true,
                    },
                  ],
                })),
              ];
              return nd;
            } else {
              return d;
            }
          })
        );
      });
    }

    return Promise.resolve();
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <HeaderBar />
      <Layout>
        <PanelGroup direction="horizontal" autoSaveId="tripleAdminLayout">
          <Panel defaultSize={15} minSize={10} maxSize={50}>
            <Sider
              width={"100%"}
              style={{ background: colorBgContainer, height: "100%" }}
            >
              <Divider>Server info</Divider>
              <Row>
                <Col offset={1} span={22}>
                  <Space direction="vertical">
                    <Statistic title="Host" value={host} />
                    <Statistic
                      title="Version"
                      value={serverAttributes.version}
                    />
                    <Statistic
                      title="Uptime"
                      value={formatUptime(serverAttributes.uptime)}
                    />
                  </Space>
                </Col>
              </Row>
              <Divider>Datasets</Divider>
              <Tree.DirectoryTree
                showIcon
                treeData={treeData}
                loadData={onLoadData}
              />
            </Sider>
          </Panel>
          <PanelResizeHandle />
          <Panel minSize={10} maxSize={90}>
            <Content>Main Page</Content>
          </Panel>
        </PanelGroup>
      </Layout>
    </Layout>
  );
};

export default MainPage;
