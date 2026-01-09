import { spawn } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

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
  // Create config directory if needed
  const configDir = join(homedir(), '.config', 'ipdex');
  await mkdir(configDir, { recursive: true });

  // Write config file with API key
  const configPath = join(configDir, '.ipdex');
  const configContent = `api_key: ${apiKey}\noutput_format: json\n`;
  await writeFile(configPath, configContent);

  onOutput({ type: 'stdout', data: 'Configuration saved.\n' });
  onOutput({ type: 'stdout', data: 'Testing API key...\n' });

  // Test the API key by running a simple query
  return runCommand(['config', 'show'], onOutput);
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

  for (const ip of ips) {
    const trimmedIP = ip.trim();
    if (!trimmedIP) {continue;}

    onOutput({ type: 'stdout', data: `Querying ${trimmedIP}...\n` });

    const ipResults: string[] = [];
    const exitCode = await runCommand([trimmedIP, '-o', 'json'], (output) => {
      if (output.type === 'stdout') {
        ipResults.push(output.data);
      } else if (output.type === 'stderr') {
        onOutput(output);
      }
    });

    if (exitCode === 0 && ipResults.length > 0) {
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
  onOutput({ type: 'exit', data: 'Query complete', code: 0 });

  return 0;
}
