import { useState } from 'react';

interface ApiKeyFormProps {
  onSubmit: (apiKey: string) => void;
}

export function ApiKeyForm({ onSubmit }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <div className="card max-w-md mx-auto">
      <div className="mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          CrowdSec API Key
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Enter your CrowdSec CTI API key to get started. You can get one from{' '}
          <a
            href="https://app.crowdsec.net/settings/cti-api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            CrowdSec Console
          </a>
          .
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="apiKey" className="label">
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            className="input"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={!apiKey.trim()}
        >
          Save & Continue
        </button>
      </form>
    </div>
  );
}
