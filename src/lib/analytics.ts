/**
 * OhMyNic! — Client-side analytics
 * Fire-and-forget, privacy-first, rispetta DNT.
 */

const SESSION_KEY = 'ohmynic-sid';
const OPTOUT_KEY  = 'ohmynic-analytics-optout';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function isDNT(): boolean {
  return navigator.doNotTrack === '1';
}

function isOptedOut(): boolean {
  try { return localStorage.getItem(OPTOUT_KEY) === '1'; } catch { return false; }
}

function isTrackedPath(path: string): boolean {
  if (path.startsWith('/blog/admin')) return false;
  if (['/blog/login', '/blog/register', '/blog/account'].includes(path)) return false;
  return true;
}

// ── Pageview ──────────────────────────────────────────────────────────────────

export function trackPageview(path: string, articleId?: string | null) {
  if (typeof window === 'undefined') return;
  if (isDNT() || isOptedOut()) return;
  if (!isTrackedPath(path)) return;

  const sessionId = getSessionId();
  const referrer = document.referrer || null;

  fetch('/blog/api/analytics/pageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, articleId: articleId ?? null, referrer, sessionId }),
    keepalive: true,
  }).catch(() => {/* fire and forget */});
}

// ── Read completion ───────────────────────────────────────────────────────────

export function initCompletionTracking(
  articleId: string,
  proseEl: HTMLElement,
): () => void {
  if (typeof window === 'undefined') return () => {};
  if (isDNT() || isOptedOut()) return () => {};

  const sessionId = getSessionId();
  const reached = new Set<number>();
  const THRESHOLDS = [25, 50, 75, 100];

  function sendCompletion(percentage: number) {
    fetch('/blog/api/analytics/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, sessionId, percentage }),
      keepalive: true,
    }).catch(() => {});
  }

  function onScroll() {
    const rect = proseEl.getBoundingClientRect();
    const articleTop    = proseEl.offsetTop;
    const articleHeight = proseEl.offsetHeight;
    if (articleHeight === 0) return;

    const scrolled  = window.scrollY + window.innerHeight - articleTop;
    const progress  = Math.min(100, Math.max(0, (scrolled / articleHeight) * 100));

    for (const t of THRESHOLDS) {
      if (progress >= t && !reached.has(t)) {
        reached.add(t);
        sendCompletion(t);
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // check immediately in case article is short
  return () => window.removeEventListener('scroll', onScroll);
}
