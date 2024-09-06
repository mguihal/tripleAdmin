import { useCallback } from 'react';

const KEY_HOST = 'tripleAdmin:currentHost';
const KEY_USERNAME = 'tripleAdmin:currentUsername';
const KEY_CREDENTIALS = 'tripleAdmin:credentials';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift();
}

const useAuth = () => {

  const login = useCallback(
    (host: string, username: string, password: string) => {
      sessionStorage.setItem(KEY_HOST, host);
      sessionStorage.setItem(KEY_USERNAME, username);

      document.cookie = `${KEY_CREDENTIALS}=${btoa(
        `${username}:${password}`
      )}; max-age=3600; path=/`;
    },
    []
  );

  const logout = useCallback(() => {
    document.cookie = `${KEY_CREDENTIALS}=; max-age=0; path=/`;
    history.pushState({}, '', '/');
    location.reload();
  }, []);

  return {
    state: {
      getHost: () => sessionStorage.getItem(KEY_HOST),
      getUsername: () => sessionStorage.getItem(KEY_USERNAME),
      getCredentials: () => getCookie(KEY_CREDENTIALS),
    },
    actions: {
      login,
      logout
    },
  };
};

export default useAuth;
