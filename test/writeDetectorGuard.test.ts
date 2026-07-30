/**
 * (c) 禁止パターン「writeDetector のJSX内生成」の負例試験（v0.9.4）。
 *
 * JSX の中で検出器を作ると毎レンダー別参照になり、MagiStatusSummary の検出 effect が
 *   回り続けて観測要求を出し続ける。createHealthWriteDetector は Core 側でシングルトン化して
 *   無害化したが、createEnvWriteDetector 等「呼ぶたび新しい関数を返す」ものは依然事故になる。
 */
import { describe, it, expect } from 'vitest';
import { makeGuardFixture, runGuard } from './guardFixture';

const shell = (body: string) => `import { MagiAppShell, BusinessNav, MagiStatusSummary, createHealthWriteDetector, createEnvWriteDetector } from '@magi/core/ui';
${body}
`;

describe('(c) 禁止パターン: writeDetector のJSX内生成', () => {
  it('JSX 内で createEnvWriteDetector を呼んでいたら落ちる', () => {
    const { code, out } = runGuard(
      makeGuardFixture({
        appTsx: shell(
          'export const App = () => <MagiAppShell appName="x" facilityName="y"><MagiStatusSummary writeDetector={createEnvWriteDetector(() => true)} /></MagiAppShell>;',
        ),
      }),
    );
    expect(code).toBe(1);
    expect(out).toContain('writeDetector のJSX内生成');
    expect(out).toContain('module定数か useMemo へ退避');
  });

  it('JSX 内で createHealthWriteDetector を呼ぶ形も落とす（作法として統一）', () => {
    const { code, out } = runGuard(
      makeGuardFixture({
        appTsx: shell(
          'export const App = () => <MagiAppShell appName="x" facilityName="y"><MagiStatusSummary writeDetector={createHealthWriteDetector()} /></MagiAppShell>;',
        ),
      }),
    );
    expect(code).toBe(1);
    expect(out).toContain('writeDetector のJSX内生成');
  });

  it('module 定数へ退避した書き方は通る', () => {
    const { code, out } = runGuard(
      makeGuardFixture({
        appTsx: shell(
          [
            'const writeDetector = createHealthWriteDetector();',
            'export const App = () => <MagiAppShell appName="x" facilityName="y"><MagiStatusSummary writeDetector={writeDetector} /></MagiAppShell>;',
          ].join('\n'),
        ),
      }),
    );
    expect(code).toBe(0);
    expect(out).not.toContain('writeDetector のJSX内生成');
  });

  it('コメント・文字列の中の記述は拾わない（既存の除去機構どおり）', () => {
    const { code } = runGuard(
      makeGuardFixture({
        appTsx: shell(
          [
            '// 昔は writeDetector={createHealthWriteDetector()} と書いていた',
            "const note = 'writeDetector={createEnvWriteDetector(() => true)}';",
            'const writeDetector = createHealthWriteDetector();',
            'export const App = () => <MagiAppShell appName={note} facilityName="y"><MagiStatusSummary writeDetector={writeDetector} /></MagiAppShell>;',
          ].join('\n'),
        ),
      }),
    );
    expect(code).toBe(0);
  });
});
