import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// verify:matrix の負例（Sol R1-C1-VERSION-SOT 最終）: 記録値を改竄すると exit 1 になることを検証。
//   MAGI_MATRIX_PATH で一時 matrix を差し替え、node scripts/verify-version-matrix.mjs の exit code を見る。
//   源泉（package.json / origin HEAD 等）は実物のまま＝改竄した記録値だけが不一致で落ちることを確認する。
//   ※ どのケースも「exit 1」を要求するため、採用repo有無に依存せず頑健（不一致で必ず落ちる）。

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(here, '..', 'scripts', 'verify-version-matrix.mjs');
const realMatrixPath = join(here, '..', 'docs', 'verified-combos', 'version-matrix.json');
const base = JSON.parse(readFileSync(realMatrixPath, 'utf8'));

function runVerify(matrixObj: unknown): number {
  const dir = mkdtempSync(join(tmpdir(), 'vm-'));
  const p = join(dir, 'version-matrix.json');
  writeFileSync(p, JSON.stringify(matrixObj, null, 2));
  try {
    execFileSync('node', [scriptPath], {
      env: { ...process.env, MAGI_MATRIX_PATH: p },
      stdio: 'pipe',
    });
    return 0;
  } catch (err) {
    return (err as { status?: number }).status ?? 1;
  }
}

function completeVerifiedEntry() {
  return {
    app: '@magi/core',
    core_tag: 'v0.5.3',
    template_commit: 'a'.repeat(40),
    app_commit: 'b'.repeat(40),
    verified_at: '2026-07-24T10:30:00Z',
    verified_by: 'tachikoma',
    evidence: 'magi-goal-work/GOAL-20260724-002/evidence/core_fix3_test.log',
  };
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
  it('verified の null field → exit 1', () => {
    const m = structuredClone(base);
    m.verified = [completeVerifiedEntry()];
    m.verified[0].verified_by = null;
    expect(runVerify(m)).toBe(1);
  });
  it('verified の不在 evidence → exit 1', () => {
    const m = structuredClone(base);
    m.verified = [completeVerifiedEntry()];
    m.verified[0].evidence = 'magi-goal-work/does-not-exist-xyz-9999.log';
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
