# MTF Trading Backend - Stock Price API

This Python Flask backend provides real-time stock price data using the yfinance library for the MTF Trading application.

## Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env file as needed
   ```

4. **Run the server:**
   ```bash
   python app.py
   ```

   The server will start on `http://localhost:5000`

## API Endpoints

### 1. Health Check
- **GET** `/health`
- Returns server status

### 2. Get Stock Price
- **GET** `/api/stock-price/<symbol>`
- Returns current market price and details for a stock
- Automatically adds `.NS` suffix for Indian stocks
- Example: `/api/stock-price/RELIANCE`

### 3. Search Stocks
- **GET** `/api/stock-search/<query>`
- Returns list of matching stock symbols
- Example: `/api/stock-search/RELI`

### 4. Stock History
- **GET** `/api/stock-history/<symbol>?period=1mo`
- Returns historical price data
- Periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max

## Example Responses

### Stock Price Response
```json
{
  "symbol": "RELIANCE.NS",
  "current_price": 2456.75,
  "currency": "INR",
  "market_state": "REGULAR",
  "exchange": "NSE",
  "company_name": "Reliance Industries Limited",
  "previous_close": 2445.20,
  "change": 11.55,
  "change_percent": 0.47,
  "day_high": 2461.80,
  "day_low": 2440.15,
  "volume": 1234567,
  "last_updated": "2024-01-15T14:30:00"
}
```

## Features

- **Real-time Data**: Fetches current market prices using yfinance
- **Indian Stock Support**: Automatic `.NS` suffix for NSE stocks
- **Error Handling**: Comprehensive error handling and logging
- **CORS Enabled**: Ready for React frontend integration
- **Market Data**: Includes price changes, volume, and market state
- **Search Functionality**: Search stocks by symbol or name

## Production Deployment

### Render.com (Recommended)
1. Push code to GitHub repository
2. Create new Web Service on Render.com
3. Connect your GitHub repository
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `python app.py`
6. Add environment variable: `ALLOWED_ORIGINS=https://your-netlify-app.netlify.app`
7. Deploy automatically

### Railway.app
1. Connect GitHub repository
2. Deploy automatically with provided configuration files

### Heroku
1. Use provided `Procfile` and `runtime.txt`
2. Deploy via Git or GitHub integration
3. Set environment variables in Heroku dashboard

### Environment Variables for Production
- `FLASK_DEBUG=false`
- `PORT=10000` (or as required by platform)
- `ALLOWED_ORIGINS=https://your-netlify-app.netlify.app`