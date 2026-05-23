import { useState } from 'react'
import { Play, Tv, ChevronDown, ChevronUp } from 'lucide-react'

function VidCorePlayer({ item }) {
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [showSeasons, setShowSeasons] = useState(false)
  const [showEpisodes, setShowEpisodes] = useState(false)

  const imdbId = item['#IMDB_ID']
  const isTV = item['#YEAR'] >= 2000 && item['#ACTORS']?.includes(',')

  const generateSeasons = () => Array.from({ length: 10 }, (_, i) => i + 1)
  const generateEpisodes = () => Array.from({ length: 24 }, (_, i) => i + 1)

  const playerUrl = isTV
    ? `https://vidcore.net/tv/${imdbId}/${season}/${episode}`
    : `https://vidcore.net/movie/${imdbId}`

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{item['#TITLE']}</h1>
          <div className="flex flex-wrap items-center gap-3 text-gray-400">
            <span className="px-3 py-1 bg-white/10 rounded-full text-sm">{item['#YEAR']}</span>
            <span className="text-sm">IMDb ID: {item['#IMDB_ID']}</span>
            {isTV && (
              <span className="flex items-center gap-1 text-sm">
                <Tv size={16} />
                TV Series
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TV Show Controls */}
      {isTV && (
        <div className="flex flex-wrap gap-4">
          {/* Season Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSeasons(!showSeasons)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <span>Season {season}</span>
              {showSeasons ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showSeasons && (
              <div className="absolute top-full left-0 mt-2 bg-dark border border-white/20 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto scrollbar-hide">
                {generateSeasons().map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSeason(s)
                      setEpisode(1)
                      setShowSeasons(false)
                    }}
                    className="block w-full px-4 py-2 text-left hover:bg-white/10 transition-colors"
                  >
                    Season {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Episode Selector */}
          <div className="relative">
            <button
              onClick={() => setShowEpisodes(!showEpisodes)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <span>Episode {episode}</span>
              {showEpisodes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showEpisodes && (
              <div className="absolute top-full left-0 mt-2 bg-dark border border-white/20 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto scrollbar-hide">
                {generateEpisodes().map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      setEpisode(e)
                      setShowEpisodes(false)
                    }}
                    className="block w-full px-4 py-2 text-left hover:bg-white/10 transition-colors"
                  >
                    Episode {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Player */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={playerUrl}
          className="absolute top-0 left-0 w-full h-full rounded-xl border border-white/10"
          frameBorder="0"
          allowFullScreen
          allow="encrypted-media"
          title="VidCore Player"
        />
      </div>

      {/* Info */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Play size={20} className="text-primary" />
          Streaming Info
        </h3>
        <div className="space-y-2 text-gray-400 text-sm">
          <p><strong className="text-white">Source:</strong> VidCore.net</p>
          <p><strong className="text-white">IMDb URL:</strong> <a href={item['#IMDB_URL']} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{item['#IMDB_URL']}</a></p>
          {item['#ACTORS'] && (
            <p><strong className="text-white">Cast:</strong> {item['#ACTORS']}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default VidCorePlayer
