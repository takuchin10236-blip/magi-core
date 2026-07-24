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
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

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

export function coreTagList(coreRoot) {
  return (git(coreRoot, ['tag', '--list']) ?? '')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);
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
