/**
 * @magi/core デザインシステム ショーケース（開発者検証用・M1）
 *
 * 位置づけ: これは**開発者が core の現物を1枚で点検するための面**であって、業務画面でも配布物でもない。
 * 掟: ここで新しいデザインを作らない。値・部品・動きはすべて core の実装から読む／import する。
 *
 * 便利機能:
 *   URL の ?mode=white|dusk|dark|auto &preset=standard-lumen|standard-aura|nova-carbon|nova-ember
 *   で初期テーマを固定できる（スクショ取得を機械化するため）。
 */
import { useEffect, useRef, useState } from 'react';
import {
  ColorModeSwitch,
  DisplaySwitch,
  ToastProvider,
  getThemeMode,
  getUiPreset,
  normalizeThemeModeSetting,
  normalizeUiPreset,
  useThemeState,
} from '@magi/core/ui';
import { AuditListSection } from './sections/AuditList';
import { BrandLogoSection } from './sections/BrandLogo';
import { ColorTokensSection } from './sections/ColorTokens';
import { ComponentsSection } from './sections/Components';
import { IconsSection } from './sections/Icons';
import { MotionSection } from './sections/Motion';
import { SpacingSection } from './sections/Spacing';
import { SpineSection } from './sections/Spine';
import { TypographySection } from './sections/Typography';

const TOC: Array<[string, string]> = [
  ['color', '① カラートークン'],
  ['typography', '② タイポ階層'],
  ['spacing', '③ スペーシング'],
  ['motion', '④ モーション'],
  ['components', '⑤ 部品の実物'],
  ['icons', '⑥ アイコン'],
  ['brand', '⑦ ブランドロゴ'],
  ['spine', '⑧ 背骨とCIガード'],
  ['audit', '⑨ 監査リスト'],
];

export function Showcase() {
  const params = new URLSearchParams(window.location.search);
  const modeParam = normalizeThemeModeSetting(params.get('mode'));
  const presetParam = normalizeUiPreset(params.get('preset'));

  const theme = useThemeState({
    // 採用アプリの保存値（'magi.*'）を汚さないよう、検証ページ専用の鍵にする。
    storagePrefix: 'magi-core-showcase',
    ...(modeParam ? { defaultThemeMode: modeParam } : {}),
    ...(presetParam ? { defaultUiPreset: presetParam } : {}),
  });

  // URL 指定は保存値より優先する（スクショ用に「必ずこのモードで出す」を成立させるため）。
  const forced = useRef(false);
  useEffect(() => {
    if (forced.current) return;
    forced.current = true;
    if (modeParam) theme.onThemeModeSetting(modeParam);
    if (presetParam) theme.onUiPreset(presetParam);
  }, [modeParam, presetParam, theme]);

  /**
   * テーマ適用（useThemeState の effect が <html> の data 属性を書く）**より後に**
   * トークンを読み直すための版番号。子で読むと属性更新より早く走るため、親でひと呼吸置く。
   */
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    setRevision((r) => r + 1);
  }, [theme.themeMode, theme.uiPreset]);

  const mode = getThemeMode(theme.themeMode);
  const preset = getUiPreset(theme.uiPreset);

  return (
    <ToastProvider>
      <div className="ds-page">
        <div className="ds-topbar">
          <div className="ds-topbar-inner">
            <div>
              <h1 className="ds-topbar-title">@magi/core デザインシステム ショーケース</h1>
              <p className="ds-topbar-sub">
                開発者検証用（配布物ではない）／ いま <strong>{preset.label}</strong> ×{' '}
                <strong>{mode.label}（{mode.reading}）</strong> ／{' '}
                <code className="ds-mono">
                  data-ui-mode=&quot;{theme.uiPreset}-{theme.themeMode}&quot;
                </code>
                {theme.themeModeSetting === 'auto' ? '（自動運転中＝時刻帯で決まっている）' : ''}
              </p>
            </div>
            <div className="ds-topbar-controls">
              <ColorModeSwitch
                onThemeMode={theme.onThemeMode}
                onThemeModeSetting={theme.onThemeModeSetting}
                themeMode={theme.themeMode}
                themeModeSetting={theme.themeModeSetting}
              />
              <DisplaySwitch
                onThemeMode={theme.onThemeMode}
                onUiPreset={theme.onUiPreset}
                themeMode={theme.themeMode}
                uiMode={theme.uiMode}
                uiPreset={theme.uiPreset}
              />
            </div>
          </div>
          <nav aria-label="目次" className="ds-toc">
            {TOC.map(([id, label]) => (
              <a href={`#${id}`} key={id}>
                {label}
              </a>
            ))}
          </nav>
        </div>

        <ColorTokensSection revision={revision} themeMode={theme.themeMode} uiPreset={theme.uiPreset} />
        <TypographySection revision={revision} />
        <SpacingSection revision={revision} />
        <MotionSection revision={revision} />
        <ComponentsSection
          onThemeMode={theme.onThemeMode}
          onThemeModeSetting={theme.onThemeModeSetting}
          onUiPreset={theme.onUiPreset}
          themeMode={theme.themeMode}
          themeModeSetting={theme.themeModeSetting}
          uiMode={theme.uiMode}
          uiPreset={theme.uiPreset}
        />
        <IconsSection />
        <BrandLogoSection revision={revision} themeMode={theme.themeMode} />
        <SpineSection />
        <AuditListSection />
      </div>
    </ToastProvider>
  );
}
