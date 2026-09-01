/**
 * @magi/core/ui — アプリ内マニュアルの標準様式（v0.25.0・2026-09-01 社長裁定の物理化）
 * ─────────────────────────────────────────────────────────────────────
 *
 * 裁定（2026-09-01 15:51）:
 *   「**◯数字は廃止。最後の3項目は固定（アカウント関連、認証関連、ロゴの話）。これをMAGIの型に昇格**」
 *
 * 何を型にしたか:
 *   1. **節の題名は素の名詞**（「出勤したら」「基本の投稿」）。①②…や「第N章」を題名の文字列へ
 *      入れない——番号は器（ManualViewer）が自動で振るため、文字列側にも番号があると二重になり、
 *      節を1本足すたびに全題名を打ち直す羽目になる。
 *   2. **末尾の共通節3本は固定**（フロアの共通アカウント → 入口のカギ → ロゴのコラム）。
 *      アカウントの話を読ませてから入口の操作へ進ませる順で、各アプリが勝手に並べ替えない。
 *      並びの正本＝**02番マニュアル標準 §3-4(5-3) v1.6**（アプリ固有 → 共通アカウント → 入口のカギ → ロゴ最末尾）。
 *
 * core と配布物の分担（依存を持たない理由）:
 *   共通節3本の**実体（文面・図）を配るのは `@magi/manual-content`**（非公開パッケージ）で、
 *   **core は依存しない**。core が持つのは「id の並び」という契約だけ＝公開リポジトリに
 *   施設固有の文面を持ち込まないための線引き（2026-08-20 裁定A-3 と同じ考え方）。
 *   アプリは `@magi/manual-content` から3本を import し、この関数へ渡す。
 *
 * なぜ throw か（console.warn にしない）:
 *   各アプリは**モジュール初期化時**にこれを呼ぶ（`export const MANUAL = composeAppManual(...)`）。
 *   throw なら import した時点で落ちる＝ビルドと試験が赤くなり、様式違反が本番へ出られない。
 *   console.warn では「画面を開いた人だけが気づける」＝誰も見ないログになる（物理ガードにならない）。
 */
import type { ManualContent, ManualSection } from './manual-types';
/**
 * 末尾の共通節3本の id（**並びも含めて契約**）。
 *   実体は `@magi/manual-content` が配る（core は文面を持たない）。
 *   正本＝02番マニュアル標準 §3-4(5-3) v1.6。
 */
export declare const MANUAL_COMMON_TAIL_IDS: readonly ["floor-account", "entry-key", "logo-column"];
/**
 * アプリ内マニュアルを標準様式で組み立てる（各アプリはモジュール初期化時にこれを呼ぶ）。
 *
 * @param meta アプリ名・版番号・サブ説明（3つとも必須＝画面の版表示と突き合わせられる形にする）
 * @param appSections アプリ固有の節（この順で先頭に並ぶ）
 * @param commonTail 共通節3本。`@magi/manual-content` の
 *   `SG_FLOOR_ACCOUNT_MANUAL_SECTION` → `SG_ENTRY_KEY_MANUAL_SECTION` → `SG_LOGO_MANUAL_SECTION` を
 *   **この順で**渡す（core は文面を持たないので、実体は配布パッケージから来る）
 * @throws 様式違反があれば日本語メッセージで throw（ビルド・試験で落として本番へ出さない）
 *
 * @example
 * export const MANUAL = composeAppManual(
 *   { appName: '連絡ノート', appVersion: APP_VERSION, subtitle: '2F職員向けの詳しい使い方' },
 *   [...STAFF, ...ADMIN],
 *   [SG_FLOOR_ACCOUNT_MANUAL_SECTION, SG_ENTRY_KEY_MANUAL_SECTION, SG_LOGO_MANUAL_SECTION],
 * );
 */
export declare function composeAppManual(meta: {
    appName: string;
    appVersion: string;
    subtitle: string;
}, appSections: ManualSection[], commonTail: readonly [ManualSection, ManualSection, ManualSection]): ManualContent;
//# sourceMappingURL=manualCompose.d.ts.map