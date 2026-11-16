// make.fun's public API: read-only GET requests, open to any origin.
// Documented at https://make.fun/api/openapi.json. Answers carry weak ETags that
// revalidate within their minute (304) and turn over when the minute does, so the
// cache below revalidates with If-None-Match instead of re-downloading.

const API = 'https://make.fun/api';

/** path -> { etag, data, at } for revalidation; also the in-memory answer of the minute. */
const cache = new Map();

/** In-flight requests, so several views asking for one path share one request. */
const pending = new Map();

/**
 * GET an API path, revalidating with If-None-Match when a cached ETag exists.
 * A 304 serves the cached body without downloading it again.
 */
async function get(path) {
  const hit = cache.get(path);
  const init = hit?.etag ? { headers: { 'If-None-Match': hit.etag } } : undefined;
  const res = await fetch(API + path, init);
  if (res.status === 304 && hit) {
    hit.at = Date.now();
    return hit.data;
  }
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  const data = await res.json();
  const etag = res.headers.get('etag');
  if (etag) cache.set(path, { etag, data, at: Date.now() });
  return data;
}

/** Like get(), but reuses an in-flight request for the same path. */
function getShared(path) {
  let p = pending.get(path);
  if (!p) {
    p = get(path).finally(() => pending.delete(path));
    pending.set(path, p);
  }
  return p;
}

/** A cached answer, then a background revalidation that calls onUpdate with the fresh data. */
export async function revalidate(path, onUpdate) {
  const hit = cache.get(path);
  if (hit) {
    onUpdate?.(hit.data);
    getShared(path).then((d) => onUpdate?.(d)).catch(() => {});
    return hit.data;
  }
  return getShared(path);
}

/** One bounty, by its slug. */
export const getBounty = (slug) => getShared(`/competitions/${encodeURIComponent(slug)}`);

/** The board of open bounties (activity=times trims rows the board does not show). */
export const getBoard = () => getShared('/competitions?status=open&activity=times');

/** A bounty's leaderboard, one view. */
export const getLeaderboard = (slug, view) =>
  getShared(`/competitions/${encodeURIComponent(slug)}/leaderboard?view=${view ?? 'performance'}`);

/** An account's public profile. */
export const getProfile = (handle) => getShared(`/profiles/${encodeURIComponent(handle)}`);

/** The top accounts, by wins or by prize money. */
export const getTopAccounts = (by) => getShared(`/rankings?by=${by ?? 'wins'}&limit=25`);

/** An absolute URL for an image path an API answer names. */
export const assetUrl = (path) => (path && path.startsWith('/') ? `https://make.fun${path}` : path);
