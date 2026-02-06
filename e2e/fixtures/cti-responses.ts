import type { CTIObject } from '../../src/server/services/cti/types.js';

function makeScores(overall: number) {
  const score = { aggressiveness: overall, threat: overall, trust: 0, anomaly: 1, total: overall };
  return { overall: score, last_day: score, last_week: score, last_month: score };
}

export const fixtures: Record<string, CTIObject> = {
  '1.2.3.4': {
    ip: '1.2.3.4',
    ip_range: '1.2.3.0/24',
    ip_range_24: '1.2.3.0/24',
    as_name: 'MOCK-AS-ONE',
    as_num: 12345,
    reputation: 'malicious',
    confidence: 'high',
    background_noise_score: 8,
    background_noise: 'high',
    scores: makeScores(4),
    location: { country: 'US', city: 'New York', latitude: 40.7, longitude: -74.0 },
    history: { first_seen: '2024-01-01T00:00:00Z', last_seen: '2024-06-01T00:00:00Z', full_age: 150, days_age: 150 },
    behaviors: [
      { name: 'http:exploit', label: 'HTTP Exploit', description: 'Exploiting HTTP vulnerabilities' },
    ],
    classifications: {
      classifications: [
        { name: 'community-blocklist', label: 'CrowdSec Community Blocklist', description: 'CrowdSec community blocklist' },
      ],
      false_positives: [],
    },
    attack_details: [{ name: 'crowdsecurity/http-probing', label: 'HTTP Probing', description: 'HTTP probing' }],
    target_countries: { US: 50, FR: 30 },
    mitre_techniques: [{ name: 'T1190', label: 'Exploit Public-Facing Application', description: 'Exploiting apps' }],
    cves: ['CVE-2021-44228'],
    references: [
      { name: 'firehol_level1', label: 'FireHOL Level 1', description: 'FireHOL blocklist' },
    ],
    reverse_dns: 'malicious.example.com',
  },

  '5.6.7.8': {
    ip: '5.6.7.8',
    ip_range: '5.6.7.0/24',
    ip_range_24: '5.6.7.0/24',
    as_name: 'MOCK-AS-TWO',
    as_num: 67890,
    reputation: 'suspicious',
    confidence: 'medium',
    background_noise_score: 5,
    background_noise: 'medium',
    scores: makeScores(3),
    location: { country: 'FR', city: 'Paris', latitude: 48.9, longitude: 2.3 },
    history: { first_seen: '2024-03-01T00:00:00Z', last_seen: '2024-07-01T00:00:00Z', full_age: 120, days_age: 120 },
    behaviors: [
      { name: 'ssh:bruteforce', label: 'SSH Bruteforce', description: 'Brute-forcing SSH credentials' },
    ],
    classifications: {
      classifications: [
        { name: 'scanner', label: 'Scanner', description: 'Network scanner' },
      ],
      false_positives: [],
    },
    attack_details: [{ name: 'crowdsecurity/ssh-bf', label: 'SSH Bruteforce', description: 'SSH brute force' }],
    target_countries: { FR: 40, DE: 20 },
    mitre_techniques: [],
    cves: [],
    references: [
      { name: 'firehol_level2', label: 'FireHOL Level 2', description: 'FireHOL level 2 blocklist' },
    ],
    reverse_dns: null,
  },

  '9.10.11.12': {
    ip: '9.10.11.12',
    ip_range: '9.10.11.0/24',
    ip_range_24: '9.10.11.0/24',
    as_name: 'MOCK-AS-THREE',
    as_num: 11111,
    reputation: 'known',
    confidence: 'low',
    background_noise_score: 3,
    background_noise: 'low',
    scores: makeScores(2),
    location: { country: 'DE', city: 'Berlin', latitude: 52.5, longitude: 13.4 },
    history: { first_seen: '2024-05-01T00:00:00Z', last_seen: '2024-08-01T00:00:00Z', full_age: 90, days_age: 90 },
    behaviors: [
      { name: 'tcp:scan', label: 'Port Scan', description: 'Scanning for open ports' },
    ],
    classifications: {
      classifications: [
        { name: 'scanner', label: 'Scanner', description: 'Network scanner' },
      ],
      false_positives: [],
    },
    attack_details: [],
    target_countries: { DE: 60 },
    mitre_techniques: [],
    cves: [],
    references: [],
    reverse_dns: 'scanner.example.de',
  },

  // Additional IPs to test "see more" functionality (need >5 items in a category)
  '10.0.0.1': {
    ip: '10.0.0.1',
    ip_range: '10.0.0.0/24',
    ip_range_24: '10.0.0.0/24',
    as_name: 'MOCK-AS-FOUR',
    as_num: 22222,
    reputation: 'malicious',
    confidence: 'high',
    background_noise_score: 7,
    background_noise: 'high',
    scores: makeScores(4),
    location: { country: 'CN', city: 'Beijing', latitude: 39.9, longitude: 116.4 },
    history: { first_seen: '2024-01-15T00:00:00Z', last_seen: '2024-07-01T00:00:00Z', full_age: 170, days_age: 170 },
    behaviors: [
      { name: 'ftp:bruteforce', label: 'FTP Bruteforce', description: 'Brute-forcing FTP credentials' },
    ],
    classifications: {
      classifications: [
        { name: 'botnet', label: 'Botnet', description: 'Part of a botnet' },
      ],
      false_positives: [],
    },
    attack_details: [],
    target_countries: { CN: 80 },
    mitre_techniques: [],
    cves: [],
    references: [],
    reverse_dns: null,
  },

  '10.0.0.2': {
    ip: '10.0.0.2',
    ip_range: '10.0.0.0/24',
    ip_range_24: '10.0.0.0/24',
    as_name: 'MOCK-AS-FIVE',
    as_num: 33333,
    reputation: 'suspicious',
    confidence: 'medium',
    background_noise_score: 4,
    background_noise: 'medium',
    scores: makeScores(3),
    location: { country: 'RU', city: 'Moscow', latitude: 55.8, longitude: 37.6 },
    history: { first_seen: '2024-02-01T00:00:00Z', last_seen: '2024-06-15T00:00:00Z', full_age: 135, days_age: 135 },
    behaviors: [
      { name: 'smtp:spam', label: 'SMTP Spam', description: 'Sending spam emails' },
    ],
    classifications: {
      classifications: [
        { name: 'spammer', label: 'Spammer', description: 'Known spammer' },
      ],
      false_positives: [],
    },
    attack_details: [],
    target_countries: { RU: 50, US: 30 },
    mitre_techniques: [],
    cves: [],
    references: [],
    reverse_dns: null,
  },

  '10.0.0.3': {
    ip: '10.0.0.3',
    ip_range: '10.0.0.0/24',
    ip_range_24: '10.0.0.0/24',
    as_name: 'MOCK-AS-SIX',
    as_num: 44444,
    reputation: 'malicious',
    confidence: 'high',
    background_noise_score: 9,
    background_noise: 'high',
    scores: makeScores(5),
    location: { country: 'BR', city: 'Sao Paulo', latitude: -23.5, longitude: -46.6 },
    history: { first_seen: '2024-01-01T00:00:00Z', last_seen: '2024-07-15T00:00:00Z', full_age: 195, days_age: 195 },
    behaviors: [
      { name: 'http:crawl', label: 'Web Crawler', description: 'Aggressive web crawling' },
    ],
    classifications: {
      classifications: [
        { name: 'crawler', label: 'Crawler', description: 'Web crawler' },
      ],
      false_positives: [],
    },
    attack_details: [],
    target_countries: { BR: 70, AR: 20 },
    mitre_techniques: [],
    cves: [],
    references: [],
    reverse_dns: null,
  },

  '10.0.0.4': {
    ip: '10.0.0.4',
    ip_range: '10.0.0.0/24',
    ip_range_24: '10.0.0.0/24',
    as_name: 'MOCK-AS-SEVEN',
    as_num: 55555,
    reputation: 'suspicious',
    confidence: 'medium',
    background_noise_score: 6,
    background_noise: 'medium',
    scores: makeScores(3),
    location: { country: 'JP', city: 'Tokyo', latitude: 35.7, longitude: 139.7 },
    history: { first_seen: '2024-03-15T00:00:00Z', last_seen: '2024-08-01T00:00:00Z', full_age: 140, days_age: 140 },
    behaviors: [
      { name: 'dns:tunneling', label: 'DNS Tunneling', description: 'Using DNS for data exfiltration' },
    ],
    classifications: {
      classifications: [
        { name: 'proxy', label: 'Proxy', description: 'Anonymous proxy' },
      ],
      false_positives: [],
    },
    attack_details: [],
    target_countries: { JP: 60, KR: 25 },
    mitre_techniques: [],
    cves: [],
    references: [],
    reverse_dns: null,
  },

  '10.0.0.5': {
    ip: '10.0.0.5',
    ip_range: '10.0.0.0/24',
    ip_range_24: '10.0.0.0/24',
    as_name: 'MOCK-AS-EIGHT',
    as_num: 66666,
    reputation: 'known',
    confidence: 'low',
    background_noise_score: 2,
    background_noise: 'low',
    scores: makeScores(2),
    location: { country: 'IN', city: 'Mumbai', latitude: 19.1, longitude: 72.9 },
    history: { first_seen: '2024-04-01T00:00:00Z', last_seen: '2024-07-20T00:00:00Z', full_age: 110, days_age: 110 },
    behaviors: [
      { name: 'rdp:bruteforce', label: 'RDP Bruteforce', description: 'Brute-forcing RDP credentials' },
    ],
    classifications: {
      classifications: [
        { name: 'vpn', label: 'VPN', description: 'VPN exit node' },
      ],
      false_positives: [],
    },
    attack_details: [],
    target_countries: { IN: 55, SG: 30 },
    mitre_techniques: [],
    cves: [],
    references: [],
    reverse_dns: null,
  },
};
