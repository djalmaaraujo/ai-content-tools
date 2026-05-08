import { AnalysisStore } from './analysis.store';

describe('AnalysisStore', () => {
  it('creates and updates records', () => {
    const store = new AnalysisStore();

    store.create('abc', {
      url: 'https://example.com',
      status: 'queued',
      progress: 0,
      botRegistryVersion: '2026-05-07',
    });
    store.update('abc', { status: 'fetching', progress: 10 });

    expect(store.get('abc')).toMatchObject({
      id: 'abc',
      url: 'https://example.com',
      status: 'fetching',
      progress: 10,
      botRegistryVersion: '2026-05-07',
    });

    store.dispose();
  });
});
