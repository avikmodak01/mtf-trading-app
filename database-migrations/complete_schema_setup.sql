-- Complete MTF Trading Database Schema Setup
-- Run this script in your Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table (if not using Supabase auth.users directly)
-- This is optional as Supabase provides auth.users table

-- 2. Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    interest_rate_per_day DECIMAL(10,6) DEFAULT 0.0005,
    pledge_charges DECIMAL(10,2) DEFAULT 20.00,
    unpledge_charges DECIMAL(10,2) DEFAULT 20.00,
    brokerage_rate DECIMAL(8,4) DEFAULT 0.0025,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Create budget_config table
CREATE TABLE IF NOT EXISTS budget_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_budget DECIMAL(15,2) NOT NULL,
    active_fund DECIMAL(15,2) NOT NULL,
    reserve_fund DECIMAL(15,2) NOT NULL,
    budget_per_trade DECIMAL(15,2) NOT NULL,
    available_budget DECIMAL(15,2) DEFAULT NULL,
    total_profit_loss DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id)
);

-- 4. Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scrip_code VARCHAR(50) NOT NULL,
    buy_price DECIMAL(10,2) NOT NULL,
    buy_date DATE NOT NULL,
    qty INTEGER NOT NULL,
    target_price DECIMAL(10,2),
    sell_price DECIMAL(10,2),
    sell_date DATE,
    additional_margin DECIMAL(15,2) DEFAULT 0,
    trade_source VARCHAR(100),
    own_fund DECIMAL(15,2) NOT NULL,
    mtf_fund DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    suggested_qty INTEGER,
    cmp DECIMAL(10,2),
    number_of_days_held INTEGER DEFAULT 0,
    interest_paid DECIMAL(15,2) DEFAULT 0,
    turnover DECIMAL(15,2) DEFAULT 0,
    total_charges_paid DECIMAL(15,2) DEFAULT 0,
    net_profit_loss DECIMAL(15,2) DEFAULT 0,
    roi DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_configurations_user_id ON configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_config_user_id ON budget_config(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_config_available_budget ON budget_config(available_budget);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_buy_date ON trades(buy_date);
CREATE INDEX IF NOT EXISTS idx_trades_sell_date ON trades(sell_date);
CREATE INDEX IF NOT EXISTS idx_trades_scrip_code ON trades(scrip_code);

-- Enable Row Level Security (RLS)
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Configurations policies
DROP POLICY IF EXISTS "Users can view own configurations" ON configurations;
CREATE POLICY "Users can view own configurations" ON configurations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own configurations" ON configurations;
CREATE POLICY "Users can insert own configurations" ON configurations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own configurations" ON configurations;
CREATE POLICY "Users can update own configurations" ON configurations
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own configurations" ON configurations;
CREATE POLICY "Users can delete own configurations" ON configurations
    FOR DELETE USING (auth.uid() = user_id);

-- Budget config policies
DROP POLICY IF EXISTS "Users can view own budget config" ON budget_config;
CREATE POLICY "Users can view own budget config" ON budget_config
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own budget config" ON budget_config;
CREATE POLICY "Users can insert own budget config" ON budget_config
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own budget config" ON budget_config;
CREATE POLICY "Users can update own budget config" ON budget_config
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own budget config" ON budget_config;
CREATE POLICY "Users can delete own budget config" ON budget_config
    FOR DELETE USING (auth.uid() = user_id);

-- Trades policies
DROP POLICY IF EXISTS "Users can view own trades" ON trades;
CREATE POLICY "Users can view own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
CREATE POLICY "Users can insert own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trades" ON trades;
CREATE POLICY "Users can update own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trades" ON trades;
CREATE POLICY "Users can delete own trades" ON trades
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_configurations_updated_at ON configurations;
CREATE TRIGGER update_configurations_updated_at
    BEFORE UPDATE ON configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_config_updated_at ON budget_config;
CREATE TRIGGER update_budget_config_updated_at
    BEFORE UPDATE ON budget_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample configuration for testing (optional)
-- This will be created automatically by the app when a user first logs in

COMMENT ON TABLE configurations IS 'User-specific trading configuration settings';
COMMENT ON TABLE budget_config IS 'User budget configuration and tracking';
COMMENT ON TABLE trades IS 'MTF trading records with calculated fields';