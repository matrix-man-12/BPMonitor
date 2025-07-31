// Time utility functions for IST (Indian Standard Time)

/**
 * Get current IST date
 * @returns {Date} Current date in IST
 */
const getCurrentIST = () => {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(now.getTime() + istOffset);
};

/**
 * Convert UTC date to IST
 * @param {Date} utcDate - UTC date to convert
 * @returns {Date} Date in IST
 */
const utcToIST = (utcDate) => {
  if (!utcDate) return null;
  const date = new Date(utcDate);
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffset);
};

/**
 * Convert IST date to UTC for database storage
 * @param {Date} istDate - IST date to convert
 * @returns {Date} Date in UTC
 */
const istToUTC = (istDate) => {
  if (!istDate) return null;
  const date = new Date(istDate);
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() - istOffset);
};

/**
 * Format date to IST string
 * @param {Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string in IST
 */
const formatDateIST = (date, options = {}) => {
  if (!date) return '';
  const istDate = utcToIST(date);
  return istDate.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  });
};

/**
 * Format time to IST string
 * @param {Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string in IST
 */
const formatTimeIST = (date, options = {}) => {
  if (!date) return '';
  const istDate = utcToIST(date);
  return istDate.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
};

/**
 * Format datetime to IST string
 * @param {Date} date - Date to format
 * @returns {string} Formatted datetime string in IST
 */
const formatDateTimeIST = (date) => {
  if (!date) return '';
  return `${formatDateIST(date)} ${formatTimeIST(date)}`;
};

/**
 * Get IST timezone offset string
 * @returns {string} IST timezone offset (+05:30)
 */
const getISTOffset = () => {
  return '+05:30';
};

/**
 * Convert datetime-local input to UTC Date for storage
 * @param {string} datetimeLocal - datetime-local input value
 * @returns {Date} UTC date for database storage
 */
const datetimeLocalToUTC = (datetimeLocal) => {
  if (!datetimeLocal) return null;
  // datetime-local input gives us local time, we need to treat it as IST
  const localDate = new Date(datetimeLocal);
  // Subtract IST offset to get UTC
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(localDate.getTime() - istOffset);
};

/**
 * Convert UTC date to datetime-local input format in IST
 * @param {Date} utcDate - UTC date from database
 * @returns {string} datetime-local input value in IST
 */
const utcToDatetimeLocal = (utcDate) => {
  if (!utcDate) return '';
  const istDate = utcToIST(utcDate);
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  return istDate.toISOString().slice(0, 16);
};

module.exports = {
  getCurrentIST,
  utcToIST,
  istToUTC,
  formatDateIST,
  formatTimeIST,
  formatDateTimeIST,
  getISTOffset,
  datetimeLocalToUTC,
  utcToDatetimeLocal
}; 