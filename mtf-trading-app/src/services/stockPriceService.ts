// Stock Price Service for real-time market data

export interface StockPriceData {
  symbol: string;
  current_price: number;
  currency: string;
  market_state: string;
  exchange: string;
  company_name: string;
  previous_close?: number;
  change?: number;
  change_percent?: number;
  day_high?: number;
  day_low?: number;
  volume?: number;
  last_updated: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export interface StockHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistoryData {
  symbol: string;
  period: string;
  data: StockHistoryPoint[];
}

class StockPriceService {
  private baseUrl: string;
  private cache: Map<string, { data: StockPriceData; timestamp: number }>;
  private cacheTimeout: number = 60000; // 1 minute cache

  constructor() {
    // Use environment variable or default to localhost:5001 (avoiding macOS AirPlay port 5000)
    this.baseUrl = process.env.REACT_APP_STOCK_API_URL || 'http://localhost:5001';
    this.cache = new Map();
  }

  /**
   * Get current stock price with caching
   */
  async getStockPrice(symbol: string): Promise<StockPriceData> {
    const cleanSymbol = this.cleanSymbol(symbol);
    const cacheKey = cleanSymbol;
    const now = Date.now();

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/stock-price/${cleanSymbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: StockPriceData = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: now });
      
      return data;
    } catch (error) {
      console.error('Error fetching stock price:', error);
      throw new Error(`Failed to fetch stock price for ${cleanSymbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for stocks by symbol or company name
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/stock-search/${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  /**
   * Get historical stock data
   */
  async getStockHistory(symbol: string, period: string = '1mo'): Promise<StockHistoryData> {
    const cleanSymbol = this.cleanSymbol(symbol);

    try {
      const response = await fetch(`${this.baseUrl}/api/stock-history/${cleanSymbol}?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stock history:', error);
      throw new Error(`Failed to fetch stock history for ${cleanSymbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if the stock price service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      } as RequestInit);

      return response.ok;
    } catch (error) {
      console.error('Stock service health check failed:', error);
      return false;
    }
  }

  /**
   * Clean and format stock symbol
   */
  private cleanSymbol(symbol: string): string {
    return symbol.toUpperCase().trim();
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Batch fetch multiple stock prices
   */
  async getMultipleStockPrices(symbols: string[]): Promise<Map<string, StockPriceData | Error>> {
    const results = new Map<string, StockPriceData | Error>();
    
    // Use Promise.allSettled to handle individual failures gracefully
    const promises = symbols.map(async (symbol) => {
      try {
        const data = await this.getStockPrice(symbol);
        return { symbol, data, error: null };
      } catch (error) {
        return { symbol, data: null, error: error as Error };
      }
    });

    const settled = await Promise.allSettled(promises);
    
    settled.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { symbol, data, error } = result.value;
        results.set(symbol, error || data);
      } else {
        // This shouldn't happen with our error handling above, but just in case
        console.error('Unexpected promise rejection:', result.reason);
      }
    });

    return results;
  }
}

// Export singleton instance
export const stockPriceService = new StockPriceService();

// Export utility functions
export const formatPriceChange = (change: number, changePercent: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}₹${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
};

export const getPriceChangeColor = (change: number): string => {
  if (change > 0) return 'text-green-400';
  if (change < 0) return 'text-red-400';
  return 'text-gray-400';
};

export const isMarketOpen = (marketState: string): boolean => {
  return marketState === 'REGULAR' || marketState === 'PREPRE' || marketState === 'PRE';
};