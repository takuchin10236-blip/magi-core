import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// verify:matrix の負例（Sol R1-C1-VERSION-SOT 最終）: 記録値/申告/evidence を改竄すると exit 1。
//   MAGI_MATRIX_PATH で一時 matrix を差し替え、node scripts/verify-version-matrix.mjs の exit code を見る。
//   源泉（package.json / origin HEAD / tag deref / evidence 内容）は実物のまま＝改竄だけが落ちる。
//   ※ どのケースも「exit 1」を要求するため、採用repo有無に依存せず頑健（不一致で必ず落ちる）。

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(here, '..', 'scripts', 'verify-version-matrix.mjs');
const realMatrixPath = join(here, '..', 'docs', 'verified-combos', 'version-matrix.json');
const base = JSON.parse(readFileSync(realMatrixPath, 'utf8'));

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function runVerify(matrixObj: unknown): number {
  const dir = mkdtempSync(join(tmpdir(), 'vm-'));
  const p = join(dir, 'version-matrix.json');
  writeFileSync(p, JSON.stringify(matrixObj, null, 2));
  try {
    execFileSync('node', [scriptPath], { env: { ...process.env, MAGI_MATRIX_PATH: p }, stdio: 'pipe' });
    return 0;
  } catch (err) {
    return (err as { status?: number }).status ?? 1;
  }
}

// 一時 evidence ログを作り、絶対パスと sha256 を返す（失敗/無関係ログの検証用）。
function tempEvidence(content: string): { path: string; sha: string } {
  const dir = mkdtempSync(join(tmpdir(), 'ev-'));
  const p = join(dir, 'evidence.log');
  writeFileSync(p, content);
  return { path: p, sha: sha256(content) };
}

function firstVerified(m: Record<string, unknown>): Record<string, unknown> {
  const v = m.verified as Array<Record<string, unknown>>;
  return v[0];
}

describe('verify:matrix 負例（Sol R1-C1 最終・改竄→exit 1）', () => {
  it('source_hash 改竄 → exit 1', () => {
    const m = structuredClone(base);
    const key = Object.keys(m.source_hashes)[0];
    m.source_hashes[key] = 'deadbeef';
    expect(runVerify(m)).toBe(1);
  });
  it('freshness: origin/main HEAD 前進（改竄）→ exit 1', () => {
    const m = structuredClone(base);
    const key = Object.keys(m.freshness_targets).find((k: string) => k.endsWith('origin-main-head'));
    m.freshness_targets[key as string] = '0'.repeat(40);
    expect(runVerify(m)).toBe(1);
  });
  it('freshness: Coreタグ deref 先の移動（改竄）→ exit 1', () => {
    const m = structuredClone(base);
    m.freshness_targets['core:version-tag-commit'] = 'c'.repeat(40);
    expect(runVerify(m)).toBe(1);
  });

  // ── verified 束縛の負例（round2 追加） ──
  it('偽 app_commit → exit 1', () => {
    const m = structuredClone(base);
    firstVerified(m).app_commit = 'f'.repeat(40);
    expect(runVerify(m)).toBe(1);
  });
  it('偽 core_tag（収集済みタグに無い）→ exit 1', () => {
    const m = structuredClone(base);
    firstVerified(m).core_tag = 'v9.9.9';
    expect(runVerify(m)).toBe(1);
  });
  it('失敗ログ（成功マーカーなし）→ exit 1', () => {
    const m = structuredClone(base);
    const tag = String(firstVerified(m).core_tag);
    const ev = tempEvidence(`build broken\n${tag}\n3 tests failing but not zero-fail\n`);
    firstVerified(m).evidence = ev.path;
    firstVerified(m).evidence_sha256 = ev.sha;
    expect(runVerify(m)).toBe(1);
  });
  it('無関係ログ（core_tag 文字列を含まない）→ exit 1', () => {
    const m = structuredClone(base);
    const ev = tempEvidence('all green\nCHECK_EXIT=0\nfail 0\nnothing about the tag here\n');
    firstVerified(m).evidence = ev.path;
    firstVerified(m).evidence_sha256 = ev.sha;
    expect(runVerify(m)).toBe(1);
  });
  it('evidence 事後改変（evidence_sha256 不一致）→ exit 1', () => {
    const m = structuredClone(base);
    firstVerified(m).evidence_sha256 = 'deadbeef';
    expect(runVerify(m)).toBe(1);
  });
  it('verified の null field → exit 1', () => {
    const m = structuredClone(base);
    firstVerified(m).verified_by = null;
    expect(runVerify(m)).toBe(1);
  });
  it('verified の不在 evidence → exit 1', () => {
    const m = structuredClone(base);
    firstVerified(m).evidence = 'magi-goal-work/does-not-exist-xyz-9999.log';
    expect(runVerify(m)).toBe(1);
  });

  it('matrix ファイル欠落 → exit 1', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vm-'));
    const missing = join(dir, 'nope.json');
    let code = 0;
    try {
      execFileSync('node', [scriptPath], { env: { ...process.env, MAGI_MATRIX_PATH: missing }, stdio: 'pipe' });
    } catch (err) {
      code = (err as { status?: number }).status ?? 1;
    }
    expect(code).toBe(1);
  });
});
