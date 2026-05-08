import { extractJsonLd } from './jsonld.parser';

describe('extractJsonLd', () => {
  it('extracts arrays and graph nodes while preserving parse errors', () => {
    const result = extractJsonLd(`
      <script type="application/ld+json">
        {"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"Acme"},{"@type":"WebSite","name":"Acme"}]}
      </script>
      <script type="application/ld+json">not json</script>
      <script type="application/ld+json">[{"@type":"Article"}]</script>
    `);

    expect(result.blocks).toHaveLength(3);
    expect(result.types.sort()).toEqual(['Article', 'Organization', 'WebSite']);
    expect(result.errors).toHaveLength(1);
  });
});

