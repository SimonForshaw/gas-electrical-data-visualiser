import React from "react";

interface DateRangeSelectorProps {
  useEarliest: boolean;
  setUseEarliest: (value: boolean) => void;
  useLatest: boolean;
  setUseLatest: (value: boolean) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  isMovedOut: boolean;
  isLoading: boolean;
  selectedMeter: string;
  onFetchAvailableDates: () => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  useEarliest,
  setUseEarliest,
  useLatest,
  setUseLatest,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  isMovedOut,
  isLoading,
  selectedMeter,
  onFetchAvailableDates,
}) => {
  return (
    <>
      <div className="space-y-2">
        {isMovedOut && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-yellow-400 text-xs">
            ⚠️ Automatic date detection is unavailable for moved-out properties.
            Please enter dates manually for the period you lived there.
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useEarliest}
              onChange={(e) => setUseEarliest(e.target.checked)}
              disabled={isMovedOut}
              className="w-3 h-3 rounded border-gray-700 bg-gray-800/50 text-purple-500 focus:ring-purple-500 disabled:opacity-30 disabled:cursor-not-allowed"
            />
            <span
              className={`text-xs ${
                isMovedOut ? "text-gray-500" : "text-gray-300"
              }`}
            >
              Use Earliest Available
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useLatest}
              onChange={(e) => setUseLatest(e.target.checked)}
              disabled={isMovedOut}
              className="w-3 h-3 rounded border-gray-700 bg-gray-800/50 text-purple-500 focus:ring-purple-500 disabled:opacity-30 disabled:cursor-not-allowed"
            />
            <span
              className={`text-xs ${
                isMovedOut ? "text-gray-500" : "text-gray-300"
              }`}
            >
              Use Latest Available
            </span>
          </label>
        </div>

        {(useEarliest || useLatest) && !isMovedOut && (
          <div className="flex justify-center">
            <button
              onClick={onFetchAvailableDates}
              disabled={isLoading || !selectedMeter}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-1.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Fetching Dates..." : "Load Available Dates"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            disabled={useEarliest}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            disabled={useLatest}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </>
  );
};
