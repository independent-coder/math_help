import { useRef, useState, useEffect } from 'react'
import { Film, Tv, Star, Calendar, ChevronLeft, ChevronRight, Play, Clock } from 'lucide-react'
import { Poster } from './Poster'

function TrendingSection({ title, items, loading, onSelectItem, onQuickPlay, icon: Icon }) {
  const scrollContainerRef = useRef(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10)
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
  }, [items, loading])

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -400 : 400
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  const isUnreleased = (item) => {
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

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-300 flex items-center gap-2">
          {Icon && <Icon size={20} className="text-primary" />}
          {title}
        </h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="w-36 sm:w-44 flex-shrink-0 bg-white/5 border border-white/10 rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-[2/3] bg-white/5" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
          {Icon && <Icon size={20} className="text-primary" />}
          {title}
        </h2>
      </div>
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-6 pt-6 px-4 -mt-6 -mx-4 scroll-smooth"
        >
          {items.filter(Boolean).map((item) => (
            <Poster
              key={item['#IMDB_ID'] || item.tmdb_id}
              item={item}
              onClick={() => onSelectItem(item)}
              onQuickPlay={onQuickPlay}
              isUnreleased={isUnreleased(item)}
            />
          ))}
          <div className="flex-shrink-0 w-4 sm:w-8" /> {/* Spacer */}
        </div>
        
        {/* Navigation Arrows */}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => scroll('left')}
            disabled={!showLeftArrow}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!showRightArrow}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrendingSection
