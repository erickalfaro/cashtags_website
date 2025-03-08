export const API_ENDPOINTS = {
  STOCK_API_URL: "/api/mockdata",
  TICKER_API_URL: "/api/[ticker]/ticker", // Updated
  SERIES_API_URL: "/api/[ticker]/series", // Updated
  POSTS_API_URL: "/api/[ticker]/posts",   // Updated
} as const;