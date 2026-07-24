/**
 * verify-version-matrix — 版マトリクスの鮮度・整合検査（Sol R1-C1-VERSION-SOT 最終・v0.5.3）。
 *
 * docs/verified-combos/version-matrix.json を現在の読取元と突合し、古い/不整合なら **exit 1**。
 *   検査:
 *     (1) source_hashes … core/採用repo の package.json 内容 SHA-256（版pin実体）
 *     (2) freshness_targets … 各採用repo の origin/main HEAD ＋ Coreタグ deref 先 commit
 *         （package.json を変えずに repo が前進／タグが移動したケースを捉える）
 *     (3) verified 配列 … 各エントリの全フィールド非null ＋ evidence ログの実在
 *   これで「コードやタグが動いても package.json 不変なら stale が通る」「未検証 entry が通る」穴を塞ぐ。
 *
 * ファイルが無い場合も exit 1（版SoTは追跡対象。`npm run version-matrix` で生成して commit する）。
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeFreshnessTargets,
  computeSourceHashes,
  coreAdvanceIsMatrixOnly,
  defaultAdopters,
  tagDerefCommit,
  validateVerifiedEntry,
} from './version-matrix-sources.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const coreRoot = join(here, '..');
// 既定は版SoT本体。負例テスト用に MAGI_MATRIX_PATH で差し替え可能（読取のみ）。
const matrixPath = process.env.MAGI_MATRIX_PATH || join(coreRoot, 'docs', 'verified-combos', 'version-matrix.json');

function fail(msg, detail) {
  console.error(`verify:matrix FAIL: ${msg}`);
  for (const line of detail ?? []) console.error(`  - ${line}`);
  console.error('  → npm run version-matrix で再生成してから commit してください。');
  process.exit(1);
}

let matrix;
try {
  matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
} catch {
  fail(`${matrixPath} が読めません。`, ['npm run version-matrix で生成し版SoTとして追跡（commit）してください。']);
}

// 採用repo: マトリクス記録の名前を既定パス（~/Documents/<name>）へ解決して再計算。
const known = new Map(defaultAdopters().map((a) => [a.name, a]));
const names = (matrix.adopters ?? []).map((a) => a.name).filter(Boolean);
const adopters = (names.length > 0 ? names : [...known.keys()]).map(
  (name) => known.get(name) ?? { name, path: join(homedir(), 'Documents', name) },
);

// (1) source_hashes
const storedHashes = matrix.source_hashes ?? {};
const nowHashes = computeSourceHashes(coreRoot, adopters);
const hashDiffs = [];
for (const key of [...new Set([...Object.keys(storedHashes), ...Object.keys(nowHashes)])].sort()) {
  if (storedHashes[key] !== nowHashes[key]) {
    hashDiffs.push(`source_hashes.${key}: stored=${storedHashes[key] ?? '(なし)'} / now=${nowHashes[key] ?? '(なし)'}`);
  }
}
if (hashDiffs.length > 0) fail('source_hashes が現在の読取元と不一致（版pinが変わった）。', hashDiffs);

// (2) freshness_targets（origin/main HEAD ＋ Coreタグ deref 先）
const storedTargets = matrix.freshness_targets ?? {};
const nowTargets = computeFreshnessTargets(coreRoot, adopters, matrix.core?.version_tag);

// core:origin-main-head の前進が「docs/verified-combos/ 配下のみ」の commit 群なら例外合格する
//   （matrix を commit→push すると core origin/main が前進して自己失効する循環を断つ・Sol実測）。
const targetDiffs = [];
for (const key of [...new Set([...Object.keys(storedTargets), ...Object.keys(nowTargets)])].sort()) {
  const s = storedTargets[key] ?? null;
  const n = nowTargets[key] ?? null;
  if (s === n) continue;
  if (key === 'core:origin-main-head' && coreAdvanceIsMatrixOnly(coreRoot, s, n)) continue;
  targetDiffs.push(`freshness_targets.${key}: stored=${s ?? 'null'} / now=${n ?? 'null'}`);
}
if (targetDiffs.length > 0) fail('freshness_targets（HEAD/タグ deref）が現在値と不一致（repo前進 or タグ移動）。', targetDiffs);

// (3) verified 配列: 機械束縛（tag/commit実在一致・成功マーカー・core_tag文字列）＋ evidence_sha256 の事後改変検出
const bindCtx = {
  coreTags: matrix.core?.tags ?? [],
  coreVersionTag: matrix.core?.version_tag,
  coreVersionHasTag: Boolean(matrix.core?.version_has_tag),
  coreVersionTagCommit: matrix.core?.version_tag_commit ?? null,
  coreOriginMainHead: storedTargets['core:origin-main-head'] ?? null,
  appCommitByName: Object.fromEntries((matrix.adopters ?? []).map((a) => [a.name, a.app_commit ?? null])),
  templateCommit: matrix.template_commit ?? null,
  derefTag: (tag) => tagDerefCommit(coreRoot, tag), // 現在の deref（タグ移動を捉える）
};
const verifiedDiffs = [];
(matrix.verified ?? []).forEach((entry, i) => {
  const { errors, evidenceSha256 } = validateVerifiedEntry(entry, bindCtx);
  for (const e of errors) verifiedDiffs.push(`verified[${i}]: ${e}`);
  // 事後改変検出: 記録済み evidence_sha256 と再計算値の突合。
  if (entry.evidence_sha256 == null) {
    verifiedDiffs.push(`verified[${i}].evidence_sha256 が未記録`);
  } else if (evidenceSha256 !== null && entry.evidence_sha256 !== evidenceSha256) {
    verifiedDiffs.push(`verified[${i}].evidence_sha256 が不一致（evidence 事後改変）: recorded=${entry.evidence_sha256} / now=${evidenceSha256}`);
  }
});
if (verifiedDiffs.length > 0) fail('verified 配列が機械束縛/整合の要件違反。', verifiedDiffs);

const targetCount = Object.keys(nowTargets).length;
const verifiedCount = (matrix.verified ?? []).length;
console.log(
  `verify:matrix OK: source_hashes ${Object.keys(nowHashes).length}件・freshness ${targetCount}件・verified ${verifiedCount}件 が一致（generated_at=${matrix.generated_at}）`,
);
