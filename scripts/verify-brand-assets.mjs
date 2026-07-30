/**
 * verify:brand — 同梱ブランド画像の回帰ガード（v0.8）。
 *
 * 何を保証するか（過剰主張しないこと）:
 *   これは「同梱物の自己整合と運び忘れの検出」であって、Drive正本との一致証明ではない。
 *   manifest も画像も同じ commit に入っているので、両方を同時に差し替えればこの検査は通る。
 *   保証できるのは「manifest に書いた通りの中身が src と dist に揃っている」ことまで。
 *   Drive正本との突合は、素材を取り込む人が取り込み時に行う（そのための SHA-256 記録）。
 *
 * 検査:
 *   (1) src/ui/brand の同梱2枚が logo-manifest.json の SHA-256 と一致（自己整合）
 *   (2) dist/ui/brand へ同じ2枚＋manifest が運ばれている（build の運び忘れ検出）
 *   (3) 非同梱（@2x・sunset・master）が混入していない（パッケージ肥大の防止）
 *   (4) SgBrandLogo が同梱2枚を import し、既定マップが white→day / dark→night のまま
 *   (5) design-system.css に表示範囲の切り抜き（.magi-brand-logo）がある
 *       ＝暗い画面で白い額縁が浮く問題の対処が消えていない
 *   (6) index.ts から SgBrandLogo が公開されている
 * 実行系は他の verify:* と同じ（node scripts/*.mjs・ファイルをテキスト読み）。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  coreRoot,
  distBrandDir,
  expectedFiles,
  nonBundledFiles,
  printRows,
  readManifest,
  srcBrandDir,
  verifyDir,
} from './brand-assets-sources.mjs';

const read = (rel) => readFileSync(join(coreRoot, rel), 'utf8');
const manifest = readManifest();
const errors = [];

// (1)(2)(3) 画像の照合
const src = verifyDir(srcBrandDir, manifest, { label: 'src/ui/brand' });
const dist = verifyDir(distBrandDir, manifest, { label: 'dist/ui/brand' });
console.log('brand assets SHA-256 照合（manifest 記載 ↔ 同梱実体）:');
printRows(src.rows, 'src/ui/brand');
printRows(dist.rows, 'dist/ui/brand');
errors.push(...src.errors, ...dist.errors);

// (4) 部品が同梱2枚だけを参照しているか／既定マップが変わっていないか
const componentSrc = read('src/ui/SgBrandLogo.tsx');
for (const item of expectedFiles(manifest)) {
  if (!componentSrc.includes(`./brand/${item.file}`)) {
    errors.push(`SgBrandLogo が ./brand/${item.file} を import していない`);
  }
}
for (const file of nonBundledFiles(manifest)) {
  if (componentSrc.includes(`./brand/${file}`)) {
    errors.push(`SgBrandLogo が非同梱の ./brand/${file} を import している（ビルドが壊れる）`);
  }
}
const themeMapBlock = componentSrc.slice(
  componentSrc.indexOf('const VARIANT_BY_THEME'),
  componentSrc.indexOf('const DEFAULT_ALT'),
);
for (const pair of ["white: 'day'", "dark: 'night'"]) {
  if (!themeMapBlock.includes(pair)) errors.push(`既定マップに ${pair} が無い`);
}

// (5) 白余白の切り抜きが CSS に残っているか
const css = read('src/ui/design-system.css');
for (const needle of ['.magi-brand-logo', "[data-trim='on']", 'overflow: hidden', 'aspect-ratio: 440 / 200']) {
  if (!css.includes(needle)) errors.push(`design-system.css に ${needle} が無い（白余白の切り抜きが消えている）`);
}

// (6) 公開API
const indexSrc = read('src/ui/index.ts');
for (const name of ['SgBrandLogo', 'SG_BRAND_LOGO_SOURCES']) {
  if (!indexSrc.includes(name)) errors.push(`index.ts から ${name} が export されていない`);
}

if (errors.length > 0) {
  console.error(`\nverify:brand FAILED: ${errors.length} 件`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `\nverify:brand OK: 同梱 ${src.rows.length}枚 × 2箇所（src/dist）＋ 非同梱${nonBundledFiles(manifest).length}件の不在・部品・CSS・公開API を検査`,
);
