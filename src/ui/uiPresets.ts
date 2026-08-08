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

export type UiPreset =
  | 'standard-lumen'
  | 'standard-aura'
  | 'nova-carbon'
  | 'nova-ember';

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
export const THEME_MODES: ThemeModeDefinition[] = [
  { value: 'white', label: '陽光', reading: 'ようこう', description: '明るい背景で表示します（昼向け）' },
  { value: 'dusk', label: '残照', reading: 'ざんしょう', description: '夕焼けの背景で表示します（夕方向け）' },
  { value: 'dark', label: '月光', reading: 'げっこう', description: '暗い背景で表示します（夜向け）' },
];

export function getThemeMode(value: ThemeMode): ThemeModeDefinition {
  return THEME_MODES.find((mode) => mode.value === value) ?? THEME_MODES[0];
}

export const UI_MODES: UiModeDefinition[] = [
  {
    value: 'standard',
    label: 'Standard',
    shortLabel: 'Standard',
    description: '共有PCで迷わず使うための、罫線と密度を保った業務UI',
  },
  {
    value: 'nova',
    label: 'Nova',
    shortLabel: 'Nova',
    description: '質感と階層で見通しを良くする先進UI',
  },
];

export const UI_PRESETS: UiPresetDefinition[] = [
  {
    value: 'standard-lumen',
    mode: 'standard',
    label: 'Lumen',
    shortLabel: 'Lumen',
    description: 'Google Material 3系。明快な色とグリッドで毎日の操作に向いた標準UI',
  },
  {
    value: 'standard-aura',
    mode: 'standard',
    label: 'Aura',
    shortLabel: 'Aura',
    description: 'Apple HIG系。余白と透明感で静かに読ませる標準UI',
  },
  {
    value: 'nova-carbon',
    mode: 'nova',
    label: 'Carbon',
    shortLabel: 'Carbon',
    description: 'Cursor系。シャープで集中しやすいテック寄りのNova UI',
  },
  {
    value: 'nova-ember',
    mode: 'nova',
    label: 'Ember',
    shortLabel: 'Ember',
    description: 'Anthropic系。暖色のクラフト感で落ち着いて読めるNova UI',
  },
];

export const DEFAULT_UI_PRESET: UiPreset = 'standard-lumen';
export const DEFAULT_THEME_MODE: ThemeMode = 'white';
/**
 * 既定の「選択値」。既存アプリの初期表示を変えないため **'auto' にしない**
 * （保存値が無いアプリは今までどおり陽光で始まる。自動運転は職員が選んで初めて動く）。
 */
export const DEFAULT_THEME_MODE_SETTING: ThemeModeSetting = DEFAULT_THEME_MODE;

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
export const DEFAULT_AUTO_THEME_SCHEDULE: AutoThemeSchedule = {
  dayStartHour: 6,
  duskStartHour: 16,
  nightStartHour: 19,
};

/** 自動モードの再評価間隔（15分・仕様 v1.0 §4）。 */
export const AUTO_THEME_REEVALUATE_MS = 15 * 60 * 1000;

/** 時（0–24・小数可）を「その日の分」へ。異常値は既定値へ落とす（設定ミスで画面が壊れないように）。 */
function hourToMinutes(hour: number, fallback: number): number {
  if (!Number.isFinite(hour) || hour < 0 || hour >= 24) return Math.round(fallback * 60);
  return Math.round(hour * 60);
}

/** 円環時間の区間判定（start<=end はそのまま、跨ぎ（19:00–6:00）は2区間として見る）。 */
function inArc(minutes: number, start: number, end: number): boolean {
  if (start === end) return false;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

/**
 * 端末時計から「今どの帯か」を決める純関数（試験可能にするため Date を受け取る）。
 * 境界は**開始時刻を含み、次の帯の開始時刻を含まない**（16:00 ちょうどは残照）。
 */
export function resolveAutoThemeMode(
  now: Date = new Date(),
  schedule: AutoThemeSchedule = DEFAULT_AUTO_THEME_SCHEDULE,
): ThemeMode {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const day = hourToMinutes(schedule.dayStartHour, DEFAULT_AUTO_THEME_SCHEDULE.dayStartHour);
  const dusk = hourToMinutes(schedule.duskStartHour, DEFAULT_AUTO_THEME_SCHEDULE.duskStartHour);
  const night = hourToMinutes(schedule.nightStartHour, DEFAULT_AUTO_THEME_SCHEDULE.nightStartHour);
  if (inArc(minutes, dusk, night)) return 'dusk';
  if (inArc(minutes, night, day)) return 'dark';
  return 'white';
}

/** 選択値 → 実際に適用する ThemeMode。手動選択はそのまま通す（手動優先の実体）。 */
export function resolveThemeMode(
  setting: ThemeModeSetting,
  now: Date = new Date(),
  schedule: AutoThemeSchedule = DEFAULT_AUTO_THEME_SCHEDULE,
): ThemeMode {
  return setting === 'auto' ? resolveAutoThemeMode(now, schedule) : setting;
}

export function getUiPreset(value: UiPreset): UiPresetDefinition {
  return UI_PRESETS.find((preset) => preset.value === value) ?? UI_PRESETS[0];
}

export function presetsForMode(mode: UiMode): UiPresetDefinition[] {
  return UI_PRESETS.filter((preset) => preset.mode === mode);
}

export function firstPresetForMode(mode: UiMode): UiPreset {
  return presetsForMode(mode)[0]?.value ?? DEFAULT_UI_PRESET;
}

// 旧称・別名からの正規化（localStorage に古い値が残っていても安全に拾う）。
//   原本（利用者マスタ）の規則をそのまま踏襲する。
export function normalizeUiPreset(value: string | null): UiPreset | null {
  if (value === 'standard') return 'standard-lumen';
  if (value === 'nova') return 'nova-carbon';
  if (value === 'standard-basic') return 'standard-lumen';
  if (value === 'standard-enterprise') return 'standard-aura';
  if (value === 'nova-apple') return 'standard-aura';
  if (value === 'nova-anthropic') return 'nova-ember';
  return UI_PRESETS.some((preset) => preset.value === value) ? (value as UiPreset) : null;
}

export function normalizeThemeMode(value: string | null): ThemeMode | null {
  if (value === 'white' || value === 'light') return 'white';
  if (value === 'dark') return 'dark';
  // v0.14.0 新設。'sunset' は絵柄名（SgBrandLogo の variant）と揃えた別名として受ける。
  if (value === 'dusk' || value === 'sunset') return 'dusk';
  return null;
}

/** 保存値・属性値から「選択値」を復元する（'auto' を含む）。読めない値は null。 */
export function normalizeThemeModeSetting(value: string | null): ThemeModeSetting | null {
  if (value === 'auto') return 'auto';
  return normalizeThemeMode(value);
}
