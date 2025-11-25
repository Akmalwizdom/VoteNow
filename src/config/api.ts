// API configuration
// When VITE_API_URL is empty, use relative paths for same-origin requests
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper function to build API URLs
export function getApiUrl(path: string): string {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (API_BASE_URL) {
    // If we have a base URL, use it
    return `${API_BASE_URL}/${cleanPath}`;
  } else {
    // Otherwise use relative path (same origin)
    return `/${cleanPath}`;
  }
}
