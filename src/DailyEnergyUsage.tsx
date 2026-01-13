import React, { useState } from "react";
import "./DailyEnergyUsage.css";
import {
  DailyDataPoint,
  EnergyType,
  TimeRange,
  ComparisonMode,
} from "./types/types";
import { processCSV } from "./utils/dataUtils";
import FileUpload from "./components/FileUpload";
import StatsCards from "./components/StatsCards";
import EnergyChart from "./components/EnergyChart";
import DataTable from "./components/DataTable";

const DailyEnergyUsage: React.FC = () => {
  const [electricData, setElectricData] = useState<DailyDataPoint[]>([]);
  const [gasData, setGasData] = useState<DailyDataPoint[]>([]);
  const [loading, setLoading] = useState({ electric: false, gas: false });
  const [error, setError] = useState<{
    electric: string | null;
    gas: string | null;
  }>({
    electric: null,
    gas: null,
  });
  const [electricRowLimit, setElectricRowLimit] = useState<number>(30);
  const [gasRowLimit, setGasRowLimit] = useState<number>(30);
  const [electricTimeRange, setElectricTimeRange] = useState<TimeRange>("30d");
  const [gasTimeRange, setGasTimeRange] = useState<TimeRange>("30d");
  const [electricSelectedDate, setElectricSelectedDate] = useState<string>("");
  const [gasSelectedDate, setGasSelectedDate] = useState<string>("");

  // Comparison state
  const [electricComparisonMode, setElectricComparisonMode] =
    useState<ComparisonMode>("none");
  const [gasComparisonMode, setGasComparisonMode] =
    useState<ComparisonMode>("none");
  const [electricComparisonYears, setElectricComparisonYears] = useState<
    number[]
  >([]);
  const [gasComparisonYears, setGasComparisonYears] = useState<number[]>([]);
  const [electricComparisonMonth, setElectricComparisonMonth] =
    useState<number>(1);
  const [gasComparisonMonth, setGasComparisonMonth] = useState<number>(1);

  // Cost per kWh state
  const [electricCostPerKwh, setElectricCostPerKwh] = useState<{
    [year: number]: number;
  }>({});
  const [gasCostPerKwh, setGasCostPerKwh] = useState<{
    [year: number]: number;
  }>({});

  // Night Rate state (electricity only)
  const [electricNightRateEnabled, setElectricNightRateEnabled] = useState<{
    [year: number]: boolean;
  }>({});
  const [electricNightRate, setElectricNightRate] = useState<{
    [year: number]: number;
  }>({});

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: EnergyType
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading((prev) => ({ ...prev, [type]: true }));
    setError((prev) => ({ ...prev, [type]: null }));

    const reader = new FileReader();

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const text = e.target?.result as string;
        const data = await processCSV(text, type);

        if (type === "electric") {
          setElectricData(data);
        } else {
          setGasData(data);
        }
        setLoading((prev) => ({ ...prev, [type]: false }));
      } catch (err) {
        setError((prev) => ({ ...prev, [type]: (err as Error).message }));
        setLoading((prev) => ({ ...prev, [type]: false }));
      }
    };

    reader.onerror = () => {
      setError((prev) => ({ ...prev, [type]: "Failed to read file" }));
      setLoading((prev) => ({ ...prev, [type]: false }));
    };

    reader.readAsText(file);
  };

  return (
    <div className="app-background p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 text-white drop-shadow-lg">
            ⚡ Energy Usage Tracker
          </h1>
          <p className="text-white/90 text-lg font-light">
            Visualize and analyze your electricity and gas consumption
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FileUpload
            type="electric"
            title="Electricity Data"
            loading={loading.electric}
            error={error.electric}
            dataLength={electricData.length}
            onFileUpload={(e) => handleFileUpload(e, "electric")}
            onClear={() => setElectricData([])}
            colorScheme="blue"
          />

          <FileUpload
            type="gas"
            title="Gas Data"
            loading={loading.gas}
            error={error.gas}
            dataLength={gasData.length}
            onFileUpload={(e) => handleFileUpload(e, "gas")}
            onClear={() => setGasData([])}
            colorScheme="orange"
          />
        </div>

        {electricData.length === 0 && gasData.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center border-2 border-white/50 mx-auto max-w-2xl">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-800 text-lg font-semibold mb-2">
              Upload your CSV files to get started
            </p>
            <p className="text-gray-600 text-sm">
              CSV files should contain half-hourly meter readings with columns
              for Start, End, and Consumption (kwh).
            </p>
          </div>
        )}

        {electricData.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <StatsCards data={electricData} title="Electricity" unit="kWh" />
            <EnergyChart
              data={electricData}
              title="Electricity"
              color="#2563eb"
              unit="kWh"
              timeRange={electricTimeRange}
              setTimeRange={setElectricTimeRange}
              selectedDate={electricSelectedDate}
              setSelectedDate={setElectricSelectedDate}
              comparisonMode={electricComparisonMode}
              setComparisonMode={setElectricComparisonMode}
              comparisonYears={electricComparisonYears}
              setComparisonYears={setElectricComparisonYears}
              comparisonMonth={electricComparisonMonth}
              setComparisonMonth={setElectricComparisonMonth}
              costPerKwh={electricCostPerKwh}
              setCostPerKwh={setElectricCostPerKwh}
              nightRateEnabled={electricNightRateEnabled}
              setNightRateEnabled={setElectricNightRateEnabled}
              nightRate={electricNightRate}
              setNightRate={setElectricNightRate}
            />
            <DataTable
              data={electricData}
              title="Electricity"
              unit="kWh"
              rowLimit={electricRowLimit}
              setRowLimit={setElectricRowLimit}
            />
          </div>
        )}

        {gasData.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <StatsCards data={gasData} title="Gas" unit="kWh" />
            <EnergyChart
              data={gasData}
              title="Gas"
              color="#ea580c"
              unit="kWh"
              timeRange={gasTimeRange}
              setTimeRange={setGasTimeRange}
              selectedDate={gasSelectedDate}
              setSelectedDate={setGasSelectedDate}
              comparisonMode={gasComparisonMode}
              setComparisonMode={setGasComparisonMode}
              comparisonYears={gasComparisonYears}
              setComparisonYears={setGasComparisonYears}
              comparisonMonth={gasComparisonMonth}
              setComparisonMonth={setGasComparisonMonth}
              costPerKwh={gasCostPerKwh}
              setCostPerKwh={setGasCostPerKwh}
            />
            <DataTable
              data={gasData}
              title="Gas"
              unit="kWh"
              rowLimit={gasRowLimit}
              setRowLimit={setGasRowLimit}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyEnergyUsage;
