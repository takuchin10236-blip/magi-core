import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { SgBrandLogo, SG_BRAND_LOGO_SOURCES } from '../src/ui/SgBrandLogo';
import { MagiAppShell } from '../src/ui/MagiAppShell';

function setColorMode(mode: string | null) {
  if (mode === null) document.documentElement.removeAttribute('data-color-mode');
  else document.documentElement.setAttribute('data-color-mode', mode);
}

afterEach(() => {
  cleanup();
  setColorMode(null);
  vi.restoreAllMocks();
});

describe('SgBrandLogo', () => {
  it('既定は day（ライト）で、代替テキストは施設名', () => {
    const { container, getByAltText } = render(<SgBrandLogo />);
    const img = getByAltText('第二湘南グリーン') as HTMLImageElement;
    expect(img.getAttribute('src')).toContain('sg-logo-day');
    expect(container.querySelector('.magi-brand-logo')?.getAttribute('data-variant')).toBe('day');
  });

  it('data-color-mode=dark のとき night になる（useThemeState と同じ属性を見る）', () => {
    setColorMode('dark');
    const { container } = render(<SgBrandLogo />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toContain('sg-logo-night');
    expect(container.querySelector('.magi-brand-logo')?.getAttribute('data-variant')).toBe('night');
  });

  // ここからが購読機構そのものの試験。render 前に属性を置く試験だけだと、
  // 購読（MutationObserver）を空にしても緑のままで気づけない。
  it('render 後にテーマが変わると絵柄が入れ替わる（購読が生きている）', async () => {
    const { container } = render(<SgBrandLogo />);
    expect(container.querySelector('img')?.getAttribute('src')).toContain('sg-logo-day');

    setColorMode('dark');
    await waitFor(() => {
      expect(container.querySelector('img')?.getAttribute('src')).toContain('sg-logo-night');
    });
    expect(container.querySelector('.magi-brand-logo')?.getAttribute('data-variant')).toBe('night');

    setColorMode('white');
    await waitFor(() => {
      expect(container.querySelector('img')?.getAttribute('src')).toContain('sg-logo-day');
    });
  });

  it('unmount で購読が切れる（observe と disconnect が対になる）', () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe');
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect');

    const { unmount } = render(<SgBrandLogo />);
    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(disconnectSpy).not.toHaveBeenCalled();

    unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it('themeMode props を渡したときはテーマ属性が変わっても追従しない', async () => {
    const { container } = render(<SgBrandLogo themeMode="white" />);
    setColorMode('dark');
    // 購読は動くが、props 指定が優先されるので絵柄は変わらない。
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.querySelector('img')?.getAttribute('src')).toContain('sg-logo-day');
  });

  it('同梱は day/night の標準版だけ（@2x・sunset は同梱しない）', () => {
    expect(Object.keys(SG_BRAND_LOGO_SOURCES).sort()).toEqual(['day', 'night']);
    for (const variant of ['day', 'night'] as const) {
      const source = SG_BRAND_LOGO_SOURCES[variant];
      expect(source.width).toBe(480);
      expect(source.height).toBe(240);
      expect(source.src).not.toContain('@2x');
      expect(source.src).not.toContain('sunset');
    }
  });

  it('単一 src で出す（srcSet は使わない）', () => {
    const { container } = render(<SgBrandLogo />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toContain('sg-logo-day');
    expect(img.getAttribute('srcset')).toBeNull();
    // 読み込み中のガタつき防止に実寸を持たせる。
    expect(img.getAttribute('width')).toBe('480');
    expect(img.getAttribute('height')).toBe('240');
  });

  it('alt を props で差し替えられる（シェル内では alt="" 推奨）', () => {
    const { getByAltText } = render(<SgBrandLogo alt="別施設ロゴ" />);
    expect(getByAltText('別施設ロゴ')).toBeTruthy();
    cleanup();
    const { container } = render(<SgBrandLogo alt="" />);
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('白余白の切り抜きは既定で入り、trim={false} で外れる', () => {
    const on = render(<SgBrandLogo />);
    expect(on.container.querySelector('.magi-brand-logo')?.getAttribute('data-trim')).toBe('on');
    cleanup();
    const off = render(<SgBrandLogo trim={false} />);
    expect(off.container.querySelector('.magi-brand-logo')?.getAttribute('data-trim')).toBe('off');
  });
});

describe('MagiAppShell の logo スロット', () => {
  it('未指定なら従来どおり SgLumenLogo（SVG）を出す＝既存アプリ無影響', () => {
    const { container } = render(
      <MagiAppShell appName="テストアプリ" facilityName="第二湘南グリーン">
        <p>本文</p>
      </MagiAppShell>,
    );
    expect(container.querySelector('svg.magi-appshell-logo')).toBeTruthy();
    expect(container.querySelector('.magi-brand-logo')).toBeNull();
  });

  it('logo を渡すとロゴ位置に差し込まれ、施設名・アプリ名の並びは変わらない', () => {
    const { container } = render(
      <MagiAppShell
        appName="テストアプリ"
        facilityName="第二湘南グリーン"
        floorName="2F"
        logo={<SgBrandLogo alt="" />}
      >
        <p>本文</p>
      </MagiAppShell>,
    );
    const brand = container.querySelector('.magi-appshell-brand');
    // ロゴは brand の先頭、その次が施設名/アプリ名の塊（配置の不変条件）。
    expect(brand?.firstElementChild?.classList.contains('magi-brand-logo')).toBe(true);
    expect(brand?.querySelector('.magi-appshell-titles')).toBeTruthy();
    expect(container.querySelector('.magi-appshell-kicker')?.textContent).toBe('第二湘南グリーン 2F');
    expect(container.querySelector('.magi-appshell-title')?.textContent).toBe('テストアプリ');
    // 差し替え時は SVG ロゴを出さない。
    expect(container.querySelector('svg.magi-appshell-logo')).toBeNull();
  });
});
