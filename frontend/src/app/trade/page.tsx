"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
}

interface Holding {
  symbol: string;
  asset_name: string;
  quantity: number;
  avg_buy_price: number;
  market_value: number;
  pnl: number;
}

interface Portfolio {
  balance: number;
  total_value: number;
  holdings: Holding[];
}

interface TradeResult {
  success: boolean;
  type?: string;
  quantity?: number;
  symbol?: string;
  price?: number;
  remaining_balance?: number;
  error?: string;
}

export default function TradePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [result, setResult] = useState<TradeResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [pricesData, portfolioData] = await Promise.all([
          fetchAPI("/api/prices/latest"),
          fetchAPI("/api/trading/portfolio")
        ]);
        setAssets(pricesData.prices || []);
        setPortfolio(portfolioData);
        if (pricesData.prices?.length > 0) {
          setSelectedSymbol(pricesData.prices[0].symbol);
        }
      } catch (e) {
        console.error("Failed to load data:", e);
      }
    }
    loadData();
  }, []);

  async function handleBuy() {
    setError("");
    setResult(null);
    try {
      const data = await fetchAPI(`/api/trading/buy?symbol=${selectedSymbol}&quantity=${quantity}`, { method: "POST" });
      if (data.success) {
        setResult({ ...data, type: "buy" });
        // 刷新portfolio
        const portfolioData = await fetchAPI("/api/trading/portfolio");
        setPortfolio(portfolioData);
      } else {
        setError(data.error || "Buy failed");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  async function handleSell() {
    setError("");
    setResult(null);
    try {
      const data = await fetchAPI(`/api/trading/sell?symbol=${selectedSymbol}&quantity=${quantity}`, { method: "POST" });
      if (data.success) {
        setResult({ ...data, type: "sell" });
        const portfolioData = await fetchAPI("/api/trading/portfolio");
        setPortfolio(portfolioData);
      } else {
        setError(data.error || "Sell failed");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  const selectedAsset = assets.find(a => a.symbol === selectedSymbol);

  return (
    <main className="min-h-screen bg-[#0f172a] text-[#f8fafc] p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#94a3b8] hover:text-[#f8fafc] mb-4 sm:mb-6 text-sm sm:text-base min-h-[44px]">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 flex items-center gap-2">
          <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-[#3b82f6]" />
          Trading
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Trading Form */}
          <div className="bg-[#1e293b] rounded-lg p-4 sm:p-6 border border-[#334155]">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Place Order</h2>

            <div className="mb-4">
              <label className="block text-sm text-[#94a3b8] mb-2">Asset</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-[#f8fafc] min-h-[44px]"
              >
                {assets.map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>
                ))}
              </select>
            </div>

            {selectedAsset && (
              <div className="mb-4 bg-[#0f172a] rounded-lg p-3">
                <p className="text-sm text-[#94a3b8]">Current Price</p>
                <p className="text-lg sm:text-xl font-bold">${selectedAsset.price?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                <p className={`text-sm ${selectedAsset.change_24h >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {selectedAsset.change_24h >= 0 ? "+" : ""}{selectedAsset.change_24h?.toFixed(2)}%
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-[#94a3b8] mb-2">Quantity</label>
              <input
                type="number"
                step="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-[#f8fafc] min-h-[44px]"
                placeholder="Enter quantity..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleBuy}
                disabled={!quantity}
                className="flex items-center justify-center gap-2 bg-[#22c55e] text-white py-3 px-4 rounded-lg hover:bg-[#16a34a] disabled:opacity-50 min-h-[44px]"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Buy
              </button>
              <button
                onClick={handleSell}
                disabled={!quantity}
                className="flex items-center justify-center gap-2 bg-[#ef4444] text-white py-3 px-4 rounded-lg hover:bg-[#dc2626] disabled:opacity-50 min-h-[44px]"
              >
                <ArrowDownCircle className="w-4 h-4" />
                Sell
              </button>
            </div>

            {error && <p className="mt-3 text-sm text-[#ef4444]">{error}</p>}
            {result && (
              <div className={`mt-3 rounded-lg p-3 ${result.type === "buy" ? "bg-[#22c55e]/20" : "bg-[#ef4444]/20"}`}>
                <p className="text-sm font-medium">{result.type === "buy" ? "Buy" : "Sell"} successful!</p>
                <p className="text-xs text-[#94a3b8]">{result.quantity} {result.symbol} @ ${result.price?.toFixed(2)}</p>
                <p className="text-xs text-[#94a3b8]">Balance: ${result.remaining_balance?.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Portfolio Summary */}
          <div className="bg-[#1e293b] rounded-lg p-4 sm:p-6 border border-[#334155]">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Your Portfolio</h2>

            {portfolio && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#0f172a] rounded-lg p-3">
                    <p className="text-xs text-[#94a3b8]">Balance</p>
                    <p className="text-base sm:text-lg font-bold">${portfolio.balance?.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#0f172a] rounded-lg p-3">
                    <p className="text-xs text-[#94a3b8]">Total Value</p>
                    <p className="text-base sm:text-lg font-bold">${portfolio.total_value?.toFixed(2)}</p>
                  </div>
                </div>

                {portfolio.holdings && portfolio.holdings.length > 0 ? (
                  <div className="space-y-2">
                    {portfolio.holdings.map((h) => (
                      <div key={h.symbol} className="bg-[#0f172a] rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{h.asset_name}</p>
                          <p className="text-xs text-[#94a3b8]">{h.quantity?.toFixed(4)} @ ${h.avg_buy_price?.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">${h.market_value?.toFixed(2)}</p>
                          <p className={`text-xs ${h.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            {h.pnl >= 0 ? "+" : ""}{h.pnl?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#94a3b8] text-sm">No holdings yet. Start trading!</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
