import React, { useState, useEffect, useCallback } from 'react';
import { TradeFormData, Trade, Configuration, BudgetConfig } from '../types';
import { calculateTradeMetrics, formatCurrency } from '../utils/calculations';
import { supabase } from '../lib/supabase';
import { stockPriceService, StockPriceData, formatPriceChange, getPriceChangeColor } from '../services/stockPriceService';

interface TradeFormProps {
  trade?: Trade | null;
  onSubmit: (trade: Partial<Trade>) => void;
  onCancel: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ trade, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<TradeFormData>({
    scrip_code: '',
    buy_price: 0,
    buy_date: new Date().toISOString().split('T')[0],
    qty: 1,
    target_price: 0,
    sell_price: undefined,
    sell_date: undefined,
    additional_margin: 0,
    trade_source: '',
    cmp: 0,
  });

  const [customTradeSource, setCustomTradeSource] = useState('');

  const [config, setConfig] = useState<Configuration | null>(null);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [calculatedMetrics, setCalculatedMetrics] = useState<Partial<Trade>>({});
  const [stockData, setStockData] = useState<StockPriceData | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true);

  useEffect(() => {
    loadUserConfig();
    if (trade) {
      // Check if trade_source is a custom value (not in the predefined options)
      const predefinedSources = ['Univest', 'Waya', 'ICICI Direct'];
      const isCustomSource = trade.trade_source && !predefinedSources.includes(trade.trade_source);
      
      setFormData({
        scrip_code: trade.scrip_code,
        buy_price: trade.buy_price,
        buy_date: trade.buy_date,
        qty: trade.qty,
        target_price: trade.target_price,
        sell_price: trade.sell_price,
        sell_date: trade.sell_date,
        additional_margin: trade.additional_margin,
        trade_source: isCustomSource ? 'Others' : trade.trade_source,
        cmp: trade.cmp,
      });
      
      // Set custom trade source if it's a custom value
      if (isCustomSource) {
        setCustomTradeSource(trade.trade_source);
      }
    }
  }, [trade]);

  useEffect(() => {
    if (config && budgetConfig) {
      const metrics = calculateTradeMetrics(formData, config, budgetConfig.fund_per_trade);
      setCalculatedMetrics(metrics);
    }
  }, [formData, config, budgetConfig]);

  const loadUserConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [configResult, budgetResult] = await Promise.all([
        supabase.from('configurations').select('*').eq('user_id', user.id).single(),
        supabase.from('budget_config').select('*').eq('user_id', user.id).single()
      ]);

      if (configResult.data) setConfig(configResult.data);
      if (budgetResult.data) setBudgetConfig(budgetResult.data);
    } catch (error) {
      console.error('Error loading user config:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('price') || name === 'qty' || name === 'additional_margin' 
        ? parseFloat(value) || 0 
        : name === 'scrip_code' ? value.toUpperCase() : value
    }));
  };

  // Fetch stock price data
  const fetchStockPrice = useCallback(async (symbol: string) => {
    if (!symbol.trim()) {
      setStockData(null);
      setPriceError(null);
      return;
    }

    setLoadingPrice(true);
    setPriceError(null);

    try {
      const data = await stockPriceService.getStockPrice(symbol);
      setStockData(data);
      
      // Auto-update CMP if auto-fetch is enabled
      if (autoFetchEnabled) {
        setFormData(prev => ({
          ...prev,
          cmp: data.current_price
        }));
      }
    } catch (error) {
      setPriceError(error instanceof Error ? error.message : 'Failed to fetch price');
      setStockData(null);
    } finally {
      setLoadingPrice(false);
    }
  }, [autoFetchEnabled]);

  // Auto-fetch price when scrip code changes
  useEffect(() => {
    if (formData.scrip_code && autoFetchEnabled) {
      const timeoutId = setTimeout(() => {
        fetchStockPrice(formData.scrip_code);
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [formData.scrip_code, fetchStockPrice, autoFetchEnabled]);

  const handleManualPriceFetch = () => {
    if (formData.scrip_code) {
      fetchStockPrice(formData.scrip_code);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use custom trade source if "Others" is selected
    const finalTradeSource = formData.trade_source === 'Others' ? customTradeSource : formData.trade_source;
    
    onSubmit({
      ...calculatedMetrics,
      trade_source: finalTradeSource
    });
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">
        {trade ? 'Edit Trade' : 'New Trade'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Scrip Code
            </label>
            <div className="relative">
              <input
                type="text"
                name="scrip_code"
                value={formData.scrip_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., RELIANCE, TCS"
                required
              />
              {loadingPrice && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            
            {/* Stock Price Display */}
            {stockData && (
              <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-accent font-medium text-sm">{stockData.company_name}</h4>
                    <p className="text-white text-lg font-bold">₹{stockData.current_price.toFixed(2)}</p>
                    {stockData.change !== undefined && stockData.change_percent !== undefined && (
                      <p className={`text-sm ${getPriceChangeColor(stockData.change)}`}>
                        {formatPriceChange(stockData.change, stockData.change_percent)}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <p>{stockData.exchange}</p>
                    <p>{stockData.market_state}</p>
                    <button
                      type="button"
                      onClick={handleManualPriceFetch}
                      className="text-primary hover:text-orange-300 text-xs mt-1"
                      disabled={loadingPrice}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                
                {/* Auto-fetch toggle */}
                <div className="mt-2 flex items-center justify-between">
                  <label className="flex items-center text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={autoFetchEnabled}
                      onChange={(e) => setAutoFetchEnabled(e.target.checked)}
                      className="mr-2 text-primary focus:ring-primary"
                    />
                    Auto-update CMP
                  </label>
                  {stockData.day_high && stockData.day_low && (
                    <span className="text-xs text-gray-500">
                      Day: ₹{stockData.day_low.toFixed(2)} - ₹{stockData.day_high.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Price Error */}
            {priceError && (
              <div className="mt-2 p-2 bg-red-900 border border-red-700 rounded text-red-300 text-sm">
                {priceError}
                <button
                  type="button"
                  onClick={handleManualPriceFetch}
                  className="ml-2 text-red-200 hover:text-white underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Buy Price
            </label>
            <input
              type="number"
              name="buy_price"
              value={formData.buy_price}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Buy Date
            </label>
            <input
              type="date"
              name="buy_date"
              value={formData.buy_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Quantity
            </label>
            <input
              type="number"
              name="qty"
              value={formData.qty}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {calculatedMetrics.suggested_qty && (
              <p className="text-accent text-sm mt-1">
                Suggested Qty: {calculatedMetrics.suggested_qty}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Target Price
            </label>
            <input
              type="number"
              name="target_price"
              value={formData.target_price}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Current Market Price
            </label>
            <input
              type="number"
              name="cmp"
              value={formData.cmp}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Additional Margin
            </label>
            <input
              type="number"
              name="additional_margin"
              value={formData.additional_margin}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Trade Source
            </label>
            <select
              name="trade_source"
              value={formData.trade_source}
              onChange={(e) => {
                handleInputChange(e);
                if (e.target.value !== 'Others') {
                  setCustomTradeSource('');
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select Source</option>
              <option value="Univest">Univest</option>
              <option value="Waya">Waya</option>
              <option value="ICICI Direct">ICICI Direct</option>
              <option value="Others">Others (specify)</option>
            </select>
            
            {formData.trade_source === 'Others' && (
              <input
                type="text"
                value={customTradeSource}
                onChange={(e) => setCustomTradeSource(e.target.value)}
                placeholder="Please specify trade source"
                className="w-full mt-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>

          {trade && (
            <>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Sell Price
                </label>
                <input
                  type="number"
                  name="sell_price"
                  value={formData.sell_price || ''}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Sell Date
                </label>
                <input
                  type="date"
                  name="sell_date"
                  value={formData.sell_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </>
          )}
        </div>

        {/* Calculated Metrics Display */}
        {calculatedMetrics.total && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-white text-lg font-semibold mb-3">Calculated Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Total Value</p>
                <p className="text-white font-medium">{formatCurrency(calculatedMetrics.total)}</p>
              </div>
              <div>
                <p className="text-gray-400">Own Fund</p>
                <p className="text-white font-medium">{formatCurrency(calculatedMetrics.own_fund || 0)}</p>
              </div>
              <div>
                <p className="text-gray-400">MTF Fund</p>
                <p className="text-white font-medium">{formatCurrency(calculatedMetrics.mtf_fund || 0)}</p>
              </div>
              <div>
                <p className="text-gray-400">Interest Paid</p>
                <p className="text-white font-medium">{formatCurrency(calculatedMetrics.interest_paid || 0)}</p>
              </div>
              <div>
                <p className="text-gray-400">Total Charges</p>
                <p className="text-white font-medium">{formatCurrency(calculatedMetrics.total_charges_paid || 0)}</p>
              </div>
              <div>
                <p className="text-gray-400">Net P&L</p>
                <p className={`font-medium ${(calculatedMetrics.net_profit_loss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(calculatedMetrics.net_profit_loss || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">ROI</p>
                <p className={`font-medium ${(calculatedMetrics.roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(calculatedMetrics.roi || 0).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-gray-400">Days Held</p>
                <p className="text-white font-medium">{calculatedMetrics.number_of_days_held || 0}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-gray-800 font-semibold rounded-md hover:bg-orange-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            {trade ? 'Update Trade' : 'Create Trade'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TradeForm;