import { parseSitemap } from './sitemap.parser';

describe('parseSitemap', () => {
  it('counts urls in urlset sitemaps', () => {
    expect(
      parseSitemap(
        '<urlset><url><loc>https://example.com/a</loc></url><url><loc>https://example.com/b</loc></url></urlset>',
      ),
    ).toEqual({ valid: true, urlCount: 2, sitemapIndexCount: 0, errors: [] });
  });

  it('counts sitemap indexes', () => {
    expect(
      parseSitemap(
        '<sitemapindex><sitemap><loc>https://example.com/sitemap-a.xml</loc></sitemap></sitemapindex>',
      ),
    ).toEqual({ valid: true, urlCount: 0, sitemapIndexCount: 1, errors: [] });
  });

  it('returns an error for invalid XML', () => {
    const result = parseSitemap('<urlset><url></urlset>');

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

