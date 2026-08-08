/**
 * ColorModeSwitch — 職員向けの色切替（v0.5・AppShell / v0.14.0 で4択）。
 *
 * DisplaySwitch（8テーマ・プリセット選択つき＝開発者検証画面専用）は温存する。こちらは
 *   職員が日常で触る最小の切替だけを出す簡素版。useThemeState の返り値をそのまま渡せる
 *   （<ColorModeSwitch {...theme} />）。
 *
 * v0.14.0（仕様「テーマ第3モード残照 v1.0」§1・§4）:
 *   陽光（white）／残照（dusk）／月光（dark）／自動 の4択。表示は**アイコン＋漢字2字**
 *   ——漢字が読めない職員はアイコンで分かる（社長方針 2026-08-08 15:13）。
 *
 * 後方互換:
 *   themeMode / onThemeMode の型は v0.13 以前のまま（ThemeMode を渡す・受け取る）。
 *   「自動」は onThemeModeSetting を渡したときだけ出す＝旧来の2引数だけで使っている
 *   アプリは、ボタンが3つ（陽光・残照・月光）になるだけで型も配線も壊れない。
 */
import { Clock, Moon, Sun, Sunset, type LucideIcon } from 'lucide-react';
import { THEME_MODES, getThemeMode, type ThemeMode, type ThemeModeSetting } from './uiPresets';

const MODE_ICONS: Record<ThemeMode, LucideIcon> = {
  white: Sun,
  dusk: Sunset,
  dark: Moon,
};

export interface ColorModeSwitchProps {
  /** 適用中の実モード。自動運転中は「いま解決されている色」が入る。 */
  themeMode: ThemeMode;
  /** 手動で色を選んだときに呼ぶ（従来どおり）。 */
  onThemeMode: (value: ThemeMode) => void;
  /** 職員が選んでいる値（'auto' を含む）。未指定なら themeMode を選択中とみなす。 */
  themeModeSetting?: ThemeModeSetting;
  /** 'auto' を含む選択の受け口。**渡したときだけ「自動」ボタンが出る**。 */
  onThemeModeSetting?: (value: ThemeModeSetting) => void;
  /** アプリ固有の微調整用（本体クラスの再定義には使わない）。 */
  className?: string;
}

export function ColorModeSwitch({
  themeMode,
  onThemeMode,
  themeModeSetting,
  onThemeModeSetting,
  className,
}: ColorModeSwitchProps) {
  const selected: ThemeModeSetting = themeModeSetting ?? themeMode;
  const canAuto = typeof onThemeModeSetting === 'function';
  const buttonCount = THEME_MODES.length + (canAuto ? 1 : 0);

  // 色の手動選択は常に従来の onThemeMode を呼ぶ（既存配線をそのまま残す）。
  // onThemeModeSetting は「自動」専用の受け口＝2つの契約が競合しない。
  return (
    <div
      className={`magi-appshell-colormode${className ? ` ${className}` : ''}`}
      data-modes={buttonCount}
      role="group"
      aria-label="色テーマ"
    >
      {THEME_MODES.map((item) => {
        const Icon = MODE_ICONS[item.value];
        const active = selected === item.value;
        return (
          <button
            aria-pressed={active}
            className={active ? 'active' : ''}
            key={item.value}
            onClick={() => onThemeMode(item.value)}
            title={`${item.label}（${item.reading}）— ${item.description}`}
            type="button"
          >
            <Icon size={15} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
      {canAuto ? (
        <button
          aria-pressed={selected === 'auto'}
          className={selected === 'auto' ? 'active' : ''}
          key="auto"
          onClick={() => onThemeModeSetting?.('auto')}
          title={`自動（じどう）— 時刻に合わせて切り替えます（いまは${getThemeMode(themeMode).label}）`}
          type="button"
        >
          <Clock size={15} aria-hidden="true" />
          <span>自動</span>
        </button>
      ) : null}
    </div>
  );
}
