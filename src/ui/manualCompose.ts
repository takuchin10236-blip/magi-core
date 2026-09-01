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
export const MANUAL_COMMON_TAIL_IDS = ['floor-account', 'entry-key', 'logo-column'] as const;

/**
 * 題名・一言に入れてはいけない丸数字。
 *   ①〜⑳（U+2460–U+2473）／⓪（U+24EA）／㉑〜㉟（U+3251–U+325F）／㊱〜㊿（U+32B1–U+32BF）。
 *   ⑴⑵…（括弧数字）と ⓵⓶…（二重丸数字 U+24F5–U+24FE）はこの網の対象外＝
 *   実運用で出た形（①②…）だけを止め、誤検出で正しい本文を落とさない。
 */
const CIRCLED_NUMBER = /[①-⑳⓪㉑-㉟㊱-㊿]/u;

/** メッセージの頭。どのアプリのマニュアルで落ちたかを最初に言う（複数アプリを一括ビルドする卓のため）。 */
function head(appName: string): string {
  return `composeAppManual（${appName}のマニュアル）: `;
}

/** (a) アプリ固有節の題名・一言に丸数字が無いこと。検出した文字と節idを必ず出す。 */
function assertNoCircledNumber(appName: string, appSections: readonly ManualSection[]): void {
  for (const section of appSections) {
    const fields: Array<readonly [string, string | undefined]> = [
      ['title', section.title],
      ['summary', section.summary],
    ];
    for (const [field, value] of fields) {
      if (typeof value !== 'string') continue;
      const hit = value.match(CIRCLED_NUMBER);
      if (!hit) continue;
      throw new Error(
        `${head(appName)}節「${section.id}」の ${field} に丸数字「${hit[0]}」が入っています`
        + `（${field}='${value}'）。`
        + '節の題名は素の名詞にしてください（2026-09-01 社長裁定「◯数字は廃止」）。番号は器が自動で振ります。',
      );
    }
  }
}

/** (b) 末尾3本が id で floor-account → entry-key → logo-column の順に完全一致すること。 */
function assertCommonTail(appName: string, commonTail: readonly ManualSection[]): void {
  const actual = commonTail.map((section) => section?.id);
  const expected = MANUAL_COMMON_TAIL_IDS;
  const same = actual.length === expected.length && expected.every((id, index) => actual[index] === id);
  if (same) return;
  throw new Error(
    `${head(appName)}末尾の共通節3本が規定と違います。`
    + `期待=[${expected.join(' → ')}] / 実際=[${actual.join(' → ')}]。`
    + '並びの正本は 02番マニュアル標準 §3-4(5-3) v1.6（アプリ固有 → 共通アカウント → 入口のカギ → ロゴ最末尾）。'
    + '実体は @magi/manual-content の SG_FLOOR_ACCOUNT_MANUAL_SECTION / SG_ENTRY_KEY_MANUAL_SECTION / SG_LOGO_MANUAL_SECTION をそのまま渡してください。',
  );
}

/** (c) アプリ固有節に共通節の予約idが混ざっていないこと（自前の写しで上書きさせない）。 */
function assertNoReservedId(appName: string, appSections: readonly ManualSection[]): void {
  const reserved = new Set<string>(MANUAL_COMMON_TAIL_IDS);
  const mixed = appSections.filter((section) => reserved.has(section.id)).map((section) => section.id);
  if (mixed.length === 0) return;
  throw new Error(
    `${head(appName)}アプリ固有の節に共通節の予約id [${mixed.join(', ')}] が入っています。`
    + '共通節（アカウント・入口のカギ・ロゴ）は @magi/manual-content が配る実体を末尾へ渡す形にしてください'
    + '（アプリ側で写しを持つと、配布元を直しても古い文面が残ります）。',
  );
}

/** (d) 全節の id が重複しないこと（重複すると目次ジャンプが先頭の節へ吸われる）。 */
function assertUniqueIds(appName: string, sections: readonly ManualSection[]): void {
  const seen = new Set<string>();
  const duplicated: string[] = [];
  for (const section of sections) {
    if (seen.has(section.id) && !duplicated.includes(section.id)) duplicated.push(section.id);
    seen.add(section.id);
  }
  if (duplicated.length === 0) return;
  throw new Error(
    `${head(appName)}節の id が重複しています [${duplicated.join(', ')}]。`
    + 'id は目次ジャンプの宛先です。重複すると、後ろの節へ飛べません。',
  );
}

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
export function composeAppManual(
  meta: { appName: string; appVersion: string; subtitle: string },
  appSections: ManualSection[],
  commonTail: readonly [ManualSection, ManualSection, ManualSection],
): ManualContent {
  assertNoCircledNumber(meta.appName, appSections);
  assertCommonTail(meta.appName, commonTail);
  assertNoReservedId(meta.appName, appSections);
  const sections = [...appSections, ...commonTail];
  assertUniqueIds(meta.appName, sections);
  return { ...meta, sections };
}
