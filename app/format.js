// Small helpers for showing API values.

/** Text made safe to put inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A dollar amount ('1000.00' or 0.5) as '$1,000' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });
}

/** A deadline as a date in UTC. */
export function date(iso) {
  return `${new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`;
}

/** The time until a deadline: '2d 4h left', '35m left', or 'ended'. */
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

/** A live pot: the reward plus any entry fees paid in. */
export const pot = (b) => money(b.potUsd ?? b.rewardAmount);

/** The entry fee chip, when the bounty charges one. */
export const fee = (b) => (b.entryFeeUsd ? money(b.entryFeeUsd) : null);

/** A win-rate share in millionths (962052 = 96.2%) as a percent, or '—'. */
export function pct(micro) {
  const n = Number(micro);
  return Number.isFinite(n) ? `${(n / 10000).toFixed(2)}%` : '—';
}

/** An avatar or entry image tag; make.fun's images need crossorigin="anonymous" before src. */
export function img(src, alt, cls = '') {
  if (!src) return '';
  return `<img class="${cls}" crossorigin="anonymous" src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`;
}
