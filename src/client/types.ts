export type WizardStep = 'api-key' | 'ip-input' | 'executing' | 'results';

export interface WizardState {
  step: WizardStep;
  apiKey: string;
  ips: string[];
  results: IPResult[];
}

export interface CommandOutput {
  type: 'stdout' | 'stderr' | 'exit' | 'error';
  data: string;
  code?: number;
}

export interface IPResult {
  ip: string;
  ip_range: string;
  as_name: string;
  as_num: number;
  location: {
    country: string;
    city: string | null;
    latitude: number;
    longitude: number;
  };
  reverse_dns: string | null;
  behaviors: Array<{
    name: string;
    label: string;
    description: string;
  }>;
  history: {
    first_seen: string;
    last_seen: string;
    full_age: number;
    days_age: number;
  };
  classifications: {
    classifications: Array<{
      name: string;
      label: string;
      description: string;
    }>;
    false_positives: Array<{
      name: string;
      label: string;
      description: string;
    }>;
  };
  attack_details: Array<{
    name: string;
    label: string;
    description: string;
  }>;
  target_countries: Record<string, number>;
  background_noise_score: number;
  background_noise: string;
  scores: {
    overall: {
      aggressiveness: number;
      threat: number;
      trust: number;
      anomaly: number;
      total: number;
    };
    last_day: {
      aggressiveness: number;
      threat: number;
      trust: number;
      anomaly: number;
      total: number;
    };
    last_week: {
      aggressiveness: number;
      threat: number;
      trust: number;
      anomaly: number;
      total: number;
    };
    last_month: {
      aggressiveness: number;
      threat: number;
      trust: number;
      anomaly: number;
      total: number;
    };
  };
  references: Array<{
    name: string;
    label: string;
    description: string;
  }>;
}
