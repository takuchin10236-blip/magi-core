/**
 * @magi/core/ui — 版表示の整形ユーティリティ（v0.5・AppShell）
 *
 * magi-resident-spine src/lib/version.ts の思想を踏襲:
 *   版番号・ビルド時刻はハードコードせず単一ソース（ビルド時注入）から来た値だけを整形する。
 *   core 版は「値を持たない」＝アプリが version / buildTime を props で渡し、ここは整形のみ。
 */
/** 'v1.3.1-release' → 'v1.3.1'。'v' 無しは補う。semver 主要3桁までに詰める。 */
export declare function shortVersion(version: string): string;
/** ISO文字列を Asia/Tokyo の「M/D HH:MM」へ。空・不正は空文字。 */
export declare function formatBuildTime(iso: string): string;
/** ラベルの時刻がどちら由来か。'none' は出せる時刻が無い（版だけを出す）。 */
export type ReleaseTimeSource = 'build' | 'data' | 'none';
/**
 * ラベルに出す時刻を選ぶ。ビルド時刻とデータ台帳の更新時刻のうち**新しい方**。
 * 版表示は「何か手を加えて本番へ反映したこと」を捉えるためにあり、コードが変わらなくても
 * 台帳を変えれば時刻が動くのが社長の期待（2026-08-25）。片方が空・不正でも他方で表示を保つ
 * ＝表示は落とさない。同時刻ならビルド側を採る（コード反映の方が広い出来事のため）。
 */
export declare function resolveReleaseTime(buildTime?: string, dataUpdatedAt?: string): {
    iso: string;
    source: ReleaseTimeSource;
};
/** 'v1.3.1 7/21 09:05' の短い版ラベル。出せる時刻（ビルド／データ更新の新しい方）が無ければ版のみ。 */
export declare function formatReleaseLabel(version: string, buildTime?: string, dataUpdatedAt?: string): string;
//# sourceMappingURL=versionFormat.d.ts.map