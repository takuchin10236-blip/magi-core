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
// 空文字を含めない（hostname 取得不能を local に丸めない・R1-C2-FAILCLOSED-EDGE）。
const DEFAULT_LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0'];
function isLocalHost(hostname) {
    if (DEFAULT_LOCAL_HOSTS.includes(hostname))
        return true;
    return hostname.endsWith('.local');
}
function currentHostname() {
    try {
        return typeof location !== 'undefined' ? location.hostname : undefined;
    }
    catch {
        return undefined;
    }
}
/**
 * location.hostname 等からランタイム面を機械判定する。
 *   hostname が取得できない／空文字なら 'unknown'（不明を local に丸めない・R1-C2）。
 *   確証が持てない場合も 'unknown' を返す。決して throw しない。
 */
export function detectRuntime(config = {}, hostname = currentHostname()) {
    if (hostname === undefined || hostname === '')
        return 'unknown';
    if (config.productionHosts?.includes(hostname))
        return 'production';
    if (config.previewHosts?.includes(hostname))
        return 'preview';
    if (config.localHosts?.includes(hostname) || isLocalHost(hostname))
        return 'local';
    return 'unknown';
}
/** 未知値を例外なく記述する（JSON.stringify は BigInt/循環で throw する・R1-C2-INVALID-KIND-THROW）。 */
function describeUnknown(value) {
    try {
        if (typeof value === 'string')
            return `'${value}'`;
        if (typeof value === 'bigint')
            return `${String(value)}n`;
        if (value === null)
            return 'null';
        return typeof value; // 'object' | 'number' | 'symbol' | 'boolean' | 'undefined' | 'function'
    }
    catch {
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
export function validateDeclaredState(input) {
    try {
        if (typeof input !== 'object' || input === null) {
            return { ok: false, reason: '状態宣言がオブジェクトではありません', received: input };
        }
        const record = input;
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
    }
    catch {
        // プロパティアクセス（throwing getter/Proxy）等で例外が出てもレンダーを止めない。
        // received に危険な object を持ち越さない（後続で再アクセスさせない）ため null にする。
        return { ok: false, reason: '状態宣言の読み取り中にエラーが発生しました', received: null };
    }
}
// 信頼済みマーカー（Core が観測元と抽出方法を固定できる検出器だけが付与できる）。
const TRUSTED_WRITE_DETECTOR = Symbol('magi.trustedWriteDetector');
function brandTrusted(fn) {
    Object.defineProperty(fn, TRUSTED_WRITE_DETECTOR, { value: true, enumerable: false });
    return fn;
}
/** 検出器が Core提供ファクトリ由来（信頼済み）かを実行時に判定する。 */
export function isTrustedWriteDetector(fn) {
    return (typeof fn === 'function' &&
        fn[TRUSTED_WRITE_DETECTOR] === true);
}
/**
 * 環境値から書込可否を読むアダプタ。**無検証扱い（trusted にしない）**。
 *   R1-C2（round2 修正）: 任意 read を無条件に信頼できない（定数 false 等で安全状態を偽装できる）。
 *   ブランドを付けないため、生関数と同じく書込バッジに「無検証」を併記し安全側集約から除外される。
 *   boolean 以外は throw して検出失敗（fail-closed）へ落とす。後方互換のため名前は残す。
 *   信頼済みで観測したい場合は createEndpointWriteDetector（同一オリジン health）を使う。
 */
export function createEnvWriteDetector(read) {
    return () => {
        const value = read();
        if (typeof value !== 'boolean') {
            throw new Error('write flag is not a boolean');
        }
        return value;
    };
}
/**
 * 同一オリジンの health エンドポイントを実観測して書込可否を読む**信頼済み**検出器を作る。
 *   R1-C2（round2）: 観測元と抽出方法を Core が固定する＝
 *     - path は同一オリジンに解決できる場合のみ（クロスオリジンは throw）
 *     - レスポンスの固定フィールド `storage.writable` が boolean の時だけ採用（カスタム extract 廃止）
 *   fetch 失敗・非OK・スキーマ不一致・非boolean はすべて throw＝検出失敗（fail-closed）へ落ちる。
 */
export function createEndpointWriteDetector(path, init) {
    return brandTrusted(async () => {
        const url = resolveSameOrigin(path);
        const res = await fetch(url, init);
        if (!res.ok)
            throw new Error(`write endpoint responded ${res.status}`);
        const payload = (await res.json());
        const writable = readStorageWritable(payload);
        if (typeof writable !== 'boolean') {
            throw new Error('write endpoint payload has no boolean storage.writable');
        }
        return writable;
    });
}
/** path を同一オリジンに解決する。クロスオリジン・解決不能は throw（信頼済み経路の前提）。 */
function resolveSameOrigin(path) {
    if (typeof location === 'undefined') {
        if (path.startsWith('/'))
            return path; // SSR等: 相対パスのみ許可
        throw new Error('write endpoint must be a same-origin path');
    }
    const url = new URL(path, location.origin);
    if (url.origin !== location.origin) {
        throw new Error('write endpoint must be same-origin');
    }
    return url.toString();
}
/** health レスポンスの固定フィールド storage.writable を読む（それ以外の経路は設けない）。 */
function readStorageWritable(payload) {
    if (payload && typeof payload === 'object') {
        const p = payload;
        if (p.storage && typeof p.storage === 'object') {
            return p.storage.writable;
        }
    }
    return undefined;
}
/**
 * 安全側集約ルール（fail-closed）。
 *   全検出が成功しかつ安全側（非production かつ 信頼済み検出器で書込OFF）に揃い、
 *   拒否も宣言も無い時だけ 1 バッジへ畳む。判定不能・不整合・宣言存在・無検証書込なら個別展開。
 *   「無検証を含む状態は集約対象から常に除外」＝宣言 or 未検証書込があるだけで集約禁止。
 */
export function deriveStatusDisplay(resolution) {
    if (!resolution.healthReady) {
        return { mode: 'exposed', visible: [{ id: 'status-loading', label: '状態確認中', tone: 'warn' }] };
    }
    const aggregateEligible = resolution.rejected.length === 0 &&
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
    const visible = [];
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
    }
    else if (resolution.runtimeSurface === 'production') {
        visible.push({ id: 'production-url', label: '本番URL', tone: 'danger' });
    }
    if (resolution.writeDetectorFailed) {
        visible.push({ id: 'write-detect-failed', label: '書込確認中', tone: 'warn', detail: '書込検出に失敗しました' });
    }
    else if (resolution.writable === null) {
        visible.push({ id: 'write-unknown', label: '書込確認中', tone: 'warn' });
    }
    else if (!resolution.writeTrusted) {
        // 生（未検証）検出器の結果は自己申告と同じ扱い＝無検証を併記し、集約から除外して個別表示。
        visible.push({
            id: resolution.writable ? 'write-on-unverified' : 'write-off-unverified',
            label: resolution.writable ? '書込ON' : '書込OFF',
            tone: resolution.writable ? 'danger' : 'neutral',
            unverified: true,
            detail: '信頼済み検出器（createEnvWriteDetector / createEndpointWriteDetector）ではないため無検証',
        });
    }
    else if (resolution.writable) {
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
//# sourceMappingURL=statusDetection.js.map