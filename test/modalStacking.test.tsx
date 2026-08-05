/**
 * モーダルが背面に回る事故の回帰試験（2026-08-05 実機・職員指導記録アプリ）。
 *
 * 事故:
 *   更新履歴パネルを開くと、上部の状態バーとヘッダのメニューの**後ろ**に回った。
 *   社長の観測「このへんの、メニューや状態説明などの表示の際、よく起こる。
 *   今までのアプリでも結構指摘している」。
 *
 * 真因は2つ重なっていた:
 *   1. DraggableModal の既定 z-index が生の `50` で、ヘッダのメニュー
 *      （--magi-z-header-popover = 500）に**数字で負けていた**。
 *   2. portal を使っていなかったため、`backdrop-filter` を持つ祖先が作る
 *      スタッキングコンテキストに閉じ込められ、いくつを付けても勝てない形だった。
 *
 * この試験は両方を固定する。どちらか一方でも戻せば赤くなる。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { DraggableModal } from '../src/ui/DraggableModal';

afterEach(() => {
  cleanup();
});

/** 事故時と同じ形: `backdrop-filter` でスタッキングコンテキストになる祖先の内側で開く。 */
function FilteredAncestor({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="filtered-ancestor" style={{ backdropFilter: 'blur(14px)', position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  );
}

function overlayOf(): HTMLElement {
  const dialog = screen.getByRole('dialog');
  const overlay = dialog.closest('.magi-modal-overlay');
  if (!(overlay instanceof HTMLElement)) throw new Error('オーバーレイが見つかりません');
  return overlay;
}

describe('モーダルの重なり', () => {
  it('スタッキングコンテキストを作る祖先の内側で開いても、body直下へ抜ける', () => {
    render(
      <FilteredAncestor>
        <DraggableModal onClose={() => {}} title="更新履歴">本文</DraggableModal>
      </FilteredAncestor>,
    );

    const overlay = overlayOf();
    const ancestor = screen.getByTestId('filtered-ancestor');

    expect(overlay.parentElement).toBe(document.body);
    expect(ancestor.contains(overlay)).toBe(false);
  });

  it('既定の重なりは共通トークン経由で、生の数値を持たない', () => {
    render(<DraggableModal onClose={() => {}} title="更新履歴">本文</DraggableModal>);

    const zIndex = overlayOf().style.zIndex;
    expect(zIndex).toContain('--magi-z-modal');
    // 旧既定値 50 は、ヘッダのメニュー(500)に負けるので二度と既定にしない。
    expect(zIndex).not.toBe('50');
  });

  it('重ねモーダル用に、呼び出し側から高さを渡せることは維持する', () => {
    render(
      <DraggableModal onClose={() => {}} title="重ねる" zIndex="var(--magi-z-fullscreen, 1000)">
        本文
      </DraggableModal>,
    );

    expect(overlayOf().style.zIndex).toContain('--magi-z-fullscreen');
  });
});
