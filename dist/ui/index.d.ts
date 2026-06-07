/**
 * @magi/core/ui — 背骨UIエントリ（v0.2）
 *
 * 公開API:
 *   部品3つ（v0.1〜）:
 *     - ConfirmModal（汎用確認モーダル・ネイティブ confirm 撲滅用）
 *     - DraggableModal（ドラッグ可能モーダルの土台）
 *     - Toast: ToastProvider / useToast
 *   テーマシステム（v0.2 追加・8テーマ）:
 *     - DisplaySwitch（Standard/Nova・Lumen/Aura/Carbon/Ember・White/Dark を選ぶUI）
 *     - useThemeState（uiPreset/themeMode の状態・localStorage永続化・root data属性付与）
 *     - uiPresets の型・定義（UiMode/ThemeMode/UiPreset, UI_MODES/UI_PRESETS 等）
 *
 * CSS は採用側アプリが直接 import する:
 *     import '@magi/core/ui/design-system.css';  // v0.2: 完全な8テーマ（推奨）
 *     import '@magi/core/ui/core.css';            // v0.1: standard-lumen 最小核（後方互換）
 *   （package.json の exports に両方を公開している）
 *   design-system.css は core.css の核を包含するので、新規アプリは design-system.css 一本で良い。
 *
 * peerDependencies: react / react-dom / lucide-react / react-draggable
 *   （@magi/core 自身はこれらを bundle しない＝採用側アプリのものを使う）
 */
export { ConfirmModal } from './ConfirmModal';
export type { ConfirmTone } from './ConfirmModal';
export { DraggableModal } from './DraggableModal';
export { ToastProvider, useToast } from './Toast';
export type { ToastType } from './Toast';
export { DisplaySwitch } from './DisplaySwitch';
export type { DisplaySwitchProps } from './DisplaySwitch';
export { useThemeState } from './useThemeState';
export type { ThemeState, UseThemeStateOptions } from './useThemeState';
export { UI_MODES, UI_PRESETS, DEFAULT_UI_PRESET, DEFAULT_THEME_MODE, getUiPreset, presetsForMode, firstPresetForMode, normalizeUiPreset, normalizeThemeMode, } from './uiPresets';
export type { UiMode, ThemeMode, UiPreset, UiModeDefinition, UiPresetDefinition, } from './uiPresets';
//# sourceMappingURL=index.d.ts.map