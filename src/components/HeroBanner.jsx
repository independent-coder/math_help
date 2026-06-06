import { useState, useEffect } from 'react'
import { Play, Info, Star, Lock, ChevronLeft, ChevronRight } from 'lucide-react'

function HeroBanner({ items, onPlay, onOpenDetails, loading }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-play
  useEffect(() => {
    if (!items || items.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [items])

  const next = () => setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
  const prev = () => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))

  const item = items?.[currentIndex]

  const isUnreleased = () => {
    if (!item?.status) return false
    const unreleasedStatuses = ['Planned', 'In Production', 'Post Production', 'Rumored']
    if (unreleasedStatuses.includes(item.status)) return true
    
    if (item.release_date) {
      const releaseDate = new Date(item.release_date)
      const today = new Date()
      if (releaseDate > today) return true
    }
    
    return false
  }

  if (loading || !item) {
    return (
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-8 animate-pulse flex items-end p-6 sm:p-12">
        <div className="space-y-4 w-full max-w-xl">
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="h-8 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="flex gap-4 pt-2">
            <div className="h-10 bg-white/10 rounded w-28" />
            <div className="h-10 bg-white/10 rounded w-28" />
          </div>
        </div>
      </div>
    )
  }

  const title = item['#TITLE']
  const backdrop = item.backdrop_path || item['#IMG_POSTER']
  const rating = item.vote_average
  const year = item['#YEAR']
  const overview = item.overview
  const isTV = item.media_type === 'tv'
  const unreleased = isUnreleased()

  return (
    <div className="relative h-[400px] sm:h-[500px] md:h-[600px] w-full rounded-2xl overflow-hidden border border-white/10 mb-8 group/hero">
      {/* Background Image */}
      {backdrop && (
        <div key={item.tmdb_id} className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out">
          <img
            src={backdrop}
            alt={title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-darker via-darker/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-darker via-darker/40 to-transparent" />

      {/* Carousel Controls */}
      {items.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm transition-all opacity-0 group-hover/hero:opacity-100">
            <ChevronLeft size={24} />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm transition-all opacity-0 group-hover/hero:opacity-100">
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Hero Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-12 flex flex-col justify-end max-w-2xl z-10">
        <div className="flex items-center gap-3 mb-3 text-xs sm:text-sm">
          <span className="px-2.5 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full font-semibold uppercase tracking-wider text-[10px] sm:text-xs">
            {unreleased ? 'Coming Soon' : 'Featured Today'}
          </span>
          <span className="text-gray-300 font-medium">{year}</span>
          {rating !== undefined && (
            <span className="flex items-center gap-1 text-yellow-500 font-semibold bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Star size={12} className="fill-yellow-500" />
              {rating > 0 ? rating.toFixed(1) : 'N/A'}
            </span>
          )}
          <span className="text-gray-400 font-medium">
            {isTV ? 'TV Series' : 'Movie'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight drop-shadow-md">
          {title}
        </h1>

        {overview && (
          <p className="text-gray-300 text-xs sm:text-sm md:text-base mb-5 sm:mb-6 leading-relaxed drop-shadow">
            {overview}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => !unreleased && onPlay(item)}
            disabled={unreleased}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 font-semibold rounded-xl transition-all duration-300 text-xs sm:text-sm ${
              unreleased 
                ? 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5' 
                : 'bg-primary hover:bg-primary/90 text-white hover:scale-105 shadow-lg shadow-primary/30'
            }`}
          >
            {unreleased ? <Lock size={16} /> : <Play size={16} className="fill-white" />}
            {unreleased ? 'Coming Soon' : 'Watch Now'}
          </button>
          <button
            onClick={() => onOpenDetails(item)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/10 backdrop-blur-md transition-all hover:scale-105 duration-300 text-xs sm:text-sm"
          >
            <Info size={16} />
            More Info
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeroBanner
