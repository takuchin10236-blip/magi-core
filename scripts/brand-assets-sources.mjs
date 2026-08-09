/**
 * brand-assets-sources — 同梱ブランド画像の読取元（copy / verify の共通部）。
 *
 * 位置づけ: 画像は tsc の出力対象外なので、build で src/ui/brand → dist/ui/brand へ運ぶ。
 *   運ぶ前後で logo-manifest.json の SHA-256 と突合し、差し替え・破損・運び忘れを機械で捉える。
 *   （version-matrix-sources.mjs と同じ「純関数を切り出し、CLI から呼ぶ」作法に揃えた）
 *
 * 同梱範囲（不変条件）— 横長ロゴ（manifest.variants）:
 *   - 同梱するのは day / night / sunset の standard（480×240）の3枚だけ。
 *     sunset は v0.14.0（2026-08-08）で追加＝第3モード「残照」のヘッダーに要るため
 *     （仕様「テーマ第3モード残照 v1.0」§3）。増やしたのは standard 1枚（194KB）だけで、
 *     @2x・master は入れない＝減量の判断はやり直した上でこの1枚に限っている。
 *   - retina（@2x・各770KB）・master（1774×887・各2.4MB）は同梱しない。
 *     正本は Drive（施設運営/職員マスタアプリ/assets/brand-final-20260730）に残置する。
 *     manifest には3絵柄×3寸法すべてが載っているので、「載っているのに同梱しない」
 *     ファイルが紛れ込んでいないかもここで検査する。
 *   - 原画像は無改変（暗い画面での白余白は CSS の表示範囲で切り取る）。
 *
 * 同梱範囲（不変条件）— アイコン型（manifest.icons.variants・v0.16.0 追加）:
 *   - 同梱するのは day / night / sunset の standard（512×512）の3枚だけ。
 *     master（1024×1024）は同梱せず Drive 正本
 *     （個人/2026-08-08_Eclipse_デザインシステム/素材/SGアイコン型第1便_20260809）に残置する。
 *     ＝横長ロゴと同じ「standard のみ同梱」方針。ここも「manifest に載っているのに
 *     同梱しない」ファイルの混入を検査する。
 *
 * 2種類（横長・アイコン）を扱うので、一覧を作る関数は kind 付きで返す。
 *   copy / verify の画像照合は両方まとめて（expectedFiles）扱い、
 *   「どの部品がどの画像を import しているか」の検査だけ kind で分ける
 *   （SgBrandLogo に横長を、brandIcon にアイコンを求めるため）。
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
export const BUNDLED_VARIANTS = ['day', 'night', 'sunset'];
export const BUNDLED_SIZES = ['standard'];
/** アイコン型も同じ絵柄・同じ「standard だけ」方針（v0.16.0）。 */
export const BUNDLED_ICON_VARIANTS = ['day', 'night', 'sunset'];
export const BUNDLED_ICON_SIZES = ['standard'];

export function readManifest(dir = srcBrandDir) {
  return JSON.parse(readFileSync(join(dir, MANIFEST_NAME), 'utf8'));
}

/** manifest の1つの variants ブロックから「同梱すべきファイル名 → 期待 SHA-256」を集める。 */
function collectBundled(variantsNode, { variants, sizes, kind }) {
  const out = [];
  for (const [variant, entries] of Object.entries(variantsNode ?? {})) {
    if (!variants.includes(variant)) continue;
    for (const size of sizes) {
      const entry = entries?.[size];
      if (!entry) continue;
      out.push({ kind, variant, size, file: entry.file, sha256: entry.sha256, width: entry.width, height: entry.height });
    }
  }
  return out;
}

/** 同じブロックの「載っているが同梱しない」ファイル名を集める。 */
function collectNonBundled(variantsNode, bundledFiles) {
  const out = [];
  for (const entries of Object.values(variantsNode ?? {})) {
    for (const entry of Object.values(entries ?? {})) {
      if (entry?.file && !bundledFiles.has(entry.file)) out.push(entry.file);
    }
  }
  return out;
}

/** 横長ロゴ（2:1・standard 480×240）の同梱一覧。 */
export function expectedLogoFiles(manifest) {
  return collectBundled(manifest.variants, { variants: BUNDLED_VARIANTS, sizes: BUNDLED_SIZES, kind: 'logo' });
}

/** アイコン型（1:1・standard 512×512）の同梱一覧。 */
export function expectedIconFiles(manifest) {
  return collectBundled(manifest.icons?.variants, {
    variants: BUNDLED_ICON_VARIANTS,
    sizes: BUNDLED_ICON_SIZES,
    kind: 'icon',
  });
}

/** manifest から「同梱すべきファイル名 → 期待 SHA-256」の一覧を作る（横長＋アイコン）。 */
export function expectedFiles(manifest) {
  return [...expectedLogoFiles(manifest), ...expectedIconFiles(manifest)];
}

/** 横長ロゴのうち同梱しないファイル名（@2x・master）。 */
export function nonBundledLogoFiles(manifest) {
  const bundled = new Set(expectedLogoFiles(manifest).map((item) => item.file));
  return collectNonBundled(manifest.variants, bundled);
}

/** アイコン型のうち同梱しないファイル名（1024原本）。 */
export function nonBundledIconFiles(manifest) {
  const bundled = new Set(expectedIconFiles(manifest).map((item) => item.file));
  return collectNonBundled(manifest.icons?.variants, bundled);
}

/** manifest に載っているが同梱しないファイル名（混入していないことを確認するために使う）。 */
export function nonBundledFiles(manifest) {
  return [...nonBundledLogoFiles(manifest), ...nonBundledIconFiles(manifest)];
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

  // 非同梱（横長の @2x・master、アイコンの1024原本）の混入禁止。1枚770KB〜2.4MBあり、
  //   入るとパッケージが肥大する。対象は manifest から数える（枚数を書くと次の増減で嘘になる）。
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
