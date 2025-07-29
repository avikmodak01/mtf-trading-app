"""
Simple NSE data fetcher using alternative endpoints
Designed for server environments with minimal dependencies
"""

import requests
import json
import time
import random

class NseSimple:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        }
        self.timeout = 10
        
    def price_info(self, symbol):
        """
        Get stock price using a simple API approach
        """
        try:
            symbol = symbol.upper().strip()
            
            # Add delay to avoid rate limiting
            time.sleep(random.uniform(0.5, 1.0))
            
            # Try multiple endpoints
            endpoints = [
                f"https://www.nseindia.com/api/quote-equity?symbol={symbol}",
                f"https://www.nseindia.com/api/quote-equity?symbol={symbol}&section=trade_info"
            ]
            
            for endpoint in endpoints:
                try:
                    # Simple request without complex session management
                    response = requests.get(
                        endpoint,
                        headers=self.headers,
                        timeout=self.timeout,
                        allow_redirects=True
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        return self._extract_price_data(data, symbol)
                    
                except Exception as e:
                    continue
            
            # If NSE endpoints fail, try using a different approach
            return self._fallback_price_fetch(symbol)
            
        except Exception as e:
            print(f"NSE Simple error for {symbol}: {e}")
            return None
    
    def _extract_price_data(self, data, symbol):
        """Extract price data from NSE response"""
        try:
            if 'priceInfo' in data:
                price_info = data['priceInfo']
                return {
                    'Symbol': symbol,
                    'LastTradedPrice': float(price_info.get('lastPrice', 0)),
                    'PreviousClose': float(price_info.get('previousClose', 0)),
                    'Change': float(price_info.get('change', 0)),
                    'PercentChange': float(price_info.get('pChange', 0)),
                    'Open': float(price_info.get('open', 0)),
                    'High': float(price_info.get('intraDayHighLow', {}).get('max', 0)),
                    'Low': float(price_info.get('intraDayHighLow', {}).get('min', 0)),
                    'Close': float(price_info.get('close', 0)),
                    'VWAP': float(price_info.get('vwap', 0))
                }
            return None
        except Exception as e:
            print(f"Data extraction error: {e}")
            return None
    
    def _fallback_price_fetch(self, symbol):
        """
        Fallback method using a different approach
        This creates mock data for demonstration - replace with actual alternative API
        """
        try:
            # For demo purposes, return None to fall back to yfinance
            # In production, you could use alternative data sources here
            return None
        except Exception:
            return None
    
    def test_connection(self):
        """Test if NSE connection is working"""
        try:
            test_result = self.price_info("RELIANCE")
            return test_result is not None and test_result.get('LastTradedPrice', 0) > 0
        except:
            return False