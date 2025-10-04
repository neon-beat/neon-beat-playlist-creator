import { useEffect } from 'react';

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
  clientId?: string;
}

interface GoogleAccounts {
  id: {
    initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
    prompt: () => void;
  };
}

declare global {
  interface Window {
    google: {
      accounts: GoogleAccounts;
    };
  }
}

const GOOGLE_API_CLIENT_ID = import.meta.env.VITE_GOOGLE_API_CLIENT_ID;
// const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const google = window.google;

const useGoogleApi = () => {

  const start = () => {
    google.accounts.id.initialize({
      client_id: GOOGLE_API_CLIENT_ID,
      callback,
    });
    google.accounts.id.prompt();
  }

  const callback = (response: GoogleCredentialResponse) => {
    console.log("Response", response);
  }

  useEffect(() => {
    start();
  }, []);
};

export default useGoogleApi;