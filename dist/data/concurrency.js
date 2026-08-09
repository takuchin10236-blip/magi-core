/**
 * @magi/core — 同時編集の保存時チェック（楽観ロック・段1）
 *
 * 起案: `個人/2026-08-08_Eclipse_デザインシステム/2026-08-09_起案_D1同時編集保存時チェック_v0.1.md` §2「段1」
 *
 * 何を防ぐか:
 *   2人が同じ範囲を開いて編集すると、後から保存した人が先の人の変更を**黙って消す**（lost update）。
 *   `sheets.ts` の `update` / `batchUpdate` は範囲PUT＝後勝ち上書きで、競合検出を持たない。
 *   そこで「編集開始時に読んだ範囲のスナップショット」を保存リクエストに同伴させ、
 *   保存直前にサーバ側で**同じ範囲を再読して比較**し、差があれば 409 で止める。
 *
 * 使い方（opt-in・既存の書込関数のシグネチャは変えていない）:
 *   1. 読込時: `const snap = await snapshotHash(loaded.values)` をクライアントへ返す
 *   2. 保存時: リクエストに載って来た snap を `assertFreshSnapshot(source, range, snap)` に渡す
 *   3. 通れば従来どおり `source.update(range, values)`
 *   呼ばないアプリの挙動は一切変わらない（採用はアプリごとに1つずつ・戻すのはピンを下げるだけ）。
 *
 * 【正直な限界（先に明記する）】
 *   Sheets API には compare-and-swap（CAS）が無い。したがってこの機構は
 *   「再読 → 比較 → 書込」の3手を別々のAPI呼び出しで行う**楽観ロック**であり、
 *   比較と書込のあいだに**数百ミリ秒のレース窓が残る**（この窓に入った同時保存は捕まえられない）。
 *   完全排他ではない——「実用上ほぼ全ての lost update を捕まえる」装置だと理解して使うこと。
 *   完全排他が要るなら別レイヤ（Durable Object 等の排他）が必要で、それは本段の範囲外。
 *
 * 【誤検出ゼロの原則（迂回リスク対策）】
 *   競合ダイアログが頻発すると職員は脳死で上書きボタンを押すようになる（AHRQ教訓＝安全ブロックは現場に迂回される）。
 *   そのため比較対象は**保存しようとしている範囲のみ**に限定する。無関係な行・別シートの変更では跳ねない。
 *   起案が「シート単位の粗い rev カウンタ方式」を却下したのはこの理由（誤ブロック源）。
 *   `append`（追記）は対象外＝追記は既存行を上書きしないので lost update を起こさない。
 *   対象は `update` / `batchUpdate`（範囲PUT）経路の前置きチェックだけ。
 *
 * 【理由コードを WriteReason に入れなかった理由】
 *   `WriteReason` は `writeState()` が blocks に積む「権限・環境ゲート」の値域で、
 *   `assertWriteAllowed()` の 403/423 の二分岐と1対1に対応している。
 *   STALE_SNAPSHOT は「誰が書けるか」ではなく「先に誰かが書いたか」＝別の軸で、
 *   HTTP も 409 と別枠。ここに混ぜると (a) writeState が決して返さない値が値域に入って型が嘘をつき、
 *   (b) 既存の書込ゲートの分岐に手を入れることになる（opt-in＝既存無風の原則に反する）。
 *   よって `ConcurrencyReason` を別枠で新設し、流儀（安定文字列・型付け・fail-closed）だけを踏襲する。
 */
import { apiError } from './http.js';
/** 競合時に画面へ出す定型文言（起案 §2 の逐語。文言を散らさないため定数で配る）。 */
export const STALE_SNAPSHOT_MESSAGE = '他の職員が先に保存しました。最新を読み込み直してから、もう一度編集してください。';
/** 競合時の HTTP ステータス（409 Conflict）。 */
export const STALE_SNAPSHOT_STATUS = 409;
/** スナップショットハッシュの接頭辞（アルゴリズムを自己記述させ、将来の差し替えを見えるようにする）。 */
const SNAPSHOT_HASH_PREFIX = 'sha256:';
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
export async function snapshotHash(values) {
    const canonical = stableJson(normalizeValues(values));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
    return SNAPSHOT_HASH_PREFIX + toHex(digest);
}
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
export async function assertFreshSnapshot(source, range, expected) {
    const current = await source.read(range);
    const actual = await snapshotHash(current.values);
    if (actual === expected)
        return;
    throw apiError('STALE_SNAPSHOT', STALE_SNAPSHOT_MESSAGE, STALE_SNAPSHOT_STATUS);
}
/** 行列を正規化する（末尾の空セル・空行を落とし、各セルを安定した文字列へ）。 */
function normalizeValues(values) {
    const rows = values.map((row) => trimTrailingEmpty((row ?? []).map(normalizeCell)));
    return trimTrailingEmptyRows(rows);
}
/** セル1つを安定した文字列にする。 */
function normalizeCell(cell) {
    if (cell === null || cell === undefined)
        return '';
    if (typeof cell === 'string')
        return cell;
    // Sheets は真偽値を TRUE/FALSE の文字列として返すことがあるため、表示表現に寄せて同値にする。
    if (typeof cell === 'boolean')
        return cell ? 'TRUE' : 'FALSE';
    if (typeof cell === 'number' || typeof cell === 'bigint')
        return String(cell);
    // 想定外（オブジェクト等）は情報を落とさずキー順非依存のJSONへ（String() だと [object Object] に潰れる）。
    return stableJson(cell);
}
function trimTrailingEmpty(row) {
    let end = row.length;
    while (end > 0 && row[end - 1] === '')
        end -= 1;
    return row.slice(0, end);
}
function trimTrailingEmptyRows(rows) {
    let end = rows.length;
    while (end > 0 && rows[end - 1].length === 0)
        end -= 1;
    return rows.slice(0, end);
}
/** キー順に依存しない安定JSON（オブジェクトのキーを辞書順に並べてから直列化する）。 */
function stableJson(value) {
    return JSON.stringify(sortKeysDeep(value));
}
function sortKeysDeep(value) {
    if (Array.isArray(value))
        return value.map(sortKeysDeep);
    if (value && typeof value === 'object') {
        const source = value;
        const sorted = {};
        for (const key of Object.keys(source).sort())
            sorted[key] = sortKeysDeep(source[key]);
        return sorted;
    }
    return value;
}
function toHex(buffer) {
    let hex = '';
    for (const byte of new Uint8Array(buffer))
        hex += byte.toString(16).padStart(2, '0');
    return hex;
}
//# sourceMappingURL=concurrency.js.map