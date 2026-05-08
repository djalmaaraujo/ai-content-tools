# API Contract Spec

## `POST /analyze`

Starts an asynchronous analysis.

### Request

```json
{
  "url": "https://example.com/blog/post"
}
```

### Validation

- `url` is required.
- `url` must be a string.
- Missing protocol may be normalized to `https://`.
- Only `http` and `https` should be accepted.
- The host must be a domain name, not an IP literal.
- Localhost, single-label hosts, IPv4 literals, IPv6 literals, and numeric hostnames should be rejected.
- The domain must resolve through DNS before fetching.
- Resolved addresses and redirect destinations must not point to private, loopback, link-local, multicast, reserved, or otherwise internal ranges.
- The exact submitted page URL should be analyzed. Root-level files such as `robots.txt`, `sitemap.xml`, `llms.txt`, and `llms-full.txt` should be fetched from the URL origin.

### Response

Recommended status: `202 Accepted`.

```json
{
  "analysisId": "abc123"
}
```

## `GET /analyze/:id`

Returns the current analysis record.

### `queued`

```json
{
  "id": "abc123",
  "url": "https://example.com/",
  "status": "queued",
  "progress": 0,
  "createdAt": "2026-05-07T12:00:00.000Z",
  "updatedAt": "2026-05-07T12:00:00.000Z"
}
```

### `analyzing`

```json
{
  "id": "abc123",
  "url": "https://example.com/",
  "status": "analyzing",
  "progress": 30,
  "createdAt": "2026-05-07T12:00:00.000Z",
  "updatedAt": "2026-05-07T12:00:12.000Z"
}
```

### `done`

```json
{
  "id": "abc123",
  "url": "https://example.com/",
  "status": "done",
  "progress": 100,
  "result": {
    "url": "https://example.com/",
    "analyzed_at": "2026-05-07T12:01:00.000Z",
    "executive_summary": "...",
    "final_score": 74,
    "classification": "good",
    "category_scores": {},
    "headline_findings": {},
    "recommendations": {}
  },
  "createdAt": "2026-05-07T12:00:00.000Z",
  "updatedAt": "2026-05-07T12:01:00.000Z"
}
```

### `error`

```json
{
  "id": "abc123",
  "url": "https://example.com/",
  "status": "error",
  "progress": 30,
  "error": {
    "message": "Specialist returned no JSON",
    "stage": "technical_specialist",
    "retryable": true
  },
  "createdAt": "2026-05-07T12:00:00.000Z",
  "updatedAt": "2026-05-07T12:00:40.000Z"
}
```

## Status Values

- `queued`: record created, pipeline event emitted.
- `fetching`: deterministic fetch and parse stage running.
- `analyzing`: specialist LLM stage running.
- `synthesizing`: final report stage running.
- `done`: final report available.
- `error`: pipeline failed.

## Error Responses

- `400 Bad Request`: invalid URL or blocked target.
- `404 Not Found`: unknown analysis id.
- `429 Too Many Requests`: rate limiting if enabled.
- `500 Internal Server Error`: unexpected controller-level failure.

## Open API Decisions

- Whether job records should include intermediate deterministic evidence for debugging outside development environments.
- Whether final responses should expose provider web-search citations.
