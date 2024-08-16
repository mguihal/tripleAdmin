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

  const initialize = useCallback((_host: string, _attributes: ServerAttributes) => {
    setHost(_host), setAttributes(_attributes);
  }, []);

  return {
    state: {
      host,
      attributes,
    },
    actions: {
      initialize,
    },
  };
};

export default useServer;
