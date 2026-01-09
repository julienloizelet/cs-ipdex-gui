import { useEffect, useState, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { CommandOutput, IPResult } from '../types';

interface UseSocketOptions {
  onInitComplete?: (exitCode: number) => void;
  onQueryComplete?: (exitCode: number, results: IPResult[]) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [output, setOutput] = useState<CommandOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const outputBufferRef = useRef<string>('');
  const operationRef = useRef<'init' | 'query' | null>(null);
  const resultsRef = useRef<IPResult[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const newSocket = io();

    newSocket.on('output', (data: CommandOutput) => {
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
            resultsRef.current = JSON.parse(jsonStr);
          } catch {
            console.error('Failed to parse results JSON');
          }
        }
      }

      if (data.type === 'exit') {
        const exitCode = data.code ?? 0;
        setIsRunning(false);

        if (operationRef.current === 'init') {
          optionsRef.current.onInitComplete?.(exitCode);
        } else if (operationRef.current === 'query') {
          optionsRef.current.onQueryComplete?.(exitCode, resultsRef.current);
        }
        operationRef.current = null;
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
    outputBufferRef.current = '';
    resultsRef.current = [];
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

  const query = useCallback(
    (ips: string[]) => {
      if (socket) {
        clearOutput();
        operationRef.current = 'query';
        setIsRunning(true);
        socket.emit('query', ips);
      }
    },
    [socket, clearOutput]
  );

  return {
    output,
    isRunning,
    init,
    query,
    clearOutput,
  };
}
