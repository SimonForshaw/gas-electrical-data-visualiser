import React, { useState } from "react";
import {
  OctopusApiCredentials,
  AccountDetails,
  MeterPoint,
  testApiConnection,
  getAccountDetails,
  extractMeterPoints,
  getConsumptionForDateRange,
  convertConsumptionToAppFormat,
  getAvailableDateRange,
  getCurrentTariffInfo,
  calculateCostsWithHistoricalRates,
} from "../utils/octopusApi";
import { ApiCredentialsForm } from "./ApiCredentialsForm";
import { MeterDetailsCard } from "./MeterDetailsCard";
import { TariffInfoCard } from "./TariffInfoCard";
import { DateRangeSelector } from "./DateRangeSelector";

interface ApiConnectionProps {
  onDataFetched: (
    data: Array<{ date: string; value: number }>,
    type: "electric" | "gas",
    totalCost?: number
  ) => void;
  energyType: "electric" | "gas";
  color: "blue" | "orange";
}

export const ApiConnection: React.FC<ApiConnectionProps> = ({
  onDataFetched,
  energyType,
  color,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meterPoints, setMeterPoints] = useState<MeterPoint[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [useEarliest, setUseEarliest] = useState<boolean>(false);
  const [useLatest, setUseLatest] = useState<boolean>(false);
  const [showApiForm, setShowApiForm] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(
    null
  );
  const [tariffInfo, setTariffInfo] = useState<{
    standardRate: number;
    nightRate: number | null;
    standingCharge: number;
    tariffCode: string;
  } | null>(null);

  const colorClasses = {
    blue: {
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      text: "text-blue-400",
      button: "bg-blue-500 hover:bg-blue-600",
    },
    orange: {
      gradient: "from-orange-500 to-red-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      text: "text-orange-400",
      button: "bg-orange-500 hover:bg-orange-600",
    },
  };

  const colors = colorClasses[color];

  const handleTestConnection = async () => {
    if (!apiKey || !accountNumber) {
      setError("Please enter both API key and account number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const credentials: OctopusApiCredentials = {
        apiKey,
        accountNumber,
      };

      const result = await testApiConnection(credentials);

      if (result.success) {
        setIsConnected(true);
        const details = await getAccountDetails(credentials);
        setAccountDetails(details);

        // Debug logging
        console.log("Account details:", details);
        console.log("Properties:", details.properties);

        const meters = extractMeterPoints(details);
        console.log("All extracted meters:", meters);

        // Filter meters by energy type
        const filteredMeters = meters.filter((m) =>
          energyType === "electric"
            ? m.type === "electricity"
            : m.type === "gas"
        );
        console.log(`Filtered ${energyType} meters:`, filteredMeters);

        setMeterPoints(filteredMeters);

        if (filteredMeters.length > 0) {
          // Auto-select the first current property meter, or just the first if none are current
          const firstCurrentMeter =
            filteredMeters.find((m) => m.isCurrent) || filteredMeters[0];
          setSelectedMeter(
            `${firstCurrentMeter.mpan || firstCurrentMeter.mprn}-${
              firstCurrentMeter.serialNumber
            }`
          );

          // Fetch tariff rates for the first meter
          try {
            const tariff = await getCurrentTariffInfo(
              details,
              firstCurrentMeter
            );
            if (tariff) {
              setTariffInfo(tariff);
              console.log("Tariff info:", tariff);
            }
          } catch (err) {
            console.warn("Could not fetch tariff info:", err);
          }
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  };
  const handleFetchAvailableDates = async () => {
    if (!selectedMeter) {
      setError("Please select a meter first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const credentials: OctopusApiCredentials = {
        apiKey,
        accountNumber,
      };

      const meterPoint = meterPoints.find(
        (m) => `${m.mpan || m.mprn}-${m.serialNumber}` === selectedMeter
      );

      if (!meterPoint) {
        throw new Error("Selected meter not found");
      }

      const dateRange = await getAvailableDateRange(credentials, meterPoint);

      console.log("Available date range:", dateRange);

      // Automatically populate the date fields based on checkbox states
      // If only one checkbox is checked, still fetch both but only populate the checked one
      if (useEarliest) {
        setDateFrom(dateRange.earliest);
      }
      if (useLatest) {
        setDateTo(dateRange.latest);
      }

      // If neither date is set yet, populate both to make it easier
      if (!dateFrom && !useEarliest) {
        setDateFrom(dateRange.earliest);
      }
      if (!dateTo && !useLatest) {
        setDateTo(dateRange.latest);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch date range"
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleFetchData = async () => {
    if (!selectedMeter || !dateFrom || !dateTo) {
      setError("Please select a meter and date range");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const credentials: OctopusApiCredentials = {
        apiKey,
        accountNumber,
      };

      // Find selected meter point
      const meterPoint = meterPoints.find(
        (m) => `${m.mpan || m.mprn}-${m.serialNumber}` === selectedMeter
      );

      if (!meterPoint) {
        throw new Error("Selected meter not found");
      }

      // Fetch consumption data
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);

      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);

      console.log("Fetching data:");
      console.log("From:", dateFrom, "->", startDate.toISOString());
      console.log("To:", dateTo, "->", endDate.toISOString());
      console.log("Meter:", meterPoint);

      const consumptionData = await getConsumptionForDateRange(
        credentials,
        meterPoint,
        startDate,
        endDate
      );

      console.log("Received data points:", consumptionData.length);

      // Calculate costs using historical rates from the API
      if (accountDetails) {
        try {
          console.log("Calculating costs with historical rates...");
          const dataWithCosts = await calculateCostsWithHistoricalRates(
            accountDetails,
            meterPoint,
            consumptionData,
            startDate,
            endDate
          );

          // Calculate totals for logging
          const totalCost = dataWithCosts.reduce(
            (sum, point) => sum + point.cost,
            0
          );
          const totalStandingCharge = dataWithCosts.reduce(
            (sum, point) => sum + point.standingCharge,
            0
          );
          const totalConsumption = dataWithCosts.reduce(
            (sum, point) => sum + point.consumption,
            0
          );

          console.log(`Total consumption: ${totalConsumption.toFixed(2)} kWh`);
          console.log(`Total unit cost: £${totalCost.toFixed(2)}`);
          console.log(
            `Total standing charge: £${totalStandingCharge.toFixed(2)}`
          );
          console.log(
            `Total cost: £${(totalCost + totalStandingCharge).toFixed(2)}`
          );

          // Store the cost data for potential future use
          // For now, we still convert to the simple format for the chart
          const appData = convertConsumptionToAppFormat(dataWithCosts);
          const totalCostWithStanding = totalCost + totalStandingCharge;
          onDataFetched(appData, energyType, totalCostWithStanding);
        } catch (err) {
          console.warn(
            "Failed to calculate costs, using consumption data only:",
            err
          );
          const appData = convertConsumptionToAppFormat(consumptionData);
          onDataFetched(appData, energyType);
        }
      } else {
        // No account details available, just convert consumption
        const appData = convertConsumptionToAppFormat(consumptionData);
        onDataFetched(appData, energyType);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setMeterPoints([]);
    setSelectedMeter("");
    setApiKey("");
    setAccountNumber("");
  };

  return (
    <div className="mb-4 h-full flex flex-col">
      {!showApiForm ? (
        <button
          onClick={() => setShowApiForm(true)}
          className={`w-full glass-card border ${colors.border} ${colors.bg} p-3 rounded-xl text-left transition-all hover:scale-[1.02]`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${colors.text} text-base`}>
                🔌 Connect to Octopus Energy API
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Automatically fetch your {energyType} consumption data
              </p>
            </div>
            <span className={`text-xl ${colors.text}`}>+</span>
          </div>
        </button>
      ) : (
        <div
          className={`glass-card border ${colors.border} ${colors.bg} p-4 rounded-xl flex flex-col flex-1`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${colors.text} text-base`}>
              🔌 Octopus Energy API Connection
            </h3>
            <button
              onClick={() => setShowApiForm(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {!isConnected ? (
            <ApiCredentialsForm
              apiKey={apiKey}
              setApiKey={setApiKey}
              accountNumber={accountNumber}
              setAccountNumber={setAccountNumber}
              isLoading={isLoading}
              error={error}
              onTestConnection={handleTestConnection}
              buttonColor={colors.button}
            />
          ) : (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-green-400 text-xs flex items-center justify-between">
                <span>✓ Connected to account {accountNumber}</span>
                <button
                  onClick={handleDisconnect}
                  className="text-xs underline hover:no-underline"
                >
                  Disconnect
                </button>
              </div>

              {meterPoints.length === 0 ? (
                <div className="text-yellow-400 text-xs">
                  No {energyType} meters found on this account.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Select Meter
                    </label>
                    <select
                      value={selectedMeter}
                      onChange={(e) => setSelectedMeter(e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                    >
                      {meterPoints.map((meter) => (
                        <option
                          key={`${meter.mpan || meter.mprn}-${
                            meter.serialNumber
                          }`}
                          value={`${meter.mpan || meter.mprn}-${
                            meter.serialNumber
                          }`}
                        >
                          {meter.mpan || meter.mprn} - {meter.serialNumber} -{" "}
                          {meter.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Meter Information Display */}
                  {selectedMeter &&
                    (() => {
                      const selectedMeterPoint = meterPoints.find(
                        (m) =>
                          `${m.mpan || m.mprn}-${m.serialNumber}` ===
                          selectedMeter
                      );
                      if (!selectedMeterPoint) return null;

                      return <MeterDetailsCard meter={selectedMeterPoint} />;
                    })()}

                  <div className="min-h-[100px]">
                    {tariffInfo && (
                      <TariffInfoCard
                        tariffCode={tariffInfo.tariffCode}
                        standardRate={tariffInfo.standardRate}
                        nightRate={tariffInfo.nightRate}
                        standingCharge={tariffInfo.standingCharge}
                      />
                    )}
                  </div>

                  {(() => {
                    const selectedMeterPoint = meterPoints.find(
                      (m) =>
                        `${m.mpan || m.mprn}-${m.serialNumber}` ===
                        selectedMeter
                    );
                    const isMovedOut =
                      !!selectedMeterPoint && !selectedMeterPoint.isCurrent;

                    return (
                      <DateRangeSelector
                        useEarliest={useEarliest}
                        setUseEarliest={setUseEarliest}
                        useLatest={useLatest}
                        setUseLatest={setUseLatest}
                        dateFrom={dateFrom}
                        setDateFrom={setDateFrom}
                        dateTo={dateTo}
                        setDateTo={setDateTo}
                        isMovedOut={isMovedOut}
                        isLoading={isLoading}
                        selectedMeter={selectedMeter}
                        onFetchAvailableDates={handleFetchAvailableDates}
                      />
                    );
                  })()}

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      onClick={handleFetchData}
                      disabled={
                        isLoading || !selectedMeter || !dateFrom || !dateTo
                      }
                      className={`${colors.button} text-white font-semibold py-2 px-6 text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading
                        ? "Fetching Data..."
                        : "Fetch Consumption Data"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    💡 Data typically available with 1-2 day delay from Octopus
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
