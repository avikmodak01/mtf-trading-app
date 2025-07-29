-- Fix RLS policies for budget_config table
-- Run this script in your Supabase SQL Editor

-- First, check if RLS is enabled on budget_config
-- If not, enable it
ALTER TABLE budget_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own budget config" ON budget_config;
DROP POLICY IF EXISTS "Users can insert own budget config" ON budget_config;
DROP POLICY IF EXISTS "Users can update own budget config" ON budget_config;
DROP POLICY IF EXISTS "Users can delete own budget config" ON budget_config;

-- Create proper RLS policies for budget_config
CREATE POLICY "Users can view own budget config" ON budget_config
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget config" ON budget_config
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget config" ON budget_config
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget config" ON budget_config
    FOR DELETE USING (auth.uid() = user_id);

-- Also fix configurations table policies if needed
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own configurations" ON configurations;
DROP POLICY IF EXISTS "Users can insert own configurations" ON configurations;
DROP POLICY IF EXISTS "Users can update own configurations" ON configurations;
DROP POLICY IF EXISTS "Users can delete own configurations" ON configurations;

CREATE POLICY "Users can view own configurations" ON configurations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configurations" ON configurations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configurations" ON configurations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own configurations" ON configurations
    FOR DELETE USING (auth.uid() = user_id);

-- Fix trades table policies
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trades" ON trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
DROP POLICY IF EXISTS "Users can update own trades" ON trades;
DROP POLICY IF EXISTS "Users can delete own trades" ON trades;

CREATE POLICY "Users can view own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON trades
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trades TO authenticated;

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;