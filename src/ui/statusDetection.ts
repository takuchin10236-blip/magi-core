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
export type DeclaredStateValidation =
  | { ok: true; state: DeclarableState }
  | { ok: false; reason: string; received: unknown };

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

// 空文字を含めない（hostname 取得不能を local に丸めない・R1-C2-FAILCLOSED-EDGE）。
const DEFAULT_LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0'];

function isLocalHost(hostname: string): boolean {
  if (DEFAULT_LOCAL_HOSTS.includes(hostname)) return true;
  return hostname.endsWith('.local');
}

function currentHostname(): string | undefined {
  try {
    return typeof location !== 'undefined' ? location.hostname : undefined;
  } catch {
    return undefined;
  }
}

/**
 * location.hostname 等からランタイム面を機械判定する。
 *   hostname が取得できない／空文字なら 'unknown'（不明を local に丸めない・R1-C2）。
 *   確証が持てない場合も 'unknown' を返す。決して throw しない。
 */
export function detectRuntime(
  config: RuntimeDetectorConfig = {},
  hostname: string | undefined = currentHostname(),
): RuntimeSurface {
  if (hostname === undefined || hostname === '') return 'unknown';

  if (config.productionHosts?.includes(hostname)) return 'production';
  if (config.previewHosts?.includes(hostname)) return 'preview';
  if (config.localHosts?.includes(hostname) || isLocalHost(hostname)) return 'local';
  return 'unknown';
}

/** 未知値を例外なく記述する（JSON.stringify は BigInt/循環で throw する・R1-C2-INVALID-KIND-THROW）。 */
function describeUnknown(value: unknown): string {
  try {
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'bigint') return `${String(value)}n`;
    if (value === null) return 'null';
    return typeof value; // 'object' | 'number' | 'symbol' | 'boolean' | 'undefined' | 'function'
  } catch {
    return '(記述不能)';
  }
}

/**
 * アプリから渡された宣言状態を許可リストへ照合する。
 *   kind が 'businessLive' 以外／構造不正なら拒否（ok:false）＝表示せずエラーにする。
 *   本番URL・書込状態を騙る object はここで弾かれ、「無検証つき表示」すら許さない。
 *   R1-C2-INVALID-KIND-THROW: 構造検査と全プロパティアクセス（kind/value/basis）を含む
 *   validator 全体を例外境界で囲む。throwing getter・Proxy でも throw せず ok:false を返す
 *   （BigInt・循環参照・Symbol も同様）＝レンダー中断を起こさない。
 */
export function validateDeclaredState(input: unknown): DeclaredStateValidation {
  try {
    if (typeof input !== 'object' || input === null) {
      return { ok: false, reason: '状態宣言がオブジェクトではありません', received: input };
    }
    const record = input as Record<string, unknown>;
    const kind = record.kind; // throwing getter/Proxy はこの読取時点で catch される
    if (kind !== 'businessLive') {
      return {
        ok: false,
        reason: `許可されていない状態種別です（kind=${describeUnknown(kind)}）`,
        received: input,
      };
    }
    const value = record.value;
    if (typeof value !== 'boolean') {
      return { ok: false, reason: 'value が真偽値ではありません', received: input };
    }
    const basis = record.basis;
    if (typeof basis !== 'string' || basis.length === 0) {
      return { ok: false, reason: '宣言根拠（basis）が空です', received: input };
    }
    return { ok: true, state: { kind: 'businessLive', value, basis } };
  } catch {
    // プロパティアクセス（throwing getter/Proxy）等で例外が出てもレンダーを止めない。
    // received に危険な object を持ち越さない（後続で再アクセスさせない）ため null にする。
    return { ok: false, reason: '状態宣言の読み取り中にエラーが発生しました', received: null };
  }
}

// ── 書込検出（信頼済み検出器・module-private WeakSet 判定・R1-C2-DETECTOR-SELFDECLARATION 最終硬化） ──

/** 書込ON/OFF の検出関数。真偽値を直接渡す props は設けない（自己申告を型で塞ぐ）。 */
export type WriteDetector = () => boolean | Promise<boolean>;

// 信頼済みブランド（型レベルの phantom marker のみ・実行時には現れない＝プロパティ複製で偽装不能）。
declare const TRUSTED_WRITE_BRAND: unique symbol;

/**
 * Core が観測元も抽出方法も固定できる「信頼済み」書込検出器。
 *   R1-C2 最終硬化（v0.5.3）: 信頼判定を **module-private WeakSet** で持つ（発見可能な Symbol
 *   プロパティを廃止）＝ブランドのコピー・Symbol 付与・Proxy では偽装できない。
 *   信頼済みになれるのは createHealthWriteDetector（固定パス /api/health を GET・redirect 拒否・
 *   同一オリジン検証・storage.writable 固定スキーマで観測）だけ。生関数・任意コールバック・
 *   環境値アダプタ（createEnvWriteDetector）は無検証扱い（集約されない）。
 */
export type TrustedWriteDetector = WriteDetector & { readonly [TRUSTED_WRITE_BRAND]: true };

// module-private。外部から到達不能＝メンバーシップ（信頼）の偽造ができない。
const trustedDetectors = new WeakSet<object>();

function markTrusted(fn: WriteDetector): TrustedWriteDetector {
  trustedDetectors.add(fn);
  return fn as TrustedWriteDetector;
}

/** 検出器が Core提供ファクトリ由来（信頼済み）かを WeakSet メンバーシップで判定する。 */
export function isTrustedWriteDetector(fn: WriteDetector): fn is TrustedWriteDetector {
  return typeof fn === 'function' && trustedDetectors.has(fn);
}

/**
 * 環境値から書込可否を読むアダプタ。**無検証扱い（trusted にしない・集約されない）**。
 *   任意 read を無条件に信頼できない（定数 false 等で安全状態を偽装できる）ため WeakSet に入れない。
 *   生関数と同じく書込バッジに「無検証」を併記し安全側集約から除外される。boolean 以外は throw。
 *   信頼済みで観測したいときは createHealthWriteDetector() を使う。
 */
export function createEnvWriteDetector(read: () => unknown): WriteDetector {
  return () => {
    const value = read();
    if (typeof value !== 'boolean') {
      throw new Error('write flag is not a boolean');
    }
    return value;
  };
}

/** Core が固定する health エンドポイントのパス（採用アプリは差し替えできない）。 */
const HEALTH_PATH = '/api/health';

/**
 * 同一オリジンの固定 health エンドポイント（/api/health）を GET 実観測して書込可否を読む
 *   **信頼済み**検出器を作る（**引数なし**＝観測先を差し替える手段を公開 API から無くす）。
 *   R1-C2 最終硬化（v0.5.3）:
 *     - 固定パス /api/health のみ（別エンドポイント指定・クロスオリジンは不可能）
 *     - GET 固定・`redirect: 'error'`（リダイレクト追従を拒否）＋最終 response.url の origin 検証
 *     - 固定フィールド storage.writable が boolean の時だけ採用
 *   fetch 失敗・非OK・リダイレクト・スキーマ不一致・非boolean はすべて throw＝検出失敗（fail-closed）。
 */
export function createHealthWriteDetector(): TrustedWriteDetector {
  return markTrusted(async () => {
    const url = resolveSameOrigin(HEALTH_PATH);
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'error',
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`health endpoint responded ${res.status}`);
    assertSameOriginResponse(res);
    const payload = (await res.json()) as unknown;
    const writable = readStorageWritable(payload);
    if (typeof writable !== 'boolean') {
      throw new Error('health endpoint payload has no boolean storage.writable');
    }
    return writable;
  });
}

/**
 * @deprecated v0.5.3 で固定パス化。**引数は無視され常に /api/health を GET 観測する**。
 *   後方互換のため export を残す。新規コードは createHealthWriteDetector() を使うこと。
 */
export function createEndpointWriteDetector(_path?: string, _init?: RequestInit): TrustedWriteDetector {
  return createHealthWriteDetector();
}

/** path を同一オリジンに解決する。クロスオリジン・解決不能は throw（信頼済み経路の前提）。 */
function resolveSameOrigin(path: string): string {
  if (typeof location === 'undefined') {
    if (path.startsWith('/')) return path; // SSR等: 相対パスのみ許可
    throw new Error('write endpoint must be a same-origin path');
  }
  const url = new URL(path, location.origin);
  if (url.origin !== location.origin) {
    throw new Error('write endpoint must be same-origin');
  }
  return url.toString();
}

/** リダイレクト等で最終 response.url がクロスオリジンになっていないか検証（redirect:'error' の保険）。 */
function assertSameOriginResponse(res: Response): void {
  if (typeof location === 'undefined' || !res.url) return;
  let origin: string;
  try {
    origin = new URL(res.url).origin;
  } catch {
    throw new Error('health endpoint response url invalid');
  }
  if (origin !== location.origin) {
    throw new Error('health endpoint redirected cross-origin');
  }
}

/** health レスポンスの固定フィールド storage.writable を読む（それ以外の経路は設けない）。 */
function readStorageWritable(payload: unknown): unknown {
  if (payload && typeof payload === 'object') {
    const p = payload as { storage?: { writable?: unknown } };
    if (p.storage && typeof p.storage === 'object') {
      return p.storage.writable;
    }
  }
  return undefined;
}

// ── 表示・集約 ──

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
  rejected: Array<{ reason: string; received: unknown }>;
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
export function deriveStatusDisplay(resolution: StatusResolution): StatusDisplayResult {
  if (!resolution.healthReady) {
    return { mode: 'exposed', visible: [{ id: 'status-loading', label: '状態確認中', tone: 'warn' }] };
  }

  const aggregateEligible =
    resolution.rejected.length === 0 &&
    resolution.declared.length === 0 &&
    (resolution.runtimeSurface === 'local' || resolution.runtimeSurface === 'preview') &&
    resolution.writable === false &&
    !resolution.writeDetectorFailed &&
    resolution.writeTrusted; // 信頼済み検出器の書込OFF だけが安全側集約の根拠になれる

  if (aggregateEligible) {
    return {
      mode: 'aggregate',
      visible: [{
        id: 'safe-aggregate',
        label: resolution.runtimeSurface === 'local' ? 'このPC内・書込OFF' : '試験運用・書込OFF',
        tone: 'ok',
      }],
    };
  }

  const visible: StatusDisplayItem[] = [];

  // 拒否された宣言（誤申告）は「無検証つき表示」ではなく、拒否のエラーとして個別表示する。
  resolution.rejected.forEach((entry, index) => {
    visible.push({
      id: `declared-rejected-${index}`,
      label: '状態申告エラー',
      tone: 'danger',
      detail: entry.reason,
    });
  });

  if (resolution.runtimeSurface === 'unknown') {
    visible.push({ id: 'runtime-unknown', label: '反映先確認中', tone: 'warn' });
  } else if (resolution.runtimeSurface === 'production') {
    visible.push({ id: 'production-url', label: '本番URL', tone: 'danger' });
  }

  if (resolution.writeDetectorFailed) {
    visible.push({ id: 'write-detect-failed', label: '書込確認中', tone: 'warn', detail: '書込検出に失敗しました' });
  } else if (resolution.writable === null) {
    visible.push({ id: 'write-unknown', label: '書込確認中', tone: 'warn' });
  } else if (!resolution.writeTrusted) {
    // 生（未検証）検出器の結果は自己申告と同じ扱い＝無検証を併記し、集約から除外して個別表示。
    visible.push({
      id: resolution.writable ? 'write-on-unverified' : 'write-off-unverified',
      label: resolution.writable ? '書込ON' : '書込OFF',
      tone: resolution.writable ? 'danger' : 'neutral',
      unverified: true,
      detail: '信頼済み検出器（createEnvWriteDetector / createEndpointWriteDetector）ではないため無検証',
    });
  } else if (resolution.writable) {
    visible.push({ id: 'write-on', label: '書込ON', tone: 'danger' });
  }
  // 信頼済み && writable===false は安全側＝ここでは何も出さない（集約対象）。

  // 宣言状態は必ず「無検証」バッジを併記して個別表示（安全側集約の根拠にしない）。
  resolution.declared.forEach((state) => {
    if (state.kind === 'businessLive') {
      visible.push({
        id: `declared-business-live-${state.value ? 'on' : 'off'}`,
        label: state.value ? '業務本番' : '業務本番: 未',
        tone: state.value ? 'danger' : 'neutral',
        unverified: true,
        detail: state.basis,
      });
    }
  });

  if (visible.length === 0) {
    // 論理上ここへは来ないが、空表示で「安心」に見せない防御（fail-closed）。
    visible.push({ id: 'status-indeterminate', label: '状態確認中', tone: 'warn' });
  }

  return { mode: 'exposed', visible };
}
