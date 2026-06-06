/**
 * Custom mappings for TV shows where TMDB data is incorrect or structured differently 
 * from what streaming providers (like VidCore) expect.
 */

export const TV_MAPPINGS = {
  95479: { // Jujutsu Kaisen
    name: "JUJUTSU KAISEN",
    number_of_seasons: 3,
    seasons: {
      1: { episode_count: 24, start_index: 0 },
      2: { episode_count: 23, start_index: 24 },
      3: { episode_count: 12, start_index: 47 }
    }
  }
};

/**
 * Returns mapped TV details if a mapping exists for the given TMDB ID.
 */
export const getMappedTVDetails = (data) => {
  if (!data || !data.id) return data;
  
  const mapping = TV_MAPPINGS[data.id];
  if (mapping) {
    return {
      ...data,
      number_of_seasons: mapping.number_of_seasons,
      original_number_of_seasons: data.number_of_seasons
    };
  }
  return data;
};

/**
 * Returns mapped season details.
 * For mapped shows, it extracts the correct episodes from the "bulk" season (usually S1).
 */
export const getMappedSeasonDetails = (tmdbId, seasonNumber, seasonData, allSeason1Data) => {
  if (!tmdbId) return seasonData;
  
  const mapping = TV_MAPPINGS[tmdbId];
  if (mapping && mapping.seasons[seasonNumber]) {
    const sMapping = mapping.seasons[seasonNumber];
    
    // If we have the bulk data (Season 1) and we're looking for a virtual season
    if (allSeason1Data && allSeason1Data.episodes) {
      const episodes = allSeason1Data.episodes.slice(
        sMapping.start_index, 
        sMapping.start_index + sMapping.episode_count
      );
      
      return {
        ...allSeason1Data,
        season_number: seasonNumber,
        episodes: episodes.map((ep, i) => ({
          ...ep,
          episode_number: i + 1,
          original_episode_number: ep.episode_number
        }))
      };
    }
  }
  return seasonData;
};
