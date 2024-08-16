import { useCallback, useState } from "react";

type UrlObject = {
  dataset: string | null;
  graph: string | null;
};

const getUrlObject = () => {
  const parts = location.pathname.split('/').filter(i => i.length > 0);

  return {
    dataset: parts[0] ? decodeURIComponent(parts[0]) : null,
    graph: parts[1] ? decodeURIComponent(parts[1]) : null,
  }
};

const useNavigation = () => {

  const [urlObject, setUrlObject] = useState<UrlObject>(getUrlObject());

  const navigate = useCallback((path: string) => {
    history.pushState({}, "", path);
    setUrlObject(getUrlObject());
  }, []);

  return {
    state: {
      urlObject,
    },
    actions: {
      navigate,
    }
  };
};

export default useNavigation;
