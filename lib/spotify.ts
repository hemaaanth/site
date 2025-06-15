import querystring from 'querystring';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SAVED_TRACKS_ENDPOINT = 'https://api.spotify.com/v1/me/tracks';

async function getAccessToken() {
  try {
    if (!client_id || !client_secret || !refresh_token) {
      throw new Error('Missing Spotify credentials in environment variables');
    }

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token,
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
    console.log('Got access token successfully');

    const response = await fetch(SAVED_TRACKS_ENDPOINT + '?limit=3', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Saved tracks response status:', response.status);

    if (!data?.items?.length) {
      console.log('No saved tracks found:', data);
      return [];
    }

    return data.items.map(item => ({
      title: item.track.name,
      artist: item.track.artists.map(artist => artist.name).join(', '),
      url: item.track.external_urls.spotify,
      imageUrl: item.track.album?.images?.[1]?.url || item.track.album?.images?.[0]?.url,
    }));
  } catch (error) {
    console.error('Error in getRecentlyPlayed:', error);
    return [];
  }
}