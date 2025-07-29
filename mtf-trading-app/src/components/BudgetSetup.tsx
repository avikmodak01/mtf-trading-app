import React, { useState, useEffect } from 'react';
import { BudgetConfig } from '../types';
import { calculateBudgetAllocation, formatCurrency } from '../utils/calculations';
import { supabase } from '../lib/supabase';

interface BudgetSetupProps {
  budgetConfig: BudgetConfig | null;
  onBudgetUpdate: (config: BudgetConfig) => void;
}

const BudgetSetup: React.FC<BudgetSetupProps> = ({ budgetConfig, onBudgetUpdate }) => {
  const [totalBudget, setTotalBudget] = useState(budgetConfig?.total_budget || 0);
  const [isEditing, setIsEditing] = useState(!budgetConfig);
  const [loading, setLoading] = useState(false);
  const [allocation, setAllocation] = useState({
    reserveFund: 0,
    activeFund: 0,
    fundPerTrade: 0
  });

  useEffect(() => {
    if (totalBudget > 0) {
      const newAllocation = calculateBudgetAllocation(totalBudget);
      setAllocation(newAllocation);
    }
  }, [totalBudget]);

  const handleSave = async () => {
    if (totalBudget <= 0) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const budgetData = {
        user_id: user.id,
        total_budget: totalBudget,
        reserve_fund: allocation.reserveFund,
        active_fund: allocation.activeFund,
        fund_per_trade: allocation.fundPerTrade,
        trades_made: budgetConfig?.trades_made || 0,
        available_budget: budgetConfig?.available_budget || allocation.activeFund,
        total_profit_loss: budgetConfig?.total_profit_loss || 0,
        updated_at: new Date().toISOString()
      };

      // First try to check if budget config exists
      const { data: existingBudget } = await supabase
        .from('budget_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      let result;
      if (existingBudget) {
        // Update existing budget
        result = await supabase
          .from('budget_config')
          .update(budgetData)
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // Create new budget
        result = await supabase
          .from('budget_config')
          .insert(budgetData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onBudgetUpdate(result.data);
      setIsEditing(false);
      alert('Budget configuration saved successfully!');
    } catch (error: any) {
      console.error('Error saving budget config:', error);
      alert('Failed to save budget configuration: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTotalBudget(budgetConfig?.total_budget || 0);
    setIsEditing(false);
  };

  if (!isEditing && budgetConfig) {
    return (
      <div className="bg-surface p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Budget Configuration</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-primary text-gray-800 font-semibold rounded-md hover:bg-orange-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            Edit Budget
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Total Budget</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(budgetConfig.total_budget)}</p>
          </div>
          
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Available</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(budgetConfig.available_budget || budgetConfig.active_fund)}</p>
            <p className="text-xs text-gray-500 mt-1">Ready to invest</p>
          </div>
          
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Reserve Fund</p>
            <p className="text-2xl font-bold text-accent">{formatCurrency(budgetConfig.reserve_fund)}</p>
            <p className="text-xs text-gray-500 mt-1">For margins</p>
          </div>
          
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Total P&L</p>
            <p className={`text-2xl font-bold ${(budgetConfig.total_profit_loss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(budgetConfig.total_profit_loss || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">From closed trades</p>
          </div>
          
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Per Trade</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(budgetConfig.fund_per_trade)}</p>
            <p className="text-xs text-gray-500 mt-1">Budget per trade</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Budget Utilization</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Trades:</span>
              <span className="text-white font-medium">{budgetConfig.trades_made} / 12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Budget Used:</span>
              <span className="text-white font-medium">
                {((budgetConfig.total_budget - (budgetConfig.available_budget || budgetConfig.active_fund)) / budgetConfig.total_budget * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(((budgetConfig.total_budget - (budgetConfig.available_budget || budgetConfig.active_fund)) / budgetConfig.total_budget) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Allocated:</span>
              <span className="text-red-400 font-medium">
                {formatCurrency(budgetConfig.total_budget - (budgetConfig.available_budget || budgetConfig.active_fund))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Available:</span>
              <span className="text-green-400 font-medium">
                {formatCurrency(budgetConfig.available_budget || budgetConfig.active_fund)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">
        {budgetConfig ? 'Edit Budget Configuration' : 'Setup Initial Budget'}
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Total Budget (₹)
          </label>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
            placeholder="Enter your total budget"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white text-lg focus:outline-none focus:ring-2 focus:ring-primary"
            min="1000"
            step="1000"
          />
          <p className="text-gray-500 text-sm mt-1">
            Minimum recommended budget: ₹50,000
          </p>
        </div>

        {totalBudget > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Budget Breakdown</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-300 font-medium">Reserve Fund (25%)</p>
                  <p className="text-gray-500 text-sm">For additional margins when needed</p>
                </div>
                <p className="text-accent text-xl font-bold">{formatCurrency(allocation.reserveFund)}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-300 font-medium">Active Trading Fund (75%)</p>
                  <p className="text-gray-500 text-sm">Divided into 12 equal parts</p>
                </div>
                <p className="text-blue-400 text-xl font-bold">{formatCurrency(allocation.activeFund)}</p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <div>
                  <p className="text-gray-300 font-medium">Budget Per Trade</p>
                  <p className="text-gray-500 text-sm">Maximum investment per trade</p>
                </div>
                <p className="text-primary text-2xl font-bold">{formatCurrency(allocation.fundPerTrade)}</p>
              </div>
            </div>

            <div className="mt-6 p-3 bg-gray-900 rounded-lg">
              <h4 className="text-accent text-sm font-medium mb-2">Strategy Overview:</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Each trade will use a 50-50 funding split (own fund + MTF fund)</li>
                <li>• Reserve fund available for additional margins when required</li>
                <li>• Maximum 12 concurrent trades as per the strategy</li>
                <li>• Suggested quantity will be calculated based on per-trade budget</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          {budgetConfig && (
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={totalBudget <= 0 || loading}
            className="px-6 py-2 bg-primary text-gray-800 font-semibold rounded-md hover:bg-orange-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : budgetConfig ? 'Update Budget' : 'Setup Budget'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetSetup;