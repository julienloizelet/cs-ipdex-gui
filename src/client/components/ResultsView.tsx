import type { IPResult } from '../types';

interface ResultsViewProps {
  results: IPResult[];
  onBack: () => void;
  onNewQuery: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 4) {return 'text-red-600 dark:text-red-400';}
  if (score >= 3) {return 'text-orange-600 dark:text-orange-400';}
  if (score >= 2) {return 'text-yellow-600 dark:text-yellow-400';}
  if (score >= 1) {return 'text-blue-600 dark:text-blue-400';}
  return 'text-green-600 dark:text-green-400';
}

function getBackgroundNoiseColor(noise: string): string {
  switch (noise?.toLowerCase()) {
    case 'high':
      return 'bg-red-500/20 text-red-700 dark:text-red-400';
    case 'medium':
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-400';
    case 'low':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    default:
      return 'bg-green-500/20 text-green-700 dark:text-green-400';
  }
}

function IPCard({ result }: { result: IPResult }) {
  const scores = result.scores?.overall;

  return (
    <div className="card mb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
            {result.ip}
          </h3>
          {result.ip_range && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{result.ip_range}</p>
          )}
        </div>
        {result.background_noise && (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getBackgroundNoiseColor(result.background_noise)}`}
          >
            {result.background_noise} noise
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Location</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {result.location?.country || 'Unknown'}
            {result.location?.city && `, ${result.location.city}`}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">AS</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {result.as_name || 'Unknown'}
            {result.as_num && ` (AS${result.as_num})`}
          </p>
        </div>
        {result.reverse_dns && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500 uppercase mb-1">Reverse DNS</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{result.reverse_dns}</p>
          </div>
        )}
      </div>

      {scores && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase mb-2">Scores</p>
          <div className="flex gap-4">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
              <p className={`text-lg font-bold ${getScoreColor(scores.total)}`}>
                {scores.total}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Threat</span>
              <p className={`text-lg font-bold ${getScoreColor(scores.threat)}`}>
                {scores.threat}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Trust</span>
              <p className={`text-lg font-bold ${getScoreColor(5 - scores.trust)}`}>
                {scores.trust}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Anomaly</span>
              <p className={`text-lg font-bold ${getScoreColor(scores.anomaly)}`}>
                {scores.anomaly}
              </p>
            </div>
          </div>
        </div>
      )}

      {result.behaviors && result.behaviors.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase mb-2">Behaviors</p>
          <div className="flex flex-wrap gap-2">
            {result.behaviors.map((behavior, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-red-500/20 text-red-700 dark:text-red-400 rounded text-xs"
                title={behavior.description}
              >
                {behavior.label || behavior.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.classifications?.classifications &&
        result.classifications.classifications.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase mb-2">
              Classifications
            </p>
            <div className="flex flex-wrap gap-2">
              {result.classifications.classifications.map((cls, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded text-xs"
                  title={cls.description}
                >
                  {cls.label || cls.name}
                </span>
              ))}
            </div>
          </div>
        )}

      {result.history && (
        <div>
          <p className="text-xs text-gray-500 uppercase mb-2">History</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            First seen: {new Date(result.history.first_seen).toLocaleDateString()}
            {' | '}
            Last seen: {new Date(result.history.last_seen).toLocaleDateString()}
            {' | '}
            Age: {result.history.days_age} days
          </p>
        </div>
      )}
    </div>
  );
}

export function ResultsView({ results, onBack, onNewQuery }: ResultsViewProps) {
  if (results.length === 0) {
    return (
      <div className="card max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Results</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          No IP information was found. The IPs might not be in the CrowdSec
          database.
        </p>
        <button className="btn btn-primary" onClick={onNewQuery}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Results ({results.length} IP{results.length !== 1 ? 's' : ''})
        </h2>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
          <button className="btn btn-primary" onClick={onNewQuery}>
            New Query
          </button>
        </div>
      </div>

      {results.map((result, index) => (
        <IPCard key={index} result={result} />
      ))}
    </div>
  );
}
