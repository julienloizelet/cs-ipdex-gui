import { spawn } from 'child_process';

export interface CommandOutput {
  type: 'stdout' | 'stderr' | 'exit' | 'error';
  data: string;
  code?: number;
}

export type OutputCallback = (output: CommandOutput) => void;

const IPDEX_BINARY = process.env.IPDEX_BINARY || 'ipdex';

function runCommand(
  args: string[],
  onOutput: OutputCallback
): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const proc = spawn(IPDEX_BINARY, args, {
        env: { ...process.env },
      });

      proc.stdout.on('data', (data: Buffer) => {
        onOutput({ type: 'stdout', data: data.toString() });
      });

      proc.stderr.on('data', (data: Buffer) => {
        onOutput({ type: 'stderr', data: data.toString() });
      });

      proc.on('close', (code) => {
        const exitCode = code ?? 0;
        onOutput({ type: 'exit', data: `Process exited with code ${exitCode}`, code: exitCode });
        resolve(exitCode);
      });

      proc.on('error', (err) => {
        onOutput({ type: 'error', data: err.message });
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function initIpdex(
  apiKey: string,
  onOutput: OutputCallback
): Promise<number> {
  onOutput({ type: 'stdout', data: 'Setting API key...\n' });

  // Use ipdex config set command to set the API key
  return runCommand(['config', 'set', '--api-key', apiKey], onOutput);
}

export async function queryIPs(
  ips: string[],
  onOutput: OutputCallback
): Promise<number> {
  if (ips.length === 0) {
    onOutput({ type: 'error', data: 'No IPs provided' });
    return 1;
  }

  // Query each IP with JSON output
  const results: Record<string, unknown>[] = [];
  let hasError = false;
  let lastError = '';

  for (const ip of ips) {
    const trimmedIP = ip.trim();
    if (!trimmedIP) { continue; }

    onOutput({ type: 'stdout', data: `Querying ${trimmedIP}...\n` });

    const ipResults: string[] = [];
    let ipError = '';
    const exitCode = await runCommand([trimmedIP, '-o', 'json'], (output) => {
      if (output.type === 'stdout') {
        ipResults.push(output.data);
      } else if (output.type === 'stderr') {
        ipError += output.data;
        onOutput(output);
      }
    });

    if (exitCode !== 0) {
      hasError = true;
      // Capture error from stdout if stderr is empty (some errors go to stdout)
      const errorMsg = ipError || ipResults.join('');
      lastError = errorMsg;
      // Show the error to the user
      if (!ipError && errorMsg) {
        onOutput({ type: 'stderr', data: errorMsg });
      }
      // Don't continue if it's an API key error (affects all queries)
      if (errorMsg.toLowerCase().includes('api key') || errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('invalid')) {
        onOutput({ type: 'exit', data: 'Query failed', code: exitCode });
        return exitCode;
      }
    } else if (ipResults.length > 0) {
      try {
        const jsonData = JSON.parse(ipResults.join(''));
        results.push(jsonData);
      } catch {
        onOutput({ type: 'stderr', data: `Failed to parse result for ${trimmedIP}\n` });
      }
    }
  }

  // Send final results as JSON
  onOutput({
    type: 'stdout',
    data: `\n---RESULTS_JSON---\n${JSON.stringify(results, null, 2)}\n---END_RESULTS---\n`
  });

  if (hasError && results.length === 0) {
    onOutput({ type: 'exit', data: lastError || 'Query failed', code: 1 });
    return 1;
  }

  onOutput({ type: 'exit', data: 'Query complete', code: 0 });
  return 0;
}
