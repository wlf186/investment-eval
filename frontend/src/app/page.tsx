"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import PriceCard from "@/components/PriceCard";
import PortfolioSummary from "@/components/PortfolioSummary";
import { Activity, TrendingUp, Trophy, BarChart3 } from "lucide-react";
import Link from "next/link";

interface AssetPrice {
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  asset_type: string;
}

export default function Dashboard() {
  const [prices, setPrices] = useState<AssetPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrices() {
      try {
        const data = await fetchAPI("/api/prices/latest");
        setPrices(data.prices || []);
      } catch (e) {
        console.error("Failed to load prices:", e);
      } finally {
        setLoading(false);
      }
    }
    loadPrices();
    const interval = setInterval(loadPrices, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, []);

  const goldPrices = prices.filter((p) => p.asset_type === "gold");
  const cryptoPrices = prices.filter((p) => p.asset_type === "crypto");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#f8fafc] flex items-center gap-2">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-[#3b82f6]" />
              Gold & Crypto Tracker
            </h1>
            <p className="text-sm sm:text-base text-[#94a3b8] mt-1">Real-time prices, analysis & simulated trading</p>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:pb-0">
            <Link
              href="/trade"
              className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg border border-[#334155] transition-colors text-sm sm:text-base whitespace-nowrap min-h-[44px]"
            >
              <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              Trade
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg border border-[#334155] transition-colors text-sm sm:text-base whitespace-nowrap min-h-[44px]"
            >
              <Trophy className="w-4 h-4 text-[#f59e0b]" />
              Leaderboard
            </Link>
            <Link
              href="/predictions"
              className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg border border-[#334155] transition-colors text-sm sm:text-base whitespace-nowrap min-h-[44px]"
            >
              <BarChart3 className="w-4 h-4 text-[#3b82f6]" />
              Predictions
            </Link>
          </nav>
        </header>

        <PortfolioSummary />

        {/* Gold Section */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-[#f8fafc] mb-3 sm:mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
            Gold
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {goldPrices.map((price) => (
              <PriceCard key={price.symbol} asset={price} />
            ))}
          </div>
        </section>

        {/* Crypto Section */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-[#f8fafc] mb-3 sm:mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
            Cryptocurrency
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {cryptoPrices.map((price) => (
              <PriceCard key={price.symbol} asset={price} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
