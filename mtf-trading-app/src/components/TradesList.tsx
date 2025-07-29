import React, { useState } from 'react';
import { Trade } from '../types';
import { formatCurrency, formatPercentage } from '../utils/calculations';
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

interface TradesListProps {
  trades: Trade[];
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
}

const TradesList: React.FC<TradesListProps> = ({ trades, onEditTrade, onDeleteTrade }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'roi'>('date');

  const filteredAndSortedTrades = trades
    .filter(trade => {
      if (filter === 'active') return !trade.sell_date;
      if (filter === 'closed') return trade.sell_date;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'pnl':
          return b.net_profit_loss - a.net_profit_loss;
        case 'roi':
          return b.roi - a.roi;
        case 'date':
        default:
          return new Date(b.buy_date).getTime() - new Date(a.buy_date).getTime();
      }
    });

  const handleDelete = (trade: Trade) => {
    if (window.confirm(`Are you sure you want to delete the trade for ${trade.scrip_code}?`)) {
      onDeleteTrade(trade.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Trades</h1>
        <div className="flex space-x-4">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'closed')}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Trades</option>
            <option value="active">Active Trades</option>
            <option value="closed">Closed Trades</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'pnl' | 'roi')}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="date">Sort by Date</option>
            <option value="pnl">Sort by P&L</option>
            <option value="roi">Sort by ROI</option>
          </select>
        </div>
      </div>

      {filteredAndSortedTrades.length === 0 ? (
        <div className="bg-surface p-8 rounded-lg text-center">
          <p className="text-gray-400 text-lg">
            {filter === 'all' ? 'No trades found.' : `No ${filter} trades found.`}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Start by creating your first trade to begin tracking your MTF portfolio.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedTrades.map((trade) => (
            <div key={trade.id} className="bg-surface p-6 rounded-lg shadow-lg border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{trade.scrip_code}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      trade.sell_date 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-green-900 text-green-400'
                    }`}>
                      {trade.sell_date ? 'Closed' : 'Active'}
                    </span>
                    {trade.trade_source && (
                      <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">
                        {trade.trade_source}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Buy Price</p>
                      <p className="text-white font-medium">{formatCurrency(trade.buy_price)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Quantity</p>
                      <p className="text-white font-medium">{trade.qty}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Current Price</p>
                      <p className="text-white font-medium">{formatCurrency(trade.cmp)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Days Held</p>
                      <p className="text-white font-medium">{trade.number_of_days_held}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onEditTrade(trade)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-gray-800 rounded-lg transition-colors"
                    title="Edit Trade"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(trade)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Delete Trade"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                <div className="space-y-2">
                  <h4 className="text-gray-300 font-medium">Investment</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Own Fund:</span>
                      <span className="text-white">{formatCurrency(trade.own_fund)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">MTF Fund:</span>
                      <span className="text-white">{formatCurrency(trade.mtf_fund)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Additional Margin:</span>
                      <span className="text-white">{formatCurrency(trade.additional_margin)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-gray-300 font-medium">Charges</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Interest Paid:</span>
                      <span className="text-white">{formatCurrency(trade.interest_paid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Charges:</span>
                      <span className="text-white">{formatCurrency(trade.total_charges_paid)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-gray-300 font-medium">Performance</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Net P&L:</span>
                      <div className="flex items-center space-x-1">
                        {trade.net_profit_loss >= 0 ? 
                          <TrendingUp size={16} className="text-green-400" /> : 
                          <TrendingDown size={16} className="text-red-400" />
                        }
                        <span className={`font-medium ${trade.net_profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(trade.net_profit_loss)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">ROI:</span>
                      <span className={`font-medium text-lg ${trade.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(trade.roi)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sell Information */}
              {trade.sell_date && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Sell Price</p>
                      <p className="text-white font-medium">{formatCurrency(trade.sell_price || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Sell Date</p>
                      <p className="text-white font-medium">
                        {new Date(trade.sell_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradesList;