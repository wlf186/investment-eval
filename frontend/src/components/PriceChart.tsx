"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PriceHistory {
  price: number;
  timestamp: string;
}

export default function PriceChart({
  history,
  loading,
}: {
  symbol: string;
  history: PriceHistory[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-4 sm:p-6 h-64 sm:h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  const data = history.map((h) => ({
    time: new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit" }),
    price: h.price,
  }));

  return (
    <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-4">Price History (7 Days)</h2>
      <ResponsiveContainer width="100%" height={240} className="sm:h-[300px]">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-45} textAnchor="end" height={60} />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#94a3b8" }} width={60} />
          <Tooltip
            formatter={(value) => [`$${Number(value)?.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Price"]}
            labelStyle={{ color: "#94a3b8" }}
            contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
          />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
