"""
Server-optimized NSE Utility for production deployment
Fixes common issues with NSE access from server environments
"""

import requests
import pandas as pd
from datetime import datetime
import time
import random

class NseOptimized:
    def __init__(self):
        # More server-friendly headers mimicking the original NSE utility
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
            'Upgrade-Insecure-Requests': "1",
            "DNT": "1",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*,q=0.8",
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        }
        
        self.session = requests.Session()
        
        # Set timeouts
        self.timeout = 15
        
        # Initialize session more carefully
        try:
            # Add delay to avoid rapid requests
            time.sleep(random.uniform(2, 4))
            
            # First get the main page to establish session
            response = self.session.get("https://www.nseindia.com", headers=self.headers, timeout=self.timeout)
            
            if response.status_code == 200:
                self.cookies = self.session.cookies.get_dict()
                print("✅ NSE session established successfully")
            else:
                print(f"⚠️  NSE session warning: Status {response.status_code}")
                self.cookies = {}
                
        except Exception as e:
            print(f"⚠️  Session initialization failed: {e}")
            self.cookies = {}

    def price_info(self, symbol):
        """
        Get stock price information - optimized for server environment
        """
        try:
            symbol = symbol.upper().strip()
            
            # Add random delay to avoid rate limiting
            time.sleep(random.uniform(0.5, 1.5))
            
            # Use the quote API endpoint
            url = f"https://www.nseindia.com/api/quote-equity?symbol={symbol}"
            
            response = self.session.get(
                url, 
                headers=self.headers,
                cookies=self.cookies,
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                print(f"NSE API returned status {response.status_code}")
                return None
                
            data = response.json()
            
            # Extract price information
            if 'priceInfo' in data:
                price_info = data['priceInfo']
                return {
                    'Symbol': symbol,
                    'LastTradedPrice': price_info.get('lastPrice', 0),
                    'PreviousClose': price_info.get('previousClose', 0),
                    'Change': price_info.get('change', 0),
                    'PercentChange': price_info.get('pChange', 0),
                    'Open': price_info.get('open', 0),
                    'High': price_info.get('intraDayHighLow', {}).get('max', 0),
                    'Low': price_info.get('intraDayHighLow', {}).get('min', 0),
                    'Close': price_info.get('close', 0),
                    'VWAP': price_info.get('vwap', 0),
                    'UpperCircuit': price_info.get('upperCP', 0),
                    'LowerCircuit': price_info.get('lowerCP', 0)
                }
            else:
                print(f"No priceInfo found in response for {symbol}")
                return None
                
        except requests.exceptions.Timeout:
            print(f"Timeout fetching data for {symbol}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Request error for {symbol}: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error for {symbol}: {e}")
            return None

    def test_connection(self):
        """Test if NSE connection is working"""
        try:
            test_result = self.price_info("RELIANCE")
            return test_result is not None
        except:
            return False