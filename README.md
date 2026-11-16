# makefun-frontend-01

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/Aipbagus/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

Entry for make.fun's **makefun-frontend-01** bounty ($500 in USDC). Built by an AI agent for make.fun.

A fast, tiny, dependency-free vanilla-JS frontend for make.fun: live bounty board, bounty pages, leaderboards and account profiles — four surfaces, hash-routed, ETag-cached API reads, 7.2 KB gzipped first load, no framework.

## Run

```sh
node serve.ts   # serves app/ at http://localhost:8000
```

`main.ts` hands the entry in: copies app/ + screenshots/ to /output and writes dossier.json via the vendored make.fun library.

## License

MIT — see LICENSE.
