/**
 * version-matrix-sources — collect-version-matrix と verify-version-matrix が共有する
 *   「読取元」定義とハッシュ計算（Sol R1-C1-VERSION-SOT round2）。
 *
 * 設計の要点:
 *   - 固定版は **dirty なローカル作業ツリーでなく `git show origin/main:package.json`（確定commit）** から読む。
 *   - source_hashes は **package.json の内容（版pinの実体）** だけを対象にする。
 *     git tag 一覧は含めない（無関係なタグ追加で committed 版SoT が churn しないように）。
 *   - キーは **repo 名（basename）** で機械独立（絶対パスを版SoTに焼き込まない＝可搬）。
 *   collect と verify が本モジュールを共有することで、両者のハッシュ計算を必ず一致させる。
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';

export function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function git(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** 既定の採用repo（名前＋ローカル解決パス）。名前が版SoTのキー、パスは機械ローカル解決。 */
export function defaultAdopters() {
  const base = join(homedir(), 'Documents');
  return [
    { name: 'magi-webapp-template', path: join(base, 'magi-webapp-template') },
    { name: 'magi-resident-spine', path: join(base, 'magi-resident-spine') },
  ];
}

/** origin/main の確定 package.json を読む（dirty 作業ツリーでなく確定commitから）。 */
export function readOriginMainPackage(repoPath) {
  const raw = git(repoPath, ['show', 'origin/main:package.json']);
  if (raw === null) return null;
  try {
    const p = JSON.parse(raw);
    return {
      version: p.version,
      deps: { ...(p.dependencies ?? {}), ...(p.devDependencies ?? {}) },
      raw,
    };
  } catch {
    return null;
  }
}

/** origin/main の HEAD 完全SHA（機械独立の固定commit識別子）。 */
export function originMainHead(repoPath) {
  return git(repoPath, ['rev-parse', 'origin/main']);
}

/** タグの deref 先 commit（annotated tag の指す実commit）。無ければ null。 */
export function tagDerefCommit(coreRoot, tag) {
  if (!tag) return null;
  return git(coreRoot, ['rev-parse', `${tag}^{commit}`]);
}

export function coreTagList(coreRoot) {
  return (git(coreRoot, ['tag', '--list']) ?? '')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * 鮮度ターゲット（記録値と現在値を比較する commit 群）を決定的に計算（collect と verify で同一）。
 *   - core:version-tag-commit … Core 版タグの deref 先（タグ未作成なら null）
 *   - <name>:origin-main-head … 各採用repoの origin/main HEAD 完全SHA
 *   package.json を変えずに repo が前進／タグが移動したケースを verify:matrix が exit 1 で捉える。
 */
export function computeFreshnessTargets(coreRoot, adopters, coreVersionTag) {
  const targets = {};
  targets['core:version-tag-commit'] = tagDerefCommit(coreRoot, coreVersionTag);
  targets['core:origin-main-head'] = originMainHead(coreRoot); // core自己verified entry(pending)の束縛基準
  for (const adopter of adopters) {
    targets[`${adopter.name}:origin-main-head`] = originMainHead(adopter.path);
  }
  return targets;
}

// ── verified エントリの機械束縛検証（Sol R1-C1-VERSION-SOT 最終・collect/verify 共用） ──

// evidence（相対パス）を magi-goal-work 起点の候補ベースで解決し実在確認する（絶対パスも可）。
const EVIDENCE_BASES = [join(homedir(), 'Documents'), join(homedir(), 'Documents', 'magi-goal-work')];
export function resolveEvidence(evidence) {
  if (!evidence) return null;
  if (isAbsolute(evidence)) return existsSync(evidence) ? evidence : null;
  for (const base of EVIDENCE_BASES) {
    const candidate = join(base, evidence);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

// 機械可読の成功マーカー（exit 0 / CHECK_EXIT=0 / 0 fail 系）。
const SUCCESS_MARKER = /(exit 0|EXIT=0|0 fail|fail 0|0 failed)/i;

/**
 * verified エントリを機械束縛検証する（collect と verify で同一ロジック）。
 *   - 全フィールド非null（evidence_sha256 除く）
 *   - core_tag: pending（当該版タグ未作成）を除き、収集済みタグに実在＋deref解決＋版タグ deref 一致
 *   - app_commit: core行はタグ deref 先（pendingは core origin/main HEAD）、採用repo行は記録 HEAD と一致
 *   - template_commit: 記録値と一致
 *   - evidence: 実在＋成功マーカー＋core_tag 文字列を含む
 *   戻り値 { errors:[], evidenceSha256 }。evidenceSha256 は評価対象ログの SHA-256（事後改変検出用）。
 *   ctx: { coreTags, coreVersionTag, coreVersionHasTag, coreVersionTagCommit, coreOriginMainHead,
 *          appCommitByName:{name:commit}, templateCommit, derefTag:(tag)=>commit|null }
 */
export function validateVerifiedEntry(entry, ctx) {
  const errors = [];
  const app = entry.app;
  const coreTag = entry.core_tag;
  const isCore = app === '@magi/core' || app === 'core';
  const pending = coreTag != null && coreTag === ctx.coreVersionTag && !ctx.coreVersionHasTag;

  for (const key of ['app', 'core_tag', 'template_commit', 'app_commit', 'verified_at', 'verified_by', 'evidence']) {
    if (entry[key] == null || entry[key] === '') errors.push(`必須フィールド '${key}' が空`);
  }

  // (a) core_tag の実在＋deref
  if (coreTag != null && !pending) {
    if (!ctx.coreTags.includes(coreTag)) {
      errors.push(`core_tag '${coreTag}' が収集済みタグ一覧に存在しない`);
    } else {
      const deref = ctx.derefTag(coreTag);
      if (deref == null) errors.push(`core_tag '${coreTag}' の deref 先が解決できない`);
      if (coreTag === ctx.coreVersionTag && deref !== ctx.coreVersionTagCommit) {
        errors.push(`core_tag '${coreTag}' の deref が version_tag_commit と不一致`);
      }
    }
  }

  // (b) app_commit の束縛
  if (isCore) {
    const expect = pending ? ctx.coreOriginMainHead : ctx.coreVersionTagCommit;
    if (entry.app_commit !== expect) {
      errors.push(`core行の app_commit が ${pending ? 'core origin/main HEAD' : 'タグ deref 先'} と不一致`);
    }
  } else {
    const recorded = ctx.appCommitByName[app] ?? null;
    if (recorded == null) errors.push(`app '${app}' が採用repo一覧に無い`);
    else if (entry.app_commit !== recorded) errors.push(`app_commit が採用repo記録の origin/main HEAD と不一致`);
  }

  // template_commit の束縛
  if (entry.template_commit !== ctx.templateCommit) errors.push(`template_commit が記録値と不一致`);

  // (c)(d) evidence: 実在＋成功マーカー＋core_tag 文字列＋SHA-256
  let evidenceSha256 = null;
  if (entry.evidence) {
    const abs = resolveEvidence(entry.evidence);
    if (abs == null) {
      errors.push(`evidence が実在しない: ${entry.evidence}`);
    } else {
      const content = readFileSync(abs, 'utf8');
      if (!SUCCESS_MARKER.test(content)) errors.push('evidence に成功マーカー（exit 0/CHECK_EXIT=0/0 fail）が無い');
      if (coreTag && !content.includes(coreTag)) errors.push(`evidence に core_tag '${coreTag}' 文字列が無い`);
      evidenceSha256 = sha256(content);
    }
  }

  return { errors, evidenceSha256 };
}

/** package.json の @magi/core spec から固定タグを取り出す。 */
export function pinnedCoreTag(deps) {
  const spec = deps?.['@magi/core'];
  if (!spec) return '（未参照）';
  const tagMatch = spec.match(/#(v?\d+\.\d+\.\d+[^\s]*)/) ?? spec.match(/@(v?\d+\.\d+\.\d+[^\s]*)$/);
  if (tagMatch) return tagMatch[1];
  if (spec.startsWith('file:') || spec.startsWith('link:') || spec.startsWith('workspace:')) {
    return `（ローカル参照: ${spec}）`;
  }
  return spec;
}

/**
 * source_hashes を決定的に計算（collect と verify で同一）。
 *   - core:package.json … core 自身の作業ツリー package.json（版bump検知）
 *   - <name>:origin-main:package.json … 各採用repoの origin/main 確定 package.json（pin検知）
 */
export function computeSourceHashes(coreRoot, adopters) {
  const hashes = {};
  try {
    hashes['core:package.json'] = sha256(readFileSync(join(coreRoot, 'package.json'), 'utf8'));
  } catch {
    // core package.json が読めない環境ではキーを立てない（verify 側も同様に欠落＝一致）。
  }
  for (const adopter of adopters) {
    const raw = git(adopter.path, ['show', 'origin/main:package.json']);
    if (raw !== null) hashes[`${adopter.name}:origin-main:package.json`] = sha256(raw);
  }
  return hashes;
}
