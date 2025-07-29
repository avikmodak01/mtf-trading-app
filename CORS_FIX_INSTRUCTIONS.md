# CORS Issue Fixed - Setup Instructions

## ✅ Problem Resolved

The CORS issue has been fixed! The problem was that:
1. Port 5000 was being used by Apple AirPlay on macOS
2. CORS configuration needed to be properly set up for preflight requests

## 🔧 Changes Made

1. **Backend port changed**: `5000` → `5001`
2. **CORS properly configured** for React frontend
3. **Environment variables updated** to use port 5001
4. **Dependencies installed** for Python backend

## 🚀 How to Test

1. **Ensure backend is running**:
   ```bash
   cd backend
   source venv/bin/activate
   python app.py
   ```
   You should see: `Running on http://127.0.0.1:5001`

2. **Test the API directly**:
   ```bash
   curl http://localhost:5001/api/stock-price/RELIANCE
   ```

3. **Restart your React app** (to pick up new environment variables):
   ```bash
   cd mtf-trading-app
   # Stop the current React server (Ctrl+C)
   npm start
   ```

## ✨ Expected Behavior

After restarting the React app:
- Enter a stock symbol (e.g., "RELIANCE") in the scrip code field
- You should see a loading spinner appear briefly
- Stock price information should display below the field
- Current Market Price (CMP) field should auto-update

## 🔍 Verification

The stock price integration is working if you see:
- Company name and current stock price
- Price change indicators (green/red)
- Day high/low information
- Exchange and market state
- Auto-update toggle option

## 📊 API Endpoints Available

- **Health Check**: `http://localhost:5001/health`
- **Stock Price**: `http://localhost:5001/api/stock-price/SYMBOL`
- **Stock Search**: `http://localhost:5001/api/stock-search/QUERY`
- **Stock History**: `http://localhost:5001/api/stock-history/SYMBOL?period=1mo`

## 🚨 If Still Having Issues

1. **Check port availability**:
   ```bash
   lsof -i :5001
   ```

2. **Verify environment variable**:
   Check that `.env` file contains: `REACT_APP_STOCK_API_URL=http://localhost:5001`

3. **Clear browser cache** and restart React development server

4. **Check browser console** for any remaining error messages

The integration should now work seamlessly! 🎉