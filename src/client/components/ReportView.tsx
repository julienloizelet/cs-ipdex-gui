import type { ReportResult, StatItem } from '../types';

interface ReportViewProps {
  report: ReportResult;
  onBack: () => void;
  onNewQuery: () => void;
  onDownload: () => void;
}

function StatCard({ title, icon, items, colorClass }: {
  title: string;
  icon: string;
  items: StatItem[];
  colorClass: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="card mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-4">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
                {item.count}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportView({ report, onBack, onNewQuery, onDownload }: ReportViewProps) {
  const { general, stats } = report;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Report: {general.reportName}
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

      <div className="card mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          General Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Report ID</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
              {general.reportId}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Creation Date</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {general.creationDate}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500 uppercase mb-1">File Path</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
              {general.filePath}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500 uppercase mb-1">SHA256</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono text-xs truncate">
              {general.sha256}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {general.numberOfIPs}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                Total IPs
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {general.knownIPs.count}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                Known ({general.knownIPs.percentage}%)
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {general.inBlocklist.count}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                Blocklisted ({general.inBlocklist.percentage}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      <StatCard
        title="Top Reputation"
        icon="🌟"
        items={stats.reputation}
        colorClass="bg-purple-500/20 text-purple-700 dark:text-purple-400"
      />

      <StatCard
        title="Top Classifications"
        icon="🗂️"
        items={stats.classifications}
        colorClass="bg-blue-500/20 text-blue-700 dark:text-blue-400"
      />

      <StatCard
        title="Top Behaviors"
        icon="🤖"
        items={stats.behaviors}
        colorClass="bg-red-500/20 text-red-700 dark:text-red-400"
      />

      <StatCard
        title="Top Blocklists"
        icon="⛔"
        items={stats.blocklists}
        colorClass="bg-orange-500/20 text-orange-700 dark:text-orange-400"
      />

      <StatCard
        title="Top CVEs"
        icon="💥"
        items={stats.cves}
        colorClass="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
      />

      <StatCard
        title="Top IP Ranges"
        icon="🌐"
        items={stats.ipRanges}
        colorClass="bg-cyan-500/20 text-cyan-700 dark:text-cyan-400"
      />

      <StatCard
        title="Top Autonomous Systems"
        icon="🛰️"
        items={stats.autonomousSystems}
        colorClass="bg-indigo-500/20 text-indigo-700 dark:text-indigo-400"
      />

      <StatCard
        title="Top Countries"
        icon="🌎"
        items={stats.countries}
        colorClass="bg-green-500/20 text-green-700 dark:text-green-400"
      />

      <div className="mt-6 text-center">
        <button
          className="btn btn-secondary inline-flex items-center gap-2"
          onClick={onDownload}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Report
        </button>
      </div>
    </div>
  );
}
