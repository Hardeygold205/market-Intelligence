/**
 * Market Price Intelligence Configuration
 * Extension Africa
 */

export const CONFIG = {
  // Proxy URL from Google Apps Script web app
  DATA_URL: 'https://script.google.com/macros/s/AKfycbzr8zAVIHuztjiaUrVa5Q57shtl2O_6SBq2OcKhFggiyqR3BpgpIkLQhjadfQaKtg/exec',
  AUTO_REFRESH_MINUTES: 10,
  APP_NAME: 'MARKET PRICE INTELLIGENCE',
  ORGANIZATION: 'EXTENSION AFRICA',
  TAGLINE: 'Agricultural commodity and farm-input prices collected across Nigerian markets',
  LOCAL_STORAGE_CACHE_KEY: 'exaf_market_price_cache_v1',
  LOCAL_STORAGE_TOUR_KEY: 'exaf_tour_dismissed_v1',
  
  // EXAF Brand Palette (Strict)
  COLORS: {
    primary: '#206542',      // Forest Green (Primary)
    accent: '#B3C03E',       // Olive Green (Accent)
    text: '#000000',         // Black
    background: '#FFFFFF',   // White
    
    // Derived tints
    lightForest: '#E8F0EC',  // For card backgrounds / hover
    lightOlive: '#F3F6D9',   // For notices, highlight cards
    borderLight: '#E2E8F0',  // Neutral border
    borderMedium: '#CBD5E1', // Neutral border darker
    mutedText: '#475569',    // Neutral text for captions
    
    // Chart series palette (strictly forest & olive tints/shades)
    chartSeries: [
      '#206542', // Forest
      '#B3C03E', // Olive
      '#15432C', // Deep Forest
      '#757F26', // Deep Olive
      '#359463', // Mid Forest
      '#D5DF7A', // Light Olive
    ]
  }
} as const;
