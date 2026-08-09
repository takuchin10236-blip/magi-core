#!/usr/bin/env node
/**
 * ショーケースの3モード撮影＋コンソール監視（M1の検収道具）。
 *
 * なぜ在るか: 「3モードで見た」「エラーは無かった」を人の記憶で言わないため。
 *   撮る・数える・落とすところまで機械にやらせて、結果をそのまま報告に貼る。
 *
 * 使い方（dev サーバを起動した状態で）:
 *   node dev/screenshot.mjs --url http://127.0.0.1:5273 --out /tmp/shots
 *   任意: --modes white,dusk,dark  --preset standard-lumen  --chrome <path>  --width 1440
 *
 * 終了コード: コンソールの error / ページ例外 / リクエスト失敗が1件でもあれば 1。
 *   （撮影自体は最後まで行い、何が起きたかを全部出してから落とす）
 *
 * 注意: playwright-core は @magi/core の依存に**入れていない**（package.json を動かすと
 *   verify:matrix の版SoTが失効するため）。採用アプリ側の node_modules を借りるか、
 *   一時的に node_modules へ symlink して使う（node_modules は git 管理外）。
 */
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const url = arg('url', 'http://127.0.0.1:5273');
const outDir = resolve(arg('out', '/tmp/magi-core-showcase-shots'));
const modes = arg('modes', 'white,dusk,dark').split(',').map((m) => m.trim()).filter(Boolean);
const preset = arg('preset', 'standard-lumen');
const width = Number(arg('width', '1440'));
const chromePath =
  arg('chrome', process.env.PLAYWRIGHT_CHROME_PATH) ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const problems = [];
const shots = [];

for (const mode of modes) {
  // localStorage を持ち越さない＝URL 指定の初期モードが必ず効く（撮り分けの再現性）。
  // 全体像は縦が長い（1万px超）。DPR2 だと Chrome の最大テクスチャ幅を超えて継ぎ接ぎになるため等倍で撮る。
  const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      problems.push({ mode, kind: `console.${type}`, text: msg.text() });
    }
  });
  page.on('pageerror', (err) => problems.push({ mode, kind: 'pageerror', text: String(err) }));
  page.on('requestfailed', (req) =>
    problems.push({ mode, kind: 'requestfailed', text: `${req.url()} — ${req.failure()?.errorText ?? ''}` }),
  );

  const target = `${url}/?mode=${encodeURIComponent(mode)}&preset=${encodeURIComponent(preset)}`;
  await page.goto(target, { waitUntil: 'networkidle' });
  // 監査リスト（最終節）まで描けていることを描画完了の合図にする。
  await page.waitForSelector('#audit', { state: 'attached', timeout: 15000 });
  const applied = await page.evaluate(() => ({
    colorMode: document.documentElement.dataset.colorMode,
    uiMode: document.documentElement.dataset.uiMode,
    sections: document.querySelectorAll('.ds-section').length,
  }));
  if (applied.colorMode !== mode) {
    problems.push({ mode, kind: 'mode-mismatch', text: `data-color-mode=${applied.colorMode}（期待 ${mode}）` });
  }

  // (1) 初画面（実寸・等倍のまま撮る）。
  const topFile = join(outDir, `showcase-${preset}-${mode}-top.png`);
  await page.screenshot({ path: topFile });

  // (2) 全体。fullPage は「ビューポートをページ全高まで伸ばして」撮るため、
  //     min-height:100vh を持つ要素（html/body/#root と .magi-appshell＝実装どおりの姿）が
  //     一緒に伸びてページが再び伸び、継ぎ目で像が重複する。撮影の間だけ 100vh を解いて
  //     1枚に収める（**撮影用の一時上書き**であって core も dev ページも変更していない）。
  await page.addStyleTag({
    content: 'html,body,#root,.magi-appshell{min-height:0 !important}',
  });
  await page.waitForTimeout(200);
  const fullFile = join(outDir, `showcase-${preset}-${mode}-full.png`);
  await page.screenshot({ path: fullFile, fullPage: true });

  shots.push({ mode, topFile, fullFile, ...applied });
  await context.close();
}

await browser.close();

for (const s of shots) {
  console.log(`撮影: ${s.mode}（data-ui-mode=${s.uiMode} / 節 ${s.sections}件）`);
  console.log(`  初画面: ${s.topFile}`);
  console.log(`  全体  : ${s.fullFile}`);
}
if (problems.length === 0) {
  console.log(`\nコンソール: error / warning / pageerror / requestfailed は 0 件（${modes.length}モード）`);
} else {
  console.error(`\nコンソール問題 ${problems.length} 件:`);
  for (const p of problems) console.error(`  [${p.mode}] ${p.kind}: ${p.text}`);
  process.exit(1);
}
