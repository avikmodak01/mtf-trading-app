import React from 'react';
import { Home, PlusCircle, BarChart3, Settings, LogOut, FileText, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAuthChange: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, onAuthChange }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onAuthChange();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'trades', label: 'Trades', icon: BarChart3 },
    { id: 'new-trade', label: 'New Trade', icon: PlusCircle },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-surface border-r border-gray-700 h-screen w-64 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-2 rounded-lg">
            <span className="text-white text-2xl font-bold">₹</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">MTF Tracker</h1>
            <p className="text-gray-400 text-sm">Trading Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4">
        <div className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary text-gray-800 font-semibold'
                    : 'bg-gray-700 text-white hover:bg-primary hover:text-gray-800 hover:font-semibold'
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 bg-gray-700 text-white hover:bg-red-900 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;