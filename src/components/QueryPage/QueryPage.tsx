import React, { useCallback, useMemo, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Empty, Flex, Table } from 'antd';
import useQuery, { QueryResponse } from '../../hooks/useQuery';
import { useResizeDetector } from 'react-resize-detector';
import Editor from '../Editor/Editor';

type Props = {
  dataset: string;
};

const QueryPage = ({ dataset }: Props) => {
  const { getQuery } = useQuery(dataset);

  const [queryResult, setQueryResult] = useState<QueryResponse>();
  const { height, ref } = useResizeDetector();

  const dataColumns = useMemo(() => {
    return queryResult
      ? [
          {
            key: 'id',
            fixed: 'left',
            dataIndex: '__id',
            width: 60,
          },
          ...queryResult.head.vars.map((column) => ({
            title: column,
            key: column,
            dataIndex: column,
            render: (data) => {
              return (
                <div>
                  [{data?.type}] {data?.value}
                </div>
              );
            },
          })),
        ]
      : [];
  }, [queryResult]);

  const dataSource = useMemo(() => {
    return queryResult
      ? queryResult.results.bindings.map((row, i) => ({
          ...row,
          key: i,
          __id: i + 1,
        }))
      : [];
  }, [queryResult]);

  const handleRunQuery = useCallback(
    (query: string) => {
      getQuery(query)
        .then((result) => {
          console.log('RES', result);
          setQueryResult(result);
        })
        .catch((error) => console.log('ERR', error));
    },
    [getQuery],
  );

  return (
    <PanelGroup direction="vertical" autoSaveId="tripleAdminLayout2">
      <Panel defaultSize={30} minSize={20} maxSize={80} style={{ paddingBottom: 4 }}>
        <Editor dataset={dataset} runQuery={handleRunQuery} />
      </Panel>
      <PanelResizeHandle style={{ borderTop: '1px dashed #AAA' }} />
      <Panel minSize={20} maxSize={80}>
        {!queryResult && (
          <Flex vertical justify="center" style={{ height: '100%' }}>
            <Empty />
          </Flex>
        )}

        {queryResult && (
          <Flex vertical justify="flex-start" style={{ height: '100%' }} ref={ref}>
            <Table
              dataSource={dataSource}
              columns={dataColumns}
              scroll={{ y: (height || 0) - 55 - 64 }}
              pagination={{
                hideOnSinglePage: false,
                showSizeChanger: true,
              }}
            />
          </Flex>
        )}
      </Panel>
    </PanelGroup>
  );
};

export default QueryPage;
