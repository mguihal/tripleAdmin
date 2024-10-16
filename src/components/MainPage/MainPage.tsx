import { Layout } from 'antd';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import HeaderBar from '../HeaderBar/HeaderBar';
import HomePage from '../HomePage/HomePage';
import Sidebar from './Sidebar';
import QueryPage from '../QueryPage/QueryPage';
import { useAppStateContext } from '../../hooks/useAppState';
import TriplesPage from '../TriplesPage/TriplesPage';

const MainPage = () => {
  const {
    state: {
      navigation: { urlObject },
    },
  } = useAppStateContext();

  const isHomePage = !urlObject.dataset;
  const isQueryPage = urlObject.dataset && !urlObject.graph;
  const isTriplesPage = urlObject.dataset && urlObject.graph;

  return (
    <Layout style={{ height: '100vh' }}>
      <HeaderBar />
      <Layout>
        <PanelGroup direction="horizontal" autoSaveId="tripleAdminLayout">
          <Panel defaultSize={15} minSize={10} maxSize={50}>
            <Sidebar />
          </Panel>
          <PanelResizeHandle style={{ borderLeft: '1px dashed #AAA' }} />
          <Panel minSize={10} maxSize={90}>
            {isHomePage && <HomePage />}
            {isQueryPage && <QueryPage dataset={urlObject.dataset || ''} />}
            {isTriplesPage && <TriplesPage dataset={urlObject.dataset || ''} graph={urlObject.graph || ''} />}
          </Panel>
        </PanelGroup>
      </Layout>
    </Layout>
  );
};

export default MainPage;
