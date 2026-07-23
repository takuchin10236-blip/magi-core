/**
 * verify:shell — AppShell 部品の回帰ガード（v0.5）。
 *
 * magi-resident-spine origin/main scripts/verify-latest-magi-shell.mts を core 向けに翻案。
 *   利用者マスタ固有の本文検査でなく、Core 部品としての構造不変条件を検査する:
 *     (1) AppShell 部品が index.ts から export されている
 *     (2) declaredStates（DeclarableState）が許可リスト型のまま＝businessLive のみ、
 *         本番URL・書込を表す kind が型に混入していない
 *     (3) 旧パターン（data-tooltip 等）が新規部品に残っていない
 * 実行系（node scripts/*.mjs・ファイルをテキスト読み）に揃え、TS 実行に依存しない。
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (rel) => readFile(fileURLToPath(new URL(rel, root)), 'utf8');

const checks = [];
const fail = [];
function check(label, passed) {
  checks.push([label, passed]);
  if (!passed) fail.push(label);
}

const indexSrc = await read('src/ui/index.ts');
const statusSrc = await read('src/ui/statusDetection.ts');
const shellFiles = await Promise.all(
  [
    'src/ui/SgLumenLogo.tsx',
    'src/ui/ColorModeSwitch.tsx',
    'src/ui/MagiStatusSummary.tsx',
    'src/ui/MagiVersionChip.tsx',
    'src/ui/BusinessNav.tsx',
    'src/ui/MagiAppShell.tsx',
  ].map(read),
);

// (1) export 存在
for (const name of [
  'SgLumenLogo',
  'ColorModeSwitch',
  'MagiStatusSummary',
  'MagiVersionChip',
  'BusinessNav',
  'MagiAppShell',
  'detectRuntime',
  'validateDeclaredState',
  'deriveStatusDisplay',
]) {
  check(`export: ${name}`, indexSrc.includes(name));
}

// (2) DeclarableState 許可リスト検査
check('DeclarableState は businessLive を持つ', /kind:\s*'businessLive'/.test(statusSrc));
const declarableBlock = statusSrc.slice(
  statusSrc.indexOf('export type DeclarableState'),
  statusSrc.indexOf('export type DeclaredStateValidation'),
);
for (const forbidden of ['production', 'preview', 'writable', 'writeOn', 'productionUrl']) {
  check(
    `DeclarableState に禁止 kind '${forbidden}' が無い`,
    !new RegExp(`kind:\\s*'${forbidden}'`).test(declarableBlock),
  );
}

// (3) 旧パターン不在（data-tooltip の見切れ事故を再発させない）
for (const [i, src] of shellFiles.entries()) {
  check(`旧tooltip不在 [shellFile#${i}]`, !src.includes('data-tooltip'));
}

for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'}: ${label}`);
}
if (fail.length > 0) {
  console.error(`\nverify:shell FAILED: ${fail.length} 件`);
  process.exit(1);
}
console.log(`\nAppShell shell verify: ${checks.length} checks passed`);
