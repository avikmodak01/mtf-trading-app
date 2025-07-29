import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign } from 'lucide-react';

interface AuthProps {
  onAuthChange: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthChange }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        onAuthChange();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-full">
              <DollarSign size={32} className="text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            MTF Trading Tracker
          </h2>
          <p className="mt-2 text-gray-400">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your password"
                minLength={6}
              />
            </div>
          </div>

          {message && (
            <div className={`text-sm text-center ${
              message.includes('Check your email') ? 'text-green-400' : 'text-red-400'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-semibold rounded-md text-gray-800 bg-primary hover:bg-orange-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage('');
              }}
              className="text-primary hover:text-orange-400 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>

        <div className="bg-surface p-4 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-white mb-2">About MTF Trading Tracker</h3>
          <p className="text-xs text-gray-400">
            Track your Margin Trading Facility (MTF) trades with automated calculations for 
            interest, charges, profit/loss, and ROI. Manage your trading budget with a 
            systematic 50-50 funding approach.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;