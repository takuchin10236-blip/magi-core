/**
 * copy-manual-figures — src/ui/manual-figures の画像を dist/ui/manual-figures へ運ぶ（build の後段・v0.21.0）。
 *
 * tsc は .ts しか出力しないため、manualFigures.ts が import する画像を明示的に運ぶ
 *   （dist/ui/manualFigures.js から見た './manual-figures/*.webp' が実在する状態を作る
 *   ＝採用側アプリの Vite が解決できる）。brand 画像と同じ形。
 *
 * 検査（運ぶついでに、静かな欠落を止める）:
 *   (1) manualFigures.ts が import している画像が src に全部在る
 *   (2) src に在るのに import されていない画像が無い（消し忘れ＝配布物の無駄）
 *   (3) 運んだ後、dist 側のバイト数が src と一致する
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const coreRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(coreRoot, 'src', 'ui', 'manual-figures');
const distDir = join(coreRoot, 'dist', 'ui', 'manual-figures');
const moduleFile = join(coreRoot, 'src', 'ui', 'manualFigures.ts');

const imported = [...readFileSync(moduleFile, 'utf8').matchAll(/from '\.\/manual-figures\/([^']+)'/g)].map((m) => m[1]);
const present = readdirSync(srcDir).filter((name) => /\.(webp|png|jpg|jpeg)$/i.test(name));

const errors = [];
for (const file of imported) {
  if (!present.includes(file)) errors.push(`manualFigures.ts が import している ${file} が src に無い`);
}
for (const file of present) {
  if (!imported.includes(file)) errors.push(`${file} は src に在るが、どこからも import されていない（配布物の無駄）`);
}
if (errors.length > 0) {
  console.error('copy:manual-figures FAIL:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

mkdirSync(distDir, { recursive: true });
let bytes = 0;
for (const file of imported) {
  copyFileSync(join(srcDir, file), join(distDir, file));
  const srcSize = statSync(join(srcDir, file)).size;
  const distSize = statSync(join(distDir, file)).size;
  if (srcSize !== distSize) {
    console.error(`copy:manual-figures FAIL: ${file} のバイト数が src(${srcSize}) と dist(${distSize}) で違う`);
    process.exit(1);
  }
  bytes += srcSize;
}

console.log(`copy:manual-figures OK: ${imported.length}枚を dist/ui/manual-figures へ複製（合計 ${Math.round(bytes / 1024)}KB）`);
