import { useState, useRef } from 'react';

export interface DuplicateInfo {
  ip: string;
  count: number;
}

interface IpInputFormProps {
  onSubmit: (ips: string[], duplicates: DuplicateInfo[]) => void;
  onBack: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Binary file magic bytes signatures
const BINARY_SIGNATURES = [
  [0x89, 0x50, 0x4e, 0x47], // PNG
  [0xff, 0xd8, 0xff], // JPEG
  [0x47, 0x49, 0x46, 0x38], // GIF
  [0x25, 0x50, 0x44, 0x46], // PDF
  [0x50, 0x4b, 0x03, 0x04], // ZIP
  [0x52, 0x61, 0x72, 0x21], // RAR
  [0x7f, 0x45, 0x4c, 0x46], // ELF
  [0x4d, 0x5a], // EXE/DLL
];

function isBinaryContent(bytes: Uint8Array): boolean {
  // Check for known binary signatures
  for (const sig of BINARY_SIGNATURES) {
    if (sig.every((byte, i) => bytes[i] === byte)) {
      return true;
    }
  }
  // Check for null bytes in the first 1024 bytes (indicates binary)
  const checkLength = Math.min(bytes.length, 1024);
  for (let i = 0; i < checkLength; i++) {
    if (bytes[i] === 0) {
      return true;
    }
  }
  return false;
}

// Simple IP address pattern (IPv4 or IPv6)
const IP_PATTERN = /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[a-fA-F0-9:]+:+)+[a-fA-F0-9]+)$/;

function validateIpListFormat(content: string): { valid: boolean; invalidLines: string[] } {
  const lines = content.split('\n');
  const invalidLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines
    if (trimmed.length === 0) {
      continue;
    }
    // Check if line looks like an IP
    if (!IP_PATTERN.test(trimmed)) {
      invalidLines.push(trimmed.length > 30 ? trimmed.substring(0, 30) + '...' : trimmed);
      // Stop after finding 3 invalid lines
      if (invalidLines.length >= 3) {
        break;
      }
    }
  }

  return { valid: invalidLines.length === 0, invalidLines };
}

export function IpInputForm({ onSubmit, onBack }: IpInputFormProps) {
  const [ipText, setIpText] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearErrors = () => {
    setFileError(null);
    setInputError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allIps = ipText
      .split('\n')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);

    if (allIps.length === 0) {
      return;
    }

    // Validate IP format
    const { valid, invalidLines } = validateIpListFormat(ipText);
    if (!valid) {
      const preview = invalidLines.slice(0, 3).join(', ');
      setInputError(`Invalid format. Expected one IP per line. Invalid: ${preview}`);
      return;
    }

    // Count occurrences of each IP
    const ipCounts = new Map<string, number>();
    for (const ip of allIps) {
      ipCounts.set(ip, (ipCounts.get(ip) ?? 0) + 1);
    }

    // Get unique IPs and find duplicates
    const uniqueIps = Array.from(ipCounts.keys());
    const duplicates: DuplicateInfo[] = [];
    for (const [ip, count] of ipCounts) {
      if (count > 1) {
        duplicates.push({ ip, count });
      }
    }

    onSubmit(uniqueIps, duplicates);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearErrors();
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Check file size first
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size must be less than 2MB');
      clearFileInput();
      return;
    }

    // Read file as ArrayBuffer to check content type
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);

      // Check if content is binary
      if (isBinaryContent(bytes)) {
        setFileError('File appears to be binary, not a text file');
        clearFileInput();
        return;
      }

      // Decode as text
      const decoder = new TextDecoder('utf-8');
      const content = decoder.decode(bytes);

      // Validate content format (one IP per line)
      const { valid, invalidLines } = validateIpListFormat(content);
      if (!valid) {
        const preview = invalidLines.slice(0, 3).join(', ');
        setFileError(`Invalid format. Expected one IP per line. Invalid: ${preview}`);
        clearFileInput();
        return;
      }

      setIpText(content);
    };
    reader.onerror = () => {
      setFileError('Failed to read file');
      clearFileInput();
    };
    reader.readAsArrayBuffer(file);
  };

  const ipCount = ipText
    .split('\n')
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0).length;

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Enter IP Addresses
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Enter one IP address per line or upload a text file. These will be queried against the
          CrowdSec CTI database.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="label mb-2 block">Upload file (optional)</label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900/30 dark:file:text-blue-400
                dark:hover:file:bg-blue-900/50
                cursor-pointer"
            />
          </div>
          {fileError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fileError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Text file only, max 2MB
          </p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="ips" className="label">
              IP Addresses
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {ipCount} IP{ipCount !== 1 ? 's' : ''}
            </span>
          </div>
          <textarea
            id="ips"
            className="textarea h-64"
            placeholder="1.2.3.4&#10;5.6.7.8&#10;..."
            value={ipText}
            onChange={(e) => {
              setIpText(e.target.value);
              clearErrors();
            }}
          />
          {inputError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{inputError}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={ipCount === 0}
          >
            Query IPs
          </button>
        </div>
      </form>
    </div>
  );
}
