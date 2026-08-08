/**
 * @magi/core/ui — テーマ状態フック（v0.2 / v0.14.0 で残照＋自動）
 *
 * 「4プリセット × 陽光(white)/残照(dusk)/月光(dark) = 12テーマ」の状態を1か所に集約する。
 *   - uiPreset / themeModeSetting の useState（初期値は localStorage から復元）
 *   - localStorage への永続化
 *   - document.documentElement への data 属性付与
 *       data-ui-preset / data-color-mode / data-ui-mode（= `${uiPreset}-${themeMode}`）
 *       ＋ class 'dark' トグル ＋ style.colorScheme
 *   これらは design-system.css の :root[data-ui-preset][data-color-mode] が拾う。
 *
 * 原本: magi-resident-spine/src/App.tsx のテーマ状態ロジック（loadUiPreset /
 *       loadThemeMode / 永続化 useEffect）を集約・踏襲したもの。
 *
 * 返り値は DisplaySwitch / ColorModeSwitch にそのまま渡せる形:
 *   const theme = useThemeState();
 *   <DisplaySwitch {...theme} />        // 8テーマの検証用UI（White/Dark の2値・従来のまま）
 *   <ColorModeSwitch {...theme} />      // 職員向け 陽光/残照/月光/自動 の4択
 *
 * uiMode は uiPreset から導出（standard-lumen/aura → 'standard'、nova-* → 'nova'）。
 *
 * ── 自動モード（v0.14.0・仕様 v1.0 §4） ──
 *   themeModeSetting === 'auto' のときだけ端末時計で帯を決め、15分ごとに再評価する。
 *   手動で色を選ぶと setting がその色になり、以後は時刻で動かない（**手動が常に優先**）。
 *   「自動」を選び直すと帯運転へ復帰する。第1段は固定時刻帯（オフラインでも狂わない）。
 *
 * ── 後方互換（v0.13 以前からの持ち上がり） ──
 *   themeMode / onThemeMode の意味と型は**変えていない**（themeMode は適用中の実モード、
 *   onThemeMode は手動で色を選ぶ関数）。増えたのは themeModeSetting / onThemeModeSetting の2つだけ。
 *   保存キーも `${prefix}.theme-mode.v1` には従来どおり**実モード**を書き続け、
 *   'auto' は新キー `${prefix}.theme-mode-setting.v1` に分けて置く（旧版の core で読んでも壊れない）。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AUTO_THEME_REEVALUATE_MS,
  DEFAULT_AUTO_THEME_SCHEDULE,
  DEFAULT_THEME_MODE_SETTING,
  DEFAULT_UI_PRESET,
  getUiPreset,
  normalizeThemeModeSetting,
  normalizeUiPreset,
  resolveAutoThemeMode,
  type AutoThemeSchedule,
  type ThemeMode,
  type ThemeModeSetting,
  type UiMode,
  type UiPreset,
} from './uiPresets';

export interface ThemeState {
  uiPreset: UiPreset;
  /** 適用中の実モード（'auto' は入らない。自動運転中は時刻で解決した結果が入る）。 */
  themeMode: ThemeMode;
  /** 職員が選んでいる値（'auto' を含む）。v0.14.0 追加。 */
  themeModeSetting: ThemeModeSetting;
  /** uiPreset から導出した大分類（standard / nova）。DisplaySwitch の mode タブ用。 */
  uiMode: UiMode;
  onUiPreset: (value: UiPreset) => void;
  /** 色を手動で選ぶ（従来どおり）。自動運転中に呼ぶと手動へ切り替わる。 */
  onThemeMode: (value: ThemeMode) => void;
  /** 'auto' を含む選択（v0.14.0 追加）。ColorModeSwitch の「自動」が使う。 */
  onThemeModeSetting: (value: ThemeModeSetting) => void;
}

export interface UseThemeStateOptions {
  /**
   * localStorage キーのプレフィックス。アプリごとに分けたい場合に指定する。
   * 既定は 'magi'。例: 'magi-omutsu' → 'magi-omutsu.ui-preset.v1' 等。
   */
  storagePrefix?: string;
  /** 初期 uiPreset（localStorage に保存値が無いときの既定）。 */
  defaultUiPreset?: UiPreset;
  /** 初期 themeMode（localStorage に保存値が無いときの既定）。'auto' も渡せる。 */
  defaultThemeMode?: ThemeModeSetting;
  /** 自動モードの時刻帯（既定＝陽光 6:00 / 残照 16:00 / 月光 19:00）。 */
  autoSchedule?: AutoThemeSchedule;
  /** 自動モードの再評価間隔（既定 15分）。試験で短くできる。 */
  autoIntervalMs?: number;
}

function uiPresetKey(prefix: string): string {
  return `${prefix}.ui-preset.v1`;
}

function themeModeKey(prefix: string): string {
  return `${prefix}.theme-mode.v1`;
}

function themeModeSettingKey(prefix: string): string {
  return `${prefix}.theme-mode-setting.v1`;
}

function loadUiPreset(prefix: string, fallback: UiPreset): UiPreset {
  try {
    const stored = normalizeUiPreset(localStorage.getItem(uiPresetKey(prefix)));
    if (stored) return stored;
  } catch {
    // UI設定の読取失敗（プライベートモード等）は操作を止めない。
  }
  return fallback;
}

function loadThemeModeSetting(prefix: string, fallback: ThemeModeSetting): ThemeModeSetting {
  try {
    // 新キー（'auto' を含む）→ 旧キー（実モード）の順に見る＝v0.13 以前の保存値もそのまま拾える。
    const stored = normalizeThemeModeSetting(localStorage.getItem(themeModeSettingKey(prefix)));
    if (stored) return stored;
    const legacy = normalizeThemeModeSetting(localStorage.getItem(themeModeKey(prefix)));
    if (legacy) return legacy;
  } catch {
    // UI設定の読取失敗は操作を止めない。
  }
  return fallback;
}

export function useThemeState(options: UseThemeStateOptions = {}): ThemeState {
  const {
    storagePrefix = 'magi',
    defaultUiPreset = DEFAULT_UI_PRESET,
    defaultThemeMode = DEFAULT_THEME_MODE_SETTING,
    autoSchedule = DEFAULT_AUTO_THEME_SCHEDULE,
    autoIntervalMs = AUTO_THEME_REEVALUATE_MS,
  } = options;

  const [uiPreset, setUiPreset] = useState<UiPreset>(() => loadUiPreset(storagePrefix, defaultUiPreset));
  const [themeModeSetting, setThemeModeSetting] = useState<ThemeModeSetting>(() =>
    loadThemeModeSetting(storagePrefix, defaultThemeMode),
  );
  // 自動運転中の「今の帯」。初期値も時計から取る（初回描画から正しい色で出す）。
  const [autoMode, setAutoMode] = useState<ThemeMode>(() => resolveAutoThemeMode(new Date(), autoSchedule));

  // オブジェクトリテラルで渡されると毎描画で参照が変わるので、値で固定して effect の再実行を防ぐ。
  const { dayStartHour, duskStartHour, nightStartHour } = autoSchedule;
  const schedule = useMemo<AutoThemeSchedule>(
    () => ({ dayStartHour, duskStartHour, nightStartHour }),
    [dayStartHour, duskStartHour, nightStartHour],
  );

  const themeMode: ThemeMode = themeModeSetting === 'auto' ? autoMode : themeModeSetting;

  // uiPreset から大分類を導出（standard-lumen/aura → standard、nova-* → nova）。
  const uiMode = getUiPreset(uiPreset).mode;

  // 自動運転の時計（15分ごとに帯を見直す）。手動選択中はタイマーを持たない。
  useEffect(() => {
    if (themeModeSetting !== 'auto') return;
    setAutoMode(resolveAutoThemeMode(new Date(), schedule));
    const timer = setInterval(() => {
      setAutoMode(resolveAutoThemeMode(new Date(), schedule));
    }, autoIntervalMs);
    return () => clearInterval(timer);
  }, [themeModeSetting, schedule, autoIntervalMs]);

  // 永続化 ＋ document root への反映（原本 App.tsx の useEffect 踏襲）。
  useEffect(() => {
    try {
      localStorage.setItem(uiPresetKey(storagePrefix), uiPreset);
      // 旧キーには**適用中の実モード**を書く（v0.13 以前の core / 他の読み手が壊れないように）。
      localStorage.setItem(themeModeKey(storagePrefix), themeMode);
      localStorage.setItem(themeModeSettingKey(storagePrefix), themeModeSetting);
    } catch {
      // 書込失敗（容量超過・プライベートモード等）でも UI 反映は続ける。
    }
    const root = document.documentElement;
    root.dataset.uiPreset = uiPreset;
    root.dataset.colorMode = themeMode;
    // 「自動で今この色」なのか「職員が選んだ色」なのかを画面側からも見えるようにする。
    root.dataset.colorModeSetting = themeModeSetting;
    root.dataset.uiMode = `${uiPreset}-${themeMode}`;
    // 残照は明るい地（暖クリーム）なので dark 扱いにしない＝Tailwind の dark: も点かない。
    root.classList.toggle('dark', themeMode === 'dark');
    root.style.colorScheme = themeMode === 'dark' ? 'dark' : 'light';
  }, [storagePrefix, themeMode, themeModeSetting, uiPreset]);

  const onThemeMode = useCallback((value: ThemeMode) => {
    setThemeModeSetting(value);
  }, []);

  const onThemeModeSetting = useCallback((value: ThemeModeSetting) => {
    setThemeModeSetting(value);
  }, []);

  return {
    uiPreset,
    themeMode,
    themeModeSetting,
    uiMode,
    onUiPreset: setUiPreset,
    onThemeMode,
    onThemeModeSetting,
  };
}
