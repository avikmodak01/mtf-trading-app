from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import NseUtility
import os
from datetime import datetime, timedelta
import logging
import time
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize NSE utility
try:
    nse = NseUtility.NseUtils()
    logger.info("NSE Utility initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize NSE Utility: {e}")
    nse = None

# Simple in-memory cache for stock prices
price_cache = {}
CACHE_DURATION = 300  # 5 minutes cache

# Rate limiting
last_request_time = 0
MIN_REQUEST_INTERVAL = 2  # 2 seconds between requests

def rate_limit():
    """Simple rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            global last_request_time
            current_time = time.time()
            
            # Enforce minimum interval between requests
            time_since_last = current_time - last_request_time
            if time_since_last < MIN_REQUEST_INTERVAL:
                sleep_time = MIN_REQUEST_INTERVAL - time_since_last
                logger.info(f"Rate limiting: sleeping for {sleep_time:.2f} seconds")
                time.sleep(sleep_time)
            
            last_request_time = time.time()
            return f(*args, **kwargs)
        return wrapper
    return decorator

def get_cached_price(symbol):
    """Get price from cache if available and fresh"""
    if symbol in price_cache:
        cached_data, timestamp = price_cache[symbol]
        if time.time() - timestamp < CACHE_DURATION:
            logger.info(f"Using cached price for {symbol}")
            return cached_data
    return None

def cache_price(symbol, data):
    """Cache price data"""
    price_cache[symbol] = (data, time.time())
    logger.info(f"Cached price for {symbol}")

def get_nse_stock_price(symbol):
    """Get stock price using NSE utility"""
    try:
        # Clean symbol - NSE utility expects symbol without .NS suffix
        clean_symbol = symbol.replace('.NS', '').replace('.BO', '').upper().strip()
        
        logger.info(f"Fetching NSE price for: {clean_symbol}")
        
        # Get price info from NSE
        price_data = nse.price_info(clean_symbol)
        
        if not price_data:
            logger.warning(f"No price data returned from NSE for {clean_symbol}")
            return None
        
        # Convert NSE data format to our API format
        market_data = {
            "symbol": f"{clean_symbol}.NS",
            "current_price": float(price_data.get('LastTradedPrice', 0)),
            "currency": "INR",
            "market_state": "REGULAR",  # NSE doesn't provide this directly
            "exchange": "NSE",
            "company_name": clean_symbol,  # NSE doesn't provide company name in price_info
            "last_updated": datetime.now().isoformat(),
            "data_source": "nse"  # Mark as NSE source
        }
        
        # Add additional fields if available
        if price_data.get('PreviousClose'):
            market_data['previous_close'] = float(price_data['PreviousClose'])
            market_data['change'] = float(price_data.get('Change', 0))
            market_data['change_percent'] = float(price_data.get('PercentChange', 0))
        
        if price_data.get('High'):
            market_data['day_high'] = float(price_data['High'])
        
        if price_data.get('Low'):
            market_data['day_low'] = float(price_data['Low'])
        
        # NSE doesn't provide volume in price_info, but we can set VWAP if available
        if price_data.get('VWAP'):
            market_data['vwap'] = float(price_data['VWAP'])
        
        return market_data
        
    except Exception as e:
        logger.error(f"Error fetching NSE price for {symbol}: {str(e)}")
        return None

# Configure CORS with specific settings for React frontend
# Allow both localhost (development) and production domains
allowed_origins = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    # Add your Netlify domain here after deployment
    # "https://your-app-name.netlify.app"
]

# Get allowed origins from environment variable for production
if os.environ.get('ALLOWED_ORIGINS'):
    additional_origins = os.environ.get('ALLOWED_ORIGINS').split(',')
    allowed_origins.extend([origin.strip() for origin in additional_origins])

CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    },
    r"/health": {
        "origins": allowed_origins,
        "methods": ["GET", "OPTIONS"]
    }
}, supports_credentials=True)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/stock-price/<symbol>', methods=['GET'])
@rate_limit()
def get_stock_price(symbol):
    """
    Get current market price for a stock symbol
    Uses NSE as primary source, yfinance as fallback
    Supports Indian stocks with .NS suffix for NSE and .BO for BSE
    """
    try:
        # Clean and format symbol
        symbol = symbol.upper().strip()
        
        # Auto-add .NS suffix for Indian stocks if not already present
        if not symbol.endswith(('.NS', '.BO')):
            symbol = f"{symbol}.NS"
        
        # Check cache first
        cached_data = get_cached_price(symbol)
        if cached_data:
            return jsonify(cached_data)
        
        logger.info(f"Fetching fresh price for symbol: {symbol}")
        
        market_data = None
        
        # Try NSE first if available
        if nse is not None:
            try:
                logger.info(f"Attempting NSE fetch for: {symbol}")
                market_data = get_nse_stock_price(symbol)
                if market_data:
                    logger.info(f"✅ Successfully fetched from NSE: {symbol} = {market_data['current_price']}")
                    # Cache the result
                    cache_price(symbol, market_data)
                    return jsonify(market_data)
                else:
                    logger.warning(f"NSE returned no data for {symbol}, trying yfinance fallback")
            except Exception as e:
                logger.warning(f"NSE fetch failed for {symbol}: {str(e)}, trying yfinance fallback")
        else:
            logger.info("NSE utility not available, using yfinance directly")
        
        # Fallback to yfinance
        logger.info(f"Using yfinance fallback for: {symbol}")
        ticker = yf.Ticker(symbol)
        
        # Get current price and basic info
        info = ticker.info
        
        # Try multiple ways to get current price
        current_price = None
        
        # Method 1: currentPrice from info
        if 'currentPrice' in info and info['currentPrice']:
            current_price = info['currentPrice']
        
        # Method 2: regularMarketPrice from info
        elif 'regularMarketPrice' in info and info['regularMarketPrice']:
            current_price = info['regularMarketPrice']
        
        # Method 3: Get from recent history
        else:
            hist = ticker.history(period="1d", interval="1m")
            if not hist.empty:
                current_price = hist['Close'].iloc[-1]
        
        if current_price is None:
            return jsonify({"error": f"Could not fetch price for {symbol} from any source"}), 404
        
        # Get additional market data
        market_data = {
            "symbol": symbol,
            "current_price": round(float(current_price), 2),
            "currency": info.get('currency', 'INR'),
            "market_state": info.get('marketState', 'UNKNOWN'),
            "exchange": info.get('exchange', 'NSE'),
            "company_name": info.get('longName', info.get('shortName', symbol)),
            "last_updated": datetime.now().isoformat(),
            "data_source": "yfinance"  # Mark as fallback source
        }
        
        # Add optional fields if available
        if 'previousClose' in info:
            market_data['previous_close'] = round(float(info['previousClose']), 2)
            market_data['change'] = round(current_price - info['previousClose'], 2)
            market_data['change_percent'] = round(((current_price - info['previousClose']) / info['previousClose']) * 100, 2)
        
        if 'dayHigh' in info:
            market_data['day_high'] = round(float(info['dayHigh']), 2)
        
        if 'dayLow' in info:
            market_data['day_low'] = round(float(info['dayLow']), 2)
        
        if 'volume' in info:
            market_data['volume'] = info['volume']
        
        logger.info(f"✅ Successfully fetched from yfinance fallback: {symbol} = {current_price}")
        
        # Cache the result
        cache_price(symbol, market_data)
        
        return jsonify(market_data)
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error fetching price for {symbol}: {error_msg}")
        
        # Check if it's a rate limit error
        if "429" in error_msg or "Too Many Requests" in error_msg:
            return jsonify({
                "error": f"Rate limit exceeded for {symbol}. Please try again in a few minutes.",
                "retry_after": 300  # Suggest 5 minute retry
            }), 429
        
        return jsonify({"error": f"Failed to fetch price for {symbol}: {error_msg}"}), 500

@app.route('/api/stock-search/<query>', methods=['GET'])
def search_stocks(query):
    """
    Search for stock symbols based on company name or symbol
    Returns list of matching stocks
    """
    try:
        query = query.upper().strip()
        
        # This is a simplified search - in production, you might want to use
        # a proper stock symbol database or API
        suggestions = []
        
        # Try common Indian stock symbols
        common_symbols = [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HDFC', 'ICICIBANK', 
            'KOTAKBANK', 'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'ASIANPAINT',
            'ITC', 'AXISBANK', 'LT', 'DMART', 'SUNPHARMA', 'ULTRACEMCO',
            'TITAN', 'BAJFINANCE', 'MARUTI'
        ]
        
        # Filter symbols that match the query
        matching_symbols = [s for s in common_symbols if query in s]
        
        for symbol in matching_symbols[:10]:  # Limit to 10 results
            try:
                ticker = yf.Ticker(f"{symbol}.NS")
                info = ticker.info
                suggestions.append({
                    "symbol": f"{symbol}.NS",
                    "name": info.get('longName', info.get('shortName', symbol)),
                    "exchange": "NSE"
                })
            except:
                # If individual stock fails, continue with others
                continue
        
        return jsonify({"suggestions": suggestions})
        
    except Exception as e:
        logger.error(f"Error searching stocks for query {query}: {str(e)}")
        return jsonify({"error": f"Failed to search stocks: {str(e)}"}), 500

@app.route('/api/stock-history/<symbol>', methods=['GET'])
def get_stock_history(symbol):
    """
    Get historical stock price data
    Query parameters: period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
    """
    try:
        symbol = symbol.upper().strip()
        if not symbol.endswith(('.NS', '.BO')):
            symbol = f"{symbol}.NS"
        
        period = request.args.get('period', '1mo')
        
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        
        if hist.empty:
            return jsonify({"error": f"No historical data found for {symbol}"}), 404
        
        # Convert to JSON-friendly format
        history_data = []
        for date, row in hist.iterrows():
            history_data.append({
                "date": date.strftime('%Y-%m-%d'),
                "open": round(float(row['Open']), 2),
                "high": round(float(row['High']), 2),
                "low": round(float(row['Low']), 2),
                "close": round(float(row['Close']), 2),
                "volume": int(row['Volume']) if row['Volume'] else 0
            })
        
        return jsonify({
            "symbol": symbol,
            "period": period,
            "data": history_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {str(e)}")
        return jsonify({"error": f"Failed to fetch history: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))  # Changed from 5000 to 5001 (macOS AirPlay conflict)
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Flask server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)