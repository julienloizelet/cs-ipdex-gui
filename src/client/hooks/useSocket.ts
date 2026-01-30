import { useEffect, useState, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { CommandOutput, ReportResult } from '../types';

interface UseSocketOptions {
  onInitComplete?: (exitCode: number) => void;
  onQueryComplete?: (exitCode: number, report: ReportResult | null) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [output, setOutput] = useState<CommandOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const outputBufferRef = useRef<string>('');
  const operationRef = useRef<'init' | 'createReport' | null>(null);
  const reportRef = useRef<ReportResult | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const newSocket = io();

    newSocket.on('output', (data: CommandOutput) => {
      // Ignore events from cancelled/completed operations
      if (operationRef.current === null) return;

      setOutput((prev) => [...prev, data]);

      // Parse results from output
      if (data.type === 'stdout') {
        outputBufferRef.current += data.data;

        const startMarker = '---RESULTS_JSON---';
        const endMarker = '---END_RESULTS---';

        if (
          outputBufferRef.current.includes(startMarker) &&
          outputBufferRef.current.includes(endMarker)
        ) {
          const startIdx =
            outputBufferRef.current.indexOf(startMarker) + startMarker.length;
          const endIdx = outputBufferRef.current.indexOf(endMarker);
          const jsonStr = outputBufferRef.current.slice(startIdx, endIdx).trim();

          try {
            reportRef.current = JSON.parse(jsonStr);
          } catch {
            console.error('Failed to parse report JSON');
          }
        }
      }

      if (data.type === 'exit') {
        const exitCode = data.code ?? 0;
        setIsRunning(false);

        if (operationRef.current === 'init') {
          optionsRef.current.onInitComplete?.(exitCode);
        } else if (operationRef.current === 'createReport') {
          optionsRef.current.onQueryComplete?.(exitCode, reportRef.current);
        }
        operationRef.current = null;
      }
    });

    newSocket.on('reportFile', (data: { data: ArrayBuffer }) => {
      const blob = new Blob([data.data], { type: 'application/gzip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cti-report.tar.gz`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
    outputBufferRef.current = '';
    reportRef.current = null;
    operationRef.current = null;
    setIsRunning(false);
  }, []);

  const init = useCallback(
    (apiKey: string) => {
      if (socket) {
        clearOutput();
        operationRef.current = 'init';
        setIsRunning(true);
        socket.emit('init', apiKey);
      }
    },
    [socket, clearOutput]
  );

  const createReport = useCallback(
    (ips: string[], isPovKey: boolean) => {
      if (socket) {
        clearOutput();
        operationRef.current = 'createReport';
        setIsRunning(true);
        socket.emit('createReport', { ips, isPovKey });
      }
    },
    [socket, clearOutput]
  );

  const downloadReport = useCallback(
    () => {
      if (socket) {
        socket.emit('downloadReport');
      }
    },
    [socket]
  );

  return {
    output,
    isRunning,
    init,
    createReport,
    downloadReport,
    clearOutput,
  };
}
