"use client";

import { LineChart } from "lucide-react";

export function BalanceChart({ timeframe }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <LineChart className="h-16 w-16 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Balance chart would render here</p>
      <p className="text-sm text-muted-foreground mt-2">
        Showing data for the last{" "}
        {timeframe === "week"
          ? "7 days"
          : timeframe === "month"
          ? "30 days"
          : timeframe === "quarter"
          ? "90 days"
          : "12 months"}
      </p>
    </div>
  );
}
