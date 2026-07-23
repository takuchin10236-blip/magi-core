/**
 * collect-version-matrix — 版同期・検証済み組合せ一覧の機械収集（v0.5・最小実装）。
 *
 * 仕様: 候補_版同期_検証済み組合せ一覧_自動生成仕様.md §3。
 *   数字は機械に写させ、人は判断だけ書く。本スクリプトは読取専用（他repoへ書かない）。
 *
 * 収集:
 *   1) core の git tag 一覧 と package.json version（タグなき版は「作業中」）
 *   2) 引数で渡す採用repo群（既定: magi-webapp-template / magi-resident-spine）の
 *      package.json にある @magi/core 固定タグ
 *   3) 各repoの origin/main HEAD と ローカルHEAD の乖離・dirty
 * 出力: docs/verified-combos/version-matrix.json ＋ .md（このworktree内のみ）。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const coreRoot = join(here, '..');

function git(cwd: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function readPackageJson(repoRoot: string): { version?: string; deps: Record<string, string> } | null {
  try {
    const raw = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
      version?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return {
      version: raw.version,
      deps: { ...(raw.dependencies ?? {}), ...(raw.devDependencies ?? {}) },
    };
  } catch {
    return null;
  }
}

function pinnedCoreTag(deps: Record<string, string>): string {
  const spec = deps['@magi/core'];
  if (!spec) return '（未参照）';
  // git+...#v0.4.4 / npm:...@v0.4.4 / file:... など。タグ部分を素朴に取り出す。
  const tagMatch = spec.match(/#(v?\d+\.\d+\.\d+[^\s]*)/) ?? spec.match(/@(v?\d+\.\d+\.\d+[^\s]*)$/);
  if (tagMatch) return tagMatch[1];
  if (spec.startsWith('file:') || spec.startsWith('link:') || spec.startsWith('workspace:')) return `（ローカル参照: ${spec}）`;
  return spec;
}

function repoStatus(repoRoot: string) {
  const localHead = git(repoRoot, ['rev-parse', '--short', 'HEAD']);
  if (localHead === null) return { available: false as const };
  const originHead = git(repoRoot, ['rev-parse', '--short', 'origin/main']);
  const dirtyRaw = git(repoRoot, ['status', '--porcelain']);
  const dirty = dirtyRaw !== null && dirtyRaw.length > 0;
  const diverged = originHead !== null && originHead !== localHead;
  return { available: true as const, localHead, originHead, dirty, diverged };
}

// --- core 側 ---
const corePkg = readPackageJson(coreRoot);
const coreVersion = corePkg?.version ?? '（不明）';
const coreTags = (git(coreRoot, ['tag', '--list']) ?? '')
  .split('\n')
  .map((t) => t.trim())
  .filter(Boolean);
const coreVersionTag = `v${coreVersion}`;
const coreVersionHasTag = coreTags.includes(coreVersionTag) || coreTags.includes(coreVersion);
const coreLabel = coreVersionHasTag ? coreVersionTag : `${coreVersionTag}（作業中・タグ未作成）`;

// --- 採用repo群 ---
const argRepos = process.argv.slice(2);
const defaultRepos = [
  join(homedir(), 'Documents', 'magi-webapp-template'),
  join(homedir(), 'Documents', 'magi-resident-spine'),
];
const repoRoots = argRepos.length > 0 ? argRepos : defaultRepos;

const adopters = repoRoots.map((repoRoot) => {
  const pkg = readPackageJson(repoRoot);
  const status = repoStatus(repoRoot);
  return {
    repo: repoRoot,
    available: status.available && pkg !== null,
    app_version: pkg?.version ?? null,
    core_pinned_tag: pkg ? pinnedCoreTag(pkg.deps) : null,
    local_head: status.available ? status.localHead : null,
    origin_head: status.available ? status.originHead : null,
    dirty: status.available ? status.dirty : null,
    diverged: status.available ? status.diverged : null,
  };
});

const generatedAt = new Date().toISOString();
const matrix = {
  generated_at: generatedAt,
  note: '機械生成。手書き版番号は禁止（候補_版同期_検証済み組合せ一覧_自動生成仕様.md）。',
  core: {
    version: coreVersion,
    version_tag: coreVersionTag,
    version_has_tag: coreVersionHasTag,
    label: coreLabel,
    tags: coreTags,
  },
  adopters,
};

const outDir = join(coreRoot, 'docs', 'verified-combos');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'version-matrix.json'), `${JSON.stringify(matrix, null, 2)}\n`, 'utf8');

// --- 人間用 .md（JSONから整形） ---
const lines: string[] = [];
lines.push('# 版同期・検証済み組合せ一覧（機械生成）');
lines.push('');
lines.push('> このファイルは `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。');
lines.push('');
lines.push(`- 生成時刻: ${generatedAt}`);
lines.push(`- Core: **${coreLabel}**（tag数: ${coreTags.length}）`);
lines.push('');
lines.push('| 採用repo | app version | @magi/core 固定タグ | local HEAD | origin/main | 乖離 | dirty |');
lines.push('|---|---|---|---|---|---|---|');
for (const a of adopters) {
  if (!a.available) {
    lines.push(`| ${a.repo} | （取得不可） | - | - | - | - | - |`);
    continue;
  }
  lines.push(
    `| ${a.repo} | ${a.app_version ?? '?'} | ${a.core_pinned_tag ?? '?'} | ${a.local_head ?? '?'} | ${a.origin_head ?? '?'} | ${a.diverged ? '⚠️あり' : 'なし'} | ${a.dirty ? '⚠️あり' : 'なし'} |`,
  );
}
lines.push('');
lines.push('※ タグなき版は「作業中」。「検証済み」の確定（verified_at/evidence）は U4 検収green の記録から別途機械転記する（本最小実装は版の現況収集のみ）。');
lines.push('');
writeFileSync(join(outDir, 'version-matrix.md'), `${lines.join('\n')}\n`, 'utf8');

console.log(`version matrix written: ${outDir}`);
console.log(`  core: ${coreLabel}`);
for (const a of adopters) {
  console.log(`  adopter: ${a.repo} → ${a.available ? `core=${a.core_pinned_tag}` : '取得不可'}`);
}
