#!/usr/bin/env node
/**
 * ═════════════════════════════════════════════════════════════════════
 * 【@magi/core 原本（v0.1）】このファイルは CIガードの「原本1版」です。
 *   出所: magi-resident-spine/tools/check-ui-guardrails.mjs（388行）を md5一致でコピー。
 *         omutsu の102行旧版は不採用（resident/staff の388行版を採用）。
 *   位置づけ: 各アプリ（resident/staff/omutsu/将来の派生）はこの原本を参照する想定。
 *   実行: 検査対象 root は通常このスクリプトの1つ上（..）。別の場所を検査したいときは
 *         環境変数 MAGI_CORE_GUARD_ROOT に検査対象 repo の絶対パスを渡す（下の ROOT 定義参照）。
 *   改変方針: 原本なので本体ロジックは resident版から変えない（パス可搬の最小調整のみ）。
 * ═════════════════════════════════════════════════════════════════════
 *
 * ─────────────────────────────────────────────────────────────────────
 * check-ui-guardrails.mjs — 完コピの崩れ＋未承認の省略を機械検出するゲート
 * ─────────────────────────────────────────────────────────────────────
 *
 * 何のため（金型 00 §適用の作法・機械で守る / 依頼書タスク3）:
 *   「型からコピーして始めて、自由に振る。省略は社長承認制」を機械で守る。
 *   completコピーの土台（連絡ノート standard-lumen）が崩れていないか、
 *   背骨（必須シェル構造・確認モーダル）が外れていないかを物理確認する。
 *   黙って省略されていたら（TYPE_DEVIATIONS.md に承認記載が無ければ）exit 1。
 *
 * 検査（npm run check から呼ばれる）:
 *   (a) 標準値一致     … standard-lumen の基準トークン（--primary:#6bbf95 等）が index.css にある
 *   (b) 必須シェル構造 … topbar(themed-card) / app-body-grid / app-side-panel / side-peek-toggle が src/ にある
 *   (c) 禁止パターン   … ネイティブ confirm/alert/prompt を src/ で呼んでいない
 *   (d) 逸脱の承認     … 上記が欠けるなら TYPE_DEVIATIONS.md に status=承認済 で記載されているか
 *   (e) 承認ゲート     … 【派生のみ】TYPE_DEVIATIONS.md に status=要承認 の逸脱が残っていないか
 *   (f) プレースホルダ … 【派生のみ】__SYSTEM_*__ の置換漏れが残っていないか
 *
 * 逸脱の承認の考え方:
 *   検査項目に対応する逸脱ID（下の CHECK_TO_DEVIATION）が TYPE_DEVIATIONS.md に
 *   「承認済」で載っていれば、その項目の欠落は "承認された省略" として通す
 *   （例: 区分B＝書込ガード省略）。承認が無い欠落だけを失格にする。
 *
 * ── seed モード / 派生モード（重要：(e)(f) はここで効き方が変わる） ──
 *   このリポジトリ自身（seed＝テンプレート）と、そこから clone した派生アプリでは
 *   守るべきものが違う。seed は「プレースホルダ(__SYSTEM_*__)が残っているのが正常」で、
 *   SEED-* の逸脱（業務を削いだ等）も seed であることの必然。一方、派生アプリでは
 *   プレースホルダの残骸も未承認の省略も "事故" なので止めたい。
 *
 *   そこで seed か派生かを二重ガードで判定する（両方満たすときだけ seed＝安全側）:
 *     (i)  package.json の name が "__SYSTEM_KEY__" のまま（＝まだ名前を差し替えていない）
 *     (ii) TYPE_DEVIATIONS.md に "<!-- seed-baseline: true -->" の宣言"行"がある
 *          （行まるごとがこのマーカーの行だけを照合する。説明文中にバッククォートで
 *           引用された同じ文字列には反応しない＝派生者がマーカー本体行を消せば、
 *           説明文に同じ語が残っていても確実に派生へ倒れる）
 *   どちらか一方でも欠ければ「派生」とみなし、(e)(f) を有効化して未承認逸脱・残骸で exit 1。
 *   派生時はこの2つ（name 差し替え／seed-baseline 行の削除）のどちらかで自動的に切り替わる。
 *
 *   seed モードでは:
 *     ・ID 接頭辞 SEED- の逸脱は "seed-baseline"（seed 本体だけの基準逸脱）として
 *       承認ゲート(e)の対象外（status=要承認 でも失格にしない）。明示的に skip ログを出す。
 *     ・(f) プレースホルダ検査もまるごと skip（残置が正常）。
 *
 * 依存ゼロ（Node 標準のみ）。CI でも手元でも同じ結果。
 *
 * ── 2026-06-02 改訂（全repo配備で判明した点に対応） ──
 *   ・frontend/ 入れ子構成（src を frontend/ 配下に置くアプリ）に対応＝APP_ROOT 自動判定
 *   ・(a) は src/styles/index.css 固定でなく src 配下の CSS 全体から標準トークンを探す
 *   ・(f) は素材抽出ノート EXTRACT_NOTES.md を残骸検査から除外（README/docs と同類の文書）
 *   ・(e) は "要承認はなし" のような否定形を承認ゲートで拾わない
 *   ・TYPE_DEVIATIONS の行に「covers: UI-TOKENS」等を添えると、D番号採番のまま
 *     (a)(b) の欠落を承認に繋げられる（番人IDと変更届IDの橋）
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// @magi/core 原本化のためのパス可搬調整（本体ロジックは resident版のまま）:
//   検査対象 repo の root。環境変数 MAGI_CORE_GUARD_ROOT があればそれを優先し、
//   無ければ従来どおりスクリプトの1つ上（..）を見る。これにより各アプリが
//   `MAGI_CORE_GUARD_ROOT=<app-root> node .../ci/check-ui-guardrails.mjs` で
//   この原本を共有しつつ自分の repo を検査できる。
const ROOT = process.env.MAGI_CORE_GUARD_ROOT
  ? process.env.MAGI_CORE_GUARD_ROOT
  : join(dirname(fileURLToPath(import.meta.url)), '..');

// ── アプリ本体の根（src/・package.json の所在）。──
//   型は「repo直下に src/・package.json がフラットに並ぶ」前提だが、frontend/ 入れ子の
//   アプリ（src を frontend/ 配下に置く構成）もある。直下に src/ が無く frontend/src/ が
//   あれば frontend/ を APP_ROOT とする。TYPE_DEVIATIONS.md は統治文書なので常に repo 直下
//   （ROOT）を見る＝APP_ROOT とは別概念。
const APP_ROOT = existsSync(join(ROOT, 'src'))
  ? ROOT
  : existsSync(join(ROOT, 'frontend', 'src'))
    ? join(ROOT, 'frontend')
    : ROOT;

// ── 標準値（連絡ノート standard-lumen の基準。ここが崩れたら完コピが崩れている） ──
const STANDARD_TOKENS = [
  { name: 'standard-lumen セレクタ', pattern: '[data-ui-preset="standard-lumen"][data-color-mode="white"]' },
  { name: '--primary 基準色', pattern: '--primary: #6bbf95' },
  { name: '--accent 基準色', pattern: '--accent: #6bbf95' },
  { name: 'Plus Jakarta Sans フォント', pattern: 'Plus Jakarta Sans Variable' },
];

// ── 必須シェル構造（背骨。どのアプリでも同じ手触りを作る外枠） ──
const REQUIRED_SHELL = [
  { name: 'topbar themed-card', pattern: /className=("|`|')[^"`']*\btopbar\b[^"`']*\bthemed-card\b/ },
  { name: 'app-body-grid', pattern: /\bapp-body-grid\b/ },
  { name: 'app-side-panel', pattern: /\bapp-side-panel\b/ },
  { name: 'side-peek-toggle', pattern: /\bside-peek-toggle\b/ },
];

// ── 禁止パターン（ネイティブダイアログ。専用モーダル+Toastに統一・07/規約6） ──
// window.confirm( か、グローバル呼び出しの confirm(（直前が "." や識別子文字でない）だけを検出。
// toast.confirm() など独自メソッドは別物なので拾わない。
const FORBIDDEN = [
  { name: 'window.confirm', pattern: /(?:window\.confirm|(?<![.\w])confirm)\s*\(/ },
  { name: 'window.alert', pattern: /(?:window\.alert|(?<![.\w])alert)\s*\(/ },
  { name: 'window.prompt', pattern: /(?:window\.prompt|(?<![.\w])prompt)\s*\(/ },
];

// 検査項目 → TYPE_DEVIATIONS の逸脱ID（承認されていれば欠落を許す）
const CHECK_TO_DEVIATION = {
  'standard-lumen セレクタ': 'UI-TOKENS',
  '--primary 基準色': 'UI-TOKENS',
  '--accent 基準色': 'UI-TOKENS',
  'Plus Jakarta Sans フォント': 'UI-TOKENS',
  'topbar themed-card': 'SHELL-TOPBAR',
  'app-body-grid': 'SHELL-GRID',
  'app-side-panel': 'SHELL-SIDEPANEL',
  'side-peek-toggle': 'SHELL-SIDEPANEL',
};

// seed-baseline 逸脱の ID 接頭辞（seed 本体だけの基準逸脱。派生では消す） ──
const SEED_BASELINE_PREFIX = 'SEED-';
// 記入見本の逸脱 ID 接頭辞（TYPE_DEVIATIONS の「記入見本」行。承認ゲートの対象外） ──
const EXAMPLE_PREFIX = 'EX-';
// seed 未派生を示す package.json の name（差し替えられたら派生） ──
const SEED_PACKAGE_NAME = '__SYSTEM_KEY__';
// seed-baseline 宣言（TYPE_DEVIATIONS.md にこの行があれば seed 本体の目印） ──
//   判定は「行まるごとがこのマーカー（HTMLコメント1行）」だけにマッチさせる。
//   単純 includes だと、同じ文字列を引用した説明文（例: バッククォート囲みの
//   `<!-- seed-baseline: true -->`）にも反応し、派生者がマーカー本体だけ消しても
//   説明文の引用が残って seed モードに居座る穴になる（バトー指摘）。
//   そこで行頭〜行末がマーカーだけの行を /m で1行ずつ厳密照合する。
//   `^` で行頭、`-->\s*$` で行末を縛るため、行中の出現やバッククォート囲みには反応しない。
const SEED_BASELINE_MARKER_RE = /^<!--\s*seed-baseline:\s*true\s*-->\s*$/m;

// プレースホルダ残骸検出（派生のみ）。__SYSTEM_XXX__ 形式の置換漏れを探す ──
const PLACEHOLDER_PATTERN = /__SYSTEM_[A-Z0-9_]*__/g;
// 検査するファイルの拡張子（テキスト主体。バイナリ/ロックは見ない） ──
const PLACEHOLDER_EXTS = ['.ts', '.tsx', '.js', '.mjs', '.json', '.html', '.css', '.toml', '.md'];
// プレースホルダ検査から外すディレクトリ（生成物・依存・git 内部・docs＝文書はプレースホルダを例示する仕様の場所で残骸でない） ──
const PLACEHOLDER_SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.wrangler', 'docs']);
// プレースホルダ検査から外すファイル ──
//   ・check-ui-guardrails.mjs … このスクリプト自身（定数に __SYSTEM_KEY__ を持つ）
//   ・TYPE_DEVIATIONS.md / README.md … プレースホルダの「使い方」を説明する文書（残骸でなく仕様）
//   ・package-lock.json … npm が package.json の name から自動生成・自動追従する生成物
//     （人が手で消すものではない。npm install で解消されるためノイズになる）
const PLACEHOLDER_SKIP_FILES = new Set([
  'check-ui-guardrails.mjs',
  'TYPE_DEVIATIONS.md',
  'README.md',
  'package-lock.json',
  // EXTRACT_NOTES.md … 型への素材抽出ノート。テンプレ変数（__SYSTEM_*__）を
  //   「例示」する文書で残骸ではない（README/docs と同類）。配備試走で偽陽性源と判明。
  'EXTRACT_NOTES.md',
]);

const failures = [];
const warnings = [];
const passes = [];

// ── seed モード / 派生モードの判定（二重ガード。両方満たすときだけ seed＝安全側） ──
const isSeed = detectSeedMode();

// ── 承認済み逸脱IDの収集（TYPE_DEVIATIONS.md の表から status=承認済 の行を拾う） ──
const approvedDeviations = loadApprovedDeviations();

// ── (a) 標準値一致（src 配下の CSS 全体）──
//   styles/index.css 固定でなく、src/index.css 等どこに置いても標準トークンの有無を見る。
//   別スタック（shadcn 等）でトークン自体が無ければ、ここは正しく欠落として赤になる。
const cssFiles = existsSync(join(APP_ROOT, 'src'))
  ? collectFiles(join(APP_ROOT, 'src'), ['.css'])
  : [];
const css = cssFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
for (const token of STANDARD_TOKENS) {
  if (css.includes(token.pattern)) {
    passes.push(`(a) 標準値: ${token.name}`);
  } else {
    recordMissing('(a) 標準値', token.name);
  }
}

// ── src/ 配下の .ts/.tsx を集める（(b)(c)用） ──
const srcFiles = existsSync(join(APP_ROOT, 'src')) ? collectFiles(join(APP_ROOT, 'src'), ['.ts', '.tsx']) : [];
const srcText = srcFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

// ── (b) 必須シェル構造（src 全体を1つの文字列として検査） ──
for (const shell of REQUIRED_SHELL) {
  if (shell.pattern.test(srcText)) {
    passes.push(`(b) シェル構造: ${shell.name}`);
  } else {
    recordMissing('(b) シェル構造', shell.name);
  }
}

// ── (c) 禁止パターン（行番号付き検出） ──
// 文字列リテラル・コメント（複数行ブロックコメント含む）は「説明文」なので
// 除去してから検査する（連絡ノート由来の部品コメントに "window.confirm()" と
// 書いてあっても誤検出しないように。完コピ部品は改変しない＝diff を保つ）。
// 検出するのは実際のグローバル呼び出し（window.confirm( / 直前が非識別子の confirm(）だけ。
// toast.confirm() のような独自メソッドは別物なので拾わない。
for (const file of srcFiles) {
  const raw = readFileSync(file, 'utf8');
  const stripped = stripStringsAndComments(raw); // ファイル全体で除去（行数は保つ）
  const lines = stripped.split('\n');
  lines.forEach((code, i) => {
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(code)) {
        failures.push(`(c) 禁止パターン: ${rule.name} を使用 — ${rel(file)}:${i + 1}（専用モーダル/Toastに置換）`);
      }
    }
  });
}
if (failures.filter((f) => f.startsWith('(c)')).length === 0) {
  passes.push('(c) 禁止パターン: ネイティブ confirm/alert/prompt なし');
}

// ── (e) 承認ゲート（派生のみ）: status=要承認 の逸脱が残っていたら失格 ──
// seed モードでは SEED-*（seed-baseline）を CI 対象外として skip する。
checkApprovalGate();

// ── (f) プレースホルダ残骸（派生のみ）: __SYSTEM_*__ の置換漏れを失格にする ──
// seed モードでは残置が正常なのでまるごと skip する。
checkPlaceholders();

// ファイル全体から、コメント（//・複数行 /* */）と文字列リテラル（'..' ".." `..`）を
// 空白に潰す。改行は残すので行番号は保たれる。完全な構文解析ではないが、
// 説明文・コメント中の禁止語を誤検出しない程度には堅牢。
function stripStringsAndComments(text) {
  let s = text;
  // 複数行ブロックコメント（改行は保持して潰す）
  s = s.replace(/\/\*[^]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  // 行コメント
  s = s.replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
  // 文字列リテラル（中身を潰す。改行を含み得るテンプレートリテラルは改行保持）
  s = s.replace(/'(?:\\.|[^'\\\n])*'/g, "''");
  s = s.replace(/"(?:\\.|[^"\\\n])*"/g, '""');
  s = s.replace(/`(?:\\.|[^`\\])*`/g, (m) => m.replace(/[^\n]/g, ' '));
  return s;
}

// ── 結果出力 ──
print();

function recordMissing(category, name) {
  const deviationId = CHECK_TO_DEVIATION[name];
  if (deviationId && approvedDeviations.has(deviationId)) {
    warnings.push(`${category}: ${name} は欠落だが TYPE_DEVIATIONS で承認済（${deviationId}）→ 許可`);
  } else {
    const hint = deviationId
      ? `（省略するなら TYPE_DEVIATIONS.md に ID=${deviationId} を status=承認済 で記載）`
      : '';
    failures.push(`${category}: ${name} が見つからない ${hint}`);
  }
}

// TYPE_DEVIATIONS.md の Markdown 表から逸脱行を {id, status} で全部拾う。
// 表の形: | ID | 何を省いた | 理由 | 区分/根拠 | 社長承認日 | status |
// status は「最後から2番目のセル」（末尾セルは | で割ると空文字になるため）。
function loadDeviationRows() {
  const rows = [];
  const p = join(ROOT, 'TYPE_DEVIATIONS.md');
  if (!existsSync(p)) return rows;
  const text = readFileSync(p, 'utf8');
  for (const line of text.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    const id = cells[1];
    const status = cells[cells.length - 2] || '';
    // ヘッダ行（ID）・区切り行（---）は飛ばす
    if (!id || id === 'ID' || /^-+$/.test(id)) continue;
    // 任意宣言: 行内に "covers: UI-TOKENS, SHELL-GRID" があれば、この逸脱が
    //   どの検査項目（(a)(b)）の欠落を承認カバーするかを示す。D番号採番のまま
    //   標準トークン/シェル欠落の承認に繋ぐ橋（無ければ従来通り id だけ）。
    const m = line.match(/covers:\s*([^\]|]+)/i);
    const covers = m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : [];
    rows.push({ id, status, covers });
  }
  return rows;
}

function loadApprovedDeviations() {
  const set = new Set();
  for (const { id, status, covers } of loadDeviationRows()) {
    if (/承認済/.test(status)) {
      set.add(id);
      for (const c of covers) set.add(c); // covers: で宣言された検査IDも承認済み扱い
    }
  }
  return set;
}

// seed か派生かの二重ガード判定。両方満たすときだけ seed（安全側に倒す）。
//   (i)  package.json の name が "__SYSTEM_KEY__" のまま
//   (ii) TYPE_DEVIATIONS.md に "<!-- seed-baseline: true -->" 宣言行がある
//        ＝行まるごとがこのマーカーの行（SEED_BASELINE_MARKER_RE で /m 照合）。
//        説明文中にバッククォートで引用された同じ文字列には反応しない（派生者が
//        マーカー本体だけ消したら、引用が残っていても確実に派生へ倒れる）。
function detectSeedMode() {
  let nameIsPlaceholder = false;
  const pkgPath = join(APP_ROOT, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      nameIsPlaceholder = JSON.parse(readFileSync(pkgPath, 'utf8')).name === SEED_PACKAGE_NAME;
    } catch {
      nameIsPlaceholder = false; // 壊れた package.json は派生扱い＝厳しい側
    }
  }
  const devPath = join(ROOT, 'TYPE_DEVIATIONS.md');
  const hasMarker = existsSync(devPath) && SEED_BASELINE_MARKER_RE.test(readFileSync(devPath, 'utf8'));
  return nameIsPlaceholder && hasMarker;
}

// (e) 承認ゲート: 派生では status=要承認 の逸脱が1つでも残っていたら失格。
//   seed では SEED-*（seed-baseline）と EX-*（記入見本）を対象外にして skip ログ。
function checkApprovalGate() {
  const rows = loadDeviationRows();
  const pending = [];
  for (const { id, status } of rows) {
    // 「要承認」を含むが「要承認はなし／要承認なし」のような否定形は対象外（情報提供行など）。
    if (!/要承認/.test(status) || /要承認(?:は)?なし/.test(status)) continue;
    if (id.startsWith(EXAMPLE_PREFIX)) continue; // 記入見本は常に対象外
    if (id.startsWith(SEED_BASELINE_PREFIX)) {
      if (isSeed) {
        warnings.push(`(e) 承認ゲート: ${id} は seed-baseline → seed モードでは CI 対象外（skip）`);
        continue;
      }
      // 派生なのに SEED-* が残っている＝書き換え漏れ。これも未承認逸脱として失格にする。
    }
    pending.push(id);
  }
  if (pending.length > 0) {
    failures.push(
      `(e) 承認ゲート: 未承認の逸脱が ${pending.length} 件（${pending.join(', ')}）。`
      + ' TYPE_DEVIATIONS.md で社長承認を取り status=承認済（＋承認日）に更新するか、逸脱を解消してください。',
    );
  } else if (!isSeed) {
    passes.push('(e) 承認ゲート: 未承認の逸脱なし');
  }
}

// (f) プレースホルダ残骸: 派生で __SYSTEM_*__ が残っていたら失格。seed では skip。
function checkPlaceholders() {
  if (isSeed) {
    warnings.push('(f) プレースホルダ: seed モードのため検査 skip（__SYSTEM_*__ の残置は正常）');
    return;
  }
  const hits = [];
  for (const file of collectFiles(ROOT, PLACEHOLDER_EXTS, PLACEHOLDER_SKIP_DIRS)) {
    if (PLACEHOLDER_SKIP_FILES.has(file.split('/').pop())) continue;
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      const found = line.match(PLACEHOLDER_PATTERN);
      if (found) hits.push(`${rel(file)}:${i + 1}（${[...new Set(found)].join(', ')}）`);
    });
  }
  if (hits.length > 0) {
    failures.push(
      `(f) プレースホルダ残骸: __SYSTEM_*__ の置換漏れが ${hits.length} 箇所。`
      + ` アプリ固有値に差し替えてください → ${hits.join(' / ')}`,
    );
  } else {
    passes.push('(f) プレースホルダ: __SYSTEM_*__ の残骸なし');
  }
}

function collectFiles(dir, exts, skipDirs = null) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (skipDirs && skipDirs.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectFiles(full, exts, skipDirs));
    } else if (exts.includes(extname(full))) {
      out.push(full);
    }
  }
  return out;
}

function rel(file) {
  return file.startsWith(ROOT) ? file.slice(ROOT.length + 1) : file;
}

function print() {
  console.log('=== check-ui-guardrails ===');
  if (APP_ROOT !== ROOT) console.log(`  APP  アプリ本体: ${rel(APP_ROOT)}/（frontend 入れ子構成を検出）`);
  console.log(`  MODE ${isSeed ? 'seed（テンプレート本体・SEED-* と __SYSTEM_*__ は CI 対象外）' : '派生（未承認逸脱・プレースホルダ残骸を失格にする）'}`);
  for (const p of passes) console.log(`  OK   ${p}`);
  for (const w of warnings) console.log(`  WARN ${w}`);
  for (const f of failures) console.log(`  NG   ${f}`);
  console.log('');
  if (failures.length > 0) {
    console.error(`UIガードレール違反: ${failures.length} 件（未承認の省略 / 禁止パターン / プレースホルダ残骸）。`);
    console.error('完コピの土台を戻すか、意図的な省略なら TYPE_DEVIATIONS.md に社長承認付きで記載してください。');
    process.exit(1);
  }
  console.log(`UIガードレール OK（モード=${isSeed ? 'seed' : '派生'} / 合格 ${passes.length} / 承認済み・skip ${warnings.length}）。`);
}
