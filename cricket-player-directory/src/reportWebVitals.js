/**
 * reportWebVitals.js - Web Vitals Monitoring
 * 
 * Provides a utility to measure important performance metrics for the user experience.
 * 
 * @package CricketPlayerDirectory
 */

/**
 * Measures performance metrics.
 * 
 * @param {Function} onPerfEntry - Callback function to handle the performance metrics.
 */
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
