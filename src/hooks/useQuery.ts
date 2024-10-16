import { useCallback, useMemo } from 'react';
import { Parser } from 'sparqljs';
import { useAppStateContext } from './useAppState';

const parser = new Parser();

export type Column = {
  type: 'uri' | 'literal' | 'bnode';
  value: string;
};

export type Row<T extends string> = {
  [column in T]: Column | undefined;
};

export type ReadResponse<T extends string> = {
  type: 'read';
  data: {
    head: {
      vars: T[];
    };
    results: {
      bindings: Row<T>[];
    };
  };
};

type AskResponse = {
  type: 'ask';
  data: boolean;
};

type ConstructResponse = {
  type: 'construct';
  data: {};
};

type UpdateResponse = {
  type: 'update';
  data: 'success';
};

type ErrorResponse = {
  type: 'error';
};

export type Response<T extends string> =
  | ReadResponse<T>
  | AskResponse
  | ConstructResponse
  | UpdateResponse
  | ErrorResponse;

const useQuery = (queryDataset?: string) => {
  const {
    state: {
      auth,
      server: { attributes },
    },
  } = useAppStateContext();

  const host = useMemo(() => auth.getHost(), [auth]);
  const credentials = useMemo(() => auth.getCredentials(), [auth]);
  const datasets = useMemo(() => attributes?.datasets, [attributes]);

  const getQuery = useCallback(
    async <T extends string>(query: string, dataset: string | undefined = queryDataset): Promise<Response<T>> => {

      if (!host || !credentials || !datasets) {
        location.reload();
        return {
          type: 'error',
        };
      }

      if (!dataset) {
        throw new Error('No dataset provided to query');
      }

      const currentDataset = datasets.find(
        (d) => d['ds.name'] === dataset || d['ds.name'] === `/${dataset}`,
      );

      if (!currentDataset) {
        throw new Error(`Unknown dataset "${dataset}"`);
      }

      const parsedQuery = parser.parse(query);

      const body =
        parsedQuery.type === 'query'
          ? {
              query,
            }
          : {
              update: query,
            };

      const isConstructQuery = parsedQuery.type === 'query' && parsedQuery.queryType === 'CONSTRUCT';

      const response = await fetch('/api/server', {
        method: 'POST',
        headers: {
          'X-TripleHost': host.endsWith('/') ? host.slice(0, -1) : host,
          'X-TriplePath': currentDataset['ds.name'],
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
          Accept: isConstructQuery ? 'application/ld+json' : '*/*',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        if (parsedQuery.type === 'update') {
          return {
            type: 'update',
            data: 'success',
          };
        }

        if (parsedQuery.queryType === 'SELECT') {
          const data = (await response.json()) as ReadResponse<T>['data'];
          return {
            type: 'read',
            data,
          };
        } else if (parsedQuery.queryType === 'ASK') {
          const data = (await response.json()).boolean as AskResponse['data'];
          return {
            type: 'ask',
            data,
          };
        } else if (parsedQuery.queryType === 'CONSTRUCT') {
          const data = (await response.json()) as ConstructResponse['data'];
          return {
            type: 'construct',
            data,
          };
        }
      }

      if (response.status === 401) {
        throw new Error('Bad credentials');
      }

      throw new Error('Unable to connect to host');
    },
    [queryDataset, host, credentials, datasets],
  );

  return { getQuery };
};

export default useQuery;
