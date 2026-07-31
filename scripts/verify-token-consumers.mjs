/**
 * verify:tokens — 「語彙だけ定義して実体を配っていない」トークンを機械で捕まえる検査（v0.12.0）。
 *
 * 2026-07-31 16:27 社長裁定「同構造の欠けを個別でなく一斉に塞ぐ」に伴う新設。
 *   事故の型: Core が --magi-* トークン（語彙）を定義しても、それを消費する規則（実体）が
 *   Core 本体に無いと、見た目の実体は各アプリの写しが担ったままになる。写しを掃除した瞬間に
 *   その見た目が消える（①外周余白 v0.11.1 ②ヘッダーのパネル v0.12.0 ＝同じ穴に3回落ちた）。
 *   ここでは **design-system.css で定義された全 --magi-* トークンに、Core CSS 内の消費箇所
 *   （var(--…)）が最低1つあること** を要求し、無いものは「意図的に語彙先行」の例外リストへ
 *   理由付きで明記させる。例外リストが陳腐化（消費され始めた／定義が消えた）した場合も落とす。
 *
 * 実行系は verify:modal / verify:shell と同じ（node scripts/*.mjs・テキスト読み・PASS/FAIL 出力）。
 */
import { readFileSync } from 'node:fs';

const files = {
  design: readFileSync(new URL('../src/ui/design-system.css', import.meta.url), 'utf8'),
  core: readFileSync(new URL('../src/ui/core.css', import.meta.url), 'utf8'),
};

/**
 * 「意図的に語彙先行」＝ Core 本体に消費箇所が無くてよいトークンと、その理由。
 *   原則: Core に対応部品が無く**アプリが自分の器を書くための物差し**として配るもの、
 *   または Core が別名/上限として持つだけのもの。ここに書く＝社長裁定 v0.10.0
 *   「Core の各部品が今持っている値は変えない」を守るための逃がし道であって、
 *   実体を配れるものは配ってから消す（このリストは短くなる方向にだけ動かす）。
 */
const VOCABULARY_ONLY = {
  '--magi-panel-padding': '操作列・ツールバー級のパネルはアプリ側の器（Core に対応部品が無い）。寸法の物差しとして配る。',
  '--magi-card-padding': '一覧の1枚・小パネルはアプリ側の器。Core の各部品は自分の既定値を持つ（v0.10.0 の規約）。',
  '--magi-card-gap': '同上（カード間の間隔はアプリのグリッドが持つ）。',
  '--magi-button-min-height': 'Core の Button/操作系部品は部品ごとの既定値を持つ。アプリが素の button を書くときの物差し。',
  '--magi-button-padding': '同上。',
  '--magi-button-radius': '同上（Core 側は --button-radius 系を消費している）。',
  '--magi-action-gap': '操作列の間隔はアプリの器が持つ。',
  '--magi-button-icon-gap': 'アイコン＋文字の間隔はアプリの器が持つ。',
  '--magi-field-min-height': '入力欄はアプリ側のフォームが器を持つ（Core の FormField は自分の既定値）。',
  '--magi-field-padding': '同上。',
  '--magi-field-radius': '同上。',
  '--magi-field-label-gap': '同上。',
  '--magi-empty-padding': '0件表示はアプリ側の器（Core の EmptyState は自分の既定値）。',
  '--magi-list-item-padding': '一覧行はアプリ側の器。',
  '--magi-z-app-sticky-max': 'アプリ側の約束（この値未満に収める上限）。Core 自身は消費せず、CIガード(g)が名前を読む。',
  '--magi-z-fullscreen': '既存 --z-manual-fullpage の別名（Core は元の名前で書いている）。アプリ向けの語彙。',
};

/** design-system.css で定義された --magi-* トークン（定義順・重複排除）。 */
function definedTokens(css) {
  const found = [];
  for (const m of css.matchAll(/(?:^|[;{\s])(--magi-[A-Za-z0-9_-]+)\s*:/g)) {
    if (!found.includes(m[1])) found.push(m[1]);
  }
  return found;
}

/** Core CSS 全体の消費箇所（var(--magi-*)）。 */
function consumedTokens(cssList) {
  const used = new Set();
  for (const css of cssList) {
    for (const m of css.matchAll(/var\(\s*(--magi-[A-Za-z0-9_-]+)/g)) used.add(m[1]);
  }
  return used;
}

const defined = definedTokens(files.design);
const consumed = consumedTokens([files.design, files.core]);

const checks = [];
const fail = [];
function check(label, passed, detail) {
  checks.push([label, passed, detail]);
  if (!passed) fail.push(label);
}

// (1) 定義されたトークンは Core 内に消費箇所を持つ（無いなら例外リストに理由付きで載っている）。
for (const token of defined) {
  if (consumed.has(token)) {
    check(`消費者あり: ${token}`, true);
  } else if (Object.hasOwn(VOCABULARY_ONLY, token)) {
    check(`語彙先行（例外・理由記載あり）: ${token}`, true, VOCABULARY_ONLY[token]);
  } else {
    check(
      `消費者ゼロ: ${token}`,
      false,
      'Core 内に var() の消費箇所がありません。実体を配る規則を Core に書くか、意図的な語彙先行なら scripts/verify-token-consumers.mjs の VOCABULARY_ONLY へ理由付きで追加してください。',
    );
  }
}

// (2) 例外リストの陳腐化を落とす（消費され始めた／定義が消えた）。
for (const token of Object.keys(VOCABULARY_ONLY)) {
  if (!defined.includes(token)) {
    check(`例外リスト陳腐化（定義が無い）: ${token}`, false, 'design-system.css に定義がありません。例外リストから外してください。');
  } else if (consumed.has(token)) {
    check(
      `例外リスト陳腐化（消費され始めた）: ${token}`,
      false,
      'Core が消費するようになりました（＝実体が配られた）。例外リストから外してください。',
    );
  }
}

for (const [label, passed, detail] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'}: ${label}`);
  if (detail && !passed) console.log(`      → ${detail}`);
}

// 参考情報: 定義が無いまま var() で参照している --magi-*（部品が style で渡す／アプリ調整用のつまみ）。
const undefinedButUsed = [...consumed].filter((t) => !defined.includes(t)).sort();
if (undefinedButUsed.length > 0) {
  console.log(`INFO: :root 定義を持たない参照（部品が style で渡す／アプリ調整用のつまみ・fallback 必須）: ${undefinedButUsed.join(' / ')}`);
}

if (fail.length > 0) {
  console.error(`\nverify:tokens FAILED: ${fail.length} 件`);
  process.exit(1);
}

const exceptions = Object.keys(VOCABULARY_ONLY).length;
console.log(`\ntoken consumers verify: ${checks.length} checks passed（定義 ${defined.length}件・うち語彙先行の例外 ${exceptions}件）`);
