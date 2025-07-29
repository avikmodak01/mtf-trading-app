// Budget Manager for handling trade-related budget operations

import { Trade, BudgetConfig } from '../types';
import { supabase } from '../lib/supabase';

/**
 * Calculate budget adjustment when a trade is closed
 * Returns the amount to restore to available budget
 */
export const calculateTradeClosureBudgetAdjustment = (trade: Trade): number => {
  // Base restoration = own_fund + additional_margin (funds that were locked)
  const baseRestoration = trade.own_fund + trade.additional_margin;
  
  // Add profit or subtract loss
  const adjustedAmount = baseRestoration + trade.net_profit_loss;
  
  return adjustedAmount;
};

/**
 * Update budget when a trade is closed
 */
export const updateBudgetOnTradeClosure = async (
  trade: Trade, 
  currentBudgetConfig: BudgetConfig
): Promise<BudgetConfig | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Calculate the budget adjustment
    const budgetAdjustment = calculateTradeClosureBudgetAdjustment(trade);
    
    // Update budget configuration
    const updatedBudgetData = {
      available_budget: currentBudgetConfig.available_budget + budgetAdjustment,
      total_profit_loss: currentBudgetConfig.total_profit_loss + trade.net_profit_loss,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('budget_config')
      .update(updatedBudgetData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log(`Budget updated on trade closure:
      - Trade: ${trade.scrip_code}
      - Own Fund Restored: ₹${trade.own_fund.toFixed(2)}
      - Additional Margin Restored: ₹${trade.additional_margin.toFixed(2)}
      - Net P&L: ₹${trade.net_profit_loss.toFixed(2)}
      - Total Budget Adjustment: ₹${budgetAdjustment.toFixed(2)}
      - New Available Budget: ₹${data.available_budget.toFixed(2)}
    `);

    return data;
  } catch (error) {
    console.error('Error updating budget on trade closure:', error);
    throw error;
  }
};

/**
 * Update budget when a new trade is created (deduct from available budget)
 */
export const updateBudgetOnTradeCreation = async (
  trade: Partial<Trade>,
  currentBudgetConfig: BudgetConfig
): Promise<BudgetConfig | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Calculate the budget deduction (own_fund + additional_margin)
    const budgetDeduction = (trade.own_fund || 0) + (trade.additional_margin || 0);
    
    // Check if sufficient budget is available
    if (currentBudgetConfig.available_budget < budgetDeduction) {
      throw new Error(`Insufficient budget. Available: ₹${currentBudgetConfig.available_budget.toFixed(2)}, Required: ₹${budgetDeduction.toFixed(2)}`);
    }

    // Update budget configuration
    const updatedBudgetData = {
      available_budget: currentBudgetConfig.available_budget - budgetDeduction,
      trades_made: currentBudgetConfig.trades_made + 1,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('budget_config')
      .update(updatedBudgetData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log(`Budget updated on trade creation:
      - Trade: ${trade.scrip_code}
      - Own Fund Allocated: ₹${(trade.own_fund || 0).toFixed(2)}
      - Additional Margin: ₹${(trade.additional_margin || 0).toFixed(2)}
      - Total Deduction: ₹${budgetDeduction.toFixed(2)}
      - New Available Budget: ₹${data.available_budget.toFixed(2)}
      - Total Trades: ${data.trades_made}
    `);

    return data;
  } catch (error) {
    console.error('Error updating budget on trade creation:', error);
    throw error;
  }
};

/**
 * Get current budget utilization stats
 */
export const getBudgetUtilizationStats = (budgetConfig: BudgetConfig) => {
  const totalAllocated = budgetConfig.total_budget - budgetConfig.available_budget;
  const utilizationPercentage = (totalAllocated / budgetConfig.total_budget) * 100;
  
  return {
    totalBudget: budgetConfig.total_budget,
    availableBudget: budgetConfig.available_budget,
    totalAllocated,
    utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
    totalProfitLoss: budgetConfig.total_profit_loss,
    activeTrades: budgetConfig.trades_made,
    reserveFundUsage: Math.max(0, budgetConfig.reserve_fund - budgetConfig.available_budget)
  };
};

/**
 * Check if a new trade can be created within budget constraints
 */
export const canCreateTrade = (
  tradeOwnFund: number,
  additionalMargin: number,
  budgetConfig: BudgetConfig
): { canCreate: boolean; reason?: string } => {
  const requiredBudget = tradeOwnFund + additionalMargin;
  
  if (budgetConfig.available_budget < requiredBudget) {
    return {
      canCreate: false,
      reason: `Insufficient budget. Available: ₹${budgetConfig.available_budget.toFixed(2)}, Required: ₹${requiredBudget.toFixed(2)}`
    };
  }
  
  if (budgetConfig.trades_made >= 12) {
    return {
      canCreate: false,
      reason: `Maximum trade limit reached (12/12). Close existing trades to create new ones.`
    };
  }
  
  return { canCreate: true };
};

/**
 * Reset/initialize budget tracking fields for existing budget configs
 */
export const initializeBudgetTracking = async (budgetConfig: BudgetConfig): Promise<BudgetConfig | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Initialize available_budget to active_fund if not set
    const availableBudget = budgetConfig.available_budget ?? budgetConfig.active_fund;
    const totalProfitLoss = budgetConfig.total_profit_loss ?? 0;

    const updatedBudgetData = {
      available_budget: availableBudget,
      total_profit_loss: totalProfitLoss,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('budget_config')
      .update(updatedBudgetData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log('Budget tracking initialized:', data);
    return data;
  } catch (error) {
    console.error('Error initializing budget tracking:', error);
    throw error;
  }
};