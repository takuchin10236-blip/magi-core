#!/usr/bin/env node
/**
 * 操作者チップのラベルが、実ブラウザで**本当に**枠へ収まるかを測る（v0.27.0 / 2026-09-05）。
 *
 * なぜ在るか:
 *   2026-09-05、17字の職員名が幅180pxのチップからはみ出して切れていた。
 *   jsdom はレイアウトを計算しないので `scrollWidth` は常に 0——机上の試験では絶対に見つからない。
 *   だから**実ブラウザで数える**。写真ではなく `scrollWidth <= clientWidth` の計算値で判定する。
 *
 * 使い方:
 *   node scripts/verify-operator-fit.mjs
 *   任意: --chars 6,13,17,20  --width 180  --chrome <path>  --playwright <dir>
 *
 * 注意: playwright-core は @magi/core の依存に**入れていない**（package.json を動かすと
 *   verify:matrix の版SoTが失効する＝dev/screenshot.mjs と同じ事情）。採用アプリ側の
 *   node_modules を借りる。既定は ../magi-renraku-note/node_modules/playwright-core。
 *   借りられない時は「測れなかった」として **exit 2** で落ちる（緑にはしない）。
 *
 * 終了コード: 0=全部収まった / 1=はみ出しあり / 2=測れなかった（環境不足）
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const charCounts = arg('chars', '6,13,17,20').split(',').map((n) => Number(n.trim())).filter((n) => n > 0);
const chipWidth = Number(arg('width', '180'));
const chromePath =
  arg('chrome', process.env.PLAYWRIGHT_CHROME_PATH) ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const playwrightDirs = [
  arg('playwright', ''),
  resolve(repoRoot, 'node_modules/playwright-core'),
  resolve(repoRoot, '../magi-renraku-note/node_modules/playwright-core'),
  resolve(repoRoot, '../magi-resident-adl/node_modules/playwright-core'),
  resolve(repoRoot, '../magi-manual-hub/node_modules/playwright-core'),
].filter(Boolean);
const playwrightDir = playwrightDirs.find((dir) => existsSync(dir));
if (!playwrightDir) {
  console.error('[verify-operator-fit] playwright-core が見つからない＝測れていない。');
  console.error('  探した場所:\n    ' + playwrightDirs.join('\n    '));
  process.exit(2);
}
if (!existsSync(chromePath)) {
  console.error(`[verify-operator-fit] Chrome が見つからない＝測れていない: ${chromePath}`);
  process.exit(2);
}
const { chromium } = await import(pathToFileURL(join(playwrightDir, 'index.mjs')).href);

// CSS も算法も**現物**を読む（写しを置くと、直したのに試験は昔のままになる＝2026-09-05 の実害）。
// 算法はブラウザへ **dist の実物をそのまま流し込んで呼ぶ**——ここで手写しの再実装をすると、
// 本体を壊しても試験が緑のままになる（今夜、負例で実証した穴）。
const css = readFileSync(join(repoRoot, 'src/ui/design-system.css'), 'utf8');
const fitSrcPath = join(repoRoot, 'src/ui/operatorFit.ts');
const fitDistPath = join(repoRoot, 'dist/ui/operatorFit.js');
if (!existsSync(fitDistPath)) {
  console.error('[verify-operator-fit] dist/ui/operatorFit.js が無い＝測れていない。先に `npm run build`。');
  process.exit(2);
}
if (statSync(fitSrcPath).mtimeMs > statSync(fitDistPath).mtimeMs) {
  console.error('[verify-operator-fit] src が dist より新しい＝古い算法を測ってしまう。先に `npm run build`。');
  process.exit(2);
}
const fitModule = readFileSync(fitDistPath, 'utf8');

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (err) => pageErrors.push(String(err)));
await page.setContent(
  `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}
   body{margin:0;padding:20px;}
   .op-icon{width:16px;height:16px;flex:0 0 16px;background:currentColor;}
   /* 最悪ケースの字幅で測る＝全角かなが 1文字＝1em で送るフォント。
      headless では Web フォント（Plus Jakarta Sans / Noto Sans JP）が読めず、
      代替フォントの方が狭く出る＝甘い判定になるため、明示して固定する。 */
   .operator-chip-label{font-family:"Hiragino Sans","Noto Sans JP","Yu Gothic UI",sans-serif;}
  </style></head><body class="magi-app">
   <button class="operator-chip is-set is-fixed" style="width:${chipWidth}px">
     <span class="op-icon"></span><span class="operator-chip-label" id="L"></span>
   </button>
  </body></html>`,
);

// dist の実物を module として読み込み、window へ載せる（再実装しない）。
await page.addScriptTag({
  content: `${fitModule}\nwindow.__magiFit = { fitOperatorLabel, domFitTarget, FIT_MIN_PX, FIT_BASE_PX };`,
  type: 'module',
});
await page.waitForFunction(() => Boolean(window.__magiFit));

const rows = await page.evaluate(({ counts }) => {
  const { fitOperatorLabel, domFitTarget } = window.__magiFit;
  const span = document.getElementById('L');
  const out = [];
  for (const chars of counts) {
    // 全角の日本語で刻む（外国籍職員の長いカタカナ氏名が実在＝これが最悪ケース）。
    span.textContent = 'ア'.repeat(chars);
    span.style.fontSize = '';
    span.style.letterSpacing = '';
    const base = span.scrollWidth;
    const result = fitOperatorLabel(domFitTarget(span));   // ← 本体をそのまま呼ぶ
    out.push({
      chars,
      inner: span.clientWidth,
      needAtBase: base,
      fontSize: result.fontSize,
      letterSpacing: Number(result.letterSpacing.toFixed(2)),
      overflowed: result.overflowed,
      fits: span.scrollWidth <= span.clientWidth,
    });
  }
  return out;
}, { counts: charCounts });
await browser.close();

console.log(`[verify-operator-fit] チップ幅 ${chipWidth}px / ラベル内寸 ${rows[0]?.inner}px`);
console.table(rows);
if (pageErrors.length > 0) {
  console.error('[verify-operator-fit] ページで例外が出た＝測れていない:\n  ' + pageErrors.join('\n  '));
  process.exit(2);
}
if (rows.length !== charCounts.length) {
  console.error('[verify-operator-fit] 測れた行数が指定と合わない＝測れていない。');
  process.exit(2);
}
const cut = rows.filter((r) => !r.fits || r.overflowed);
if (cut.length > 0) {
  console.error(`[verify-operator-fit] 枠からはみ出す: ${cut.map((r) => `${r.chars}字`).join(', ')}`);
  process.exit(1);
}
console.log(`[verify-operator-fit] OK — ${charCounts.join('/')}字すべてが枠に収まった。`);
