/**
 * BusinessNav 右群の並び順の試験（v0.28.0・2026-09-06 社長裁定）。
 *
 * 事故: ケアプロファイル（magi-resident-adl）だけ全画面ボタンが `navLeadingActions`
 *   （＝業務タブの直後・左寄せ側）に置かれ、連絡ノート／マニュアルアプリと位置が違っていた。
 *   社長が写真2枚を並べて指摘。「どのアプリも、最初は、この形を取れるように」＝
 *   **並び順を型（core）が持つ**という裁定。
 *
 * だからここで見るのは「props を受けたか」ではなく **DOM に出てくる順**である。
 *   `querySelectorAll` は常に文書順で返すので、これが並び順の実測になる。
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { BusinessNav } from '../src/ui/BusinessNav';

afterEach(() => {
  cleanup();
});

/** 右群に出ている「主要な4つ」を文書順で読む。 */
function readRightOrder(container: HTMLElement): string[] {
  const right = container.querySelector('.magi-appshell-nav-right');
  if (!right) throw new Error('右群（.magi-appshell-nav-right）が無い');
  const nodes = right.querySelectorAll(
    '.magi-focus-toggle, [data-testid="nav-actions"], .magi-appshell-role-chip, .magi-appshell-menu',
  );
  return Array.from(nodes).map((node) => {
    if (node.classList.contains('magi-focus-toggle')) return '全画面';
    if (node.getAttribute('data-testid') === 'nav-actions') return '操作者';
    if (node.classList.contains('magi-appshell-role-chip')) return 'ロール';
    return 'メニュー';
  });
}

function renderNav(props: Partial<React.ComponentProps<typeof BusinessNav>> = {}) {
  return render(
    <BusinessNav
      activeTab="home"
      menuItems={[{ key: 'refresh', label: '再読み込み', onSelect: () => {} }]}
      navActions={<div data-testid="nav-actions">操作者</div>}
      navLeadingActions={<button type="button">投稿を書く</button>}
      onNavigate={() => {}}
      role="管理者"
      tabs={[{ value: 'home', label: 'ホーム' }]}
      {...props}
    />,
  );
}

describe('BusinessNav 右群の並び（全画面 → 操作者 → ロール → メニュー）', () => {
  it('onFocusModeChange を渡すと、core が右群の先頭に全画面を描く', () => {
    const { container } = renderNav({ focusMode: false, onFocusModeChange: () => {} });
    expect(readRightOrder(container)).toEqual(['全画面', '操作者', 'ロール', 'メニュー']);
  });

  it('全画面はタブ側（navLeadingActions の器）には出ない', () => {
    const { container } = renderNav({ focusMode: false, onFocusModeChange: () => {} });
    const leading = container.querySelector('.magi-appshell-nav-leading');
    expect(leading).toBeTruthy();
    expect(leading?.querySelector('.magi-focus-toggle')).toBeNull();
  });

  it('onFocusModeChange を渡さなければ全画面を描かない（既存アプリ無風）', () => {
    const { container } = renderNav();
    expect(container.querySelectorAll('.magi-focus-toggle').length).toBe(0);
    expect(readRightOrder(container)).toEqual(['操作者', 'ロール', 'メニュー']);
  });

  it('押すと次の状態（反転値）を返す', () => {
    const onFocusModeChange = vi.fn();
    renderNav({ focusMode: false, onFocusModeChange });
    fireEvent.click(screen.getByRole('button', { name: '全画面' }));
    expect(onFocusModeChange).toHaveBeenCalledWith(true);
  });

  it('focusMode 中は「戻る」で描かれ、押すと解除値を返す', () => {
    const onFocusModeChange = vi.fn();
    const { container } = renderNav({ focusMode: true, onFocusModeChange });
    expect(readRightOrder(container)[0]).toBe('全画面');
    fireEvent.click(screen.getByRole('button', { name: '戻る' }));
    expect(onFocusModeChange).toHaveBeenCalledWith(false);
  });
});
