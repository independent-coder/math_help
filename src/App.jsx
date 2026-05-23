import { useState } from 'react'
import { Search, Film, Tv, ArrowLeft, Play } from 'lucide-react'
import VidCorePlayer from './components/VidCorePlayer'
import SearchResults from './components/SearchResults'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showPlayer, setShowPlayer] = useState(false)

  const searchIMDb = async (searchQuery) => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(searchQuery)}&tt=&lsn=1&v=1`
      )
      const data = await response.json()
      if (data.ok && data.description) {
        setResults(data.description)
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
    setSelectedItem(item)
    setShowPlayer(true)
  }

  const handleBack = () => {
    setShowPlayer(false)
    setSelectedItem(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-darker via-dark to-darker">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-darker/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {showPlayer && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back to Search</span>
              </button>
            )}
            <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start">
              <div className="flex items-center gap-2">
                <Play className="text-primary" size={28} fill="currentColor" />
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  VidCore Search
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!showPlayer ? (
          <>
            {/* Search Section */}
            <div className="mb-8">
              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for movies or TV shows..."
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>
            </div>

            {/* Results Section */}
            <SearchResults
              results={results}
              loading={loading}
              onSelectItem={handleSelectItem}
              hasSearched={query.length > 0}
            />
          </>
        ) : (
          <VidCorePlayer item={selectedItem} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 py-6 text-center text-gray-500 text-sm">
        <p>Search powered by IMDb API • Streaming via VidCore</p>
      </footer>
    </div>
  )
}

export default App
