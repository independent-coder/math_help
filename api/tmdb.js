export default async function handler(req, res) {
  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Path parameter is required' });
  }

  const API_KEY = process.env.TMDB_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  // Construct TMDB URL
  const searchParams = new URLSearchParams(queryParams);
  searchParams.append('api_key', API_KEY);
  
  const tmdbUrl = `https://api.themoviedb.org/3${path.startsWith('/') ? path : `/${path}`}?${searchParams.toString()}`;

  try {
    const response = await fetch(tmdbUrl);
    const data = await response.json();
    
    // Forward the status code from TMDB or default to 200
    res.status(response.status || 200).json(data);
  } catch (error) {
    console.error('TMDB Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch from TMDB' });
  }
}
