/**
 * (g) 重なり順の CIガード負例試験（v0.9.3・社長裁定「潜り込み表示を型で止める」）。
 *
 * アプリ側 CSS の z-index が上限 100（--magi-z-app-sticky-max）を超えたら exit 1。
 *   一時ディレクトリに最小のアプリ一式（標準トークン＋AppShell型のsrc）を作り、
 *   CSS の z-index だけを差し替えて ci/check-ui-guardrails.mjs の exit code を見る。
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(here, '..', 'ci', 'check-ui-guardrails.mjs');

/** 他の検査（標準値・シェル構造）は通る最小アプリを作り、CSS の一部だけ差し替える。 */
function makeApp(cssSnippet: string, deviations?: string): string {
  const root = mkdtempSync(join(tmpdir(), 'zguard-'));
  mkdirSync(join(root, 'src', 'styles'), { recursive: true });
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'zguard-fixture' }));
  writeFileSync(
    join(root, 'src', 'styles', 'index.css'),
    `:root[data-ui-preset="standard-lumen"][data-color-mode="white"] {
  --primary: #6bbf95;
  --accent: #6bbf95;
  --display-font: 'Plus Jakarta Sans Variable', sans-serif;
}
${cssSnippet}
`,
  );
  writeFileSync(
    join(root, 'src', 'App.tsx'),
    `import { MagiAppShell, BusinessNav } from '@magi/core/ui';
export const App = () => <MagiAppShell appName="x" facilityName="y" nav={<BusinessNav activeTab="a" onNavigate={() => {}} tabs={[]} />}>本文</MagiAppShell>;
`,
  );
  if (deviations) writeFileSync(join(root, 'TYPE_DEVIATIONS.md'), deviations);
  return root;
}

function runGuard(root: string): { code: number; out: string } {
  try {
    const out = execFileSync('node', [scriptPath], {
      encoding: 'utf8',
      env: { ...process.env, MAGI_CORE_GUARD_ROOT: root },
    });
    return { code: 0, out };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

describe('(g) 重なり順: アプリ側 z-index の上限', () => {
  it('101 は落ちる（exit 1・場所を示す）', () => {
    const { code, out } = runGuard(makeApp('.toolbar { position: sticky; z-index: 101; }'));
    expect(code).toBe(1);
    expect(out).toContain('(g) 重なり順');
    expect(out).toContain('z-index: 101');
    expect(out).toContain('src/styles/index.css');
  });

  it('55 は通る（exit 0）', () => {
    const { code, out } = runGuard(makeApp('.toolbar { position: sticky; z-index: 55; }'));
    expect(code).toBe(0);
    expect(out).toContain('(g) 重なり順: アプリ側 z-index は上限 100');
  });

  it('境界: 100 は通り、101 で落ちる', () => {
    expect(runGuard(makeApp('.a { z-index: 100; }')).code).toBe(0);
    expect(runGuard(makeApp('.a { z-index: 101; }')).code).toBe(1);
  });

  it('@media print の中は対象外', () => {
    const { code } = runGuard(makeApp('@media print {\n  .a { z-index: 9999; }\n}'));
    expect(code).toBe(0);
  });

  it('負値・auto は対象外', () => {
    expect(runGuard(makeApp('.a { z-index: -1; }\n.b { z-index: auto; }')).code).toBe(0);
  });

  it('コメント内の記述は拾わない', () => {
    const { code } = runGuard(makeApp('/* 昔は z-index: 9999 だった */\n.a { z-index: 10; }'));
    expect(code).toBe(0);
  });

  it('var(--magi-z-*) の参照は合法（序列は Core が保証）', () => {
    const { code } = runGuard(makeApp('.a { z-index: var(--magi-z-popover, 400); }'));
    expect(code).toBe(0);
  });

  it('独自変数の fallback が上限超なら落ちる', () => {
    const { code, out } = runGuard(makeApp('.a { z-index: var(--app-z, 900); }'));
    expect(code).toBe(1);
    expect(out).toContain('(g) 重なり順');
  });

  it('TYPE_DEVIATIONS.md に UI-ZINDEX の社長承認があれば警告で通す', () => {
    const deviations = [
      '# 型からの逸脱',
      '',
      '| ID | 何を省いた | 理由 | 区分/根拠 | 社長承認日 | status |',
      '| --- | --- | --- | --- | --- | --- |',
      '| UI-ZINDEX | z-index 上限超 | 印刷プレビューの都合 | 区分C | 2026-07-30 | 承認済 |',
      '',
    ].join('\n');
    const { code, out } = runGuard(makeApp('.a { z-index: 500; }', deviations));
    expect(code).toBe(0);
    expect(out).toContain('UI-ZINDEX');
    expect(out).toContain('WARN');
  });
});
