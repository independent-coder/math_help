import { useState, useEffect, useRef } from 'react'
import { X, Play, Plus, Check, Star, Clock, Calendar, Film, Tv, Users, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Send, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { TV_MAPPINGS, getMappedTVDetails, getMappedSeasonDetails } from '../utils/tvMappings'
import { sendReport } from '../utils/reporter'
import { apiCache } from '../utils/apiCache'
import { Poster } from './Poster'

function DetailModal({ item, onClose, onPlay, onOpenDetails, watchlist, onToggleWatchlist }) {
  const [cast, setCast] = useState([])
  const [trailer, setTrailer] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [showTrailer, setShowTrailer] = useState(false)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [showSeasons, setShowSeasons] = useState(false)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [tvDetails, setTvDetails] = useState(null)
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [allSeason1Data, setAllSeason1Data] = useState(null)
  const [loadingTvDetails, setLoadingTvDetails] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  
  const seasonRef = useRef(null)
  const episodeRef = useRef(null)
  const recommendationsRef = useRef(null)
  
  const [showLeftRec, setShowLeftRec] = useState(false)
  const [showRightRec, setShowRightRec] = useState(true)

  const isTV = item.media_type === 'tv'
  const isWatchlisted = watchlist.some(w => w['#IMDB_ID'] === item['#IMDB_ID'])
  const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '091a808df1c6478aea7af42d9a550242'
  
  const isUnreleased = () => {
    if (!item.status) return false
    const unreleasedStatuses = ['Planned', 'In Production', 'Post Production', 'Rumored']
    if (unreleasedStatuses.includes(item.status)) return true
    
    if (item.release_date) {
      const releaseDate = new Date(item.release_date)
      const today = new Date()
      if (releaseDate > today) return true
    }
    
    return false
  }

  const unreleased = isUnreleased()

  const checkRecScroll = () => {
    if (recommendationsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = recommendationsRef.current
      setShowLeftRec(scrollLeft > 10)
      setShowRightRec(scrollLeft + clientWidth < scrollWidth - 10)
    }
  }

  const scrollRec = (direction) => {
    if (recommendationsRef.current) {
      const offset = direction === 'left' ? -300 : 300
      recommendationsRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  // Check scroll on recommendations
  useEffect(() => {
    const el = recommendationsRef.current
    if (el) {
      el.addEventListener('scroll', checkRecScroll)
      const timer = setTimeout(checkRecScroll, 100)
      return () => {
        el.removeEventListener('scroll', checkRecScroll)
        clearTimeout(timer)
      }
    }
  }, [recommendations])

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Fetch Full Details (Cast, Videos, Recommendations)
  useEffect(() => {
    if (!item.tmdb_id) return
    apiCache.fetchCached(`https://api.themoviedb.org/3/${item.media_type}/${item.tmdb_id}?api_key=${API_KEY}&append_to_response=credits,videos,recommendations`)
      .then(d => {
        if (d.credits?.cast) setCast(d.credits.cast.slice(0, 5))
        const trailerVideo = d.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || d.videos?.results?.[0]
        if (trailerVideo) setTrailer(trailerVideo.key)

        if (d.recommendations?.results) {
          const mapped = d.recommendations.results.slice(0, 10).map(rec => ({
            '#TITLE': rec.title || rec.name,
            '#YEAR': rec.release_date ? rec.release_date.split('-')[0] : (rec.first_air_date ? rec.first_air_date.split('-')[0] : 'N/A'),
            '#IMDB_ID': null,
            'tmdb_id': rec.id,
            'media_type': item.media_type,
            '#IMG_POSTER': rec.poster_path ? `https://image.tmdb.org/t/p/w780${rec.poster_path}` : null,
            'backdrop_path': rec.backdrop_path ? `https://image.tmdb.org/t/p/w1280${rec.backdrop_path}` : null,
            'vote_average': rec.vote_average,
            'overview': rec.overview
          }))
          setRecommendations(mapped)
        }
      })
      .catch(e => console.error('Full details fetch error:', e))
  }, [item])

  // Fetch TV details (Seasons)
  useEffect(() => {
    if (!isTV || !item.tmdb_id) return
    setLoadingTvDetails(true)
    apiCache.fetchCached(`https://api.themoviedb.org/3/tv/${item.tmdb_id}?api_key=${API_KEY}`)
      .then(details => {
        setTvDetails(getMappedTVDetails(details))
        return apiCache.fetchCached(`https://api.themoviedb.org/3/tv/${item.tmdb_id}/season/1?api_key=${API_KEY}`)
      })
      .then(season1 => {
        setAllSeason1Data(season1)
        if (TV_MAPPINGS[item.tmdb_id]) {
          setSeasonDetails(getMappedSeasonDetails(item.tmdb_id, 1, null, season1))
        } else {
          setSeasonDetails(season1)
        }
      })
      .catch(e => console.error('TV details fetch error:', e))
      .finally(() => setLoadingTvDetails(false))
  }, [isTV, item.tmdb_id])

  // Fetch season details when season changes
  useEffect(() => {
    if (!isTV || !item.tmdb_id || (season === 1 && !TV_MAPPINGS[item.tmdb_id])) return
    
    if (TV_MAPPINGS[item.tmdb_id]) {
      if (allSeason1Data) {
        setSeasonDetails(getMappedSeasonDetails(item.tmdb_id, season, null, allSeason1Data))
        setEpisode(1)
      }
      return
    }

    apiCache.fetchCached(`https://api.themoviedb.org/3/tv/${item.tmdb_id}/season/${season}?api_key=${API_KEY}`)
      .then(d => { setSeasonDetails(d); setEpisode(1) })
      .catch(e => console.error('Season fetch error:', e))
  }, [season, isTV, item.tmdb_id, allSeason1Data])

  const handleRecommendationClick = async (rec) => {
    try {
      const data = await apiCache.fetchCached(`https://api.themoviedb.org/3/${rec.media_type}/${rec.tmdb_id}?api_key=${API_KEY}&append_to_response=external_ids`)
      
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
        'number_of_seasons': data.number_of_seasons,
        'number_of_episodes': data.number_of_episodes,
        'status': data.status,
        'original_language': data.original_language,
        'backdrop_path': data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null
      }
      
      if (fullItem['#IMDB_ID']) {
        onOpenDetails(fullItem)
        const modalBody = document.querySelector('.scrollbar-hide')
        if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' })
        setSeason(1)
        setEpisode(1)
        setShowTrailer(false)
      } else {
        alert('This title does not have a valid IMDb ID for streaming.')
      }
    } catch (e) {
      console.error('Failed to resolve recommendation:', e)
    }
  }

  const seasons = tvDetails?.number_of_seasons
    ? Array.from({ length: tvDetails.number_of_seasons }, (_, i) => i + 1)
    : Array.from({ length: 10 }, (_, i) => i + 1)

  const episodes = seasonDetails?.episodes
    ? seasonDetails.episodes.map(ep => ep.episode_number)
    : Array.from({ length: 24 }, (_, i) => i + 1)

  const handleSendReport = async () => {
    if (!reportMessage.trim()) return
    setReporting(true)
    const success = await sendReport(item, 'Content Info Issue', reportMessage, isTV ? season : null, isTV ? episode : null)
    setReporting(false)
    if (success) {
      setReportSent(true)
      setReportMessage('')
      setTimeout(() => { setReportSent(false); setShowReportForm(false) }, 5000)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-dark border border-white/10 rounded-2xl overflow-hidden max-w-5xl w-full max-h-[95vh] overflow-y-auto scrollbar-hide shadow-2xl my-auto cursor-default"
      >
        {/* Backdrop / Trailer */}
        <div className="relative h-48 sm:h-64 md:h-96 w-full bg-darker flex-shrink-0">
          {showTrailer && trailer ? (
            <div className="absolute inset-0 bg-black">
              <iframe src={`https://www.youtube.com/embed/${trailer}?autoplay=1&rel=0`} className="w-full h-full" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen />
              <button onClick={() => setShowTrailer(false)} className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg border border-white/10 text-xs transition-colors">Close Trailer</button>
            </div>
          ) : (
            <>
              {item.backdrop_path ? <img src={item.backdrop_path} alt={item['#TITLE']} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10" />}
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
              {trailer && (
                <button onClick={() => setShowTrailer(true)} className="absolute inset-0 flex items-center justify-center group">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/90 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 shadow-xl shadow-primary/20">
                    <Play size={24} className="fill-white ml-1" />
                  </div>
                </button>
              )}
            </>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content grid */}
        <div className="p-5 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8">
            <div className="hidden md:block">
              <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-lg shadow-black/50 bg-darker">
                {item['#IMG_POSTER'] ? <img src={item['#IMG_POSTER']} alt={item['#TITLE']} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center"><Film className="text-gray-600" size={48} /></div>}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 leading-tight tracking-tight">{item['#TITLE']}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={14} />{item['#YEAR']}</span>
                  {item?.runtime !== undefined && <span className="flex items-center gap-1"><Clock size={14} />{item.runtime > 0 ? `${item.runtime}m` : 'N/A'}</span>}
                  {item?.vote_average !== undefined && <span className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded"><Star size={14} className="fill-yellow-500" />{item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A'}</span>}
                  {item.certification && <span className="px-2 py-0.5 bg-white/10 text-gray-300 border border-white/20 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider">{item.certification}</span>}
                  <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] sm:text-xs font-medium uppercase tracking-wider">{isTV ? 'TV Series' : 'Movie'}</span>
                  {unreleased && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider animate-pulse">Coming Soon</span>}
                </div>
              </div>

              {item.genres && <p className="text-sm text-primary font-semibold">{item.genres}</p>}
              {item.overview && <p className="text-sm sm:text-base text-gray-300 leading-relaxed line-clamp-4 sm:line-clamp-none">{item.overview}</p>}

              {cast.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Users size={12} /> Starring</h4>
                  <div className="flex flex-wrap gap-2">
                    {cast.map(c => <span key={c.id} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-200"><span className="font-semibold">{c.name}</span> <span className="text-gray-500 text-[10px]">as {c.character}</span></span>)}
                  </div>
                </div>
              )}

              {isTV && (
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1"><Tv size={12} /> Episode Selection</h4>
                  <div className="flex flex-wrap gap-3">
                    <div className="relative" ref={seasonRef}>
                      <button onClick={() => { setShowSeasons(!showSeasons); setShowEpisodes(false) }} disabled={loadingTvDetails} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors disabled:opacity-50 text-xs sm:text-sm font-medium">
                        Season {season}
                        {loadingTvDetails ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : showSeasons ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {showSeasons && (
                        <div className="absolute bottom-full left-0 mb-2 bg-dark/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto w-40 scrollbar-hide">
                          {seasons.map(s => <button key={s} onClick={() => { setSeason(s); setEpisode(1); setShowSeasons(false) }} className="block w-full px-4 py-2 text-left hover:bg-primary/20 transition-colors text-xs text-white">Season {s}</button>)}
                        </div>
                      )}
                    </div>
                    <div className="relative" ref={episodeRef}>
                      <button onClick={() => { setShowEpisodes(!showEpisodes); setShowSeasons(false) }} disabled={loadingTvDetails} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors disabled:opacity-50 text-xs sm:text-sm font-medium">
                        Episode {episode}
                        {loadingTvDetails ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : showEpisodes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {showEpisodes && (
                        <div className="absolute bottom-full left-0 mb-2 bg-dark/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto w-40 scrollbar-hide">
                          {episodes.map(e => <button key={e} onClick={() => { setEpisode(e); setShowEpisodes(false) }} className="block w-full px-4 py-2 text-left hover:bg-primary/20 transition-colors text-xs text-white">Episode {e}</button>)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-6">
                <button onClick={() => !unreleased && onPlay(item, season, episode)} disabled={unreleased} className={`flex items-center justify-center gap-2 px-8 py-3.5 font-bold rounded-2xl transition-all duration-300 text-sm ${unreleased ? 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5' : 'bg-primary hover:bg-primary/95 text-white hover:scale-105 shadow-xl shadow-primary/40'}`}>
                  {unreleased ? <Lock size={18} /> : <Play size={18} className="fill-white" />}
                  {unreleased ? 'Coming Soon' : 'Watch Now'}
                </button>
                <a href={`https://www.themoviedb.org/${item.media_type}/${item.tmdb_id}`} target="_blank" rel="noopener noreferrer" title="View on TMDB" className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all text-xs font-bold">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Tmdb.new.logo.svg" alt="TMDB" className="h-4" />
                </a>
                {item['#IMDB_URL'] && (
                  <a href={item['#IMDB_URL']} target="_blank" rel="noopener noreferrer" title="View on IMDb" className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all text-xs font-bold">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg" alt="IMDb" className="h-4" />
                  </a>
                )}
                <button onClick={() => onToggleWatchlist(item)} className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border transition-all duration-300 text-sm font-bold ${isWatchlisted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/20'}`}>
                  {isWatchlisted ? <><Check size={18} />In Watchlist</> : <><Plus size={18} />Add to Watchlist</>}
                </button>
                <button onClick={() => setShowReportForm(!showReportForm)} className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-xs font-bold">
                  <AlertTriangle size={16} /> Report
                </button>
              </div>

              {showReportForm && (
                <div className="mt-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-red-400 flex items-center gap-2"><AlertTriangle size={16} /> Report an Issue</h4>
                    <button onClick={() => setShowReportForm(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                  </div>
                  {reportSent ? (
                    <div className="py-4 text-center">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="text-emerald-400" size={24} /></div>
                      <p className="text-emerald-400 font-bold text-sm">Report Sent Successfully!</p>
                    </div>
                  ) : (
                    <>
                      <textarea value={reportMessage} onChange={(e) => setReportMessage(e.target.value)} placeholder="What's wrong?" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 min-h-[100px] resize-none" />
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-gray-500 italic max-w-[200px]">Technical details are included automatically.</p>
                        <button onClick={handleSendReport} disabled={reporting || !reportMessage.trim()} className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-xs">
                          {reporting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                          Send Report
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="pt-8 border-t border-white/10">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-5 flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Similar Titles</h4>
              <div className="relative">
                <div ref={recommendationsRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pt-4 px-4 -mx-4">
                  {recommendations.map(rec => <Poster key={rec.tmdb_id} item={rec} onClick={() => handleRecommendationClick(rec)} onQuickPlay={() => handleRecommendationClick(rec)} isUnreleased={false} />)}
                  <div className="flex-shrink-0 w-4 sm:w-8" />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => scrollRec('left')} disabled={!showLeftRec} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg"><ChevronLeft size={20} /></button>
                  <button onClick={() => scrollRec('right')} disabled={!showRightRec} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg"><ChevronRight size={20} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetailModal
