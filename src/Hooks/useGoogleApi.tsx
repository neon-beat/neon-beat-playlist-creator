import { useEffect, useState } from 'react';


const GOOGLE_API_CLIENT_ID = import.meta.env.VITE_GOOGLE_API_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const google = window.google;

const useGoogleApi = () => {

  const start = () => {
    google.accounts.id.initialize({
      client_id: GOOGLE_API_CLIENT_ID,
      callback,
    });
    google.accounts.id.prompt();
  }

  const callback = (response: any) => {
    console.log("Response", response);
  }

  useEffect(() => {
    start();
  }, []);
};

export default useGoogleApi;