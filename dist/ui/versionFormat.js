/**
 * @magi/core/ui — 版表示の整形ユーティリティ（v0.5・AppShell）
 *
 * magi-resident-spine src/lib/version.ts の思想を踏襲:
 *   版番号・ビルド時刻はハードコードせず単一ソース（ビルド時注入）から来た値だけを整形する。
 *   core 版は「値を持たない」＝アプリが version / buildTime を props で渡し、ここは整形のみ。
 */
/** 'v1.3.1-release' → 'v1.3.1'。'v' 無しは補う。semver 主要3桁までに詰める。 */
export function shortVersion(version) {
    const normalized = version.startsWith('v') ? version : `v${version}`;
    return normalized.match(/^v\d+\.\d+\.\d+/)?.[0] ?? normalized;
}
/** ISO文字列を Asia/Tokyo の「M/D HH:MM」へ。空・不正は空文字。 */
export function formatBuildTime(iso) {
    const date = new Date(iso);
    if (!iso || Number.isNaN(date.getTime()))
        return '';
    const parts = Object.fromEntries(new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        hourCycle: 'h23',
    })
        .formatToParts(date)
        .map((part) => [part.type, part.value]));
    return `${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}
/** ISO文字列が時刻として読めれば数値を返す。空・不正は undefined。 */
function timeValueOf(iso) {
    if (!iso)
        return undefined;
    const value = new Date(iso).getTime();
    return Number.isNaN(value) ? undefined : value;
}
/**
 * ラベルに出す時刻を選ぶ。ビルド時刻とデータ台帳の更新時刻のうち**新しい方**。
 * 版表示は「何か手を加えて本番へ反映したこと」を捉えるためにあり、コードが変わらなくても
 * 台帳を変えれば時刻が動くのが社長の期待（2026-08-25）。片方が空・不正でも他方で表示を保つ
 * ＝表示は落とさない。同時刻ならビルド側を採る（コード反映の方が広い出来事のため）。
 */
export function resolveReleaseTime(buildTime = '', dataUpdatedAt = '') {
    const build = timeValueOf(buildTime);
    const data = timeValueOf(dataUpdatedAt);
    if (build !== undefined && data !== undefined) {
        return data > build ? { iso: dataUpdatedAt, source: 'data' } : { iso: buildTime, source: 'build' };
    }
    if (build !== undefined)
        return { iso: buildTime, source: 'build' };
    if (data !== undefined)
        return { iso: dataUpdatedAt, source: 'data' };
    return { iso: '', source: 'none' };
}
/** 'v1.3.1 7/21 09:05' の短い版ラベル。出せる時刻（ビルド／データ更新の新しい方）が無ければ版のみ。 */
export function formatReleaseLabel(version, buildTime = '', dataUpdatedAt = '') {
    const shownAt = formatBuildTime(resolveReleaseTime(buildTime, dataUpdatedAt).iso);
    const compact = shortVersion(version);
    return shownAt ? `${compact} ${shownAt}` : compact;
}
//# sourceMappingURL=versionFormat.js.map