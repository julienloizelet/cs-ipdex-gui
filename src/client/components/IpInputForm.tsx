import { useState } from 'react';

interface IpInputFormProps {
  onSubmit: (ips: string[]) => void;
  onBack: () => void;
}

export function IpInputForm({ onSubmit, onBack }: IpInputFormProps) {
  const [ipText, setIpText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ips = ipText
      .split('\n')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);
    if (ips.length > 0) {
      onSubmit(ips);
    }
  };

  const ipCount = ipText
    .split('\n')
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0).length;

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
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
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Enter IP Addresses
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Enter one IP address per line. These will be queried against the
          CrowdSec CTI database.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="ips" className="label">
              IP Addresses
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {ipCount} IP{ipCount !== 1 ? 's' : ''}
            </span>
          </div>
          <textarea
            id="ips"
            className="textarea h-64"
            placeholder="1.2.3.4&#10;5.6.7.8&#10;..."
            value={ipText}
            onChange={(e) => setIpText(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={ipCount === 0}
          >
            Query IPs
          </button>
        </div>
      </form>
    </div>
  );
}
