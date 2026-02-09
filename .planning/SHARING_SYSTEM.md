# Compressed Sharing System Documentation

**Last Updated:** 2026-02-08
**Status:** ✅ Fully Implemented

## Overview

The Compressed Sharing System provides efficient URL-based sharing with data compression, allowing users to share notes via compact, URL-safe links without server-side storage requirements.

## Features

- **Data Compression** - Uses browser CompressionStream API
- **URL-Safe Encoding** - Base64url encoding for social sharing
- **Payload Validation** - Integrity checking with hash verification
- **No Server Storage** - All data encoded in URL itself
- **Friendly URLs** - `slug~count~hash` format

## Architecture

### URL Format
```
https://r.alexdonega.com.br/plan/{slug}~{count}~{hash}
```

**Components:**
- `slug` - Document slug (URL-safe)
- `count` - Number of annotations (integer)
- `hash` - Compressed and encoded annotation data (base64url)

### Data Flow
```
Annotations → JSON String → Compression → Base64url → URL
URL → Base64url Decode → Decompression → JSON → Annotations
```

## Core Functions

### compressSharedData()
Compresses annotation data for URL sharing.

**Location:** `packages/ui/utils/sharing.ts`

```typescript
async function compressSharedData(
  annotations: Annotation[],
  documentTitle: string
): Promise<string>
```

**Process:**
1. Convert annotations to JSON string
2. Compress using CompressionStream (gzip)
3. Convert to base64url (URL-safe)
4. Return compressed hash

**Returns:** Base64url-encoded compressed data

### decompressSharedData()
Decompresses annotation data from URL hash.

```typescript
async function decompressSharedData(
  hash: string
): Promise<{ annotations: Annotation[]; title: string } | null>
```

**Process:**
1. Decode base64url to binary
2. Decompress using DecompressionStream (gzip)
3. Parse JSON to object
4. Return annotations and title

**Returns:** Object with annotations and title, or null if invalid

### validateSharedPayload()
Validates the integrity of shared payload.

```typescript
function validateSharedPayload(
  slug: string,
  count: string,
  hash: string
): boolean
```

**Validates:**
- Slug format (alphanumeric + hyphens)
- Count is valid number
- Hash is valid base64url
- Count matches actual annotation count

**Returns:** true if valid, false otherwise

## Data Structures

### SharedUrlFormat
```typescript
interface SharedUrlFormat {
  slug: string;      // Document slug
  count: string;     // Annotation count as string
  hash: string;      // Compressed annotation data
}
```

### SharedPayload
```typescript
interface SharedPayload {
  annotations: Annotation[];
  title: string;
  createdAt: number;
}
```

## Usage

### Creating a Shared Link

```typescript
import { compressSharedData } from '@obsidian-note-reviewer/ui/utils/sharing';

// In ShareButton component
async function handleShare() {
  const compressed = await compressSharedData(annotations, documentTitle);
  const url = `${baseUrl}/${slug}~${annotations.length}~${compressed}`;

  // Copy to clipboard
  await navigator.clipboard.writeText(url);

  // Show success message
  showNotification('Link copied to clipboard!');
}
```

### Loading from Shared Link

```typescript
import { decompressSharedData, validateSharedPayload } from '@obsidian-note-reviewer/ui/utils/sharing';

// In SharedDocument component
async function loadFromUrl() {
  const [, slug, count, hash] = window.location.pathname.split('/');

  // Validate payload
  if (!validateSharedPayload(slug, count, hash)) {
    showError('Invalid shared link');
    return;
  }

  // Decompress data
  const payload = await decompressSharedData(hash);
  if (!payload) {
    showError('Failed to load shared document');
    return;
  }

  // Load annotations
  setAnnotations(payload.annotations);
  setTitle(payload.title);
}
```

## URL Parsing

### Extracting Components from URL

```typescript
function parseSharedUrl(url: string): SharedUrlFormat | null {
  const match = url.match(/\/plan\/([^~]+)~(\d+)~([a-zA-Z0-9_-]+)$/);

  if (!match) return null;

  return {
    slug: match[1],
    count: match[2],
    hash: match[3]
  };
}

// Usage
const parts = parseSharedUrl(window.location.href);
if (parts) {
  console.log('Slug:', parts.slug);
  console.log('Count:', parts.count);
  console.log('Hash:', parts.hash);
}
```

### Building URL from Components

```typescript
function buildSharedUrl(
  slug: string,
  count: number,
  hash: string
): string {
  return `${baseUrl}/plan/${slug}~${count}~${hash}`;
}
```

## Compression Details

### Compression Algorithm
- **Method:** GZIP compression
- **API:** CompressionStream / DecompressionStream (browser native)
- **Ratio:** Typically 60-80% size reduction

### Encoding
- **Method:** Base64url (URL-safe base64)
- **Characters:** A-Z, a-z, 0-9, -, _ (no + or /)
- **Padding:** Removed (= and == stripped)

### Size Limits
- **Practical Limit:** ~2000 annotations
- **URL Length:** Browsers support up to 2000+ characters
- **Fallback:** For large datasets, consider server-side storage

## Performance Considerations

### Compression Time
- Small datasets (< 50 annotations): < 10ms
- Medium datasets (50-200 annotations): 10-50ms
- Large datasets (200+ annotations): 50-200ms

### Decompression Time
- Similar to compression
- Generally faster than compression
- Cached by browser after first load

### Optimization Tips
1. **Defer compression** - Use requestIdleCallback for large datasets
2. **Cache results** - Store compressed data in memory
3. **Progressive loading** - Show loading indicator during compression
4. **Size warning** - Warn user if dataset too large for URL sharing

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid URL format | URL doesn't match pattern | Show error, redirect home |
| Decompression failed | Corrupted data | Show error, suggest re-share |
| JSON parse error | Invalid data structure | Show error, suggest re-share |
| Validation failed | Count mismatch | Show error, suggest re-share |

### Error Handling Example

```typescript
async function safeLoadFromUrl() {
  try {
    const parts = parseSharedUrl(window.location.href);
    if (!parts) throw new Error('Invalid URL format');

    if (!validateSharedPayload(parts.slug, parts.count, parts.hash)) {
      throw new Error('Invalid payload');
    }

    const payload = await decompressSharedData(parts.hash);
    if (!payload) throw new Error('Failed to decompress');

    return payload;
  } catch (error) {
    console.error('Shared URL error:', error);
    showError('This shared link is invalid or expired.');
    return null;
  }
}
```

## Browser Compatibility

### Required APIs
- **CompressionStream** - Chrome 80+, Edge 80+, Firefox 113+
- **DecompressionStream** - Chrome 80+, Edge 80+, Firefox 113+
- **TextEncoder/TextDecoder** - All modern browsers

### Polyfills
For older browsers, consider using:
- pako (zlib compression library)
- base64url polyfill

### Feature Detection

```typescript
function supportsCompression(): boolean {
  return 'CompressionStream' in window && 'DecompressionStream' in window;
}

if (!supportsCompression()) {
  // Fallback to server-side sharing or show upgrade message
  showUpgradeMessage();
}
```

## Security Considerations

1. **Data Size** - Large payloads may hit URL length limits
2. **Malicious Data** - Validate decompressed data structure
3. **XSS Prevention** - Sanitize annotation content before rendering
4. **URL Injection** - Validate URL format before processing

## Best Practices

1. **Validate input** - Check data structure before compression
2. **Handle errors** - Graceful failure with user feedback
3. **Show progress** - Loading indicator during compression/decompression
4. **Size limits** - Warn user if dataset too large
5. **Test compatibility** - Verify across browsers
6. **URL testing** - Test shared links before distributing

## Related Files

- `packages/ui/utils/sharing.ts` - Core sharing functions
- `packages/ui/components/ShareButton.tsx` - Share UI component
- `apps/portal/src/pages/SharedDocument.tsx` - Shared document page
- `packages/ui/components/SharedWorkspace.tsx` - Shared document workspace

## Troubleshooting

**URL too long?**
- Reduce annotation count
- Remove unnecessary data from annotations
- Consider server-side sharing alternative

**Decompression fails?**
- Check browser compatibility
- Verify URL encoding (base64url)
- Test with smaller dataset

**Validation fails?**
- Check count matches actual annotations
- Verify slug format
- Ensure hash is valid base64url

**Characters not working?**
- Ensure URL is properly encoded
- Use base64url (not base64)
- Remove padding characters (=)

---

*For more information on compression APIs, see MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream*
