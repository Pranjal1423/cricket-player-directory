const API_KEY = process.env.REACT_APP_SPORTMONKS_KEY;
const BASE_URL = '/api/v2.0';

let playersCache = null;
let countriesCache = null;
const playerCache = {};

export const fetchPlayers = async () => {
  if (playersCache) {
    return { data: playersCache };
  }
  const response = await fetch(
    `${BASE_URL}/players?api_token=${API_KEY}&include=career`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch players');
  }
  const result = await response.json();
  playersCache = result.data;
  return { data: playersCache };
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

  if (playersCache) {
    const found = playersCache.find((p) => p.id === numericId);
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
