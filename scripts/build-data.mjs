// Pulls the wish tag dictionary and cover photos from the app repo into assets/js/data.js
// and downloads covers into assets/img/covers. Run: node scripts/build-data.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = process.env.WEESH_APP_DIR ?? join(root, '..', 'willz');
const readJson = (p) => JSON.parse(readFileSync(join(app, p), 'utf8'));

const taxonomy = readJson('constants/wishTags.json');
const covers = readJson('constants/wishCovers.generated.json');

const coverDir = join(root, 'assets/img/covers');
mkdirSync(coverDir, { recursive: true });

const coverOut = {};
for (const [tag, cover] of Object.entries(covers)) {
  const file = `${tag}.jpg`;
  const dest = join(coverDir, file);
  if (!existsSync(dest)) {
    const tmp = join(coverDir, `${tag}.src`);
    try {
      const res = await fetch(cover.url, { headers: { 'User-Agent': 'weesh-site-build/1.0 (dev.ohmyapp@gmail.com)' } });
      if (!res.ok) throw new Error(`${res.status}`);
      writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
      execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '62', '-Z', '640', tmp, '--out', dest], { stdio: 'ignore' });
    } catch (e) {
      console.warn(`cover ${tag} failed: ${e.message}`);
      continue;
    } finally {
      if (existsSync(tmp)) unlinkSync(tmp);
    }
  }
  coverOut[tag] = { src: `assets/img/covers/${file}`, credit: cover.credit, page: cover.page };
}

// The site is city-neutral; the app's copy is written for its first city.
const OVERRIDES = {
  cycling: { cta: 'Rent a bike for two hours and ride along the river.' },
  wine: { cta: 'Ask for one local wine by the glass.' },
  jewish_heritage: { label: 'Jewish heritage' },
  history: { label: 'History & landmarks' },
};

const tags = taxonomy.tags.map((t) => ({ id: t.id, group: t.group, label: t.label, keywords: t.keywords, cta: t.cta, ...OVERRIDES[t.id] }));

writeFileSync(join(root, 'assets/js/data.js'), `window.WEESH_DATA=${JSON.stringify({ tags, covers: coverOut })};\n`);
console.log(`tags ${tags.length}, covers ${Object.keys(coverOut).length}`);
