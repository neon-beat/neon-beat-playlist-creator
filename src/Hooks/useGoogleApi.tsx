import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface GoogleAccounts {
  oauth2: {
    initCodeClient: (config: {
      client_id: string;
      scope: string;
      ux_mode?: string;
      callback: (response: any) => void;
    }) => void;
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
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
// const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const useGoogleApi = () => {

  const [accessToken, setAccessToken] = useState<string | undefined>(); // State to hold the access token
  const [tokenExpiry, setTokenExpiry] = useState<number | undefined>(); // State to hold token expiry time

  const navigate = useNavigate();

  const oauthSignIn = () => {
    // Google's OAuth 2.0 endpoint for requesting an access token
    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    // Create <form> element to submit parameters to OAuth 2.0 endpoint.
    const form = document.createElement('form');
    form.setAttribute('method', 'GET'); // Send as a GET request.
    form.setAttribute('action', oauth2Endpoint);

    // Parameters to pass to OAuth 2.0 endpoint.
    const params: { [key: string]: string } = {
      'client_id': GOOGLE_API_CLIENT_ID,
      'redirect_uri': GOOGLE_REDIRECT_URI, // Change to your redirect URI
      'response_type': 'token',
      'scope': 'https://www.googleapis.com/auth/youtube.readonly',
      'include_granted_scopes': 'true',
      'state': 'pass-through value',
    };

    // Add form parameters as hidden input values.
    for (const p in params) {
      const input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', p);
      input.setAttribute('value', params[p]);
      form.appendChild(input);
    }

    // Add form to page and submit it to open the OAuth 2.0 endpoint.
    document.body.appendChild(form);
    form.submit();
  }

  const checkTokenValidity = () => {
    if (!accessToken || !tokenExpiry) {
      navigate('/#/');
      return false;
    }
    if (tokenExpiry && Date.now() > tokenExpiry) {
      // Token has expired
      setAccessToken(undefined);
      setTokenExpiry(undefined);
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expiry');
      navigate('/');
      return false;
    } else {
      return true;
    }
  }

  const fetchPlaylists = async (pageToken: string) => {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&hl=en_US${pageToken ? `&pageToken=${pageToken}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  }

  const getPlaylists = async () => {
    if (!checkTokenValidity()) throw new Error('Access token has expired');
    const items: any[] = [];
    let data = await fetchPlaylists('');
    while (data?.nextPageToken) {
      if (data?.items) {
        items.push(...data.items);
      }
      data = await fetchPlaylists(data.nextPageToken);
    }
    if (data?.items) {
      items.push(...data.items);
    }
    return items;
  };

  const fetchPlaylistItems = async (playlistId: string, pageToken: string) => {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  };

  const getPlaylistItems = async (playlistId: string) => {
    if (!checkTokenValidity()) throw new Error('Access token has expired');
    const items: any[] = [];
    let data = await fetchPlaylistItems(playlistId, '');
    while (data?.nextPageToken) {
      if (data?.items) {
        items.push(...data.items);
      }
      data = await fetchPlaylistItems(playlistId, data.nextPageToken);
    }
    if (data?.items) {
      items.push(...data.items);
    }
    const formattedItems = items.map(item => ({
      id: item.snippet?.resourceId?.videoId,
      thumbnail: item.snippet.thumbnails?.default?.url || '',
      fields: {
        title: {
          type: "text",
          value: item.snippet.title,
          label: 'Title',
          bonus: false,
        },
        artist: {
          type: "text",
          value: item.snippet.videoOwnerChannelTitle || 'Unknown Artist',
          label: 'Artist',
          bonus: false,
        },
        releaseYear: {
          type: "year",
          value: new Date(item.snippet.publishedAt).getFullYear(),
          label: 'Release year',
          bonus: false,
        },
      },
      startTimeMs: 0,
      endTimeMs: 30000,
    }));
    return formattedItems;
  };

  useEffect(() => {
    // Check if a valid token exists in localStorage
    const st = localStorage.getItem('access_token');
    const te = localStorage.getItem('token_expiry');
    if (st && te && Date.now() < parseInt(te)) {
      setAccessToken(st);
      setTokenExpiry(parseInt(te));
      return;
    }

    // Else search for a token in URL after redirect
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const at = urlParams.get('access_token');
    const expires_in = urlParams.get('expires_in');
    if (at && expires_in) {
      setAccessToken(at);
      localStorage.setItem('access_token', at);
      const expiryTime = Date.now() + parseInt(expires_in) * 1000;
      localStorage.setItem('token_expiry', expiryTime.toString());
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return {
    isReady: typeof accessToken !== 'undefined',
    getPlaylists,
    getPlaylistItems,
    handleSignIn: oauthSignIn
  };
};

export default useGoogleApi;