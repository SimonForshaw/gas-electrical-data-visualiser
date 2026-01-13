import React from "react";
import { DailyDataPoint } from "../types/types";

interface StatsCardsProps {
  data: DailyDataPoint[];
  title: string;
  unit: string;
  totalCost?: number | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  data,
  title,
  unit,
  totalCost,
}) => {
  if (data.length === 0) return null;

  const total = data.reduce((sum, day) => sum + day.value, 0);
  const avg = total / data.length;

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-100 drop-shadow-md">
        {title}
      </h2>
      <div
        className={`grid grid-cols-1 ${
          totalCost !== null && totalCost !== undefined
            ? "md:grid-cols-4"
            : "md:grid-cols-3"
        } gap-4 mb-4`}
      >
        <div className="stat-card glass-card p-4 rounded-xl text-center">
          <div className="text-2xl mb-1">📅</div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Total Days
          </p>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {data.length}
          </p>
        </div>
        <div className="stat-card glass-card p-4 rounded-xl text-center">
          <div className="text-2xl mb-1">📊</div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Total Consumption
          </p>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {total.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 font-medium">{unit}</p>
        </div>
        <div className="stat-card glass-card p-4 rounded-xl text-center">
          <div className="text-2xl mb-1">⚡</div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Daily Average
          </p>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {avg.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 font-medium">{unit}</p>
        </div>
        {totalCost !== null && totalCost !== undefined && (
          <div className="stat-card glass-card p-4 rounded-xl text-center">
            <div className="text-2xl mb-1">💰</div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Total Cost
            </p>
            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              £{totalCost.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-1">
              inc. standing charge
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCards;
