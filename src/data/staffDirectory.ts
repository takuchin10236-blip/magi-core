/**
 * staffDirectory — 2F名簿（職員）の読み方の唯一の正（v0.19.0・全MAGI共通）
 * ─────────────────────────────────────────────────────────────────────
 * 2026-08-18 社長裁定: 「職員の並び順とかは、型に昇格させてください。必須のものです。
 *   2Fで使うアプリは、すべて、これに倣ってほしい」。
 *
 * 契機: 利用者記録統合システムの実機確認で、3階・4階の職員が候補に混ざり、
 *   並びも名簿の順を無視していた（社長が発見）。横断調査の結果、同じ「2階の在籍職員」を
 *   7本のアプリがそれぞれ別の書き方で実装していた——在籍の判定だけで
 *   「在籍」/「在籍or在職」/「≠退職」の3流派があった。
 *
 * 設計:
 *   - 絞り込み（在籍 × フロア）と整列（並び順 → 氏名）をここに固定し、アプリ側で書かせない
 *   - **列の欠落は止める・値の欠落は末尾へ**——名簿は生きて成長する台帳であり、
 *     新人1名の並び順が未設定になった瞬間に全アプリの職員候補が消える設計にしない
 *     （「その職員が誰か分からない時だけ捨てる」＝シフトv4の作法を正とする）
 *   - フロアは引数で変えられる（既定 '2階'）。3階・4階のアプリが将来出ても使える
 *
 * 正本の条文: 開発/標準仕様/16_マスタ直結標準_シンプル工程_v2.0.md §5.2
 */
import { apiError } from './http.js';

/** 名簿1行ぶんの内部形。sortOrder は名簿側で未設定なら null（行は捨てない）。 */
export type StaffDirectoryEntry = {
  staffId: string;
  name: string;
  status: string;
  floor: string;
  sortOrder: number | null;
};

export type StaffDirectoryOptions = {
  /** 絞り込むフロア。既定は '2階'（施設運営の全アプリの既定）。 */
  floor?: string;
};

/** 在籍とみなす語彙。ここが唯一の定義で、アプリ側で再定義しない。 */
export const STAFF_ACTIVE_STATUSES = ['在籍'] as const;

const STAFF_HEADER_ALIASES = {
  staffId: ['内部ID', '職員ID', 'staffId'],
  name: ['氏名', 'name'],
  status: ['ステータス', '状態', 'status'],
  floor: ['フロア', '階', 'floor'],
  sortOrder: ['並び順', '表示順', 'sortOrder'],
} as const;

type StaffHeaderKey = keyof typeof STAFF_HEADER_ALIASES;

const MAX_ROWS = 5000;
const MAX_ID_LENGTH = 128;

function cell(value: unknown): string {
  return value == null ? '' : String(value).normalize('NFKC').trim();
}

/** 列そのものが無い＝契約違反。値の空欄とは別に扱う（本部品の核心）。 */
function headerMissing(): never {
  throw apiError(
    'STAFF_DIRECTORY_HEADER_MISSING',
    '職員名簿の列を確認できないため、表示を停止しました。',
    503,
  );
}

function contractInvalid(): never {
  throw apiError(
    'STAFF_DIRECTORY_CONTRACT_INVALID',
    '職員名簿のIDを確認できないため、表示を停止しました。',
    503,
  );
}

function resolveHeaders(header: unknown[]): Record<StaffHeaderKey, number> {
  const normalized = header.map((value) => cell(value).toLowerCase());
  const result = {} as Record<StaffHeaderKey, number>;
  for (const key of Object.keys(STAFF_HEADER_ALIASES) as StaffHeaderKey[]) {
    const alias = STAFF_HEADER_ALIASES[key].find((label) => normalized.includes(label.toLowerCase()));
    if (!alias) headerMissing();
    result[key] = normalized.indexOf(alias.toLowerCase());
  }
  return result;
}

/** 並び順は任意項目。読めない時も行は捨てず null にする（末尾へ回す）。 */
function toSortOrder(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 職員マスタの生データを、指定フロアの在籍者だけへ絞り、名簿の並び順で整列して返す。
 * 並び順が未設定の行は捨てず、末尾に氏名順で並ぶ。
 */
export function parseStaffDirectoryRows(
  rows: unknown[][],
  options: StaffDirectoryOptions = {},
): StaffDirectoryEntry[] {
  const floor = options.floor ?? '2階';
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_ROWS) headerMissing();
  const [header = [], ...body] = rows;
  if (!Array.isArray(header)) headerMissing();
  const index = resolveHeaders(header);

  const seen = new Set<string>();
  const entries: StaffDirectoryEntry[] = [];
  for (const raw of body) {
    const row = Array.isArray(raw) ? raw : [];
    const staffId = cell(row[index.staffId]);
    const name = cell(row[index.name]);
    const status = cell(row[index.status]);
    // 空行（IDも氏名も無い）は名簿の余白として黙って飛ばす。契約違反ではない。
    if (!staffId && !name) continue;
    if (!staffId || staffId.length > MAX_ID_LENGTH || seen.has(staffId)) contractInvalid();
    seen.add(staffId);
    if (!(STAFF_ACTIVE_STATUSES as readonly string[]).includes(status)) continue;
    if (cell(row[index.floor]) !== floor) continue;
    entries.push({
      staffId,
      name,
      status,
      floor,
      sortOrder: toSortOrder(cell(row[index.sortOrder])),
    });
  }

  return entries.sort((left, right) => {
    if (left.sortOrder == null && right.sortOrder != null) return 1;
    if (left.sortOrder != null && right.sortOrder == null) return -1;
    if (left.sortOrder != null && right.sortOrder != null && left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }
    return left.name.localeCompare(right.name, 'ja');
  });
}
