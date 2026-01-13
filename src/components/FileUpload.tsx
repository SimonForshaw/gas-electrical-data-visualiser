import React from "react";
import { EnergyType } from "../types/types";

interface FileUploadProps {
  type: EnergyType;
  title: string;
  loading: boolean;
  error: string | null;
  dataLength: number;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  colorScheme: "blue" | "orange";
}

const FileUpload: React.FC<FileUploadProps> = ({
  type,
  title,
  loading,
  error,
  dataLength,
  onFileUpload,
  onClear,
  colorScheme,
}) => {
  const colorClasses = {
    blue: {
      file: "file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100",
      button: "text-blue-600",
    },
    orange: {
      file: "file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100",
      button: "text-orange-600",
    },
  };

  const colors = colorClasses[colorScheme];

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-2xl">{type === "electric" ? "⚡" : "🔥"}</div>
        <h2 className="text-base font-bold text-gray-800">{title}</h2>
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={onFileUpload}
        className={`block w-full text-xs text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold ${colors.file} cursor-pointer`}
      />
      {loading && (
        <p className="mt-2 text-xs loading-text font-semibold">
          Loading data...
        </p>
      )}
      {error && <p className="mt-2 text-xs error-message">⚠️ Error: {error}</p>}
      {dataLength > 0 && (
        <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <p className="text-xs success-message font-semibold">
            ✓ {dataLength} readings loaded
          </p>
          <button
            onClick={onClear}
            className={`mt-1.5 text-xs ${colors.button} hover:underline font-semibold`}
          >
            Clear & upload different file
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
