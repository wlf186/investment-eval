"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Medal } from "lucide-react";

interface Ranking {
  rank: number;
  user_id: number;
  name: string;
  total_value: number;
  return_pct: number;
  balance: number;
  holdings_count: number;
}

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await fetchAPI("/api/leaderboard?limit=10");
        setRankings(data.rankings || []);
      } catch (e) {
        console.error("Failed to load leaderboard:", e);
      }
    }
    loadLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-[#f59e0b]" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-[#94a3b8]" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-[#b45309]" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm text-[#94a3b8]">{rank}</span>;
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-[#f8fafc] p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#94a3b8] hover:text-[#f8fafc] mb-4 sm:mb-6 text-sm sm:text-base min-h-[44px]">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 flex items-center gap-2">
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-[#f59e0b]" />
          Leaderboard
        </h1>

        {/* Desktop table */}
        <div className="hidden sm:block bg-[#1e293b] rounded-lg border border-[#334155] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0f172a]">
              <tr>
                <th className="text-left p-4 text-[#94a3b8] font-medium">Rank</th>
                <th className="text-left p-4 text-[#94a3b8] font-medium">Trader</th>
                <th className="text-right p-4 text-[#94a3b8] font-medium">Total Value</th>
                <th className="text-right p-4 text-[#94a3b8] font-medium">Return</th>
                <th className="text-right p-4 text-[#94a3b8] font-medium">Holdings</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r.user_id} className="border-t border-[#334155] hover:bg-[#334155]/50">
                  <td className="p-4">{getRankIcon(r.rank)}</td>
                  <td className="p-4">
                    <span className="font-medium">{r.name}</span>
                  </td>
                  <td className="p-4 text-right">
                    ${r.total_value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`flex items-center justify-end gap-1 ${r.return_pct >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {r.return_pct >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {r.return_pct >= 0 ? "+" : ""}{r.return_pct?.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-4 text-right text-[#94a3b8]">{r.holdings_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {rankings.map((r) => (
            <div key={r.user_id} className="bg-[#1e293b] rounded-lg border border-[#334155] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getRankIcon(r.rank)}
                  <span className="font-medium">{r.name}</span>
                </div>
                <span className={`flex items-center gap-1 text-sm font-medium ${r.return_pct >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {r.return_pct >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {r.return_pct >= 0 ? "+" : ""}{r.return_pct?.toFixed(2)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[#94a3b8]">Total Value</p>
                  <p className="text-[#f8fafc] font-medium">${r.total_value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[#94a3b8]">Balance</p>
                  <p className="text-[#f8fafc] font-medium">${r.balance?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[#94a3b8]">Holdings</p>
                  <p className="text-[#f8fafc] font-medium">{r.holdings_count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
