/**
 * @magi/core/ui — 状態検出・安全集約ロジック（v0.5.1・AppShell / Sol R1 修正）
 *
 * 設計の背骨（2026-07-24裁定・候補_core_AppShell部品設計.md §0）:
 *   「状態表示は自己申告にしない」。本番URL・書込ON/OFF はアプリが値を渡せない。
 *   アプリが宣言できるのは機械検出が困難な業務状態のみで、必ず「無検証」バッジを併記する。
 *
 * Sol R1 レビュー修正（v0.5.1）:
 *   - R1-C2-DETECTOR-SELFDECLARATION: 任意 classify を公開APIから撤去（hostnameリストのみ＝
 *     Core所有ロジック）。書込検出は Core提供ファクトリ（createEnvWriteDetector /
 *     createEndpointWriteDetector）が返す TrustedWriteDetector を「信頼済み」とし、
 *     生関数（未検証）の結果は書込バッジに「無検証」を併記して集約から除外する。
 *   - R1-C2-FAILCLOSED-EDGE: 空文字ホストを local 既定から除外／hostname 不能は unknown／
 *     書込結果は typeof boolean のみ受理（Boolean() 丸めを廃止）。
 *   - R1-C2-INVALID-KIND-THROW: 拒否理由生成を JSON.stringify から例外安全な記述へ置換。
 *     validator は決して throw せず ok:false を返す。
 *
 * 本ファイルは React に依存しない純ロジックだけを持ち、MagiStatusSummary（tsx）が
 *   非同期検出を回した結果をここへ渡して表示形へ畳む（単体テストで直接検証できる）。
 */
export type RuntimeSurface = 'local' | 'preview' | 'production' | 'unknown';
export type StatusTone = 'ok' | 'neutral' | 'warn' | 'danger' | 'info';
/**
 * アプリが宣言できる状態の許可リスト型（Sol R1指摘の物理化）。
 *   現時点では業務本番化（businessLive）のみ。本番URL・書込ON/OFF を表す kind は
 *   型に存在させない＝アプリが自己申告する経路を型レベルで塞ぐ。
 */
export type DeclarableState = {
    kind: 'businessLive';
    value: boolean;
    /** 宣言の根拠（例: 「運用開始台帳 2026-07-24 記載」）。無検証バッジの説明に使う。 */
    basis: string;
};
/** 実行時に許可リストへ照合した結果。不正 object は拒否（表示せずエラー個別表示へ回す）。 */
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
 *   任意 classify コールバックは公開しない（定数で安全状態を偽装できるため・R1-C2）。
 */
export type RuntimeDetectorConfig = {
    productionHosts?: string[];
    previewHosts?: string[];
    localHosts?: string[];
};
/**
 * location.hostname 等からランタイム面を機械判定する。
 *   hostname が取得できない／空文字なら 'unknown'（不明を local に丸めない・R1-C2）。
 *   確証が持てない場合も 'unknown' を返す。決して throw しない。
 */
export declare function detectRuntime(config?: RuntimeDetectorConfig, hostname?: string | undefined): RuntimeSurface;
/**
 * アプリから渡された宣言状態を許可リストへ照合する。
 *   kind が 'businessLive' 以外／構造不正なら拒否（ok:false）＝表示せずエラーにする。
 *   本番URL・書込状態を騙る object はここで弾かれ、「無検証つき表示」すら許さない。
 *   R1-C2-INVALID-KIND-THROW: 構造検査と全プロパティアクセス（kind/value/basis）を含む
 *   validator 全体を例外境界で囲む。throwing getter・Proxy でも throw せず ok:false を返す
 *   （BigInt・循環参照・Symbol も同様）＝レンダー中断を起こさない。
 */
export declare function validateDeclaredState(input: unknown): DeclaredStateValidation;
/** 書込ON/OFF の検出関数。真偽値を直接渡す props は設けない（自己申告を型で塞ぐ）。 */
export type WriteDetector = () => boolean | Promise<boolean>;
declare const TRUSTED_WRITE_DETECTOR: unique symbol;
/**
 * Core提供ファクトリが返す「信頼済み」書込検出器。生関数・任意コールバックと区別する。
 *   型ブランド＋実行時シンボルの二重化で、採用アプリが手で偽装できないようにする。
 *   R1-C2（round2）: 信頼済みになれるのは createEndpointWriteDetector（同一オリジン health を
 *   固定スキーマで観測）だけ。任意 read/extract を受けるアダプタは trusted にしない。
 */
export type TrustedWriteDetector = WriteDetector & {
    readonly [TRUSTED_WRITE_DETECTOR]: true;
};
/** 検出器が Core提供ファクトリ由来（信頼済み）かを実行時に判定する。 */
export declare function isTrustedWriteDetector(fn: WriteDetector): fn is TrustedWriteDetector;
/**
 * 環境値から書込可否を読むアダプタ。**無検証扱い（trusted にしない）**。
 *   R1-C2（round2 修正）: 任意 read を無条件に信頼できない（定数 false 等で安全状態を偽装できる）。
 *   ブランドを付けないため、生関数と同じく書込バッジに「無検証」を併記し安全側集約から除外される。
 *   boolean 以外は throw して検出失敗（fail-closed）へ落とす。後方互換のため名前は残す。
 *   信頼済みで観測したい場合は createEndpointWriteDetector（同一オリジン health）を使う。
 */
export declare function createEnvWriteDetector(read: () => unknown): WriteDetector;
/**
 * 同一オリジンの health エンドポイントを実観測して書込可否を読む**信頼済み**検出器を作る。
 *   R1-C2（round2）: 観測元と抽出方法を Core が固定する＝
 *     - path は同一オリジンに解決できる場合のみ（クロスオリジンは throw）
 *     - レスポンスの固定フィールド `storage.writable` が boolean の時だけ採用（カスタム extract 廃止）
 *   fetch 失敗・非OK・スキーマ不一致・非boolean はすべて throw＝検出失敗（fail-closed）へ落ちる。
 */
export declare function createEndpointWriteDetector(path: string, init?: RequestInit): TrustedWriteDetector;
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
    /** 書込検出関数が例外・reject・非boolean で落ちたか（fail-closed 用）。 */
    writeDetectorFailed: boolean;
    /** 書込検出器が Core提供ファクトリ由来（信頼済み）か。生関数は false＝無検証扱い。 */
    writeTrusted: boolean;
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
 *   全検出が成功しかつ安全側（非production かつ 信頼済み検出器で書込OFF）に揃い、
 *   拒否も宣言も無い時だけ 1 バッジへ畳む。判定不能・不整合・宣言存在・無検証書込なら個別展開。
 *   「無検証を含む状態は集約対象から常に除外」＝宣言 or 未検証書込があるだけで集約禁止。
 */
export declare function deriveStatusDisplay(resolution: StatusResolution): StatusDisplayResult;
export {};
//# sourceMappingURL=statusDetection.d.ts.map