import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DailyDataPoint,
  TimeRange,
  ComparisonMode,
  ComparisonDataPoint,
} from "../types/types";
import {
  filterDataByTimeRange,
  getAvailableYears,
  compareYears,
  compareMonths,
  calculateYearTotals,
  calculateMonthTotals,
  calculatePercentageChanges,
} from "../utils/dataUtils";

type ChartType = "line" | "bar" | "step";

interface EnergyChartProps {
  data: DailyDataPoint[];
  title: string;
  color: string;
  unit: string;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  comparisonMode: ComparisonMode;
  setComparisonMode: (mode: ComparisonMode) => void;
  comparisonYears: number[];
  setComparisonYears: (years: number[]) => void;
  comparisonMonth: number;
  setComparisonMonth: (month: number) => void;
  costPerKwh: { [year: number]: number };
  setCostPerKwh: (costs: { [year: number]: number }) => void;
  nightRateEnabled?: { [year: number]: boolean };
  setNightRateEnabled?: (enabled: { [year: number]: boolean }) => void;
  nightRate?: { [year: number]: number };
  setNightRate?: (rates: { [year: number]: number }) => void;
}

const EnergyChart: React.FC<EnergyChartProps> = ({
  data,
  title,
  color,
  unit,
  timeRange,
  setTimeRange,
  selectedDate,
  setSelectedDate,
  comparisonMode,
  setComparisonMode,
  comparisonYears,
  setComparisonYears,
  comparisonMonth,
  setComparisonMonth,
  costPerKwh,
  setCostPerKwh,
  nightRateEnabled,
  setNightRateEnabled,
  nightRate,
  setNightRate,
}) => {
  const [chartType, setChartType] = useState<ChartType>("line");

  // Check if this is electricity (has night rate capability)
  const hasNightRate =
    nightRateEnabled !== undefined && setNightRateEnabled !== undefined;

  // Get available years for comparison
  const availableYears = useMemo(() => getAvailableYears(data), [data]);
  const hasMultipleYears = availableYears.length > 1;

  // Memoize filtered data to avoid recalculating on every render
  const filteredData = useMemo(
    () => filterDataByTimeRange(data, timeRange, selectedDate),
    [data, timeRange, selectedDate]
  );

  // Memoize comparison data
  const comparisonData = useMemo(() => {
    if (comparisonMode === "none" || comparisonYears.length === 0) return null;

    if (comparisonMode === "year") {
      return compareYears(data, comparisonYears);
    } else if (comparisonMode === "month") {
      return compareMonths(data, comparisonMonth, comparisonYears);
    }
    return null;
  }, [data, comparisonMode, comparisonYears, comparisonMonth]);

  // Memoize comparison statistics
  const comparisonStats = useMemo(() => {
    if (comparisonMode === "none" || comparisonYears.length === 0) return null;

    let totals: { [year: number]: number } = {};
    if (comparisonMode === "year") {
      totals = calculateYearTotals(data, comparisonYears);
    } else if (comparisonMode === "month") {
      totals = calculateMonthTotals(data, comparisonMonth, comparisonYears);
    }

    const percentageChanges = calculatePercentageChanges(
      totals,
      comparisonYears
    );

    return { totals, percentageChanges };
  }, [data, comparisonMode, comparisonYears, comparisonMonth]);

  // Memoize available date range
  const dateRange = useMemo(() => {
    if (data.length === 0) return { min: "", max: "" };
    const dates = data.map((d) => new Date(d.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    return {
      min: minDate.toISOString().split("T")[0],
      max: maxDate.toISOString().split("T")[0],
    };
  }, [data]);

  // Check if night rate visualization should be active
  const shouldShowNightRateVisualization = useMemo(() => {
    if (!hasNightRate || comparisonMode !== "none" || timeRange !== "daily") {
      return false;
    }
    // Check if night rate is enabled for any year in the current filtered data
    const years = new Set(
      filteredData.map((point) => new Date(point.date).getFullYear())
    );
    return Array.from(years).some((year) => nightRateEnabled?.[year]);
  }, [hasNightRate, comparisonMode, timeRange, filteredData, nightRateEnabled]);

  // Split data into night rate and standard rate periods
  const splitDataByRate = useMemo(() => {
    if (!shouldShowNightRateVisualization) {
      return null;
    }

    const nightRateData: DailyDataPoint[] = [];
    const standardRateData: DailyDataPoint[] = [];

    filteredData.forEach((point) => {
      const date = new Date(point.date);
      const hours = date.getHours();
      const minutes = date.getMinutes();

      // Night rate is between 00:30 and 05:30
      const isNightTime =
        (hours === 0 && minutes >= 30) ||
        (hours >= 1 && hours < 5) ||
        (hours === 5 && minutes < 30);

      if (isNightTime) {
        nightRateData.push(point);
      } else {
        standardRateData.push(point);
      }
    });

    return { nightRateData, standardRateData };
  }, [shouldShowNightRateVisualization, filteredData]);

  if (data.length === 0) return null;

  // Handle year selection toggle
  const toggleYear = (year: number) => {
    if (comparisonYears.includes(year)) {
      setComparisonYears(comparisonYears.filter((y) => y !== year));
    } else {
      setComparisonYears([...comparisonYears, year]);
    }
  };

  // Handle cost per kWh update
  const updateCostForYear = (year: number, cost: number) => {
    setCostPerKwh({
      ...costPerKwh,
      [year]: cost,
    });
  };

  // Handle night rate toggle
  const toggleNightRate = (year: number) => {
    if (!setNightRateEnabled) return;
    setNightRateEnabled({
      ...nightRateEnabled,
      [year]: !nightRateEnabled?.[year],
    });
  };

  // Handle night rate cost update
  const updateNightRateForYear = (year: number, cost: number) => {
    if (!setNightRate) return;
    setNightRate({
      ...nightRate,
      [year]: cost,
    });
  };

  // Calculate cost with night rate support (00:30 - 05:30)
  const calculateTotalCostWithNightRate = (
    year: number,
    totalKwh: number
  ): number => {
    const standardRate = costPerKwh[year] || 0;
    const nightRateValue = nightRate?.[year] || 0;
    const isNightRateEnabled = nightRateEnabled?.[year] || false;

    if (!isNightRateEnabled || nightRateValue === 0 || standardRate === 0) {
      // Simple calculation without night rate
      return totalKwh * standardRate;
    }

    // Filter data for this year
    const yearData = data.filter((point) => {
      const date = new Date(point.date);
      const pointYear = date.getFullYear();
      return pointYear === year;
    });

    // Separate night rate hours (00:30 - 05:30) from standard hours
    let nightRateKwh = 0;
    let standardRateKwh = 0;

    yearData.forEach((point) => {
      const date = new Date(point.date);
      const hours = date.getHours();
      const minutes = date.getMinutes();

      // Night rate is between 00:30 and 05:30
      const isNightTime =
        (hours === 0 && minutes >= 30) || // 00:30-00:59
        (hours >= 1 && hours < 5) || // 01:00-04:59
        (hours === 5 && minutes < 30); // 05:00-05:29

      if (isNightTime) {
        nightRateKwh += point.value;
      } else {
        standardRateKwh += point.value;
      }
    });

    return standardRateKwh * standardRate + nightRateKwh * nightRateValue;
  };

  // Calculate the date range of the data in days
  const getDataRangeInDays = (): number => {
    if (data.length === 0) return 0;
    const dates = data.map((d) => new Date(d.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
  };

  const dataRangeInDays = getDataRangeInDays();

  // Define all time range options with their minimum required days
  const allTimeRangeOptions: {
    label: string;
    value: TimeRange;
    minDays: number;
  }[] = [
    { label: "Daily", value: "daily", minDays: 1 },
    { label: "7 Days", value: "7d", minDays: 7 },
    { label: "30 Days", value: "30d", minDays: 30 },
    { label: "90 Days", value: "90d", minDays: 90 },
    { label: "Year", value: "year", minDays: 365 },
    { label: "All", value: "all", minDays: 366 },
  ];

  // Filter options based on available data
  const timeRangeOptions = allTimeRangeOptions.filter(
    (option) => option.minDays === 0 || dataRangeInDays >= option.minDays
  );

  // Chart type options
  const chartTypeOptions: { value: ChartType; label: string; icon: string }[] =
    [
      { value: "line", label: "Line", icon: "📈" },
      { value: "bar", label: "Bar", icon: "📊" },
      { value: "step", label: "Step", icon: "⚡" },
    ];

  // Render the appropriate chart based on selected type
  const renderChart = () => {
    const commonProps = {
      data: filteredData,
    };

    const commonAxisProps = {
      xAxisProps: {
        dataKey: "date",
        tick: { fontSize: 12 },
        angle: -45,
        textAnchor: "end" as const,
        height: 80,
        tickFormatter: (value: string) => {
          const date = new Date(value);
          // Show time only for daily view, otherwise just date
          if (timeRange === "daily") {
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });
          } else {
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }
        },
      },
      yAxisProps: {
        label: { value: unit, angle: -90, position: "insideLeft" as const },
      },
    };

    const gradientId = `gradient-${title.replace(/\s+/g, "-")}`;
    const nightGradientId = `gradient-night-${title.replace(/\s+/g, "-")}`;

    // If night rate visualization is active, render dual series
    if (shouldShowNightRateVisualization && splitDataByRate) {
      // Merge data for proper x-axis continuity
      const mergedData = [...filteredData].map((point) => {
        const date = new Date(point.date);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const isNightTime =
          (hours === 0 && minutes >= 30) ||
          (hours >= 1 && hours < 5) ||
          (hours === 5 && minutes < 30);

        return {
          date: point.date,
          standardRate: isNightTime ? null : point.value,
          nightRate: isNightTime ? point.value : null,
        };
      });

      switch (chartType) {
        case "bar":
          return (
            <BarChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis {...commonAxisProps.xAxisProps} />
              <YAxis {...commonAxisProps.yAxisProps} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="standardRate"
                fill={color}
                name={`Standard Rate (${unit})`}
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="nightRate"
                fill="#4f46e5"
                name={`🌙 Night Rate (${unit})`}
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          );

        case "step":
          return (
            <LineChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis {...commonAxisProps.xAxisProps} />
              <YAxis {...commonAxisProps.yAxisProps} />
              <Tooltip />
              <Legend />
              <Line
                type="stepAfter"
                dataKey="standardRate"
                stroke={color}
                strokeWidth={3}
                dot={{ r: 3, fill: color }}
                name={`Standard Rate (${unit})`}
                connectNulls={false}
              />
              <Line
                type="stepAfter"
                dataKey="nightRate"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 3, fill: "#4f46e5" }}
                name={`🌙 Night Rate (${unit})`}
                connectNulls={false}
              />
            </LineChart>
          );

        case "line":
        default:
          return (
            <AreaChart data={mergedData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.2} />
                </linearGradient>
                <linearGradient
                  id={nightGradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis {...commonAxisProps.xAxisProps} />
              <YAxis {...commonAxisProps.yAxisProps} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="standardRate"
                stroke={color}
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                name={`Standard Rate (${unit})`}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="nightRate"
                stroke="#4f46e5"
                strokeWidth={3}
                fill={`url(#${nightGradientId})`}
                name={`🌙 Night Rate (${unit})`}
                connectNulls={false}
              />
            </AreaChart>
          );
      }
    }

    // Standard single-series rendering
    switch (chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...commonAxisProps.xAxisProps} />
            <YAxis {...commonAxisProps.yAxisProps} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="value"
              fill={color}
              name={`Daily Usage (${unit})`}
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        );

      case "step":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...commonAxisProps.xAxisProps} />
            <YAxis {...commonAxisProps.yAxisProps} />
            <Tooltip />
            <Legend />
            <Line
              type="stepAfter"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              dot={{ r: 3, fill: color }}
              name={`Daily Usage (${unit})`}
            />
          </LineChart>
        );

      case "line":
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                <stop offset="95%" stopColor={color} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...commonAxisProps.xAxisProps} />
            <YAxis {...commonAxisProps.yAxisProps} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              name={`Daily Usage (${unit})`}
            />
          </AreaChart>
        );
    }
  };

  // Render comparison chart
  const renderComparisonChart = () => {
    if (!comparisonData || comparisonYears.length === 0) return null;

    const colors = [
      "#2563eb",
      "#dc2626",
      "#16a34a",
      "#ea580c",
      "#9333ea",
      "#0891b2",
    ];

    const xAxisLabel =
      comparisonMode === "month"
        ? `Day of ${new Date(2000, comparisonMonth - 1).toLocaleDateString(
            "en-US",
            { month: "long" }
          )}`
        : "Date (MM-DD)";

    return (
      <LineChart data={comparisonData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
          label={{ value: xAxisLabel, position: "insideBottom", offset: -10 }}
        />
        <YAxis
          label={{ value: unit, angle: -90, position: "insideLeft" as const }}
        />
        <Tooltip />
        <Legend />
        {comparisonYears.map((year, index) => (
          <Line
            key={year}
            type="monotone"
            dataKey={`${year}`}
            stroke={colors[index % colors.length]}
            strokeWidth={3}
            dot={false}
            name={`${year}`}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-8 mb-8">
      <div className="flex flex-col items-center gap-4 mb-8">
        <h3 className="text-3xl font-bold text-gray-800 text-center">
          {title} Usage Over Time
        </h3>

        {/* Comparison Mode Selector - Only show if multiple years available */}
        {hasMultipleYears && (
          <div className="w-full flex flex-col items-center gap-3 pb-4 border-b-2 border-purple-100">
            <p className="text-sm font-semibold text-gray-600">
              📊 Comparison Mode
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setComparisonMode("none")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  comparisonMode === "none"
                    ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg scale-105"
                    : "bg-white/80 text-gray-700 hover:bg-white hover:shadow-md"
                }`}
              >
                Normal View
              </button>
              <button
                onClick={() => {
                  setComparisonMode("year");
                  if (
                    comparisonYears.length === 0 &&
                    availableYears.length >= 2
                  ) {
                    setComparisonYears(availableYears.slice(0, 2));
                  }
                }}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  comparisonMode === "year"
                    ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg scale-105"
                    : "bg-white/80 text-gray-700 hover:bg-white hover:shadow-md"
                }`}
              >
                📅 Compare Years
              </button>
              <button
                onClick={() => {
                  setComparisonMode("month");
                  if (
                    comparisonYears.length === 0 &&
                    availableYears.length >= 2
                  ) {
                    setComparisonYears(availableYears.slice(0, 2));
                  }
                }}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  comparisonMode === "month"
                    ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg scale-105"
                    : "bg-white/80 text-gray-700 hover:bg-white hover:shadow-md"
                }`}
              >
                📆 Compare Months
              </button>
            </div>
          </div>
        )}

        {/* Year Selection for Comparison */}
        {comparisonMode !== "none" && (
          <div className="w-full flex flex-col items-center gap-3 pb-4 border-b-2 border-purple-100">
            <p className="text-sm font-semibold text-gray-600">
              Select Years to Compare
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => toggleYear(year)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                    comparisonYears.includes(year)
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                      : "bg-white/80 text-gray-700 hover:bg-white hover:shadow-md"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Month Selection for Month Comparison */}
        {comparisonMode === "month" && (
          <div className="w-full flex flex-col items-center gap-3 pb-4 border-b-2 border-purple-100">
            <p className="text-sm font-semibold text-gray-600">Select Month</p>
            <select
              value={comparisonMonth}
              onChange={(e) => setComparisonMonth(Number(e.target.value))}
              className="px-5 py-3 border-2 border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-center text-lg bg-white"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleDateString("en-US", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Chart Type Selector - Only show in normal mode */}
        {comparisonMode === "none" && (
          <div className="w-full flex flex-col items-center gap-3 pb-4 border-b-2 border-purple-100">
            <p className="text-sm font-semibold text-gray-600">Chart Type</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {chartTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setChartType(option.value)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                    chartType === option.value
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-white/80 text-gray-700 hover:bg-white hover:shadow-md"
                  }`}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time Range Selector - Only show in normal mode */}
        {comparisonMode === "none" && (
          <div className="w-full flex flex-col items-center gap-3 pt-2">
            <p className="text-sm font-semibold text-gray-600">Time Range</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${
                    timeRange === option.value
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105"
                      : "bg-white/80 text-gray-700 hover:bg-white hover:shadow-md"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {comparisonMode === "none" && timeRange === "daily" && (
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl flex flex-col items-center">
          <label className="block text-base font-bold text-gray-800 mb-3">
            📅 Select Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            min={dateRange.min}
            max={dateRange.max}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-5 py-3 border-2 border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-center text-lg"
          />
          <p className="text-xs text-gray-500 mt-2">
            Available: {dateRange.min} to {dateRange.max}
          </p>
        </div>
      )}
      {comparisonMode === "none" && (
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl px-6 py-4 mb-8 text-center mx-auto max-w-md">
          <p className="text-base font-semibold text-gray-700">
            📊 Showing {filteredData.length}{" "}
            {timeRange === "daily" ? "readings" : "data points"}
          </p>
        </div>
      )}
      {comparisonMode !== "none" && comparisonYears.length > 0 && (
        <>
          <div className="bg-gradient-to-r from-green-100 to-teal-100 rounded-xl px-6 py-4 mb-6 text-center mx-auto max-w-md">
            <p className="text-base font-semibold text-gray-700">
              🔄 Comparing {comparisonYears.length} year
              {comparisonYears.length > 1 ? "s" : ""}
              {comparisonMode === "month" &&
                ` - ${new Date(2000, comparisonMonth - 1).toLocaleDateString(
                  "en-US",
                  { month: "long" }
                )}`}
            </p>
          </div>

          {/* Comparison Statistics */}
          {comparisonStats && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[...comparisonYears]
                .sort((a, b) => a - b)
                .map((year) => {
                  const total = comparisonStats.totals[year];
                  const percentChange = comparisonStats.percentageChanges[year];
                  const isIncrease =
                    percentChange !== null && percentChange > 0;
                  const isDecrease =
                    percentChange !== null && percentChange < 0;
                  const yearCost = costPerKwh[year] || 0;
                  const isNightRateEnabled = nightRateEnabled?.[year] || false;
                  const totalCost =
                    yearCost > 0
                      ? hasNightRate && isNightRateEnabled
                        ? calculateTotalCostWithNightRate(year, total)
                        : total * yearCost
                      : 0;

                  return (
                    <div
                      key={year}
                      className="glass-card rounded-xl p-5 border-2 border-white/50"
                    >
                      <div className="text-center">
                        <h4 className="text-xl font-bold text-gray-800 mb-3">
                          {year}
                        </h4>

                        {/* Cost Input */}
                        <div className="mb-4 bg-white/60 rounded-lg p-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            £ Cost per {unit}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={yearCost || ""}
                            onChange={(e) =>
                              updateCostForYear(
                                year,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>

                        {/* Night Rate Toggle and Input (Electricity only) */}
                        {hasNightRate && (
                          <div className="mb-4 bg-indigo-50 rounded-lg p-3 border-2 border-indigo-200">
                            <label className="flex items-center justify-center gap-2 mb-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isNightRateEnabled}
                                onChange={() => toggleNightRate(year)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-bold text-indigo-700">
                                🌙 Night Rate (00:30-05:30)
                              </span>
                            </label>
                            {isNightRateEnabled && (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={nightRate?.[year] || ""}
                                onChange={(e) =>
                                  updateNightRateForYear(
                                    year,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0.00"
                                className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mt-2"
                              />
                            )}
                          </div>
                        )}

                        {/* Energy Usage */}
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-3">
                          <p className="text-3xl font-extrabold mb-1">
                            {total.toLocaleString()}
                          </p>
                          <p className="text-sm font-semibold text-gray-600">
                            {unit}
                          </p>
                        </div>

                        {/* Total Cost */}
                        {yearCost > 0 && (
                          <div className="bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent mb-3">
                            <p className="text-2xl font-extrabold">
                              £
                              {totalCost.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                            <p className="text-xs font-semibold text-gray-600">
                              Total Cost
                            </p>
                          </div>
                        )}

                        {/* Percentage Change */}
                        {percentChange !== null && (
                          <div
                            className={`mt-3 px-3 py-2 rounded-lg ${
                              isIncrease
                                ? "bg-red-100 text-red-700"
                                : isDecrease
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <p className="text-sm font-bold">
                              {isIncrease ? "📈 +" : isDecrease ? "📉 " : ""}
                              {Math.abs(percentChange).toFixed(1)}%
                            </p>
                            <p className="text-xs font-medium">vs {year - 1}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
      <div className="chart-container mx-auto">
        <ResponsiveContainer width="100%" height={450}>
          {comparisonMode !== "none" && comparisonYears.length > 0
            ? renderComparisonChart()
            : renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EnergyChart;
