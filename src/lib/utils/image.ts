/**
 * Build a srcset string for R2-hosted images using Cloudflare Image Resizing.
 * Requires: Cloudflare proxy in front of the R2 public bucket AND
 * Image Resizing enabled on the zone (Workers & Pages → Image Resizing).
 *
 * If the URL is not an R2/CDN URL (e.g. external image), returns null so the
 * caller can fall back to the plain src attribute.
 *
 * Usage:
 *   srcset={buildSrcset(article.coverImage)}
 *   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
 */
export function buildSrcset(url: string | null | undefined, widths = [400, 800, 1200, 1600]): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Only transform images hosted on our own CDN domains
    const isCdn = u.hostname.endsWith('.r2.dev') || u.hostname.endsWith('ohmynic.co');
    if (!isCdn) return null;
    return widths
      .map(w => {
        const resized = new URL(url);
        resized.searchParams.set('width', String(w));
        resized.searchParams.set('format', 'auto'); // CF serves AVIF→WebP→JPEG by Accept header
        return `${resized.href} ${w}w`;
      })
      .join(', ');
  } catch {
    return null;
  }
}
