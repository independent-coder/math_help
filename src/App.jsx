import { useState, useEffect } from 'react'
import { Search, Film, Tv, ArrowLeft, Play, Clock, X, TrendingUp, Bookmark, Star, Flame, Rocket, Heart, Sparkles, Apple, Palette, Newspaper } from 'lucide-react'
import NetCorePlayer from './components/NetCorePlayer'
import SearchResults from './components/SearchResults'
import TrendingSection from './components/TrendingSection'
import HeroBanner from './components/HeroBanner'
import DetailModal from './components/DetailModal'
import DevNewsModal from './components/DevNewsModal'
import { Poster } from './components/Poster'
import { getMappedTVDetails } from './utils/tvMappings'
import { USER_RECOMMENDATIONS } from './utils/userRecommendations'
import { apiCache } from './utils/apiCache'

import PasswordPrompt from './components/PasswordPrompt'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedEpisodeInfo, setSelectedEpisodeInfo] = useState({ season: 1, episode: 1 })
  const [showPlayer, setShowPlayer] = useState(false)
  const [showDevNews, setShowDevNews] = useState(false)
  

  // Storage lists
  const [recentlyWatched, setRecentlyWatched] = useState([])
  const [watchlist, setWatchlist] = useState([])
  
  // Content states
  const [trendingMovies, setTrendingMovies] = useState([])
  const [trendingShows, setTrendingShows] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  const [topRatedShows, setTopRatedShows] = useState([])
  const [popularShows, setPopularShows] = useState([])
  const [upcomingMovies, setUpcomingMovies] = useState([])
  const [disneyContent, setDisneyContent] = useState([])
  const [appleTvContent, setAppleTvContent] = useState([])
  const [pixarContent, setPixarContent] = useState([])
  const [userRecommended, setUserRecommended] = useState([])
  
  // Loading states
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [loadingRecommended, setLoadingRecommended] = useState(true)
  const [loadingAdditional, setLoadingAdditional] = useState(true)
  const [loadingDisney, setLoadingDisney] = useState(true)
  const [loadingAppleTv, setLoadingAppleTv] = useState(true)
  const [loadingPixar, setLoadingPixar] = useState(true)
  
  // Search and view states
  const [searchActive, setSearchActive] = useState(false)
  const [activeDetailItem, setActiveDetailItem] = useState(null)
  const [scrollOpacity, setScrollOpacity] = useState(1)

  // ENVIRONMENT VARIABLES
  const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '091a808df1c6478aea7af42d9a550242'
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const fadeLimit = 300 // Fade out after 300px
      const opacity = Math.max(0, 1 - scrollY / fadeLimit)
      setScrollOpacity(opacity)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Autocomplete suggestions states
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Load recently watched from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentlyWatched')
    if (saved) {
      try {
        setRecentlyWatched(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recently watched:', e)
      }
    }
  }, [])

  // Save recently watched on changes
  useEffect(() => {
    localStorage.setItem('recentlyWatched', JSON.stringify(recentlyWatched))
  }, [recentlyWatched])

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('watchlist')
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse watchlist:', e)
      }
    }
  }, [])

  // Save watchlist on changes
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // Helper to resolve full details for TMDB items
  const resolveDetailedItems = async (items, mediaType) => {
    if (!items) return []
    const topItems = items.slice(0, 10)
    const detailed = await Promise.all(
      topItems.map(async (item) => {
        try {
          const type = mediaType || item.media_type
          const detailData = await apiCache.fetchCached(
            `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${API_KEY}&append_to_response=external_ids,content_ratings,release_dates`
          )

          let certification = 'N/A'
          if (type === 'movie') {
            const usRelease = detailData.release_dates?.results?.find(r => r.iso_3166_1 === 'US')
            const theatrical = usRelease?.release_dates?.find(d => d.certification)
            certification = theatrical?.certification || 'NR'
          } else {
            const usRating = detailData.content_ratings?.results?.find(r => r.iso_3166_1 === 'US')
            certification = usRating?.rating || 'NR'
          }

          return {
            '#TITLE': detailData.title || detailData.name,
            '#YEAR': detailData.release_date ? detailData.release_date.split('-')[0] : (detailData.first_air_date ? detailData.first_air_date.split('-')[0] : 'N/A'),
            '#IMDB_ID': detailData.external_ids?.imdb_id || null,
            '#RANK': detailData.popularity ? Math.round(detailData.popularity) : 0,
            '#ACTORS': '',
            '#AKA': `${detailData.title || detailData.name} (${detailData.release_date ? detailData.release_date.split('-')[0] : (detailData.first_air_date ? detailData.first_air_date.split('-')[0] : 'N/A')})`,
            '#IMDB_URL': detailData.external_ids?.imdb_id ? `https://imdb.com/title/${detailData.external_ids.imdb_id}` : `https://www.themoviedb.org/${type}/${item.id}`,
            '#IMDB_IV': `https://www.themoviedb.org/${type}/${item.id}`,
            '#IMG_POSTER': detailData.poster_path ? `https://image.tmdb.org/t/p/w780${detailData.poster_path}` : null,
            'media_type': type,
            'tmdb_id': item.id,
            'overview': detailData.overview,
            'vote_average': detailData.vote_average,
            'vote_count': detailData.vote_count,
            'genres': detailData.genres?.map(g => g.name).join(', ') || '',
            'runtime': detailData.runtime,
            'number_of_seasons': getMappedTVDetails(detailData).number_of_seasons,
            'number_of_episodes': detailData.number_of_episodes,
            'status': detailData.status,
            'release_date': detailData.release_date || detailData.first_air_date,
            'original_language': detailData.original_language,
            'certification': certification,
            backdrop_path: detailData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detailData.backdrop_path}` : null
          }
        } catch (e) {
          console.error(`Failed to fetch details for ${mediaType || item.media_type}:`, item.id, e)
          return null
        }
      })
    )
    return detailed.filter(item => item !== null && item['#IMDB_ID'])
  }

  // Fetch trending movies and TV shows from TMDB on mount
  useEffect(() => {
    if (!isAuthenticated) return
    const fetchTrending = async () => {
      setLoadingTrending(true)
      try {
        const [moviesData, showsData] = await Promise.all([
          apiCache.fetchCached(`https://api.themoviedb.org/3/trending/movie/day?api_key=${API_KEY}`),
          apiCache.fetchCached(`https://api.themoviedb.org/3/trending/tv/day?api_key=${API_KEY}`)
        ])

        const [detailedMovies, detailedShows] = await Promise.all([
          resolveDetailedItems(moviesData.results, 'movie'),
          resolveDetailedItems(showsData.results, 'tv')
        ])

        setTrendingMovies(detailedMovies)
        setTrendingShows(detailedShows)
      } catch (error) {
        console.error('Failed to fetch trending data:', error)
      } finally {
        setLoadingTrending(false)
      }
    }

    fetchTrending()
  }, [isAuthenticated])

  // Fetch additional homepage sections
  useEffect(() => {
    if (!isAuthenticated) return
    const fetchAdditional = async () => {
      setLoadingAdditional(true)
      try {
        const [topMoviesData, topShowsData, popShowsData, upcomingData] = await Promise.all([
          apiCache.fetchCached(`https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`),
          apiCache.fetchCached(`https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}`),
          apiCache.fetchCached(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`),
          apiCache.fetchCached(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}`)
        ])

        const [detTopMovies, detTopShows, detPopShows, detUpcoming] = await Promise.all([
          resolveDetailedItems(topMoviesData.results, 'movie'),
          resolveDetailedItems(topShowsData.results, 'tv'),
          resolveDetailedItems(popShowsData.results, 'tv'),
          resolveDetailedItems(upcomingData.results, 'movie')
        ])

        setTopRatedMovies(detTopMovies)
        setTopRatedShows(detTopShows)
        setPopularShows(detPopShows)
        setUpcomingMovies(detUpcoming)
      } catch (error) {
        console.error('Failed to fetch additional data:', error)
      } finally {
        setLoadingAdditional(false)
      }
    }

    fetchAdditional()
  }, [isAuthenticated])

  // Fetch Disney+ content
  useEffect(() => {
    if (!isAuthenticated) return
    const fetchDisney = async () => {
      setLoadingDisney(true)
      try {
        // Disney+ provider ID is 337
        const [disneyMoviesData, disneyShowsData] = await Promise.all([
          apiCache.fetchCached(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_watch_providers=337&watch_region=US&sort_by=popularity.desc`),
          apiCache.fetchCached(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_watch_providers=337&watch_region=US&sort_by=popularity.desc`)
        ])

        const movies = disneyMoviesData.results || []
        const shows = disneyShowsData.results || []
        
        // Combine and shuffle a bit or just take top of each
        const combined = [
          ...movies.slice(0, 10).map(m => ({ ...m, media_type: 'movie' })),
          ...shows.slice(0, 10).map(s => ({ ...s, media_type: 'tv' }))
        ].sort((a, b) => b.popularity - a.popularity)

        const detailed = await resolveDetailedItems(combined)
        setDisneyContent(detailed)
      } catch (error) {
        console.error('Failed to fetch Disney content:', error)
      } finally {
        setLoadingDisney(false)
      }
    }

    fetchDisney()
  }, [isAuthenticated])

  // Fetch Apple TV+ content
  useEffect(() => {
    if (!isAuthenticated) return
    const fetchAppleTv = async () => {
      setLoadingAppleTv(true)
      try {
        // Apple TV+ provider ID is 350
        const [appleMoviesData, appleShowsData] = await Promise.all([
          apiCache.fetchCached(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_watch_providers=350&watch_region=US&sort_by=popularity.desc`),
          apiCache.fetchCached(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_watch_providers=350&watch_region=US&sort_by=popularity.desc`)
        ])

        const movies = appleMoviesData.results || []
        const shows = appleShowsData.results || []
        
        const combined = [
          ...movies.slice(0, 10).map(m => ({ ...m, media_type: 'movie' })),
          ...shows.slice(0, 10).map(s => ({ ...s, media_type: 'tv' }))
        ].sort((a, b) => b.popularity - a.popularity)

        const detailed = await resolveDetailedItems(combined)
        setAppleTvContent(detailed)
      } catch (error) {
        console.error('Failed to fetch Apple TV content:', error)
      } finally {
        setLoadingAppleTv(false)
      }
    }

    fetchAppleTv()
  }, [isAuthenticated])

  // Fetch Pixar content
  useEffect(() => {
    if (!isAuthenticated) return
    const fetchPixar = async () => {
      setLoadingPixar(true)
      try {
        // Pixar production company ID is 3
        const pixarData = await apiCache.fetchCached(`https://api.themoviedb.org/3/discover/movie?api_key=091a808df1c6478aea7af42d9a550242&with_companies=3&sort_by=popularity.desc`);
        const movies = pixarData.results || [];
        
        const detailed = await resolveDetailedItems(movies.slice(0, 10).map(m => ({ ...m, media_type: 'movie' })));
        setPixarContent(detailed);
      } catch (error) {
        console.error('Failed to fetch Pixar content:', error);
      } finally {
        setLoadingPixar(false);
      }
    }

    fetchPixar()
  }, [isAuthenticated])

  // Helper to resolve a single TMDB item with full details
  const resolveSingleItem = async (id, type) => {
    try {
      const detailData = await apiCache.fetchCached(
        `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&append_to_response=external_ids,content_ratings,release_dates,credits`
      )
      
      let certification = 'N/A'
      if (type === 'movie') {
        const usRelease = detailData.release_dates?.results?.find(r => r.iso_3166_1 === 'US')
        const theatrical = usRelease?.release_dates?.find(d => d.certification)
        certification = theatrical?.certification || 'NR'
      } else {
        const usRating = detailData.content_ratings?.results?.find(r => r.iso_3166_1 === 'US')
        certification = usRating?.rating || 'NR'
      }

      return {
        '#TITLE': detailData.title || detailData.name,
        '#YEAR': detailData.release_date ? detailData.release_date.split('-')[0] : (detailData.first_air_date ? detailData.first_air_date.split('-')[0] : 'N/A'),
        '#IMDB_ID': detailData.external_ids?.imdb_id || null,
        '#RANK': detailData.popularity ? Math.round(detailData.popularity) : 0,
        '#ACTORS': '',
        '#AKA': `${detailData.title || detailData.name} (${detailData.release_date ? detailData.release_date.split('-')[0] : (detailData.first_air_date ? detailData.first_air_date.split('-')[0] : 'N/A')})`,
        '#IMDB_URL': detailData.external_ids?.imdb_id ? `https://imdb.com/title/${detailData.external_ids.imdb_id}` : `https://www.themoviedb.org/${type}/${id}`,
        '#IMDB_IV': `https://www.themoviedb.org/${type}/${id}`,
        '#IMG_POSTER': detailData.poster_path ? `https://image.tmdb.org/t/p/w780${detailData.poster_path}` : null,
        'media_type': type,
        'tmdb_id': id,
        'overview': detailData.overview,
        'vote_average': detailData.vote_average,
        'vote_count': detailData.vote_count,
        'genres': detailData.genres?.map(g => g.name).join(', ') || '',
        'runtime': detailData.runtime,
        'number_of_seasons': getMappedTVDetails(detailData).number_of_seasons,
        'number_of_episodes': detailData.number_of_episodes,
        'status': detailData.status,
        'release_date': detailData.release_date || detailData.first_air_date,
        'original_language': detailData.original_language,
        'certification': certification,
        backdrop_path: detailData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detailData.backdrop_path}` : null
      }
    } catch (e) {
      console.error('Failed to resolve single item:', id, e)
      return null
    }
  }

  // Deep-linking support: load from URL parameters on mount
  useEffect(() => {
    if (!isAuthenticated) return
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    const type = params.get('type')
    const s = params.get('s')
    const e = params.get('e')

    if (id && type) {
      const loadDeepLink = async () => {
        const resolved = await resolveSingleItem(id, type)
        if (resolved) {
          if (s || e) {
            setSelectedEpisodeInfo({ 
              season: parseInt(s) || 1, 
              episode: parseInt(e) || 1 
            })
          }
          setSelectedItem(resolved)
          setShowPlayer(true)
          addToRecentlyWatched(resolved)
        }
      }
      loadDeepLink()
    }
  }, [isAuthenticated])

  // Sync state with URL to prevent losing position on refresh
  useEffect(() => {
    if (!isAuthenticated) return
    const params = new URLSearchParams(window.location.search)
    if (showPlayer && selectedItem) {
      if (params.get('id') !== String(selectedItem.tmdb_id) || params.get('type') !== selectedItem.media_type) {
        params.set('id', selectedItem.tmdb_id)
        params.set('type', selectedItem.media_type)
        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
      }
    } else if (!showPlayer && params.has('id')) {
      window.history.pushState({}, '', window.location.pathname)
    }
  }, [showPlayer, selectedItem, isAuthenticated])

  // Fetch user recommendations from TMDB
  useEffect(() => {
    if (!isAuthenticated) return
    const fetchRecommended = async () => {
      setLoadingRecommended(true)
      try {
        const detailed = await resolveDetailedItems(USER_RECOMMENDATIONS)
        setUserRecommended(detailed)
      } catch (error) {
        console.error('Failed to fetch user recommendations:', error)
      } finally {
        setLoadingRecommended(false)
      }
    }

    fetchRecommended()
  }, [isAuthenticated])

  // Live autocomplete suggestions fetch with 300ms debounce
  useEffect(() => {
    if (!isAuthenticated || !query.trim()) {
      setSuggestions([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const data = await apiCache.fetchCached(
          `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
        )
        if (data.results) {
          const mapped = data.results
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 5)
            .map(item => {
              const mappedItem = getMappedTVDetails(item)
              return {
                id: item.id,
                title: item.title || item.name,
                year: item.release_date ? item.release_date.split('-')[0] : (item.first_air_date ? item.first_air_date.split('-')[0] : 'N/A'),
                media_type: item.media_type,
                poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : null,
                backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
                overview: item.overview,
                vote_average: item.vote_average,
                number_of_seasons: mappedItem.number_of_seasons
              }
            })
          setSuggestions(mapped)
        }
      } catch (e) {
        console.error('Autocomplete suggestions fetch error:', e)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query])

  // Select autocomplete suggestion and resolve full details (IMDb ID) on-demand
  const handleSelectSuggestion = async (suggestion) => {
    setShowSuggestions(false)
    setQuery(suggestion.title)

    try {
      const detailData = await apiCache.fetchCached(
        `https://api.themoviedb.org/3/${suggestion.media_type}/${suggestion.id}?api_key=${API_KEY}&append_to_response=external_ids`
      )
      
      const resolvedItem = {
        '#TITLE': detailData.title || detailData.name,
        '#YEAR': detailData.release_date ? detailData.release_date.split('-')[0] : (detailData.first_air_date ? detailData.first_air_date.split('-')[0] : 'N/A'),
        '#IMDB_ID': detailData.external_ids?.imdb_id || null,
        '#RANK': detailData.popularity ? Math.round(detailData.popularity) : 0,
        '#ACTORS': '',
        '#AKA': `${detailData.title || detailData.name} (${detailData.release_date ? detailData.release_date.split('-')[0] : (detailData.first_air_date ? detailData.first_air_date.split('-')[0] : 'N/A')})`,
        '#IMDB_URL': detailData.external_ids?.imdb_id ? `https://imdb.com/title/${detailData.external_ids.imdb_id}` : `https://www.themoviedb.org/${suggestion.media_type}/${suggestion.id}`,
        '#IMDB_IV': `https://www.themoviedb.org/${suggestion.media_type}/${suggestion.id}`,
        '#IMG_POSTER': detailData.poster_path ? `https://image.tmdb.org/t/p/w780${detailData.poster_path}` : null,
        'media_type': suggestion.media_type,
        'tmdb_id': suggestion.id,
        'overview': detailData.overview,
        'vote_average': detailData.vote_average,
        'vote_count': detailData.vote_count,
        'genres': detailData.genres?.map(g => g.name).join(', ') || '',
        'runtime': detailData.runtime,
        'number_of_seasons': detailData.number_of_seasons,
        'number_of_episodes': detailData.number_of_episodes,
        'status': detailData.status,
        'release_date': detailData.release_date || detailData.first_air_date,
        'original_language': detailData.original_language,
        backdrop_path: detailData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detailData.backdrop_path}` : null
      }

      if (resolvedItem['#IMDB_ID']) {
        setActiveDetailItem(resolvedItem)
      } else {
        alert('This title does not have a valid IMDb ID for streaming.')
      }
    } catch (e) {
      console.error('Failed to resolve suggestion details:', e)
    }
  }

  const searchIMDb = async (searchQuery) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setSearchActive(true)
    setShowSuggestions(false)
    try {
      // Use TMDB API for search
      const tmdbData = await apiCache.fetchCached(
        `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`
      )

      if (tmdbData.results) {
        // Fetch full details for each result to get IMDb ID
        const detailedResults = await Promise.all(
          tmdbData.results
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 20) // Limit to 20 results to avoid too many API calls
            .map(async (item) => {
              try {
                const detailData = await apiCache.fetchCached(
                  `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=${API_KEY}&append_to_response=external_ids,content_ratings,release_dates`
                )

                let certification = 'N/A'
                if (item.media_type === 'movie') {
                  const usRelease = detailData.release_dates?.results?.find(r => r.iso_3166_1 === 'US')
                  const theatrical = usRelease?.release_dates?.find(d => d.certification)
                  certification = theatrical?.certification || 'NR'
                } else {
                  const usRating = detailData.content_ratings?.results?.find(r => r.iso_3166_1 === 'US')
                  certification = usRating?.rating || 'NR'
                }

                return {
                  '#TITLE': detailData.title || detailData.name,
                  '#YEAR': detailData.release_date ? detailData.release_date.split('-')[0] : (detailData.first_air_date ? detailData.first_air_date.split('-')[0] : 'N/A'),
                  '#IMDB_ID': detailData.external_ids?.imdb_id || null,
                  '#RANK': detailData.popularity ? Math.round(detailData.popularity) : 0,
                  '#ACTORS': '',
                  '#AKA': `${detailData.title || detailData.name} (${detailData.release_date ? detailData.release_date.split('-')[0] : (detailData.first_air_date ? detailData.first_air_date.split('-')[0] : 'N/A')})`,
                  '#IMDB_URL': detailData.external_ids?.imdb_id ? `https://imdb.com/title/${detailData.external_ids.imdb_id}` : `https://www.themoviedb.org/${item.media_type}/${item.id}`,
                  '#IMDB_IV': `https://www.themoviedb.org/${item.media_type}/${item.id}`,
                  '#IMG_POSTER': detailData.poster_path ? `https://image.tmdb.org/t/p/w780${detailData.poster_path}` : null,
                  'media_type': item.media_type,
                  'tmdb_id': item.id,
                  'overview': detailData.overview,
                  'vote_average': detailData.vote_average,
                  'vote_count': detailData.vote_count,
                  'genres': detailData.genres?.map(g => g.name).join(', ') || '',
                  'runtime': detailData.runtime,
                  'number_of_seasons': getMappedTVDetails(detailData).number_of_seasons,
                  'number_of_episodes': detailData.number_of_episodes,
                  'status': detailData.status,
                  'release_date': detailData.release_date || detailData.first_air_date,
                  'original_language': detailData.original_language,
                  'certification': certification,
                  backdrop_path: detailData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detailData.backdrop_path}` : null
                }
              } catch (error) {
                console.error('Failed to fetch details for item:', item.id, error)
                return null
              }
            })
        )

        // Filter out null results and items without IMDb ID
        const validResults = detailedResults
          .filter(item => item !== null && item['#IMDB_ID'])
          .slice(0, 10) // Show max 10 results

        setResults(validResults)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    searchIMDb(query)
  }

  const handleSelectItem = (item) => {
    setActiveDetailItem(item)
  }

  const handlePlayFromModal = (item, season = 1, episode = 1) => {
    setSelectedEpisodeInfo({ season, episode })
    setSelectedItem(item)
    setShowPlayer(true)
    setActiveDetailItem(null)
    addToRecentlyWatched(item)
  }

  const handleQuickPlay = (item) => {
    setSelectedEpisodeInfo({ season: 1, episode: 1 })
    setSelectedItem(item)
    setShowPlayer(true)
    addToRecentlyWatched(item)
  }

  const addToRecentlyWatched = (item) => {
    const newItem = {
      ...item,
      timestamp: Date.now()
    }
    const filtered = recentlyWatched.filter(i => i['#IMDB_ID'] !== item['#IMDB_ID'])
    setRecentlyWatched([newItem, ...filtered].slice(0, 10))
  }

  const handleBack = () => {
    setShowPlayer(false)
    setSelectedItem(null)
  }

  const handleClearHistory = () => {
    setRecentlyWatched([])
  }

  const handleGoHome = () => {
    setShowPlayer(false)
    setSelectedItem(null)
    setSearchActive(false)
    setQuery('')
    setResults([])
    setActiveDetailItem(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleWatchlist = (item) => {
    const exists = watchlist.some(w => w['#IMDB_ID'] === item['#IMDB_ID'])
    if (exists) {
      setWatchlist(watchlist.filter(w => w['#IMDB_ID'] !== item['#IMDB_ID']))
    } else {
      setWatchlist([item, ...watchlist])
    }
  }

  return (
    <>
      {!isAuthenticated && <PasswordPrompt onAuthenticated={() => setIsAuthenticated(true)} />}
      <div className={`min-h-screen bg-gradient-to-br from-darker via-dark to-darker ${!isAuthenticated ? 'hidden' : ''}`}>
        {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-darker/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {(showPlayer || searchActive) && (
              <button
                onClick={showPlayer ? handleBack : () => {
                  setSearchActive(false)
                  setQuery('')
                  setResults([])
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline text-sm">Back</span>
              </button>
            )}
            <button 
              onClick={handleGoHome}
              className="flex items-center gap-2 sm:gap-3 flex-1 justify-center sm:justify-start hover:opacity-80 transition-opacity outline-none"
            >
              <div className="flex items-center gap-2">
                <Play className="text-primary" size={24} sm:size={28} fill="currentColor" />
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  NetCore
                </h1>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!showPlayer ? (
          <>
            {/* Search Section */}
            <div className="sticky top-0 z-40 pt-4 pb-4 -mx-4 px-4 mb-6 sm:mb-8 transition-all duration-300">
              <div className="relative max-w-4xl mx-auto flex items-center gap-4">
                <div className="flex-1 relative">
                  <form onSubmit={handleSubmit}>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Search className="text-gray-400 group-focus-within:text-primary transition-colors" size={18} sm:size={20} />
                      </div>
                      <input
                        type="text"
                        value={query}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onChange={(e) => {
                          const val = e.target.value
                          setQuery(val)
                          if (!val.trim()) {
                            setSearchActive(false)
                            setResults([])
                          }
                        }}
                        placeholder="Search for movies or TV shows..."
                        className="w-full pl-10 sm:pl-12 pr-28 sm:pr-36 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm sm:text-base"
                      />
                      {query && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuery('')
                            setSearchActive(false)
                            setResults([])
                          }}
                          className="absolute right-[5.5rem] sm:right-28 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          <X size={18} />
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 sm:px-6 py-1.5 sm:py-2 bg-primary hover:bg-primary/90 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-xs sm:text-sm"
                      >
                        {loading ? '...' : 'Search'}
                      </button>
                    </div>
                  </form>

                  {/* Autocomplete Dropdown suggestions list */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-dark/95 border border-white/20 rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-white/5 backdrop-blur-md">
                      {suggestions.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectSuggestion(s)}
                          className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer transition-colors"
                        >
                          {s.poster_path ? (
                            <img src={s.poster_path} alt={s.title} className="w-8 h-12 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-12 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center flex-shrink-0">
                              <Film className="text-gray-500" size={14} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-xs sm:text-sm truncate">{s.title}</h4>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{s.year} • {s.media_type === 'tv' ? 'TV Series' : 'Movie'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowDevNews(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all group"
                  title="Developer News"
                >
                  <Newspaper size={20} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline font-medium text-sm">Dev News</span>
                </button>
              </div>
            </div>

            {/* Hero Spotlight (Homepage only) */}
            {!searchActive && (
              <div style={{ opacity: scrollOpacity, transition: 'opacity 0.1s ease-out' }}>
                <HeroBanner
                  items={trendingMovies.slice(0, 5)}
                  onPlay={handlePlayFromModal}
                  onOpenDetails={handleSelectItem}
                  loading={loadingTrending}
                />
              </div>
            )}

            {/* Home Content or Search Results */}
            {searchActive ? (
              <SearchResults
                results={results}
                loading={loading}
                onSelectItem={handleSelectItem}
                onQuickPlay={handleQuickPlay}
                hasSearched={searchActive}
              />
            ) : (
              <>
                {/* 1. Personalized Spotlight */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6">Personalized Spotlight</h2>
                  {watchlist.length > 0 && (
                    <TrendingSection
                      title="My Watchlist"
                      items={watchlist}
                      loading={false}
                      onSelectItem={handleSelectItem}
                      onQuickPlay={handleQuickPlay}
                      icon={Bookmark}
                    />
                  )}
                  {recentlyWatched.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
                          <Clock size={20} className="text-primary" />
                          Recently Watched
                        </h2>
                        <button
                          onClick={handleClearHistory}
                          className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X size={16} />
                          Clear
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 pt-4 px-4 -mx-4">
                        {recentlyWatched.map((item) => (
                           <Poster
                             key={item['#IMDB_ID']}
                             item={item}
                             onClick={() => handleSelectItem(item)}
                             onQuickPlay={handleQuickPlay}
                             isUnreleased={false}
                           />
                        ))}
                      </div>
                    </div>
                  )}
                  <TrendingSection
                    title="Recommended for You"
                    items={userRecommended}
                    loading={loadingRecommended}
                    onSelectItem={handleSelectItem}
                    onQuickPlay={handleQuickPlay}
                    icon={Heart}
                  />
                </div>

                {/* 2. Popular & Trending */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6">Popular & Trending</h2>
                  <TrendingSection
                    title="Trending Movies"
                    items={trendingMovies}
                    loading={loadingTrending}
                    onSelectItem={handleSelectItem}
                    onQuickPlay={handleQuickPlay}
                    icon={TrendingUp}
                  />
                  <TrendingSection
                    title="Trending TV Shows"
                    items={trendingShows}
                    loading={loadingTrending}
                    onSelectItem={handleSelectItem}
                    onQuickPlay={handleQuickPlay}
                    icon={Tv}
                  />
                  <TrendingSection
                    title="Popular TV Shows"
                    items={popularShows}
                    loading={loadingAdditional}
                    onSelectItem={handleSelectItem}
                    onQuickPlay={handleQuickPlay}
                    icon={Flame}
                  />
                </div>

                {/* 3. Categories & Platforms */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6">Categories & Platforms</h2>
                  <TrendingSection
                    title="Disney+ Originals"
                    items={disneyContent}
                    loading={loadingDisney}
                    onSelectItem={handleSelectItem}
                    onQuickPlay={handleQuickPlay}
                    icon={Sparkles}
                  />
                  <TrendingSection
                    title="Apple TV+ Originals"
                    items={appleTvContent}
                    loading={loadingAppleTv}
                    onSelectItem={handleSelectItem}
                    onQuickPlay={handleQuickPlay}
                    icon={Apple}
                  />
                  <TrendingSection
                    title="Pixar Favorites"
                    items={pixarContent}
                    loading={loadingPixar}
                    onSelectItem={handleSelectItem}
                    onQuickPlay={handleQuickPlay}
                    icon={Palette}
                  />
                  <TrendingSection
                    title="Top Rated Movies"
                    items={topRatedMovies}
                    loading={loadingAdditional}
                    onSelectItem={handleSelectItem}
                    onQuickPlay={handleQuickPlay}
                    icon={Star}
                  />
                  <TrendingSection
                    title="Top Rated TV Shows"
                    items={topRatedShows}
                    loading={loadingAdditional}
                    onSelectItem={handleSelectItem}
                    onQuickPlay={handleQuickPlay}
                    icon={Star}
                  />
                  <TrendingSection
                    title="Upcoming Movies"
                    items={upcomingMovies}
                    loading={loadingAdditional}
                    onSelectItem={handleSelectItem}
                    onQuickPlay={handleQuickPlay}
                    icon={Rocket}
                  />
                </div>
              </>
            )}
          </>
        ) : (
         <NetCorePlayer
           item={selectedItem}
           initialSeason={selectedEpisodeInfo.season}
           initialEpisode={selectedEpisodeInfo.episode}
           onSelectItem={handleSelectItem}
           onPlay={handlePlayFromModal}
         />

        )}
      </main>

      {/* Dev News Modal */}
      {showDevNews && (
        <DevNewsModal onClose={() => setShowDevNews(false)} />
      )}

      {/* Detail Overlay Info Modal */}
      {activeDetailItem && (
        <DetailModal
          item={activeDetailItem}
          onClose={() => setActiveDetailItem(null)}
          onPlay={handlePlayFromModal}
          onOpenDetails={handleSelectItem}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 py-6 text-center text-gray-500 text-sm">
        <p>Search powered by TMDB API • Streaming via multiple providers and sources</p>
        <p>Created by independent-coder</p>
        <p>DMCA: This site does not host any files on its servers. All content is provided by non-affiliated third parties. We do not store or distribute any files.</p>
      </footer>
    </div>
    </>
  )
}

export default App
