import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration!');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey ? 'exists' : 'missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema creation queries (for reference)
export const createTables = async () => {
  // These would typically be run in Supabase SQL editor
  const queries = [
    `
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
    `,
    `
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
    `,
    `
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
    `
  ];
  
  return queries;
};