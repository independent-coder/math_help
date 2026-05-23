import { Film, Tv, Star } from 'lucide-react'

function SearchResults({ results, loading, onSelectItem, hasSearched }) {
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
        <p className="text-gray-500">Enter a movie or TV show name above to find IMDb IDs</p>
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
    <div>
      <h2 className="text-xl font-semibold mb-6 text-gray-300">
        Found {results.length} result{results.length !== 1 ? 's' : ''}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((item) => (
          <div
            key={item['#IMDB_ID']}
            onClick={() => onSelectItem(item)}
            className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 hover:bg-white/10 transition-all cursor-pointer"
          >
            {/* Poster */}
            <div className="aspect-[2/3] bg-dark relative overflow-hidden">
              {item['#IMG_POSTER'] ? (
                <img
                  src={item['#IMG_POSTER']}
                  alt={item['#TITLE']}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Film className="text-gray-500" size={48} />
                </div>
              )}
              {/* Type Badge */}
              <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1">
                {item['#YEAR'] >= 2000 && item['#ACTORS']?.includes(',') ? (
                  <>
                    <Tv size={12} />
                    TV
                  </>
                ) : (
                  <>
                    <Film size={12} />
                    Movie
                  </>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                {item['#TITLE']}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                <span>{item['#YEAR']}</span>
                {item['#RANK'] && (
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    {item['#RANK']}
                  </span>
                )}
              </div>
              {item['#ACTORS'] && (
                <p className="text-sm text-gray-500 line-clamp-1">
                  {item['#ACTORS']}
                </p>
              )}
              <div className="mt-3 text-xs text-primary font-medium">
                Click to stream →
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchResults
