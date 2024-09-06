import { useCallback, useState } from 'react';
import useStoredState from '../hooks/useStoredState';

type QueryState = {
  [datasetKey: string]: {
    activeQuery: string;
    history: {
      query: string;
      dateTime: number;
      queryTime: number;
      rowsLength: number;
    }[];
  };
};

const useQueries = () => {
  const [queryState, setQueryState] = useStoredState<QueryState>('tripleAdmin-queryState', {});
  const [activeQueryTime, setActiveQueryTime] = useState(0);

  const updateActiveQuery = useCallback((datasetKey: string, activeQuery: string) => {
    setQueryState((qs) => ({
      ...qs,
      [datasetKey]: {
        ...qs[datasetKey],
        activeQuery,
      },
    }));
  }, [setQueryState]);

  const pushQueryHistory = useCallback((datasetKey: string, query: string, queryTime: number, rowsLength: number) => {
    setQueryState(qs => ({
      ...qs,
      [datasetKey]: {
        ...qs[datasetKey],
        history: [
          {
            query,
            dateTime: Date.now(),
            queryTime,
            rowsLength,
          },
          ...qs[datasetKey]?.history || []
        ],
      }
    }));
  }, [setQueryState]);

  const deleteQueryHistory = useCallback((datasetKey: string, index: number) => {
    setQueryState(qs => ({
      ...qs,
      [datasetKey]: {
        ...qs[datasetKey],
        history: qs[datasetKey]?.history?.filter((_, i) => i !== index) || [],
      }
    }));
  }, [setQueryState]);

  return {
    state: {
      queryState,
      activeQueryTime,
    },
    actions: {
      updateActiveQuery,
      setActiveQueryTime,
      pushQueryHistory,
      deleteQueryHistory,
    },
  };
};

export default useQueries;
