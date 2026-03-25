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
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://cricket.sportmonks.com',
      changeOrigin: true,
    })
  );
};
