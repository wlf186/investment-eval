"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";

interface Prediction {
  symbol: string;
  name: string;
  timeframe: string;
  direction: string;
  confidence: number;
  predicted_change: number;
  reasoning: string;
  generated_at: string;
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    async function loadPredictions() {
      try {
        // 获取资产列表
        const assetsData = await fetchAPI("/api/assets");
        const allAssets: { symbol: string; name: string }[] = [
          ...assetsData.gold.map((a: { symbol: string; name: string }) => ({ symbol: a.symbol, name: a.name })),
          ...assetsData.crypto.map((a: { symbol: string; name: string }) => ({ symbol: a.symbol, name: a.name }))
        ];

        // 获取每个资产的预测
        const allPredictions: Prediction[] = [];
        for (const asset of allAssets) {
          try {
            const data = await fetchAPI(`/api/analysis/predictions/${asset.symbol}`);
            if (data.predictions) {
              for (const p of data.predictions) {
                allPredictions.push({
                  symbol: asset.symbol,
                  name: asset.name,
                  ...p
                });
              }
            }
          } catch {
            // 忽略单个资产错误
          }
        }

        setPredictions(allPredictions);
      } catch (e) {
        console.error("Failed to load predictions:", e);
      }
    }
    loadPredictions();
  }, []);

  const timeframes = ["24h", "7d", "30d"];

  return (
    <main className="min-h-screen bg-[#0f172a] text-[#f8fafc] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#94a3b8] hover:text-[#f8fafc] mb-4 sm:mb-6 text-sm sm:text-base min-h-[44px]">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-[#3b82f6]" />
          Predictions Center
        </h1>

        {timeframes.map(tf => {
          const tfPredictions = predictions.filter(p => p.timeframe === tf);
          return (
            <section key={tf} className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#f59e0b]" />
                {tf === "24h" ? "24 Hours" : tf === "7d" ? "7 Days" : "30 Days"} Forecast
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {tfPredictions.map(p => (
                  <div key={`${p.symbol}-${tf}`} className="bg-[#1e293b] rounded-lg p-3 sm:p-4 border border-[#334155]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">{p.name}</h3>
                        <span className="text-xs sm:text-sm text-[#94a3b8]">{p.symbol}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${p.direction === "up" ? "text-[#22c55e]" : p.direction === "down" ? "text-[#ef4444]" : "text-[#94a3b8]"}`}>
                        {p.direction === "up" ? <TrendingUp className="w-4 h-4" /> : p.direction === "down" ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        {p.direction}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-[#0f172a] rounded p-2">
                        <p className="text-xs text-[#94a3b8]">Confidence</p>
                        <p className="text-base sm:text-lg font-bold">{p.confidence}%</p>
                      </div>
                      <div className="bg-[#0f172a] rounded p-2">
                        <p className="text-xs text-[#94a3b8]">Expected Change</p>
                        <p className={`text-base sm:text-lg font-bold ${p.predicted_change > 0 ? "text-[#22c55e]" : p.predicted_change < 0 ? "text-[#ef4444]" : ""}`}>
                          {p.predicted_change > 0 ? "+" : ""}{p.predicted_change}%
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#94a3b8] leading-relaxed">{p.reasoning}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
