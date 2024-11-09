import { useCallback, useEffect, useRef, useState } from 'react';
import useQuery, { Response } from '../../hooks/useQuery';
import { Flex, message, Result } from 'antd';
import TriplesDataTable, { TableRow } from './TriplesDataTable';
import { FilterValue, SorterResult, SortOrder, TablePaginationConfig } from 'antd/es/table/interface';
import AddTriplesModal from './AddTriplesModal';
import { useAppStateContext } from '../../hooks/useAppState';

type PaginationFilterState = {
  pagination: TablePaginationConfig;
  filters: Record<string, FilterValue | null>;
  sorter: SorterResult<TableRow<'subject' | 'predicate' | 'object'>>;
  searchText: string;
};

const DEFAULT_PAGESIZE = 50;

const TriplesPage = () => {
  const {
    state: {
      navigation: { urlObject },
    },
  } = useAppStateContext();
  const { getQuery } = useQuery(urlObject.dataset || '');

  const [pendingDataQuery, setPendingDataQuery] = useState(false);
  const [pendingCountQuery, setPendingCountQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<Response<'subject' | 'predicate' | 'object'>>();
  const [queryTime, setQueryTime] = useState(0);
  const [totalRows, setTotalRows] = useState<number>();

  const [paginationFilterState, setPaginationFilterState] = useState<PaginationFilterState>();
  const previousPaginationFilterState = useRef<PaginationFilterState>();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const getTotalRows = useCallback(
    (filters: Record<string, FilterValue | null>, searchText: string) => {
      setPendingCountQuery(true);
      const graph = urlObject.graph || '';
      const query = `
    SELECT (count(*) as ?count)
    WHERE { ${graph === 'default' ? '' : `GRAPH <${graph}>`} {
      ?subject ?predicate ?object
      ${filters.subject ? `filter( regex(str(?subject), "${filters.subject[0]}", "i" ))` : ''}
      ${filters.predicate ? `filter( regex(str(?predicate), "${filters.predicate[0]}", "i" ))` : ''}
      ${filters.object ? `filter( regex(str(?object), "${filters.object[0]}", "i" ))` : ''}
      ${
        searchText !== ''
          ? `filter( regex(concat(str(?subject), str(?predicate), str(?object)), "${searchText}", "i" ))`
          : ''
      }
    }}
    `;

      getQuery<'count'>(query)
        .then((response) => {
          setPendingCountQuery(false);
          if (response.type === 'read') {
            setTotalRows(parseInt(response.data.results.bindings[0].count?.value || '', 10));
          }
        })
        .catch(() => {
          setPendingCountQuery(false);
        });
    },
    [getQuery, urlObject.graph],
  );

  const fetchData = useCallback(
    (
      limit: number,
      offset: number,
      sortedColumn: string | undefined,
      order: SortOrder | undefined,
      filters: Record<string, FilterValue | null>,
      searchText: string,
    ) => {
      setPendingDataQuery(true);
      const startTime = Date.now();
      const graph = urlObject.graph || '';
      const query = `
      SELECT ?subject ?predicate ?object

      WHERE { ${graph === 'default' ? '' : `GRAPH <${graph}>`} {
        ?subject ?predicate ?object
        ${filters.subject ? `filter( regex(str(?subject), "${filters.subject[0]}", "i" ))` : ''}
        ${filters.predicate ? `filter( regex(str(?predicate), "${filters.predicate[0]}", "i" ))` : ''}
        ${filters.object ? `filter( regex(str(?object), "${filters.object[0]}", "i" ))` : ''}
        ${
          searchText !== ''
            ? `filter( regex(concat(str(?subject), str(?predicate), str(?object)), "${searchText}", "i" ))`
            : ''
        }
      }}

      ${order ? `ORDER BY ${order === 'ascend' ? 'ASC' : 'DESC'}(?${sortedColumn})` : ''}

      LIMIT ${limit} OFFSET ${offset}
      `;

      getQuery<'subject' | 'predicate' | 'object'>(query)
        .then((response) => {
          setPendingDataQuery(false);
          const endTime = Date.now();
          setQueryTime(endTime - startTime);

          console.log('RES', response);
          setQueryResult(response);
        })
        .catch((error) => {
          setPendingDataQuery(false);
          setQueryResult({ type: 'error' });
          console.log('ERR', error);
        });
    },
    [getQuery, urlObject.graph],
  );

  useEffect(() => {
    getTotalRows({}, '');
    fetchData(DEFAULT_PAGESIZE, 0, undefined, undefined, {}, '');
  }, [getTotalRows, fetchData]);

  useEffect(() => {
    if (paginationFilterState) {
      if (
        previousPaginationFilterState.current && (
          (previousPaginationFilterState.current.searchText !== paginationFilterState?.searchText) ||
          ((previousPaginationFilterState.current.filters.subject || []).join(';') !== (paginationFilterState?.filters.subject || []).join(';')) ||
          ((previousPaginationFilterState.current.filters.predicate || []).join(';') !== (paginationFilterState?.filters.predicate || []).join(';')) ||
          ((previousPaginationFilterState.current.filters.object || []).join(';') !== (paginationFilterState?.filters.object || []).join(';'))
        )
      ) {
        getTotalRows(paginationFilterState.filters, paginationFilterState.searchText);
      }

      fetchData(
        paginationFilterState.pagination.pageSize || DEFAULT_PAGESIZE,
        (paginationFilterState.pagination.pageSize || DEFAULT_PAGESIZE) * ((paginationFilterState.pagination.current || 1) - 1),
        (paginationFilterState.sorter.columnKey as string) || undefined,
        paginationFilterState.sorter.order,
        paginationFilterState.filters,
        paginationFilterState.searchText,
      );
    }
  }, [fetchData, getTotalRows, paginationFilterState]);

  return (
    <>
      {contextHolder}
      {queryResult && queryResult.type === 'read' && (
        <TriplesDataTable
          queryResult={queryResult}
          queryTime={queryTime}
          totalRows={totalRows}
          defaultPageSize={DEFAULT_PAGESIZE}
          loading={pendingDataQuery || pendingCountQuery}
          onChange={(pagination, filters, sorter, searchText) => {
            previousPaginationFilterState.current = paginationFilterState;
            setPaginationFilterState({ pagination, filters, sorter, searchText });
          }}
          onAddClick={() => {
            setIsAddModalOpen(true);
          }}
          onDelete={(nbRows, success) => {
            getTotalRows(paginationFilterState?.filters || {}, paginationFilterState?.searchText || '');
            fetchData(
              paginationFilterState?.pagination.pageSize || DEFAULT_PAGESIZE,
              (paginationFilterState?.pagination.pageSize || DEFAULT_PAGESIZE) *
                ((paginationFilterState?.pagination.current || 1) - 1),
              (paginationFilterState?.sorter.columnKey as string) || undefined,
              paginationFilterState?.sorter.order,
              paginationFilterState?.filters || {},
              paginationFilterState?.searchText || '',
            );
            messageApi.open({
              type: success ? 'success' : 'error',
              content: success ? `${nbRows} triple have been deleted successfully` : 'An error occurred during deletion',
            });
          }}
        />
      )}

      {queryResult?.type === 'error' && (
        <Flex vertical justify="center" style={{ height: '100%' }}>
          <Result status="error" title="An error occurred during query execution" />
        </Flex>
      )}

      <AddTriplesModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={() => {
          setIsAddModalOpen(false);
          getTotalRows(paginationFilterState?.filters || {}, paginationFilterState?.searchText || '');
          fetchData(
            paginationFilterState?.pagination.pageSize || DEFAULT_PAGESIZE,
            (paginationFilterState?.pagination.pageSize || DEFAULT_PAGESIZE) *
              ((paginationFilterState?.pagination.current || 1) - 1),
            (paginationFilterState?.sorter.columnKey as string) || undefined,
            paginationFilterState?.sorter.order,
            paginationFilterState?.filters || {},
            paginationFilterState?.searchText || '',
          );

          messageApi.open({
            type: 'success',
            content: 'New triples have been added successfully',
          });
        }}
      />
    </>
  );
};

export default TriplesPage;
