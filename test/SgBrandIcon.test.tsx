/**
 * アイコン型ロゴ（正方形512×512）と useBrandFavicon の試験。v0.16.0
 *
 * 見ているもの:
 *   - 同梱アセットの形（512×512・3枚・1024原本を掴んでいない）と manifest との整合
 *   - favicon が色モードに追従すること（＝「1行で favicon」の実体）
 *   - 多重呼び出し・借り物 link の後始末（アプリの index.html を壊さない）
 * 試験の流儀は SgBrandLogo.test.tsx に合わせた（data-color-mode を書き換えて waitFor で見る）。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SG_BRAND_ICON_SOURCES, useBrandFavicon, type SgBrandIconVariant } from '../src/ui/brandIcon';
import manifest from '../src/ui/brand/logo-manifest.json';

function setColorMode(mode: string | null) {
  if (mode === null) document.documentElement.removeAttribute('data-color-mode');
  else document.documentElement.setAttribute('data-color-mode', mode);
}

function iconLinks(): HTMLLinkElement[] {
  return Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
}

function faviconHref(): string | null {
  return iconLinks()[0]?.getAttribute('href') ?? null;
}

/** フックだけを動かす器（部品は用意していない＝favicon は画面に何も描かない）。 */
function Favicon({ themeMode, variant }: { themeMode?: 'white' | 'dusk' | 'dark'; variant?: SgBrandIconVariant }) {
  useBrandFavicon({ ...(themeMode ? { themeMode } : {}), ...(variant ? { variant } : {}) });
  return null;
}

afterEach(() => {
  cleanup();
  setColorMode(null);
  for (const link of iconLinks()) link.remove();
});

describe('SG_BRAND_ICON_SOURCES', () => {
  it('同梱は day/night/sunset の512×512だけ（1024原本は掴まない）', () => {
    expect(Object.keys(SG_BRAND_ICON_SOURCES).sort()).toEqual(['day', 'night', 'sunset']);
    for (const variant of ['day', 'night', 'sunset'] as const) {
      const source = SG_BRAND_ICON_SOURCES[variant];
      expect(source.width).toBe(512);
      expect(source.height).toBe(512);
      expect(source.src).toContain(`sg-icon-${variant}`);
      // 1024原本（Drive 正本・日本語名）を同梱物として掴んでいないこと。
      expect(source.src).not.toContain('master');
      expect(source.src).not.toContain('アイコン型');
    }
  });

  it('横長ロゴのファイルを掴んでいない（横長とアイコンの取り違え防止）', () => {
    for (const source of Object.values(SG_BRAND_ICON_SOURCES)) {
      expect(source.src).not.toContain('sg-logo-');
    }
  });

  it('manifest の icons 節と食い違わない（寸法・ファイル名・非同梱の別）', () => {
    const icons = manifest.icons.variants;
    for (const variant of ['day', 'night', 'sunset'] as const) {
      const std = icons[variant].standard;
      expect(std.width).toBe(SG_BRAND_ICON_SOURCES[variant].width);
      expect(std.height).toBe(SG_BRAND_ICON_SOURCES[variant].height);
      expect(SG_BRAND_ICON_SOURCES[variant].src).toContain(std.file.replace('.png', ''));
      // master は 1024 のまま manifest に載っている＝同梱しない（出所の追跡だけ残す）。
      expect(icons[variant].master.width).toBe(1024);
      expect(icons[variant].master.height).toBe(1024);
      expect(manifest.icons.bundled.files).not.toContain(icons[variant].master.file);
    }
    expect(manifest.icons.bundled.files.length).toBe(3);
  });
});

describe('useBrandFavicon', () => {
  it('呼ぶだけで <link rel="icon"> が生え、既定は day を指す', () => {
    expect(iconLinks()).toHaveLength(0);
    render(<Favicon />);
    const link = iconLinks()[0];
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('sg-icon-day');
    expect(link.getAttribute('type')).toBe('image/png');
    expect(link.getAttribute('sizes')).toBe('512x512');
    // core が面倒を見ている link だと分かる目印（アプリ側の link と取り違えないため）。
    expect(link.getAttribute('data-magi-brand-favicon')).toBe('on');
  });

  it('陽光→残照→月光と切り替えるとタブのアイコンが3枚とも入れ替わる', async () => {
    render(<Favicon />);
    expect(faviconHref()).toContain('sg-icon-day');

    setColorMode('dusk');
    await waitFor(() => expect(faviconHref()).toContain('sg-icon-sunset'));

    setColorMode('dark');
    await waitFor(() => expect(faviconHref()).toContain('sg-icon-night'));

    setColorMode('white');
    await waitFor(() => expect(faviconHref()).toContain('sg-icon-day'));
  });

  it('モードが変わっても link は作り直さない（同じ要素の href だけ差し替わる）', async () => {
    render(<Favicon />);
    const first = iconLinks()[0];
    setColorMode('dark');
    await waitFor(() => expect(faviconHref()).toContain('sg-icon-night'));
    expect(iconLinks()).toHaveLength(1);
    expect(iconLinks()[0]).toBe(first);
  });

  it('themeMode を渡すとテーマ属性が変わっても追従しない', async () => {
    render(<Favicon themeMode="white" />);
    setColorMode('dark');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(faviconHref()).toContain('sg-icon-day');
  });

  it('variant を渡すと明示指定が最優先（テーマ連動より強い）', () => {
    setColorMode('dark');
    render(<Favicon variant="sunset" />);
    expect(faviconHref()).toContain('sg-icon-sunset');
  });

  it('多重に呼んでも link は1枚。先に消えた側が favicon を消さない', () => {
    const a = render(<Favicon />);
    const b = render(<Favicon />);
    expect(iconLinks()).toHaveLength(1);

    a.unmount();
    // まだ b が使っている＝消してはいけない。
    expect(iconLinks()).toHaveLength(1);
    expect(faviconHref()).toContain('sg-icon-day');

    b.unmount();
    // 最後の1人が離れたら、自前で作った link は片付ける。
    expect(iconLinks()).toHaveLength(0);
  });

  it('アプリが置いた既存 link は借りるだけ（2枚出さない・離れる時に元へ戻す）', () => {
    const own = document.createElement('link');
    own.setAttribute('rel', 'icon');
    own.setAttribute('href', '/app-favicon.ico');
    document.head.appendChild(own);

    const view = render(<Favicon />);
    expect(iconLinks()).toHaveLength(1);
    expect(iconLinks()[0]).toBe(own);
    expect(own.getAttribute('href')).toContain('sg-icon-day');

    view.unmount();
    // 借り物は借りた時の姿へ返す（href も type/sizes も目印も）。
    expect(own.getAttribute('href')).toBe('/app-favicon.ico');
    expect(own.getAttribute('type')).toBeNull();
    expect(own.getAttribute('sizes')).toBeNull();
    expect(own.getAttribute('data-magi-brand-favicon')).toBeNull();
    expect(iconLinks()).toHaveLength(1);
  });

  it('サーバ描画では document を触らない（SSR 安全）', () => {
    const markup = renderToStaticMarkup(<Favicon />);
    // 描くものは無い＝空。effect が走らないので link も生えない。
    expect(markup).toBe('');
    expect(iconLinks()).toHaveLength(0);
  });
});
