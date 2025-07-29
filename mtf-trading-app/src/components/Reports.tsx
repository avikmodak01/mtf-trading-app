import React, { useState, useEffect } from 'react';
import { 
  reportingService, 
  ReportPeriod, 
  PLReportData, 
  InterestReportData, 
  TaxReportData, 
  SummaryReportData 
} from '../services/reportingService';
import { formatCurrency } from '../utils/calculations';
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, TrendingDown, PieChart, FileText } from 'lucide-react';

type ReportType = 'summary' | 'pl' | 'interest' | 'tax';

const Reports: React.FC = () => {
  const [activeReportType, setActiveReportType] = useState<ReportType>('summary');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod | null>(null);
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Report data states
  const [summaryData, setSummaryData] = useState<SummaryReportData | null>(null);
  const [plData, setPLData] = useState<PLReportData | null>(null);
  const [interestData, setInterestData] = useState<InterestReportData | null>(null);
  const [taxData, setTaxData] = useState<TaxReportData | null>(null);

  useEffect(() => {
    const reportPeriods = reportingService.getReportingPeriods();
    setPeriods(reportPeriods);
    setSelectedPeriod(reportPeriods[0]); // Default to current month
    
    // Load summary data immediately
    loadSummaryReport();
  }, []);

  useEffect(() => {
    if (selectedPeriod && activeReportType !== 'summary') {
      loadReportData();
    }
  }, [selectedPeriod, activeReportType]);

  const loadSummaryReport = async () => {
    setLoading(true);
    try {
      const data = await reportingService.generateSummaryReport();
      setSummaryData(data);
    } catch (error) {
      console.error('Error loading summary report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    if (!selectedPeriod) return;
    
    setLoading(true);
    try {
      switch (activeReportType) {
        case 'pl':
          const plReport = await reportingService.generatePLReport(selectedPeriod);
          setPLData(plReport);
          break;
        case 'interest':
          const interestReport = await reportingService.generateInterestReport(selectedPeriod);
          setInterestData(interestReport);
          break;
        case 'tax':
          const taxReport = await reportingService.generateTaxReport(selectedPeriod);
          setTaxData(taxReport);
          break;
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedPeriod) return;

    switch (activeReportType) {
      case 'pl':
        if (plData) {
          const csvData = plData.trades.map(trade => ({
            'Scrip Code': trade.scrip_code,
            'Buy Date': trade.buy_date,
            'Sell Date': trade.sell_date || 'N/A',
            'Quantity': trade.qty,
            'Buy Price': trade.buy_price,
            'Sell Price': trade.sell_price || 'N/A',
            'Own Fund': trade.own_fund,
            'MTF Fund': trade.mtf_fund,
            'Interest Paid': trade.interest_paid,
            'Total Charges': trade.total_charges_paid,
            'Net P&L': trade.net_profit_loss,
            'ROI %': trade.roi.toFixed(2),
            'Days Held': trade.number_of_days_held
          }));
          reportingService.exportToCSV(
            csvData, 
            `PL-Report-${selectedPeriod.value}`,
            Object.keys(csvData[0] || {})
          );
        }
        break;
      case 'interest':
        if (interestData) {
          const csvData = interestData.trades.map(trade => ({
            'Scrip Code': trade.scrip_code,
            'Buy Date': trade.buy_date,
            'MTF Fund': trade.mtf_fund,
            'Days Held': trade.number_of_days_held,
            'Interest Paid': trade.interest_paid,
            'Daily Interest Rate': (trade.interest_paid / (trade.mtf_fund * trade.number_of_days_held) * 100).toFixed(4) + '%'
          }));
          reportingService.exportToCSV(
            csvData,
            `Interest-Report-${selectedPeriod.value}`,
            Object.keys(csvData[0] || {})
          );
        }
        break;
      case 'tax':
        if (taxData) {
          const csvData = [...taxData.stcgTrades, ...taxData.ltcgTrades].map(trade => ({
            'Scrip Code': trade.scrip_code,
            'Buy Date': trade.buy_date,
            'Sell Date': trade.sell_date,
            'Days Held': trade.number_of_days_held,
            'Tax Category': trade.number_of_days_held <= 365 ? 'STCG' : 'LTCG',
            'Net P&L': trade.net_profit_loss,
            'Tax Rate': trade.number_of_days_held <= 365 ? '15%' : '10%'
          }));
          reportingService.exportToCSV(
            csvData,
            `Tax-Report-${selectedPeriod.value}`,
            Object.keys(csvData[0] || {})
          );
        }
        break;
    }
  };

  const reportTypes = [
    { id: 'summary', label: 'Summary', icon: BarChart3, description: 'Overall portfolio overview' },
    { id: 'pl', label: 'P&L Report', icon: TrendingUp, description: 'Profit & Loss analysis' },
    { id: 'interest', label: 'Interest Report', icon: DollarSign, description: 'MTF interest breakdown' },
    { id: 'tax', label: 'Tax Report', icon: FileText, description: 'STCG/LTCG tax analysis' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setActiveReportType(type.id as ReportType)}
              className={`p-4 rounded-lg border transition-colors text-left ${
                activeReportType === type.id
                  ? 'bg-primary text-gray-800 border-primary'
                  : 'bg-surface text-white border-gray-700 hover:border-primary'
              }`}
            >
              <Icon size={24} className="mb-2" />
              <h3 className="font-semibold">{type.label}</h3>
              <p className={`text-sm ${activeReportType === type.id ? 'text-gray-700' : 'text-gray-400'}`}>
                {type.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Period Selector (hide for summary) */}
      {activeReportType !== 'summary' && (
        <div className="bg-surface p-4 rounded-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-400" />
              <label className="text-gray-300 font-medium">Report Period:</label>
            </div>
            <select
              value={selectedPeriod?.value || ''}
              onChange={(e) => {
                const period = periods.find(p => p.value === e.target.value);
                setSelectedPeriod(period || null);
              }}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleExportCSV}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-gray-800 rounded-md hover:bg-orange-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading report data...</p>
        </div>
      )}

      {/* Summary Report */}
      {activeReportType === 'summary' && summaryData && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface p-6 rounded-lg">
              <h3 className="text-gray-400 text-sm mb-2">Total Trades</h3>
              <p className="text-3xl font-bold text-white">{summaryData.totalTrades}</p>
              <p className="text-sm text-gray-500 mt-1">
                {summaryData.activeTrades} active, {summaryData.closedTrades} closed
              </p>
            </div>
            
            <div className="bg-surface p-6 rounded-lg">
              <h3 className="text-gray-400 text-sm mb-2">Total Invested</h3>
              <p className="text-3xl font-bold text-white">{formatCurrency(summaryData.totalInvested)}</p>
              <p className="text-sm text-gray-500 mt-1">Across all trades</p>
            </div>
            
            <div className="bg-surface p-6 rounded-lg">
              <h3 className="text-gray-400 text-sm mb-2">Total P&L</h3>
              <p className={`text-3xl font-bold ${summaryData.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(summaryData.totalPL)}
              </p>
              <p className="text-sm text-gray-500 mt-1">From closed trades</p>
            </div>
            
            <div className="bg-surface p-6 rounded-lg">
              <h3 className="text-gray-400 text-sm mb-2">Overall ROI</h3>
              <p className={`text-3xl font-bold ${summaryData.overallROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summaryData.overallROI.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Including unrealized</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Interest Paid:</span>
                  <span className="text-red-400 font-medium">{formatCurrency(summaryData.totalInterestPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Charges:</span>
                  <span className="text-red-400 font-medium">{formatCurrency(summaryData.totalChargesPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Value:</span>
                  <span className="text-blue-400 font-medium">{formatCurrency(summaryData.currentValue)}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Holding Period:</span>
                  <span className="text-white font-medium">{summaryData.avgHoldingPeriod.toFixed(0)} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Best Performer:</span>
                  <span className="text-green-400 font-medium">
                    {summaryData.bestPerformingStock.scrip} ({formatCurrency(summaryData.bestPerformingStock.pl)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Worst Performer:</span>
                  <span className="text-red-400 font-medium">
                    {summaryData.worstPerformingStock.scrip} ({formatCurrency(summaryData.worstPerformingStock.pl)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* P&L Report */}
      {activeReportType === 'pl' && plData && !loading && (
        <PLReportView data={plData} />
      )}

      {/* Interest Report */}
      {activeReportType === 'interest' && interestData && !loading && (
        <InterestReportView data={interestData} />
      )}

      {/* Tax Report */}
      {activeReportType === 'tax' && taxData && !loading && (
        <TaxReportView data={taxData} />
      )}
    </div>
  );
};

// P&L Report Component
const PLReportView: React.FC<{ data: PLReportData }> = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-gray-400 text-sm mb-2">Net P&L</h3>
        <p className={`text-3xl font-bold ${data.netPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatCurrency(data.netPL)}
        </p>
        <p className="text-sm text-gray-500 mt-1">{data.period}</p>
      </div>
      
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-gray-400 text-sm mb-2">Win Rate</h3>
        <p className="text-3xl font-bold text-white">{data.winRate.toFixed(1)}%</p>
        <p className="text-sm text-gray-500 mt-1">{data.profitableTrades}/{data.totalTrades} trades</p>
      </div>
      
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-gray-400 text-sm mb-2">Profit Factor</h3>
        <p className="text-3xl font-bold text-primary">{data.profitFactor.toFixed(2)}</p>
        <p className="text-sm text-gray-500 mt-1">Gross Profit / Gross Loss</p>
      </div>
      
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-gray-400 text-sm mb-2">ROI</h3>
        <p className={`text-3xl font-bold ${data.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {data.roi.toFixed(2)}%
        </p>
        <p className="text-sm text-gray-500 mt-1">On invested capital</p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Profit & Loss Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Gross Profit:</span>
            <span className="text-green-400 font-medium">{formatCurrency(data.grossProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gross Loss:</span>
            <span className="text-red-400 font-medium">{formatCurrency(data.grossLoss)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Average Profit:</span>
            <span className="text-green-400 font-medium">{formatCurrency(data.avgProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Average Loss:</span>
            <span className="text-red-400 font-medium">{formatCurrency(data.avgLoss)}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Extreme Values</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Largest Win:</span>
            <span className="text-green-400 font-medium">{formatCurrency(data.largestWin)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Largest Loss:</span>
            <span className="text-red-400 font-medium">{formatCurrency(data.largestLoss)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Investment:</span>
            <span className="text-white font-medium">{formatCurrency(data.totalInvestment)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Interest Report Component
const InterestReportView: React.FC<{ data: InterestReportData }> = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-gray-400 text-sm mb-2">Total Interest</h3>
        <p className="text-3xl font-bold text-red-400">{formatCurrency(data.totalInterestPaid)}</p>
        <p className="text-sm text-gray-500 mt-1">{data.period}</p>
      </div>
      
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-gray-400 text-sm mb-2">Avg Daily Interest</h3>
        <p className="text-3xl font-bold text-white">{formatCurrency(data.avgDailyInterest)}</p>
        <p className="text-sm text-gray-500 mt-1">Per day</p>
      </div>
      
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-gray-400 text-sm mb-2">Total Days</h3>
        <p className="text-3xl font-bold text-primary">{data.totalDaysHeld}</p>
        <p className="text-sm text-gray-500 mt-1">MTF holding days</p>
      </div>
      
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-gray-400 text-sm mb-2">Avg MTF Amount</h3>
        <p className="text-3xl font-bold text-white">{formatCurrency(data.avgMTFAmount)}</p>
        <p className="text-sm text-gray-500 mt-1">Per trade</p>
      </div>
    </div>

    {data.interestByMonth.length > 0 && (
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Monthly Interest Breakdown</h3>
        <div className="space-y-2">
          {data.interestByMonth.map((month) => (
            <div key={month.month} className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">{month.month}:</span>
              <div className="text-right">
                <span className="text-red-400 font-medium">{formatCurrency(month.interest)}</span>
                <span className="text-gray-500 text-sm ml-2">({month.trades} trades)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Tax Report Component
const TaxReportView: React.FC<{ data: TaxReportData }> = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Short Term Capital Gains (&le;1 Year)</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Trades:</span>
            <span className="text-white font-medium">{data.stcgTrades.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gross Profit:</span>
            <span className="text-green-400 font-medium">{formatCurrency(data.stcgProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gross Loss:</span>
            <span className="text-red-400 font-medium">{formatCurrency(data.stcgLoss)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-2">
            <span className="text-gray-400">Net STCG:</span>
            <span className={`font-bold ${data.netSTCG >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(data.netSTCG)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Est. Tax @ 15%:</span>
            <span className="text-red-400 font-medium">{formatCurrency(data.estimatedSTCGTax)}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Long Term Capital Gains (&gt;1 Year)</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Trades:</span>
            <span className="text-white font-medium">{data.ltcgTrades.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gross Profit:</span>
            <span className="text-green-400 font-medium">{formatCurrency(data.ltcgProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gross Loss:</span>
            <span className="text-red-400 font-medium">{formatCurrency(data.ltcgLoss)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-2">
            <span className="text-gray-400">Net LTCG:</span>
            <span className={`font-bold ${data.netLTCG >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(data.netLTCG)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Est. Tax @ 10%:</span>
            <span className="text-red-400 font-medium">{formatCurrency(data.estimatedLTCGTax)}</span>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-surface p-6 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">Tax Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Total Estimated Tax</p>
          <p className="text-2xl font-bold text-red-400">
            {formatCurrency(data.estimatedSTCGTax + data.estimatedLTCGTax)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Net Capital Gains</p>
          <p className={`text-2xl font-bold ${(data.netSTCG + data.netLTCG) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(data.netSTCG + data.netLTCG)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Effective Tax Rate</p>
          <p className="text-2xl font-bold text-white">
            {((data.estimatedSTCGTax + data.estimatedLTCGTax) / Math.max(data.netSTCG + data.netLTCG, 1) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-800 rounded text-sm text-gray-400">
        <p><strong>Note:</strong> Tax calculations are estimates. STCG is taxed at 15%, LTCG at 10% for gains above ₹1,00,000. 
        Consult a tax professional for accurate calculations.</p>
      </div>
    </div>
  </div>
);

export default Reports;