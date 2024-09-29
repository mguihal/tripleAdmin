import { useEffect, useState } from 'react';
import useQuery, { Response } from '../../hooks/useQuery';
import { Flex, Result } from 'antd';
import TriplesDataTable from './TriplesDataTable';

type Props = {
  dataset: string;
};

const TriplesPage = ({ dataset }: Props) => {
  const { getQuery } = useQuery(dataset);

  const query = `# Selection of 25 first triples\nSELECT ?subject ?predicate ?object\nWHERE {\n ?subject ?predicate ?object\n}\nLIMIT 100\n`;

  const [_pendingQuery, setPendingQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<Response<string>>();
  const [queryTime, setQueryTime] = useState(0);

  useEffect(() => {
    setPendingQuery(true);
    const startTime = Date.now();
    getQuery(query)
      .then((response) => {
        setPendingQuery(false);
        const endTime = Date.now();
        setQueryTime(endTime - startTime);

        console.log('RES', response);
        setQueryResult(response);
      })
      .catch((error) => {
        setPendingQuery(false);
        setQueryResult({ type: 'error' });
        console.log('ERR', error);
      });
  }, [getQuery, query]);

  return (
    <>
      {queryResult && queryResult.type === 'read' && <TriplesDataTable queryResult={queryResult} queryTime={queryTime} />}

      {queryResult?.type === 'error' && (
        <Flex vertical justify="center" style={{ height: '100%' }}>
          <Result status="error" title="An error occurred during query execution" />
        </Flex>
      )}
    </>
  );
};

export default TriplesPage;
