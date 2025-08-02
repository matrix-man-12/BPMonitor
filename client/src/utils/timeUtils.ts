// Time utility functions for IST (Indian Standard Time) - Client Side

/**
 * Get current IST date
 * @returns {Date} Current date in IST
 */
export const getCurrentIST = (): Date => {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(now.getTime() + istOffset);
};

/**
 * Convert UTC date to IST
 * @param {Date | string} utcDate - UTC date to convert
 * @returns {Date | null} Date in IST
 */
export const utcToIST = (utcDate: Date | string): Date | null => {
  if (!utcDate) return null;
  const date = new Date(utcDate);
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffset);
};

/**
 * Convert IST date to UTC for API calls
 * @param {Date | string} istDate - IST date to convert
 * @returns {Date | null} Date in UTC
 */
export const istToUTC = (istDate: Date | string): Date | null => {
  if (!istDate) return null;
  const date = new Date(istDate);
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() - istOffset);
};

/**
 * Format date to IST string
 * @param {Date | string} date - Date to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted date string in IST
 */
export const formatDateIST = (
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (!date) return '';
  const istDate = utcToIST(date);
  if (!istDate) return '';
  
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
 * @param {Date | string} date - Date to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted time string in IST
 */
export const formatTimeIST = (
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (!date) return '';
  const istDate = utcToIST(date);
  if (!istDate) return '';
  
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
 * @param {Date | string} date - Date to format
 * @returns {string} Formatted datetime string in IST
 */
export const formatDateTimeIST = (date: Date | string): string => {
  if (!date) return '';
  return `${formatDateIST(date)} ${formatTimeIST(date)}`;
};

/**
 * Get IST timezone offset string
 * @returns {string} IST timezone offset (+05:30)
 */
export const getISTOffset = (): string => {
  return '+05:30';
};

/**
 * Convert datetime-local input to ISO string for API
 * @param {string} datetimeLocal - datetime-local input value
 * @returns {string} ISO string for API
 */
export const datetimeLocalToISO = (datetimeLocal: string): string => {
  if (!datetimeLocal) return '';
  
  // datetime-local input gives us local time in the user's timezone
  // Create a Date object from the local datetime string
  const localDate = new Date(datetimeLocal);
  
  // Return ISO string - this will automatically convert to UTC based on user's timezone
  return localDate.toISOString();
};

/**
 * Convert UTC ISO string to datetime-local input format in IST
 * @param {Date | string} utcDate - UTC date from API
 * @returns {string} datetime-local input value in IST
 */
export const utcToDatetimeLocal = (utcDate: Date | string): string => {
  if (!utcDate) return '';
  const istDate = utcToIST(utcDate);
  if (!istDate) return '';
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Get current datetime-local value in IST
 * @returns {string} Current datetime in datetime-local format (IST)
 */
export const getCurrentDatetimeLocal = (): string => {
  const now = new Date();
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm) in browser's local time
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Format date for chart display
 * @param {Date | string} date - Date to format
 * @returns {string} Formatted date for charts
 */
export const formatChartDate = (date: Date | string): string => {
  return formatDateIST(date, {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Check if date is today (IST)
 * @param {Date | string} date - Date to check
 * @returns {boolean} True if date is today in IST
 */
export const isToday = (date: Date | string): boolean => {
  if (!date) return false;
  const istDate = utcToIST(date);
  const today = getCurrentIST();
  
  if (!istDate) return false;
  
  return istDate.toDateString() === today.toDateString();
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date | string} date - Date to get relative time for
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date: Date | string): string => {
  if (!date) return '';
  
  const istDate = utcToIST(date);
  const now = getCurrentIST();
  
  if (!istDate) return '';
  
  const diffMs = now.getTime() - istDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDateIST(istDate);
}; 