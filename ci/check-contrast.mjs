#!/usr/bin/env node
/**
 * check-contrast.mjs — 画面のコントラスト比を機械で検査する（v0.7・全MAGI共通）
 * ─────────────────────────────────────────────────────────────────────
 * なぜ在るか（2026-07-28）:
 *   デジタル庁DS整合の作業中、White表示で 4.5:1 を割る配色が3件見つかった。
 *   見つけたのは人が手でブラウザ上で測ったからで、次は忘れる。
 *   **人の注意ではなく機械で止める**——今日の実測をそのまま検査に変えたもの。
 *
 * 基準（デジタル庁DS / WCAG 2.2 AA）:
 *   - 文字: 4.5:1 以上
 *   - 大きい文字（24px以上、または太字18.66px以上）: 3:1 以上
 *   出典の要点は `リサーチ/レポート/2026-07-28_UIデザインシステム世界BP調査_v0.1.md` §4-2。
 *
 * 使い方:
 *   node node_modules/@magi/core/ci/check-contrast.mjs --url http://127.0.0.1:5273
 *   任意: --modes white,dark  --paths /,/settings  --chrome <path>  --json <out>
 *
 * 前提: 採用側アプリが playwright-core を持っていること（devDependency）。
 *       検査は「すでに動いているURL」に対して行う（サーバの起動はアプリ側の責務）。
 */
import { writeFile } from 'node:fs/promises';

import { chromium } from 'playwright-core';

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const url = arg('url', 'http://127.0.0.1:5273');
const modes = arg('modes', 'white,dark').split(',').map((mode) => mode.trim()).filter(Boolean);
const paths = arg('paths', '/').split(',').map((p) => p.trim()).filter(Boolean);
const jsonOut = arg('json', '');
const chromePath =
  arg('chrome', process.env.PLAYWRIGHT_CHROME_PATH) ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** ページ内で走る本体。色の正規化は canvas に任せる（color(srgb ...) 等の新記法も正しく読める）。 */
function auditInPage(colorMode) {
  // 2026-07-28: White/Dark を切り替えた直後に同じ処理内で読むため、`transition` を持つ要素は
  // 「切替前の色」を返してしまう（.operator-chip が Dark で白背景 2.15:1 と誤検出された真因）。
  // 計測の間だけ遷移とアニメーションを止め、切替後の確定値だけを読む。
  if (!document.getElementById('__contrast_no_motion__')) {
    const killer = document.createElement('style');
    killer.id = '__contrast_no_motion__';
    killer.textContent = '*,*::before,*::after{transition:none !important;animation:none !important;}';
    document.head.appendChild(killer);
  }
  document.documentElement.setAttribute('data-color-mode', colorMode);
  // 差し替えを確定させてから読む（強制リフロー）。
  void document.documentElement.offsetHeight;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const toRGB = (value) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return [data[0], data[1], data[2]];
  };

  const luminance = (value) => {
    const [r, g, b] = toRGB(value).map((channel) => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const ratio = (fg, bg) => {
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    return (hi + 0.05) / (lo + 0.05);
  };

  const isTransparent = (value) => !value || /rgba\(0, 0, 0, 0\)|transparent/.test(value);

  /**
   * 実際に目に見える背景色を求める。
   * MAGIの配色は `color-mix(... 8%, ...)` 等で**半透明の層**を重ねるため、
   * 一番手前の背景色をそのまま使うと誤判定する（半透明の淡い緑を
   * 不透明の鮮やかな緑として読み、1.09:1 のような有り得ない値が出た＝2026-07-28）。
   * ブラウザと同じく、外側から内側へ順に重ねて合成した結果を返す。
   */
  const backgroundOf = (element) => {
    const layers = [];
    let node = element;
    while (node && node !== document.documentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      if (!isTransparent(bg)) layers.push(bg);
      node = node.parentElement;
    }
    const rootBg = getComputedStyle(document.documentElement).backgroundColor;
    if (!isTransparent(rootBg)) layers.push(rootBg);

    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#ffffff'; // 最背面（ブラウザの既定）
    ctx.fillRect(0, 0, 1, 1);
    for (const layer of layers.reverse()) {
      ctx.fillStyle = layer;
      ctx.fillRect(0, 0, 1, 1);
    }
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
  };

  /** 文字色も半透明のことがある（rgba(...,0.6) 等）。背景の上に重ねて実際の見え方にする。 */
  const foregroundOn = (color, background) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
  };

  const describe = (element) => {
    const parts = [];
    let node = element;
    for (let depth = 0; node && depth < 3; depth += 1) {
      const cls = (node.className && typeof node.className === 'string' ? node.className : '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((c) => `.${c}`)
        .join('');
      parts.unshift(node.tagName.toLowerCase() + cls);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };

  const findings = [];
  const seen = new Set();

  for (const element of document.body.querySelectorAll('*')) {
    // 直接の文字を持つ要素だけを見る（親の重複計上を避ける）。
    const ownText = [...element.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join('');
    if (!ownText) continue;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const style = getComputedStyle(element);
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;

    const size = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight) || 400;
    // 大きい文字の定義（WCAG）: 24px以上、または太字(700+)で18.66px以上
    const isLarge = size >= 24 || (weight >= 700 && size >= 18.66);
    const required = isLarge ? 3 : 4.5;

    const background = backgroundOf(element);
    const value = ratio(foregroundOn(style.color, background), background);
    if (value >= required) continue;

    const key = `${describe(element)}|${ownText.slice(0, 20)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    findings.push({
      mode: colorMode,
      where: describe(element),
      text: ownText.slice(0, 30),
      ratio: Number(value.toFixed(2)),
      required,
      fontSize: size,
    });
  }

  return findings;
}

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const all = [];
let checked = 0;

try {
  for (const pathname of paths) {
    await page.goto(`${url}${pathname}`, { waitUntil: 'networkidle' });
    for (const mode of modes) {
      const findings = await page.evaluate(auditInPage, mode);
      const count = await page.evaluate(() => document.body.querySelectorAll('*').length);
      checked += count;
      all.push(...findings.map((f) => ({ ...f, path: pathname })));
    }
  }
} finally {
  await browser.close();
}

console.log('=== check-contrast（デジタル庁DS / WCAG 2.2 AA） ===');
console.log(`  対象: ${url}  経路: ${paths.join(', ')}  表示: ${modes.join(', ')}`);
console.log(`  走査した要素: ${checked}`);

if (jsonOut) {
  await writeFile(jsonOut, JSON.stringify({ url, paths, modes, findings: all }, null, 2));
}

if (all.length === 0) {
  console.log('  OK  基準を割る配色は見つからなかった。');
  process.exit(0);
}

console.error(`  NG  ${all.length}件が基準を割っている:`);
for (const f of all) {
  console.error(
    `   - [${f.mode}] ${f.ratio}:1 （必要 ${f.required}:1 / ${f.fontSize}px） ${f.where}  「${f.text}」`,
  );
}
console.error('  → 色そのものを直す。文字を薄くして解決しない（薄い色ほど読めない人が増える）。');
process.exit(1);
