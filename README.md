# MTF Trading Application

A comprehensive web-based Margin Trading Facility (MTF) stock trading record-keeping application with real-time stock price integration.

## ✨ Features

- **Real-time Stock Prices**: Live market data using yfinance API
- **MTF Trade Management**: Complete trade lifecycle with automated calculations
- **Budget Management**: 25%/75% reserve/active fund allocation strategy
- **Financial Calculations**: Automated interest, charges, P&L, and ROI calculations
- **Dark Theme UI**: Professional dark interface optimized for financial data
- **Secure Data Storage**: Supabase backend with Row Level Security
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MTF-trading
   ```

2. **Start development environment**
   ```bash
   ./start-dev.sh
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
MTF-trading/
├── mtf-trading-app/          # React frontend application
├── backend/                  # Python Flask API for stock prices
├── start-dev.sh             # Development startup script
├── CLAUDE.md                # Development guidance
└── README.md                # This file
```

## 🛠️ Technology Stack

- **Frontend**: React 19.1.1 + TypeScript
- **Backend**: Supabase (PostgreSQL) + Python Flask
- **Stock Data**: yfinance library
- **Styling**: Custom Tailwind CSS implementation
- **Authentication**: Supabase Auth

## 📊 Core Features

### Trading Calculations
- **Dynamic Fund Allocation**: Equal split between own fund and MTF fund
- **Interest Calculation**: Daily compounding on MTF balance
- **Comprehensive Charges**: Brokerage, pledge/unpledge, and regulatory charges
- **ROI Tracking**: Real-time return on investment calculations

### Stock Price Integration
- **Live Market Data**: Real-time prices for Indian stocks (NSE/BSE)
- **Auto-update**: Automatic price fetching when entering scrip codes
- **Market Information**: Day high/low, volume, price changes
- **Error Handling**: Graceful fallback for unavailable data

### Budget Management
- **25/75 Strategy**: 25% reserve fund, 75% active trading (12 parts)
- **Trade Limits**: Maximum 12 concurrent positions
- **Quantity Suggestions**: Automated quantity calculations based on budget

## 🔧 Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ and pip
- Supabase account

### Setup Instructions

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Frontend Setup**
   ```bash
   cd mtf-trading-app
   npm install
   cp .env.example .env
   # Update .env with your Supabase credentials
   ```

3. **Database Setup**
   - Create Supabase project
   - Run SQL schema from database setup files
   - Configure environment variables

### Running the Application

**Option 1: Quick Start (Recommended)**
```bash
./start-dev.sh
```

**Option 2: Manual Start**
```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && python app.py

# Terminal 2: Frontend
cd mtf-trading-app && npm start
```

## 📚 Documentation

- **CLAUDE.md**: Comprehensive development guidance
- **backend/README.md**: Stock price API documentation
- **mtf-trading-app/README.md**: React application details

## 🔐 Security Features

- **Authentication Required**: All features require user login
- **Row Level Security**: Database policies prevent cross-user data access
- **Input Validation**: All form inputs validated and sanitized
- **HTTPS**: Encrypted communication via Supabase

## 🌟 Key Benefits

- **Accurate Financial Tracking**: Precise MTF interest and charge calculations
- **Real-time Data**: Live stock prices for informed decision making
- **Professional Interface**: Clean, dark theme optimized for trading
- **Mobile Friendly**: Full functionality on all device sizes
- **Scalable Architecture**: Ready for production deployment

## 🚀 Production Deployment

The application is ready for production deployment with:
- Environment-based configuration
- Error boundaries and comprehensive error handling
- Optimized build process
- Security best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

For detailed development information, see **CLAUDE.md**.