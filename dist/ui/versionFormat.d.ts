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
/** 'v1.3.1 7/21 09:05' の短い版ラベル。ビルド時刻が無ければ版のみ。 */
export declare function formatReleaseLabel(version: string, buildTime?: string): string;
//# sourceMappingURL=versionFormat.d.ts.map