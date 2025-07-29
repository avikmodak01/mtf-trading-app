import React, { useState, useEffect } from 'react';
import { Configuration } from '../types';
import { supabase } from '../lib/supabase';
import { Trash2 } from 'lucide-react';

interface SettingsProps {
  configuration: Configuration | null;
  onConfigUpdate: (config: Configuration) => void;
}

const Settings: React.FC<SettingsProps> = ({ configuration, onConfigUpdate }) => {
  const [formData, setFormData] = useState({
    interest_rate_per_day: 0.0005,
    pledge_charges: 20,
    unpledge_charges: 20,
    brokerage_rate: 0.0025
  });
  const [loading, setLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (configuration) {
      setFormData({
        interest_rate_per_day: configuration.interest_rate_per_day,
        pledge_charges: configuration.pledge_charges,
        unpledge_charges: configuration.unpledge_charges,
        brokerage_rate: configuration.brokerage_rate
      });
    }
  }, [configuration]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const configData = {
        user_id: user.id,
        ...formData
      };

      let result;
      if (configuration && configuration.id !== 'temp-id') {
        result = await supabase
          .from('configurations')
          .update(configData)
          .eq('id', configuration.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('configurations')
          .insert(configData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onConfigUpdate(result.data);
      setMessage('Configuration saved successfully!');
    } catch (error: any) {
      setMessage('Error saving configuration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setFormData({
      interest_rate_per_day: 0.0005,
      pledge_charges: 20,
      unpledge_charges: 20,
      brokerage_rate: 0.0025
    });
  };

  const handleClearAllData = async () => {
    const confirmMessage = `⚠️ WARNING: Clear All Trade Data
    
This action will permanently delete:
• All trades (both active and closed)
• Budget configuration
• Available budget tracking
• All trading history

This action CANNOT be undone!

Type 'DELETE ALL' to confirm:`;

    const confirmation = prompt(confirmMessage);
    
    if (confirmation !== 'DELETE ALL') {
      return;
    }

    setClearLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Delete trades first (due to foreign key constraints)
      const { error: tradesError } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id);

      if (tradesError) throw tradesError;

      // Delete budget configuration
      const { error: budgetError } = await supabase
        .from('budget_config')
        .delete()
        .eq('user_id', user.id);

      if (budgetError) throw budgetError;

      setMessage('✅ All trade data has been successfully cleared!');
      
      // Refresh the page to reset all state
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      setMessage('❌ Error clearing data: ' + error.message);
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Trading Configuration</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Interest Rate per Day
              </label>
              <input
                type="number"
                name="interest_rate_per_day"
                value={formData.interest_rate_per_day}
                onChange={handleInputChange}
                step="0.000001"
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-gray-500 text-xs mt-1">
                Default: 0.0005 (0.05% per day)
              </p>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Brokerage Rate
              </label>
              <input
                type="number"
                name="brokerage_rate"
                value={formData.brokerage_rate}
                onChange={handleInputChange}
                step="0.0001"
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-gray-500 text-xs mt-1">
                Default: 0.0025 (0.25% of turnover)
              </p>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Pledge Charges (₹)
              </label>
              <input
                type="number"
                name="pledge_charges"
                value={formData.pledge_charges}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-gray-500 text-xs mt-1">
                Default: ₹20 per trade
              </p>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Unpledge Charges (₹)
              </label>
              <input
                type="number"
                name="unpledge_charges"
                value={formData.unpledge_charges}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-gray-500 text-xs mt-1">
                Default: ₹20 per trade
              </p>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('successfully') 
                ? 'bg-green-900 text-green-300 border border-green-700' 
                : 'bg-red-900 text-red-300 border border-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={resetToDefaults}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Reset to Defaults
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-gray-800 font-semibold rounded-md hover:bg-orange-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Other Charges Formula Display */}
      <div className="bg-surface p-6 rounded-lg shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Other Charges Formula</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-300 text-sm font-mono">
            Other Charges = (Turnover × 0.001) + ((Turnover × 0.00325 / 100) × 1.18) + 23.6 + ((Turnover / 10000000) × 15) + (Turnover × 0.01 / 100)
          </p>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          This formula is fixed as per the PRD requirements and includes various regulatory and exchange charges.
        </p>
      </div>

      {/* Usage Information */}
      <div className="bg-surface p-6 rounded-lg shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Configuration Guide</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <div>
            <h3 className="font-medium text-white">Interest Rate per Day</h3>
            <p className="text-gray-400">
              Daily interest rate charged on MTF fund. Typically ranges from 0.03% to 0.08% per day 
              depending on your broker.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white">Brokerage Rate</h3>
            <p className="text-gray-400">
              Percentage of turnover charged as brokerage. Common rates are 0.25% to 0.5% for equity delivery.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white">Pledge/Unpledge Charges</h3>
            <p className="text-gray-400">
              Fixed charges for pledging and unpledging shares. These are typically ₹15-₹25 per transaction.
            </p>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-surface p-6 rounded-lg shadow-lg border border-red-700">
        <h2 className="text-xl font-bold text-red-400 mb-4">⚠️ Data Management</h2>
        <div className="space-y-4">
          <div className="bg-red-900/20 p-4 rounded-lg border border-red-700">
            <h3 className="font-medium text-red-300 mb-2">Clear All Trade Data</h3>
            <p className="text-gray-300 text-sm mb-4">
              This will permanently delete all trades, budget configuration, and trading history. 
              <strong className="text-red-400"> This action cannot be undone!</strong>
            </p>
            <button
              onClick={handleClearAllData}
              disabled={clearLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              <Trash2 size={16} />
              {clearLoading ? 'Clearing Data...' : 'Clear All Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;