import { Film } from 'lucide-react'
import { Poster } from './Poster'

function SearchResults({ results, loading, onSelectItem, onQuickPlay, hasSearched }) {
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
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!hasSearched) {
    return (
      <div className="text-center py-16">
        <Film className="mx-auto text-gray-600 mb-4" size={64} />
        <h2 className="text-2xl font-semibold text-gray-400 mb-2">Start Searching</h2>
        <p className="text-gray-500">Enter a movie or TV show name above to find content</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">No results found. Try a different search term.</p>
      </div>
    )
  }

  return (
    <div className="pb-12">
      <h2 className="text-xl font-semibold mb-6 text-gray-300">
        Found {results.length} result{results.length !== 1 ? 's' : ''}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pt-4 px-4 -mx-4">
        {results.map((item) => (
          <Poster
            key={item['#IMDB_ID'] || item.tmdb_id}
            item={item}
            onClick={() => onSelectItem(item)}
            onQuickPlay={onQuickPlay}
            isUnreleased={isUnreleased(item)}
          />
        ))}
      </div>
    </div>
  )
}

export default SearchResults
