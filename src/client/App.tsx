import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { ApiKeyForm } from './components/ApiKeyForm';
import { IpInputForm } from './components/IpInputForm';
import { CommandOutput } from './components/CommandOutput';
import { ReportView } from './components/ReportView';
import { ConfirmDialog } from './components/ConfirmDialog';
import type { WizardStep, ReportResult } from './types';

function App() {
  const [step, setStep] = useState<WizardStep>('api-key');
  const [report, setReport] = useState<ReportResult | null>(null);
  const [isPovKey, setIsPovKey] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingIPs, setPendingIPs] = useState<string[]>([]);
  const { theme, toggleTheme } = useTheme();

  const { output, isRunning, init, createReport, downloadReport, clearOutput } = useSocket({
    onInitComplete: (exitCode) => {
      if (exitCode === 0) {
        setStep('ip-input');
      }
    },
    onQueryComplete: (exitCode, reportResult) => {
      if (exitCode === 0 && reportResult) {
        setReport(reportResult);
        setStep('results');
      }
    },
  });

  const handleApiKeySubmit = (key: string, povKey: boolean) => {
    setIsPovKey(povKey);
    setStep('executing');
    init(key);
  };

  const handleIpSubmit = (ips: string[]) => {
    setPendingIPs(ips);
    setShowConfirmDialog(true);
  };

  const handleConfirmQuery = () => {
    setShowConfirmDialog(false);
    setStep('executing');
    createReport(pendingIPs, isPovKey);
    setPendingIPs([]);
  };

  const handleCancelQuery = () => {
    setShowConfirmDialog(false);
    setPendingIPs([]);
  };

  const handleBackToApiKey = () => {
    clearOutput();
    setStep('api-key');
  };

  const handleBackToIpInput = () => {
    clearOutput();
    setStep('ip-input');
  };

  const handleNewQuery = () => {
    clearOutput();
    setReport(null);
    setStep('ip-input');
  };

  const renderStep = () => {
    switch (step) {
      case 'api-key':
        return <ApiKeyForm onSubmit={handleApiKeySubmit} />;
      case 'ip-input':
        return <IpInputForm onSubmit={handleIpSubmit} onBack={handleBackToApiKey} />;
      case 'executing':
        return <CommandOutput output={output} isRunning={isRunning} onBack={handleBackToIpInput} />;
      case 'results':
        return report ? (
          <ReportView
            report={report}
            onBack={handleBackToIpInput}
            onNewQuery={handleNewQuery}
            onDownload={() => downloadReport(report.general.reportId)}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main className="py-8 px-4">{renderStep()}</main>
      {showConfirmDialog && (
        <ConfirmDialog
          ipCount={pendingIPs.length}
          onCancel={handleCancelQuery}
          onConfirm={handleConfirmQuery}
        />
      )}
    </div>
  );
}

export default App;
