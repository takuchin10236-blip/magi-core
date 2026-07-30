/**
 * brand-assets-sources — 同梱ブランド画像の読取元（copy / verify の共通部）。
 *
 * 位置づけ: 画像は tsc の出力対象外なので、build で src/ui/brand → dist/ui/brand へ運ぶ。
 *   運ぶ前後で logo-manifest.json の SHA-256 と突合し、差し替え・破損・運び忘れを機械で捉える。
 *   （version-matrix-sources.mjs と同じ「純関数を切り出し、CLI から呼ぶ」作法に揃えた）
 *
 * 同梱範囲（不変条件）:
 *   - 同梱するのは day / night の standard（480×240）の2枚だけ。
 *   - retina（@2x・各770KB）・sunset・master（1774×887・各2.4MB）は同梱しない。
 *     正本は Drive（施設運営/職員マスタアプリ/assets/brand-final-20260730）に残置する。
 *     manifest には3絵柄×3寸法すべてが載っているので、「載っているのに同梱しない」
 *     ファイルが紛れ込んでいないかもここで検査する。
 *   - 原画像は無改変（暗い画面での白余白は CSS の表示範囲で切り取る）。
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const coreRoot = join(here, '..');
export const srcBrandDir = join(coreRoot, 'src', 'ui', 'brand');
export const distBrandDir = join(coreRoot, 'dist', 'ui', 'brand');
export const MANIFEST_NAME = 'logo-manifest.json';

/** 同梱する絵柄と寸法（ここを増やすときは減量の判断をやり直すこと）。 */
export const BUNDLED_VARIANTS = ['day', 'night'];
export const BUNDLED_SIZES = ['standard'];

export function readManifest(dir = srcBrandDir) {
  return JSON.parse(readFileSync(join(dir, MANIFEST_NAME), 'utf8'));
}

/** manifest から「同梱すべきファイル名 → 期待 SHA-256」の一覧を作る。 */
export function expectedFiles(manifest) {
  const out = [];
  for (const [variant, sizes] of Object.entries(manifest.variants ?? {})) {
    if (!BUNDLED_VARIANTS.includes(variant)) continue;
    for (const size of BUNDLED_SIZES) {
      const entry = sizes?.[size];
      if (!entry) continue;
      out.push({ variant, size, file: entry.file, sha256: entry.sha256, width: entry.width, height: entry.height });
    }
  }
  return out;
}

/** manifest に載っているが同梱しないファイル名（混入していないことを確認するために使う）。 */
export function nonBundledFiles(manifest) {
  const bundled = new Set(expectedFiles(manifest).map((item) => item.file));
  const out = [];
  for (const sizes of Object.values(manifest.variants ?? {})) {
    for (const entry of Object.values(sizes ?? {})) {
      if (entry?.file && !bundled.has(entry.file)) out.push(entry.file);
    }
  }
  return out;
}

export function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

/**
 * 1ディレクトリ分の照合。戻り値 { rows, errors }。
 *   rows … 報告用の突合表（file / expected / actual / ok）
 *   errors … 不一致・欠落・非同梱ファイルの混入メッセージ
 */
export function verifyDir(dir, manifest, { label }) {
  const rows = [];
  const errors = [];

  if (!existsSync(dir)) {
    return { rows, errors: [`${label}: ${dir} が存在しません（build を実行してください）。`] };
  }

  for (const item of expectedFiles(manifest)) {
    const path = join(dir, item.file);
    if (!existsSync(path)) {
      errors.push(`${label}: ${item.file} が無い`);
      rows.push({ ...item, actual: null, ok: false });
      continue;
    }
    const actual = sha256(path);
    const ok = actual === item.sha256;
    if (!ok) errors.push(`${label}: ${item.file} の SHA-256 不一致（expected=${item.sha256} / actual=${actual}）`);
    rows.push({ ...item, actual, ok });
  }

  if (!existsSync(join(dir, MANIFEST_NAME))) {
    errors.push(`${label}: ${MANIFEST_NAME} が無い（出所の追跡ができない）`);
  }

  // 非同梱（@2x・sunset・master）の混入禁止。1枚770KB〜2.4MBあり、入るとパッケージが肥大する。
  const present = new Set(readdirSync(dir));
  for (const file of nonBundledFiles(manifest)) {
    if (present.has(file)) errors.push(`${label}: 非同梱のはずの ${file} が入っている（正本は Drive 側に置く）`);
  }

  return { rows, errors };
}

export function printRows(rows, label) {
  console.log(`  [${label}]`);
  for (const row of rows) {
    const mark = row.ok ? 'OK  ' : 'FAIL';
    console.log(`    ${mark} ${row.file} (${row.width}×${row.height}) sha256=${row.actual ?? '(なし)'}`);
  }
}
