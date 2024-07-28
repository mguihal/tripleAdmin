import { createContext, useContext } from 'react';
import { ServerAttributes } from '../hooks/useGetServer';

export const ServerContext = createContext<ServerAttributes | null>(null);

export const useServerContext = () => {
  const server = useContext(ServerContext);

  if (!server) {
    throw new Error('ServerContext must be defined');
  }

  return server;
};
