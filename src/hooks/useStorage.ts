import { useCallback } from "react";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift();
}

const useStorage = () => {
  const getAuthData = useCallback(() => {
    const host = sessionStorage.getItem("tripleAdmin:currentHost");
    const username = sessionStorage.getItem("tripleAdmin:currentUsername");
    const credentials = getCookie("tripleAdmin:credentials");

    return { host, username, credentials };
  }, []);

  const setAuthData = useCallback(
    (host: string, username: string, password: string) => {
      sessionStorage.setItem("tripleAdmin:currentHost", host);
      sessionStorage.setItem("tripleAdmin:currentUsername", username);

      document.cookie = `tripleAdmin:credentials=${btoa(
        `${username}:${password}`
      )}; max-age=3600; path=/`;
    },
    []
  );

  return { getAuthData, setAuthData };
};

export default useStorage;
