/**
 * @magi/core — data 契約の型定義（v0.1）
 *
 * 原本: magi-omutsu-inventory/functions/_shared/types.ts（Env / AccessUser / WriteResult / SheetValues）
 *       ＋ magi-resident-spine/functions/_shared/access.js（検証版アクセス文脈の型・D4修正）
 *
 * v0.1スコープ: zod / 楽観ロック / 監査ログ / Durable Object はv0.3送り（ここには入れない）。
 */

export type AppEnv = 'dev' | 'preview' | 'production';

/**
 * Cloudflare Pages Functions が受け取る環境変数の束。
 * omutsu types.ts を土台に、resident access.js の検証版が要求する
 * CF Access 検証用キー（CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD 等）を追加。
 */
export type Env = {
  APP_ENV?: string;
  // 書込ゲート（omutsu writeGuard.ts が参照する4キー）
  ALLOW_WRITES?: string;
  PRODUCTION_WRITE_APPROVED?: string;
  ALLOW_PREVIEW_WRITES?: string;
  // アクセス制御（allowlist）
  ALLOWED_EMAILS?: string;
  ACCESS_ALLOWLIST?: string; // D4: resident版の名称（ALLOWED_EMAILS と等価に扱う）
  ADMIN_EMAILS?: string;
  SUPER_ADMIN_EMAIL?: string;
  DEV_USER_EMAIL?: string;
  // CF Access JWT 検証（D4修正・resident access.js が要求）
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  CF_ACCESS_AUD_TAG?: string;
  CF_PAGES_BRANCH?: string;
  PRODUCTION_BRANCH?: string;
  // スプレッドシート ID（複数の別名を許容）
  SPREADSHEET_ID?: string;
  DEV_SPREADSHEET_ID?: string;
  PROD_SPREADSHEET_ID?: string;
  // Google サービスアカウント（自己署名JWT用）
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_PRIVATE_KEY?: string;
  TIMEZONE?: string;
  // アプリ固有の SPREADSHEET_ID 別名を許容するためのインデックスシグネチャ
  [key: string]: string | undefined;
};

export type AccessSource = 'cloudflare-access' | 'dev' | 'local-dev' | 'none';

/**
 * アクセス文脈（D4修正版）。
 * omutsu の AccessUser（allowed/admin）に、resident access.js の
 * role / isSuperAdmin / denyReason / source を統合した上位互換。
 */
export type AccessUser = {
  email: string;
  allowed: boolean;
  /** 管理者か（omutsu admin と等価） */
  admin: boolean;
  role: 'admin' | 'floor' | 'local-dev' | 'unknown';
  isSuperAdmin: boolean;
  source: AccessSource;
  /** 拒否時の理由コード（許可時は undefined） */
  denyReason?: string;
};

/** Sheets の生 values（3アプリとも row[]・cell は string|number|boolean） */
export type SheetValues = unknown[][];

/**
 * 読込結果の薄いラッパー（v0.1で新規定義）。
 * 3アプリは生 values[][] を返していたが、保存元（Sheets か mock か）と
 * 読込時刻を運ぶための最小ラッパーをここで初めて導入する。
 */
export type LoadResult<T> = {
  values: T;
  storage: 'sheets' | 'mock';
  /** 読込時刻（ISO8601） */
  readAt: string;
};

/**
 * 書込ブロック理由コード（omutsu writeGuard.ts の7コードを正典化）。
 * UI・ログにそのまま出る安定コードなので文字列を変えないこと。
 */
export type WriteReason =
  | 'USER_NOT_ALLOWED'
  | 'ADMIN_REQUIRED'
  | 'ALLOW_WRITES_FALSE'
  | 'PRODUCTION_WRITE_NOT_APPROVED'
  | 'PREVIEW_WRITE_NOT_ALLOWED'
  | 'SPREADSHEET_ID_MISSING'
  | 'GOOGLE_SERVICE_ACCOUNT_MISSING';

/** 書込API共通の戻り（omutsu types.ts 準拠） */
export type WriteResult = {
  success: boolean;
  code?: string;
  message?: string;
  [key: string]: unknown;
};

/** MagiDataSource.batchUpdate の1エントリ */
export type BatchUpdateEntry = {
  range: string;
  values: SheetValues;
};

/**
 * データソース抽象（read/update/append/batchUpdate/clear/ensureSheet）。
 * v0.1では Sheets 実装（createSheetsSource）のみ。mock は LoadResult.storage の
 * 値域として予約（v0.1では未実装）。
 */
export interface MagiDataSource {
  /** range を読み、生 values を薄いラッパーで返す */
  read(range: string): Promise<LoadResult<SheetValues>>;
  /**
   * 複数 range を **1リクエスト**（Sheets `values:batchGet`・GETのみ）で読む。
   * 戻りは引数 ranges と同じ順序・同じ長さの SheetValues[]（該当 range が空なら []）。
   * 読取専用（書込ゼロ）。読取APIのリクエスト数削減（SA単位の読取クォータ節約）が目的。
   * v0.3.3 追加・optional（既存実装の後方互換のため。未実装ソースは read の逐次呼びで代替可）。
   * v0.3.4: 内部実装が valueRanges[i].range をシート名で突合して並べ替える（index 依存を排除）＋
   *   valueRanges 長さ assert を追加。戻り値の契約（ranges と同順・同長の SheetValues[]）は不変。
   */
  batchRead?(ranges: string[]): Promise<SheetValues[]>;
  /** range を上書き（PUT・RAW固定） */
  update(range: string, values: SheetValues): Promise<void>;
  /** range の末尾に追記（appendは冪等でないので withRetry 対象外） */
  append(range: string, values: SheetValues): Promise<void>;
  /** 複数 range を一括上書き（RAW固定） */
  batchUpdate(data: BatchUpdateEntry[]): Promise<void>;
  /** range をクリア */
  clear(range: string): Promise<void>;
  /** シートが無ければ作成（あれば何もしない） */
  ensureSheet(title: string): Promise<void>;
}

/** createSheetsSource に渡す設定 */
export type SheetsSourceConfig = {
  env: Env;
  /**
   * 明示の spreadsheetId。未指定なら env から解決
   * （SPREADSHEET_ID → APP_ENV 別 PROD/DEV_SPREADSHEET_ID の順）。
   */
  spreadsheetId?: string;
};
