import type { MagiDataSource, SheetValues } from './types.js';
/**
 * 同時編集チェックのブロック理由コード。
 * UI・ログにそのまま出る安定コードなので文字列を変えないこと（WriteReason と同じ流儀）。
 */
export type ConcurrencyReason = 'STALE_SNAPSHOT';
/** 競合時に画面へ出す定型文言（起案 §2 の逐語。文言を散らさないため定数で配る）。 */
export declare const STALE_SNAPSHOT_MESSAGE = "\u4ED6\u306E\u8077\u54E1\u304C\u5148\u306B\u4FDD\u5B58\u3057\u307E\u3057\u305F\u3002\u6700\u65B0\u3092\u8AAD\u307F\u8FBC\u307F\u76F4\u3057\u3066\u304B\u3089\u3001\u3082\u3046\u4E00\u5EA6\u7DE8\u96C6\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
/** 競合時の HTTP ステータス（409 Conflict）。 */
export declare const STALE_SNAPSHOT_STATUS = 409;
/**
 * 読んだ範囲のスナップショットを安定ハッシュ化する（`"sha256:" + hex64`）。
 *
 * 正規化（＝誤検出を出さないための同値吸収）:
 *   - 空セル: `null` / `undefined` は空文字として扱う
 *   - 末尾の空セル・末尾の空行を落とす（Sheets は末尾の空白を落として返すため、
 *     「同じ内容なのに読み方で長さが違う」だけで跳ねさせない）
 *   - 数値・真偽値は Sheets の表示表現に寄せた文字列へ（`1` と `"1"`、`true` と `"TRUE"` は同値）。
 *     RAW 書込では文字列 `"1"` を書いても読み戻しは数値 1 になる＝型の揺れは**内容の変更ではない**
 *   - 万一セルにオブジェクトが入った場合はキー順に依存しない安定JSONへ（`{a,b}` と `{b,a}` は同値）
 *
 * ハッシュにする理由（生 values の同伴でなく hash 一本にした判断）:
 *   ①比較経路が1本になる（生 values 同伴を併用すると「どちらの正規化で比べたか」が二重化する）
 *   ②リクエストが軽い（数百行の範囲でも 71 文字）
 *   ③スナップショットが**中身を運ばない**＝ログ・通信に利用者情報が乗らない（Option B と相性が良い）
 */
export declare function snapshotHash(values: SheetValues): Promise<string>;
/**
 * 保存直前に対象範囲を再読し、クライアントが同伴したスナップショットと一致しなければ 409 で止める。
 *
 * @param source 読み取りに使うデータソース（`MagiDataSource` の `read` だけを使う）
 * @param range  **保存しようとしている範囲**（読込時と同じ range を渡すこと。ずれると別物を比べることになる）
 * @param expected 読込時に `snapshotHash()` が返した文字列
 * @throws ApiError `STALE_SNAPSHOT` / 409 / {@link STALE_SNAPSHOT_MESSAGE}
 *
 * fail-closed:
 *   `expected` が欠落・形式不正でも「一致しない」＝409 で止まる（黙って上書きするより安全側）。
 *   再読そのものが失敗した場合も例外がそのまま伝播し、書込には進まない。
 *   採用アプリ側の同伴漏れは全保存が 409 になるので、開発時に必ず気づく（黙って無効化されない）。
 */
export declare function assertFreshSnapshot(source: Pick<MagiDataSource, 'read'>, range: string, expected: string): Promise<void>;
//# sourceMappingURL=concurrency.d.ts.map