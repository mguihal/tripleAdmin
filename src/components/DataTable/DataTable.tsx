import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Input, Pagination, Segmented, Table, TableColumnsType } from 'antd';
import { TableOutlined } from '@ant-design/icons';
import { ReadResponse, Row } from '../../hooks/useQuery';
import { useResizeDetector } from 'react-resize-detector';
import classes from './DataTable.module.scss';
import ResizableTitle from './ResizableTitle';
import { ResizeCallbackData } from 'react-resizable';
import { ColumnType, TableProps } from 'antd/es/table';
import Cell from './Cell';

type TableRow<T extends string> = Row<T> & {
  key: string;
  __id: number;
};

type OnChange<T extends string> = NonNullable<TableProps<TableRow<T>>['onChange']>;
type Filters<T extends string> = Parameters<OnChange<T>>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts<T extends string> = GetSingle<Parameters<OnChange<T>>[2]>;

type Props<T extends string> = {
  queryResult: ReadResponse<T>;
  queryTime: number;
};

const COLUMN_DEFAULT_WIDTH = 400;

const DataTable = <T extends string>({ queryResult, queryTime }: Props<T>) => {
  const { height, ref } = useResizeDetector();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const [dataColumns, setDataColumns] = useState<TableColumnsType<TableRow<T>>>([]);

  const [searchText, setSearchText] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState<TableRow<T>[]>([]);

  const [filteredInfo, setFilteredInfo] = useState<Filters<T>>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts<T>>({});

  const handleResize = useCallback(
    (index: number) =>
      (_: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
        if (size.width > COLUMN_DEFAULT_WIDTH) {
          const newColumns = [...dataColumns];
          newColumns[index] = {
            ...newColumns[index],
            width: size.width,
          };
          setDataColumns(newColumns);
        }
      },
    [dataColumns],
  );

  const mergedColumns = dataColumns.map<TableColumnsType<TableRow<T>>[number]>((col, index) => ({
    ...col,
    onHeaderCell: (column: TableColumnsType<TableRow<T>>[number]) => ({
      resizable: index !== 0,
      width: column.width,
      onResize: handleResize(index) as React.ReactEventHandler,
    }),
  }));

  // Columns update on result
  useEffect(() => {
    setDataColumns([
      {
        key: 'id',
        fixed: 'left',
        dataIndex: '__id',
        width: 60,
        align: 'right',
      },
      ...queryResult.data.head.vars.map(
        (column) =>
          ({
            title: column,
            key: column,
            dataIndex: column,
            render: (data) => <Cell data={data} />,
            width: COLUMN_DEFAULT_WIDTH, //xScroll ? 500 : undefined,

            // Sorting
            sortDirections: ['ascend', 'descend'],
            sorter: (a, b) => {
              if (a[column]!.value === b[column]!.value) return 0;
              else if (a[column]!.value < b[column]!.value) return -1;
              else return 1;
            },
            sortOrder: sortedInfo.columnKey === column ? sortedInfo.order : null,

            // Filtering
            filteredValue: filteredInfo[column] || null,
            onFilter: (value, record) => {
              return record[column]?.value?.toString().toLowerCase().includes(value.toString().toLowerCase());
            },
            filters: [],
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
              <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input.Search
                  allowClear
                  placeholder={`Filter ${column}`}
                  value={selectedKeys[0]}
                  onChange={(e) => {
                    setSelectedKeys(e.target.value?.length > 0 ? [e.target.value] : []);
                  }}
                  onSearch={(v) => {
                    setSelectedKeys(v?.length > 0 ? [v] : []);
                    confirm();
                  }}
                  style={{ display: 'block' }}
                />
              </div>
            ),
          } as ColumnType<TableRow<T>>),
      ),
      {
        key: 'spacer',
      },
    ]);
  }, [filteredInfo, queryResult, sortedInfo.columnKey, sortedInfo.order]);

  const dataSource: TableRow<T>[] = useMemo(() => {
    return queryResult
      ? queryResult.data.results.bindings.map((row, i) => ({
          ...row,
          key: `${i}`,
          __id: i + 1,
        }))
      : [];
  }, [queryResult]);

  useEffect(() => {
    setFilteredDataSource(dataSource);
  }, [dataSource]);

  // Reset on new results
  useEffect(() => {
    setSearchText('');
    setFilteredInfo({});
    setSortedInfo({});
  }, [queryResult]);

  const handleSearch = useCallback(
    (searchValue: string) => {
      setFilteredDataSource(
        dataSource.filter((r) => {
          if (searchValue === '') {
            return true;
          }

          return queryResult.data.head.vars.some((c) => {
            return r[c]?.value.toString().toLowerCase().includes(searchValue.toLowerCase());
          });
        }),
      );
    },
    [dataSource, queryResult.data.head.vars],
  );

  const handleChange: OnChange<T> = (_pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts<T>);
  };

  return (
    <Flex vertical justify="flex-start" style={{ height: '100%' }} ref={ref}>
      <Flex justify="flex-start" align="center" gap={8} style={{ height: 48, paddingLeft: 10, paddingRight: 10 }}>
        <Segmented options={[{ value: 'table', icon: <TableOutlined />, label: 'Table' }]} />
        <div style={{ flex: 1 }} />
        <Input.Search
          allowClear
          placeholder="Search into rows"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleSearch}
          style={{ maxWidth: 500 }}
        />
      </Flex>
      <Table
        bordered
        virtual
        className={classes.table}
        // tableLayout="auto"
        dataSource={filteredDataSource}
        columns={mergedColumns}
        scroll={{
          y: (height || 0) - 55 - 48 - 48,
          // x: 'max-content',
          // x: 1560
        }}
        pagination={{
          hideOnSinglePage: false,
          showSizeChanger: true,
          pageSize: pageSize,
          current: currentPage,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        components={{
          header: {
            cell: ResizableTitle,
          },
        }}
        onChange={handleChange}
      />
      <div style={{ flex: 1 }} />
      <Flex justify="space-between" align="center" style={{ height: 48, paddingLeft: 10, paddingRight: 10 }}>
        <div>{queryTime}ms</div>
        <div>
          {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredDataSource.length)} of{' '}
          {filteredDataSource.length} {`${filteredDataSource.length > 1 ? 'rows' : 'row'}`}
          {filteredDataSource.length < dataSource.length &&
            ` (filtered on ${dataSource.length} ${dataSource.length > 1 ? 'rows' : 'row'})`}
        </div>
        <Pagination
          showSizeChanger
          current={currentPage}
          pageSize={pageSize}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
          total={filteredDataSource.length}
        />
      </Flex>
    </Flex>
  );
};

export default DataTable;
