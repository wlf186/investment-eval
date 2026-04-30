"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AssetPrice {
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
}

export default function PriceCard({ asset }: { asset: AssetPrice }) {
  const isPositive = (asset.change_24h || 0) >= 0;
  const changePercent = (asset.change_24h || 0).toFixed(2);

  return (
    <Link href={`/asset/${asset.symbol}`}>
      <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-3 sm:p-4 hover:bg-[#334155]/50 transition-colors min-h-[44px]">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-[#f8fafc] text-sm sm:text-base">{asset.name}</h3>
            <span className="text-xs sm:text-sm text-[#94a3b8]">{asset.symbol}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${isPositive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
            {isPositive ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
            {isPositive ? "+" : ""}{changePercent}%
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-[#f8fafc]">
          ${asset.price?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    </Link>
  );
}
