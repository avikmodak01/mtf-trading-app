// Reporting Service for MTF Trading Application
// Handles data aggregation, filtering, and report generation

import { Trade, Configuration } from '../types';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/calculations';

export interface ReportPeriod {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}

export interface PLReportData {
  period: string;
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
  totalInvestment: number;
  grossProfit: number;
  grossLoss: number;
  netPL: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number; // Gross Profit / Gross Loss
  roi: number;
  largestWin: number;
  largestLoss: number;
  trades: Trade[];
}

export interface InterestReportData {
  period: string;
  totalInterestPaid: number;
  avgDailyInterest: number;
  totalDaysHeld: number;
  avgMTFAmount: number;
  interestByMonth: Array<{
    month: string;
    interest: number;
    trades: number;
  }>;
  trades: Trade[];
}

export interface TaxReportData {
  period: string;
  stcgTrades: Trade[]; // <= 1 year
  ltcgTrades: Trade[]; // > 1 year
  stcgProfit: number;
  stcgLoss: number;
  ltcgProfit: number;
  ltcgLoss: number;
  netSTCG: number;
  netLTCG: number;
  estimatedSTCGTax: number; // 15%
  estimatedLTCGTax: number; // 10% (if > 1L) or 0%
}

export interface SummaryReportData {
  totalTrades: number;
  activeTrades: number;
  closedTrades: number;
  totalInvested: number;
  currentValue: number;
  totalPL: number;
  totalInterestPaid: number;
  totalChargesPaid: number;
  overallROI: number;
  avgHoldingPeriod: number;
  bestPerformingStock: { scrip: string; pl: number };
  worstPerformingStock: { scrip: string; pl: number };
}

class ReportingService {
  
  /**
   * Get predefined reporting periods
   */
  getReportingPeriods(): ReportPeriod[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    
    const periods: ReportPeriod[] = [];
    
    // Current Month
    periods.push({
      label: `Current Month (${now.toLocaleString('default', { month: 'long', year: 'numeric' })})`,
      value: 'current-month',
      startDate: new Date(currentYear, currentMonth, 1),
      endDate: new Date(currentYear, currentMonth + 1, 0)
    });
    
    // Previous Month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    periods.push({
      label: `Previous Month (${new Date(prevMonthYear, prevMonth).toLocaleString('default', { month: 'long', year: 'numeric' })})`,
      value: 'previous-month',
      startDate: new Date(prevMonthYear, prevMonth, 1),
      endDate: new Date(prevMonthYear, prevMonth + 1, 0)
    });
    
    // Current Quarter
    const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
    const quarterEnd = new Date(currentYear, (currentQuarter + 1) * 3, 0);
    periods.push({
      label: `Q${currentQuarter + 1} ${currentYear}`,
      value: 'current-quarter',
      startDate: quarterStart,
      endDate: quarterEnd
    });
    
    // Previous Quarter
    const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
    const prevQuarterYear = currentQuarter === 0 ? currentYear - 1 : currentYear;
    const prevQuarterStart = new Date(prevQuarterYear, prevQuarter * 3, 1);
    const prevQuarterEnd = new Date(prevQuarterYear, (prevQuarter + 1) * 3, 0);
    periods.push({
      label: `Q${prevQuarter + 1} ${prevQuarterYear}`,
      value: 'previous-quarter',
      startDate: prevQuarterStart,
      endDate: prevQuarterEnd
    });
    
    // Current Financial Year (April to March)
    const fyStart = currentMonth >= 3 ? 
      new Date(currentYear, 3, 1) : 
      new Date(currentYear - 1, 3, 1);
    const fyEnd = currentMonth >= 3 ? 
      new Date(currentYear + 1, 2, 31) : 
      new Date(currentYear, 2, 31);
    const fyLabel = currentMonth >= 3 ? 
      `FY ${currentYear}-${(currentYear + 1).toString().slice(2)}` :
      `FY ${currentYear - 1}-${currentYear.toString().slice(2)}`;
    
    periods.push({
      label: fyLabel,
      value: 'current-fy',
      startDate: fyStart,
      endDate: fyEnd
    });
    
    // Previous Financial Year
    const prevFYStart = new Date(fyStart.getFullYear() - 1, 3, 1);
    const prevFYEnd = new Date(fyStart.getFullYear(), 2, 31);
    const prevFYLabel = `FY ${prevFYStart.getFullYear()}-${prevFYEnd.getFullYear().toString().slice(2)}`;
    
    periods.push({
      label: prevFYLabel,
      value: 'previous-fy',
      startDate: prevFYStart,
      endDate: prevFYEnd
    });
    
    // Year to Date
    periods.push({
      label: `Year to Date ${currentYear}`,
      value: 'ytd',
      startDate: new Date(currentYear, 0, 1),
      endDate: now
    });
    
    // Last 12 Months
    periods.push({
      label: 'Last 12 Months',
      value: 'last-12-months',
      startDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      endDate: now
    });
    
    // All Time
    periods.push({
      label: 'All Time',
      value: 'all-time',
      startDate: new Date(2020, 0, 1), // Arbitrary early date
      endDate: now
    });
    
    return periods;
  }
  
  /**
   * Fetch trades for a specific period
   */
  async getTradesForPeriod(startDate: Date, endDate: Date): Promise<Trade[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .gte('buy_date', startDate.toISOString().split('T')[0])
        .lte('buy_date', endDate.toISOString().split('T')[0])
        .order('buy_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trades for period:', error);
      return [];
    }
  }
  
  /**
   * Generate P&L Report
   */
  async generatePLReport(period: ReportPeriod): Promise<PLReportData> {
    const trades = await this.getTradesForPeriod(period.startDate, period.endDate);
    const closedTrades = trades.filter(t => t.sell_price && t.sell_date);
    
    const profitableTrades = closedTrades.filter(t => t.net_profit_loss > 0);
    const losingTrades = closedTrades.filter(t => t.net_profit_loss < 0);
    
    const grossProfit = profitableTrades.reduce((sum, t) => sum + t.net_profit_loss, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.net_profit_loss, 0));
    const netPL = grossProfit - grossLoss;
    const totalInvestment = closedTrades.reduce((sum, t) => sum + t.own_fund, 0);
    
    const winRate = closedTrades.length > 0 ? (profitableTrades.length / closedTrades.length) * 100 : 0;
    const avgProfit = profitableTrades.length > 0 ? grossProfit / profitableTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    const roi = totalInvestment > 0 ? (netPL / totalInvestment) * 100 : 0;
    
    const profits = profitableTrades.map(t => t.net_profit_loss);
    const losses = losingTrades.map(t => Math.abs(t.net_profit_loss));
    
    return {
      period: period.label,
      totalTrades: closedTrades.length,
      profitableTrades: profitableTrades.length,
      losingTrades: losingTrades.length,
      totalInvestment,
      grossProfit,
      grossLoss,
      netPL,
      winRate,
      avgProfit,
      avgLoss,
      profitFactor,
      roi,
      largestWin: profits.length > 0 ? Math.max(...profits) : 0,
      largestLoss: losses.length > 0 ? Math.max(...losses) : 0,
      trades: closedTrades
    };
  }
  
  /**
   * Generate Interest Report
   */
  async generateInterestReport(period: ReportPeriod): Promise<InterestReportData> {
    const trades = await this.getTradesForPeriod(period.startDate, period.endDate);
    const tradesWithInterest = trades.filter(t => t.interest_paid > 0);
    
    const totalInterestPaid = tradesWithInterest.reduce((sum, t) => sum + t.interest_paid, 0);
    const totalDaysHeld = tradesWithInterest.reduce((sum, t) => sum + t.number_of_days_held, 0);
    const avgDailyInterest = totalDaysHeld > 0 ? totalInterestPaid / totalDaysHeld : 0;
    const avgMTFAmount = tradesWithInterest.length > 0 ? 
      tradesWithInterest.reduce((sum, t) => sum + t.mtf_fund, 0) / tradesWithInterest.length : 0;
    
    // Group by month
    const interestByMonth = this.groupInterestByMonth(tradesWithInterest, period.startDate, period.endDate);
    
    return {
      period: period.label,
      totalInterestPaid,
      avgDailyInterest,
      totalDaysHeld,
      avgMTFAmount,
      interestByMonth,
      trades: tradesWithInterest
    };
  }
  
  /**
   * Generate Tax Report
   */
  async generateTaxReport(period: ReportPeriod): Promise<TaxReportData> {
    const trades = await this.getTradesForPeriod(period.startDate, period.endDate);
    const closedTrades = trades.filter(t => t.sell_price && t.sell_date);
    
    const stcgTrades = closedTrades.filter(t => t.number_of_days_held <= 365);
    const ltcgTrades = closedTrades.filter(t => t.number_of_days_held > 365);
    
    const stcgProfit = stcgTrades.filter(t => t.net_profit_loss > 0).reduce((sum, t) => sum + t.net_profit_loss, 0);
    const stcgLoss = Math.abs(stcgTrades.filter(t => t.net_profit_loss < 0).reduce((sum, t) => sum + t.net_profit_loss, 0));
    const ltcgProfit = ltcgTrades.filter(t => t.net_profit_loss > 0).reduce((sum, t) => sum + t.net_profit_loss, 0);
    const ltcgLoss = Math.abs(ltcgTrades.filter(t => t.net_profit_loss < 0).reduce((sum, t) => sum + t.net_profit_loss, 0));
    
    const netSTCG = stcgProfit - stcgLoss;
    const netLTCG = ltcgProfit - ltcgLoss;
    
    // Tax calculations (approximate)
    const estimatedSTCGTax = Math.max(0, netSTCG * 0.15); // 15% on STCG
    const estimatedLTCGTax = Math.max(0, (netLTCG - 100000) * 0.10); // 10% on LTCG > 1L
    
    return {
      period: period.label,
      stcgTrades,
      ltcgTrades,
      stcgProfit,
      stcgLoss,
      ltcgProfit,
      ltcgLoss,
      netSTCG,
      netLTCG,
      estimatedSTCGTax,
      estimatedLTCGTax
    };
  }
  
  /**
   * Generate Summary Report
   */
  async generateSummaryReport(): Promise<SummaryReportData> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: allTrades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const trades = allTrades || [];
      const activeTrades = trades.filter(t => !t.sell_price);
      const closedTrades = trades.filter(t => t.sell_price && t.sell_date);
      
      const totalInvested = trades.reduce((sum, t) => sum + t.own_fund + t.additional_margin, 0);
      const currentValue = activeTrades.reduce((sum, t) => sum + (t.cmp * t.qty), 0);
      const totalPL = closedTrades.reduce((sum, t) => sum + t.net_profit_loss, 0);
      const totalInterestPaid = trades.reduce((sum, t) => sum + t.interest_paid, 0);
      const totalChargesPaid = trades.reduce((sum, t) => sum + t.total_charges_paid, 0);
      
      const overallROI = totalInvested > 0 ? ((totalPL + currentValue - totalInvested) / totalInvested) * 100 : 0;
      const avgHoldingPeriod = closedTrades.length > 0 ? 
        closedTrades.reduce((sum, t) => sum + t.number_of_days_held, 0) / closedTrades.length : 0;
      
      // Best and worst performing stocks
      const stockPerformance = this.getStockPerformance(closedTrades);
      
      return {
        totalTrades: trades.length,
        activeTrades: activeTrades.length,
        closedTrades: closedTrades.length,
        totalInvested,
        currentValue,
        totalPL,
        totalInterestPaid,
        totalChargesPaid,
        overallROI,
        avgHoldingPeriod,
        bestPerformingStock: stockPerformance.best,
        worstPerformingStock: stockPerformance.worst
      };
    } catch (error) {
      console.error('Error generating summary report:', error);
      throw error;
    }
  }
  
  /**
   * Export report data to CSV
   */
  exportToCSV(data: any[], filename: string, headers: string[]): void {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  
  /**
   * Helper: Group interest by month
   */
  private groupInterestByMonth(trades: Trade[], startDate: Date, endDate: Date) {
    const monthlyData: { [key: string]: { interest: number; trades: number } } = {};
    
    trades.forEach(trade => {
      const buyDate = new Date(trade.buy_date);
      const monthKey = `${buyDate.getFullYear()}-${(buyDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { interest: 0, trades: 0 };
      }
      
      monthlyData[monthKey].interest += trade.interest_paid;
      monthlyData[monthKey].trades += 1;
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      interest: data.interest,
      trades: data.trades
    })).sort((a, b) => a.month.localeCompare(b.month));
  }
  
  /**
   * Helper: Get best and worst performing stocks
   */
  private getStockPerformance(closedTrades: Trade[]) {
    const stockPL: { [key: string]: number } = {};
    
    closedTrades.forEach(trade => {
      if (!stockPL[trade.scrip_code]) {
        stockPL[trade.scrip_code] = 0;
      }
      stockPL[trade.scrip_code] += trade.net_profit_loss;
    });
    
    const stocks = Object.entries(stockPL);
    stocks.sort((a, b) => b[1] - a[1]);
    
    return {
      best: stocks.length > 0 ? { scrip: stocks[0][0], pl: stocks[0][1] } : { scrip: 'N/A', pl: 0 },
      worst: stocks.length > 0 ? { scrip: stocks[stocks.length - 1][0], pl: stocks[stocks.length - 1][1] } : { scrip: 'N/A', pl: 0 }
    };
  }
}

export const reportingService = new ReportingService();