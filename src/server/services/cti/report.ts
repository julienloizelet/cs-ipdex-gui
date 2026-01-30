import { queryIP, queryBatch, CTIError } from './client.js';
import type { CTIObject, OutputCallback, ReportResult, StatItem } from './types.js';

const BATCH_SIZE = 20;
const COMMUNITY_DELAY_MS = 1200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function aggregateStats(items: CTIObject[], totalIPs: number): ReportResult {
  const knownCount = items.length;
  const knownPercentage = totalIPs > 0 ? Math.round((knownCount / totalIPs) * 100) : 0;

  const inBlocklistCount = items.filter((item) => item.references && item.references.length > 0).length;
  const inBlocklistPercentage = totalIPs > 0 ? Math.round((inBlocklistCount / totalIPs) * 100) : 0;

  const reputationMap = new Map<string, number>();
  const classificationsMap = new Map<string, number>();
  const behaviorsMap = new Map<string, number>();
  const blocklistsMap = new Map<string, number>();
  const cvesMap = new Map<string, number>();
  const ipRangesMap = new Map<string, number>();
  const asMap = new Map<string, number>();
  const countriesMap = new Map<string, number>();

  for (const item of items) {
    // Reputation
    if (item.reputation) {
      reputationMap.set(item.reputation, (reputationMap.get(item.reputation) ?? 0) + 1);
    }

    // Classifications
    if (item.classifications?.classifications) {
      for (const c of item.classifications.classifications) {
        classificationsMap.set(c.label, (classificationsMap.get(c.label) ?? 0) + 1);
      }
    }
    if (item.classifications?.false_positives) {
      for (const fp of item.classifications.false_positives) {
        classificationsMap.set(fp.label, (classificationsMap.get(fp.label) ?? 0) + 1);
      }
    }

    // Behaviors
    if (item.behaviors) {
      for (const b of item.behaviors) {
        behaviorsMap.set(b.label, (behaviorsMap.get(b.label) ?? 0) + 1);
      }
    }

    // Blocklists (from references)
    if (item.references) {
      for (const r of item.references) {
        blocklistsMap.set(r.label, (blocklistsMap.get(r.label) ?? 0) + 1);
      }
    }

    // CVEs
    if (item.cves) {
      for (const cve of item.cves) {
        cvesMap.set(cve, (cvesMap.get(cve) ?? 0) + 1);
      }
    }

    // IP Ranges
    if (item.ip_range && item.ip_range !== 'N/A') {
      ipRangesMap.set(item.ip_range, (ipRangesMap.get(item.ip_range) ?? 0) + 1);
    }

    // Autonomous Systems
    if (item.as_name && item.as_name !== 'N/A') {
      asMap.set(item.as_name, (asMap.get(item.as_name) ?? 0) + 1);
    }

    // Countries
    if (item.location?.country && item.location.country !== 'N/A') {
      countriesMap.set(item.location.country, (countriesMap.get(item.location.country) ?? 0) + 1);
    }
  }

  function mapToStats(map: Map<string, number>): StatItem[] {
    return Array.from(map.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: knownCount > 0 ? Math.round((count / knownCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  return {
    general: {
      creationDate: new Date().toISOString(),
      numberOfIPs: totalIPs,
      knownIPs: { count: knownCount, percentage: knownPercentage },
      inBlocklist: { count: inBlocklistCount, percentage: inBlocklistPercentage },
    },
    stats: {
      reputation: mapToStats(reputationMap),
      classifications: mapToStats(classificationsMap),
      behaviors: mapToStats(behaviorsMap),
      blocklists: mapToStats(blocklistsMap),
      cves: mapToStats(cvesMap),
      ipRanges: mapToStats(ipRangesMap),
      autonomousSystems: mapToStats(asMap),
      countries: mapToStats(countriesMap),
    },
  };
}

async function queryBatchWithProgress(
  apiKey: string,
  ips: string[],
  onOutput: OutputCallback
): Promise<CTIObject[]> {
  const results: CTIObject[] = [];

  for (let i = 0; i < ips.length; i += BATCH_SIZE) {
    const batch = ips.slice(i, i + BATCH_SIZE);
    const from = i + 1;
    const to = Math.min(i + BATCH_SIZE, ips.length);

    onOutput({ type: 'stdout', data: `Querying IPs ${from}-${to} of ${ips.length}...\n` });

    const response = await queryBatch(apiKey, batch);
    results.push(...response.items);
  }

  return results;
}

async function queryIndividualWithProgress(
  apiKey: string,
  ips: string[],
  onOutput: OutputCallback
): Promise<CTIObject[]> {
  const results: CTIObject[] = [];

  for (let i = 0; i < ips.length; i++) {
    onOutput({ type: 'stdout', data: `Querying IP ${i + 1}/${ips.length}: ${ips[i]}...\n` });

    const result = await queryIP(apiKey, ips[i]);
    if (result) {
      results.push(result);
    } else {
      onOutput({ type: 'stdout', data: `  IP ${ips[i]} not found in CTI database\n` });
    }

    // Rate limit delay between calls (except after last one)
    if (i < ips.length - 1) {
      await sleep(COMMUNITY_DELAY_MS);
    }
  }

  return results;
}

export async function createReport(
  apiKey: string,
  ips: string[],
  isPovKey: boolean,
  onOutput: OutputCallback
): Promise<{ report: ReportResult; raw: CTIObject[] }> {
  const cleanIPs = ips.map((ip) => ip.trim()).filter((ip) => ip.length > 0);

  if (cleanIPs.length === 0) {
    onOutput({ type: 'error', data: 'No IPs provided' });
    throw new Error('No IPs provided');
  }
  onOutput({ type: 'stdout', data: `Querying ${cleanIPs.length} IPs against CrowdSec CTI...\n` });

  let results: CTIObject[];

  try {
    if (isPovKey) {
      results = await queryBatchWithProgress(apiKey, cleanIPs, onOutput);
    } else {
      results = await queryIndividualWithProgress(apiKey, cleanIPs, onOutput);
    }
  } catch (err) {
    if (err instanceof CTIError) {
      if (err.statusCode === 403) {
        onOutput({ type: 'stderr', data: 'Invalid API key or unauthorized access\n' });
      } else if (err.statusCode === 429) {
        onOutput({ type: 'stderr', data: 'Rate limit exceeded. Please try again later.\n' });
      } else {
        onOutput({ type: 'stderr', data: `API error: ${err.message}\n` });
      }
    } else {
      onOutput({ type: 'stderr', data: `Error: ${err instanceof Error ? err.message : 'Unknown error'}\n` });
    }
    throw err;
  }

  onOutput({ type: 'stdout', data: `\nReceived data for ${results.length}/${cleanIPs.length} IPs\n` });
  onOutput({ type: 'stdout', data: 'Generating report...\n' });

  const report = aggregateStats(results, cleanIPs.length);

  onOutput({
    type: 'stdout',
    data: `\n---RESULTS_JSON---\n${JSON.stringify(report, null, 2)}\n---END_RESULTS---\n`,
  });

  onOutput({ type: 'exit', data: 'Report complete', code: 0 });

  return { report, raw: results };
}
