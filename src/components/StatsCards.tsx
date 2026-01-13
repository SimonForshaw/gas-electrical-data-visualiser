import React from "react";
import { DailyDataPoint } from "../types/types";

interface StatsCardsProps {
  data: DailyDataPoint[];
  title: string;
  unit: string;
}

const StatsCards: React.FC<StatsCardsProps> = ({ data, title, unit }) => {
  if (data.length === 0) return null;

  const total = data.reduce((sum, day) => sum + day.value, 0);
  const avg = total / data.length;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 text-white drop-shadow-md">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="stat-card glass-card p-6 rounded-2xl text-center">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Total Days
          </p>
          <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {data.length}
          </p>
        </div>
        <div className="stat-card glass-card p-6 rounded-2xl text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Total Consumption
          </p>
          <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {total.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 font-medium">{unit}</p>
        </div>
        <div className="stat-card glass-card p-6 rounded-2xl text-center">
          <div className="text-4xl mb-2">⚡</div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Daily Average
          </p>
          <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {avg.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 font-medium">{unit}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
