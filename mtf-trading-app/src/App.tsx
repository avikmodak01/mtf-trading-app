import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Trade, BudgetConfig, Configuration, User } from './types';
import { 
  updateBudgetOnTradeCreation, 
  updateBudgetOnTradeClosure, 
  initializeBudgetTracking,
  canCreateTrade 
} from './utils/budgetManager';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import TradeForm from './components/TradeForm';
import TradesList from './components/TradesList';
import BudgetSetup from './components/BudgetSetup';
import Reports from './components/Reports';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [configuration, setConfiguration] = useState<Configuration | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);


  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log('User found during initialization');
          setUser(user as User);
          await loadUserData(user.id);
          console.log('✅ Initial setup completed');
        } else {
          console.log('No user found - showing login screen');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          console.log('User logged out');
          setUser(null);
          setTrades([]);
          setBudgetConfig(null);
          setConfiguration(null);
          setLoading(false);
        }
        // Note: SIGNED_IN is handled by the initial auth check above
      }
    );

    return () => subscription?.unsubscribe();
  }, []); // Remove user dependency to prevent infinite loop

  const loadUserData = async (userId: string) => {
    console.log('Loading user data for:', userId);
    
    try {
      // Load trades
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      setTrades(tradesData || []);
      console.log('✅ Loaded trades:', tradesData?.length || 0);
    } catch (err) {
      console.error('Error loading trades:', err);
      setTrades([]);
    }

    try {
      // Load budget config
      const { data: budgetData } = await supabase
        .from('budget_config')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Initialize budget tracking if needed
      if (budgetData && (budgetData.available_budget === null || budgetData.available_budget === undefined)) {
        console.log('Initializing budget tracking...');
        const initializedBudget = await initializeBudgetTracking(budgetData);
        setBudgetConfig(initializedBudget);
      } else {
        setBudgetConfig(budgetData);
      }
      
      console.log('✅ Loaded budget config:', budgetData ? 'exists' : 'none');
    } catch (err) {
      console.error('Error loading budget config:', err);
      setBudgetConfig(null);
    }

    try {
      // Load or create configuration
      const { data: configData } = await supabase
        .from('configurations')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (configData) {
        setConfiguration(configData);
        console.log('✅ Loaded configuration');
      } else {
        // Create default configuration
        const defaultConfig = {
          user_id: userId,
          interest_rate_per_day: 0.0005,
          pledge_charges: 20,
          unpledge_charges: 20,
          brokerage_rate: 0.0025
        };

        const { data: newConfig } = await supabase
          .from('configurations')
          .insert(defaultConfig)
          .select()
          .single();

        if (newConfig) {
          setConfiguration(newConfig);
          console.log('✅ Created default configuration');
        }
      }
    } catch (err) {
      console.error('Error with configuration:', err);
      // Fallback to local config
      const fallbackConfig = {
        id: 'temp-id',
        user_id: userId,
        interest_rate_per_day: 0.0005,
        pledge_charges: 20,
        unpledge_charges: 20,
        brokerage_rate: 0.0025,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setConfiguration(fallbackConfig);
      console.log('✅ Using fallback configuration');
    }

    console.log('🎉 User data loading completed');
  };

  const handleTradeSubmit = async (tradeData: Partial<Trade>) => {
    if (!user || !budgetConfig) return;

    try {
      const tradePayload = {
        ...tradeData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingTrade) {
        // Check if trade is being closed (sell_price and sell_date provided)
        const isClosingTrade = !editingTrade.sell_price && tradePayload.sell_price && tradePayload.sell_date;
        
        result = await supabase
          .from('trades')
          .update(tradePayload)
          .eq('id', editingTrade.id)
          .select()
          .single();

        if (result.error) throw result.error;

        // If trade is being closed, update budget
        if (isClosingTrade) {
          console.log('Trade being closed, updating budget...');
          const updatedBudget = await updateBudgetOnTradeClosure(result.data as Trade, budgetConfig);
          if (updatedBudget) {
            setBudgetConfig(updatedBudget);
          }
        }
      } else {
        // Creating new trade - check budget constraints
        const ownFund = tradePayload.own_fund || 0;
        const additionalMargin = tradePayload.additional_margin || 0;
        
        const budgetCheck = canCreateTrade(ownFund, additionalMargin, budgetConfig);
        if (!budgetCheck.canCreate) {
          alert(`Cannot create trade: ${budgetCheck.reason}`);
          return;
        }

        result = await supabase
          .from('trades')
          .insert({
            ...tradePayload,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (result.error) throw result.error;

        // Update budget for new trade
        const updatedBudget = await updateBudgetOnTradeCreation(tradePayload, budgetConfig);
        if (updatedBudget) {
          setBudgetConfig(updatedBudget);
        }
      }

      // Refresh trades
      await loadUserData(user.id);
      setEditingTrade(null);
      setActiveTab('trades');
    } catch (error) {
      console.error('Error saving trade:', error);
      alert(`Error saving trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTradeDelete = async (tradeId: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;

      // Refresh trades
      if (user) await loadUserData(user.id);
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Failed to delete trade');
    }
  };

  const handleBudgetUpdate = (newBudgetConfig: BudgetConfig) => {
    setBudgetConfig(newBudgetConfig);
  };

  const handleConfigUpdate = (newConfiguration: Configuration) => {
    setConfiguration(newConfiguration);
  };

  const handleAuthChange = () => {
    window.location.reload(); // Simple reload on auth change
  };

  const handleNewTrade = () => {
    setEditingTrade(null);
    setActiveTab('new-trade');
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setActiveTab('new-trade');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthChange={handleAuthChange} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard trades={trades} budgetConfig={budgetConfig} />;
      
      case 'trades':
        return (
          <TradesList 
            trades={trades} 
            onEditTrade={handleEditTrade}
            onDeleteTrade={handleTradeDelete}
          />
        );
      
      case 'new-trade':
        return (
          <TradeForm 
            trade={editingTrade}
            onSubmit={handleTradeSubmit}
            onCancel={() => {
              setEditingTrade(null);
              setActiveTab('trades');
            }}
          />
        );
      
      case 'budget':
        return (
          <BudgetSetup 
            budgetConfig={budgetConfig}
            onBudgetUpdate={handleBudgetUpdate}
          />
        );
      
      case 'reports':
        return <Reports />;
      
      case 'settings':
        return (
          <Settings 
            configuration={configuration}
            onConfigUpdate={handleConfigUpdate}
          />
        );
      
      default:
        return <Dashboard trades={trades} budgetConfig={budgetConfig} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex">
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAuthChange={handleAuthChange}
      />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {!budgetConfig && activeTab !== 'budget' && (
            <div className="bg-orange-900 border border-orange-700 text-orange-200 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Setup Required</p>
                  <p className="text-sm">Please configure your budget before creating trades.</p>
                </div>
                <button
                  onClick={() => setActiveTab('budget')}
                  className="bg-primary text-gray-800 font-semibold px-4 py-2 rounded-md hover:bg-orange-700 hover:text-white transition-colors"
                >
                  Setup Budget
                </button>
              </div>
            </div>
          )}
          
          {renderContent()}
        </div>
      </main>

      {/* Floating Action Button for New Trade */}
      {activeTab !== 'new-trade' && budgetConfig && (
        <button
          onClick={handleNewTrade}
          className="fixed bottom-6 right-6 bg-primary text-gray-800 p-4 rounded-full shadow-lg hover:bg-orange-700 hover:text-white transition-all hover:scale-105 z-50"
          title="Create New Trade"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}
      </div>
    </ErrorBoundary>
  );
}

export default App;