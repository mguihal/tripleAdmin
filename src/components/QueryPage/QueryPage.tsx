import { useCallback, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Empty, Flex, Result } from 'antd';
import useQuery, { Response } from '../../hooks/useQuery';
import Editor from '../Editor/Editor';
import { useAppStateContext } from '../../hooks/useAppState';
import DataTable from '../DataTable/DataTable';
import QueryHistory from '../QueryHistory/QueryHistory';

type Props = {
  dataset: string;
};

const QueryPage = ({ dataset }: Props) => {
  const {
    state: {
      queries: { activeQueryTime },
    },
    actions: {
      queries: { setActiveQueryTime, pushQueryHistory },
    },
  } = useAppStateContext();

  const { getQuery } = useQuery(dataset);

  const [view, setView] = useState<'results' | 'history'>('results');
  const [pendingQuery, setPendingQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<Response<string>>();
  const [editorQuery, setEditorQuery] = useState<string>();

  const handleRunQuery = useCallback(
    (query: string) => {
      setPendingQuery(true);
      const startTime = Date.now();
      getQuery(query)
        .then((response) => {
          setPendingQuery(false);
          const endTime = Date.now();
          setActiveQueryTime(endTime - startTime);

          const rowsLength = response.type === 'read' ? response.data.results.bindings.length : 1;
          pushQueryHistory(dataset, query, endTime - startTime, rowsLength);

          console.log('RES', response);
          setQueryResult(response);
          setView('results');
        })
        .catch((error) => {
          setPendingQuery(false);
          setQueryResult({ type: 'error' });
          console.log('ERR', error);
        });
    },
    [dataset, getQuery, pushQueryHistory, setActiveQueryTime],
  );

  return (
    <PanelGroup direction="vertical" autoSaveId="tripleAdminLayout2">
      <Panel defaultSize={30} minSize={20} maxSize={80} style={{ paddingBottom: 4 }}>
        <Editor
          dataset={dataset}
          runQuery={handleRunQuery}
          pending={pendingQuery}
          view={view}
          onViewChange={(v) => setView(v)}
          query={editorQuery}
        />
      </Panel>
      <PanelResizeHandle style={{ borderTop: '1px dashed #AAA' }} />
      <Panel minSize={20} maxSize={80}>
        {view === 'results' && !queryResult && (
          <Flex vertical justify="center" style={{ height: '100%' }}>
            <Empty />
          </Flex>
        )}

        {view === 'results' && queryResult?.type === 'read' && (
          <DataTable queryResult={queryResult} queryTime={activeQueryTime} />
        )}

        {view === 'results' && queryResult?.type === 'ask' && (
          <Flex vertical justify="center" style={{ height: '100%' }}>
            <Result
              status={queryResult.data ? 'success' : 'error'}
              title={queryResult.data ? 'Triples has been found' : 'No matching triples have been found'}
            />
          </Flex>
        )}

        {view === 'results' && queryResult?.type === 'update' && (
          <Flex vertical justify="center" style={{ height: '100%' }}>
            <Result status="success" title="Query successfully executed" />
          </Flex>
        )}

        {view === 'results' && queryResult?.type === 'error' && (
          <Flex vertical justify="center" style={{ height: '100%' }}>
            <Result status="error" title="An error occurred during query execution" />
          </Flex>
        )}

        {view === 'history' && (
          <QueryHistory
            dataset={dataset}
            onEditQuery={(query) => {
              setEditorQuery(query);
            }}
            onRerunQuery={(query) => {
              setEditorQuery(query);
              handleRunQuery(query);
            }}
          />
        )}
      </Panel>
    </PanelGroup>
  );
};

export default QueryPage;
