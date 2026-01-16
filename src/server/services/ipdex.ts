import { spawn } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { gzipSync } from 'zlib';

export interface CommandOutput {
  type: 'stdout' | 'stderr' | 'exit' | 'error';
  data: string;
  code?: number;
}

export type OutputCallback = (output: CommandOutput) => void;

export interface StatItem {
  label: string;
  count: number;
  percentage: number;
}

export interface ReportResult {
  general: {
    reportId: number;
    reportName: string;
    creationDate: string;
    filePath: string;
    sha256: string;
    numberOfIPs: number;
    knownIPs: { count: number; percentage: number };
    inBlocklist: { count: number; percentage: number };
  };
  stats: {
    reputation: StatItem[];
    classifications: StatItem[];
    behaviors: StatItem[];
    blocklists: StatItem[];
    cves: StatItem[];
    ipRanges: StatItem[];
    autonomousSystems: StatItem[];
    countries: StatItem[];
  };
}

const IPDEX_BINARY = process.env.IPDEX_BINARY || 'ipdex';
const IPDEX_FILE_PATH = '/tmp/ipdex-ips.txt';

function runCommand(
  args: string[],
  onOutput?: OutputCallback
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    try {
      const proc = spawn(IPDEX_BINARY, args, {
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        const str = data.toString();
        stdout += str;
        onOutput?.({ type: 'stdout', data: str });
      });

      proc.stderr.on('data', (data: Buffer) => {
        const str = data.toString();
        stderr += str;
        onOutput?.({ type: 'stderr', data: str });
      });

      proc.on('close', (code) => {
        const exitCode = code ?? 0;
        resolve({ exitCode, stdout, stderr });
      });

      proc.on('error', (err) => {
        onOutput?.({ type: 'error', data: err.message });
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

  try {
    // Create config directory if needed (matches ipdex's configdir.LocalConfig("ipdex"))
    const configDir = join(homedir(), '.config', 'ipdex');
    await mkdir(configDir, { recursive: true });

    // Write config file with API key
    const configPath = join(configDir, '.ipdex.yaml');
    const configContent = `api_key: ${apiKey}\n`;
    await writeFile(configPath, configContent);

    onOutput({ type: 'stdout', data: 'API key saved.\n' });
    onOutput({ type: 'exit', data: 'Configuration complete', code: 0 });
    return 0;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    onOutput({ type: 'stderr', data: `Failed to save API key: ${errorMsg}\n` });
    onOutput({ type: 'exit', data: 'Configuration failed', code: 1 });
    return 1;
  }
}

function parseCountWithPercentage(text: string): { count: number; percentage: number } {
  // Parse "3 (100%)" format
  const match = text.match(/(\d+)\s*\((\d+)%\)/);
  if (match) {
    return { count: parseInt(match[1], 10), percentage: parseInt(match[2], 10) };
  }
  return { count: 0, percentage: 0 };
}

function parseStatItems(section: string): StatItem[] {
  const items: StatItem[] = [];
  const lines = section.split('\n');

  for (const line of lines) {
    // Match lines like "     Malicious                                               2 (67%)"
    const match = line.match(/^\s+(.+?)\s{2,}(\d+)\s+\((\d+)%\)/);
    if (match) {
      items.push({
        label: match[1].trim(),
        count: parseInt(match[2], 10),
        percentage: parseInt(match[3], 10),
      });
    }
  }

  return items;
}

function parseReportOutput(output: string): ReportResult {
  const result: ReportResult = {
    general: {
      reportId: 0,
      reportName: '',
      creationDate: '',
      filePath: '',
      sha256: '',
      numberOfIPs: 0,
      knownIPs: { count: 0, percentage: 0 },
      inBlocklist: { count: 0, percentage: 0 },
    },
    stats: {
      reputation: [],
      classifications: [],
      behaviors: [],
      blocklists: [],
      cves: [],
      ipRanges: [],
      autonomousSystems: [],
      countries: [],
    },
  };

  // Parse General section
  const reportIdMatch = output.match(/Report ID\s+(\d+)/);
  if (reportIdMatch) {
    result.general.reportId = parseInt(reportIdMatch[1], 10);
  }

  const reportNameMatch = output.match(/Report Name\s+(.+)/);
  if (reportNameMatch) {
    result.general.reportName = reportNameMatch[1].trim();
  }

  const creationDateMatch = output.match(/Creation Date\s+(.+)/);
  if (creationDateMatch) {
    result.general.creationDate = creationDateMatch[1].trim();
  }

  const filePathMatch = output.match(/File path\s+(.+)/);
  if (filePathMatch) {
    result.general.filePath = filePathMatch[1].trim();
  }

  const sha256Match = output.match(/SHA256\s+(\w+)/);
  if (sha256Match) {
    result.general.sha256 = sha256Match[1].trim();
  }

  const numberOfIPsMatch = output.match(/Number of IPs\s+(\d+)/);
  if (numberOfIPsMatch) {
    result.general.numberOfIPs = parseInt(numberOfIPsMatch[1], 10);
  }

  const knownIPsMatch = output.match(/Number of known IPs\s+(.+)/);
  if (knownIPsMatch) {
    result.general.knownIPs = parseCountWithPercentage(knownIPsMatch[1]);
  }

  const inBlocklistMatch = output.match(/Number of IPs in Blocklist\s+(.+)/);
  if (inBlocklistMatch) {
    result.general.inBlocklist = parseCountWithPercentage(inBlocklistMatch[1]);
  }

  // Parse Stats sections by emoji headers
  const sections = [
    { emoji: '🌟', key: 'reputation' as const },
    { emoji: '🗂️', key: 'classifications' as const },
    { emoji: '🤖', key: 'behaviors' as const },
    { emoji: '⛔', key: 'blocklists' as const },
    { emoji: '💥', key: 'cves' as const },
    { emoji: '🌐', key: 'ipRanges' as const },
    { emoji: '🛰️', key: 'autonomousSystems' as const },
    { emoji: '🌎', key: 'countries' as const },
  ];

  for (let i = 0; i < sections.length; i++) {
    const { emoji, key } = sections[i];
    const nextEmoji = sections[i + 1]?.emoji;

    // Find the section between this emoji and the next
    const startIdx = output.indexOf(emoji);
    if (startIdx === -1) { continue; }

    let endIdx = output.length;
    if (nextEmoji) {
      const nextIdx = output.indexOf(nextEmoji, startIdx + 1);
      if (nextIdx !== -1) {
        endIdx = nextIdx;
      }
    }

    const sectionText = output.slice(startIdx, endIdx);
    result.stats[key] = parseStatItems(sectionText);
  }

  return result;
}

export async function createReport(
  ips: string[],
  isPovKey: boolean,
  onOutput: OutputCallback
): Promise<number> {
  if (ips.length === 0) {
    onOutput({ type: 'error', data: 'No IPs provided' });
    return 1;
  }

  // Write IPs to temporary file
  onOutput({ type: 'stdout', data: `Writing ${ips.length} IPs to ${IPDEX_FILE_PATH}...\n` });
  try {
    const ipContent = ips.map(ip => ip.trim()).filter(ip => ip.length > 0).join('\n');
    await writeFile(IPDEX_FILE_PATH, ipContent);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    onOutput({ type: 'stderr', data: `Failed to write IP file: ${errorMsg}\n` });
    onOutput({ type: 'exit', data: 'Report creation failed', code: 1 });
    return 1;
  }

  // Run ipdex with the file
  const args = [IPDEX_FILE_PATH];
  if (isPovKey) {
    args.push('-b');
  }

  onOutput({ type: 'stdout', data: `Running ipdex ${args.join(' ')}...\n` });

  const createResult = await runCommand(args, onOutput);

  if (createResult.exitCode !== 0) {
    onOutput({ type: 'exit', data: 'Report creation failed', code: createResult.exitCode });
    return createResult.exitCode;
  }

  // Extract Report ID from output
  const reportIdMatch = createResult.stdout.match(/Report ID\s+(\d+)/);
  if (!reportIdMatch) {
    onOutput({ type: 'stderr', data: 'Failed to extract Report ID from output\n' });
    onOutput({ type: 'exit', data: 'Report creation failed', code: 1 });
    return 1;
  }

  const reportId = reportIdMatch[1];
  onOutput({ type: 'stdout', data: `\nReport created with ID: ${reportId}\n` });
  onOutput({ type: 'stdout', data: `Running ipdex report show ${reportId}...\n\n` });

  // Run ipdex report show
  const showResult = await runCommand(['report', 'show', reportId], onOutput);

  if (showResult.exitCode !== 0) {
    onOutput({ type: 'exit', data: 'Failed to show report', code: showResult.exitCode });
    return showResult.exitCode;
  }

  // Parse the report output
  const report = parseReportOutput(showResult.stdout);

  // Send final results as JSON
  onOutput({
    type: 'stdout',
    data: `\n---RESULTS_JSON---\n${JSON.stringify(report, null, 2)}\n---END_RESULTS---\n`
  });

  onOutput({ type: 'exit', data: 'Report complete', code: 0 });
  return 0;
}

export async function generateReportJson(reportId: number): Promise<Buffer> {
  const result = await runCommand(['report', 'show', String(reportId), '-o', 'json']);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to generate report JSON: ${result.stderr || 'Unknown error'}`);
  }

  return gzipSync(result.stdout);
}
