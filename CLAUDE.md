# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a web-based MTF (Margin Trading Facility) stock trading record-keeping application. The app allows traders to input, track, and analyze MTF trades with automated calculations for interest, charges, profit/loss, and ROI. It uses a Supabase database for secure data storage and focuses on the specific needs of retail traders using margin facilities.

## Architecture

### Tech Stack
- **Frontend**: React 19.1.1 with TypeScript
- **Backend**: Supabase (PostgreSQL with authentication) + Python Flask API
- **Stock Data**: yfinance (Python library) via Flask REST API
- **Styling**: Custom Tailwind CSS implementation (not official Tailwind)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Authentication**: Supabase Auth with Row Level Security

### Core Components

1. **App.tsx** - Main application controller that coordinates all modules and manages global state
2. **Auth.tsx** - Authentication handling with email/password login
3. **TradeForm.tsx** - Trade entry and editing with real-time calculation preview
4. **TradesList.tsx** - Portfolio view with active and closed positions
5. **Dashboard.tsx** - Overview dashboard with key metrics
6. **BudgetSetup.tsx** - Budget configuration with 25%/75% allocation strategy
7. **Reports.tsx** - Comprehensive reporting and analytics dashboard with CSV export
8. **Settings.tsx** - Trading configuration (interest rates, charges, brokerage) with data management
9. **Navigation.tsx** - Sidebar navigation with dark theme styling

### Data Flow

- **Authentication First**: All data operations require user authentication via Supabase Auth
- **Global State**: App.tsx manages trades, budget config, and user configuration
- **Real-time Calculations**: Financial metrics calculated on form input changes using utils/calculations.ts
- **Database Sync**: Optimistic UI updates with server synchronization
- **Error Handling**: ErrorBoundary component for graceful error recovery

## Development Commands

1. **Quick Start (Recommended)**:
   - `./start-dev.sh` - Starts both backend and frontend servers automatically
   - Backend runs on `http://localhost:5001` (port 5001 to avoid macOS AirPlay conflict)
   - Frontend runs on `http://localhost:3000`

2. **Manual Setup**:
   
   **Backend (Python Flask + yfinance)**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```
   
   **Frontend (React)**:
   ```bash
   cd mtf-trading-app
   npm install
   npm start
   ```

3. **Database Setup**:
   - Create Supabase project and configure environment variables in `.env`
   - **Complete Setup**: Run `database-migrations/complete_schema_setup.sql` to create all tables
   - **Column Updates**: If tables exist but missing columns, run `database-migrations/fix_budget_config_columns.sql`
   - **RLS Policies**: Run `database-migrations/fix_rls_policies.sql` to set up proper Row Level Security
   - **Budget Tracking**: Run `database-migrations/add_budget_tracking.sql` for additional budget features
   - Test connection using the application's database test feature

4. **Environment Configuration**:
   - `REACT_APP_SUPABASE_URL` - Supabase project URL
   - `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `REACT_APP_STOCK_API_URL` - Stock price API backend URL (default: http://localhost:5001)
   - Environment variables validated at app startup

5. **Testing**:
   - `npm test` - Runs React test suite with Jest and React Testing Library
   - Stock API health check: `curl http://localhost:5001/health`
   - Test stock price fetch: `curl http://localhost:5001/api/stock-price/RELIANCE`

## Key Business Logic

### Trading Calculations (utils/calculations.ts)

The core financial calculations follow specific MTF trading patterns:

- **Fund Allocation Logic**: 
  - If total trade value exists: Own Fund = MTF Fund = Total Trade Value / 2
  - MTF Fund reduced by additional margin if any
  - If no trade value: Use per-trade budget allocation
- **Suggested Quantity**: `floor((budgetPerTrade × 2) / buyingPrice)` - based on full budget allocation
- **Daily Interest**: Calculated on MTF fund balance using configurable daily rate
- **Complex Charges Formula**: Fixed formula per PRD requirements:
  ```
  Other Charges = (Turnover×0.001) + ((Turnover×0.00325/100)×1.18) + 23.6 + ((Turnover/10000000)×15) + (Turnover×0.01/100)
  ```
- **Net P&L**: (Sell Price - Buy Price) × Qty - Total Charges - Interest Paid
- **ROI**: (Net P&L / Own Fund) × 100

### Budget Management Strategy

- **Initial Allocation**: 25% reserve fund, 75% active trading fund
- **Trade Limits**: Active fund divided into 12 equal parts for maximum 12 concurrent trades
- **Dynamic Fund Split**: Total trade value equally divided between own fund and MTF fund
- **Reserve Usage**: Available for additional margins when required
- **Suggested Quantity**: Based on double the per-trade budget (own + MTF capacity)

### Budget Restoration on Trade Closure

- **Fund Recovery**: When trades are closed, own fund + additional margin are restored to available budget
- **Profit/Loss Integration**: Net P&L is added/subtracted from available budget
- **Cumulative Tracking**: Total profit/loss from all closed trades is tracked separately
- **Budget Formula**: `Available Budget = Initial Budget - Active Allocations + Cumulative P&L`
- **Reinvestment**: Profits automatically increase available budget for future trades
- **Loss Management**: Losses reduce available budget, maintaining accurate allocation tracking

### Real-time Stock Price Integration

- **yfinance API**: Fetches live market data for Indian stocks (NSE/BSE)
- **Auto-fetch**: Real-time price updates when scrip code is entered
- **Manual Refresh**: Users can manually refresh stock prices
- **Market Data**: Includes current price, day high/low, volume, and price changes
- **Error Handling**: Graceful fallback when stock data is unavailable
- **Caching**: 1-minute client-side cache to reduce API calls
- **Indian Stock Support**: Automatic .NS suffix for NSE listings

### Reports & Analytics System

- **Four Report Types**: Summary Dashboard, P&L Reports, Interest Reports, Tax Reports
- **Period Filtering**: Monthly, Quarterly, Financial Year, Year to Date, Last 12 Months, All Time
- **P&L Analysis**: Win rate, profit factor, ROI, gross profit/loss, largest win/loss
- **Interest Tracking**: Total interest paid, average daily interest, monthly breakdowns
- **Tax Analysis**: STCG (≤1 year @ 15%) vs LTCG (>1 year @ 10%) categorization
- **Summary Metrics**: Portfolio value, total invested, P&L, cost breakdown, performance metrics
- **CSV Export**: Complete trade data export for all report types with professional formatting
- **Professional UI**: Card-based interface with interactive period selection and loading states

## Design System

### Color Scheme (Dark Mode)
- **Primary**: #FF6600 (Orange) - CTAs and key actions
- **Secondary**: #1E3A8A (Deep Blue) - Navigation and secondary elements
- **Accent**: #14B8A6 (Teal) - Notifications and interactive elements
- **Background**: #121212 (Dark Gray)
- **Surface**: #1E1E1E (Medium Gray) - Cards and data containers
- **Text**: #E0E0E0 (Light Gray), #FFFFFF for headings
- **Error/Loss**: #EF4444 (Red) for negative indicators

## Database Schema

### Core Tables
- `trades`: Main trade records with all input and calculated fields
- `budget_config`: User budget configuration and tracking
- `configurations`: User-specific settings for rates and charges
- `auth.users`: Supabase built-in user authentication

### Key Relationships
- All tables use `user_id` foreign key to `auth.users(id)`
- Row Level Security (RLS) policies ensure data privacy
- UUID primary keys with `gen_random_uuid()`
- Decimal precision (15,2) for all monetary calculations

## Security Considerations

- **Authentication Required**: All features require valid Supabase session
- **Row Level Security**: Database policies prevent cross-user data access with proper RLS setup
- **Input Validation**: Form inputs validated and sanitized
- **Environment Variables**: Sensitive configuration stored in environment files
- **HTTPS**: All communication encrypted through Supabase
- **Data Management**: Secure data clearing with confirmation prompts in Settings

## Styling System

### Custom Tailwind Implementation
The application uses a custom CSS utility system that mimics Tailwind classes:

- **Color Scheme**: Orange primary (#FF6600), dark theme optimized for financial data
- **Custom Variables**: CSS custom properties for consistent theming
- **Component Classes**: `.btn-primary`, form styles, and layout utilities
- **Responsive Design**: Mobile-first approach with breakpoint utilities

### Key Design Patterns
- Card-based layout for data presentation (`.bg-surface` utility)
- Color-coded P&L indicators (green for profit, red for loss)
- Consistent spacing using `.space-y-*` and padding utilities
- Hover states and transitions for interactive elements

## Common Development Tasks

### Adding New Trade Fields
1. Update `TradeFormData` and `Trade` interfaces in `types.ts`
2. Add form field in `TradeForm.tsx` with proper validation
3. Update calculation logic in `utils/calculations.ts`
4. Modify database schema and update Supabase table

### Modifying Financial Calculations
1. **Core calculations** are in `utils/calculations.ts`
2. **Real-time updates** triggered by form changes in `TradeForm.tsx`
3. **Display formatting** handled by `formatCurrency` utility
4. Always use decimal precision for monetary calculations

### Budget Management Operations
1. **Budget utilities** are in `utils/budgetManager.ts`
2. **Trade creation** automatically deducts from available budget
3. **Trade closure** restores own fund + additional margin + P&L to budget
4. **Budget validation** prevents over-investment and enforces 12-trade limit
5. **Profit tracking** maintains cumulative P&L from all closed trades

### Reports & Analytics Development
1. **Reporting service** is in `services/reportingService.ts`
2. **Report generation** handles data aggregation for different periods
3. **Export functionality** provides CSV download for all report types
4. **Period calculations** support monthly, quarterly, and financial year reporting
5. **Tax calculations** separate STCG (≤1 year) and LTCG (>1 year) trades
6. **Performance metrics** include win rate, profit factor, and ROI analysis

### Database Changes
1. **Schema Updates**: Use provided migration scripts in `database-migrations/` folder
2. **RLS Policies**: Run `fix_rls_policies.sql` to resolve 406 errors
3. **Column Additions**: Use `fix_budget_config_columns.sql` for missing columns
4. **TypeScript Interfaces**: Update interfaces in `types/index.ts` to match schema
5. **Component Updates**: Modify component props and state management accordingly
6. **Testing**: Verify with user authentication to ensure RLS policies work correctly

### Data Management
1. **Clear All Data**: Settings page includes secure data clearing functionality
2. **Confirmation Required**: Users must type 'DELETE ALL' to confirm data deletion
3. **Complete Cleanup**: Removes all trades, budget config, and trading history
4. **Budget Reset**: Clearing data requires budget reconfiguration
5. **User Isolation**: RLS ensures users can only delete their own data

## Performance Notes

- **Client-side calculations** for real-time feedback
- **Optimistic updates** for better user experience
- **Supabase connection pooling** for efficient database access
- **Component memoization** where appropriate for expensive calculations
- **Error boundaries** to prevent application crashes

## Browser Compatibility

- Modern browsers with ES6+ support required
- Uses Fetch API for HTTP requests
- LocalStorage for temporary data persistence
- No polyfills included - ensure target browser compatibility

## Error Handling

The application includes comprehensive error handling:
- **ErrorBoundary** component catches React errors
- **Database errors** caught and displayed as user notifications
- **RLS Policy Issues**: 406 errors resolved through proper policy setup
- **Authentication timeouts** handled with automatic retry
- **Form validation** prevents invalid data submission
- **Network errors** handled gracefully with user feedback
- **Stock API failures** fall back gracefully with error messages

## Recent Updates & Fixes

### Database Setup & RLS Policies (Latest)
- **Complete Schema Setup**: Created comprehensive database setup script
- **RLS Policy Fix**: Resolved 406 "Not Acceptable" errors through proper policy configuration
- **Column Migration**: Added `available_budget` and `total_profit_loss` columns to budget_config
- **Security Enhancement**: Proper user isolation through Row Level Security policies

### Reports & Analytics Implementation
- **Four Report Types**: Summary, P&L, Interest, and Tax reports with professional UI
- **Export Functionality**: CSV export with proper formatting for all report types
- **Period Management**: Flexible date range selection (monthly, quarterly, financial year)
- **Performance Metrics**: Win rate, profit factor, ROI, and cost analysis
- **Tax Analysis**: STCG/LTCG categorization with estimated tax calculations

### UI/UX Improvements
- **Export Button Styling**: Updated to primary orange theme for consistency
- **Data Management**: Added secure "Clear All Data" functionality with confirmation
- **Custom Tailwind**: Enhanced CSS utility classes for red colors and styling consistency
- **Professional Interface**: Card-based design with loading states and error handling