import { useCallback, useEffect, useState } from 'react';
import useQuery, { Response } from '../../hooks/useQuery';
import { Flex, Result } from 'antd';
import TriplesDataTable from './TriplesDataTable';
import { FilterValue, SortOrder } from 'antd/es/table/interface';

const DEFAULT_PAGESIZE = 50;

type Props = {
  dataset: string;
  graph: string;
};

const TriplesPage = ({ dataset, graph }: Props) => {
  const { getQuery } = useQuery(dataset);

  const [pendingDataQuery, setPendingDataQuery] = useState(false);
  const [pendingCountQuery, setPendingCountQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<Response<string>>();
  const [queryTime, setQueryTime] = useState(0);
  const [totalRows, setTotalRows] = useState<number>();

  const getTotalRows = useCallback(
    (filters: Record<string, FilterValue | null>, searchText: string) => {
      setPendingCountQuery(true);

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
    [getQuery, graph],
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

      getQuery(query)
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
    [getQuery, graph],
  );

  useEffect(() => {
    getTotalRows({}, '');
    fetchData(DEFAULT_PAGESIZE, 0, undefined, undefined, {}, '');
  }, [getTotalRows, fetchData]);

  return (
    <>
      {queryResult && queryResult.type === 'read' && (
        <TriplesDataTable
          queryResult={queryResult}
          queryTime={queryTime}
          totalRows={totalRows}
          defaultPageSize={DEFAULT_PAGESIZE}
          loading={pendingDataQuery || pendingCountQuery}
          onChange={(pagination, filters, sorter, searchText) => {
            console.log('MAX table change', pagination, filters, sorter);
            getTotalRows(filters, searchText);
            fetchData(
              pagination.pageSize || DEFAULT_PAGESIZE,
              (pagination.pageSize || DEFAULT_PAGESIZE) * ((pagination.current || 1) - 1),
              (sorter.columnKey as string) || undefined,
              sorter.order,
              filters,
              searchText,
            );
          }}
        />
      )}

      {queryResult?.type === 'error' && (
        <Flex vertical justify="center" style={{ height: '100%' }}>
          <Result status="error" title="An error occurred during query execution" />
        </Flex>
      )}
    </>
  );
};

export default TriplesPage;
