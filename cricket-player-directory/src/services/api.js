import LZString from 'lz-string';

const API_KEY = process.env.REACT_APP_SPORTMONKS_KEY;
const BASE_URL = '/api/v2.0';

const CACHE_KEY = 'cricket_players_cache';
const CACHE_EXPIRY_KEY = 'cricket_players_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

let playersMemoryCache = null;
let countriesCache = null;
const playerCache = {};

const getPlayersFromStorage = () => {
  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!expiry || Date.now() > parseInt(expiry)) return null;
    const compressed = localStorage.getItem(CACHE_KEY);
    if (!compressed) return null;
    const decompressed = LZString.decompress(compressed);
    return JSON.parse(decompressed);
  } catch {
    return null;
  }
};

const savePlayersToStorage = (players) => {
  try {
    const compressed = LZString.compress(JSON.stringify(players));
    localStorage.setItem(CACHE_KEY, compressed);
    localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));
  } catch {
    // localStorage full or unavailable — in-memory cache still works
  }
};

export const fetchPlayers = async () => {
  // 1. check in-memory first (fastest)
  if (playersMemoryCache) {
    return { data: playersMemoryCache };
  }

  // 2. check localStorage (fast, persists across refreshes)
  const stored = getPlayersFromStorage();
  if (stored) {
    playersMemoryCache = stored;
    return { data: playersMemoryCache };
  }

  // 3. fetch from API (slow, only on first load or cache expiry)
  const response = await fetch(
    `${BASE_URL}/players?api_token=${API_KEY}&include=career`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch players');
  }
  const result = await response.json();
  playersMemoryCache = result.data;
  savePlayersToStorage(playersMemoryCache);
  return { data: playersMemoryCache };
};

export const fetchCountries = async () => {
  if (countriesCache) {
    return countriesCache;
  }
  const response = await fetch(`${BASE_URL}/countries?api_token=${API_KEY}`);
  if (!response.ok) {
    throw new Error('Failed to fetch countries');
  }
  const result = await response.json();
  const map = {};
  result.data.forEach((c) => {
    map[c.id] = c.name;
  });
  countriesCache = map;
  return countriesCache;
};

export const fetchPlayerById = async (id) => {
  const numericId = parseInt(id);
  if (playerCache[numericId]) {
    return { data: playerCache[numericId] };
  }
  if (playersMemoryCache) {
    const found = playersMemoryCache.find((p) => p.id === numericId);
    if (found && found.career && found.country) {
      playerCache[numericId] = found;
      return { data: found };
    }
  }
  const response = await fetch(
    `${BASE_URL}/players/${numericId}?api_token=${API_KEY}&include=career,country`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch player');
  }
  const result = await response.json();
  playerCache[numericId] = result.data;
  return { data: result.data };
};
