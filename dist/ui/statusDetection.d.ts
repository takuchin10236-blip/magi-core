/**
 * @magi/core/ui — 状態検出・安全集約ロジック（v0.5.3・AppShell / Sol R1〜残差 修正）
 *
 * 設計の背骨（2026-07-24裁定・候補_core_AppShell部品設計.md §0）:
 *   「状態表示は自己申告にしない」。本番URL・書込ON/OFF はアプリが値を渡せない。
 *   アプリが宣言できるのは機械検出が困難な業務状態のみで、必ず「無検証」バッジを併記する。
 *
 * 書込検出の信頼境界（v0.5.3 最終硬化・R1-C2-DETECTOR-SELFDECLARATION）:
 *   - **信頼済み（安全側集約に入れる）のは createHealthWriteDetector() だけ**。固定パス
 *     /api/health を GET・redirect 拒否・同一オリジン検証し、storage.writable 固定スキーマで観測する。
 *   - createEnvWriteDetector（環境値アダプタ）・生関数・任意コールバックは **すべて無検証**＝
 *     書込バッジに「無検証」を併記し集約から除外する（定数で安全状態を偽装できないように）。
 *   - 信頼判定は module-private WeakSet メンバーシップ（発見可能な Symbol プロパティは廃止）。
 *   - createEndpointWriteDetector は @deprecated 別名＝引数は無視され常に /api/health を観測する。
 *
 * その他の Sol 修正（継承）:
 *   - R1-C2-DETECTOR-SELFDECLARATION(R1): 任意 classify を公開APIから撤去（hostnameリストのみ）。
 *   - R1-C2-FAILCLOSED-EDGE: 空文字ホストを local 既定から除外／hostname 不能は unknown／
 *     書込結果は typeof boolean のみ受理（Boolean() 丸めを廃止）。
 *   - R1-C2-INVALID-KIND-THROW: validator 全体を例外境界で囲み、throwing getter/Proxy でも ok:false。
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
    /**
     * preview の**後方一致**（2026-08-27 追加）。Cloudflare Pages のpreviewは
     *   `<hash>.<project>.pages.dev`・`<branch>.<project>.pages.dev` とホスト名が毎回変わるため、
     *   完全一致（previewHosts）では列挙できない。`['.example.pages.dev']` のように先頭ドットで渡す。
     *   production 完全一致の**後**に評価する（apex本体を preview に誤判定しない）。
     */
    previewHostSuffixes?: string[];
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
declare const TRUSTED_WRITE_BRAND: unique symbol;
/**
 * Core が観測元も抽出方法も固定できる「信頼済み」書込検出器。
 *   R1-C2 最終硬化（v0.5.3）: 信頼判定を **module-private WeakSet** で持つ（発見可能な Symbol
 *   プロパティを廃止）＝ブランドのコピー・Symbol 付与・Proxy では偽装できない。
 *   信頼済みになれるのは createHealthWriteDetector（固定パス /api/health を GET・redirect 拒否・
 *   同一オリジン検証・storage.writable 固定スキーマで観測）だけ。生関数・任意コールバック・
 *   環境値アダプタ（createEnvWriteDetector）は無検証扱い（集約されない）。
 */
export type TrustedWriteDetector = WriteDetector & {
    readonly [TRUSTED_WRITE_BRAND]: true;
};
/** 検出器が Core提供ファクトリ由来（信頼済み）かを WeakSet メンバーシップで判定する。 */
export declare function isTrustedWriteDetector(fn: WriteDetector): fn is TrustedWriteDetector;
/**
 * 環境値から書込可否を読むアダプタ。**無検証扱い（trusted にしない・集約されない）**。
 *   任意 read を無条件に信頼できない（定数 false 等で安全状態を偽装できる）ため WeakSet に入れない。
 *   生関数と同じく書込バッジに「無検証」を併記し安全側集約から除外される。boolean 以外は throw。
 *   信頼済みで観測したいときは createHealthWriteDetector() を使う。
 */
export declare function createEnvWriteDetector(read: () => unknown): WriteDetector;
/**
 * 同一オリジンの固定 health エンドポイント（/api/health）を GET 実観測して書込可否を読む
 *   **信頼済み**検出器を返す（**引数なし**＝観測先を差し替える手段を公開 API から無くす）。
 *   R1-C2 最終硬化（v0.5.3）:
 *     - 固定パス /api/health のみ（別エンドポイント指定・クロスオリジンは不可能）
 *     - GET 固定・`redirect: 'error'`（リダイレクト追従を拒否）＋最終 response.url の origin 検証
 *     - 固定フィールド storage.writable が boolean の時だけ採用
 *   fetch 失敗・非OK・リダイレクト・スキーマ不一致・非boolean はすべて throw＝検出失敗（fail-closed）。
 *
 * v0.9.4: **毎回同じオブジェクトを返す**（シングルトン）。引数なし・観測先固定・
 *   インスタンス固有の状態ゼロなので意味論は変わらない。狙いは事故の封じ込めで、
 *   JSX の中で呼んでも参照が変わらない＝MagiStatusSummary の effect（依存 [writeDetector]）が
 *   毎レンダー回って /api/health を叩き続ける事故が起きない。
 */
export declare function createHealthWriteDetector(): TrustedWriteDetector;
/**
 * @deprecated v0.5.3 で固定パス化。**引数は無視され常に /api/health を GET 観測する**。
 *   後方互換のため export を残す。新規コードは createHealthWriteDetector() を使うこと。
 */
export declare function createEndpointWriteDetector(_path?: string, _init?: RequestInit): TrustedWriteDetector;
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