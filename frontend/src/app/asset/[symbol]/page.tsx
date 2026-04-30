"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import PriceChart from "@/components/PriceChart";
import AnalysisPanel from "@/components/AnalysisPanel";
import TradingPanel from "@/components/TradingPanel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PriceHistory {
  price: number;
  timestamp: string;
}

export default function AssetDetail() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await fetchAPI(`/api/prices/history/${symbol}?hours=168`); // 7天
        setHistory(data.history || []);
      } catch (e) {
        console.error("Failed to load history:", e);
      } finally {
        setLoading(false);
      }
    }
    if (symbol) loadHistory();
  }, [symbol]);

  return (
    <main className="min-h-screen bg-[#0f172a] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#94a3b8] hover:text-[#f8fafc] mb-4 sm:mb-6 text-sm sm:text-base min-h-[44px]">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#f8fafc] mb-6 sm:mb-8">{symbol}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <PriceChart symbol={symbol} history={history} loading={loading} />
            <AnalysisPanel symbol={symbol} />
          </div>
          <div>
            <TradingPanel symbol={symbol} />
          </div>
        </div>
      </div>
    </main>
  );
}
