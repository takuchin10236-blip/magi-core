/**
 * ①カラートークン見本 — 3モード（陽光/残照/月光）× プリセット切替つき。
 *
 * 値は1つも手で持たない。CSSOM から名前を集め、getComputedStyle で「今の実値」を読む。
 * 切替UIは core の実物（ColorModeSwitch / DisplaySwitch）を上部の帯で使っている。
 */
import { useMemo } from 'react';
import { THEME_MODES, getThemeMode, getUiPreset, type ThemeMode, type UiPreset } from '@magi/core/ui';
import { Section } from '../lib/Section';
import { readAllTokens } from '../lib/tokens';

/** 状態色は世界共通解＝人格・モードで動かさない枠（07 §2-3）。先頭で名指しして見せる。 */
const STATE_TOKENS = ['--color-primary', '--color-success', '--color-warning', '--color-danger', '--color-info'];

interface Props {
  themeMode: ThemeMode;
  uiPreset: UiPreset;
  /** テーマ適用後に採番される版。値の再読取りのトリガ。 */
  revision: number;
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="ds-swatch">
      <span className="ds-swatch-chip">
        <span className="ds-swatch-chip-fill" style={{ background: value }} />
      </span>
      <span className="ds-swatch-text">
        <span className="ds-swatch-name">{name}</span>
        <span className="ds-swatch-value">{value || '(空)'}</span>
      </span>
    </div>
  );
}

export function ColorTokensSection({ themeMode, uiPreset, revision }: Props) {
  const tokens = useMemo(() => readAllTokens(), [revision]);
  const colors = tokens.filter((t) => t.group === 'color');
  const stateColors = STATE_TOKENS.map((name) => colors.find((t) => t.name === name)).filter(
    (t): t is (typeof colors)[number] => Boolean(t),
  );
  const mode = getThemeMode(themeMode);
  const preset = getUiPreset(uiPreset);

  return (
    <Section
      id="color"
      index="①"
      title="カラートークン"
      note={
        <>
          いま <code>&lt;html&gt;</code> に効いているモードは <strong>{mode.label}（{mode.reading}）</strong>・プリセットは{' '}
          <strong>{preset.label}</strong>（<code className="ds-mono">data-ui-mode=&quot;{uiPreset}-{themeMode}&quot;</code>）。
          下の見本は手で書いた表ではなく、<code>design-system.css</code> を読み込んだ後の CSSOM から名前を集め、
          <code>getComputedStyle(:root)</code> で解決値を読んだ実測。上の帯でモードを切り替えると、この表の値ごと入れ替わる。
        </>
      }
    >
      <p className="ds-note">
        3モードの定義（core の <code className="ds-mono">THEME_MODES</code> の現物）:{' '}
        {THEME_MODES.map((m) => `${m.label}（${m.value}）=${m.description}`).join(' / ')}
      </p>

      <h3 className="ds-subhead">状態色（人格・モードで動かさない枠）</h3>
      <div className="ds-grid">
        {stateColors.map((t) => (
          <Swatch key={t.name} name={t.name} value={t.value} />
        ))}
      </div>

      <h3 className="ds-subhead">色トークン全数（{colors.length}件・適用中テーマの解決値）</h3>
      <div className="ds-grid">
        {colors.map((t) => (
          <Swatch key={t.name} name={t.name} value={t.value} />
        ))}
      </div>
    </Section>
  );
}
