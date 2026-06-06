/**
 * API Cache Utility
 * Stores and retrieves API responses to reduce redundant network requests.
 */

const cache = new Map();
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

export const apiCache = {
  /**
   * Get data from cache
   * @param {string} key - The cache key (usually the full URL)
   * @returns {any|null} - The cached data or null if not found/expired
   */
  get(key) {
    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiry) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  },

  /**
   * Set data in cache
   * @param {string} key - The cache key
   * @param {any} data - The data to store
   * @param {number} ttl - Time-to-live in milliseconds
   */
  set(key, data, ttl = DEFAULT_TTL) {
    const expiry = Date.now() + ttl;
    cache.set(key, { data, expiry });
  },

  /**
   * Clear the entire cache
   */
  clear() {
    cache.clear();
  },

  /**
   * Helper to fetch data with caching
   * @param {string} url - The URL to fetch
   * @param {object} options - Fetch options
   * @returns {Promise<any>}
   */
  async fetchCached(url, options = {}) {
    const cachedData = this.get(url);
    if (cachedData) {
      return cachedData;
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    // Only cache successful responses
    if (response.ok) {
      this.set(url, data);
    }
    
    return data;
  }
};
