# MTF Trading Tracker

A comprehensive web application for tracking Margin Trading Facility (MTF) stock trades with automated calculations for interest, charges, profit/loss, and ROI.

## Features

- **Trade Management**: Create, edit, and track MTF trades
- **Automated Calculations**: Interest, charges, P&L, and ROI calculations
- **Budget Management**: 50-50 funding split with reserve fund allocation
- **Dark Theme**: Professional dark UI optimized for financial data
- **Real-time Metrics**: Dashboard with key performance indicators
- **Secure Authentication**: User-based data isolation
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mtf-trading-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database (run these SQL commands in your Supabase SQL editor):

```sql
-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scrip_code VARCHAR(20) NOT NULL,
  buy_price DECIMAL(10,2) NOT NULL,
  buy_date DATE NOT NULL,
  qty INTEGER NOT NULL,
  target_price DECIMAL(10,2) NOT NULL,
  sell_price DECIMAL(10,2),
  sell_date DATE,
  additional_margin DECIMAL(15,2) DEFAULT 0,
  trade_source VARCHAR(100),
  own_fund DECIMAL(15,2) NOT NULL,
  mtf_fund DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  suggested_qty INTEGER,
  cmp DECIMAL(10,2) NOT NULL,
  number_of_days_held INTEGER DEFAULT 0,
  interest_paid DECIMAL(15,2) DEFAULT 0,
  turnover DECIMAL(15,2) DEFAULT 0,
  total_charges_paid DECIMAL(15,2) DEFAULT 0,
  net_profit_loss DECIMAL(15,2) DEFAULT 0,
  roi DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create budget_config table
CREATE TABLE IF NOT EXISTS budget_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_budget DECIMAL(15,2) NOT NULL,
  reserve_fund DECIMAL(15,2) NOT NULL,
  active_fund DECIMAL(15,2) NOT NULL,
  fund_per_trade DECIMAL(15,2) NOT NULL,
  trades_made INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  interest_rate_per_day DECIMAL(8,6) DEFAULT 0.0005,
  pledge_charges DECIMAL(10,2) DEFAULT 20,
  unpledge_charges DECIMAL(10,2) DEFAULT 20,
  brokerage_rate DECIMAL(5,4) DEFAULT 0.0025,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own trades" ON trades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only see their own budget config" ON budget_config FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only see their own configurations" ON configurations FOR ALL USING (auth.uid() = user_id);
```

5. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

## Usage

### Initial Setup

1. **Sign Up/Login**: Create an account or sign in
2. **Configure Budget**: Set up your total budget (recommended minimum: ₹50,000)
   - 25% reserved for additional margins
   - 75% divided into 12 trading parts
3. **Adjust Settings**: Configure interest rates, brokerage, and charges as per your broker

### Creating Trades

1. Click "New Trade" or use the floating action button
2. Enter trade details:
   - Scrip code, buy price, quantity
   - Target price and current market price
   - Trade source (optional)
3. Review calculated metrics before saving
4. The system automatically calculates:
   - 50-50 funding split
   - Interest based on days held
   - All charges and fees
   - Net P&L and ROI

### Managing Trades

- **Edit Trades**: Update active trades (add sell price/date, additional margin)
- **View Portfolio**: Monitor all trades from the dashboard
- **Track Performance**: View detailed P&L analysis and ROI metrics

## Key Calculations

### Funding Split
- **Own Fund**: 50% of trade value
- **MTF Fund**: 50% of trade value (reduced by additional margin)

### Interest Calculation
- Daily interest on MTF fund balance
- Formula: `MTF Fund × Interest Rate per Day × Days Held`

### Other Charges Formula
```
Other Charges = (Turnover × 0.001) + 
                ((Turnover × 0.00325 / 100) × 1.18) + 
                23.6 + 
                ((Turnover / 10000000) × 15) + 
                (Turnover × 0.01 / 100)
```

### Net P&L
```
Net P&L = (Sell Price - Buy Price) × Quantity - Total Charges - Interest Paid
```

### ROI
```
ROI = (Net P&L / Own Fund) × 100
```

## Project Structure

```
src/
├── components/         # React components
│   ├── Auth.tsx       # Authentication
│   ├── Dashboard.tsx  # Main dashboard
│   ├── TradeForm.tsx  # Trade creation/editing
│   ├── TradesList.tsx # Trade management
│   ├── BudgetSetup.tsx# Budget configuration
│   ├── Settings.tsx   # App settings
│   └── Navigation.tsx # Navigation sidebar
├── lib/
│   └── supabase.ts    # Supabase client
├── types/
│   └── index.ts       # TypeScript interfaces
├── utils/
│   └── calculations.ts# Financial calculations
└── App.tsx            # Main app component
```

## Development Commands

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Run linter (if configured)
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service (Vercel, Netlify, etc.)

3. Set environment variables in your hosting platform

## Security Features

- Row Level Security (RLS) for data isolation
- User authentication required for all operations
- Secure environment variable handling
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the [troubleshooting guide](docs/troubleshooting.md)
- Open an issue on GitHub
- Review the [FAQ](docs/faq.md)

---

**Note**: This application is designed for educational and personal use. Always consult with a financial advisor for investment decisions.