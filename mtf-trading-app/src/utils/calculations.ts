import { differenceInDays } from 'date-fns';
import { Trade, Configuration } from '../types';

export const calculateTradeMetrics = (
  tradeData: Partial<Trade>,
  config: Configuration,
  budgetPerTrade: number
): Partial<Trade> => {
  const buyPrice = tradeData.buy_price || 0;
  const qty = tradeData.qty || 0;
  const additionalMargin = tradeData.additional_margin || 0;
  const cmp = tradeData.cmp || buyPrice;
  const sellPrice = tradeData.sell_price;
  
  // Calculate total trade value
  const total = buyPrice * qty;
  
  // Calculate suggested quantity based on budget
  const budgetBasedQty = buyPrice > 0 ? Math.floor((budgetPerTrade * 2) / buyPrice) : 0;
  
  // If total trade value differs from budget allocation, divide it equally
  let ownFund, mtfFund;
  
  if (total > 0) {
    // Split total trade value equally between own fund and mtf fund
    ownFund = total / 2;
    mtfFund = Math.max(0, (total / 2) - additionalMargin);
  } else {
    // Use budget allocation when no trade value yet
    ownFund = budgetPerTrade;
    mtfFund = Math.max(0, budgetPerTrade - additionalMargin);
  }
  
  const suggestedQty = budgetBasedQty;
  
  // Calculate days held
  const buyDate = new Date(tradeData.buy_date || new Date());
  const endDate = tradeData.sell_date ? new Date(tradeData.sell_date) : new Date();
  const daysHeld = differenceInDays(endDate, buyDate);
  
  // Calculate interest (daily on MTF fund)
  const interestPaid = mtfFund * config.interest_rate_per_day * daysHeld;
  
  // Calculate turnover
  const turnover = sellPrice ? (total + (sellPrice * qty)) : total;
  
  // Calculate other charges based on PRD formula
  const otherCharges = (turnover * 0.001) + 
                      ((turnover * 0.00325 / 100) * 1.18) + 
                      23.6 + 
                      ((turnover / 10000000) * 15) + 
                      (turnover * 0.01 / 100);
  
  // Calculate brokerage
  const brokerage = turnover * config.brokerage_rate;
  
  // Calculate total charges
  const totalCharges = interestPaid + config.pledge_charges + config.unpledge_charges + brokerage + otherCharges;
  
  // Calculate P&L
  const effectivePrice = sellPrice || cmp;
  const netProfitLoss = (effectivePrice - buyPrice) * qty - totalCharges;
  
  // Calculate ROI
  const roi = ownFund > 0 ? (netProfitLoss / ownFund) * 100 : 0;
  
  return {
    ...tradeData,
    total,
    suggested_qty: suggestedQty,
    own_fund: ownFund,
    mtf_fund: mtfFund,
    number_of_days_held: daysHeld,
    interest_paid: interestPaid,
    turnover,
    total_charges_paid: totalCharges,
    net_profit_loss: netProfitLoss,
    roi
  };
};

export const calculateBudgetAllocation = (totalBudget: number) => {
  const reserveFund = totalBudget * 0.25; // 25% for reserve
  const activeFund = totalBudget * 0.75; // 75% for active trading
  const fundPerTrade = activeFund / 12; // Divide into 12 parts
  
  return {
    reserveFund,
    activeFund,
    fundPerTrade
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};