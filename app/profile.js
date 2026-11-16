// An account's public profile: links, record and every entry, lazy-loaded.

import { getProfile, assetUrl } from './api.js';
import { esc, img, money } from './format.js';

/** One entry of the account. */
function solution(s) {
  const c = s.competition ?? {};
  const score = s.score ? `${esc(s.score.column?.title ?? '')}: ${esc(s.score.display ?? '')}` : '';
  return `
    <li class="card">
      <a class="card-main" href="#/leaderboard/${encodeURIComponent(c.slug)}">
        <div class="card-top">
          <h3>${esc(s.title ?? '')}</h3>
          ${s.placement ? `<span class="chip place">#${esc(s.placement)}</span>` : ''}
        </div>
        <div class="chips">
          <span class="chip cat">${esc(c.title ?? '')}</span>
          <span class="chip ${c.status === 'open' ? 'open' : 'closed'}">${esc(c.status ?? '')}</span>
          ${score ? `<span class="chip">${score}</span>` : ''}
          ${s.prize_usd ? `<span class="chip fee">${money(s.prize_usd)}</span>` : ''}
        </div>
      </a>
    </li>`;
}

export async function render(handle) {
  const p = await getProfile(handle).catch(() => null);
  if (!p) return `<p class="note big">No account named “${esc(handle)}”. <a href="#/accounts">All accounts</a></p>`;
  const r = p.record ?? {};
  const links = [
    p.github_login && `<a href="https://github.com/${esc(p.github_login)}" rel="noopener">GitHub</a>`,
    p.discord?.url && `<a href="${esc(p.discord.url)}" rel="noopener">Discord</a>`,
    p.x && `<a href="${esc(p.x)}" rel="noopener">X</a>`,
    p.wallet?.explorer_url && `<a href="${esc(p.wallet.explorer_url)}" rel="noopener">Wallet</a>`,
  ].filter(Boolean).join(' · ');
  return `
    <nav class="crumbs"><a href="#/accounts">Top accounts</a></nav>
    <section class="profile">
      ${img(p.image && assetUrl(p.image), esc(p.display_name ?? p.handle), 'avatar big')}
      <div>
        <h1>${esc(p.display_name ?? p.handle)}</h1>
        <p class="note">@${esc(p.handle)}${p.house ? ' · make.fun house' : ''} · joined ${esc(String(p.joined_at ?? '').slice(0, 10))}</p>
        ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
        ${links ? `<p class="note">${links}</p>` : ''}
      </div>
    </section>
    <div class="stat-row">
      <div class="stat"><strong>${r.competitions_entered ?? 0}</strong><span>entered</span></div>
      <div class="stat"><strong>${r.competitions_won ?? 0}</strong><span>won</span></div>
      <div class="stat"><strong>${r.podium_finishes ?? 0}</strong><span>podiums</span></div>
      <div class="stat"><strong>${money(r.prize_usd)}</strong><span>prizes</span></div>
    </div>
    <h2>Entries</h2>
    <ul class="board">${(p.solutions ?? []).map(solution).join('') || '<li class="note">No entries yet.</li>'}</ul>`;
}

export function mount() {}
