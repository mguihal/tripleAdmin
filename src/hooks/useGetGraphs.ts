import { useCallback } from 'react';
import useQuery from './useQuery';
import { useAppStateContext } from './useAppState';

const useGetGraphs = () => {
  const {
    actions: {
      server: { setGraphs },
    },
  } = useAppStateContext();

  const { getQuery } = useQuery();

  const getGraphs = useCallback(
    async (dataset: string) => {
      return getQuery<'g'>(
        `
        SELECT ?g
        WHERE {
          GRAPH ?g { }
        }
      `,
        dataset,
      ).then((response) => {
        if (response.type !== 'read') throw new Error('Incorrect response');

        const graphs = response.data.results.bindings.map((binding) => binding.g?.value).filter((g) => g !== undefined);
        setGraphs(dataset.startsWith('/') ? dataset.slice(1) : dataset, graphs);
        return graphs;
      });
    },
    [getQuery, setGraphs],
  );

  return { getGraphs };
};

export default useGetGraphs;
