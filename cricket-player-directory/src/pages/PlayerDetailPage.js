import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPlayerById } from '../services/api';
import './PlayerDetailPage.css';

function PlayerDetailPage({ theme, toggleTheme }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        setLoading(true);
        const data = await fetchPlayerById(id);
        setPlayer(data.data);
        if (data.data.career && data.data.career.length > 0) {
          setActiveTab(data.data.career[0].type);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPlayer();
  }, [id]);

  const getUniqueTabs = (career) => {
    const seen = new Set();
    return career.filter((c) => {
      if (seen.has(c.type)) return false;
      seen.add(c.type);
      return true;
    });
  };

  const getCareerByType = (career, type) =>
    career.filter((c) => c.type === type);

  const aggregateStats = (records, statType) => {
    const agg = {};
    records.forEach((r) => {
      const stats = r[statType];
      if (!stats) return;
      Object.keys(stats).forEach((key) => {
        if (typeof stats[key] === 'number') {
          agg[key] = (agg[key] || 0) + stats[key];
        }
      });
    });
    return agg;
  };

  const getCareerTotals = (career) => {
    if (!career || career.length === 0) return null;
    let totalMatches = 0;
    let totalRuns = 0;
    let totalWickets = 0;
    let totalInnings = 0;
    career.forEach((c) => {
      if (c.batting) {
        totalMatches += c.batting.matches || 0;
        totalRuns += c.batting.runs_scored || 0;
        totalInnings += c.batting.innings || 0;
      }
      if (c.bowling) {
        totalWickets += c.bowling.wickets || 0;
      }
    });
    return { totalMatches, totalRuns, totalWickets, totalInnings };
  };

  if (loading)
    return (
      <div className="detail-loading">
        <span>🏏</span>
        <p>Loading Player...</p>
      </div>
    );

  if (error)
    return (
      <div className="detail-error">
        <p>Something went wrong: {error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );

  if (!player)
    return (
      <div className="detail-error">
        <p>Player not found</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );

  const uniqueTabs = player.career ? getUniqueTabs(player.career) : [];
  const activeCareer = player.career
    ? getCareerByType(player.career, activeTab)
    : [];
  const battingStats = aggregateStats(activeCareer, 'batting');
  const bowlingStats = aggregateStats(activeCareer, 'bowling');
  const totals = getCareerTotals(player.career);

  const battingRows = [
    { label: 'Matches', key: 'matches' },
    { label: 'Innings', key: 'innings' },
    { label: 'Runs Scored', key: 'runs_scored' },
    { label: 'Highest Score', key: 'highest_inning_score' },
    { label: 'Average', key: 'average', decimals: 2 },
    { label: 'Strike Rate', key: 'strike_rate', decimals: 2 },
    { label: 'Not Outs', key: 'not_outs' },
    { label: '100s', key: 'hundreds' },
    { label: '50s', key: 'fifties' },
    { label: '4s', key: 'four_x' },
    { label: '6s', key: 'six_x' },
  ];

  const bowlingRows = [
    { label: 'Matches', key: 'matches' },
    { label: 'Wickets', key: 'wickets' },
    { label: 'Average', key: 'average', decimals: 2 },
    { label: 'Economy', key: 'economy_rate', decimals: 2 },
    { label: 'Strike Rate', key: 'strike_rate', decimals: 2 },
  ];

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>{player.fullname}</h1>
        <div className="detail-header-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="detail-hero">
        <div className="detail-hero-bg" />
        {player.image_path && (
          <img
            src={player.image_path}
            alt={player.fullname}
            className="detail-hero-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <div className="detail-hero-content">
          {player.country && (
            <div className="detail-hero-country">
              <img
                src={player.country.image_path}
                alt={player.country.name}
                className="country-flag"
              />
              <span className="country-name">{player.country.name}</span>
            </div>
          )}
          <div className="detail-hero-name">{player.fullname}</div>
          <div className="detail-hero-tags">
            {player.position && (
              <span className="hero-tag hero-tag-gold">
                {player.position.name}
              </span>
            )}
            {player.battingstyle && (
              <span className="hero-tag hero-tag-outline">
                {player.battingstyle}
              </span>
            )}
            {player.bowlingstyle && (
              <span className="hero-tag hero-tag-outline">
                {player.bowlingstyle}
              </span>
            )}
          </div>
          <div className="detail-hero-info">
            <div className="detail-hero-info-row">
              <span className="detail-hero-info-label">Date of Birth</span>
              <span className="detail-hero-info-value">
                {player.dateofbirth ?? 'N/A'}
              </span>
            </div>
            <div className="detail-hero-info-row">
              <span className="detail-hero-info-label">Gender</span>
              <span className="detail-hero-info-value">
                {player.gender === 'm' ? 'Male' : 'Female'}
              </span>
            </div>
            {player.country && (
              <div className="detail-hero-info-row">
                <span className="detail-hero-info-label">Country</span>
                <span className="detail-hero-info-value">
                  {player.country.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="detail-body">
        {totals && (
          <div className="career-totals">
            <div className="total-card">
              <span className="total-value">{totals.totalMatches}</span>
              <span className="total-label">Total Matches</span>
            </div>
            <div className="total-card">
              <span className="total-value">{totals.totalRuns}</span>
              <span className="total-label">Total Runs</span>
            </div>
            <div className="total-card">
              <span className="total-value">{totals.totalInnings}</span>
              <span className="total-label">Total Innings</span>
            </div>
            <div className="total-card">
              <span className="total-value">{totals.totalWickets}</span>
              <span className="total-label">Total Wickets</span>
            </div>
          </div>
        )}

        {uniqueTabs.length > 0 ? (
          <div className="career-section">
            <div className="career-header">
              <span className="career-title">Career Statistics</span>
              <div className="career-tabs">
                {uniqueTabs.map((c) => (
                  <button
                    key={c.type}
                    className={`career-tab ${activeTab === c.type ? 'active' : ''}`}
                    onClick={() => setActiveTab(c.type)}
                  >
                    {c.type}
                  </button>
                ))}
              </div>
            </div>

            <div className="career-body">
              {Object.keys(battingStats).length > 0 && (
                <>
                  <p className="stats-section-title">Batting</p>
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Stat</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {battingRows.map(({ label, key, decimals }) =>
                        battingStats[key] !== undefined ? (
                          <tr key={key}>
                            <td>{label}</td>
                            <td>
                              {decimals
                                ? battingStats[key].toFixed(decimals)
                                : battingStats[key]}
                            </td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {Object.keys(bowlingStats).length > 0 && (
                <>
                  <p
                    className="stats-section-title"
                    style={{ marginTop: '24px' }}
                  >
                    Bowling
                  </p>
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Stat</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlingRows.map(({ label, key, decimals }) =>
                        bowlingStats[key] !== undefined ? (
                          <tr key={key}>
                            <td>{label}</td>
                            <td>
                              {decimals
                                ? bowlingStats[key].toFixed(decimals)
                                : bowlingStats[key]}
                            </td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {Object.keys(battingStats).length === 0 &&
                Object.keys(bowlingStats).length === 0 && (
                  <p className="no-stats">
                    No statistics available for this format
                  </p>
                )}
            </div>
          </div>
        ) : (
          <div className="career-section">
            <div className="career-header">
              <span className="career-title">Career Statistics</span>
            </div>
            <p className="no-stats">No career data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerDetailPage;
