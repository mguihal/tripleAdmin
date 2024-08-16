import { useCallback } from 'react';
import useStoredState from '../hooks/useStoredState';

type QueryState = {
  [datasetKey: string]: {
    activeQuery: string;
  };
};

const useQueries = () => {
  const [queryState, setQueryState] = useStoredState<QueryState>('tripleAdmin-queryState', {});

  const updateActiveQuery = useCallback((datasetKey: string, activeQuery: string) => {
    setQueryState((qs) => ({
      ...qs,
      [datasetKey]: {
        ...qs[datasetKey],
        activeQuery,
      },
    }));
  }, []);

  return {
    state: {
      ...queryState,
    },
    actions: {
      updateActiveQuery,
    },
  };
};

export default useQueries;
