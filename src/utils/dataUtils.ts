import Papa from "papaparse";
import {
  DailyDataPoint,
  EnergyType,
  TimeRange,
  ComparisonDataPoint,
} from "../types/types";

export const processCSV = (
  text: string,
  type: EnergyType
): Promise<DailyDataPoint[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        const dailyData: { [key: string]: number } = {};

        results.data.forEach((row: any) => {
          const startDate = row["Start"]?.trim() || row[" Start"]?.trim();
          if (!startDate) return;

          // Keep the full timestamp for half-hourly data
          const date = startDate;
          const consumption =
            row["Consumption (kwh)"] || row["Consumption (kWh)"] || 0;

          if (dailyData[date]) {
            dailyData[date] += consumption;
          } else {
            dailyData[date] = consumption;
          }
        });

        const chartData: DailyDataPoint[] = Object.entries(dailyData)
          .map(([date, value]) => ({
            date,
            value: Math.round(value * 100) / 100,
          }))
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

        resolve(chartData);
      },
      error: (err: Error) => reject(err),
    });
  });
};

export const filterDataByTimeRange = (
  data: DailyDataPoint[],
  timeRange: TimeRange,
  selectedDate?: string
): DailyDataPoint[] => {
  if (data.length === 0) return data;

  // Handle daily view with selected date - show half-hourly data
  if (timeRange === "daily" && selectedDate) {
    return data.filter((point) => {
      const pointDate = new Date(point.date);
      const targetDate = new Date(selectedDate);
      return (
        pointDate.getFullYear() === targetDate.getFullYear() &&
        pointDate.getMonth() === targetDate.getMonth() &&
        pointDate.getDate() === targetDate.getDate()
      );
    });
  }

  // For all other time ranges, first filter by date range
  const now = new Date();
  const daysToShow: { [key in TimeRange]?: number } = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    year: 365,
  };

  let filteredData = data;

  if (timeRange !== "all") {
    const days = daysToShow[timeRange];
    if (days) {
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filteredData = data.filter((point) => {
        const pointDate = new Date(point.date);
        return pointDate >= cutoffDate;
      });
    }
  }

  // Aggregate by day for non-daily views
  const dailyAggregated: { [key: string]: number } = {};

  filteredData.forEach((point) => {
    const date = new Date(point.date);
    const dayKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format

    if (dailyAggregated[dayKey]) {
      dailyAggregated[dayKey] += point.value;
    } else {
      dailyAggregated[dayKey] = point.value;
    }
  });

  return Object.entries(dailyAggregated)
    .map(([date, value]) => ({
      date,
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Get available years from data
export const getAvailableYears = (data: DailyDataPoint[]): number[] => {
  const years = new Set<number>();
  data.forEach((point) => {
    const year = new Date(point.date).getFullYear();
    years.add(year);
  });
  return Array.from(years).sort((a, b) => a - b);
};

// Compare full years
export const compareYears = (
  data: DailyDataPoint[],
  years: number[]
): ComparisonDataPoint[] => {
  if (years.length === 0) return [];

  // Group data by year and day-of-year
  const yearData: { [year: number]: { [dayOfYear: string]: number } } = {};

  years.forEach((year) => {
    yearData[year] = {};
  });

  data.forEach((point) => {
    const date = new Date(point.date);
    const year = date.getFullYear();

    if (years.includes(year)) {
      // Create a key like "01-15" (month-day)
      const monthDay = `${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;

      if (!yearData[year][monthDay]) {
        yearData[year][monthDay] = 0;
      }
      yearData[year][monthDay] += point.value;
    }
  });

  // Combine into comparison data points
  const allDays = new Set<string>();
  Object.values(yearData).forEach((yearObj) => {
    Object.keys(yearObj).forEach((day) => allDays.add(day));
  });

  const result: ComparisonDataPoint[] = Array.from(allDays)
    .sort()
    .map((monthDay) => {
      const point: ComparisonDataPoint = { date: monthDay };
      years.forEach((year) => {
        point[`${year}`] = yearData[year][monthDay]
          ? Math.round(yearData[year][monthDay] * 100) / 100
          : 0;
      });
      return point;
    });

  return result;
};

// Compare specific month across years
export const compareMonths = (
  data: DailyDataPoint[],
  month: number,
  years: number[]
): ComparisonDataPoint[] => {
  if (years.length === 0) return [];

  // Group data by year and day-of-month
  const monthData: { [year: number]: { [day: number]: number } } = {};

  years.forEach((year) => {
    monthData[year] = {};
  });

  data.forEach((point) => {
    const date = new Date(point.date);
    const year = date.getFullYear();
    const pointMonth = date.getMonth() + 1; // 1-based month

    if (years.includes(year) && pointMonth === month) {
      const day = date.getDate();

      if (!monthData[year][day]) {
        monthData[year][day] = 0;
      }
      monthData[year][day] += point.value;
    }
  });

  // Get all days that appear in any year for this month
  const allDays = new Set<number>();
  Object.values(monthData).forEach((yearObj) => {
    Object.keys(yearObj).forEach((day) => allDays.add(Number(day)));
  });

  const result: ComparisonDataPoint[] = Array.from(allDays)
    .sort((a, b) => a - b)
    .map((day) => {
      const point: ComparisonDataPoint = { date: String(day) };
      years.forEach((year) => {
        point[`${year}`] = monthData[year][day]
          ? Math.round(monthData[year][day] * 100) / 100
          : 0;
      });
      return point;
    });

  return result;
};

// Calculate total energy usage for each year
export const calculateYearTotals = (
  data: DailyDataPoint[],
  years: number[]
): { [year: number]: number } => {
  const totals: { [year: number]: number } = {};

  years.forEach((year) => {
    totals[year] = 0;
  });

  data.forEach((point) => {
    const year = new Date(point.date).getFullYear();
    if (years.includes(year)) {
      totals[year] += point.value;
    }
  });

  // Round to 2 decimal places
  years.forEach((year) => {
    totals[year] = Math.round(totals[year] * 100) / 100;
  });

  return totals;
};

// Calculate total energy usage for specific month across years
export const calculateMonthTotals = (
  data: DailyDataPoint[],
  month: number,
  years: number[]
): { [year: number]: number } => {
  const totals: { [year: number]: number } = {};

  years.forEach((year) => {
    totals[year] = 0;
  });

  data.forEach((point) => {
    const date = new Date(point.date);
    const year = date.getFullYear();
    const pointMonth = date.getMonth() + 1;

    if (years.includes(year) && pointMonth === month) {
      totals[year] += point.value;
    }
  });

  // Round to 2 decimal places
  years.forEach((year) => {
    totals[year] = Math.round(totals[year] * 100) / 100;
  });

  return totals;
};

// Calculate percentage change compared to previous year
export const calculatePercentageChanges = (
  totals: { [year: number]: number },
  years: number[]
): { [year: number]: number | null } => {
  const changes: { [year: number]: number | null } = {};
  const sortedYears = [...years].sort((a, b) => a - b);

  sortedYears.forEach((year, index) => {
    if (index === 0) {
      changes[year] = null; // No previous year to compare
    } else {
      const previousYear = sortedYears[index - 1];
      const currentTotal = totals[year];
      const previousTotal = totals[previousYear];

      if (previousTotal === 0) {
        changes[year] = null; // Avoid division by zero
      } else {
        const percentChange =
          ((currentTotal - previousTotal) / previousTotal) * 100;
        changes[year] = Math.round(percentChange * 10) / 10; // Round to 1 decimal
      }
    }
  });

  return changes;
};
