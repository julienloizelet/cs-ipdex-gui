import { gzipSync } from 'zlib';
import type { CTIObject, ReportResult } from './types.js';

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function csvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(',');
}

function stripTimezone(dateStr: string): string {
  return dateStr.split('+')[0];
}

function buildReportCsv(report: ReportResult): string {
  const rows: string[] = [];

  // General section
  rows.push(csvRow(['General', '', '']));
  rows.push(csvRow(['', '', '']));
  rows.push(csvRow(['Creation Date', report.general.creationDate, '']));
  rows.push(csvRow(['Number of IPs', String(report.general.numberOfIPs), '']));
  rows.push(csvRow([
    'Number of known IPs',
    String(report.general.knownIPs.count),
    `${report.general.knownIPs.percentage}%`,
  ]));
  rows.push(csvRow([
    'Number of IPs in Blocklist',
    String(report.general.inBlocklist.count),
    `${report.general.inBlocklist.percentage}%`,
  ]));
  rows.push(csvRow(['', '', '']));

  // Stats section
  rows.push(csvRow(['Stats', '', '']));
  rows.push(csvRow(['', '', '']));

  const sections: Array<{ title: string; items: ReportResult['stats'][keyof ReportResult['stats']] }> = [
    { title: 'Top Reputation', items: report.stats.reputation },
    { title: 'Top Classifications', items: report.stats.classifications },
    { title: 'Top Behaviors', items: report.stats.behaviors },
    { title: 'Top Blocklists', items: report.stats.blocklists },
    { title: 'Top CVEs', items: report.stats.cves },
    { title: 'Top IP Ranges', items: report.stats.ipRanges },
    { title: 'Top Autonomous Systems', items: report.stats.autonomousSystems },
    { title: 'Top Countries', items: report.stats.countries },
  ];

  for (const section of sections) {
    if (section.items.length === 0) {
      continue;
    }
    rows.push(csvRow([section.title, '', '']));
    for (const item of section.items) {
      rows.push(csvRow([item.label, String(item.count), `${item.percentage}%`]));
    }
    rows.push(csvRow(['', '', '']));
  }

  return rows.join('\n');
}

function getProfile(item: CTIObject): string {
  const classifications = item.classifications?.classifications ?? [];
  const falsePositives = item.classifications?.false_positives ?? [];

  if (falsePositives.length > 0) {
    return falsePositives[falsePositives.length - 1].label;
  }

  if (classifications.length > 0) {
    for (const c of classifications) {
      if (classifications.length > 1 && c.label.toLowerCase() === 'crowdsec community blocklist') {
        continue;
      }
      return c.label;
    }
  }

  return 'N/A';
}

function buildDetailsCsv(items: CTIObject[]): string {
  const rows: string[] = [];

  // Header
  rows.push(csvRow([
    'IP', 'Country', 'AS Name', 'Reputation', 'Confidence',
    'Reverse DNS', 'Profile', 'Behaviors', 'Range', 'First Seen', 'Last Seen',
  ]));

  for (const item of items) {
    const country = item.location?.country || 'N/A';
    const asName = item.as_name || 'N/A';
    const reputation = item.reputation || 'N/A';
    const confidence = item.confidence || 'N/A';
    const reverseDns = item.reverse_dns || 'N/A';
    const profile = getProfile(item);
    const behaviors = item.behaviors?.length
      ? item.behaviors.map((b) => b.label).join(', ')
      : 'N/A';
    const ipRange = item.ip_range || 'N/A';
    const firstSeen = item.history?.first_seen ? stripTimezone(item.history.first_seen) : 'N/A';
    const lastSeen = item.history?.last_seen ? stripTimezone(item.history.last_seen) : 'N/A';

    rows.push(csvRow([
      item.ip, country, asName, reputation, confidence,
      reverseDns, profile, behaviors, ipRange, firstSeen, lastSeen,
    ]));
  }

  return rows.join('\n');
}

// Creates a minimal tar archive containing the two CSV files, then gzips it
function createTarGz(files: Array<{ name: string; content: string }>): Buffer {
  const buffers: Buffer[] = [];

  for (const file of files) {
    const contentBuf = Buffer.from(file.content, 'utf-8');
    const header = Buffer.alloc(512, 0);

    // File name (100 bytes)
    header.write(file.name, 0, 100, 'utf-8');
    // File mode (8 bytes)
    header.write('0000644\0', 100, 8, 'utf-8');
    // Owner UID (8 bytes)
    header.write('0000000\0', 108, 8, 'utf-8');
    // Owner GID (8 bytes)
    header.write('0000000\0', 116, 8, 'utf-8');
    // File size in octal (12 bytes)
    header.write(contentBuf.length.toString(8).padStart(11, '0') + '\0', 124, 12, 'utf-8');
    // Modification time (12 bytes)
    const mtime = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0';
    header.write(mtime, 136, 12, 'utf-8');
    // Checksum placeholder (8 bytes of spaces)
    header.write('        ', 148, 8, 'utf-8');
    // Type flag: regular file
    header.write('0', 156, 1, 'utf-8');
    // USTAR magic
    header.write('ustar\0', 257, 6, 'utf-8');
    header.write('00', 263, 2, 'utf-8');

    // Compute checksum
    let checksum = 0;
    for (let i = 0; i < 512; i++) {
      checksum += header[i];
    }
    header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf-8');

    buffers.push(header);
    buffers.push(contentBuf);

    // Pad content to 512-byte boundary
    const padding = 512 - (contentBuf.length % 512);
    if (padding < 512) {
      buffers.push(Buffer.alloc(padding, 0));
    }
  }

  // End-of-archive marker: two 512-byte blocks of zeros
  buffers.push(Buffer.alloc(1024, 0));

  const tar = Buffer.concat(buffers);
  return gzipSync(tar);
}

export function generateDownload(report: ReportResult, raw: CTIObject[]): Buffer {
  const reportCsv = buildReportCsv(report);
  const detailsCsv = buildDetailsCsv(raw);

  return createTarGz([
    { name: 'report.csv', content: reportCsv },
    { name: 'details.csv', content: detailsCsv },
  ]);
}
