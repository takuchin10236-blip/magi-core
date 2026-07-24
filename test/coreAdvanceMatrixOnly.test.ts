import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error .mjs（型定義なし・実行時JS）を import
import { coreAdvanceIsMatrixOnly } from '../scripts/version-matrix-sources.mjs';

// Sol 収束修正: matrix を commit→push して core origin/main が前進した時、その前進が
//   docs/verified-combos/ 配下のみなら freshness の自己失効を例外合格する判定の検証。
//   一時 git repo に決定的なコミット列を作って判定する（実 repo 履歴に依存しない）。

let repo: string;
let base = '';
let matrixOnly = ''; // base→ここは docs/verified-combos/ のみ
let withScripts = ''; // matrixOnly→ここは scripts/ を含む
let divergent = ''; // base から分岐（matrixOnly の祖先でない）

function g(args: string[], cwd = repo): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}
function commitFile(path: string, content: string, msg: string): string {
  const full = join(repo, path);
  mkdirSync(join(repo, path.split('/').slice(0, -1).join('/')), { recursive: true });
  writeFileSync(full, content);
  g(['add', '-A']);
  g(['commit', '-q', '-m', msg]);
  return g(['rev-parse', 'HEAD']);
}

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'car-'));
  g(['init', '-q', '-b', 'main']);
  g(['config', 'user.email', 'test@example.com']);
  g(['config', 'user.name', 'test']);
  base = commitFile('README.md', 'base\n', 'base');
  matrixOnly = commitFile('docs/verified-combos/version-matrix.json', '{"a":1}\n', 'docs matrix only');
  withScripts = commitFile('scripts/collect.mjs', 'x\n', 'scripts change');
  // base から分岐した別コミット（matrixOnly の祖先でない）
  g(['checkout', '-q', '-b', 'side', base]);
  divergent = commitFile('other.txt', 'side\n', 'side commit');
  g(['checkout', '-q', 'main']);
});

afterAll(() => {
  if (repo) rmSync(repo, { recursive: true, force: true });
});

describe('coreAdvanceIsMatrixOnly（freshness 自己失効の収束）', () => {
  it('matrix生成物のみの前進 → true（例外合格＝exit 0 相当）', () => {
    expect(coreAdvanceIsMatrixOnly(repo, base, matrixOnly)).toBe(true);
  });
  it('scripts 等を含む前進 → false（従来どおり不一致＝exit 1 相当）', () => {
    expect(coreAdvanceIsMatrixOnly(repo, base, withScripts)).toBe(false);
    expect(coreAdvanceIsMatrixOnly(repo, matrixOnly, withScripts)).toBe(false);
  });
  it('非祖先（stored が now の祖先でない）→ false（判定不能は fail 側）', () => {
    // divergent は matrixOnly の祖先でない。divergent..matrixOnly は matrixOnly 系の全変更を含む。
    expect(coreAdvanceIsMatrixOnly(repo, divergent, matrixOnly)).toBe(false);
  });
  it('同一・空・null → false', () => {
    expect(coreAdvanceIsMatrixOnly(repo, base, base)).toBe(false);
    expect(coreAdvanceIsMatrixOnly(repo, '', matrixOnly)).toBe(false);
    expect(coreAdvanceIsMatrixOnly(repo, null, matrixOnly)).toBe(false);
  });
});
