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
 *   (b) 必須シェル構造 … AppShell型（MagiAppShell/BusinessNav・v0.5 現行標準）が揃っていれば合格。
 *                        無ければトップメニュー型（top-menu-bar/tabs/panel・前標準）、それも無ければ
 *                        旧サイドパネル型（topbar(themed-card) / app-body-grid / app-side-panel /
 *                        side-peek-toggle）を項目別に検査（従来どおり・逸脱承認で通せる）
 *   (c) 禁止パターン   … ネイティブ confirm/alert/prompt を src/ で呼んでいない
 *   (d) StatusBadge    … 状態バッジは @magi/core/ui の StatusBadge を使い、旧 tooltip/CSS コピーを残さない
 *   (d) 逸脱の承認     … 上記が欠けるなら TYPE_DEVIATIONS.md に status=承認済 で記載されているか
 *   (e) 承認ゲート     … 【派生のみ】TYPE_DEVIATIONS.md に status=要承認 の逸脱が残っていないか
 *   (f) プレースホルダ … 【派生のみ】__SYSTEM_*__ の置換漏れが残っていないか
 *   (g) 重なり順       … アプリ側 CSS の z-index が上限 100（--magi-z-app-sticky-max）以下か
 *                        （超えると Core のメニュー・業務ダッシュボードが帯ごと下に潜る。
 *                         v0.9.3 追加・社長裁定「潜り込み表示を型で止める」）
 *   (h) シェルの枠     … シェル（.magi-appshell 系）の枠を壊す上書きが無いか
 *                        （max-width: none / シェル本体の padding: 0 は失格。v0.10.0 追加）
 *   (i) シェル再定義   … アプリ側 CSS が .magi-appshell* の寸法・文字を再定義していないか
 *                        （コア管轄クラスの写しが残ると、Core を上げても見た目が動かない。
 *                         v0.11.0 追加・社長裁定「選択状態の標準形＝ピル」と同日の是正）
 *
 *   ※ 検査の符号 (a)〜(i) と、下の seed 判定の説明で使う (i)(ii) は別物（後者は箇条書き番号）。
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

// ── トップメニュー型シェル（07 §4-4・2026-06 サイドパネル廃止後の現行標準） ──
//   v0.4.2 新設: 3クラスが src/ に全部あればシェル検査(b)は合格。旧サイドパネル型の
//   クラスや退役 LegacyShell の残置は不要になる（magi-manual-app / magi-adl-app で
//   「ガードが旧シェル前提のため退役JSXを置いて通す」回避策が2例発生した実装フィードバック）。
//   1つでも欠ければ従来どおり REQUIRED_SHELL の項目別検査へフォールバック（fail-closed）。
const TOPMENU_SHELL = [
  { name: 'top-menu-bar', pattern: /\btop-menu-bar\b/ },
  { name: 'top-menu-tabs', pattern: /\btop-menu-tabs\b/ },
  { name: 'top-menu-panel', pattern: /\btop-menu-panel\b/ },
];

// ── AppShell 型シェル（v0.5・@magi/core/ui の MagiAppShell を採用する現行標準） ──
//   v0.5.1 新設（Sol R1-C4-GUARDRAIL-FALLBACK 恒久解）: 採用アプリの src が MagiAppShell と
//   BusinessNav（コンポーネント使用 or magi-appshell-* クラス）を持てば live の AppShell を
//   直接検査でき、退役 LegacyShell の旧クラスによる fallback 合格に頼らなくてよい。
//   既存2型（トップメニュー型・旧サイドパネル型）の判定は不変。
const APPSHELL_SHELL = [
  { name: 'MagiAppShell', pattern: /\bMagiAppShell\b|\bmagi-appshell\b/ },
  { name: 'BusinessNav', pattern: /\bBusinessNav\b|\bmagi-appshell-nav\b/ },
];

// ── 禁止パターン（ネイティブダイアログ。専用モーダル+Toastに統一・07/規約6） ──
// window.confirm( か、グローバル呼び出しの confirm(（直前が "." や識別子文字でない）だけを検出。
// toast.confirm() など独自メソッドは別物なので拾わない。
const FORBIDDEN = [
  { name: 'window.confirm', pattern: /(?:window\.confirm|(?<![.\w])confirm)\s*\(/ },
  { name: 'window.alert', pattern: /(?:window\.alert|(?<![.\w])alert)\s*\(/ },
  { name: 'window.prompt', pattern: /(?:window\.prompt|(?<![.\w])prompt)\s*\(/ },
  // v0.9.4: 検出器を JSX の中で作ると毎レンダー別参照になり、MagiStatusSummary の
  //   検出 effect（依存 [writeDetector]）が回り続けて観測要求を出し続ける。
  //   createHealthWriteDetector は Core 側でシングルトン化して無害化したが、
  //   createEnvWriteDetector など「呼ぶたび新しい関数を返す」ものは依然この形が事故になる。
  //   module 定数か useMemo へ退避させる。
  {
    name: 'writeDetector のJSX内生成',
    pattern: /writeDetector\s*=\s*\{\s*create\w*WriteDetector\s*\(/,
    hint: '（module定数か useMemo へ退避。毎レンダー新しい参照になり検出が回り続けます）',
  },
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

// ── (g) 重なり順の上限（v0.9.3・社長裁定「潜り込み表示を型で止める」） ──
//   Core の帯・ポップアップは --magi-z-* トークン（業務帯200 / ナビ300 / ポップアップ400 …）に
//   載っている。アプリの sticky 帯や独自ポップアップがこれを超えると、Core のメニューや
//   業務ダッシュボードが**帯ごと**下に潜り、中身が分断されて見える（2026-07-30 社長の実機指摘）。
//   そこで「アプリ側 CSS の z-index は --magi-z-app-sticky-max（100）以下」を機械で守る。
//   ・@media print 内・負値・auto 等のキーワードは対象外
//   ・var(--magi-z-*) の参照は合法（序列は Core が保証する）
//   ・どうしても超えたい場合は TYPE_DEVIATIONS.md に ID=UI-ZINDEX を status=承認済 で記載する
const Z_INDEX_CEILING = 100;
const Z_INDEX_DEVIATION_ID = 'UI-ZINDEX';
const Z_INDEX_KEYWORDS = new Set(['auto', 'inherit', 'initial', 'unset', 'revert', 'revert-layer']);

// ── (h) シェルの枠を壊す上書きの禁止（v0.10.0・社長裁定「余白・パネル配置を型に昇格」） ──
//   事故: 幅の広い業務コンテンツを収めるために、アプリがシェルの枠を外す
//   （例 `max-width: none; padding: 10px`）と、ページ全体に横スクロールが出て
//   **パネル外の左右余白が食われる**（2026-07-30 社長指摘）。
//   枠を「壊す」値だけを失格にし、寸法の微調整（18px→10px 等）は警告に留める
//   ＝基準実体（職員マスタ）の書き方をそのまま通しつつ、事故の形だけを止める。
const SHELL_FRAME_CLASSES = ['magi-appshell', 'magi-appshell-header', 'magi-appshell-main'];
const SHELL_FRAME_PROPS = ['padding', 'max-width', 'min-height'];
// 枠を外す値（これが失格。値の微調整は対象外）
const FRAME_BREAKING_MAX_WIDTH = /^(none|100vw|unset|initial|revert)$/i;
const FRAME_BREAKING_PADDING = /^0(px)?(\s+0(px)?){0,3}$/i;
const SHELL_FRAME_DEVIATION_ID = 'UI-SHELL-FRAME';

// ── (i) コア管轄クラス（.magi-appshell*）のアプリ側再定義の禁止（v0.11.0・2026-07-31 社長裁定） ──
//   事故: 型を採用したのに、アプリ側 CSS に「写しの層」（Core と同じ寸法を書き直した規則）が
//   残り続ける。すると Core を上げても見た目が動かず、直したはずの不揃いが現場に出ない
//   ＝どこが正なのか誰にも分からなくなる（利用者マスタで実際に起きて撤去した）。
//   そこで .magi-appshell* を主語にした**寸法・文字系の再定義**を失格にする。
//   ・(h) がシェル3クラスの「枠を壊す値」を見るのに対し、(i) は .magi-appshell* 全クラスの
//     「再定義そのもの」を見る（値が Core と同じでも写しは写し）。両方に当たる行は両方に出る。
//   ・トークン var(--magi-*) で書いてあっても対象（(h) は素通しだが、(i) は再定義自体が問題）。
//   ・寸法・文字以外（display: none 等の出し分け）は警告に留める＝印刷や画面別の
//     出し分けはアプリ固有の正当な領域だから。
//   ・@media print の中は対象外（印刷は枠を外すのが正しい＝(h) と同じ扱い）。
//   ・逃がし道: TYPE_DEVIATIONS.md に当該セレクタ（クラス名）が書かれていれば警告へ落とす。
//     ID=UI-SHELL-CLASS を status=承認済 で載せれば全件をまとめて逃がせる（(g)(h) と同じ作法）。
const SHELL_CLASS_PREFIX = 'magi-appshell';
// 寸法・文字系（ここを書き換えると Core の版上げが効かなくなる＝失格）
const SHELL_CLASS_SIZE_PROPS = new Set([
  'max-width', 'width', 'padding', 'margin', 'min-height', 'height', 'font-size', 'border-radius', 'gap',
]);
const SHELL_CLASS_DEVIATION_ID = 'UI-SHELL-CLASS';

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
//   AppShell 型（v0.5 現行標準）が完備ならそれで合格。次にトップメニュー型（前標準）。
//   どちらも欠けるなら旧サイドパネル型を項目別に検査する（承認済み逸脱運用は生きる＝後方互換）。
if (APPSHELL_SHELL.every((shell) => shell.pattern.test(srcText))) {
  passes.push('(b) シェル構造: AppShell型（MagiAppShell / BusinessNav・v0.5）');
} else if (TOPMENU_SHELL.every((shell) => shell.pattern.test(srcText))) {
  passes.push('(b) シェル構造: トップメニュー型（top-menu-bar / top-menu-tabs / top-menu-panel・07 §4-4）');
} else {
  for (const shell of REQUIRED_SHELL) {
    if (shell.pattern.test(srcText)) {
      passes.push(`(b) シェル構造: ${shell.name}`);
    } else {
      recordMissing('(b) シェル構造', shell.name);
    }
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
        const hint = rule.hint ?? '（専用モーダル/Toastに置換）';
        failures.push(`(c) 禁止パターン: ${rule.name} を使用 — ${rel(file)}:${i + 1}${hint}`);
      }
    }
  });
}
if (failures.filter((f) => f.startsWith('(c)')).length === 0) {
  passes.push('(c) 禁止パターン: ネイティブ confirm/alert/prompt なし');
}

checkStatusBadgeGuardrails();

// ── (g) 重なり順: アプリ側 z-index の上限（Core のポップアップを潜らせない） ──
checkZIndexCeiling();

// ── (h) シェルの枠（余白・最大幅）を壊す上書きの禁止 ──
checkShellFrameOverrides();

// ── (i) コア管轄クラス（.magi-appshell*）の寸法・文字をアプリ側で再定義していないか ──
checkShellClassRedefinition();

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

// ── (d) StatusBadge / tooltip コア化ガード（SB-1〜4） ──
function checkStatusBadgeGuardrails() {
  const cssBlocks = collectCssBlocks();

  const richTooltipBlocks = cssBlocks.filter(
    (block) =>
      /\.magi-status-badge(?::[^{,]*)?::after\b/.test(block.selector)
      && /\bcontent\s*:\s*(?:attr\s*\(|["'])/.test(block.body)
      && !/\bcontent\s*:\s*none\b/.test(block.body),
  );
  if (richTooltipBlocks.length > 0) {
    failures.push(`(d) SB-1: .magi-status-badge::after のリッチtooltipが ${richTooltipBlocks.length} 件残存 → ${richTooltipBlocks.map(formatCssHit).join(' / ')}`);
  } else {
    passes.push('(d) SB-1: 状態バッジのリッチtooltip(::after content)なし');
  }

  const localBadgeCss = cssBlocks.filter(
    (block) =>
      /\.magi-status-badge\b/.test(block.selector)
      && !/::after\b/.test(block.selector),
  );
  if (localBadgeCss.length > 0) {
    const message = `(d) SB-2: アプリ側 .magi-status-badge / tone CSS の再定義が ${localBadgeCss.length} 件 → ${localBadgeCss.map(formatCssHit).join(' / ')}`;
    if (isSeed) warnings.push(`${message}（seed本体は移行猶予。派生では削除対象）`);
    else failures.push(message);
  } else {
    passes.push('(d) SB-2: 状態バッジCSSのアプリ側再定義なし');
  }

  const dataTooltipHits = [];
  for (const file of srcFiles) {
    const stripped = stripStringsAndComments(readFileSync(file, 'utf8'));
    stripped.split('\n').forEach((line, i) => {
      if (/\bdata-tooltip\s*=/.test(line)) dataTooltipHits.push(`${rel(file)}:${i + 1}`);
    });
  }
  if (dataTooltipHits.length > 0) {
    failures.push(`(d) SB-3: data-tooltip 属性が ${dataTooltipHits.length} 件残存（title属性へ移行）→ ${dataTooltipHits.join(' / ')}`);
  } else {
    passes.push('(d) SB-3: data-tooltip 属性なし');
  }

  const usesBadgeClass = /\bmagi-status-badge\b/.test(srcText);
  const importsCoreStatusBadge = /import\s*\{[^}]*\bStatusBadge\b[^}]*\}\s*from\s*['"]@magi\/core\/ui['"]/.test(srcText);
  if (usesBadgeClass && !importsCoreStatusBadge) {
    const message = '(d) SB-4: magi-status-badge を手実装で使用（@magi/core/ui の StatusBadge importへ移行）';
    if (isSeed) warnings.push(`${message}（seed本体は移行猶予。派生では移行対象）`);
    else warnings.push(message);
  } else {
    passes.push('(d) SB-4: StatusBadge import / 手実装なし');
  }
}

// ── (g) 重なり順: アプリ側 z-index が上限（--magi-z-app-sticky-max）を超えていないか ──
function checkZIndexCeiling() {
  const over = [];
  const unresolved = [];

  for (const file of cssFiles) {
    // コメント（説明文に z-index の話が書かれている）と、画面の重なりと無関係な
    // @media print の中身は見ない。どちらも改行を残して潰すので行番号は保たれる。
    const text = maskPrintMedia(maskCssComments(readFileSync(file, 'utf8')));
    const re = /z-index\s*:\s*([^;}\n]+)/g;
    let match;
    while ((match = re.exec(text)) !== null) {
      const raw = match[1].replace(/!important/i, '').trim();
      const line = text.slice(0, match.index).split('\n').length;
      // Core トークンの参照は合法（序列は Core が保証する）。
      if (/var\(\s*--magi-z-/.test(raw)) continue;
      const value = readZIndexNumber(raw);
      if (value === null) {
        unresolved.push(`${rel(file)}:${line} (z-index: ${raw})`);
        continue;
      }
      if (value > Z_INDEX_CEILING) over.push(`${rel(file)}:${line} (z-index: ${raw})`);
    }
  }

  if (unresolved.length > 0) {
    warnings.push(
      `(g) 重なり順: 値を静的に判定できない z-index が ${unresolved.length} 件（calc や独自変数）。`
      + ` 目視で ${Z_INDEX_CEILING} 以下か確認してください → ${unresolved.join(' / ')}`,
    );
  }

  if (over.length === 0) {
    passes.push(`(g) 重なり順: アプリ側 z-index は上限 ${Z_INDEX_CEILING}（--magi-z-app-sticky-max）以内`);
    return;
  }

  const message =
    `(g) 重なり順: z-index が上限 ${Z_INDEX_CEILING}（--magi-z-app-sticky-max）を超える箇所が ${over.length} 件`
    + ` → ${over.join(' / ')}`;
  if (approvedDeviations.has(Z_INDEX_DEVIATION_ID)) {
    warnings.push(`${message}（TYPE_DEVIATIONS で承認済＝${Z_INDEX_DEVIATION_ID}）→ 許可`);
    return;
  }
  failures.push(
    `${message}。Core のメニュー・業務ダッシュボード・状態の説明が帯ごと下に潜ります。`
    + ` sticky 帯は ${Z_INDEX_CEILING} 未満にするか var(--magi-z-*) を使ってください`
    + `（どうしても必要なら TYPE_DEVIATIONS.md に ID=${Z_INDEX_DEVIATION_ID} を status=承認済 で記載）`,
  );
}

// CSS コメント（/* ... */）を空白で潰す（改行は残す）。説明文中の z-index を拾わないため。
function maskCssComments(text) {
  return text.replace(/\/\*[^]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

// ── (h) シェルの枠を壊す上書き（padding/max-width/min-height）を止める ──
function checkShellFrameOverrides() {
  const breaking = [];
  const adjustments = [];

  for (const file of cssFiles) {
    // コメントと @media print は対象外（印刷は枠を外すのが正しい）。
    const text = maskPrintMedia(maskCssComments(readFileSync(file, 'utf8')));
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let match;
    while ((match = re.exec(text)) !== null) {
      const selector = match[1].trim().replace(/\s+/g, ' ');
      const body = match[2];
      const line = text.slice(0, match.index).split('\n').length;
      if (!selectorTargetsShellFrame(selector)) continue;

      for (const prop of SHELL_FRAME_PROPS) {
        const decl = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;}]+)`, 'i').exec(body);
        if (!decl) continue;
        const value = decl[1].replace(/!important/i, '').trim();
        // Core のトークンで書いてあるなら、それは型に沿った指定＝素通し。
        if (/var\(\s*--magi-/.test(value)) continue;
        const where = `${rel(file)}:${line} (${selector} { ${prop}: ${value} })`;
        const breaks =
          (prop === 'max-width' && FRAME_BREAKING_MAX_WIDTH.test(value))
          || (prop === 'padding' && FRAME_BREAKING_PADDING.test(value) && selector.includes('magi-appshell') && !selector.includes('magi-appshell-main'));
        if (breaks) breaking.push(where);
        else adjustments.push(where);
      }
    }
  }

  if (adjustments.length > 0) {
    warnings.push(
      `(h) シェルの枠: 寸法の上書きが ${adjustments.length} 件（枠は壊していない）。`
      + ` --magi-shell-padding / --magi-header-padding 等のトークンへ寄せると全アプリで揃います`
      + ` → ${adjustments.join(' / ')}`,
    );
  }

  if (breaking.length === 0) {
    passes.push('(h) シェルの枠: max-width/padding を外す上書きなし');
    return;
  }

  const message =
    `(h) シェルの枠を外す上書きが ${breaking.length} 件 → ${breaking.join(' / ')}`;
  if (approvedDeviations.has(SHELL_FRAME_DEVIATION_ID)) {
    warnings.push(`${message}（TYPE_DEVIATIONS で承認済＝${SHELL_FRAME_DEVIATION_ID}）→ 許可`);
    return;
  }
  failures.push(
    `${message}。シェルの左右余白が消え、ページ全体に横スクロールが出ます。`
    + ' 広い表は業務コンテンツの内側（overflow-x: auto の器）に閉じ込めてください'
    + `（どうしても必要なら TYPE_DEVIATIONS.md に ID=${SHELL_FRAME_DEVIATION_ID} を status=承認済 で記載）`,
  );
}

// セレクタの「主語」（最後の複合セレクタ）がシェルの枠クラスかを見る。
//   `.app .magi-appshell-main` は主語＝magi-appshell-main（対象）、
//   `.magi-appshell-main .table` は主語＝table（対象外＝中身の指定は自由）。
function selectorTargetsShellFrame(selectorList) {
  return selectorList.split(',').some((one) => {
    const subject = one.trim().split(/[\s>+~]+/).filter(Boolean).pop() ?? '';
    return SHELL_FRAME_CLASSES.some((cls) => new RegExp(`\\.${cls}(?![\\w-])`).test(subject));
  });
}

// ── (i) コア管轄クラス（.magi-appshell*）の寸法・文字の再定義を止める ──
function checkShellClassRedefinition() {
  const redefined = [];  // 寸法・文字の再定義（失格候補）
  const listed = [];     // TYPE_DEVIATIONS.md に記載のあるセレクタ（警告へ落とす）
  const others = [];     // 寸法・文字以外（display の出し分け等・警告のみ）
  const deviationText = readDeviationsText();

  for (const file of cssFiles) {
    // コメントと @media print は対象外（印刷の出し分けはアプリの正当な領域）。
    const text = maskPrintMedia(maskCssComments(readFileSync(file, 'utf8')));
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let match;
    while ((match = re.exec(text)) !== null) {
      const selector = match[1].trim().replace(/\s+/g, ' ');
      const body = match[2];
      const line = text.slice(0, match.index).split('\n').length;
      const classes = shellClassesInSubject(selector);
      if (classes.length === 0) continue;

      for (const declaration of body.split(';')) {
        const decl = /^\s*([-\w]+)\s*:([^]*)$/.exec(declaration);
        if (!decl) continue;
        const prop = decl[1].toLowerCase();
        const value = decl[2].replace(/!important/i, '').trim();
        if (!value) continue;
        // CSS 変数（--app-shell-max 等）の指定は「Core が用意したつまみ」を回す正規の手段。
        // 再定義ではないので対象外にする。
        if (prop.startsWith('--')) continue;
        const where = `${rel(file)}:${line} (${selector} { ${prop}: ${value} })`;
        if (!SHELL_CLASS_SIZE_PROPS.has(prop)) {
          others.push(where);
        } else if (classes.some((cls) => isListedInDeviations(deviationText, cls))) {
          listed.push(where);
        } else {
          redefined.push(where);
        }
      }
    }
  }

  if (others.length > 0) {
    warnings.push(
      `(i) シェル再定義: コア管轄クラスへの寸法・文字以外の指定が ${others.length} 件`
      + `（出し分け等は許容。ただし Core 側の作法で足りないか一度見直してください）`
      + ` → ${others.join(' / ')}`,
    );
  }

  if (listed.length > 0) {
    warnings.push(
      `(i) シェル再定義: ${listed.length} 件は TYPE_DEVIATIONS.md に当該セレクタの記載あり → 許可`
      + `（記載を消したら失格に戻ります）→ ${listed.join(' / ')}`,
    );
  }

  if (redefined.length === 0) {
    passes.push(`(i) シェル再定義: .${SHELL_CLASS_PREFIX}* の寸法・文字をアプリ側で再定義していない`);
    return;
  }

  const message =
    `(i) シェル再定義: コア管轄クラス（.${SHELL_CLASS_PREFIX}*）の寸法・文字の再定義が ${redefined.length} 件`
    + ` → ${redefined.join(' / ')}`;
  if (approvedDeviations.has(SHELL_CLASS_DEVIATION_ID)) {
    warnings.push(`${message}（TYPE_DEVIATIONS で承認済＝${SHELL_CLASS_DEVIATION_ID}）→ 許可`);
    return;
  }
  failures.push(
    `${message}。アプリ側の写しが残ると Core を上げても見た目が動きません。`
    + ' 規則ごと削って Core の既定に任せるか、寸法トークン（--magi-*）を :root で調整してください'
    + `（どうしても必要なら TYPE_DEVIATIONS.md に当該セレクタを書く、または ID=${SHELL_CLASS_DEVIATION_ID} を status=承認済 で記載）`,
  );
}

// セレクタの「主語」（最後の複合セレクタ）に含まれる .magi-appshell* のクラス名を返す。
//   `.v2-app-shell.magi-appshell` は主語に magi-appshell を含む（対象）、
//   `.magi-appshell-focus-mode .v4-palette-main` は主語＝v4-palette-main（対象外＝アプリの持ち物）。
function shellClassesInSubject(selectorList) {
  const found = new Set();
  for (const one of selectorList.split(',')) {
    const subject = one.trim().split(/[\s>+~]+/).filter(Boolean).pop() ?? '';
    for (const hit of subject.matchAll(new RegExp(`\\.(${SHELL_CLASS_PREFIX}[\\w-]*)`, 'g'))) {
      found.add(hit[1]);
    }
  }
  return [...found];
}

// TYPE_DEVIATIONS.md の全文（セレクタ単位の逃がし道の照合に使う）。無ければ空文字。
function readDeviationsText() {
  const p = join(ROOT, 'TYPE_DEVIATIONS.md');
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

// 逸脱文書に当該クラスが「.magi-appshell-nav-tab」の形で書かれているか。
//   前方一致で誤判定しないよう、クラス名の直後が英数・- でないことを見る。
function isListedInDeviations(text, cls) {
  if (!text) return false;
  return new RegExp(`\\.${cls}(?![\\w-])`).test(text);
}

// @media print { ... } の中身を空白で潰す（改行は残すので行番号は保たれる）。
function maskPrintMedia(text) {
  const ranges = [];
  const re = /@media([^{]*)\{/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (!/\bprint\b/.test(match[1])) continue;
    let depth = 1;
    let i = re.lastIndex;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth += 1;
      else if (text[i] === '}') depth -= 1;
      i += 1;
    }
    ranges.push([match.index, i]);
  }
  let out = text;
  for (const [start, end] of ranges) {
    out = out.slice(0, start) + out.slice(start, end).replace(/[^\n]/g, ' ') + out.slice(end);
  }
  return out;
}

// z-index の値を数値化する。判定不能なら null（キーワードは重なりを作らないので 0 扱い）。
function readZIndexNumber(raw) {
  const value = raw.trim();
  if (Z_INDEX_KEYWORDS.has(value.toLowerCase())) return 0;
  if (/^-?\d+$/.test(value)) return Number(value);
  // var(--x, fallback) は fallback で判定する（--magi-z-* は呼び出し側で合法判定済み）。
  const varMatch = value.match(/^var\(\s*--[\w-]+\s*,([^]*)\)$/);
  if (varMatch) return readZIndexNumber(varMatch[1]);
  return null;
}

function collectCssBlocks() {
  const blocks = [];
  for (const file of cssFiles) {
    const text = readFileSync(file, 'utf8');
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let match;
    while ((match = re.exec(text)) !== null) {
      const selector = match[1].trim();
      const body = match[2];
      const line = text.slice(0, match.index).split('\n').length;
      blocks.push({ file, selector, body, line });
    }
  }
  return blocks;
}

function formatCssHit(block) {
  return `${rel(block.file)}:${block.line} (${block.selector.replace(/\s+/g, ' ')})`;
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
