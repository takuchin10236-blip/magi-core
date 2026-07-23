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
const DEFAULT_LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', ''];
function isLocalHost(hostname) {
    if (DEFAULT_LOCAL_HOSTS.includes(hostname))
        return true;
    return hostname.endsWith('.local');
}
/**
 * location.hostname 等からランタイム面を機械判定する。
 *   確証が持てない場合は 'unknown' を返す（不明を安全側へ丸めない）。
 */
export function detectRuntime(config = {}, hostname = typeof location !== 'undefined' ? location.hostname : undefined) {
    const host = hostname ?? '';
    const custom = config.classify?.(host);
    if (custom)
        return custom;
    if (config.productionHosts?.includes(host))
        return 'production';
    if (config.previewHosts?.includes(host))
        return 'preview';
    if (config.localHosts?.includes(host) || isLocalHost(host))
        return 'local';
    return 'unknown';
}
/**
 * アプリから渡された宣言状態を許可リストへ照合する。
 *   kind が 'businessLive' 以外／構造不正なら拒否（ok:false）＝表示せずエラーにする。
 *   本番URL・書込状態を騙る object はここで弾かれ、「無検証つき表示」すら許さない。
 */
export function validateDeclaredState(input) {
    if (typeof input !== 'object' || input === null) {
        return { ok: false, reason: '状態宣言がオブジェクトではありません', received: input };
    }
    const record = input;
    if (record.kind !== 'businessLive') {
        return {
            ok: false,
            reason: `許可されていない状態種別です（kind=${JSON.stringify(record.kind)}）`,
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
/**
 * 安全側集約ルール（fail-closed）。
 *   全検出が成功しかつ安全側（非production かつ 書込OFF）に揃い、
 *   拒否も宣言も無い時だけ 1 バッジへ畳む。判定不能・不整合・宣言存在なら個別展開。
 *   「無検証を含む状態は集約対象から常に除外」＝宣言があるだけで集約禁止。
 */
export function deriveStatusDisplay(resolution) {
    if (!resolution.healthReady) {
        return { mode: 'exposed', visible: [{ id: 'status-loading', label: '状態確認中', tone: 'warn' }] };
    }
    const aggregateEligible = resolution.rejected.length === 0 &&
        resolution.declared.length === 0 &&
        (resolution.runtimeSurface === 'local' || resolution.runtimeSurface === 'preview') &&
        resolution.writable === false &&
        !resolution.writeDetectorFailed;
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
    else if (resolution.writable) {
        visible.push({ id: 'write-on', label: '書込ON', tone: 'danger' });
    }
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