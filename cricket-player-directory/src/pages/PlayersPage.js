/**
 * PlayersPage.js - Cricket Players Listing Page
 * 
 * Displays a list of cricket players with search, filtering, and sorting capabilities.
 * Implements pagination and a responsive grid layout.
 * 
 * @package CricketPlayerDirectory
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { fetchPlayers, fetchCountries } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import './PlayersPage.css';

const PLAYERS_PER_PAGE = 12;

/**
 * PlayersPage Component
 * 
 * @param {Object} props - Component props.
 * @param {string} props.theme - Current theme ('dark' or 'light').
 * @param {Function} props.toggleTheme - Function to toggle the application theme.
 * @returns {JSX.Element} The rendered PlayersPage component.
 */
function PlayersPage({ theme, toggleTheme }) {
  const [players, setPlayers] = useState([]);
  const [countries, setCountries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'firstname';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const countryFilter = searchParams.get('country') || '';
  const positionFilter = searchParams.get('position') || '';
  const tournamentFilter = searchParams.get('tournament') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const debouncedSearch = useDebounce(search, 300);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [playersData, countriesData] = await Promise.all([
        fetchPlayers(),
        fetchCountries(),
      ]);
      setPlayers(playersData.data);
      setCountries(countriesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadData();
    return () => {
      mounted = false;
    };
  }, [loadData]);

  const uniqueCountries = useMemo(() => {
    const ids = [...new Set(players.map((p) => p.country_id))].filter(Boolean);
    return ids
      .map((id) => ({ id, name: countries[id] || `Country ${id}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players, countries]);

  const uniquePositions = useMemo(() => {
    return [
      ...new Set(players.map((p) => p.position?.name).filter(Boolean)),
    ].sort();
  }, [players]);

  const uniqueTournamentTypes = useMemo(() => {
    const types = new Set();
    players.forEach((p) => {
      if (p.career) p.career.forEach((c) => types.add(c.type));
    });
    return [...types].sort();
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        const matchesSearch = p.lastname
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());
        const matchesCountry = countryFilter
          ? p.country_id === parseInt(countryFilter)
          : true;
        const matchesPosition = positionFilter
          ? p.position?.name === positionFilter
          : true;
        const matchesTournament = tournamentFilter
          ? p.career?.some((c) => c.type === tournamentFilter)
          : true;
        return (
          matchesSearch &&
          matchesCountry &&
          matchesPosition &&
          matchesTournament
        );
      })
      .sort((a, b) => {
        const valA = a[sortBy] ?? '';
        const valB = b[sortBy] ?? '';
        if (sortOrder === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });
  }, [
    players,
    debouncedSearch,
    sortBy,
    sortOrder,
    countryFilter,
    positionFilter,
    tournamentFilter,
  ]);

  const totalPages = Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE);

  const currentPlayers = filteredPlayers.slice(
    (page - 1) * PLAYERS_PER_PAGE,
    page * PLAYERS_PER_PAGE
  );

  const updateParam = (key, value) => {
    const params = Object.fromEntries(searchParams.entries());
    if (value) {
      params[key] = value;
    } else {
      delete params[key];
    }
    params.page = '1';
    setSearchParams(params);
  };

  const setPage = (newPage) => {
    const params = Object.fromEntries(searchParams.entries());
    params.page = String(newPage);
    setSearchParams(params);
  };

  const handleReset = () => setSearchParams({});

  const hasActiveFilters =
    search || countryFilter || positionFilter || tournamentFilter;

  const activeChips = [
    search && { key: 'search', label: `Search: "${search}"`, param: 'search' },
    countryFilter && {
      key: 'country',
      label: `Country: ${countries[countryFilter] || countryFilter}`,
      param: 'country',
    },
    positionFilter && {
      key: 'position',
      label: `Position: ${positionFilter}`,
      param: 'position',
    },
    tournamentFilter && {
      key: 'tournament',
      label: `Tournament: ${tournamentFilter}`,
      param: 'tournament',
    },
  ].filter(Boolean);

  const removeChip = (param) => {
    const params = Object.fromEntries(searchParams.entries());
    delete params[param];
    params.page = '1';
    setSearchParams(params);
  };

  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }
    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    rangeWithDots.push(...range);
    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }
    return rangeWithDots;
  };

  if (loading)
    return (
      <div className="players-page">
        <div className="players-header">
          <span className="header-icon">🏏</span>
          <h1>Cricket Players</h1>
        </div>
        <div className="players-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="player-card skeleton-card">
              <div className="skeleton-image" />
              <div className="player-info">
                <div className="skeleton-line wide" />
                <div className="skeleton-line medium" />
                <div className="skeleton-line narrow" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="error">
        <p>Something went wrong: {error}</p>
        <button onClick={loadData}>Try Again</button>
      </div>
    );

  return (
    <div className="players-page">
      <div className="players-header">
        <span className="header-icon">🏏</span>
        <h1>Cricket Players</h1>
        <div className="header-right">
          <span className="players-count">
            {filteredPlayers.length} players
          </span>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search by last name..."
          value={search}
          onChange={(e) => updateParam('search', e.target.value)}
          aria-label="Search players by last name"
        />
        <select
          className="control-select"
          onChange={(e) => updateParam('country', e.target.value)}
          value={countryFilter}
          aria-label="Filter by country"
        >
          <option value="">All Countries</option>
          {uniqueCountries.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="control-select"
          onChange={(e) => updateParam('position', e.target.value)}
          value={positionFilter}
          aria-label="Filter by position"
        >
          <option value="">All Positions</option>
          {uniquePositions.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
        <select
          className="control-select"
          onChange={(e) => updateParam('tournament', e.target.value)}
          value={tournamentFilter}
          aria-label="Filter by tournament type"
        >
          <option value="">All Tournament Types</option>
          {uniqueTournamentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          className="control-select"
          onChange={(e) => updateParam('sortBy', e.target.value)}
          value={sortBy}
          aria-label="Sort players by"
        >
          <option value="firstname">Sort: First Name</option>
          <option value="id">Sort: ID</option>
          <option value="updated_at">Sort: Recently Updated</option>
        </select>
        <select
          className="control-select"
          onChange={(e) => updateParam('sortOrder', e.target.value)}
          value={sortOrder}
          aria-label="Sort order"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        {hasActiveFilters && (
          <button className="reset-btn" onClick={handleReset}>
            Reset All
          </button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="filter-chips">
          {activeChips.map((chip) => (
            <span key={chip.key} className="chip">
              {chip.label}
              <button
                className="chip-remove"
                onClick={() => removeChip(chip.param)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="results-bar">
        Showing <strong>{currentPlayers.length}</strong> of{' '}
        <strong>{filteredPlayers.length}</strong> players
        {filteredPlayers.length !== players.length && (
          <span> (filtered from {players.length} total)</span>
        )}
      </div>

      {currentPlayers.length === 0 ? (
        <div className="empty-state">
          <span>🏏</span>
          <p>No players found</p>
          <button className="reset-btn" onClick={handleReset}>
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="players-grid">
            {currentPlayers.map((player) => (
              <div
                key={player.id}
                className="player-card"
                onClick={() => navigate(`/player/${player.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && navigate(`/player/${player.id}`)
                }
              >
                <div className="player-image-wrap">
                  {player.image_path && !player.imgError ? (
                    <img
                      src={player.image_path}
                      alt={player.fullname}
                      className="player-image"
                      loading="lazy"
                      onError={() => {
                        setPlayers((prev) =>
                          prev.map((p) =>
                            p.id === player.id ? { ...p, imgError: true } : p
                          )
                        );
                      }}
                    />
                  ) : (
                    <span className="player-image-placeholder">🏏</span>
                  )}
                </div>
                <div className="player-info">
                  <p className="player-name">{player.fullname}</p>
                  {player.position && (
                    <span className="player-position">
                      {player.position.name}
                    </span>
                  )}
                  <p className="player-country">
                    {countries[player.country_id] || 'Unknown'}
                  </p>
                  <p className="player-dob">
                    DOB: {player.dateofbirth ?? 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ←
            </button>
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="pagination-dots">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  className={`pagination-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            )}
            <button
              className="pagination-btn"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

PlayersPage.propTypes = {
  theme: PropTypes.string.isRequired,
  toggleTheme: PropTypes.func.isRequired,
};

export default PlayersPage;
