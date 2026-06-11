import { useState, useEffect, useRef } from 'react'
import { Play, Tv, ChevronDown, ChevronUp, Link, ExternalLink, Check, AlertTriangle, Send, Star, Clock, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { TV_MAPPINGS, getMappedSeasonDetails, getMappedTVDetails } from '../utils/tvMappings'
import { sendReport } from '../utils/reporter'
import { apiCache } from '../utils/apiCache'
import { Poster } from './Poster'

function NetCorePlayer({ item, initialSeason = 1, initialEpisode = 1, onSelectItem, onPlay }) {
  if (!item) return null;
  
  // Track state
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [showSeasons, setShowSeasons] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [provider, setProvider] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    const validProviders = ['vidlink', 'vidapi', 'vidcore', 'vidsrc', 'multiembed', 'videasy', 'cinezo'];
    return validProviders.includes(p) ? p : 'vidapi';
  }); 
  const [tvDetails, setTvDetails] = useState(null);
  const [episodeDetails, setEpisodeDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Carousel and Dropdown Refs
  const scrollContainerRef = useRef(null)
  const providerRef = useRef(null)
  const seasonRef = useRef(null)
  const episodeRef = useRef(null)
  
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (providerRef.current && !providerRef.current.contains(event.target)) {
        setShowProviders(false)
      }
      if (seasonRef.current && !seasonRef.current.contains(event.target)) {
        setShowSeasons(false)
      }
      if (episodeRef.current && !episodeRef.current.contains(event.target)) {
        setShowEpisodes(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10)
    }
  }

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -400 : 400
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const el = scrollContainerRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      const timer = setTimeout(checkScroll, 100)
      window.addEventListener('resize', checkScroll)
      
      return () => {
        el.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
        clearTimeout(timer)
      }
    }
  }, [recommendations])

  const imdbId = item['#IMDB_ID'];
  const isTV = item.media_type === 'tv';
  const API_KEY = '091a808df1c6478aea7af42d9a550242';

  // Persistence and URL Sync
  useEffect(() => {
    const saved = localStorage.getItem(`progress_${imdbId}`);
    if (saved) {
      try {
        const { season: savedSeason, episode: savedEpisode } = JSON.parse(saved);
        setSeason(savedSeason);
        setEpisode(savedEpisode);
      } catch (e) { console.error("Failed to parse progress", e); }
    }
  }, [imdbId]);

  useEffect(() => {
    localStorage.setItem(`progress_${imdbId}`, JSON.stringify({ season, episode }));
    
    // Sync with URL for deep-linking
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (isTV) {
      if (params.get('s') !== String(season) || params.get('e') !== String(episode)) {
        params.set('s', season);
        params.set('e', episode);
        changed = true;
      }
    }

    if (params.get('p') !== provider) {
      params.set('p', provider);
      changed = true;
    }

    if (changed) {
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [season, episode, imdbId, isTV, provider]);

  // Fetch show/movie details
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const type = isTV ? 'tv' : 'movie';
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${item.tmdb_id}?api_key=${API_KEY}&append_to_response=credits,recommendations`);
        let data = await res.json();

        if (isTV) {
            // Apply custom mapping if it exists
            if (TV_MAPPINGS[item.tmdb_id]) {
              const mapping = TV_MAPPINGS[item.tmdb_id];
              data = {
                  ...data,
                  seasons: Object.keys(mapping.seasons).map(s => ({ season_number: parseInt(s), episode_count: mapping.seasons[s].episode_count }))
              };
            } else {
              // Filter out season 0
              data.seasons = (data.seasons || []).filter(s => s.season_number !== 0);
            }
        }

        // Map recommendations to our app format
        if (data.recommendations?.results) {
          const mapped = data.recommendations.results.slice(0, 10).map(rec => ({
            '#TITLE': rec.title || rec.name,
            '#YEAR': rec.release_date ? rec.release_date.split('-')[0] : (rec.first_air_date ? rec.first_air_date.split('-')[0] : 'N/A'),
            '#IMDB_ID': null, // We fetch this on-demand when clicked
            'tmdb_id': rec.id,
            'media_type': rec.media_type || type, // fallback to current type
            '#IMG_POSTER': rec.poster_path ? `https://image.tmdb.org/t/p/w780${rec.poster_path}` : null,
            'backdrop_path': rec.backdrop_path ? `https://image.tmdb.org/t/p/w1280${rec.backdrop_path}` : null,
            'vote_average': rec.vote_average,
            'overview': rec.overview
          }));
          setRecommendations(mapped);
        }

        setTvDetails(data);
      } catch (err) {
        console.error('Failed to fetch details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [item.tmdb_id, isTV]);

  // Fetch specific episode details for runtime
  useEffect(() => {
    if (!isTV) return;
    
    const fetchEpisodeDetails = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${item.tmdb_id}/season/${season}/episode/${episode}?api_key=${API_KEY}`);
        const data = await res.json();
        setEpisodeDetails(data);
      } catch (err) {
        console.error('Failed to fetch episode details:', err);
      }
    };
    
    fetchEpisodeDetails();
  }, [item.tmdb_id, season, episode, isTV]);

  // Determine current runtime
  const currentRuntime = isTV 
    ? (episodeDetails?.runtime || (tvDetails?.episode_run_time?.[0]) || item.runtime)
    : (tvDetails?.runtime || item.runtime);


  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getEmbedUrl = () => {
    if (provider === 'vidapi') {
        const id = item['#IMDB_ID'] || item.tmdb_id;
        return isTV 
            ? `https://vaplayer.ru/embed/tv/${id}/${season}/${episode}?autoplay=1` 
            : `https://vaplayer.ru/embed/movie/${id}?autoplay=1`;
    }
    if (provider === 'vidlink') {
        return `https://vidlink.pro/${isTV ? `tv/${item.tmdb_id}/${season}/${episode}` : `movie/${item.tmdb_id}`}?autoplay=true`;
    }
    if (provider === 'videasy') {
        return `https://player.videasy.net/${isTV ? `tv/${item.tmdb_id}/${season}/${episode}` : `movie/${item.tmdb_id}`}?autoplay=true`;
    }
    if (provider === 'cinezo') {
        return `https://player.cinezo.live/embed/${isTV ? `tv/${item.tmdb_id}/${season}/${episode}` : `movie/${item.tmdb_id}`}?autoplay=1`;
    }
    const baseUrl = provider === 'vidcore' 
      ? 'https://vidcore.net/' 
      : provider === 'vidsrc'
        ? 'https://vidsrc.me/embed/'
        : 'https://multiembed.mov/?video_id=';
    
    if (provider === 'multiembed') {
      return `${baseUrl}${item.tmdb_id}&tmdb=1${isTV ? `&s=${season}&e=${episode}` : ''}&autoplay=1`
    }
    return `${baseUrl}${isTV ? `tv/${item.tmdb_id}/${season}/${episode}` : `movie/${item.tmdb_id}`}?autoplay=1`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = async () => {
    await sendReport(item, 'Playback Issue', 'User reported a playback issue', season, episode, { provider });
    alert('Report sent!');
  };

  const handleRecommendationClick = async (rec) => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/${rec.media_type}/${rec.tmdb_id}?api_key=${API_KEY}&append_to_response=external_ids,credits,content_ratings,release_dates`)
      const data = await res.json()
      
      let certification = 'N/A'
      if (rec.media_type === 'movie') {
        const usRelease = data.release_dates?.results?.find(r => r.iso_3166_1 === 'US')
        const theatrical = usRelease?.release_dates?.find(d => d.certification)
        certification = theatrical?.certification || 'NR'
      } else {
        const usRating = data.content_ratings?.results?.find(r => r.iso_3166_1 === 'US')
        certification = usRating?.rating || 'NR'
      }

      const fullItem = {
        '#TITLE': data.title || data.name,
        '#YEAR': data.release_date ? data.release_date.split('-')[0] : (data.first_air_date ? data.first_air_date.split('-')[0] : 'N/A'),
        '#IMDB_ID': data.external_ids?.imdb_id,
        '#IMDB_URL': data.external_ids?.imdb_id ? `https://imdb.com/title/${data.external_ids.imdb_id}` : `https://www.themoviedb.org/${rec.media_type}/${data.id}`,
        '#IMG_POSTER': data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : null,
        'media_type': rec.media_type,
        'tmdb_id': data.id,
        'overview': data.overview,
        'vote_average': data.vote_average,
        'vote_count': data.vote_count,
        'genres': data.genres?.map(g => g.name).join(', ') || '',
        'runtime': data.runtime,
        'status': data.status,
        'original_language': data.original_language,
        'certification': certification,
        'backdrop_path': data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null
      }
      
      if (fullItem['#IMDB_ID']) {
        onPlay(fullItem)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setSeason(1)
        setEpisode(1)
      } else {
        alert('This title does not have a valid IMDb ID for streaming.')
      }
    } catch (e) {
      console.error('Failed to resolve recommendation:', e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-darker border border-white/10 shadow-2xl">
        <iframe src={getEmbedUrl()} className="w-full h-full" allowFullScreen title="NetCore Player" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="hidden md:block">
          <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-darker">
            {item['#IMG_POSTER'] ? <img src={item['#IMG_POSTER']} alt={item['#TITLE']} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film className="text-gray-700" size={48} /></div>}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h1 className="text-3xl font-bold text-white">{item['#TITLE']}</h1>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4 text-sm text-gray-300">
              {isTV && episodeDetails && (
                <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                   {episodeDetails.still_path && (
                    <div className="flex-shrink-0 w-full sm:w-64 aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg bg-darker">
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${episodeDetails.still_path}`} 
                        alt={episodeDetails.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-primary">E{episode}</span> {episodeDetails.name}
                      </h3>
                      {episodeDetails.air_date && <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Aired: {episodeDetails.air_date}</span>}
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed italic">"{episodeDetails.overview || "No synopsis available for this episode."}"</p>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                       {episodeDetails.vote_average > 0 && (
                          <span className="flex items-center gap-1.5 text-yellow-500">
                            <Star size={14} className="fill-yellow-500" />
                            {episodeDetails.vote_average.toFixed(1)} Rating
                          </span>
                       )}
                       {episodeDetails.runtime > 0 && <span className="text-gray-400">Runtime: {episodeDetails.runtime}m</span>}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-1.5 text-yellow-500 font-bold bg-yellow-500/10 px-3 py-1 rounded-lg"><Star size={16} className="fill-yellow-500" />{item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A'}</span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg"><Clock size={16} />{currentRuntime > 0 ? `${currentRuntime} minutes` : 'N/A'}</span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg"><Calendar size={16} />{item['#YEAR']}</span>
                  {item.certification && <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg font-bold uppercase tracking-wider">{item.certification}</span>}
                  {isTV && <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg font-bold">S{season} E{episode}</span>}
              </div>
              <p className="text-gray-200 text-base leading-relaxed">{item.overview}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-white/10">
                  {tvDetails?.tagline && <p><strong className="text-white">Tagline:</strong> {tvDetails.tagline}</p>}
                  <p><strong className="text-white">Genres:</strong> {item.genres || 'N/A'}</p>
                  <p><strong className="text-white">Released:</strong> {tvDetails?.first_air_date || tvDetails?.release_date || item.release_date || 'N/A'}</p>
                  <p><strong className="text-white">Language:</strong> {tvDetails?.original_language?.toUpperCase() || 'N/A'}</p>
                  <p><strong className="text-white">Studios:</strong> {tvDetails?.production_companies?.map(c => c.name).join(', ') || 'N/A'}</p>
                  {tvDetails?.status && <p><strong className="text-white">Status:</strong> {tvDetails.status}</p>}
              </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopy} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${copied ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-white hover:bg-white/10'}`}><Check size={20} /><span className="text-sm font-medium">{copied ? 'Copied!' : 'Share'}</span></button>
            <a href={item['#IMDB_URL']} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 flex items-center justify-center text-white"><ExternalLink size={20}/></a>
            <button onClick={handleReport} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 flex items-center justify-center"><AlertTriangle size={20}/></button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative" ref={providerRef}>
            <button onClick={() => { setShowProviders(!showProviders); setShowSeasons(false); setShowEpisodes(false); }} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white font-semibold flex justify-between items-center">
               <span>Provider: {provider.toUpperCase()}</span>
               {showProviders ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showProviders && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-darker border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                {['vidlink', 'vidapi', 'vidcore', 'vidsrc', 'multiembed', 'videasy', 'cinezo'].map(p => <button key={p} onClick={() => { setProvider(p); setShowProviders(false) }} className="w-full text-left px-4 py-3 hover:bg-white/5 text-white capitalize">{p}</button>)}
              </div>
            )}
          </div>
          
          {isTV && tvDetails && (
            <div className="flex gap-2">
              <div className="relative flex-1" ref={seasonRef}>
                <button onClick={() => { setShowSeasons(!showSeasons); setShowProviders(false); setShowEpisodes(false); }} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white font-semibold flex justify-between items-center">
                  S{season} {showSeasons ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {showSeasons && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-darker border border-white/10 rounded-xl max-h-60 overflow-y-auto z-20">
                    {tvDetails.seasons.map((s) => <button key={s.season_number} onClick={() => { setSeason(s.season_number); setEpisode(1); setShowSeasons(false) }} className="w-full text-left px-4 py-3 hover:bg-white/5 text-white">Season {s.season_number}</button>)}
                  </div>
                )}
              </div>
              <div className="relative flex-1" ref={episodeRef}>
                <button onClick={() => { setShowEpisodes(!showEpisodes); setShowProviders(false); setShowSeasons(false); }} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white font-semibold flex justify-between items-center">
                  E{episode} {showEpisodes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {showEpisodes && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-darker border border-white/10 rounded-xl max-h-60 overflow-y-auto z-20">
                    {Array.from({ length: tvDetails.seasons.find(s => s.season_number === season)?.episode_count || 1 }).map((_, i) => <button key={i+1} onClick={() => { setEpisode(i+1); setShowEpisodes(false) }} className="w-full text-left px-4 py-3 hover:bg-white/5 text-white">Episode {i+1}</button>)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="pt-8 border-t border-white/10">
          <div className="flex items-center justify-between mb-6"><h4 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2"><TrendingUp size={24} className="text-primary" /> Similar Titles</h4></div>
          <div className="relative">
            <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide pt-4 px-4 -mx-4 scroll-smooth">
              {recommendations.map(rec => <Poster key={rec.tmdb_id} item={rec} onClick={() => handleRecommendationClick(rec)} onQuickPlay={() => handleRecommendationClick(rec)} isUnreleased={false} />)}
              <div className="flex-shrink-0 w-4 sm:w-8" />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => scroll('left')} disabled={!showLeftArrow} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all" aria-label="Scroll left"><ChevronLeft size={20} /></button>
              <button onClick={() => scroll('right')} disabled={!showRightArrow} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all" aria-label="Scroll right"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NetCorePlayer;
