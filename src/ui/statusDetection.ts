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
 *   どんな入力でも決して throw しない（BigInt・循環参照・Symbol 等も ok:false へ）。
 */
export function validateDeclaredState(input: unknown): DeclaredStateValidation {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, reason: '状態宣言がオブジェクトではありません', received: input };
  }
  const record = input as Record<string, unknown>;
  if (record.kind !== 'businessLive') {
    return {
      ok: false,
      reason: `許可されていない状態種別です（kind=${describeUnknown(record.kind)}）`,
      received: input,
    };
  }
  if (typeof record.value !== 'boolean') {
    return { ok: false, reason: 'value が真偽値ではありません', received: input };
  }
  if (typeof record.basis !== 'string' || record.basis.length === 0) {
    return { ok: false, reason: '宣言根拠（basis）が空です', received: input };
  }
  return { ok: true, state: { kind: 'businessLive', value: record.value, basis: record.basis } };
}

// ── 書込検出（信頼済み検出器のブランド化・R1-C2-DETECTOR-SELFDECLARATION） ──

/** 書込ON/OFF の検出関数。真偽値を直接渡す props は設けない（自己申告を型で塞ぐ）。 */
export type WriteDetector = () => boolean | Promise<boolean>;

// 信頼済みマーカー（Core提供ファクトリだけが付与できる）。型ブランドと実行時判定に使う。
const TRUSTED_WRITE_DETECTOR: unique symbol = Symbol('magi.trustedWriteDetector');

/**
 * Core提供ファクトリが返す「信頼済み」書込検出器。生関数（自己申告）と区別する。
 *   型ブランド＋実行時シンボルの二重化で、採用アプリが手で偽装できないようにする。
 */
export type TrustedWriteDetector = WriteDetector & { readonly [TRUSTED_WRITE_DETECTOR]: true };

function brandTrusted(fn: WriteDetector): TrustedWriteDetector {
  Object.defineProperty(fn, TRUSTED_WRITE_DETECTOR, { value: true, enumerable: false });
  return fn as TrustedWriteDetector;
}

/** 検出器が Core提供ファクトリ由来（信頼済み）かを実行時に判定する。 */
export function isTrustedWriteDetector(fn: WriteDetector): fn is TrustedWriteDetector {
  return (
    typeof fn === 'function' &&
    (fn as unknown as Record<symbol, unknown>)[TRUSTED_WRITE_DETECTOR] === true
  );
}

/**
 * 環境値（環境変数・設定エンドポイントの実値）から書込可否を読む信頼済み検出器を作る。
 *   read() の戻りは boolean のみ受理。それ以外は throw して検出失敗（fail-closed）へ落とす。
 */
export function createEnvWriteDetector(read: () => unknown): TrustedWriteDetector {
  return brandTrusted(() => {
    const value = read();
    if (typeof value !== 'boolean') {
      throw new Error('write flag is not a boolean');
    }
    return value;
  });
}

/**
 * エンドポイント（/api/health 等）を実観測して書込可否を読む信頼済み検出器を作る。
 *   fetch 失敗・非OK・非boolean はすべて throw＝検出失敗（fail-closed）へ落ちる。
 *   既定は payload.writable / payload.storage.writable を読む。extract で差し替え可能。
 */
export function createEndpointWriteDetector(
  url: string,
  options: { extract?: (payload: unknown) => unknown; init?: RequestInit } = {},
): TrustedWriteDetector {
  const extract = options.extract ?? defaultWritableExtract;
  return brandTrusted(async () => {
    const res = await fetch(url, options.init);
    if (!res.ok) throw new Error(`write endpoint responded ${res.status}`);
    const payload = (await res.json()) as unknown;
    const writable = extract(payload);
    if (typeof writable !== 'boolean') {
      throw new Error('write endpoint payload has no boolean writable flag');
    }
    return writable;
  });
}

function defaultWritableExtract(payload: unknown): unknown {
  if (payload && typeof payload === 'object') {
    const p = payload as { writable?: unknown; storage?: { writable?: unknown } };
    if (typeof p.writable === 'boolean') return p.writable;
    if (p.storage && typeof p.storage === 'object' && typeof p.storage.writable === 'boolean') {
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
