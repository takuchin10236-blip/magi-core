/**
 * @magi/core/ui — 背骨UIエントリ（v0.4）
 *
 * 公開API:
 *   部品3つ（v0.1〜）:
 *     - ConfirmModal（汎用確認モーダル・ネイティブ confirm 撲滅用）
 *     - DraggableModal（ドラッグ可能モーダルの土台）
 *     - Toast: ToastProvider / useToast
 *   テーマシステム（v0.2 追加・8テーマ → v0.14.0 で第3モード「残照」＝12テーマ）:
 *     - DisplaySwitch（Standard/Nova・Lumen/Aura/Carbon/Ember・White/Dark を選ぶ開発者用UI）
 *     - ColorModeSwitch（職員向け 陽光/残照/月光/自動 の4択・v0.14.0）
 *     - useThemeState（uiPreset/themeMode/themeModeSetting の状態・localStorage永続化・
 *       root data属性付与・自動モードの時刻帯運転）
 *     - uiPresets の型・定義（UiMode/ThemeMode/ThemeModeSetting/UiPreset,
 *       UI_MODES/UI_PRESETS/THEME_MODES, resolveAutoThemeMode 等）
 *   統一マニュアルビューア（v0.3 追加）:
 *     - ManualViewer（全画面ページ型ビューア本体・左目次/右本文2カラム・検索/目次/ハイライト）
 *     - ManualEntry（サイドパネル用ボタン＋開閉。DisplaySwitch の直前に固定配置する規約）
 *     - 型: ManualContent / ManualSection / ManualBlock（器と中身の契約）
 *   状態表示（v0.4 追加）:
 *     - StatusBadge（状態バッジ原子部品。title属性一本化・data-tooltip非使用）
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
// 背景スクロールの錠（v0.13.7 で公開）。アプリ側が独自モーダルを持つ場合も、
// 自前で body.style.overflow を触らず必ずこの錠を使う（二重所有＝膠着の再来を防ぐ）。
export { lockBodyScroll, forceReleaseBodyScroll, getBodyScrollLockDepth } from './scrollLock';
export { ToastProvider, useToast } from './Toast';
export type { ToastType } from './Toast';

// テーマシステム（v0.2）
export { DisplaySwitch } from './DisplaySwitch';
export type { DisplaySwitchProps } from './DisplaySwitch';
export { useThemeState } from './useThemeState';
export type { ThemeState, UseThemeStateOptions } from './useThemeState';
export {
  UI_MODES,
  UI_PRESETS,
  DEFAULT_UI_PRESET,
  DEFAULT_THEME_MODE,
  getUiPreset,
  presetsForMode,
  firstPresetForMode,
  normalizeUiPreset,
  normalizeThemeMode,
} from './uiPresets';
export type {
  UiMode,
  ThemeMode,
  UiPreset,
  UiModeDefinition,
  UiPresetDefinition,
} from './uiPresets';
// 第3モード「残照」＋自動切替（v0.14.0・仕様 2026-08-08_テーマ第3モード残照_v1.0）
export {
  THEME_MODES,
  DEFAULT_THEME_MODE_SETTING,
  DEFAULT_AUTO_THEME_SCHEDULE,
  AUTO_THEME_REEVALUATE_MS,
  getThemeMode,
  normalizeThemeModeSetting,
  resolveAutoThemeMode,
  resolveThemeMode,
} from './uiPresets';
export type { ThemeModeSetting, ThemeModeDefinition, AutoThemeSchedule } from './uiPresets';

// 統一マニュアルビューア（v0.3）
export { ManualViewer } from './ManualViewer';
export { ManualEntry } from './ManualEntry';
export type { ManualEntryProps } from './ManualEntry';
export type { ManualBlock, ManualSection, ManualContent } from './manual-types';

// 状態表示（v0.4）
export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps, StatusTone } from './StatusBadge';

// AppShell 部品群（v0.5）
// 旧ロゴ（SVG）。2026-08-09 の裁定で廃止＝新規に選ばない。既存アプリのビルドを壊さないため
//   export だけ残す（削除は次のメジャー）。実体側に @deprecated を付けてある。
export { SgLumenLogo } from './SgLumenLogo';
export type { SgLumenLogoProps } from './SgLumenLogo';
// 正式ブランドロゴ（絵画調SG・PNG・テーマ連動／v0.8 追加）。
//   2026-08-09 社長裁定で **MagiAppShell の既定ロゴ**になった（ロゴを1本に統一）。
export { SgBrandLogo, SG_BRAND_LOGO_SOURCES } from './SgBrandLogo';
export type { SgBrandLogoProps, SgBrandLogoVariant, SgBrandLogoSource } from './SgBrandLogo';
// アイコン型ロゴ（正方形512×512・3モード分／v0.16.0 追加・社長採用 2026-08-09）。
//   favicon・アプリアイコン・幅104px 未満の場面は横長ロゴを縮めずこちらを使う。
//   useBrandFavicon() を1行呼ぶと <link rel="icon"> が色モードへ自動追従する。
export { SG_BRAND_ICON_SOURCES, useBrandFavicon } from './brandIcon';
export type { SgBrandIconVariant, SgBrandIconSource, UseBrandFaviconOptions } from './brandIcon';
export { ColorModeSwitch } from './ColorModeSwitch';
export type { ColorModeSwitchProps } from './ColorModeSwitch';
export { MagiStatusSummary } from './MagiStatusSummary';
export type { MagiStatusSummaryProps } from './MagiStatusSummary';
export { MagiVersionChip } from './MagiVersionChip';
export type { MagiVersionChipProps } from './MagiVersionChip';
export { BusinessNav } from './BusinessNav';
export type { BusinessNavProps, BusinessNavTab, BusinessNavMenuItem } from './BusinessNav';
export { MagiAppShell } from './MagiAppShell';
export type { MagiAppShellProps } from './MagiAppShell';
// 作業面の全画面表示（v0.9）。MagiAppShell の focusMode と対で使う。
export { FocusToggle } from './FocusToggle';
export type { FocusToggleProps } from './FocusToggle';
export {
  detectRuntime,
  validateDeclaredState,
  deriveStatusDisplay,
  isTrustedWriteDetector,
  createEnvWriteDetector,
  createHealthWriteDetector,
  createEndpointWriteDetector,
} from './statusDetection';
export type {
  RuntimeSurface,
  DeclarableState,
  DeclaredStateValidation,
  RuntimeDetectorConfig,
  StatusDisplayItem,
  StatusDisplayResult,
  StatusResolution,
  WriteDetector,
  TrustedWriteDetector,
} from './statusDetection';
export { shortVersion, formatBuildTime, formatReleaseLabel } from './versionFormat';
export { MagiBusinessSummary } from './MagiBusinessSummary';
export type { MagiBusinessSummaryProps, MagiSummaryItem } from './MagiBusinessSummary';

// ─────────────────────────────────────────────────────────────────────
// v0.6 — デジタル庁DS整合レイヤ（2026-07-28 社長裁定）
//   色・ロゴ・ブランドは Standard Lumen を維持し、DADS v2.16.0 からは
//   「作法」だけを採る＝ラベル必須・aria配線・エラーの文字伝達・
//   待ち状態の文言強制・連打耐性・44px・focus 3:1。
// ─────────────────────────────────────────────────────────────────────

// フォームの器（ラベル・必須・補足・エラーの自動配線）
export { FormField, RequirementBadge } from './FormField';
export type { FormFieldProps, FormFieldControlProps } from './FormField';

// 文字入力系フィールド
export { TextField, TextArea, SelectField } from './fields';
export type { TextFieldProps, TextAreaProps, SelectFieldProps, SelectOption } from './fields';

// 選択系フィールド
export { CheckboxField, RadioGroup } from './choice';
export type { CheckboxFieldProps, RadioGroupProps, RadioOption } from './choice';

// ボタン（待ち状態・連打耐性を内蔵）
export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';

// 待ち状態（label必須＝無言のスピナーを型で禁じる）
export { LoadingState } from './LoadingState';
export type { LoadingStateProps, LoadingStateVariant } from './LoadingState';

// 連打・二重送信の物理防止
export { useBusyGuard } from './useBusyGuard';
export type { BusyGuard } from './useBusyGuard';

// 告知・警告・エラー帯
export { NotificationBanner } from './NotificationBanner';
export type { NotificationBannerProps, NotificationTone } from './NotificationBanner';

// 更新履歴モーダル（メニュー最下段から開く・2026-07-28裁定）
export { VersionHistoryModal } from './VersionHistoryModal';
export type { VersionHistoryModalProps, VersionHistoryEntry } from './VersionHistoryModal';

// 0件表示（視覚検収5状態の1つ・2026-07-28 新設）
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

// 氏名＋居室の並び（介護アプリ共通・2026-07-28 新設）
export { NameWithRoom, compactPersonName } from './NameWithRoom';
export type { NameWithRoomProps } from './NameWithRoom';

// 操作者（チップ＋選択モーダル・型v1.6の実体・2026-07-28 core化）
export { OperatorChip, OperatorSelectModal } from './Operator';
export type { OperatorChipProps, OperatorSelectModalProps, OperatorStaff } from './Operator';

// ブラウザの戻る/進む（v0.18.0・2階マニュアルハブ v0.9.0 からの還流）。
//   hash ルーティングの単一ページアプリで、画面遷移が履歴を積み（push）、戻る/進むで
//   1つ前の作業画面に帰れるようにする。ルートの形は採用アプリが parse/format で渡す
//   ＝core はルートの中身を1つも知らない。opt-in（呼ばないアプリは無風）。
export { useHistoryRoute, isPlainLeftClick } from './useHistoryRoute';
export type { UseHistoryRouteOptions, HistoryRouteApi, HistoryRouteState, HistoryRouteCause } from './useHistoryRoute';
