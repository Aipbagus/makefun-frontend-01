// The accounts index: the top accounts by wins or by prize money, lazy-loaded.

import { getTopAccounts, assetUrl } from './api.js';
import { esc, img, money } from './format.js';

/** One account row. */
function row(a) {
  const r = a.record ?? {};
  return `
    <tr>
      <td class="rank">${a.rank}</td>
      <td class="who">${img(a.image && assetUrl(a.image), '', 'avatar')}
        <a href="#/account/${encodeURIComponent(a.handle)}">${esc(a.handle)}</a></td>
      <td class="num">${r.competitions_won ?? 0}</td>
      <td class="num">${r.podium_finishes ?? 0}</td>
      <td class="num">${r.competitions_entered ?? 0}</td>
      <td class="num">${money(r.prize_usd)}</td>
    </tr>`;
}

export async function render() {
  const wins = await getTopAccounts('wins').catch(() => null);
  const prize = await getTopAccounts('prize').catch(() => null);
  const rows = (wins?.items ?? []).map(row).join('');
  const total = money(prize?.total ?? 0);
  return `
    <nav class="crumbs"><a href="#/">All bounties</a></nav>
    <h1>Top accounts</h1>
    <p class="note">Ranked by bounties won · ${total} paid out across the site so far</p>
    <div class="lb-wrap"><table class="lb">
      <thead><tr><th>#</th><th>Account</th><th class="num">Wins</th><th class="num">Podiums</th><th class="num">Entered</th><th class="num">Prizes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

export function mount() {}
