/**
 * 残照（dusk）＝第3の色モードの番人（v0.14.0）。
 *   仕様正本: 開発/標準仕様/2026-08-08_候補_テーマ第3モード残照_仕様_v1.0.md
 *
 * ここで固定する不変条件は4つ:
 *   (1) 時刻帯の自動運転（§4）— 境界を含む/含まないまで数値で縛る
 *   (2) 手動優先と永続化（§4）— 「自動」を選び直すまで時刻で動かない
 *   (3) 切替UIの4択（§1・§2）— アイコン＋漢字2字、既存2引数のアプリは壊れない
 *   (4) 残照のトークン（§2）— 確定値の逐語一致 ＋ **全組み合わせ 4.5:1 以上の機械検証**
 *       （§2 の「未確定の細部は補完し、全組み合わせでコントラスト4.5:1以上を機械検証」）
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { ColorModeSwitch } from '../src/ui/ColorModeSwitch';
import { useThemeState } from '../src/ui/useThemeState';
import {
  AUTO_THEME_REEVALUATE_MS,
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_MODE_SETTING,
  THEME_MODES,
  normalizeThemeMode,
  normalizeThemeModeSetting,
  resolveAutoThemeMode,
  resolveThemeMode,
} from '../src/ui/uiPresets';

const CSS_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'ui', 'design-system.css');
const css = readFileSync(CSS_PATH, 'utf8');

/** セレクタ（複数行のセレクタリスト末尾）に続く宣言ブロックを取り出す。 */
function block(selector: string): string {
  const at = css.indexOf(`${selector} {`);
  if (at === -1) throw new Error(`セレクタが見つからない: ${selector}`);
  const start = css.indexOf('{', at);
  const end = css.indexOf('\n}', start);
  return css.slice(start + 1, end);
}

function token(selector: string, name: string): string {
  const found = new RegExp(`(?:^|\\n)\\s*${name}:\\s*([^;]+);`).exec(block(selector));
  if (!found) throw new Error(`${selector} に ${name} が無い`);
  return found[1].trim();
}

// ── WCAG 2.2 の比（ci/check-contrast.mjs と同じ式）──
function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(fg: string, bg: string): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}
/** グラデーションの p%（0–100）地点の色。 */
function gradientAt(stops: Array<[number, string]>, p: number): string {
  for (let i = 0; i < stops.length - 1; i += 1) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (p >= p0 && p <= p1) {
      const t = (p - p0) / (p1 - p0);
      const a = toRgb(c0);
      const b = toRgb(c1);
      const mixed = a.map((v, k) => Math.round(v + (b[k] - v) * t));
      return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  return stops[stops.length - 1][1];
}

const DUSK = ':root[data-color-mode="dusk"]';
const DUSK_BRIDGE = ':root[data-color-mode="dusk"],\n:root[data-ui-preset="standard-lumen"][data-color-mode="dusk"]';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-color-mode');
  document.documentElement.removeAttribute('data-color-mode-setting');
  document.documentElement.removeAttribute('data-ui-preset');
  document.documentElement.classList.remove('dark');
  localStorage.clear();
  vi.useRealTimers();
});

// ═══════════════════════════════════════════════════════════════════
describe('(1) 自動モードの時刻帯（仕様§4）', () => {
  const at = (h: number, m = 0) => resolveAutoThemeMode(new Date(2026, 7, 8, h, m));

  it('陽光 6:00–16:00 → 残照 16:00–19:00 → 月光 19:00–6:00', () => {
    expect(at(6, 0)).toBe('white');
    expect(at(12, 0)).toBe('white');
    expect(at(15, 59)).toBe('white');
    expect(at(16, 0)).toBe('dusk');
    expect(at(18, 59)).toBe('dusk');
    expect(at(19, 0)).toBe('dark');
    expect(at(23, 59)).toBe('dark');
    expect(at(0, 0)).toBe('dark');
    expect(at(5, 59)).toBe('dark');
  });

  it('時刻帯は設定で調整できる（仕様§4「時刻帯は設定で調整可」）', () => {
    const schedule = { dayStartHour: 7, duskStartHour: 17, nightStartHour: 20 };
    const on = (h: number, m = 0) => resolveAutoThemeMode(new Date(2026, 7, 8, h, m), schedule);
    expect(on(6, 30)).toBe('dark');
    expect(on(7, 0)).toBe('white');
    expect(on(16, 59)).toBe('white');
    expect(on(17, 0)).toBe('dusk');
    expect(on(19, 59)).toBe('dusk');
    expect(on(20, 0)).toBe('dark');
  });

  it('壊れた設定でも画面を壊さない（異常値は既定へ落ちる）', () => {
    const broken = { dayStartHour: Number.NaN, duskStartHour: 99, nightStartHour: -3 };
    const mode = resolveAutoThemeMode(new Date(2026, 7, 8, 17, 0), broken);
    expect(['white', 'dusk', 'dark']).toContain(mode);
    expect(mode).toBe('dusk');
  });

  it('手動選択は時刻に関係なくそのまま通る（手動優先の実体）', () => {
    const night = new Date(2026, 7, 8, 23, 0);
    expect(resolveThemeMode('white', night)).toBe('white');
    expect(resolveThemeMode('dusk', night)).toBe('dusk');
    expect(resolveThemeMode('auto', night)).toBe('dark');
  });

  it('保存値の読み取り: dusk/auto を拾い、読めない値は null（既定へ落ちる）', () => {
    expect(normalizeThemeMode('dusk')).toBe('dusk');
    expect(normalizeThemeMode('sunset')).toBe('dusk');
    expect(normalizeThemeMode('auto')).toBeNull();
    expect(normalizeThemeModeSetting('auto')).toBe('auto');
    expect(normalizeThemeModeSetting('dark')).toBe('dark');
    expect(normalizeThemeModeSetting('nonsense')).toBeNull();
    // 既存値は不変（後方互換）。
    expect(normalizeThemeMode('white')).toBe('white');
    expect(normalizeThemeMode('light')).toBe('white');
    expect(DEFAULT_THEME_MODE).toBe('white');
    expect(DEFAULT_THEME_MODE_SETTING).toBe('white');
  });
});

// ═══════════════════════════════════════════════════════════════════
describe('(2) useThemeState — 手動優先・永続化・15分の再評価（仕様§4）', () => {
  function Probe({ prefix = 'magi-test' }: { prefix?: string }) {
    const theme = useThemeState({ storagePrefix: prefix });
    return (
      <div>
        <span data-testid="mode">{theme.themeMode}</span>
        <span data-testid="setting">{theme.themeModeSetting}</span>
        <button onClick={() => theme.onThemeMode('dusk')} type="button">
          残照へ
        </button>
        <button onClick={() => theme.onThemeModeSetting('auto')} type="button">
          自動へ
        </button>
      </div>
    );
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('残照を選ぶと root 属性・保存値が残照になり、dark クラスは付かない', () => {
    render(<Probe />);
    fireEvent.click(screen.getByText('残照へ'));

    expect(screen.getByTestId('mode').textContent).toBe('dusk');
    expect(document.documentElement.dataset.colorMode).toBe('dusk');
    expect(document.documentElement.dataset.colorModeSetting).toBe('dusk');
    expect(document.documentElement.dataset.uiMode).toBe('standard-lumen-dusk');
    // 残照は明るい地なので dark 扱いにしない（Tailwind の dark: を点けない）。
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
    // 旧キーには実モード、新キーには選択値。
    expect(localStorage.getItem('magi-test.theme-mode.v1')).toBe('dusk');
    expect(localStorage.getItem('magi-test.theme-mode-setting.v1')).toBe('dusk');
  });

  it('v0.13 以前の保存値（旧キーのみ）からも復元できる', () => {
    localStorage.setItem('magi-legacy.theme-mode.v1', 'dark');
    render(<Probe prefix="magi-legacy" />);
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(screen.getByTestId('setting').textContent).toBe('dark');
  });

  it('自動を選ぶと時刻で色が決まり、15分ごとに見直す', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 8, 12, 0, 0)); // 昼＝陽光
    render(<Probe />);
    act(() => {
      fireEvent.click(screen.getByText('自動へ'));
    });
    expect(screen.getByTestId('setting').textContent).toBe('auto');
    expect(screen.getByTestId('mode').textContent).toBe('white');

    // 16:00 を跨いでも、再評価の時刻が来るまでは変わらない。
    act(() => {
      vi.setSystemTime(new Date(2026, 7, 8, 16, 1, 0));
    });
    expect(screen.getByTestId('mode').textContent).toBe('white');

    act(() => {
      vi.advanceTimersByTime(AUTO_THEME_REEVALUATE_MS);
    });
    expect(screen.getByTestId('mode').textContent).toBe('dusk');
    expect(document.documentElement.dataset.colorMode).toBe('dusk');
    // 保存は「自動」のまま＝再起動しても帯運転が続く。
    expect(localStorage.getItem('magi-test.theme-mode-setting.v1')).toBe('auto');

    act(() => {
      vi.setSystemTime(new Date(2026, 7, 8, 19, 30, 0));
      vi.advanceTimersByTime(AUTO_THEME_REEVALUATE_MS);
    });
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('自動運転中に手動で選ぶと、以後は時刻で動かない（手動が常に優先）', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 8, 12, 0, 0));
    render(<Probe />);
    act(() => {
      fireEvent.click(screen.getByText('自動へ'));
    });
    act(() => {
      fireEvent.click(screen.getByText('残照へ'));
    });
    expect(screen.getByTestId('setting').textContent).toBe('dusk');

    act(() => {
      vi.setSystemTime(new Date(2026, 7, 8, 23, 0, 0));
      vi.advanceTimersByTime(AUTO_THEME_REEVALUATE_MS * 4);
    });
    // 夜中になっても月光へ流されない。
    expect(screen.getByTestId('mode').textContent).toBe('dusk');
    expect(document.documentElement.dataset.colorMode).toBe('dusk');
  });
});

// ═══════════════════════════════════════════════════════════════════
describe('(3) ColorModeSwitch — 陽光/残照/月光＋自動（仕様§1・§4）', () => {
  it('自動の受け口を渡すと4択になり、表示は漢字2字＋アイコン', () => {
    const { container } = render(
      <ColorModeSwitch themeMode="white" themeModeSetting="white" onThemeMode={() => {}} onThemeModeSetting={() => {}} />,
    );
    const buttons = [...container.querySelectorAll('button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['陽光', '残照', '月光', '自動']);
    // 文字だけ・アイコンだけにしない（読めない職員はアイコンで、読める職員は文字で分かる）。
    for (const button of buttons) {
      expect(button.querySelector('svg')).toBeTruthy();
      expect(button.querySelector('span')?.textContent?.length).toBe(2);
    }
    expect(container.querySelector('.magi-appshell-colormode')?.getAttribute('data-modes')).toBe('4');
  });

  it('従来どおり2引数だけで使うアプリは3択のまま壊れない（自動は出ない）', () => {
    const { container } = render(<ColorModeSwitch themeMode="dark" onThemeMode={() => {}} />);
    const buttons = [...container.querySelectorAll('button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['陽光', '残照', '月光']);
    expect(container.querySelector('.magi-appshell-colormode')?.getAttribute('data-modes')).toBe('3');
    // 選択中は themeMode から決まる。
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('色を押すと onThemeMode、自動を押すと onThemeModeSetting が呼ばれる', () => {
    const onThemeMode = vi.fn();
    const onThemeModeSetting = vi.fn();
    render(
      <ColorModeSwitch
        themeMode="white"
        themeModeSetting="white"
        onThemeMode={onThemeMode}
        onThemeModeSetting={onThemeModeSetting}
      />,
    );
    fireEvent.click(screen.getByText('残照'));
    expect(onThemeMode).toHaveBeenCalledWith('dusk');
    expect(onThemeModeSetting).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('自動'));
    expect(onThemeModeSetting).toHaveBeenCalledWith('auto');
  });

  it('自動を選んでいる間は「自動」が押下状態＝いまの色ボタンは押下にしない', () => {
    const { container } = render(
      <ColorModeSwitch themeMode="dusk" themeModeSetting="auto" onThemeMode={() => {}} onThemeModeSetting={() => {}} />,
    );
    const buttons = [...container.querySelectorAll('button')];
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'true']);
    // いまどの色で動いているかはツールチップで分かる。
    expect(buttons[3].getAttribute('title')).toContain('残照');
  });

  it('命名は仕様§1の表どおり（陽光/残照/月光・内部値 white/dusk/dark）', () => {
    expect(THEME_MODES.map((m) => [m.value, m.label, m.reading])).toEqual([
      ['white', '陽光', 'ようこう'],
      ['dusk', '残照', 'ざんしょう'],
      ['dark', '月光', 'げっこう'],
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════════
describe('(4) 残照のトークン（仕様§2）', () => {
  it('確定値が逐語で入っている（★印は仕様値からの意図的な逸脱）', () => {
    expect(token(DUSK, '--bg-app')).toBe('#f9f0e4');
    expect(token(DUSK, '--bg-surface')).toBe('#fffaf0');
    expect(token(DUSK, '--bg-surface-alt')).toBe('#f9f2e2');
    expect(token(DUSK, '--text-on-header')).toBe('#fdf0e6');
    expect(token(DUSK, '--text-primary')).toBe('#33241c');
    expect(token(DUSK, '--text-secondary')).toBe('#574434');
    // ★仕様値からの唯一の逸脱（v0.14.0・意図的）。
    //   §2表の --text-muted は #836a57 だが、--bg-app(#f9f0e4) 上で 4.47:1 と 4.5:1 を割る。
    //   同じ§2の「全組み合わせでコントラスト4.5:1以上を機械検証」に従い、色相を保ったまま
    //   #7f6754 まで暗くした（app 4.69 / surface 5.08 / surface-alt 4.74）。
    //   ここを仕様値へ戻すと、下の「全組み合わせ 4.5:1」試験が赤になる（変異試験①で実測済み）。
    expect(token(DUSK, '--text-muted')).toBe('#7f6754');
    expect(token(DUSK, '--text-muted')).not.toBe('#836a57');
    expect(ratio('#836a57', token(DUSK, '--bg-app'))).toBeLessThan(4.5);
    expect(ratio(token(DUSK, '--text-muted'), token(DUSK, '--bg-app'))).toBeGreaterThanOrEqual(4.5);
    expect(token(DUSK, '--border-default')).toBe('#e6d4b8');
    expect(token(DUSK, '--border-strong')).toBe('#d3ba90');
    expect(token(DUSK, '--badge-bg-green')).toBe('#e2eede');
    expect(token(DUSK, '--badge-text-green')).toBe('#1d5844');
    expect(token(DUSK, '--badge-bg-amber')).toBe('#f7e3bb');
    expect(token(DUSK, '--badge-text-amber')).toBe('#7a4d0d');
    // 帯（G3「残照の帯」）は逐語。単色フォールバックも仕様の併記値。
    expect(token(DUSK, '--bg-header-gradient')).toBe(
      'linear-gradient(180deg, #8e3040 0%, #a53a32 55%, #cd6b38 88%, #f0b269 100%)',
    );
    expect(token(DUSK, '--bg-header')).toBe('#a53a32');
  });

  it('「道具は緑」— 主操作・成功系・リンクボタンは湘南グリーン据置', () => {
    expect(token(DUSK, '--color-primary')).toBe('#2f6f5f');
    expect(token(DUSK, '--color-primary-hover')).toBe('#24584b');
    expect(token(DUSK, '--color-primary-light')).toBe('#e2eede');
    expect(token(DUSK, '--color-success')).toBe('#2e7d32');
    expect(token(DUSK, '--link-btn-bg')).toBe('#2f6f5f');
    expect(token(DUSK, '--link-btn-bg-hover')).toBe('#24584b');
    expect(token(DUSK, '--link-btn-text')).toBe('#ffffff');
    // 4プリセット bridge 側も緑（＝どのプリセットでも道具の色は動かない）。
    expect(token(DUSK_BRIDGE, '--primary')).toBe('#2f6f5f');
    expect(token(':root[data-ui-preset="nova-carbon"][data-color-mode="dusk"]', '--primary')).toBe('#2f6f5f');
    expect(token(':root[data-ui-preset="nova-ember"][data-color-mode="dusk"]', '--primary')).toBe('#2f6f5f');
    expect(token(':root[data-ui-preset="standard-aura"][data-color-mode="dusk"]', '--primary')).toBe('#2f6f5f');
  });

  it('4プリセットすべてに残照ブロックがある（bridge 追従）', () => {
    for (const preset of ['standard-lumen', 'standard-aura', 'nova-carbon', 'nova-ember']) {
      expect(css).toContain(`:root[data-ui-preset="${preset}"][data-color-mode="dusk"]`);
    }
  });

  it('既存の陽光・月光は1文字も動いていない（後方互換）', () => {
    expect(token(':root,\n:root[data-color-mode="white"]', '--bg-app')).toBe('#f3faf6');
    expect(token(':root,\n:root[data-color-mode="white"]', '--bg-header')).toBe('#2f6f5f');
    expect(token(':root[data-color-mode="dark"]', '--bg-app')).toBe('#1d2431');
    expect(token(':root[data-color-mode="dark"]', '--bg-header')).toBe('#172033');
    expect(
      token(':root,\n:root[data-color-mode="white"],\n:root[data-ui-preset="standard-lumen"][data-color-mode="white"]', '--primary'),
    ).toBe('#6bbf95');
  });

  it('グラデーションはヘッダー専用（紙面・カードには出さない）', () => {
    const users = [...css.matchAll(/([^\n{]*)\{[^}]*var\(--bg-header-(?:gradient|sky|glow)\)/g)].map((m) => m[1].trim());
    expect(users.length).toBeGreaterThan(0);
    for (const selector of users) {
      expect(selector).toMatch(/magi-appshell-header|topbar/);
    }
  });

  it('全組み合わせでコントラスト 4.5:1 以上（§2 の機械検証）', () => {
    const app = token(DUSK, '--bg-app');
    const surface = token(DUSK, '--bg-surface');
    const alt = token(DUSK, '--bg-surface-alt');
    const surfaces = [app, surface, alt];
    const inks = [token(DUSK, '--text-primary'), token(DUSK, '--text-secondary'), token(DUSK, '--text-muted')];

    const failures: string[] = [];
    const need = (fg: string, bg: string, label: string) => {
      const value = ratio(fg, bg);
      if (value < 4.5) failures.push(`${label}: ${fg} on ${bg} = ${value.toFixed(2)}:1`);
    };

    for (const ink of inks) for (const bg of surfaces) need(ink, bg, '本文3階調 × 面3種');
    for (const bg of surfaces) {
      need(token(DUSK_BRIDGE, '--brand-ink'), bg, 'ブランド文字インク');
      need(token(DUSK_BRIDGE, '--status-warn-ink'), bg, '警告の文字インク');
      need(token(DUSK, '--color-danger'), bg, '危険');
      need(token(DUSK, '--color-success'), bg, '成功');
      need(token(DUSK, '--color-primary'), bg, '主色（文字として置いた場合）');
    }
    need(token(DUSK, '--primary-button-text'), token(DUSK, '--color-primary'), '主操作ボタン');
    need(token(DUSK, '--link-btn-text'), token(DUSK, '--link-btn-bg'), 'リンクボタン');
    need(token(DUSK, '--badge-text-green'), token(DUSK, '--badge-bg-green'), '完了バッジ');
    need(token(DUSK, '--badge-text-amber'), token(DUSK, '--badge-bg-amber'), '重要バッジ');
    need(token(DUSK, '--badge-text-red'), token(DUSK, '--badge-bg-red'), '危険バッジ');
    need(token(DUSK, '--badge-text-blue'), token(DUSK, '--badge-bg-blue'), '情報バッジ');
    need(token(DUSK, '--badge-text-gray'), token(DUSK, '--badge-bg-gray'), '汎用バッジ');
    need(token(DUSK_BRIDGE, '--color-primary-light-foreground'), token(DUSK, '--color-primary-light'), '薄緑面の文字');
    // 帯の単色フォールバック（機械検査が読む地）の上でヘッダー文字が読めること。
    need(token(DUSK, '--text-on-header'), token(DUSK, '--bg-header'), 'ヘッダー文字 × 単色フォールバック');

    expect(failures).toEqual([]);
  });

  /**
   * ヘッダーの塗りは「高さに依らない」こと。
   * 仕様§2 の帯を比率のまま全面に敷くと、ヘッダーが伸びたときに明るい下端が文字の高さまで
   * 上がってくる（Chrome 実測: 88px ヘッダーで 3.96:1／狭幅 320px ヘッダーで 2.21:1）。
   * いまの塗りは「空＝下半分ずっと #a53a32」＋「滲み＝下端14px固定」なので、
   * 文字がどこに来ても地は #a53a32 より暗い＝5.78:1 が床になる。ここではその床を数値で縛る。
   */
  it('帯はヘッダーの高さに依らない（文字の地の最悪値 = #a53a32 の 5.78:1）', () => {
    const sky = token(DUSK, '--bg-header-sky');
    const glow = token(DUSK, '--bg-header-glow');
    const ink = token(DUSK, '--text-on-header');

    // 空は「55% 以降ずっと #a53a32」＝伸びても明るくならない。
    expect(sky).toBe('linear-gradient(180deg, #8e3040 0%, #a53a32 55%, #a53a32 100%)');
    // 空のどの位置でも 4.5:1 以上（上端 #8e3040・下端 #a53a32 の2点で足りる＝間は単調）。
    expect(ratio(ink, '#8e3040')).toBeGreaterThanOrEqual(4.5);
    expect(ratio(ink, '#a53a32')).toBeGreaterThanOrEqual(4.5);
    expect(Number(ratio(ink, '#a53a32').toFixed(2))).toBe(5.78);

    // 滲みは下端の固定高（既定14px＝ヘッダーの下 padding と同値）＝字面に触れない。
    expect(glow).toContain('to top');
    expect(css).toContain('background-size: 100% var(--magi-header-glow-height, 14px), 100% 100%;');
    expect(css).toContain('background-position: bottom, top;');
    const headerPadding = /--magi-header-padding:\s*([^;]+);/.exec(css)?.[1]?.trim();
    expect(headerPadding).toBe('14px 18px');

    // 参考: 仕様§2 の帯を全面に敷いた場合に 4.5:1 を割り始める位置（69.4%）。
    //   この数字が「高さの偶然に頼らせない」判断の出どころ。
    const stops: Array<[number, string]> = [
      [0, '#8e3040'],
      [55, '#a53a32'],
      [88, '#cd6b38'],
      [100, '#f0b269'],
    ];
    let lo = 0;
    let hi = 100;
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2;
      if (ratio(ink, gradientAt(stops, mid)) >= 4.5) lo = mid;
      else hi = mid;
    }
    expect(Number(lo.toFixed(1))).toBe(69.4);
  });
});
