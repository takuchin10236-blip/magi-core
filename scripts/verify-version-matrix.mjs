/**
 * verify-version-matrix — 版マトリクスの鮮度検査（Sol R1-C1-VERSION-SOT round2）。
 *
 * docs/verified-combos/version-matrix.json の source_hashes を、現在の読取元
 *   （core package.json ＋ 各採用repoの origin/main package.json）から再計算して突合する。
 *   不一致（版マトリクスが古い）なら **exit 1**＝CI/`npm run check` を止める。
 *   これで「生成元変更後も CI が古い一覧を通す」穴を塞ぐ。
 *
 * ファイルが無い場合も exit 1（版SoTは追跡対象。`npm run version-matrix` で生成して commit する）。
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeSourceHashes, defaultAdopters } from './version-matrix-sources.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const coreRoot = join(here, '..');
const matrixPath = join(coreRoot, 'docs', 'verified-combos', 'version-matrix.json');

let matrix;
try {
  matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
} catch {
  console.error(`verify:matrix FAIL: ${matrixPath} が読めません。`);
  console.error('  → npm run version-matrix で生成し、版SoTとして追跡（commit）してください。');
  process.exit(1);
}

// 採用repo: マトリクスに記録された名前を既定パス（~/Documents/<name>）へ解決して再計算。
const known = new Map(defaultAdopters().map((a) => [a.name, a]));
const names = (matrix.adopters ?? []).map((a) => a.name).filter(Boolean);
const adopters = (names.length > 0 ? names : [...known.keys()]).map(
  (name) => known.get(name) ?? { name, path: join(process.env.HOME ?? '', 'Documents', name) },
);

const stored = matrix.source_hashes ?? {};
const recomputed = computeSourceHashes(coreRoot, adopters);

const keys = [...new Set([...Object.keys(stored), ...Object.keys(recomputed)])].sort();
const diffs = [];
for (const key of keys) {
  if (stored[key] !== recomputed[key]) {
    diffs.push({ key, stored: stored[key] ?? '(なし)', now: recomputed[key] ?? '(なし)' });
  }
}

if (diffs.length > 0) {
  console.error('verify:matrix FAIL: source_hashes が現在の読取元と不一致（版マトリクスが古い）。');
  for (const d of diffs) console.error(`  - ${d.key}: stored=${d.stored} / now=${d.now}`);
  console.error('  → npm run version-matrix で再生成してから commit してください。');
  process.exit(1);
}

console.log(`verify:matrix OK: source_hashes ${keys.length} 件が一致（generated_at=${matrix.generated_at}）`);
