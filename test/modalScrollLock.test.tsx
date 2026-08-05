/**
 * 入れ子モーダルの背景スクロール停止の回帰試験（v0.13.6・v0.13.7でAPI更新）。
 *
 * 事故（2026-08-05 連絡ノート実機・社長が再現）:
 *   投稿フォーム（DraggableModal）の上に投稿前の確認モーダル（ConfirmModal＝DraggableModal）が開く。
 *   投稿が成功すると両方が同じ更新で閉じる。従来は各モーダルが「自分が退避した値」へ戻していたため、
 *   後から開いた側が 'hidden' を書き戻し、モーダルが1枚も無いのにページがスクロールできなくなった。
 */
import { StrictMode, useState } from 'react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { DraggableModal } from '../src/ui/DraggableModal';
import { forceReleaseBodyScroll, getBodyScrollLockDepth, lockBodyScroll } from '../src/ui/scrollLock';

beforeEach(() => {
  forceReleaseBodyScroll();
  document.body.style.overflow = '';
});

afterEach(() => {
  cleanup();
  forceReleaseBodyScroll();
});

describe('lockBodyScroll（参照カウント）', () => {
  it('最初の1枚で止め、最後の1枚が解除するまで戻さない', () => {
    const releaseA = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    const releaseB = lockBodyScroll();
    expect(getBodyScrollLockDepth()).toBe(2);

    releaseA();
    expect(document.body.style.overflow).toBe('hidden'); // Bがまだ開いている
    releaseB();
    expect(document.body.style.overflow).toBe('');
  });

  it('解除の順序が入れ替わっても戻る', () => {
    const releaseA = lockBodyScroll();
    const releaseB = lockBodyScroll();
    releaseB();
    releaseA();
    expect(document.body.style.overflow).toBe('');
    expect(getBodyScrollLockDepth()).toBe(0);
  });

  it('同じ解除を二度呼んでもカウントを壊さない（StrictMode の二重実行対策）', () => {
    const releaseA = lockBodyScroll();
    const releaseB = lockBodyScroll();
    releaseA();
    releaseA();
    expect(document.body.style.overflow).toBe('hidden'); // Bの分は生きている
    releaseB();
    expect(document.body.style.overflow).toBe('');
  });

  it('元の値が hidden 以外なら、その値へ戻す', () => {
    document.body.style.overflow = 'auto';
    const release = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    release();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('ロック中に他者が値を変えていたら踏み潰さない（v0.13.7）', () => {
    const release = lockBodyScroll();
    document.body.style.overflow = 'auto'; // 別ライブラリ・アプリ側の後始末が書いた想定
    release();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('非常口は数え漏れの固着を解く（v0.13.7）', () => {
    lockBodyScroll();
    lockBodyScroll(); // 解除を呼ばずに捨てる＝数え漏れ
    expect(document.body.style.overflow).toBe('hidden');

    forceReleaseBodyScroll();
    expect(document.body.style.overflow).toBe('');
    expect(getBodyScrollLockDepth()).toBe(0);
  });
});

/** 投稿フォームの上に確認モーダルを重ね、成功時に両方を同時に閉じる画面。 */
function NestedModals() {
  const [formOpen, setFormOpen] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!formOpen) return <p>閉じました</p>;
  return (
    <>
      <DraggableModal onClose={() => setFormOpen(false)} title="新しい連絡を投稿">
        <button onClick={() => setConfirmOpen(true)} type="button">内容を確認</button>
      </DraggableModal>
      {confirmOpen ? (
        <DraggableModal onClose={() => setConfirmOpen(false)} title="この内容で投稿しますか" zIndex={60}>
          <button onClick={() => { setConfirmOpen(false); setFormOpen(false); }} type="button">投稿する</button>
        </DraggableModal>
      ) : null}
    </>
  );
}

describe('入れ子モーダルを同時に閉じても画面が固まらない', () => {
  it('投稿が成功して両方閉じたら、背景スクロールが戻る', () => {
    render(<NestedModals />);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByText('内容を確認'));

    fireEvent.click(screen.getByText('投稿する'));
    expect(screen.getByText('閉じました')).toBeTruthy();
    // 社長が見た症状そのもの: モーダルが1枚も無いのにスクロールできない、を先に検査する。
    expect(document.body.style.overflow).toBe('');
    expect(getBodyScrollLockDepth()).toBe(0);
  });

  it('StrictMode（効果の二重実行）でも戻る（v0.13.7）', () => {
    render(<StrictMode><NestedModals /></StrictMode>);
    fireEvent.click(screen.getByText('内容を確認'));
    fireEvent.click(screen.getByText('投稿する'));
    expect(document.body.style.overflow).toBe('');
    expect(getBodyScrollLockDepth()).toBe(0);
  });

  it('確認モーダルだけ閉じた時は、下のモーダルの分が残る', () => {
    render(<NestedModals />);
    fireEvent.click(screen.getByText('内容を確認'));
    const closeButtons = screen.getAllByLabelText('閉じる');
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(document.body.style.overflow).toBe('hidden');
    expect(getBodyScrollLockDepth()).toBe(1);
  });
});
