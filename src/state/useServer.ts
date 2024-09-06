import { useCallback, useState } from 'react';

export type ServerAttributes = {
  built: string;
  startDateTime: string;
  uptime: number;
  version: string;
  datasets: {
    'ds.name': string;
    'ds.state': boolean;
    'ds.services': {
      'srv.type': 'query' | 'update' | 'upload' | 'gsp-r' | 'gsp-rw';
      'srv.description': string;
      'srv.endpoints': string[];
    }[];
  }[];
};

const useServer = () => {
  const [host, setHost] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<ServerAttributes | null>(null);

  const [graphs, setGraphsValue] = useState<{ [datasetKey: string]: string[] }>({});

  const initialize = useCallback((_host: string, _attributes: ServerAttributes) => {
    setHost(_host);
    setAttributes(_attributes);

    const event = new CustomEvent<{ host: string }>('serverInitialized', { detail: { host: _host } });
    document.dispatchEvent(event);
  }, []);

  const getGraphs = useCallback(
    (dataset: string) => {
      return graphs[dataset] || [];
    },
    [graphs],
  );

  const setGraphs = useCallback(
    (dataset: string, graphsList: string[]) => {
      setGraphsValue((v) => ({ ...v, [dataset]: graphsList }));
    },
    [setGraphsValue],
  );

  return {
    state: {
      host,
      attributes,
      getGraphs,
    },
    actions: {
      initialize,
      setGraphs,
    },
  };
};

export default useServer;
