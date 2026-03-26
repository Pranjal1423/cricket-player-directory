/**
 * api.js - Data Service for Cricket Player Directory
 * 
 * Handles all API communication with the Sportmonks Cricket API.
 * Implements a multi-layered caching strategy using:
 * 1. In-memory caching (fastest, per-session)
 * 2. IndexedDB (persistent across browser refreshes)
 * 3. Network fetching (final fallback)
 * 
 * Also provides data pruning logic to keep the application state lightweight.
 * 
 * @package CricketPlayerDirectory
 */

const BASE_URL = '/api';

const DB_NAME = 'cricket_db';
const DB_VERSION = 1;
const STORE_NAME = 'players';
const CACHE_KEY = 'all_players';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

let playersMemoryCache = null;
let countriesCache = null;
const playerCache = {};

// ── IndexedDB helpers ──────────────────────────────────────────────────────

/**
 * Opens a connection to the IndexedDB database.
 * 
 * @returns {Promise<IDBDatabase>} A promise that resolves to the database instance.
 */
const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });

/**
 * Retrieves a value from IndexedDB by key.
 * 
 * @param {string} key - The key to retrieve.
 * @returns {Promise<any|null>} The retrieved value or null if not found.
 */
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

/**
 * Sets a value in IndexedDB with a timestamp.
 * 
 * @param {string} key - The key to store.
 * @param {any} value - The value to store.
 * @returns {Promise<void>}
 */
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

/**
 * Prunes the career data to only include necessary fields.
 * 
 * @param {Array} career - The raw career data from the API.
 * @returns {Array} The pruned career data.
 */
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
          not_outs: c.batting.not_outs,
          hundreds: c.batting.hundreds,
          fifties: c.batting.fifties,
          four_x: c.batting.four_x,
          six_x: c.batting.six_x,
          balls_faced: c.batting.balls_faced, // needed for strike rate
        }
      : null,
    bowling: c.bowling
      ? {
          matches: c.bowling.matches,
          wickets: c.bowling.wickets,
          runs: c.bowling.runs ?? c.bowling.runs_conceded, // Handle both possible names
          overs: c.bowling.overs,
          balls: c.bowling.balls,
        }
      : null,
  }));
};

/**
 * Prunes the player data to only include necessary fields.
 * 
 * @param {Object} p - The raw player object from the API.
 * @returns {Object} The pruned player object.
 */
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

/**
 * Fetches all players from the API with caching.
 * 
 * @returns {Promise<{data: Array}>} A promise that resolves to an object containing the player data.
 */
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
  const response = await fetch(`${BASE_URL}/players`);
  if (!response.ok) throw new Error('Failed to fetch players');

  const result = await response.json();
  const pruned = result.data.map(prunePlayer);

  playersMemoryCache = pruned;
  await idbSet(CACHE_KEY, pruned);

  return { data: playersMemoryCache };
};

/**
 * Fetches country information from the API.
 * 
 * @returns {Promise<Object>} A promise that resolves to a map of country IDs to names.
 */
export const fetchCountries = async () => {
  if (countriesCache) return countriesCache;

  const response = await fetch(`${BASE_URL}/countries`);
  if (!response.ok) throw new Error('Failed to fetch countries');

  const result = await response.json();
  const map = {};
  result.data.forEach((c) => {
    map[c.id] = c.name;
  });
  countriesCache = map;
  return countriesCache;
};

/**
 * Fetches details for a specific player by ID.
 * 
 * @param {number|string} id - The ID of the player to fetch.
 * @returns {Promise<{data: Object}>} A promise that resolves to an object containing the player detail.
 */
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

  const response = await fetch(`${BASE_URL}/player/${numericId}`);
  if (!response.ok) throw new Error('Failed to fetch player');

  const result = await response.json();
  const pruned = prunePlayer(result.data);
  playerCache[numericId] = pruned;
  return { data: pruned };
};
