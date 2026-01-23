export interface CTIScore {
  aggressiveness: number;
  threat: number;
  trust: number;
  anomaly: number;
  total: number;
}

export interface CTIScores {
  overall: CTIScore;
  last_day: CTIScore;
  last_week: CTIScore;
  last_month: CTIScore;
}

export interface CTIBehavior {
  name: string;
  label: string;
  description: string;
}

export interface CTIClassification {
  name: string;
  label: string;
  description: string;
}

export interface CTIAttackDetail {
  name: string;
  label: string;
  description: string;
  references?: string[];
}

export interface CTIReference {
  name: string;
  label: string;
  description: string;
}

export interface CTILocation {
  country: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CTIHistory {
  first_seen: string;
  last_seen: string;
  full_age: number;
  days_age: number;
}

export interface CTIObject {
  ip: string;
  ip_range: string;
  ip_range_24: string;
  as_name: string;
  as_num: number;
  reputation: string;
  confidence: string;
  background_noise_score: number;
  background_noise: string;
  scores: CTIScores;
  location: CTILocation;
  history: CTIHistory;
  behaviors: CTIBehavior[];
  classifications: {
    classifications: CTIClassification[];
    false_positives: CTIClassification[];
  };
  attack_details: CTIAttackDetail[];
  target_countries: Record<string, number>;
  mitre_techniques: Array<{ name: string; label: string; description: string }>;
  cves: string[];
  references: CTIReference[];
  reverse_dns: string | null;
}

export interface BatchResponse {
  total: number;
  not_found: number;
  items: CTIObject[];
}

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
    creationDate: string;
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
