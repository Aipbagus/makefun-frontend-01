// A make.fun frontend on hash routes. The board and a bounty's page are in the
// first load; the leaderboard, the profile and the accounts index are lazy-loaded
// with import() so the first load stays small.
//
//   #/                        the bounty board
//   #/bounty/<slug>           one bounty
//   #/leaderboard/<slug>      that bounty's leaderboard
//   #/accounts                the top accounts
//   #/account/<handle>        an account's public profile
//
// window.__shotReady is false while a page loads and true once its data is on
// screen, so a screenshot script knows when to capture.

import { getBounty, getBoard } from './api.js';
import { board, bounty } from './views.js';
import { esc } from './format.js';

const app = document.getElementById('app');

/** Render with a lazily loaded view module: imported once, reused after. */
const views = {
  board: { show: () => boardView() },
  bounty: { show: (slug) => one(decodeURIComponent(slug), bounty) },
};

const lazyReady = Promise.all([
  import('./leaderboard.js'),
  import('./accounts.js'),
  import('./profile.js'),
]).then(([lb, ac, pf]) => {
  views.leaderboard = { show: (slug) => lb.render(decodeURIComponent(slug)), mount: lb.mount };
  views.accounts = { show: () => ac.render(), mount: ac.mount };
  views.profile = { show: (handle) => pf.render(decodeURIComponent(handle)), mount: pf.mount };
});

const routes = [
  [/^#\/bounty\/([^/]+)$/, 'bounty'],
  [/^#\/leaderboard\/([^/]+)$/, 'leaderboard'],
  [/^#\/account\/([^/]+)$/, 'profile'],
  [/^#\/accounts$/, 'accounts'],
  [/^#\/$/, 'board'],
];

async function boardView() {
  const data = await getBoard();
  document.title = 'make.fun bounties — live bounties';
  return board(data);
}

async function one(slug, view) {
  const b = await getBounty(slug);
  document.title = `${b.title} | make.fun bounties`;
  return view(b);
}

/** Swap the page's HTML in one assignment; a render never rebuilds around it. */
function set(html, title) {
  app.innerHTML = html;
  document.title = title;
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

let seq = 0;

async function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const route = routes.find(([re]) => re.test(hash));
  const id = ++seq;
  try {
    if (!route) throw new Error('not found');
    const view = views[route[1]];
    if (!view) {
      await lazyReady;
      await new Promise((r) => setTimeout(r, 0));
    }
    const show = views[route[1]]?.show;
    if (!show) throw new Error('not found');
    const html = await show(...hash.match(route[0]).slice(1));
    if (id !== seq) return;
    set(html, titleFor(route[1]));
    views[route[1]].mount?.(app);
    window.__shotReady = true;
  } catch (err) {
    if (id === seq) {
      set(`<section class="note big"><h1>Not found</h1><p>${esc(String(err.message ?? err))}</p>
        <p><a href="#/">Back to the bounty board</a></p></section>`, 'make.fun bounties');
      window.__shotReady = true;
    }
  }
}

const titles = {
  board: 'make.fun bounties — live bounties',
  bounty: 'bounty | make.fun bounties',
  leaderboard: 'leaderboard | make.fun bounties',
  accounts: 'top accounts | make.fun bounties',
  profile: 'account | make.fun bounties',
};
const titleFor = (name) => titles[name] ?? 'make.fun bounties';

window.addEventListener('hashchange', render);
render();
