/**
 * residentDirectory — 2F名簿（利用者）の読み方の唯一の正（v0.19.0・全MAGI共通）
 * ─────────────────────────────────────────────────────────────────────
 * 2026-08-18 社長裁定（staffDirectory と対）: 名簿の絞り込みと並び順を型へ昇格する。
 *
 * 設計:
 *   - 並びは**居室番号の自然順**（`localeCompare(..., { numeric: true })`）。
 *     多床室の枝番（`201-1` `204-2`）が実在するため、桁が増えた瞬間に文字列順は破綻する——
 *     実測: 文字列順は `204-10` を `204-2` の前へ置く／`99` を `100` の後ろへ置く（2026-08-18 実行確認）。
 *     3桁揃いの現データだけを見ると差が出ないので、**変異試験は枝番2桁のデータで行う**こと。
 *   - フロア列は読まない——利用者背骨のフロア列は2026-08-12に追加されたが
 *     2026-08-18時点で全行が空。値が入った時に足せるよう、別名だけ下にコメントで残す
 *   - 職員側と同じ思想: **列の欠落は止める・値の欠落は末尾へ**
 *
 * 正本の条文: 開発/標準仕様/16_マスタ直結標準_シンプル工程_v2.0.md §5.2
 */
import { apiError } from './http.js';

export type ResidentDirectoryEntry = {
  residentId: string;
  name: string;
  status: string;
  /** 居室番号（`201-1` のような枝番つき文字列）。名簿側が未入力なら空。 */
  room: string;
};

/** 在籍（入所中）とみなす語彙。ここが唯一の定義で、アプリ側で再定義しない。 */
export const RESIDENT_ACTIVE_STATUSES = ['入所中', '転入'] as const;

const RESIDENT_HEADER_ALIASES = {
  residentId: ['利用者ID', 'residentId'],
  name: ['氏名', 'name'],
  status: ['ステータス', '状態', 'status'],
  room: ['居室番号', '居室', 'room'],
  // フロア列（'フロア' / '階' / 'floor'）は実物が全行空のため本部品では読まない。
  // 値が入り、フロア絞り込みが要るようになったらここへ足す（読む列を黙って増やさない）。
} as const;

type ResidentHeaderKey = keyof typeof RESIDENT_HEADER_ALIASES;

const MAX_ROWS = 5000;
const MAX_ID_LENGTH = 128;

function cell(value: unknown): string {
  return value == null ? '' : String(value).normalize('NFKC').trim();
}

function headerMissing(): never {
  throw apiError(
    'RESIDENT_DIRECTORY_HEADER_MISSING',
    '利用者名簿の列を確認できないため、表示を停止しました。',
    503,
  );
}

function contractInvalid(): never {
  throw apiError(
    'RESIDENT_DIRECTORY_CONTRACT_INVALID',
    '利用者名簿のIDを確認できないため、表示を停止しました。',
    503,
  );
}

function resolveHeaders(header: unknown[]): Record<ResidentHeaderKey, number> {
  const normalized = header.map((value) => cell(value).toLowerCase());
  const result = {} as Record<ResidentHeaderKey, number>;
  for (const key of Object.keys(RESIDENT_HEADER_ALIASES) as ResidentHeaderKey[]) {
    const alias = RESIDENT_HEADER_ALIASES[key].find((label) => normalized.includes(label.toLowerCase()));
    if (!alias) headerMissing();
    result[key] = normalized.indexOf(alias.toLowerCase());
  }
  return result;
}

/**
 * 利用者背骨の生データを、入所中の人だけへ絞り、居室番号の自然順で整列して返す。
 * 居室番号が未入力の行は捨てず、末尾に氏名順で並ぶ。
 */
export function parseResidentDirectoryRows(rows: unknown[][]): ResidentDirectoryEntry[] {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_ROWS) headerMissing();
  const [header = [], ...body] = rows;
  if (!Array.isArray(header)) headerMissing();
  const index = resolveHeaders(header);

  const seen = new Set<string>();
  const entries: ResidentDirectoryEntry[] = [];
  for (const raw of body) {
    const row = Array.isArray(raw) ? raw : [];
    const residentId = cell(row[index.residentId]);
    const name = cell(row[index.name]);
    const status = cell(row[index.status]);
    if (!residentId && !name) continue;
    if (!residentId || residentId.length > MAX_ID_LENGTH || seen.has(residentId)) contractInvalid();
    seen.add(residentId);
    if (!(RESIDENT_ACTIVE_STATUSES as readonly string[]).includes(status)) continue;
    entries.push({ residentId, name, status, room: cell(row[index.room]) });
  }

  return entries.sort((left, right) => {
    if (!left.room && right.room) return 1;
    if (left.room && !right.room) return -1;
    const byRoom = left.room.localeCompare(right.room, 'ja', { numeric: true });
    if (byRoom !== 0) return byRoom;
    return left.name.localeCompare(right.name, 'ja');
  });
}
