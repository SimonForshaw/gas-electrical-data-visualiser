import React from "react";
import { MeterPoint } from "../utils/octopusApi";

interface MeterDetailsCardProps {
  meter: MeterPoint;
}

export const MeterDetailsCard: React.FC<MeterDetailsCardProps> = ({
  meter,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
        📍 Selected Meter Details
      </h4>
      <div className="space-y-1 text-xs text-gray-700">
        <div>
          <span className="font-semibold">
            {meter.mpan ? "MPAN:" : "MPRN:"}
          </span>
          <div className="ml-4 font-mono">{meter.mpan || meter.mprn}</div>
        </div>
        <div>
          <span className="font-semibold">Serial Number:</span>
          <div className="ml-4 font-mono">{meter.serialNumber}</div>
        </div>
        <div>
          <span className="font-semibold">Property Address:</span>
          <div className="ml-4">{meter.address}</div>
        </div>
      </div>
    </div>
  );
};
