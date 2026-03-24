const API_KEY = process.env.REACT_APP_SPORTMONKS_KEY;
const BASE_URL = '/api/v2.0';

const DB_NAME = 'cricket_db';
const DB_VERSION = 1;
const STORE_NAME = 'players';
const CACHE_KEY = 'all_players';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

let playersMemoryCache = null;
let countriesCache = null;
const playerCache = {};

// ── IndexedDB helpers ──────────────────────────────────────────────────────

const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });

const idbGet = async (key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = (e) => resolve(e.target.result ?? null);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch {
    return null;
  }
};

const idbSet = async (key, value) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ key, value, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch {
    // IndexedDB unavailable — in-memory cache still works
  }
};

// ── Data pruning ───────────────────────────────────────────────────────────

const pruneCareer = (career) => {
  if (!Array.isArray(career)) return [];
  return career.map((c) => ({
    type: c.type,
    batting: c.batting
      ? {
          matches: c.batting.matches,
          innings: c.batting.innings,
          runs_scored: c.batting.runs_scored,
          highest_inning_score: c.batting.highest_inning_score,
          average: c.batting.average,
          strike_rate: c.batting.strike_rate,
          not_outs: c.batting.not_outs,
          hundreds: c.batting.hundreds,
          fifties: c.batting.fifties,
          four_x: c.batting.four_x,
          six_x: c.batting.six_x,
        }
      : null,
    bowling: c.bowling
      ? {
          matches: c.bowling.matches,
          wickets: c.bowling.wickets,
          average: c.bowling.average,
          economy_rate: c.bowling.economy_rate,
          strike_rate: c.bowling.strike_rate,
        }
      : null,
  }));
};

const prunePlayer = (p) => ({
  id: p.id,
  fullname: p.fullname,
  firstname: p.firstname,
  lastname: p.lastname,
  image_path: p.image_path,
  dateofbirth: p.dateofbirth,
  gender: p.gender,
  country_id: p.country_id,
  position: p.position ? { name: p.position.name } : null,
  battingstyle: p.battingstyle,
  bowlingstyle: p.bowlingstyle,
  updated_at: p.updated_at,
  country: p.country
    ? { name: p.country.name, image_path: p.country.image_path }
    : null,
  career: pruneCareer(p.career),
});

// ── Public API ─────────────────────────────────────────────────────────────

export const fetchPlayers = async () => {
  // 1. in-memory (fastest)
  if (playersMemoryCache) {
    return { data: playersMemoryCache };
  }

  // 2. IndexedDB (fast, persists across refreshes)
  const cached = await idbGet(CACHE_KEY);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    playersMemoryCache = cached.value;
    return { data: playersMemoryCache };
  }

  // 3. API fetch (only on first load or cache expiry)
  const response = await fetch(
    `${BASE_URL}/players?api_token=${API_KEY}&include=career`
  );
  if (!response.ok) throw new Error('Failed to fetch players');

  const result = await response.json();
  const pruned = result.data.map(prunePlayer);

  playersMemoryCache = pruned;
  await idbSet(CACHE_KEY, pruned);

  return { data: playersMemoryCache };
};

export const fetchCountries = async () => {
  if (countriesCache) return countriesCache;

  const response = await fetch(`${BASE_URL}/countries?api_token=${API_KEY}`);
  if (!response.ok) throw new Error('Failed to fetch countries');

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

  if (playerCache[numericId]) return { data: playerCache[numericId] };

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
  if (!response.ok) throw new Error('Failed to fetch player');

  const result = await response.json();
  const pruned = prunePlayer(result.data);
  playerCache[numericId] = pruned;
  return { data: pruned };
};
