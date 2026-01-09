import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { ApiKeyForm } from './components/ApiKeyForm';
import { IpInputForm } from './components/IpInputForm';
import { CommandOutput } from './components/CommandOutput';
import { ResultsView } from './components/ResultsView';
import type { WizardStep, IPResult } from './types';

function App() {
  const [step, setStep] = useState<WizardStep>('api-key');
  const [results, setResults] = useState<IPResult[]>([]);
  const { theme, toggleTheme } = useTheme();

  const { output, isRunning, init, query, clearOutput } = useSocket({
    onInitComplete: (exitCode) => {
      if (exitCode === 0) {
        setStep('ip-input');
      }
    },
    onQueryComplete: (exitCode, queryResults) => {
      if (exitCode === 0) {
        setResults(queryResults);
        setStep('results');
      }
    },
  });

  const handleApiKeySubmit = (key: string) => {
    setStep('executing');
    init(key);
  };

  const handleIpSubmit = (ips: string[]) => {
    setStep('executing');
    query(ips);
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
    setResults([]);
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
        return (
          <ResultsView
            results={results}
            onBack={handleBackToIpInput}
            onNewQuery={handleNewQuery}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main className="py-8 px-4">{renderStep()}</main>
    </div>
  );
}

export default App;
