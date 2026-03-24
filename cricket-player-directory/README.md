# Cricket Player Directory

A React app that lets you browse and explore cricket players using the SportMonks Cricket API.

---

## What it does

**Players Listing Page**
- Shows 12 players per page with pagination
- Search players by last name (debounced, real-time)
- Filter by Country, Position, and Career Tournament Type (T20I, ODI, T20, Test)
- Sort by First Name, ID, or Recently Updated — ascending or descending
- Shareable URLs — filters and page number are saved in the URL
- Active filters shown as chips with individual remove buttons
- Skeleton loading, empty state, and error state with retry

**Player Detail Page**
- Hero banner with player image, name, country flag, position, batting/bowling style
- Career stats broken down by tournament type (batting + bowling tables)
- Stats aggregated across seasons of the same type
- Back button preserves your filters from the listing page
- On mobile — image stacks on top, content below (clean layout)

---

## Tech used

- React 19
- React Router v7
- SportMonks Cricket API v2.0
- ESLint + Prettier
- CSS Variables for dark/light theming
- lz-string — for compressing player data before storing in localStorage

---

## Getting started

**1. Clone the repo and switch to the right branch**

```bash
git clone https://github.com/rtCamp/trainee-pranjal-wadhwani.git
cd trainee-pranjal-wadhwani/cricket-player-directory
git checkout feature/react-cricket-directory
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up your API key**

Create a `.env` file in the `cricket-player-directory` folder:

```
REACT_APP_SPORTMONKS_KEY=your_api_key_here
```

You can get a free API key from [sportmonks.com](https://sportmonks.com).

A `.env.example` file is included in the repo for reference.

**4. Start the app**

```bash
npm start
```

Opens at `http://localhost:3000`

---

## Caching

The app uses a three-layer caching strategy:

1. **In-memory** — fastest, lasts for the current session
2. **localStorage with lz-string compression** — persists across refreshes, expires after 24 hours
3. **API fetch** — only happens on first load or after cache expiry

This means the slow initial load (22,000+ players) only happens once per day. Every refresh after that is instant.

---

## API setup note

The app proxies API requests through `setupProxy.js` (using `http-proxy-middleware`) to avoid CORS issues in development. On Vercel, this is handled via `vercel.json` rewrites.

---

## Folder structure

```
src/
├── hooks/
│   └── useDebounce.js         custom debounce hook
├── pages/
│   ├── PlayersPage.js         listing page
│   ├── PlayersPage.css
│   ├── PlayerDetailPage.js    detail page
│   └── PlayerDetailPage.css
├── services/
│   └── api.js                 API calls with caching
├── styles/
│   └── theme.css              CSS variables for dark/light mode
├── App.js                     routing + theme state
├── index.js
└── setupProxy.js              dev CORS proxy
```

---

## Linting and formatting

```bash
npx eslint src/           # check for lint errors
npx prettier --check src/ # check formatting
npx prettier --write src/ # auto-fix formatting
```

---

## Deployment

The app is deployed on Vercel from a personal GitHub mirror of this repo.

Live URL: _to be added in PR description_

---

## Notes

- The API returns all 22,000+ players in a single request — first load takes a few seconds. Every refresh after that is instant thanks to localStorage caching.
- The API key is exposed in the browser network tab — this is a known limitation of client-side apps without a backend proxy.
