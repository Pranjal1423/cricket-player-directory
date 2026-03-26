/**
 * setupProxy.js - Development Proxy Configuration
 * 
 * Configures a proxy middleware to handle API requests in development environment,
 * bypassing Cross-Origin Resource Sharing (CORS) issues by proxying calls
 * to the Sportmonks Cricket API.
 * 
 * @package CricketPlayerDirectory
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Configures the middleware.
 * 
 * @param {Express.Application} app - The Express application instance.
 */
module.exports = function (app) {
  const API_KEY = process.env.REACT_APP_SPORTMONKS_KEY;

  // 1. Fetch Players with career data
  app.use(
    '/api/players',
    createProxyMiddleware({
      target: `https://cricket.sportmonks.com/api/v2.0/players?api_token=${API_KEY}&include=career`,
      changeOrigin: true,
      pathRewrite: { '^/api/players': '' },
    })
  );

  // 2. Fetch Countries list
  app.use(
    '/api/countries',
    createProxyMiddleware({
      target: `https://cricket.sportmonks.com/api/v2.0/countries?api_token=${API_KEY}`,
      changeOrigin: true,
      pathRewrite: { '^/api/countries': '' },
    })
  );

  // 3. Fetch specific player by ID with expanded details
  app.use(
    '/api/player',
    createProxyMiddleware({
      target: `https://cricket.sportmonks.com/api/v2.0/players`,
      changeOrigin: true,
      pathRewrite: (path) => {
        const id = path.split('/').pop();
        return `/${id}?api_token=${API_KEY}&include=career,country`;
      },
    })
  );
};
