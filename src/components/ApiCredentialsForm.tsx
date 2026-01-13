import React from "react";

interface ApiCredentialsFormProps {
  apiKey: string;
  setApiKey: (value: string) => void;
  accountNumber: string;
  setAccountNumber: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  onTestConnection: () => void;
  buttonColor: string;
}

export const ApiCredentialsForm: React.FC<ApiCredentialsFormProps> = ({
  apiKey,
  setApiKey,
  accountNumber,
  setAccountNumber,
  isLoading,
  error,
  onTestConnection,
  buttonColor,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">
          API Key
          <span className="text-xs text-gray-500 ml-2">
            (Get from{" "}
            <a
              href="https://octopus.energy/dashboard/developer/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400"
            >
              Octopus Dashboard
            </a>
            )
          </span>
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk_live_..."
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">
          Account Number
          <span className="text-xs text-gray-500 ml-2">
            (Format: A-AAAA1111)
          </span>
        </label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.toUpperCase())}
          placeholder="A-AAAA1111"
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      <button
        onClick={onTestConnection}
        disabled={isLoading || !apiKey || !accountNumber}
        className={`w-full ${buttonColor} text-white font-semibold py-2 text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? "Connecting..." : "Test Connection"}
      </button>
    </div>
  );
};
