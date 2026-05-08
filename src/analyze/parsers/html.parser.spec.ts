import { parseHtml } from './html.parser';

describe('parseHtml', () => {
  it('extracts metadata, visible text, headings, and semantic signals', () => {
    const result = parseHtml(
      `<!doctype html>
      <html lang="en">
        <head>
          <title>Acme AI | Better Search</title>
          <meta name="description" content="A useful AI search product.">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta property="og:title" content="Acme AI">
          <meta property="og:description" content="Better search">
          <meta property="og:image" content="https://example.com/og.png">
          <meta name="twitter:card" content="summary_large_image">
          <link rel="canonical" href="https://example.com/page">
        </head>
        <body>
          <nav>Menu</nav>
          <main>
            <article>
              <h1>Acme AI</h1>
              <h2>What it does</h2>
              <p>Acme AI helps teams analyze search visibility.</p>
              <script>window.secret = true</script>
            </article>
          </main>
        </body>
      </html>`,
      { 'x-robots-tag': 'noindex' },
      'https://example.com/page',
    );

    expect(result.meta.title).toBe('Acme AI | Better Search');
    expect(result.meta.description).toBe('A useful AI search product.');
    expect(result.meta.ogComplete).toBe(true);
    expect(result.meta.twitterCard).toBe(true);
    expect(result.meta.htmlLang).toBe('en');
    expect(result.meta.h1Count).toBe(1);
    expect(result.semantic.usesArticle).toBe(true);
    expect(result.semantic.headingHierarchyOk).toBe(true);
    expect(result.visibleText).toContain('Acme AI helps teams');
    expect(result.visibleText).not.toContain('window.secret');
  });

  it('flags heading hierarchy jumps', () => {
    const result = parseHtml(
      '<html><body><h1>Title</h1><h3>Skipped level</h3></body></html>',
      {},
      'https://example.com',
    );

    expect(result.semantic.headingHierarchyOk).toBe(false);
  });
});

