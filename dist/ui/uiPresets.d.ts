/**
 * @magi/core/ui — テーマプリセット定義（v0.2 / v0.14.0 で第3モード「残照」）
 *
 * 「4プリセット × 陽光/残照/月光 = 12テーマ」のメタデータ。
 *   UiMode    … 大分類2つ（standard / nova）
 *   UiPreset  … 4プリセット（standard-lumen / standard-aura / nova-carbon / nova-ember）
 *   ThemeMode … white（陽光）/ dusk（残照）/ dark（月光）
 *
 * 原本: magi-resident-spine/src/lib/uiPresets.ts（挙動・正規化規則を完全踏襲）。
 * design-system.css の :root[data-ui-preset="..."][data-color-mode="..."] と対になる。
 * DisplaySwitch / ColorModeSwitch / useThemeState が参照する。
 *
 * v0.14.0（2026-08-08 社長採用「テーマ第3モード残照 仕様 v1.0」）:
 *   - 内部値は後方互換を壊さない＝ white / dark は既存のまま、`dusk` を**新設のみ**。
 *   - 表示名は光の名で三対（陽光・残照・月光）。読めない職員のためにアイコンを添える。
 *   - 手動選択に加えて「自動」（時刻帯で切り替え）を持つ＝ ThemeModeSetting。
 *     **手動が常に優先**で、「自動」を選び直したときだけ帯運転へ戻る。
 */
export type UiMode = 'standard' | 'nova';
export type ThemeMode = 'white' | 'dusk' | 'dark';
/**
 * 職員が「選ぶ」値。実際に適用される ThemeMode に加えて 'auto'（時刻帯で自動）を取る。
 * ThemeMode（適用中の実モード）とは別物なので、混ぜずに2つ持つ。
 */
export type ThemeModeSetting = ThemeMode | 'auto';
export type UiPreset = 'standard-lumen' | 'standard-aura' | 'nova-carbon' | 'nova-ember';
export interface UiModeDefinition {
    value: UiMode;
    label: string;
    shortLabel: string;
    description: string;
}
export interface UiPresetDefinition {
    value: UiPreset;
    mode: UiMode;
    label: string;
    shortLabel: string;
    description: string;
}
/** 色モードの表示メタ（表示名は漢字2字・読みは職員向けの補助）。 */
export interface ThemeModeDefinition {
    value: ThemeMode;
    /** 表示名（漢字2字）。 */
    label: string;
    /** 読み（ふりがな・説明文やツールチップで使う）。 */
    reading: string;
    description: string;
}
/**
 * 陽光 / 残照 / 月光（仕様 v1.0 §1 の命名表そのまま）。
 * 並び順＝明るい順。切替UIはこの順で出す。
 */
export declare const THEME_MODES: ThemeModeDefinition[];
export declare function getThemeMode(value: ThemeMode): ThemeModeDefinition;
export declare const UI_MODES: UiModeDefinition[];
export declare const UI_PRESETS: UiPresetDefinition[];
export declare const DEFAULT_UI_PRESET: UiPreset;
export declare const DEFAULT_THEME_MODE: ThemeMode;
/**
 * 既定の「選択値」。既存アプリの初期表示を変えないため **'auto' にしない**
 * （保存値が無いアプリは今までどおり陽光で始まる。自動運転は職員が選んで初めて動く）。
 */
export declare const DEFAULT_THEME_MODE_SETTING: ThemeModeSetting;
/** 自動モードの時刻帯（仕様 v1.0 §4 の既定。アプリ側で調整可）。単位＝時（0–24）。 */
export interface AutoThemeSchedule {
    /** 陽光の開始時刻（既定 6:00）。 */
    dayStartHour: number;
    /** 残照の開始時刻（既定 16:00）。 */
    duskStartHour: number;
    /** 月光の開始時刻（既定 19:00）。 */
    nightStartHour: number;
}
/** 陽光 6:00–16:00 → 残照 16:00–19:00 → 月光 19:00–6:00（仕様 v1.0 §4）。 */
export declare const DEFAULT_AUTO_THEME_SCHEDULE: AutoThemeSchedule;
/** 自動モードの再評価間隔（15分・仕様 v1.0 §4）。 */
export declare const AUTO_THEME_REEVALUATE_MS: number;
/**
 * 端末時計から「今どの帯か」を決める純関数（試験可能にするため Date を受け取る）。
 * 境界は**開始時刻を含み、次の帯の開始時刻を含まない**（16:00 ちょうどは残照）。
 */
export declare function resolveAutoThemeMode(now?: Date, schedule?: AutoThemeSchedule): ThemeMode;
/** 選択値 → 実際に適用する ThemeMode。手動選択はそのまま通す（手動優先の実体）。 */
export declare function resolveThemeMode(setting: ThemeModeSetting, now?: Date, schedule?: AutoThemeSchedule): ThemeMode;
export declare function getUiPreset(value: UiPreset): UiPresetDefinition;
export declare function presetsForMode(mode: UiMode): UiPresetDefinition[];
export declare function firstPresetForMode(mode: UiMode): UiPreset;
export declare function normalizeUiPreset(value: string | null): UiPreset | null;
export declare function normalizeThemeMode(value: string | null): ThemeMode | null;
/** 保存値・属性値から「選択値」を復元する（'auto' を含む）。読めない値は null。 */
export declare function normalizeThemeModeSetting(value: string | null): ThemeModeSetting | null;
//# sourceMappingURL=uiPresets.d.ts.map