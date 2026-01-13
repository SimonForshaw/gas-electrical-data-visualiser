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
import { ApiConnection } from "./components/ApiConnection";

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

  // Cost per kWh state with default values (in pence, so 28.42p = 0.2842)
  const [electricCostPerKwh, setElectricCostPerKwh] = useState<{
    [year: number]: number;
  }>({
    2024: 0.2842,
    2025: 0.2842,
    2026: 0.2842,
  });
  const [gasCostPerKwh, setGasCostPerKwh] = useState<{
    [year: number]: number;
  }>({});

  // Store total cost from API fetches
  const [electricTotalCost, setElectricTotalCost] = useState<number | null>(
    null
  );
  const [gasTotalCost, setGasTotalCost] = useState<number | null>(null);

  // Data table visibility state
  const [showElectricTable, setShowElectricTable] = useState<boolean>(false);
  const [showGasTable, setShowGasTable] = useState<boolean>(false);

  // Track if data came from API
  const [electricFromApi, setElectricFromApi] = useState<boolean>(false);
  const [gasFromApi, setGasFromApi] = useState<boolean>(false);

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

  const handleApiDataFetched = (
    data: Array<{ date: string; value: number }>,
    type: "electric" | "gas",
    totalCost?: number
  ) => {
    if (type === "electric") {
      setElectricData(data);
      setElectricTotalCost(totalCost ?? null);
      setElectricFromApi(true);
    } else {
      setGasData(data);
      setGasTotalCost(totalCost ?? null);
      setGasFromApi(true);
    }
  };

  return (
    <div className="app-background p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 text-gray-100 drop-shadow-lg">
            ⚡ Energy Usage Tracker
          </h1>
          <p className="text-gray-300 text-lg font-light"></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col">
              <ApiConnection
                onDataFetched={handleApiDataFetched}
                energyType="electric"
                color="blue"
              />
            </div>
            {!electricFromApi && (
              <FileUpload
                type="electric"
                title="Or Upload Electricity CSV"
                loading={loading.electric}
                error={error.electric}
                dataLength={electricData.length}
                onFileUpload={(e) => handleFileUpload(e, "electric")}
                onClear={() => setElectricData([])}
                colorScheme="blue"
              />
            )}
          </div>

          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col">
              <ApiConnection
                onDataFetched={handleApiDataFetched}
                energyType="gas"
                color="orange"
              />
            </div>
            {!gasFromApi && (
              <FileUpload
                type="gas"
                title="Or Upload Gas CSV"
                loading={loading.gas}
                error={error.gas}
                dataLength={gasData.length}
                onFileUpload={(e) => handleFileUpload(e, "gas")}
                onClear={() => setGasData([])}
                colorScheme="orange"
              />
            )}
          </div>
        </div>

        {electricData.length === 0 && gasData.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center border-2 border-white/50 mx-auto max-w-2xl">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600 text-lg font-semibold mb-2">
              Connect to Octopus Energy API or upload CSV files to get started
            </p>
            <p className="text-gray-400 text-sm">
              CSV files should contain half-hourly meter readings with columns
              for Start, End, and Consumption (kWh).
            </p>
          </div>
        )}

        {electricData.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <StatsCards
              data={electricData}
              title="Electricity"
              unit="kWh"
              totalCost={electricTotalCost}
            />
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
            />

            {/* Collapsible Data Table */}
            <div className="mt-4">
              {!showElectricTable ? (
                <button
                  onClick={() => setShowElectricTable(true)}
                  className="w-full glass-card border border-blue-500/20 bg-blue-500/10 p-3 text-left transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-400 text-base">
                        📊 View Data Table
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Show detailed electricity consumption data
                      </p>
                    </div>
                    <span className="text-xl text-blue-400">+</span>
                  </div>
                </button>
              ) : (
                <div className="glass-card border border-blue-500/20 bg-blue-500/10 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-blue-400 text-base">
                      📊 Electricity Data Table
                    </h3>
                    <button
                      onClick={() => setShowElectricTable(false)}
                      className="text-gray-400 hover:text-white transition-colors text-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <DataTable
                    data={electricData}
                    title="Electricity"
                    unit="kWh"
                    rowLimit={electricRowLimit}
                    setRowLimit={setElectricRowLimit}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {gasData.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <StatsCards
              data={gasData}
              title="Gas"
              unit="kWh"
              totalCost={gasTotalCost}
            />
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

            {/* Collapsible Data Table */}
            <div className="mt-4">
              {!showGasTable ? (
                <button
                  onClick={() => setShowGasTable(true)}
                  className="w-full glass-card border border-orange-500/20 bg-orange-500/10 p-3 text-left transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-orange-400 text-base">
                        📊 View Data Table
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Show detailed gas consumption data
                      </p>
                    </div>
                    <span className="text-xl text-orange-400">+</span>
                  </div>
                </button>
              ) : (
                <div className="glass-card border border-orange-500/20 bg-orange-500/10 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-orange-400 text-base">
                      📊 Gas Data Table
                    </h3>
                    <button
                      onClick={() => setShowGasTable(false)}
                      className="text-gray-400 hover:text-white transition-colors text-lg"
                    >
                      ✕
                    </button>
                  </div>
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
        )}
      </div>
    </div>
  );
};

export default DailyEnergyUsage;
