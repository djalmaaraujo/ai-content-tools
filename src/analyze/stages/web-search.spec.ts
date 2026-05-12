import { isWebSearchEnabled } from './web-search';

describe('isWebSearchEnabled', () => {
  it('defaults to true when env is unset', () => {
    expect(isWebSearchEnabled({})).toBe(true);
  });

  it('returns true when ENABLE_WEB_SEARCH=true', () => {
    expect(isWebSearchEnabled({ ENABLE_WEB_SEARCH: 'true' })).toBe(true);
  });

  it('returns false when ENABLE_WEB_SEARCH=false', () => {
    expect(isWebSearchEnabled({ ENABLE_WEB_SEARCH: 'false' })).toBe(false);
  });

  it('treats 0 / off / no as disabled', () => {
    expect(isWebSearchEnabled({ ENABLE_WEB_SEARCH: '0' })).toBe(false);
    expect(isWebSearchEnabled({ ENABLE_WEB_SEARCH: 'off' })).toBe(false);
    expect(isWebSearchEnabled({ ENABLE_WEB_SEARCH: 'no' })).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isWebSearchEnabled({ ENABLE_WEB_SEARCH: 'FALSE' })).toBe(false);
    expect(isWebSearchEnabled({ ENABLE_WEB_SEARCH: 'False' })).toBe(false);
  });
});
