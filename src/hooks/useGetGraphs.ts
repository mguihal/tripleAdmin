import { useCallback } from "react";
import { useServerContext } from "../contexts/serverContext";
import useStorage from "./useStorage";

type Response = {
  head: {
    vars: string[];
  },
  results: {
    bindings: {
      g: {
        type: string;
        value: string;
      }
    }[];
  }
};

const useGetGraphs = () => {
  const server = useServerContext();
  const { getAuthData } = useStorage();

  const authData = getAuthData();

  const getGraphs = useCallback(async (dataset: string) => {
    if (!authData.host || !authData.credentials) {
      location.reload();
      return [];
    }

    const { host, credentials } = authData;
    const currentDataset = server.datasets.find(d => d["ds.name"] === dataset);

    if (!currentDataset) {
      throw new Error(`Unknown dataset "${dataset}"`);
    }

    const response = await fetch("/api/server", {
      method: "POST",
      headers: {
        "X-TripleHost": host.endsWith("/") ? host.slice(0, -1) : host,
        "X-TriplePath": currentDataset["ds.name"],
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        query: `
          SELECT ?g
          WHERE {
            GRAPH ?g { }
          }
        `,
      }),
    });

    if (response.ok) {
      const content = await response.json() as Response;
      return content.results.bindings.map(binding => binding.g.value);
    }

    if (response.status === 401) {
      throw new Error("Bad credentials");
    }

    throw new Error("Unable to connect to host");
  }, [authData, server.datasets]);

  return { getGraphs };
};

export default useGetGraphs;
