/**
 * BusinessNav の opt-in 還流（2026-08-02・UI標準コア還流パッケージ v0.2）。
 *   3-B: 全画面ボタン（FocusToggle）の自動配置 `navFocusToggle`
 *   3-E: メニュー標準スロットの明文化（pilot・強制ガードなし）
 *
 * 最重要は「**opt-in を渡さないアプリの DOM が 1px も変わらない**」こと。
 * それを inline snapshot（既定の DOM を本文に固定）と、
 * 新propを渡した/渡さないの HTML 完全一致で二重に縛る。
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { BusinessNav, MENU_STANDARD_KEYS } from '../src/ui/BusinessNav';

const NAV_SRC = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'ui', 'BusinessNav.tsx'),
  'utf8',
);

afterEach(() => {
  cleanup();
});

/** 現場の標準構成に近い形（タブ・操作者・ロール・メニュー）で組む。 */
function baseProps() {
  return {
    activeTab: 'home',
    onNavigate: () => {},
    tabs: [
      { value: 'home', label: 'ホーム' },
      { value: 'list', label: '一覧' },
    ],
    role: '職員',
    navActions: (
      <button type="button">操作者: 未選択</button>
    ),
    menuItems: [{ key: 'refresh', label: '今すぐ更新' }],
  };
}

const navHtml = (container: HTMLElement) => (container.querySelector('nav') as HTMLElement).innerHTML;

describe('3-B: navFocusToggle（opt-in）', () => {
  it('渡さなければ従来どおりの DOM（既定動作不変・スナップショット固定）', () => {
    const { container } = render(<BusinessNav {...baseProps()} />);
    expect(container.querySelector('.magi-focus-toggle')).toBeNull();
    expect(navHtml(container)).toMatchInlineSnapshot(`"<div class="magi-appshell-nav-tabs" role="tablist" aria-label="表示内容"><button aria-label="ホーム" aria-pressed="true" class="magi-appshell-nav-tab active" type="button"><span>ホーム</span></button><button aria-label="一覧" aria-pressed="false" class="magi-appshell-nav-tab" type="button"><span>一覧</span></button></div><div class="magi-appshell-nav-right"><button type="button">操作者: 未選択</button><span class="magi-appshell-role-chip" title="権限: 職員"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg><span>職員</span></span><div class="magi-appshell-menu"><button aria-expanded="false" aria-haspopup="true" class="magi-appshell-nav-tab magi-appshell-menu-toggle" title="表示テーマ・メニューを開きます" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings2 lucide-settings-2" aria-hidden="true"><path d="M14 17H5"></path><path d="M19 7h-9"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg><span>メニュー</span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down magi-appshell-menu-caret" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button></div></div>"`);
  });

  it('新propを一切渡さない場合と navFocusToggle={false} の場合で HTML が完全一致', () => {
    const withoutProps = render(<BusinessNav {...baseProps()} />);
    const htmlA = navHtml(withoutProps.container);
    cleanup();

    const withFalse = render(
      <BusinessNav {...baseProps()} focusMode={false} navFocusToggle={false} onFocusModeChange={() => {}} />,
    );
    expect(navHtml(withFalse.container)).toBe(htmlA);
  });

  it('focusMode / onFocusModeChange だけ渡してもボタンは出ない（opt-in は navFocusToggle）', () => {
    const { container } = render(
      <BusinessNav {...baseProps()} focusMode={false} onFocusModeChange={() => {}} />,
    );
    expect(container.querySelector('.magi-focus-toggle')).toBeNull();
  });

  it('navFocusToggle だけ真でも、状態・通知が欠けていれば出さない（飾りボタンを作らない）', () => {
    const noHandler = render(<BusinessNav {...baseProps()} focusMode={false} navFocusToggle />);
    expect(noHandler.container.querySelector('.magi-focus-toggle')).toBeNull();
    cleanup();

    const noState = render(<BusinessNav {...baseProps()} navFocusToggle onFocusModeChange={() => {}} />);
    expect(noState.container.querySelector('.magi-focus-toggle')).toBeNull();
  });

  it('opt-in すると nav 右群の先頭（navActions より前）に出る', () => {
    const { container } = render(
      <BusinessNav {...baseProps()} focusMode={false} navFocusToggle onFocusModeChange={() => {}} />,
    );
    const right = container.querySelector('.magi-appshell-nav-right') as HTMLElement;
    const toggle = right.querySelector('.magi-focus-toggle') as HTMLElement;
    expect(toggle).toBeTruthy();
    expect(right.firstElementChild).toBe(toggle);
    expect(toggle.textContent).toContain('全画面');
  });

  it('並び順は 全画面 → 操作者 → 職員（ロールチップ） → メニュー（右端）', () => {
    const { container } = render(
      <BusinessNav {...baseProps()} focusMode={false} navFocusToggle onFocusModeChange={() => {}} />,
    );
    const right = container.querySelector('.magi-appshell-nav-right') as HTMLElement;
    const kinds = Array.from(right.children).map((el) => {
      if (el.classList.contains('magi-focus-toggle')) return '全画面';
      if (el.classList.contains('magi-appshell-role-chip')) return '職員';
      if (el.classList.contains('magi-appshell-menu')) return 'メニュー';
      return '操作者';
    });
    expect(kinds).toEqual(['全画面', '操作者', '職員', 'メニュー']);
  });

  it('押すと次の状態が通知される／focus 中は「戻る」を出す', () => {
    const onFocusModeChange = vi.fn();
    const { container } = render(
      <BusinessNav {...baseProps()} focusMode={false} navFocusToggle onFocusModeChange={onFocusModeChange} />,
    );
    fireEvent.click(container.querySelector('.magi-focus-toggle') as Element);
    expect(onFocusModeChange).toHaveBeenCalledWith(true);
    cleanup();

    const inFocus = render(
      <BusinessNav {...baseProps()} focusMode navFocusToggle onFocusModeChange={onFocusModeChange} />,
    );
    expect((inFocus.container.querySelector('.magi-focus-toggle') as HTMLElement).textContent).toContain('戻る');
  });

  it('opt-in してもメニュー・タブの挙動は従来どおり', () => {
    render(<BusinessNav {...baseProps()} focusMode={false} navFocusToggle onFocusModeChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /メニュー/ }));
    expect(document.querySelector('.magi-appshell-menu-panel')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('.magi-appshell-menu-panel')).toBeNull();
  });
});

describe('3-E: メニュー標準スロット（pilot・型宣言のみ）', () => {
  it('標準キーは refresh / manual', () => {
    expect(MENU_STANDARD_KEYS).toEqual(['refresh', 'manual']);
  });

  it('3スロットの使い分けが JSDoc に明文化されている（消したら落ちる）', () => {
    // 型宣言だけの pilot なので、実体は「読める説明」。消えたことに気づけるよう縛る。
    const propsBlock = NAV_SRC.slice(
      NAV_SRC.indexOf('export interface BusinessNavProps'),
      NAV_SRC.indexOf('export function BusinessNav'),
    );
    // 正本参照（フロントページ5層標準 §2-A ／ 01_UI標準 §3-3）
    expect(propsBlock).toContain('§2-A');
    expect(propsBlock).toContain('§3-3');
    // menuItems=操作項目（今すぐ更新・マニュアル）／menuChildren=テーマ切替／menuFooter=更新履歴
    expect(propsBlock).toMatch(/menuItems\?:/);
    expect(propsBlock).toContain('今すぐ更新');
    expect(propsBlock).toContain('マニュアル');
    expect(propsBlock).toContain('テーマ切替');
    expect(propsBlock).toContain('更新履歴');
    // 設定・全画面はメニューに畳まずナビ直置き
    expect(propsBlock).toContain('メニューに畳まずナビへ直置き');
  });

  it('標準キーを使わなくても描画は通る（強制ガードは作らない）', () => {
    const { container } = render(
      <BusinessNav
        activeTab="home"
        menuItems={[{ key: 'anything', label: '独自項目' }]}
        onNavigate={() => {}}
        tabs={[{ value: 'home', label: 'ホーム' }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /メニュー/ }));
    expect(container.textContent).toContain('独自項目');
  });
});
