-- Fix missing columns in budget_config table
-- Run this script in your Supabase SQL Editor

-- Add missing columns to budget_config table
ALTER TABLE budget_config 
ADD COLUMN IF NOT EXISTS available_budget DECIMAL(15,2) DEFAULT NULL;

ALTER TABLE budget_config 
ADD COLUMN IF NOT EXISTS total_profit_loss DECIMAL(15,2) DEFAULT 0;

-- Initialize available_budget for existing records
-- Set available_budget to active_fund for existing records where it's null
UPDATE budget_config 
SET available_budget = active_fund 
WHERE available_budget IS NULL;

-- Initialize total_profit_loss for existing records
-- Set total_profit_loss to 0 for existing records where it's null
UPDATE budget_config 
SET total_profit_loss = 0 
WHERE total_profit_loss IS NULL;

-- Create index for better query performance on available_budget
CREATE INDEX IF NOT EXISTS idx_budget_config_available_budget ON budget_config(available_budget);

-- Update the updated_at timestamp for modified records
UPDATE budget_config 
SET updated_at = TIMEZONE('utc', NOW()) 
WHERE available_budget IS NOT NULL OR total_profit_loss IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN budget_config.available_budget IS 'Current available budget after accounting for active trades and profit/loss';
COMMENT ON COLUMN budget_config.total_profit_loss IS 'Cumulative profit/loss from all closed trades';