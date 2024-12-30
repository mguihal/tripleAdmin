import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Flex, Form, Input, Modal, Pagination, Popconfirm, Space, TableColumnType, Tooltip } from 'antd';
import { Table } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import useQuery, { ReadResponse, Row } from '../../hooks/useQuery';
import { useResizeDetector } from 'react-resize-detector';
import classes from '../DataTable/DataTable.module.scss';
import ResizableTitle from '../DataTable/ResizableTitle';
import { ResizeCallbackData } from 'react-resizable';
import { ColumnType, TableProps } from 'antd/es/table';
import { useAppStateContext } from '../../hooks/useAppState';
import EditableCell from './EditableCell';
import Cell from '../DataTable/Cell';
import { isCustomDataType, Triple } from './types';

type T = 'subject' | 'predicate' | 'object';

export type TableRow<T extends string> = Row<T> & {
  key: string;
  __id: number;
};

type TableColumn = TableColumnType<TableRow<T>> & {
  editable?: boolean;
};

type OnChange<T extends string> = NonNullable<TableProps<TableRow<T>>['onChange']>;
type Filters<T extends string> = Parameters<OnChange<T>>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts<T extends string> = GetSingle<Parameters<OnChange<T>>[2]>;

type Props<T extends string> = {
  queryResult: ReadResponse<T>;
  queryTime: number;
  totalRows: number | undefined;
  loading: boolean;
  defaultPageSize: number;
  onChange: (pagination: Parameters<OnChange<T>>[0], filters: Filters<T>, sorter: Sorts<T>, searchText: string) => void;
  onAddClick: () => void;
  onDelete: (nbRows: number, success: boolean) => void;
  onEdit: (success: boolean) => void;
  onRefresh: () => void;
};

const COLUMN_DEFAULT_WIDTH = 400;

const isIRI = (triple: Triple) => triple?.object?.startsWith('<') && triple?.object?.endsWith('>');

const TriplesDataTable = ({
  queryResult,
  queryTime,
  totalRows,
  loading,
  defaultPageSize,
  onChange,
  onAddClick,
  onDelete,
  onEdit,
  onRefresh,
}: Props<T>) => {
  const { height, ref } = useResizeDetector();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const [dataColumns, setDataColumns] = useState<TableColumn[]>([]);

  const [searchText, setSearchText] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState<TableRow<T>[]>([]);

  const [filteredInfo, setFilteredInfo] = useState<Filters<T>>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts<T>>({});

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editingRowKey, setEditingRowKey] = useState<React.Key>();

  const [form] = Form.useForm<Triple>();

  const formatEditFormValue = (col: TableRow<T>['subject']) => {
    if (col?.type === 'uri') {
      return `<${col.value}>`;
    } else {
      return `${col?.value}`;
    }
  };

  const {
    state: {
      navigation: { urlObject },
    },
  } = useAppStateContext();
  const { getQuery } = useQuery(urlObject.dataset || '');
  const rendered = useRef<boolean>();

  const handleResize = useCallback(
    (index: number) =>
      (_: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
        if (size.width > COLUMN_DEFAULT_WIDTH || (index === 0 && size.width > 60)) {
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

  const buildDeleteQuery = useCallback(
    (records: TableRow<T>[]) => {
      const formatRow = (record: TableRow<T>) => {
        const subject = record.subject?.type === 'uri' ? `<${record.subject?.value}>` : `"${record.subject?.value}"`;
        const predicate =
          record.predicate?.type === 'uri' ? `<${record.predicate?.value}>` : `"${record.predicate?.value}"`;

        let object = '';
        if (record.object?.type === 'uri') object = `<${record.object?.value}>`;
        else if (record.object?.type === 'literal')
          object = `"${record.object?.value}"${record.object?.datatype ? `^^<${record.object.datatype}>` : ''}`;

        return `${subject} ${predicate} ${object}`;
      };

      const graph = urlObject.graph || '';

      return `DELETE DATA {${graph === 'default' ? '' : `\n  GRAPH <${graph}> {`}
${records.map((record) => `${graph === 'default' ? '  ' : '    '}${formatRow(record)} .`).join('\n')}
${graph === 'default' ? '' : `  }\n`}}`;
    },
    [urlObject.graph],
  );

  const buildEditQuery = useCallback(
    (record: TableRow<T>, fields: Triple) => {
      const formatRow = () => {
        const subject = record.subject?.type === 'uri' ? `<${record.subject?.value}>` : `"${record.subject?.value}"`;
        const predicate =
          record.predicate?.type === 'uri' ? `<${record.predicate?.value}>` : `"${record.predicate?.value}"`;

        let object = '';
        if (record.object?.type === 'uri') object = `<${record.object?.value}>`;
        else if (record.object?.type === 'literal')
          object = `"${record.object?.value}"${record.object?.datatype ? `^^<${record.object.datatype}>` : ''}`;

        return `${subject} ${predicate} ${object}`;
      };

      const graph = urlObject.graph || '';
      const quote = isIRI(fields) ? '' : '"';
      const dataType =
        isIRI(fields) || !fields.datatype
          ? ''
          : `^^<${fields.datatype === 'custom' ? fields.customDatatype : fields.datatype}>`;

      return `${graph === 'default' ? '' : `WITH <${graph}>`}
      DELETE {
        ${formatRow()}
      }
      INSERT {
        ${fields.subject} ${fields.predicate} ${quote}${fields.object}${quote}${dataType}
      }
      WHERE {
        ${formatRow()}
      }
      `;
    },
    [urlObject.graph],
  );

  const handleDeleteRow = useCallback(
    (record: TableRow<T>) => {
      Modal.confirm({
        title: 'Delete this row',
        content: (
          <div>
            Are you sure to execute this query?
            <pre style={{ overflow: 'auto' }}>{buildDeleteQuery([record])}</pre>
          </div>
        ),
        okText: 'Delete',
        okType: 'danger',
        width: 1000,
        onOk: () => {
          getQuery(buildDeleteQuery([record]))
            .then(() => {
              setSelectedRowKeys([]);
              onDelete(1, true);
            })
            .catch(() => {
              onDelete(1, false);
            });
        },
      });
    },
    [buildDeleteQuery, getQuery, onDelete],
  );

  const handleDeleteMultipleRows = useCallback(() => {
    const records = filteredDataSource.filter((_, i) => selectedRowKeys.includes(`${i}`));

    Modal.confirm({
      title: `Delete these ${records.length} rows`,
      content: (
        <div>
          Are you sure to execute this query?
          <pre style={{ overflow: 'auto' }}>{buildDeleteQuery(records)}</pre>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      width: 1000,
      onOk: () => {
        getQuery(buildDeleteQuery(records))
          .then(() => {
            setSelectedRowKeys([]);
            onDelete(records.length, true);
          })
          .catch(() => {
            onDelete(records.length, false);
          });
      },
    });
  }, [buildDeleteQuery, getQuery, onDelete, selectedRowKeys, filteredDataSource]);

  const mergedColumns = dataColumns.map<TableColumn>((col, index) => ({
    ...col,
    onHeaderCell: (column: TableColumn) => ({
      resizable: true,
      width: column.width,
      onResize: handleResize(index) as React.ReactEventHandler,
    }),
    onCell: (record: TableRow<T>) => ({
      record,
      dataIndex: col.dataIndex,
      title: `${col.dataIndex}`,
      editing: col.editable && record.key === editingRowKey,
    }),
  }));

  const dataSource: TableRow<T>[] = useMemo(() => {
    return queryResult
      ? queryResult.data.results.bindings.map((row, i) => ({
          ...row,
          key: `${i}`,
          __id: i + 1 + (currentPage - 1) * pageSize,
        }))
      : [];
  }, [currentPage, pageSize, queryResult]);

  const handleEditRow = useCallback(async () => {
    form
      .validateFields()
      .then((fields) => {
        const record = dataSource.find((r) => r.key === editingRowKey);
        if (!record) return;
        getQuery(buildEditQuery(record, fields))
          .then(() => {
            setEditingRowKey(undefined);
            onEdit(true);
          })
          .catch(() => {
            onEdit(false);
          });
      })
      .catch((err) => {
        console.error('Edit Error', err);
      });
  }, [form, dataSource, getQuery, buildEditQuery, editingRowKey, onEdit]);

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
            width: COLUMN_DEFAULT_WIDTH,

            // Sorting
            sortDirections: ['ascend', 'descend'],
            sorter: true,
            sortOrder: sortedInfo.columnKey === column ? sortedInfo.order : null,

            // Filtering
            filteredValue: filteredInfo[column] || null,
            onFilter: () => true,
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
            editable: true,
          } as ColumnType<TableRow<T>>),
      ),
      {
        key: 'spacer',
      },
      {
        key: 'actions',
        fixed: 'right',
        width: 100,
        align: 'center',
        render: (_, record) => {
          if (editingRowKey === record.key) {
            return (
              <Space size={8}>
                <Popconfirm title="Save row updates" onConfirm={() => handleEditRow()}>
                  <Button shape="circle" icon={<CheckOutlined />} size="small" type="primary" />
                </Popconfirm>
                <Tooltip title="Cancel row updates">
                  <Button
                    shape="circle"
                    icon={<CloseOutlined />}
                    size="small"
                    onClick={() => setEditingRowKey(undefined)}
                  />
                </Tooltip>
              </Space>
            );
          }

          return (
            <Space size={8}>
              <Tooltip title="Edit row">
                <Button
                  shape="circle"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => {
                    setSelectedRowKeys([]);
                    form.setFieldsValue({
                      subject: formatEditFormValue(record.subject),
                      predicate: formatEditFormValue(record.predicate),
                      object: formatEditFormValue(record.object),
                      datatype:
                        record.object?.type === 'literal'
                          ? record.object.datatype && isCustomDataType(record.object.datatype)
                            ? 'custom'
                            : record.object.datatype
                          : undefined,
                      customDatatype:
                        record.object?.type === 'literal' &&
                        record.object.datatype &&
                        isCustomDataType(record.object.datatype)
                          ? record.object.datatype
                          : '',
                    });
                    setEditingRowKey(record.key);
                  }}
                  disabled={editingRowKey !== undefined}
                />
              </Tooltip>
              <Tooltip title="Delete row">
                <Button
                  shape="circle"
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  onClick={() => handleDeleteRow(record)}
                  disabled={editingRowKey !== undefined}
                />
              </Tooltip>
            </Space>
          );
        },
      },
    ]);
  }, [
    filteredInfo,
    handleDeleteRow,
    queryResult,
    sortedInfo.columnKey,
    sortedInfo.order,
    editingRowKey,
    handleEditRow,
    form,
  ]);

  useEffect(() => {
    setFilteredDataSource(dataSource);
  }, [dataSource]);

  useEffect(() => {
    if (rendered.current) {
      setSearchText('');
      setFilteredDataSource([]);
      setFilteredInfo({});
      setSortedInfo({});
      setSelectedRowKeys([]);
      setEditingRowKey(undefined);
    } else {
      rendered.current = true;
    }
  }, [urlObject]);

  const handleSearch = useCallback(
    (searchValue: string) => {
      setCurrentPage(1);
      setSelectedRowKeys([]);
      onChange({ current: 1, pageSize }, filteredInfo, sortedInfo, searchValue.toLowerCase());
    },
    [filteredInfo, onChange, pageSize, sortedInfo],
  );

  const handleChange: OnChange<T> = (_pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts<T>);
    setCurrentPage(1);
    setSelectedRowKeys([]);
    onChange({ current: 1, pageSize }, filters, sorter as Sorts<T>, searchText.toLowerCase());
  };

  return (
    <Flex vertical justify="flex-start" style={{ height: '100%' }} ref={ref}>
      <Flex justify="flex-start" align="center" gap={8} style={{ height: 48, paddingLeft: 10, paddingRight: 10 }}>
        {selectedRowKeys.length > 0 && (
          <Button icon={<DeleteOutlined />} onClick={() => handleDeleteMultipleRows()} danger>
            Delete {selectedRowKeys.length} selected triples
          </Button>
        )}
        <Button icon={<PlusOutlined />} onClick={() => onAddClick()}>
          Add new triples
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => onRefresh()}>
          Refresh
        </Button>
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
      <Form form={form} component={false}>
        <Table
          bordered
          virtual
          loading={loading}
          className={classes.table}
          // tableLayout="auto"
          dataSource={filteredDataSource}
          columns={mergedColumns}
          scroll={{
            y: (height || 0) - 55 - 48 - 48,
            // x: 'max-content',
            // x: 5000
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
            body: {
              cell: EditableCell,
            },
          }}
          onChange={handleChange}
          rowSelection={{
            type: 'checkbox',
            fixed: true,
            columnWidth: 40,
            preserveSelectedRowKeys: false,
            onChange: (newSelectedRowKeys: React.Key[]) => {
              setSelectedRowKeys(newSelectedRowKeys);
            },
            selectedRowKeys,
            getCheckboxProps: () => ({
              disabled: editingRowKey !== undefined,
            }),
          }}
        />
      </Form>
      <div style={{ flex: 1 }} />
      <Flex justify="space-between" align="center" style={{ height: 48, paddingLeft: 10, paddingRight: 10 }}>
        <div>{queryTime}ms</div>
        <div>
          {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRows || 0)} of{' '}
          {totalRows ?? 'a unknown number of'} {`${totalRows !== 1 ? 'rows' : 'row'}`}
        </div>
        <Pagination
          showSizeChanger
          current={currentPage}
          pageSize={pageSize}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
            setSelectedRowKeys([]);
            onChange({ current: page, pageSize: size }, filteredInfo, sortedInfo, searchText);
          }}
          total={totalRows}
        />
      </Flex>
    </Flex>
  );
};

export default TriplesDataTable;
