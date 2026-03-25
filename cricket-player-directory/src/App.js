/**
 * App.js - Main Application Component
 * 
 * This is the root component of the Cricket Player Directory React application.
 * It handles the routing between the Players listing page and the Player detail page,
 * and manages the global theme state (dark/light mode).
 * 
 * @package CricketPlayerDirectory
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import './styles/theme.css';

/**
 * App Component
 * 
 * The main entry point for the UI, responsible for setting up the router
 * and theme provider logic.
 */
function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      theme === 'light' ? 'light' : ''
    );
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<PlayersPage theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route
          path="/player/:id"
          element={<PlayerDetailPage theme={theme} toggleTheme={toggleTheme} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
