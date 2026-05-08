import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { domainToASCII } from 'node:url';

export interface NormalizedAnalyzeUrl {
  targetUrl: string;
  origin: string;
  hostname: string;
}

const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeAnalyzeUrl(input: string): NormalizedAnalyzeUrl {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('URL is required');
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const parsed = parseUrl(candidate);

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL protocol must be http or https');
  }

  if (parsed.username || parsed.password) {
    throw new Error('URL credentials are not allowed');
  }

  const hostname = validateDomainHostname(parsed.hostname);
  parsed.hostname = hostname;
  parsed.hash = '';

  return {
    targetUrl: parsed.toString(),
    origin: parsed.origin,
    hostname,
  };
}

export function validateDomainHostname(hostname: string): string {
  const ascii = domainToASCII(hostname.trim().toLowerCase());
  if (!ascii) {
    throw new Error('URL host must be a domain name');
  }

  if (isIP(ascii) !== 0) {
    throw new Error('URL host must be a domain name, not an IP address');
  }

  if (ascii === 'localhost' || !ascii.includes('.')) {
    throw new Error('URL host must be a public domain name');
  }

  if (/^[0-9.]+$/.test(ascii)) {
    throw new Error('URL host must be a domain name, not a numeric host');
  }

  const labels = ascii.split('.');
  if (labels.some((label) => !DOMAIN_LABEL_PATTERN.test(label))) {
    throw new Error('URL host must be a valid domain name');
  }

  const tld = labels.at(-1);
  if (!tld || /^[0-9]+$/.test(tld)) {
    throw new Error('URL host must end with a valid public suffix');
  }

  return ascii;
}

export async function assertPublicDnsResolution(hostname: string): Promise<void> {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0) {
    throw new Error(`Domain did not resolve: ${hostname}`);
  }

  const internal = addresses.find((entry) => isInternalIp(entry.address));
  if (internal) {
    throw new Error(`Domain resolves to an internal address: ${hostname}`);
  }
}

export function assertSafeRedirectUrl(url: string): NormalizedAnalyzeUrl {
  return normalizeAnalyzeUrl(url);
}

export function isInternalIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return isInternalIpv4(ip);
  }
  if (version === 6) {
    return isInternalIpv6(ip);
  }
  return true;
}

function parseUrl(input: string): URL {
  try {
    return new URL(input);
  } catch {
    throw new Error('URL is invalid');
  }
}

function isInternalIpv4(ip: string): boolean {
  const octets = ip.split('.').map((part) => Number(part));
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return true;
  }

  const [a, b] = octets;
  if (a === undefined || b === undefined) {
    return true;
  }

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isInternalIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80') ||
    normalized.startsWith('ff')
  );
}
