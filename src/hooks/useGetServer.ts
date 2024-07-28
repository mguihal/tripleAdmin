import { useCallback } from "react";

export type ServerAttributes = {
  built: string;
  startDateTime: string;
  uptime: number;
  version: string;
  datasets: {
    "ds.name": string;
    "ds.state": boolean;
    "ds.services": {
      "srv.type": "query" | "update" | "upload" | "gsp-r" | "gsp-rw";
      "srv.description": string;
      "srv.endpoints": string[];
    }[];
  }[];
};

const useGetServer = () => {
  const getServer = useCallback(async (host: string, credentials: string) => {
    const response = await fetch("/api/server", {
      method: "GET",
      headers: {
        "X-TripleHost": host.endsWith("/") ? host.slice(0, -1) : host,
        "X-TriplePath": "/$/server",
        Authorization: `Basic ${credentials}`,
      },
    });

    if (response.ok) {
      const content = await response.json();
      return content as ServerAttributes;
    }

    if (response.status === 401) {
      throw new Error("Bad credentials");
    }

    throw new Error("Unable to connect to host");
  }, []);

  return { getServer };
};

export default useGetServer;
