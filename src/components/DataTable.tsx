import React from "react";
import { DailyDataPoint } from "../types/types";

interface DataTableProps {
  data: DailyDataPoint[];
  title: string;
  unit: string;
  rowLimit: number;
  setRowLimit: (limit: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  title,
  unit,
  rowLimit,
  setRowLimit,
}) => {
  if (data.length === 0) return null;

  const displayData = data.slice(0, rowLimit);
  const hasMore = data.length > rowLimit;

  return (
    <div className="glass-card rounded-xl p-4 mb-6">
      <div className="flex flex-col items-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-gray-800 text-center">
          📋 {title} Data Table
        </h3>
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg px-4 py-2">
          <p className="text-xs font-semibold text-gray-700 text-center">
            {displayData.length} / {data.length} rows
          </p>
        </div>
      </div>
      <div
        className="overflow-auto max-h-80 rounded-lg border border-gray-100 mx-auto"
        style={{ maxWidth: "100%" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left">📅 Date</th>
              <th className="p-2 text-right">⚡ Usage ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50"
              >
                <td className="p-1.5">{row.date}</td>
                <td className="p-1.5 text-right">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(hasMore || rowLimit > 30) && (
        <div className="flex flex-wrap gap-2 justify-center mt-4 pt-4 border-t border-gray-100">
          {hasMore && (
            <button
              onClick={() => setRowLimit(rowLimit + 30)}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg text-xs font-bold transition-all"
            >
              ➕ Show More (30)
            </button>
          )}
          {rowLimit > 30 && (
            <button
              onClick={() => setRowLimit(30)}
              className="px-4 py-1.5 bg-white/80 text-gray-700 rounded-lg hover:bg-white hover:shadow-md text-xs font-bold transition-all"
            >
              ➖ Show Less
            </button>
          )}
          {hasMore && (
            <button
              onClick={() => setRowLimit(data.length)}
              className="px-4 py-1.5 bg-white/80 text-gray-700 rounded-lg hover:bg-white hover:shadow-md text-xs font-bold transition-all"
            >
              Show All ({data.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;
