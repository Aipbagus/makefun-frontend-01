// A bounty's leaderboard, lazy-loaded. Big boards answer thousands of rows at
// once (the API has no row paging), so this renders a window of rows and grows
// it as the table scrolls, instead of building the whole DOM at one go.

import { getLeaderboard, getBounty, assetUrl } from './api.js';
import { esc, img, pct } from './format.js';

/** Rows shown initially, then +STEP per expansion. */
const WINDOW = 60;
const STEP = 300;

/** The leaderboard's state between render and mount. */
let state = null;

/** Bytes as '661 KB'. */
function fmtBytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return v >= 1048576 ? `${(v / 1048576).toFixed(1)} MB` : `${Math.round(v / 1024)} KB`;
}

/** A column's raw value shown as its own kind of number: percent shares, bytes, otherwise as-is. */
function cell(e, c) {
  const raw = e.values?.[c.key];
  const n = Number(raw);
  if (c.key === 'bytes' || /size|bytes/i.test(c.title)) return fmtBytes(raw);
  if (c.source?.includes('micro') && c.key !== 'valid') return pct(raw);
  if (!Number.isFinite(n)) return '—';
  const digits = Number.isInteger(n) ? 0 : 2;
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

/** The metric cells of one row, from the leaderboard's own column list. */
function valueCells(e, cols) {
  return cols.map((c) => `<td class="num">${esc(cell(e, c))}</td>`).join('');
}

/** One leaderboard row. */
function row(e) {
  return `
    <tr>
      <td class="rank">${e.rank ?? ''}</td>
      <td class="who">${img(e.image && assetUrl(e.image), '', 'avatar')}${esc(e.handle)}${e.house ? ' <span class="chip house">house</span>' : ''}</td>
      <td class="title-cell">${esc(e.title ?? '')}</td>
      ${valueCells(e, state.cols)}
    </tr>`;
}

/** Rows [from, from+n) of the entries. */
function rows(from, n) {
  return state.entries.slice(from, from + n).map(row).join('');
}

export async function render(slug) {
  const [lb, comp] = await Promise.all([
    getLeaderboard(slug).catch(() => null),
    getBounty(slug).catch(() => null),
  ]);
  const title = comp?.title ?? slug;
  const cols = (lb?.columns ?? []).filter((c) => !c.hidden && c.key !== 'judge_low' && c.key !== 'judge_high');
  const entries = lb?.entries ?? [];
  state = { entries, cols, shown: Math.min(WINDOW, entries.length), slug };

  const head = `
    <nav class="crumbs"><a href="#/">All bounties</a> · <a href="#/bounty/${encodeURIComponent(slug)}">${esc(title)}</a></nav>
    <h1>Leaderboard — ${esc(title)}</h1>
    <p class="note">${entries.length.toLocaleString('en-US')} entries · ${esc(lb?.title ?? 'Results')}</p>`;
  if (!entries.length) return `${head}<p class="note">No entries yet.</p>`;

  return `${head}
    <div class="lb-wrap"><table class="lb">
      <thead><tr><th>#</th><th>Entrant</th><th>Entry</th>${cols.map((c) => `<th class="num">${esc(c.title)}</th>`).join('')}</tr></thead>
      <tbody>${rows(0, state.shown)}</tbody>
    </table></div>
    <p class="note" id="lb-more">Showing ${state.shown.toLocaleString('en-US')} of ${entries.length.toLocaleString('en-US')} — scroll for more</p>`;
}

/** Append more rows when the reader nears the bottom; cheap, no full rebuild. */
export function mount(root) {
  if (!state || state.shown >= state.entries.length) return;
  const sentinel = root.querySelector('#lb-more');
  if (!sentinel) return;
  const io = new IntersectionObserver((seen) => {
    if (!seen[0].isIntersecting) return;
    const more = rows(state.shown, STEP);
    state.shown = Math.min(state.shown + STEP, state.entries.length);
    sentinel.before(Object.assign(document.createElement('template'), { innerHTML: `<tbody>${more}</tbody>` }).content);
    sentinel.textContent = `Showing ${state.shown.toLocaleString('en-US')} of ${state.entries.length.toLocaleString('en-US')}`;
    if (state.shown >= state.entries.length) io.disconnect();
  }, { rootMargin: '600px' });
  io.observe(sentinel);
}
