export interface Trade {
  id: string;
  scrip_code: string;
  buy_price: number;
  buy_date: string;
  qty: number;
  target_price: number;
  sell_price?: number;
  sell_date?: string;
  additional_margin: number;
  trade_source: string;
  own_fund: number;
  mtf_fund: number;
  total: number;
  suggested_qty: number;
  cmp: number;
  number_of_days_held: number;
  interest_paid: number;
  turnover: number;
  total_charges_paid: number;
  net_profit_loss: number;
  roi: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetConfig {
  id: string;
  user_id: string;
  total_budget: number;
  reserve_fund: number;
  active_fund: number;
  fund_per_trade: number;
  trades_made: number;
  available_budget: number; // Tracks current available budget after trades
  total_profit_loss: number; // Cumulative P&L from closed trades
  created_at: string;
  updated_at: string;
}

export interface Configuration {
  id: string;
  user_id: string;
  interest_rate_per_day: number;
  pledge_charges: number;
  unpledge_charges: number;
  brokerage_rate: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface TradeFormData {
  scrip_code: string;
  buy_price: number;
  buy_date: string;
  qty: number;
  target_price: number;
  sell_price?: number;
  sell_date?: string;
  additional_margin: number;
  trade_source: string;
  cmp: number;
}