import React from "react";

interface TariffInfoCardProps {
  tariffCode: string;
  standardRate: number;
  nightRate: number | null;
  standingCharge: number;
}

export const TariffInfoCard: React.FC<TariffInfoCardProps> = ({
  tariffCode,
  standardRate,
  nightRate,
  standingCharge,
}) => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
      <h4 className="text-xs font-bold text-gray-700 mb-1">
        📋 Current Tariff Rates
      </h4>
      <div className="space-y-0.5 text-xs">
        <p className="text-gray-600">
          <span className="font-semibold">Tariff:</span> {tariffCode}
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Standard Rate:</span>{" "}
          {standardRate.toFixed(2)}p per kWh
        </p>
        {nightRate && (
          <p className="text-indigo-600">
            <span className="font-semibold">🌙 Night Rate (00:30-05:30):</span>{" "}
            {nightRate.toFixed(2)}p per kWh
          </p>
        )}
        <p className="text-gray-600">
          <span className="font-semibold">Standing Charge:</span>{" "}
          {standingCharge.toFixed(2)}p per day
        </p>
      </div>
    </div>
  );
};
