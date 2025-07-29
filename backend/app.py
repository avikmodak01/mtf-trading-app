from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import os
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

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
def get_stock_price(symbol):
    """
    Get current market price for a stock symbol
    Supports Indian stocks with .NS suffix for NSE and .BO for BSE
    """
    try:
        # Clean and format symbol
        symbol = symbol.upper().strip()
        
        # Auto-add .NS suffix for Indian stocks if not already present
        if not symbol.endswith(('.NS', '.BO')):
            symbol = f"{symbol}.NS"
        
        logger.info(f"Fetching price for symbol: {symbol}")
        
        # Create ticker object
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
            return jsonify({"error": f"Could not fetch price for {symbol}"}), 404
        
        # Get additional market data
        market_data = {
            "symbol": symbol,
            "current_price": round(float(current_price), 2),
            "currency": info.get('currency', 'INR'),
            "market_state": info.get('marketState', 'UNKNOWN'),
            "exchange": info.get('exchange', 'NSE'),
            "company_name": info.get('longName', info.get('shortName', symbol)),
            "last_updated": datetime.now().isoformat(),
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
        
        logger.info(f"Successfully fetched price for {symbol}: {current_price}")
        return jsonify(market_data)
        
    except Exception as e:
        logger.error(f"Error fetching price for {symbol}: {str(e)}")
        return jsonify({"error": f"Failed to fetch price for {symbol}: {str(e)}"}), 500

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