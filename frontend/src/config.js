// API Configuration
// In production, set REACT_APP_API_URL environment variable to your backend URL
// Example: REACT_APP_API_URL=https://subsidy-doc-auto.onrender.com
// For local development, leave it empty to use the proxy

// Default to Render backend if no env var is set (for deployment)
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://subsidy-doc-auto.onrender.com' : '');

export const API_ENDPOINTS = {
  LIST_FIELDS: `${API_BASE_URL}/api/list-pdf-fields`,
  FILL_PDF: `${API_BASE_URL}/api/fill-pdf`,
  GEMINI_AUTOFILL: `${API_BASE_URL}/api/gemini-autofill`,
  GEMINI_AUTOFILL_PDF: `${API_BASE_URL}/api/gemini-autofill-pdf`,
};

export default API_ENDPOINTS;

