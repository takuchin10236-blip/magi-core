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
 *   (1) src/ui/brand の同梱物が logo-manifest.json の SHA-256 と一致（自己整合）
 *   (2) dist/ui/brand へ同じ同梱物＋manifest が運ばれている（build の運び忘れ検出）
 *   (3) 非同梱（横長の @2x・master／アイコンの1024原本）が混入していない（パッケージ肥大の防止）
 *   (4) SgBrandLogo が横長の同梱物を import し、既定マップが white→day / dusk→sunset / dark→night のまま
 *   (4-i) brandIcon がアイコンの同梱物を import し、同じ既定マップを持つ（v0.16.0）
 *   (5) design-system.css に表示範囲の切り抜き（.magi-brand-logo）がある
 *       ＝暗い画面・夕焼けの帯で白い額縁が浮く問題の対処が消えていない（night / sunset の両方）
 *   (6) index.ts から SgBrandLogo / アイコンの公開API（SG_BRAND_ICON_SOURCES・useBrandFavicon）が公開されている
 * 実行系は他の verify:* と同じ（node scripts/*.mjs・ファイルをテキスト読み）。
 *
 * 同梱枚数を本文に書かない理由（2026-08-09）:
 *   v0.14.0 で sunset を足したとき、この冒頭コメントだけが「同梱2枚」「非同梱＝sunset」の
 *   ままで残った（実体は3枚・sunset は同梱側）。**枚数と対象は manifest ＋
 *   brand-assets-sources.mjs の BUNDLED_VARIANTS が唯一の出どころ**で、この検査もそこから
 *   数える。だからコメントでも枚数を言い切らない（言い切ると次の増減でまた嘘になる）。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  coreRoot,
  distBrandDir,
  expectedIconFiles,
  expectedLogoFiles,
  nonBundledFiles,
  nonBundledIconFiles,
  nonBundledLogoFiles,
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

// (4)(4-i) 部品が同梱物だけを参照しているか／既定マップが変わっていないか
//   横長は SgBrandLogo、アイコンは brandIcon が持つ＝取り違えると片方の検査が空振りするので、
//   「どのファイルにどの画像を求めるか」を kind で分けて回す。
const consumers = [
  { rel: 'src/ui/SgBrandLogo.tsx', label: 'SgBrandLogo', mine: expectedLogoFiles(manifest), theirs: expectedIconFiles(manifest), nonBundled: nonBundledLogoFiles(manifest) },
  { rel: 'src/ui/brandIcon.ts', label: 'brandIcon', mine: expectedIconFiles(manifest), theirs: expectedLogoFiles(manifest), nonBundled: nonBundledIconFiles(manifest) },
];

for (const { rel, label, mine, theirs, nonBundled } of consumers) {
  const componentSrc = read(rel);
  for (const item of mine) {
    if (!componentSrc.includes(`./brand/${item.file}`)) {
      errors.push(`${label} が ./brand/${item.file} を import していない`);
    }
  }
  for (const item of theirs) {
    // 横長とアイコンの取り違え（例: brandIcon が sg-logo-*.png を読む）を止める。
    if (componentSrc.includes(`./brand/${item.file}`)) {
      errors.push(`${label} が担当外の ./brand/${item.file} を import している（横長とアイコンの取り違え）`);
    }
  }
  for (const file of nonBundled) {
    if (componentSrc.includes(`./brand/${file}`)) {
      errors.push(`${label} が非同梱の ./brand/${file} を import している（ビルドが壊れる）`);
    }
  }
  const mapStart = componentSrc.indexOf('const VARIANT_BY_THEME');
  if (mapStart < 0) {
    errors.push(`${label} に既定マップ VARIANT_BY_THEME が無い`);
    continue;
  }
  // 宣言の終わり（次の "};"）までを見る。以前は「次の定数名」を終端にしていたが、
  //   それだと相手側のファイル構成に検査が縛られる（brandIcon には DEFAULT_ALT が無い）。
  const themeMapBlock = componentSrc.slice(mapStart, componentSrc.indexOf('};', mapStart));
  // 3モード（陽光/残照/月光）ぶんを固定する。dusk は v0.14.0 で増えたのに検査が white/dark の
  // 2本しか見ておらず、sunset へのマップが消えても気づけなかった（2026-08-09 レビュー指摘）。
  for (const pair of ["white: 'day'", "dusk: 'sunset'", "dark: 'night'"]) {
    if (!themeMapBlock.includes(pair)) errors.push(`${label} の既定マップに ${pair} が無い`);
  }
}

// (4-i 続き) favicon フックが「色モードに追従して <link rel="icon"> を書き換える」実体を持つか。
//   ここが空洞化すると「1行で favicon」が黙って効かなくなる（画面には何も出ないので気づけない）。
const iconModuleSrc = read('src/ui/brandIcon.ts');
for (const needle of ['export function useBrandFavicon', "rel~=\"icon\"", 'useColorMode()', "setAttribute('href'"]) {
  if (!iconModuleSrc.includes(needle)) {
    errors.push(`brandIcon.ts に ${needle} が無い（useBrandFavicon が favicon を追従させる実体を失っている）`);
  }
}

// (5) 白余白の切り抜きが CSS に残っているか
const css = read('src/ui/design-system.css');
// 寸法と切り抜きは職員マスタ（magi-staff-directory origin/main 267a671）から写した値。
// 消える・書き換わると「アプリごとにバラバラ」へ逆戻りするので機械で固定する。
for (const needle of [
  '.magi-brand-logo',
  "[data-trim='on'][data-variant='night']",
  // 夕日版も同じ理由（茜の帯に白い額縁が浮く）で切り抜いている。night だけ固定していると
  // sunset 側のセレクタが消えても検査が通ってしまうため、両方を機械で押さえる。
  "[data-trim='on'][data-variant='sunset']",
  'clip-path: inset(9% 5% round 6px)',
  'var(--magi-brand-logo-width, 148px)',
  'var(--magi-brand-logo-width-md, 112px)',
  'var(--magi-brand-logo-width-sm, 104px)',
]) {
  if (!css.includes(needle)) errors.push(`design-system.css に ${needle} が無い（ロゴ寸法・白余白の切り抜きが崩れている）`);
}

// (6) 公開API
const indexSrc = read('src/ui/index.ts');
for (const name of ['SgBrandLogo', 'SG_BRAND_LOGO_SOURCES', 'SG_BRAND_ICON_SOURCES', 'useBrandFavicon']) {
  if (!indexSrc.includes(name)) errors.push(`index.ts から ${name} が export されていない`);
}

if (errors.length > 0) {
  console.error(`\nverify:brand FAILED: ${errors.length} 件`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `\nverify:brand OK: 同梱 ${src.rows.length}枚（横長${expectedLogoFiles(manifest).length}＋アイコン${expectedIconFiles(manifest).length}）× 2箇所（src/dist）` +
    `＋ 非同梱${nonBundledFiles(manifest).length}件の不在・部品・CSS・公開API を検査`,
);
