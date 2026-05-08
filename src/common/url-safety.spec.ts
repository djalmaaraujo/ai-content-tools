import {
  isInternalIp,
  normalizeAnalyzeUrl,
  validateDomainHostname,
} from './url-safety';

describe('url safety', () => {
  it('normalizes an exact page URL and keeps the path', () => {
    expect(normalizeAnalyzeUrl('example.com/blog/post?x=1')).toEqual({
      targetUrl: 'https://example.com/blog/post?x=1',
      origin: 'https://example.com',
      hostname: 'example.com',
    });
  });

  it('rejects IP literals and local hosts', () => {
    expect(() => normalizeAnalyzeUrl('http://127.0.0.1')).toThrow('domain');
    expect(() => normalizeAnalyzeUrl('http://192.168.0.10')).toThrow('domain');
    expect(() => normalizeAnalyzeUrl('http://[::1]')).toThrow('domain');
    expect(() => normalizeAnalyzeUrl('http://localhost')).toThrow('domain');
    expect(() => normalizeAnalyzeUrl('http://intranet')).toThrow('domain');
  });

  it('rejects unsupported protocols and credentials', () => {
    expect(() => normalizeAnalyzeUrl('ftp://example.com')).toThrow('protocol');
    expect(() => normalizeAnalyzeUrl('https://user:pass@example.com')).toThrow(
      'credentials',
    );
  });

  it('validates public-looking domain hostnames', () => {
    expect(validateDomainHostname('www.example.co.uk')).toBe('www.example.co.uk');
    expect(() => validateDomainHostname('12345')).toThrow('domain');
  });

  it('detects internal IP ranges', () => {
    expect(isInternalIp('10.0.0.1')).toBe(true);
    expect(isInternalIp('172.16.4.1')).toBe(true);
    expect(isInternalIp('192.168.1.1')).toBe(true);
    expect(isInternalIp('127.0.0.1')).toBe(true);
    expect(isInternalIp('169.254.10.1')).toBe(true);
    expect(isInternalIp('8.8.8.8')).toBe(false);
  });
});

