import React, { useState, useEffect, useCallback } from 'react';
import { Trade, BudgetConfig } from '../types';
import { formatCurrency, formatPercentage } from '../utils/calculations';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface DashboardProps {
  trades: Trade[];
  budgetConfig: BudgetConfig | null;
}

const Dashboard: React.FC<DashboardProps> = ({ trades, budgetConfig }) => {
  const [stats, setStats] = useState({
    totalTrades: 0,
    activeTrades: 0,
    closedTrades: 0,
    totalInvested: 0,
    currentValue: 0,
    totalPnL: 0,
    totalROI: 0,
    avgROI: 0,
    budgetUsed: 0,
    budgetRemaining: 0
  });

  const calculateStats = useCallback(() => {
    const activeTrades = trades.filter(trade => !trade.sell_date);
    const closedTrades = trades.filter(trade => trade.sell_date);
    
    const totalInvested = trades.reduce((sum, trade) => sum + trade.own_fund, 0);
    const currentValue = activeTrades.reduce((sum, trade) => sum + (trade.cmp * trade.qty), 0) +
                        closedTrades.reduce((sum, trade) => sum + ((trade.sell_price || 0) * trade.qty), 0);
    
    const totalPnL = trades.reduce((sum, trade) => sum + trade.net_profit_loss, 0);
    const totalROI = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const avgROI = trades.length > 0 ? trades.reduce((sum, trade) => sum + trade.roi, 0) / trades.length : 0;
    
    const budgetUsed = budgetConfig ? budgetConfig.trades_made * budgetConfig.fund_per_trade : 0;
    const budgetRemaining = budgetConfig ? budgetConfig.active_fund - budgetUsed : 0;

    setStats({
      totalTrades: trades.length,
      activeTrades: activeTrades.length,
      closedTrades: closedTrades.length,
      totalInvested,
      currentValue,
      totalPnL,
      totalROI,
      avgROI,
      budgetUsed,
      budgetRemaining
    });
  }, [trades, budgetConfig]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
  }> = ({ title, value, subtitle, icon, trend = 'neutral' }) => (
    <div className="bg-surface p-6 rounded-lg shadow-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 'text-white'
          }`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${
          trend === 'up' ? 'bg-green-900 text-green-400' :
          trend === 'down' ? 'bg-red-900 text-red-400' : 'bg-gray-700 text-gray-400'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="text-gray-400 text-sm">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total P&L"
          value={formatCurrency(stats.totalPnL)}
          subtitle={`ROI: ${formatPercentage(stats.totalROI)}`}
          icon={stats.totalPnL >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          trend={stats.totalPnL >= 0 ? 'up' : 'down'}
        />
        
        <StatCard
          title="Total Invested"
          value={formatCurrency(stats.totalInvested)}
          subtitle={`Current Value: ${formatCurrency(stats.currentValue)}`}
          icon={<span className="text-2xl font-bold">₹</span>}
        />
        
        <StatCard
          title="Active Trades"
          value={stats.activeTrades.toString()}
          subtitle={`Closed: ${stats.closedTrades}`}
          icon={<PieChart size={24} />}
        />
        
        <StatCard
          title="Average ROI"
          value={formatPercentage(stats.avgROI)}
          subtitle={`Total Trades: ${stats.totalTrades}`}
          icon={stats.avgROI >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          trend={stats.avgROI >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Budget Overview */}
      {budgetConfig && (
        <div className="bg-surface p-6 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Budget Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm">Total Budget</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(budgetConfig.total_budget)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Budget Used</p>
              <p className="text-2xl font-bold text-orange-400">{formatCurrency(stats.budgetUsed)}</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((stats.budgetUsed / budgetConfig.active_fund) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Remaining Budget</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.budgetRemaining)}</p>
              <p className="text-gray-500 text-sm mt-1">
                Trades Left: {Math.floor(stats.budgetRemaining / budgetConfig.fund_per_trade)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-sm">Reserve Fund</p>
            <p className="text-lg font-semibold text-accent">{formatCurrency(budgetConfig.reserve_fund)}</p>
          </div>
        </div>
      )}

      {/* Recent Trades */}
      <div className="bg-surface p-6 rounded-lg shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Recent Trades</h2>
        {trades.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No trades found. Create your first trade to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 pb-2">Scrip</th>
                  <th className="text-left text-gray-400 pb-2">Buy Price</th>
                  <th className="text-left text-gray-400 pb-2">Qty</th>
                  <th className="text-left text-gray-400 pb-2">CMP</th>
                  <th className="text-left text-gray-400 pb-2">P&L</th>
                  <th className="text-left text-gray-400 pb-2">ROI</th>
                  <th className="text-left text-gray-400 pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 10).map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-800">
                    <td className="py-2 text-white font-medium">{trade.scrip_code}</td>
                    <td className="py-2 text-gray-300">{formatCurrency(trade.buy_price)}</td>
                    <td className="py-2 text-gray-300">{trade.qty}</td>
                    <td className="py-2 text-gray-300">{formatCurrency(trade.cmp)}</td>
                    <td className={`py-2 font-medium ${trade.net_profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(trade.net_profit_loss)}
                    </td>
                    <td className={`py-2 font-medium ${trade.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(trade.roi)}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        trade.sell_date 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-green-900 text-green-400'
                      }`}>
                        {trade.sell_date ? 'Closed' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;