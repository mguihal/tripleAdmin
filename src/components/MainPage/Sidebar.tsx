import { useCallback, useEffect, useState, Key } from 'react';
import { Divider, Layout, theme, Tree, TreeDataNode } from 'antd';
import {
  DatabaseOutlined,
  NodeIndexOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  SnippetsOutlined,
} from '@ant-design/icons';
import { EventDataNode } from 'antd/es/tree';
import useGetGraphs from '../../hooks/useGetGraphs';
import { useAppStateContext } from '../../hooks/useAppState';

const { Sider } = Layout;

type DBNavigatorNode = TreeDataNode & {
  nodeType: 'dataset' | 'graph' | 'triples' | 'sparql' | 'ontologies';
  url?: string;
};

const Sidebar = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [treeData, setTreeData] = useState<DBNavigatorNode[]>();
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);

  const {
    state: {
      server: { attributes },
      navigation: { urlObject },
    },
    actions: {
      navigation: { navigate },
    },
  } = useAppStateContext();

  const { getGraphs } = useGetGraphs();

  // Tree initialization
  useEffect(() => {
    setTreeData(
      attributes?.datasets.map((dataset) => {
        const name = dataset['ds.name'].startsWith('/') ? dataset['ds.name'].slice(1) : dataset['ds.name'];

        return {
          title: name,
          key: name,
          icon: <DatabaseOutlined />,
          selectable: false,
          nodeType: 'dataset' as const,
        };
      }) || [],
    );
  }, [attributes]);

  // Route validation & Tree selection
  useEffect(() => {
    if (!treeData) return;

    const dataset = treeData.find((n) => n.key === urlObject.dataset);
    const graph = dataset?.children?.find((n) => n.key === `${urlObject.dataset}-${urlObject.graph}`);

    if (urlObject.dataset && !dataset) {
      navigate('/');
      return;
    }

    if (urlObject.graph && dataset?.children && !graph) {
      navigate(`/${urlObject.dataset}`);
      return;
    }

    if (!urlObject.dataset) {
      setSelectedKeys([]);
    } else if (urlObject.dataset && !urlObject.graph) {
      setExpandedKeys((e) => [...new Set([...e, `${urlObject.dataset}`])]);
      setSelectedKeys([`${urlObject.dataset}-sparql`]);
    } else if (urlObject.dataset && urlObject.graph) {
      setExpandedKeys((e) => [...new Set([...e, `${urlObject.dataset}`, `${urlObject.dataset}-${urlObject.graph}`])]);
      setSelectedKeys([`${urlObject.dataset}-${urlObject.graph}-triples`]);
    }
  }, [treeData, urlObject, navigate]);

  const getGraphNode = (datasetKey: string, graphName: string) => {
    return {
      title: graphName === 'default' ? 'Default graph' : graphName,
      key: `${datasetKey}-${graphName}`,
      icon: <NodeIndexOutlined />,
      selectable: false,
      nodeType: 'graph',
      children: [
        {
          title: 'Triples',
          key: `${datasetKey}-${graphName}-triples`,
          icon: <UnorderedListOutlined />,
          isLeaf: true,
          selectable: true,
          nodeType: 'triples',
          url: `${encodeURIComponent(datasetKey)}/${encodeURIComponent(graphName)}`,
        },
        {
          title: 'Ontologies',
          key: `${datasetKey}-${graphName}-ontologies`,
          icon: <SnippetsOutlined />,
          isLeaf: true,
          selectable: true,
          nodeType: 'ontologies',
          url: `${encodeURIComponent(datasetKey)}/${encodeURIComponent(graphName)}`,
        },
      ],
    };
  };

  // Tree async fetching on expand
  const onLoadData = useCallback(
    (treeNode: EventDataNode<DBNavigatorNode>) => {
      if (treeNode.nodeType === 'dataset') {
        return getGraphs(`/${treeNode.key}`).then((graphs) => {
          setTreeData((oldTreeData) =>
            oldTreeData?.map((d) => {
              if (d.key === treeNode.key) {
                const nd = { ...d };
                nd.children = [
                  {
                    title: 'SPARQL Request',
                    key: `${d.key}-sparql`,
                    icon: <CodeOutlined />,
                    isLeaf: true,
                    selectable: true,
                    nodeType: 'sparql',
                    url: `${encodeURIComponent(`${d.key}`)}`,
                  },
                  getGraphNode(`${d.key}`, 'default'),
                  ...graphs.map((graph) => getGraphNode(`${d.key}`, graph)),
                ] as DBNavigatorNode[];
                return nd;
              } else {
                return d;
              }
            }),
          );
        });
      }

      return Promise.resolve();
    },
    [getGraphs],
  );

  const onExpand = useCallback((_keys: Key[], { node, expanded }: { node: DBNavigatorNode; expanded: boolean }) => {
    if (expanded) {
      setExpandedKeys((e) => [...new Set([...e, node.key])]);
    } else {
      setExpandedKeys((e) => e.filter((i) => i !== node.key));
    }
  }, []);

  const onClick = useCallback(
    (_event: React.MouseEvent, node: DBNavigatorNode) => {
      if (node.isLeaf && node.selectable) {
        setSelectedKeys([node.key]);
        navigate(`/${node.url}`);
      } else {
        if (expandedKeys.includes(node.key)) {
          setExpandedKeys((e) => e.filter((i) => i !== node.key));
        } else {
          setExpandedKeys((e) => [...new Set([...e, node.key])]);
        }
      }
    },
    [expandedKeys, navigate],
  );

  return (
    <Sider width={'100%'} style={{ background: colorBgContainer, height: '100%' }}>
      <Divider>Datasets</Divider>
      <Tree.DirectoryTree
        showIcon
        treeData={treeData}
        loadData={onLoadData}
        expandedKeys={expandedKeys}
        selectedKeys={selectedKeys}
        onClick={onClick}
        onExpand={onExpand}
      />
    </Sider>
  );
};

export default Sidebar;
