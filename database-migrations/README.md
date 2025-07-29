# Database Migrations

This directory contains SQL migration scripts for the MTF Trading application database.

## How to Run Migrations

### Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from the migration file
4. Click **Run** to execute the migration

### Via Supabase CLI (if available)

```bash
supabase db reset
# or apply specific migration
```

## Available Migrations

### 1. add_budget_tracking.sql

**Purpose**: Adds budget tracking capabilities for trade closures

**Changes**:
- Adds `available_budget` column to track current available budget
- Adds `total_profit_loss` column to track cumulative P&L from closed trades
- Initializes existing records with appropriate default values
- Adds database comments and indexes for performance

**When to run**: Required for budget restoration functionality when trades are closed

**Rollback**: If needed, you can remove the columns with:
```sql
ALTER TABLE budget_config DROP COLUMN IF EXISTS available_budget;
ALTER TABLE budget_config DROP COLUMN IF EXISTS total_profit_loss;
```

## Testing After Migration

After running the migration, verify it worked correctly:

```sql
-- Check that new columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'budget_config' 
AND column_name IN ('available_budget', 'total_profit_loss');

-- Check existing records have been initialized
SELECT id, total_budget, active_fund, available_budget, total_profit_loss 
FROM budget_config;
```

## Notes

- Always backup your database before running migrations
- Test migrations on a copy of production data first
- These migrations are designed to be safe to run multiple times (idempotent)
- The application will automatically initialize budget tracking for new users