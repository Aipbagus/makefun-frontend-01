// A working makefun-frontend-01 entry (Node 22, standard library only) — v1 build.
// The frontend is this directory's app/ folder: plain static files a browser opens at app/index.html
// (ES modules, CSS, no build step), reading make.fun's public API at https://make.fun/api with
// ETag revalidation. The program hands it in: it copies app/ and screenshots/ from beside this
// file to /output, refusing to run when the screenshots are missing, and writes /output/dossier.json
// — the summary the judge reads — with the vendored make.fun library. vendor/makefun-frontend.ts
// stays untouched: the scorer requires dossier.json to be byte for byte what its copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Count the regular files under a directory, any depth — the app/ file cap check. */
function countFiles(dir: string): number {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) n += countFiles(path);
    else n += 1;
  }
  return n;
}

const shots = existsSync(join(here, 'screenshots')) ? readdirSync(join(here, 'screenshots')).filter((f) => !f.startsWith('.')) : [];
if (shots.length < 3) {
  process.stderr.write(`makefun frontend: screenshots/ holds ${shots.length} image(s): hand in 3, taken of the running app on live data\n`);
  process.exit(1);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const appFiles = countFiles(join(out, 'app'));
if (appFiles > 993) {
  process.stderr.write(`makefun frontend: app/ holds ${appFiles} files, over the scorer's 993 cap\n`);
  process.exit(1);
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 3 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 16 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 3, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);
