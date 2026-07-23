/**
 * @magi/core/ui — 状態検出・安全集約ロジック（v0.5・AppShell）
 *
 * 設計の背骨（2026-07-24裁定・候補_core_AppShell部品設計.md §0）:
 *   「状態表示は自己申告にしない」。本番URL・書込ON/OFF はアプリが値を渡せない。
 *   アプリが宣言できるのは機械検出が困難な業務状態のみで、必ず「無検証」バッジを併記する。
 *
 * 本ファイルは React に依存しない純ロジック（検証・検出・集約）だけを持ち、
 *   MagiStatusSummary（tsx）が非同期検出を回した結果をここへ渡して表示形へ畳む。
 *   純関数なので単体テスト（vitest）で誤申告拒否・集約除外・fail-closed を直接検証できる。
 */
export type RuntimeSurface = 'local' | 'preview' | 'production' | 'unknown';
export type StatusTone = 'ok' | 'neutral' | 'warn' | 'danger' | 'info';
/**
 * アプリが宣言できる状態の許可リスト型（Sol R1指摘の物理化）。
 *   現時点では業務本番化（businessLive）のみ。本番URL・書込ON/OFF を表す kind は
 *   型に存在させない＝アプリが自己申告する経路を型レベルで塞ぐ。
 *   union は将来の業務状態追加のために残すが、機械検出可能な状態は足さない。
 */
export type DeclarableState = {
    kind: 'businessLive';
    value: boolean;
    /** 宣言の根拠（例: 「運用開始台帳 2026-07-24 記載」）。無検証バッジの説明に使う。 */
    basis: string;
};
/** 実行時に許可リストへ照合した結果。不正objectは拒否（表示せずエラー個別表示へ回す）。 */
export type DeclaredStateValidation = {
    ok: true;
    state: DeclarableState;
} | {
    ok: false;
    reason: string;
    received: unknown;
};
/**
 * ランタイム面（local/preview/production）の検出設定。
 *   production は明示設定を必須にする＝設定が無いホストは unknown に落とし、
 *   「安全側集約」の根拠にしない（fail-closed）。
 */
export type RuntimeDetectorConfig = {
    productionHosts?: string[];
    previewHosts?: string[];
    localHosts?: string[];
    /** 独自判定。値を返せば最優先で採用、undefined を返せば既定ロジックへ委譲。 */
    classify?: (hostname: string) => RuntimeSurface | undefined;
};
/**
 * location.hostname 等からランタイム面を機械判定する。
 *   確証が持てない場合は 'unknown' を返す（不明を安全側へ丸めない）。
 */
export declare function detectRuntime(config?: RuntimeDetectorConfig, hostname?: string | undefined): RuntimeSurface;
/**
 * アプリから渡された宣言状態を許可リストへ照合する。
 *   kind が 'businessLive' 以外／構造不正なら拒否（ok:false）＝表示せずエラーにする。
 *   本番URL・書込状態を騙る object はここで弾かれ、「無検証つき表示」すら許さない。
 */
export declare function validateDeclaredState(input: unknown): DeclaredStateValidation;
/** 表示アイテム。unverified は「無検証」バッジ併記対象、detail は tooltip 説明。 */
export type StatusDisplayItem = {
    id: string;
    label: string;
    tone: StatusTone;
    unverified?: boolean;
    detail?: string;
};
/** 検出器を回し終えた後の確定スナップショット（deriveStatusDisplay の入力）。 */
export type StatusResolution = {
    /** 検出が解決済みか。false の間は「状態確認中」だけを出す。 */
    healthReady: boolean;
    runtimeSurface: RuntimeSurface;
    /** 書込検出の結果。null = 未検出／不明。 */
    writable: boolean | null;
    /** 書込検出関数が例外・reject で落ちたか（fail-closed 用）。 */
    writeDetectorFailed: boolean;
    /** 許可リストを通った宣言のみ。 */
    declared: DeclarableState[];
    /** 拒否された宣言（不正 kind 等）。個別にエラー表示する。 */
    rejected: Array<{
        reason: string;
        received: unknown;
    }>;
};
export type StatusDisplayResult = {
    mode: 'aggregate' | 'exposed';
    visible: StatusDisplayItem[];
};
/**
 * 安全側集約ルール（fail-closed）。
 *   全検出が成功しかつ安全側（非production かつ 書込OFF）に揃い、
 *   拒否も宣言も無い時だけ 1 バッジへ畳む。判定不能・不整合・宣言存在なら個別展開。
 *   「無検証を含む状態は集約対象から常に除外」＝宣言があるだけで集約禁止。
 */
export declare function deriveStatusDisplay(resolution: StatusResolution): StatusDisplayResult;
//# sourceMappingURL=statusDetection.d.ts.map