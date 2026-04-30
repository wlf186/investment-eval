"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioData {
  balance: number;
  total_value: number;
  total_pnl: number;
  total_pnl_percent: number;
  holdings: Array<{
    symbol: string;
    asset_name: string;
    quantity: number;
    current_price: number;
    market_value: number;
    pnl: number;
    pnl_percent: number;
  }>;
}

export default function PortfolioSummary() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const data = await fetchAPI("/api/trading/portfolio");
        if (!data.error) {
          setPortfolio(data);
        }
      } catch (e) {
        console.error("Failed to load portfolio:", e);
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[#3b82f6]" />
          <h2 className="text-lg sm:text-xl font-semibold text-[#f8fafc]">Portfolio</h2>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[#3b82f6]" />
          <h2 className="text-lg sm:text-xl font-semibold text-[#f8fafc]">Portfolio</h2>
        </div>
        <p className="text-sm text-[#94a3b8]">Portfolio data unavailable.</p>
      </div>
    );
  }

  const isPositive = portfolio.total_pnl >= 0;

  return (
    <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[#3b82f6]" />
        <h2 className="text-lg sm:text-xl font-semibold text-[#f8fafc]">Portfolio</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div className="bg-[#0f172a] rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-[#94a3b8]">Cash Balance</p>
          <p className="text-lg sm:text-xl font-bold text-[#f8fafc]">
            ${portfolio.balance?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-[#0f172a] rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-[#94a3b8]">Total Value</p>
          <p className="text-lg sm:text-xl font-bold text-[#f8fafc]">
            ${portfolio.total_value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-[#0f172a] rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-[#94a3b8]">Total P&L</p>
          <div className={`flex items-center gap-1 text-lg sm:text-xl font-bold ${isPositive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
            {isPositive ? <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
            {isPositive ? "+" : ""}${portfolio.total_pnl?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            <span className="text-xs sm:text-sm font-normal">({portfolio.total_pnl_percent?.toFixed(2)}%)</span>
          </div>
        </div>
      </div>

      {portfolio.holdings && portfolio.holdings.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#334155]">
                <tr>
                  <th className="text-left p-2 rounded-tl-lg text-[#94a3b8]">Asset</th>
                  <th className="text-right p-2 text-[#94a3b8]">Quantity</th>
                  <th className="text-right p-2 text-[#94a3b8]">Price</th>
                  <th className="text-right p-2 text-[#94a3b8]">Value</th>
                  <th className="text-right p-2 rounded-tr-lg text-[#94a3b8]">P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((h) => (
                  <tr key={h.symbol} className="border-t border-[#334155]">
                    <td className="p-2">
                      <span className="font-medium text-[#f8fafc]">{h.asset_name}</span>
                      <span className="text-[#94a3b8] ml-1">{h.symbol}</span>
                    </td>
                    <td className="text-right p-2 text-[#f8fafc]">{h.quantity?.toFixed(4)}</td>
                    <td className="text-right p-2 text-[#f8fafc]">${h.current_price?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="text-right p-2 text-[#f8fafc]">${h.market_value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className={`text-right p-2 font-medium ${h.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {h.pnl >= 0 ? "+" : ""}${h.pnl?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {portfolio.holdings.map((h) => (
              <div key={h.symbol} className="bg-[#0f172a] rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-[#f8fafc] text-sm">{h.asset_name}</span>
                    <span className="text-[#94a3b8] ml-1 text-xs">{h.symbol}</span>
                  </div>
                  <span className={`text-sm font-medium ${h.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {h.pnl >= 0 ? "+" : ""}${h.pnl?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-[#94a3b8]">Qty</p>
                    <p className="text-[#f8fafc]">{h.quantity?.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-[#94a3b8]">Price</p>
                    <p className="text-[#f8fafc]">${h.current_price?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-[#94a3b8]">Value</p>
                    <p className="text-[#f8fafc]">${h.market_value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
