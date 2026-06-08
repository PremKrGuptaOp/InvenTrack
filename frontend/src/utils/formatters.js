/**
 * InvenTrack Frontend Utilities & Formatters
 * 
 * Centrally defined helpers for formatting currency, dates, and generating
 * dynamic avatar initials and matching visual gradients.
 */

/**
 * Format a number as USD currency.
 * @param {number|string} val - Value to format.
 * @returns {string} Formatted currency (e.g., "$1,234.56").
 */
export function formatCurrency(val) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

/**
 * Format an ISO date-time string into a human-readable local date.
 * @param {string} dateStr - ISO date string.
 * @returns {string} Formatted date (e.g., "6/8/2026").
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US');
}

/**
 * Format an ISO date-time string into a detailed date and time.
 * @param {string} dateStr - ISO date string.
 * @returns {string} Formatted detail string (e.g., "Jun 8, 2026 — 11:37 PM").
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${formattedDate} — ${formattedTime}`;
}

/**
 * Generate visual properties (initials and matching HSL gradient class) based on a name string.
 * Helps humanize items and profile cards with consistent color distributions.
 * 
 * @param {string} name - Name of product or customer.
 * @param {string} type - 'product' or 'customer' for gradient selections.
 * @returns {Object} Object containing { char, selectedGrad }
 */
export function getAvatarDetails(name, type = 'product') {
  const char = name ? name.trim().charAt(0).toUpperCase() : '?';
  const charCode = char.charCodeAt(0);
  
  const productGradients = ['blue', 'emerald', 'purple', 'amber', 'rose', 'cyan'];
  const customerGradients = ['purple', 'blue', 'cyan', 'emerald', 'amber', 'rose'];
  
  const grads = type === 'customer' ? customerGradients : productGradients;
  const selectedGrad = grads[charCode % grads.length];

  return { char, selectedGrad };
}
