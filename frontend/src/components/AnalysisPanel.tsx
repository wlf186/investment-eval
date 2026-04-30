"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AnalysisData {
  rsi: number;
  macd: number;
  macd_signal: number;
  trend_direction: string;
  signal_strength: number;
  bollinger_bands: { upper: number; middle: number; lower: number };
  key_levels: { support: number; resistance: number };
  notes: string;
}

interface PredictionData {
  timeframe: string;
  direction: string;
  confidence: number;
  predicted_change: number;
  reasoning: string;
}

export default function AnalysisPanel({ symbol }: { symbol: string }) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [analysisData, predictionData] = await Promise.all([
          fetchAPI(`/api/analysis/signals/${symbol}`),
          fetchAPI(`/api/analysis/predictions/${symbol}`),
        ]);
        if (!analysisData.error) setAnalysis(analysisData);
        setPredictions(predictionData.predictions || []);
      } catch (e) {
        console.error("Failed to load analysis:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [symbol]);

  if (loading) {
    return (
      <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-4 sm:p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-4 sm:p-6">
        <p className="text-[#94a3b8]">No analysis data available yet.</p>
      </div>
    );
  }

  const trendIcon =
    analysis.trend_direction === "bullish" ? (
      <TrendingUp className="w-5 h-5 text-[#22c55e]" />
    ) : analysis.trend_direction === "bearish" ? (
      <TrendingDown className="w-5 h-5 text-[#ef4444]" />
    ) : (
      <Minus className="w-5 h-5 text-[#94a3b8]" />
    );

  return (
    <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-[#3b82f6]" />
        <h2 className="text-base sm:text-lg font-semibold text-[#f8fafc]">Technical Analysis</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <div className="bg-[#0f172a] rounded-lg p-3">
          <p className="text-xs text-[#94a3b8]">RSI (14)</p>
          <p className={`text-base sm:text-lg font-bold ${analysis.rsi > 70 ? "text-[#ef4444]" : analysis.rsi < 30 ? "text-[#22c55e]" : "text-[#f8fafc]"}`}>
            {analysis.rsi?.toFixed(1)}
          </p>
        </div>
        <div className="bg-[#0f172a] rounded-lg p-3">
          <p className="text-xs text-[#94a3b8]">MACD</p>
          <p className="text-base sm:text-lg font-bold text-[#f8fafc]">{analysis.macd?.toFixed(4)}</p>
        </div>
        <div className="bg-[#0f172a] rounded-lg p-3">
          <p className="text-xs text-[#94a3b8]">Trend</p>
          <div className="flex items-center gap-1">
            {trendIcon}
            <span className="text-sm font-medium capitalize text-[#f8fafc]">{analysis.trend_direction}</span>
          </div>
        </div>
        <div className="bg-[#0f172a] rounded-lg p-3">
          <p className="text-xs text-[#94a3b8]">Strength</p>
          <p className="text-base sm:text-lg font-bold text-[#f8fafc]">{analysis.signal_strength}/10</p>
        </div>
      </div>

      {analysis.bollinger_bands && (
        <div className="mb-4">
          <p className="text-sm text-[#94a3b8] mb-2">Bollinger Bands</p>
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="bg-[#0f172a] text-[#ef4444] px-2 py-1 rounded">Upper: ${analysis.bollinger_bands.upper?.toLocaleString()}</span>
            <span className="bg-[#0f172a] text-[#94a3b8] px-2 py-1 rounded">Middle: ${analysis.bollinger_bands.middle?.toLocaleString()}</span>
            <span className="bg-[#0f172a] text-[#22c55e] px-2 py-1 rounded">Lower: ${analysis.bollinger_bands.lower?.toLocaleString()}</span>
          </div>
        </div>
      )}

      {predictions.length > 0 && (
        <div>
          <p className="text-sm text-[#94a3b8] mb-2">Predictions</p>
          <div className="space-y-2">
            {predictions.map((p) => (
              <div key={p.timeframe} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#0f172a] rounded-lg p-3 gap-2">
                <div>
                  <span className="text-sm font-medium text-[#f8fafc]">{p.timeframe}</span>
                  <span className={`ml-2 text-sm ${p.direction === "up" ? "text-[#22c55e]" : p.direction === "down" ? "text-[#ef4444]" : "text-[#94a3b8]"}`}>
                    {p.direction === "up" ? "↑" : p.direction === "down" ? "↓" : "→"} {p.direction}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium text-[#f8fafc]">{p.confidence}% confidence</p>
                  <p className="text-xs text-[#94a3b8]">{p.predicted_change > 0 ? "+" : ""}{p.predicted_change}% expected</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
