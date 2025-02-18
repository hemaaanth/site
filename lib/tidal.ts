import querystring from 'querystring';

const client_id = process.env.TIDAL_CLIENT_ID;
const client_secret = process.env.TIDAL_CLIENT_SECRET;
const refresh_token = process.env.TIDAL_REFRESH_TOKEN;

const TOKEN_ENDPOINT = 'https://auth.tidal.com/v1/oauth2/token';
const FAVORITES_ENDPOINT = 'https://api.tidal.com/v1/me/favorites/tracks';

async function getAccessToken() {
  try {
    if (!client_id || !client_secret || !refresh_token) {
      throw new Error('Missing Tidal credentials in environment variables');
    }

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token,
        client_id,
        client_secret,
      }),
    });

    const data = await response.json();
    
    if (!data.access_token) {
      console.error('Failed to get access token:', data);
      throw new Error('No access token received');
    }

    return data;
  } catch (error) {
    console.error('Error in getAccessToken:', error);
    throw error;
  }
}

export async function getRecentlyPlayed() {
  try {
    const { access_token } = await getAccessToken();
    console.log('Got Tidal access token successfully');

    const response = await fetch(`${FAVORITES_ENDPOINT}?limit=3&order=DATE`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Tidal favorites response status:', response.status);

    if (!data?.items?.length) {
      console.log('No favorite tracks found:', data);
      return [];
    }

    return data.items.map(item => ({
      title: item.title,
      artist: item.artist.name,
      url: `https://tidal.com/track/${item.id}`,
    }));
  } catch (error) {
    console.error('Error in getRecentlyPlayed:', error);
    return [];
  }
}