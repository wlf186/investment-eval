"use client";

import { useState } from "react";
import { fetchAPI } from "@/lib/api";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function TradingPanel({ symbol }: { symbol: string }) {
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  async function handleBuy() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await fetchAPI("/api/trading/buy", {
        method: "POST",
        body: JSON.stringify({ symbol, quantity: parseFloat(quantity) }),
      });
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Buy failed");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSell() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await fetchAPI("/api/trading/sell", {
        method: "POST",
        body: JSON.stringify({ symbol, quantity: parseFloat(quantity) }),
      });
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Sell failed");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-4">Trade {symbol}</h2>

      <div className="mb-4">
        <label className="block text-sm text-[#94a3b8] mb-1">Quantity</label>
        <input
          type="number"
          step="0.0001"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-[#f8fafc] min-h-[44px]"
          placeholder="Enter quantity..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleBuy}
          disabled={loading || !quantity}
          className="flex items-center justify-center gap-2 bg-[#22c55e] text-white py-3 px-4 rounded-lg hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <ArrowUpCircle className="w-4 h-4" />
          Buy
        </button>
        <button
          onClick={handleSell}
          disabled={loading || !quantity}
          className="flex items-center justify-center gap-2 bg-[#ef4444] text-white py-3 px-4 rounded-lg hover:bg-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <ArrowDownCircle className="w-4 h-4" />
          Sell
        </button>
      </div>

      {loading && <p className="mt-3 text-sm text-[#94a3b8]">Processing...</p>}
      {error && <p className="mt-3 text-sm text-[#ef4444]">{error}</p>}
      {result && (
        <div className="mt-3 bg-[#22c55e]/20 rounded-lg p-3">
          <p className="text-sm text-[#f8fafc] font-medium">Transaction successful!</p>
          <p className="text-xs text-[#94a3b8] mt-1">
            {result.quantity as number} {result.symbol as string} @ ${(result.price as number)?.toFixed(2)}
          </p>
          <p className="text-xs text-[#94a3b8]">Fee: ${(result.fee as number)?.toFixed(2)}</p>
          <p className="text-xs text-[#94a3b8]">Balance: ${(result.remaining_balance as number)?.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
