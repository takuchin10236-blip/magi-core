/**
 * CIガード負例試験の共通ハーネス（v0.9.4）。
 *
 * ci/check-ui-guardrails.mjs は「アプリ一式」を検査するスクリプトなので、
 *   一時ディレクトリに**他の検査は通る最小アプリ**を作り、試したい1点だけを差し替えて
 *   exit code を見る。ここはその土台（zIndexGuard / writeDetectorGuard から使う）。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const guardScriptPath = join(here, '..', 'ci', 'check-ui-guardrails.mjs');

const BASE_CSS = `:root[data-ui-preset="standard-lumen"][data-color-mode="white"] {
  --primary: #6bbf95;
  --accent: #6bbf95;
  --display-font: 'Plus Jakarta Sans Variable', sans-serif;
}
`;

const BASE_APP_TSX = `import { MagiAppShell, BusinessNav } from '@magi/core/ui';
export const App = () => <MagiAppShell appName="x" facilityName="y" nav={<BusinessNav activeTab="a" onNavigate={() => {}} tabs={[]} />}>本文</MagiAppShell>;
`;

export interface FixtureOptions {
  /** src/styles/index.css の末尾へ足す CSS。 */
  css?: string;
  /** src/App.tsx をまるごと差し替える（既定は AppShell 型の最小アプリ）。 */
  appTsx?: string;
  /** TYPE_DEVIATIONS.md の中身（承認機構の試験用）。 */
  deviations?: string;
}

/** 他の検査は通る最小アプリを一時ディレクトリに作り、root パスを返す。 */
export function makeGuardFixture({ css = '', appTsx = BASE_APP_TSX, deviations }: FixtureOptions = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'magi-guard-'));
  mkdirSync(join(root, 'src', 'styles'), { recursive: true });
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'guard-fixture' }));
  writeFileSync(join(root, 'src', 'styles', 'index.css'), `${BASE_CSS}${css}\n`);
  writeFileSync(join(root, 'src', 'App.tsx'), appTsx);
  if (deviations) writeFileSync(join(root, 'TYPE_DEVIATIONS.md'), deviations);
  return root;
}

/** ガードを走らせて exit code と出力を返す。 */
export function runGuard(root: string): { code: number; out: string } {
  try {
    const out = execFileSync('node', [guardScriptPath], {
      encoding: 'utf8',
      env: { ...process.env, MAGI_CORE_GUARD_ROOT: root },
    });
    return { code: 0, out };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}
