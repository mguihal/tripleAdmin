import { useCallback, useState } from 'react';
import { Avatar, Button, ConfigProvider, Empty, Flex, Input, List, Pagination, Tooltip, Typography } from 'antd';
import { EditOutlined, CaretRightOutlined, DeleteOutlined, ReadOutlined, WarningOutlined } from '@ant-design/icons';
import { Parser } from 'sparqljs';
import { useAppStateContext } from '../../hooks/useAppState';
import classes from './QueryHistory.module.scss';

const parser = new Parser();

type Props = {
  dataset: string;
  onEditQuery: (query: string) => void;
  onRerunQuery: (query: string) => void;
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

const QueryHistory = ({ dataset, onEditQuery, onRerunQuery }: Props) => {
  const {
    state: {
      queries: { queryState },
    },
    actions: {
      queries: { deleteQueryHistory },
    },
  } = useAppStateContext();

  const historyWithIndex = (queryState[dataset]?.history || []).map((d, i) => {
    try {
      const parsedQuery = parser.parse(d.query);

      return {
        ...d,
        index: i,
        queryType: parsedQuery.type,
      };
    } catch (e) {
      return {
        ...d,
        index: i,
        queryType: 'error'
      }
    }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [history, setHistory] = useState(historyWithIndex);
  const [searchText, setSearchText] = useState('');

  const handleSearch = useCallback(
    (searchValue: string) => {
      setHistory(
        historyWithIndex.filter((q) => {
          return q.query.toLowerCase().includes(searchValue.toLowerCase());
        }),
      );
    },
    [historyWithIndex],
  );

  return (
    <Flex vertical justify="flex-start" style={{ height: '100%' }}>
      <Flex
        justify="flex-end"
        align="center"
        gap={8}
        style={{ height: 48, paddingLeft: 10, paddingRight: 10, flexShrink: 0 }}
      >
        <Input.Search
          allowClear
          placeholder="Search into previous runned queries"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleSearch}
          style={{ maxWidth: 500 }}
        />
      </Flex>
      <ConfigProvider renderEmpty={() => <Empty description="No queries found" />}>
        <List
          style={{ backgroundColor: 'white', padding: 10, overflow: 'auto', flexGrow: 1 }}
          className={classes.list}
          pagination={{
            position: 'bottom',
            align: 'center',
            pageSize,
            current: currentPage,
            hideOnSinglePage: true,
          }}
          itemLayout="horizontal"
          dataSource={history}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Tooltip title="Reload query in editor">
                  <Button shape="circle" icon={<EditOutlined />} onClick={() => onEditQuery(item.query)} />
                </Tooltip>,
                <Tooltip title="Rerun query">
                  <Button shape="circle" icon={<CaretRightOutlined />} onClick={() => onRerunQuery(item.query)} />
                </Tooltip>,
                <Tooltip title="Delete query from history">
                  <Button
                    shape="circle"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => {
                      deleteQueryHistory(dataset, item.index);
                      setHistory((h) => h.filter((hi) => hi.index !== item.index));
                    }}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  item.queryType === 'query' ? (
                    <Avatar icon={<ReadOutlined />} style={{ backgroundColor: 'rgb(39 156 78)' }} />
                  ) : item.queryType === 'error' ? (
                    <Avatar icon={<WarningOutlined />} style={{ backgroundColor: '#ff4d4f' }} />
                  ) : (
                    <Avatar icon={<EditOutlined />} style={{ backgroundColor: 'rgb(22, 120, 255)' }} />
                  )
                }
                title={
                  <div>
                    {formatDate(item.dateTime)} - {item.queryTime}ms - {item.rowsLength}{' '}
                    {item.rowsLength > 1 ? 'rows' : 'row'}
                  </div>
                }
                description={
                  <Typography.Paragraph
                    style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85em', color: '#777' }}
                    ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                  >
                    {item.query}
                  </Typography.Paragraph>
                }
              />
            </List.Item>
          )}
        />
      </ConfigProvider>
      <Flex
        justify="space-between"
        align="center"
        gap={8}
        style={{ height: 48, paddingLeft: 10, paddingRight: 10, flexShrink: 0 }}
      >
        <div>
          {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, history.length)} of {history.length}{' '}
          {`${history.length > 1 ? 'queries' : 'query'}`}
        </div>
        <Pagination
          showSizeChanger
          current={currentPage}
          pageSize={pageSize}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
          total={history.length}
        />
      </Flex>
    </Flex>
  );
};

export default QueryHistory;
