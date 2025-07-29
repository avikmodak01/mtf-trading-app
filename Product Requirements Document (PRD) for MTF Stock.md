# Product Requirements Document (PRD) for MTF Stock Trading Record-Keeping WebApp

## Overview

This PRD outlines the requirements for a web-based application designed to track and manage records for Margin Trading Facility (MTF) stock trades. The app will allow users to input, view, and calculate key metrics for trades, focusing on funding splits, costs, profits, and performance. It emphasizes automated calculations for charges, profits, and returns, with configurable parameters for flexibility.

The app targets individual traders or investors using MTF, providing a simple interface to log trades, monitor holdings, and analyze outcomes. It will store data securely in a database, support multiple trades per user, and generate reports.

### Key Objectives

- Enable easy entry and tracking of MTF trades with predefined fields.
- Automate calculations for interest, charges, profit/loss, and ROI.
- Support default 50-50 funding splits with adjustments for additional margins.
- Provide configurable rates for interest, brokerage, and other charges.
- Ensure data accuracy with daily interest computations based on MTF balances.


### Target Users

- Retail stock traders using MTF.
- Users familiar with basic stock trading concepts but needing a tool for record-keeping and analysis.


### Assumptions and Constraints

- The app will be web-based, accessible via browsers on desktop and mobile.
- User authentication (e.g., login/signup) is required for data privacy.
- Data storage will use a SUPABASE database.
- Real-time stock price integration from yfinance.
- Configurable values (e.g., InterestRate/Day) will be set via an admin panel or user settings.
- All dates and times are in IST, with the current date referenced for calculations (e.g., number of days held).


## Functional Requirements

### Core Features

- **Initial Budget**: There will be a configurable initial budget. Out of that budget 1/3rd will be kept as reserve which will be used for additional margin. Remaining budget will be divided into 12 parts and each part will be used per trade.
- **Trade Entry**: Users can create new trade records by inputting required fields. Defaults apply where specified.
- **Trade Viewing and Editing**: Display trades in a dashboard or list view, with options to edit unsold trades (e.g., add additional margin, update CMP).
- **Calculations**: Automatically compute derived fields like Total, Interest Paid, Total Charges Paid, Net Profit/Loss, ROI, and Number of Days Held.
- **Reporting**: Generate summaries, such as total profits across trades or filtered views (e.g., by Scrip Code or Trade Source).
- **Configurations**: Admin/user settings for InterestRate/Day, brokerage rates, pledge/unpledge charges, and other charges.
- **Suggestions**: Auto-calculate "SUGGESTED QTY" based on budget and buy price (logic as defined in the initial budget section).
- **Export**: Allow exporting trade data to CSV or PDF.


### User Flow

1. User logs in and navigates to "New Trade" page.
2. Inputs core details (Scrip Code, Buy Price, Buy Date, Qty, etc.).
3. App applies defaults (50-50 split) and calculates initial totals.
4. For ongoing trades, users can update fields like Additional Margin, CMP, or sell details.
5. Upon selling, app finalizes calculations (e.g., Interest Paid up to Sell Date).
6. Dashboard shows active and closed trades with key metrics.

## Data Fields

The app will store and manage the following fields per trade record. Fields are categorized as input, calculated, or configurable.

### Input Fields

- **Scrip Code**: Stock symbol or code (e.g., "RELIANCE").
- **Buy Price**: Purchase price per share.
- **Buy Date**: Date of purchase (format: YYYY-MM-DD).
- **Qty**: Number of shares bought.
- **Target Price**: User's expected sell price per share.
- **Sell Price**: Sell price per share (entered when trade is closed).
- **Sell Date**: Date of sale (format: YYYY-MM-DD; blank for open trades).
- **Additional Margin**: Any extra funds added post-purchase (adjusts MTF Fund downward).
- **Trade Source**: Source of the trade idea (e.g., "Newsletter", "Self-Analysis").


### Calculated Fields

- **Own Fund**: User's own contribution (default: 50% of Total).
- **MTF Fund**: Borrowed funds (default: 50% of Total; adjusted if Additional Margin is added).
- **Total**: Total value of the trade (Buy Price * Qty).
- **Suggested Qty**: Recommended quantity based on available funds and split (e.g., calculated as Total / Buy Price, considering defaults).
- **CMP**: Current Market Price (user-updated or potentially integrated via API in future versions).
- **Number of Days Held**: Days from Buy Date to Sell Date (or current date if unsold): (Sell Date - Buy Date) or (Current Date - Buy Date).
- **Interest Paid**: Cumulative interest on MTF Fund, calculated daily: (Daily MTF Balance * InterestRate/Day) summed over holding period.
- **Turnover**: Total transaction value (e.g., (Buy Price * Qty) + (Sell Price * Qty) if sold).
- **Total Charges Paid**: Sum of Pledge/Unpledge Charges + Brokerage + Other Charges.
- **Net Profit/Loss**: (Sell Price(if not sold then CMP) - Buy Price) * Qty - Total Charges Paid - Interest Paid.
- **ROI**: Return on Investment, calculated as (Net Profit/Loss / Own Fund) * 100 (expressed as percentage).


### Configurable Fields

- **InterestRate/Day**: Daily interest rate on MTF Fund (e.g., 0.05%; set in settings).
- **Pledge/Unpledge Charges**: Fees for pledging/unpledging shares (fixed or percentage-based; configurable).
- **Brokerage**: Trading fees (e.g., percentage of Turnover; configurable).
- **Other Charges**: (Turnover*0.001)+((Turnover*0.00325/100)*1.18)+23.6+((Turnover/10000000)*15)+(Turnover*0.01/100).


## Calculations and Logic

- **Funding Split Defaults**: For new trades, Own Fund = 50% of Total, MTF Fund = 50% of Total. If Additional Margin is added later, subtract it from MTF Fund (e.g., New MTF Fund = Original MTF Fund - Additional Margin).
- **Interest Calculation**: Daily basis on current MTF Fund balance. For each day held: Interest = MTF Fund * (InterestRate/Day). Sum all daily interests up to Sell Date or current date.
    - Handle partial days if needed (e.g., pro-rate based on time).
    - If Additional Margin reduces MTF Fund mid-trade, adjust daily balances accordingly.
- **Charges**:
    - Brokerage: Configurable rate applied to Turnover.
    - Pledge/Unpledge Charges: Applied once per trade or as configured.
    - Other Charges: User-entered or auto-applied based on settings.
    - Total Charges Paid = Interest Paid + Pledge/Unpledge Charges + Brokerage + Other Charges.
- **Profit/Loss and ROI**:
    - Only finalize when Sell Date and Sell Price are entered.
    - For open trades, provide estimated values using CMP instead of Sell Price.
- **Suggested Qty**: Logic example: Based on user's total available funds and 50-50 split, suggest max Qty = (Own Fund + MTF Fund) / Buy Price. This can be auto-populated or suggested during entry.


## Non-Functional Requirements

- **Performance**: Load trades quickly (<2 seconds for 100 records).
- **Security**: Encrypt sensitive data (e.g., fund amounts); use HTTPS.
- **Usability**: Intuitive UI with form validations (e.g., positive numbers for prices, valid dates).
- **Scalability**: Support up to 1,000 trades per user initially.
- **Accessibility**: WCAG-compliant for basic features.
- **Tech Stack**: Frontend (React), Backend (Node.js/Express), Database (MongoDB or PostgreSQL).

## Colour Scheme
Primary Colors
Primary (Orange): #FF6600 – Used for key actions like buttons (e.g., "Buy" or "Sell") and highlights.

Secondary (Deep Blue): #1E3A8A – For navigation bars, side panels, or secondary buttons to provide calm contrast.

Accent (Teal): #14B8A6 – For notifications, charts, or interactive elements like suggested qty indicators.

Neutral Colors
Background (Dark Gray): #121212 – Main app background for a true dark mode feel.

Surface (Medium Gray): #1E1E1E – For cards, tables, or sections holding trade data.

Text (Light Gray): #E0E0E0 – Primary text color for high readability; use #FFFFFF for headings.

Border/Error (Subtle Gray/Red): #333333 for borders; #EF4444 for errors or loss indicators (e.g., negative ROI).

Usage Guidelines
Apply the primary orange sparingly to avoid visual fatigue—e.g., on CTAs or positive metrics like profits.

For data-heavy areas like trade tables, use the neutral grays with orange accents for fields like "Net Profit/Loss."

Test on devices: This scheme works well on both desktop and mobile, reducing eye strain in low-light environments.

Customization: You can adjust shades slightly (e.g., lighten orange to #FF8C00 for hover states) based on branding.

## Future Enhancements

- Advanced analytics (e.g., charts for ROI trends).
- Mobile app version.

This PRD provides a foundation for development. Prioritize core trade entry and calculations in the MVP.

