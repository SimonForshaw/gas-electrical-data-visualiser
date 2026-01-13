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
    <div className="glass-card rounded-2xl p-8 mb-8">
      <div className="flex flex-col items-center gap-4 mb-8">
        <h3 className="text-3xl font-bold text-gray-800 text-center">
          📋 {title} Data Table
        </h3>
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl px-6 py-3">
          <p className="text-base font-semibold text-gray-700 text-center">
            {displayData.length} / {data.length} rows
          </p>
        </div>
      </div>
      <div
        className="overflow-auto max-h-96 rounded-xl border-2 border-gray-100 mx-auto"
        style={{ maxWidth: "100%" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-4 text-left">📅 Date</th>
              <th className="p-4 text-right">⚡ Usage ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50"
              >
                <td className="p-2">{row.date}</td>
                <td className="p-2 text-right">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(hasMore || rowLimit > 30) && (
        <div className="flex flex-wrap gap-3 justify-center mt-6 pt-6 border-t-2 border-gray-100">
          {hasMore && (
            <button
              onClick={() => setRowLimit(rowLimit + 30)}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg text-sm font-bold transition-all"
            >
              ➕ Show More (30)
            </button>
          )}
          {rowLimit > 30 && (
            <button
              onClick={() => setRowLimit(30)}
              className="px-6 py-2.5 bg-white/80 text-gray-700 rounded-lg hover:bg-white hover:shadow-md text-sm font-bold transition-all"
            >
              ➖ Show Less
            </button>
          )}
          {hasMore && (
            <button
              onClick={() => setRowLimit(data.length)}
              className="px-6 py-2.5 bg-white/80 text-gray-700 rounded-lg hover:bg-white hover:shadow-md text-sm font-bold transition-all"
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
