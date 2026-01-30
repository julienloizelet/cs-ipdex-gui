import type { CTIObject, BatchResponse } from './types.js';

const BASE_URL = process.env.CTI_BASE_URL || 'https://cti.api.crowdsec.net/v2';
const USER_AGENT = 'cs-ipdex-gui/1.0';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2000;

export class CTIError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'CTIError';
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  apiKey: string,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': USER_AGENT,
      },
    });

    if (response.status === 429) {
      if (attempt < retries) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      throw new CTIError('Rate limit exceeded after retries', 429);
    }

    return response;
  }

  // Unreachable: the loop always returns or throws
  throw new CTIError('Rate limit exceeded after retries', 429);
}

export async function queryIP(apiKey: string, ip: string): Promise<CTIObject | null> {
  const response = await fetchWithRetry(`${BASE_URL}/smoke/${encodeURIComponent(ip)}`, apiKey);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new CTIError(
      `CTI API error for ${ip}: ${response.status} ${body}`,
      response.status
    );
  }

  return (await response.json()) as CTIObject;
}

export async function queryBatch(apiKey: string, ips: string[]): Promise<BatchResponse> {
  const ipsParam = ips.map((ip) => encodeURIComponent(ip)).join(',');
  const response = await fetchWithRetry(`${BASE_URL}/smoke?ips=${ipsParam}`, apiKey);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new CTIError(
      `CTI API batch error: ${response.status} ${body}`,
      response.status
    );
  }

  return (await response.json()) as BatchResponse;
}
