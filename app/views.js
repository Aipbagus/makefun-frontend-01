// The two first-load views, each a function from API data to HTML.

import { date, esc, fee, money, pot, timeLeft } from './format.js';

/** A bounty card for the board: pot, fee, time left, entries. */
function card(b) {
  const f = fee(b);
  const closed = new Date(b.deadline).getTime() <= Date.now();
  const text = (b.summary ?? b.description ?? '').slice(0, 180);
  return `
    <li class="card">
      <a class="card-main" href="#/bounty/${encodeURIComponent(b.slug)}">
        <div class="card-top">
          <h3>${esc(b.title)}</h3>
          <span class="pot">${pot(b)}</span>
        </div>
        <p class="summary">${esc(text)}${(b.summary ?? b.description ?? '').length > 180 ? '…' : ''}</p>
        <div class="chips">
          <span class="chip time ${closed ? 'closed' : 'open'}">${esc(timeLeft(b.deadline))}</span>
          <span class="chip">${b.submissionCount.toLocaleString('en-US')} ${b.submissionCount === 1 ? 'entry' : 'entries'}</span>
          ${f ? `<span class="chip fee">${money(f)} fee</span>` : ''}
          ${b.category ? `<span class="chip cat">${esc(b.category)}</span>` : ''}
        </div>
      </a>
    </li>`;
}

/** The bounty board: every open bounty, soonest deadline first. */
export function board(data) {
  const items = [...data.items].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const totalPot = items.reduce((s, b) => s + Number(b.potUsd ?? b.rewardAmount ?? 0), 0);
  return `
    <section class="hero">
      <h1>Live bounties</h1>
      <p>${items.length} open · ${money(totalPot)} in pots right now · <a href="#/accounts">top accounts</a></p>
    </section>
    <ul class="board">${items.map(card).join('') || '<li class="note">No open bounties.</li>'}</ul>`;
}

/** The rewards table with the live pot. */
function rewardsTable(b) {
  const rows = (b.rewardsNow ?? []).map(
    (r) => `<tr><td>#${r.place}</td><td>${money(r.amountUsd)}</td></tr>`,
  ).join('');
  return `
    <table class="rewards">
      <caption>Rewards — live pot ${pot(b)}${b.entryFeeUsd ? ` (${money(b.entryFeeUsd)} entry fee)` : ''}</caption>
      <thead><tr><th>Place</th><th>Prize</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/** One bounty: summary, description, rules, rewards, dates, status, and its leaderboard link. */
export function bounty(b) {
  const closed = new Date(b.deadline).getTime() <= Date.now();
  const status = closed ? 'Closed — awaiting results' : 'Open for entries';
  return `
    <nav class="crumbs"><a href="#/">All bounties</a></nav>
    <article class="bounty">
      <header>
        <h1>${esc(b.title)}</h1>
        <div class="chips">
          <span class="chip big pot">${pot(b)}</span>
          <span class="chip time ${closed ? 'closed' : 'open'}">${esc(timeLeft(b.deadline))}</span>
          ${fee(b) ? `<span class="chip fee">${money(fee(b))} entry fee</span>` : ''}
          <span class="chip">${b.submissionCount.toLocaleString('en-US')} entries</span>
          <span class="chip">${esc(status)}</span>
        </div>
        <p class="lead">${esc(b.summary ?? '')}</p>
        <a class="button" href="#/leaderboard/${encodeURIComponent(b.slug)}">View leaderboard →</a>
      </header>
      <div class="cols">
        <div class="text">
          <h2>Description</h2>
          <div class="md">${esc(b.description ?? '')}</div>
          ${b.rules ? `<h2>Rules</h2><div class="md">${esc(b.rules)}</div>` : ''}
        </div>
        <aside>
          ${rewardsTable(b)}
          <dl class="facts">
            <dt>Opens</dt><dd>${date(b.publishedAt ?? b.opensAt)}</dd>
            <dt>Deadline</dt><dd>${date(b.deadline)}</dd>
            <dt>Entries</dt><dd>${b.submissionCount.toLocaleString('en-US')}</dd>
            <dt>Status</dt><dd>${esc(status)}</dd>
            ${b.entryFeeUsd ? `<dt>Entry fee</dt><dd>${money(b.entryFeeUsd)}</dd>` : ''}
            ${b.sponsor ? `<dt>Sponsor</dt><dd>${esc(b.sponsor.name)}</dd>` : ''}
          </dl>
        </aside>
      </div>
    </article>`;
}
