/**
 * collect-version-matrix — 版同期・検証済み組合せ一覧の機械収集（v0.5.2・Sol R1-C1-VERSION-SOT round2）。
 *
 * 仕様: 候補_版同期_検証済み組合せ一覧_自動生成仕様.md §3 ／ 11_型同期ルール §0.5。
 *   数字は機械に写させ、人は判断だけ書く。本スクリプトは読取専用（他repoへ書かない）。
 *
 * round2 修正（R1-C1-VERSION-SOT）:
 *   - 各採用repoの固定タグ・版は **dirty ローカル作業ツリーでなく `git show origin/main:package.json`
 *     （確定commit）** から読む。
 *   - `app_commit`（origin/main HEAD 完全SHA）・`template_commit`（雛形の origin/main HEAD）を記録。
 *   - `--verified-entry app=...,core_tag=...,evidence=...,verified_at=...[,verified_by=...]`（反復可）で
 *     検証記録を受けて `verified` 配列へ格納（11 §0.5 の検証済み組合せスキーマ）。
 *   - `source_hashes`（版pin実体の SHA-256）を出力。`npm run verify:matrix` が鮮度を機械検査する。
 *   - `--now <iso>` で generated_at を外部注入可（再現性）。
 *   出力: docs/verified-combos/version-matrix.json ＋ .md（このworktree内のみ）。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  coreTagList,
  computeFreshnessTargets,
  computeSourceHashes,
  defaultAdopters,
  localHead,
  originMainHead,
  pinnedCoreTag,
  readOriginMainPackage,
  tagDerefCommit,
  validateVerifiedEntry,
} from './version-matrix-sources.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const coreRoot = join(here, '..');

// 構築時は null 許容（validateVerifiedEntry が全フィールド非null＋機械束縛を検証してから確定する）。
type VerifiedEntry = {
  app: string | null;
  core_tag: string | null;
  template_commit: string | null;
  app_commit: string | null;
  verified_at: string | null;
  verified_by: string | null;
  evidence: string | null;
  evidence_sha256: string | null;
};

function parseVerifiedEntry(spec: string): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const pair of spec.split(',')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    obj[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return obj;
}

// --- 引数解析（--now / --verified-entry / 残りは採用repo名 or パス） ---
const rawArgs = process.argv.slice(2);
let nowOverride: string | undefined;
const verifiedSpecs: string[] = [];
const positional: string[] = [];
for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === '--now') {
    nowOverride = rawArgs[i + 1];
    i += 1;
  } else if (arg.startsWith('--now=')) {
    nowOverride = arg.slice('--now='.length);
  } else if (arg === '--verified-entry') {
    verifiedSpecs.push(rawArgs[i + 1] ?? '');
    i += 1;
  } else if (arg.startsWith('--verified-entry=')) {
    verifiedSpecs.push(arg.slice('--verified-entry='.length));
  } else {
    positional.push(arg);
  }
}
const generatedAt = nowOverride ?? new Date().toISOString();

// 採用repo: 位置引数があればそれをパスとして名前=basename で扱う。無ければ既定。
const adopters =
  positional.length > 0
    ? positional.map((p) => ({ name: p.split('/').filter(Boolean).pop() ?? p, path: p }))
    : defaultAdopters();

// --- core 側（作業ツリー package.json＝版bump対象・タグは版存在判定用） ---
const corePkg = JSON.parse(readFileSync(join(coreRoot, 'package.json'), 'utf8')) as { version?: string };
const coreVersion = corePkg.version ?? '（不明）';
const coreTags = coreTagList(coreRoot);
const coreVersionTag = `v${coreVersion}`;
const coreVersionHasTag = coreTags.includes(coreVersionTag) || coreTags.includes(coreVersion);
const coreLabel = coreVersionHasTag ? coreVersionTag : `${coreVersionTag}（作業中・タグ未作成）`;

// --- 採用repo（すべて origin/main 確定commitから） ---
const adopterRows = adopters.map((adopter) => {
  const pkg = readOriginMainPackage(adopter.path);
  const appCommit = originMainHead(adopter.path);
  return {
    name: adopter.name,
    available: pkg !== null && appCommit !== null,
    app_version: pkg?.version ?? null,
    core_pinned_tag: pkg ? pinnedCoreTag(pkg.deps) : null,
    app_commit: appCommit, // origin/main 完全SHA（機械独立）
  };
});

// 雛形（magi-webapp-template）の origin/main HEAD を template_commit とする。
const templateRow = adopterRows.find((r) => r.name === 'magi-webapp-template');
const templateCommit = templateRow?.app_commit ?? null;
const appCommitByName = new Map(adopterRows.map((r) => [r.name, r.app_commit] as const));

// --- verified 配列（--verified-entry から。11 §0.5・機械束縛検証＋evidence_sha256 記録） ---
const coreHead = localHead(coreRoot); // core 自身のローカル HEAD（push後に origin/main になる commit）
const coreVersionTagCommit = tagDerefCommit(coreRoot, coreVersionTag);
const appCommitByNameObj: Record<string, string | null> = Object.fromEntries(
  adopterRows.map((r) => [r.name, r.app_commit]),
);
const bindCtx = {
  coreTags,
  coreVersionTag,
  coreVersionHasTag,
  coreVersionTagCommit,
  coreOriginMainHead: coreHead,
  appCommitByName: appCommitByNameObj,
  templateCommit,
  derefTag: (tag: string) => tagDerefCommit(coreRoot, tag),
};
const verified: VerifiedEntry[] = verifiedSpecs.map((spec, index) => {
  const e = parseVerifiedEntry(spec);
  const isCore = e.app === '@magi/core' || e.app === 'core';
  const pending = e.core_tag != null && e.core_tag === coreVersionTag && !coreVersionHasTag;
  const entry: VerifiedEntry = {
    app: e.app ?? null,
    core_tag: e.core_tag ?? null,
    template_commit: e.template_commit ?? templateCommit,
    // 明示指定を優先。無ければ束縛の基準値を自動解決（core: pendingはHEAD/tagged はタグderef、採用repoは記録HEAD）。
    app_commit:
      e.app_commit ??
      (isCore ? (pending ? coreHead : coreVersionTagCommit) : appCommitByName.get(e.app ?? '') ?? null),
    verified_at: e.verified_at ?? null,
    verified_by: e.verified_by ?? null,
    evidence: e.evidence ?? null,
    evidence_sha256: null,
  };
  const { errors, evidenceSha256 } = validateVerifiedEntry(entry, bindCtx);
  if (errors.length > 0) {
    console.error(`collect FAIL: --verified-entry[${index}] 束縛違反: ${spec}`);
    for (const m of errors) console.error(`  - ${m}`);
    process.exit(1);
  }
  entry.evidence_sha256 = evidenceSha256;
  return entry;
});

const sourceHashes = computeSourceHashes(coreRoot, adopters);
const freshnessTargets = computeFreshnessTargets(coreRoot, adopters, coreVersionTag);

const matrix = {
  generated_at: generatedAt,
  note: '機械生成。手書き版番号は禁止。固定版は origin/main 確定commitから収集（11_型同期ルール §0.5）。',
  core: {
    version: coreVersion,
    version_tag: coreVersionTag,
    version_has_tag: coreVersionHasTag,
    version_tag_commit: coreVersionTagCommit, // タグの deref 先 commit（未作成なら null）
    label: coreLabel,
    tags: coreTags,
  },
  template_commit: templateCommit,
  adopters: adopterRows,
  verified,
  source_hashes: sourceHashes,
  freshness_targets: freshnessTargets, // origin/main HEAD ＋ Coreタグ deref 先（verify:matrix が突合）
};

const outDir = join(coreRoot, 'docs', 'verified-combos');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'version-matrix.json'), `${JSON.stringify(matrix, null, 2)}\n`, 'utf8');

// --- 人間用 .md（JSONから整形） ---
const lines: string[] = [];
lines.push('# 版同期・検証済み組合せ一覧（機械生成）');
lines.push('');
lines.push('> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。');
lines.push('> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。');
lines.push('');
lines.push(`- 生成時刻: ${generatedAt}`);
lines.push(`- Core: **${coreLabel}**（tag数: ${coreTags.length}）`);
lines.push(`- template_commit（雛形 origin/main）: ${templateCommit ?? '（取得不可）'}`);
lines.push('');
lines.push('## 採用repo（origin/main 確定commit）');
lines.push('');
lines.push('| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |');
lines.push('|---|---|---|---|');
for (const r of adopterRows) {
  if (!r.available) {
    lines.push(`| ${r.name} | （取得不可） | - | - |`);
    continue;
  }
  lines.push(`| ${r.name} | ${r.app_version ?? '?'} | ${r.core_pinned_tag ?? '?'} | ${r.app_commit ?? '?'} |`);
}
lines.push('');
lines.push('## verified（検証済み組合せ・11 §0.5）');
lines.push('');
if (verified.length === 0) {
  lines.push('（未登録。`--verified-entry app=...,core_tag=...,evidence=...,verified_at=...` で追加）');
} else {
  lines.push('| app | core_tag | template_commit | app_commit | verified_at | verified_by | evidence |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const v of verified) {
    lines.push(
      `| ${v.app} | ${v.core_tag} | ${v.template_commit ?? '-'} | ${v.app_commit ?? '-'} | ${v.verified_at ?? '-'} | ${v.verified_by ?? '-'} | ${v.evidence ?? '-'} |`,
    );
  }
}
lines.push('');
lines.push('## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）');
lines.push('');
for (const [key, value] of Object.entries(sourceHashes)) {
  lines.push(`- \`${key}\`: ${value}`);
}
lines.push('');
writeFileSync(join(outDir, 'version-matrix.md'), `${lines.join('\n')}\n`, 'utf8');

console.log(`version matrix written: ${outDir}`);
console.log(`  core: ${coreLabel}`);
console.log(`  template_commit: ${templateCommit ?? '(取得不可)'}`);
for (const r of adopterRows) {
  console.log(`  adopter: ${r.name} → ${r.available ? `core=${r.core_pinned_tag} @${r.app_commit?.slice(0, 12)}` : '取得不可'}`);
}
console.log(`  verified entries: ${verified.length}`);
