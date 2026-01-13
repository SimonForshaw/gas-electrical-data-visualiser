export interface DailyDataPoint {
  date: string;
  value: number;
}

export interface ComparisonDataPoint {
  date: string;
  [key: string]: string | number; // Dynamic keys for multiple years
}

export interface LoadingState {
  electric: boolean;
  gas: boolean;
}

export interface ErrorState {
  electric: string | null;
  gas: string | null;
}

export type EnergyType = "electric" | "gas";
export type TimeRange = "daily" | "7d" | "30d" | "90d" | "year" | "all";
export type ComparisonMode = "none" | "year" | "month";
