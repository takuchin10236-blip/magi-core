/**
 * ManualViewer の背景スクロール停止・解放の回帰試験（v0.13.7）。
 *
 * なぜ要るか（2026-08-05 二系統レビューの致命指摘）:
 *   v0.13.6 で背景スクロールの制御を移行したのは DraggableModal と ManualViewer の2箇所。
 *   ところが番人（試験・検査器）は DraggableModal にしか無く、**ManualViewer を修正前の形へ
 *   丸ごと戻しても 251試験・verify:modal・型検査のすべてが素通り**することが変異試験で実証された。
 *   「マニュアルを閉じても永久にスクロールできない」が誰にも気づかれずに配られる状態だった。
 *
 *   jsdom に IntersectionObserver が無く描画できないことが、試験が無い理由になっていた
 *   （test/setup.ts のスタブで解消）。「試験しにくい」を「試験が無い」の理由にしない。
 */
import { useState } from 'react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { ManualViewer } from '../src/ui/ManualViewer';
import { DraggableModal } from '../src/ui/DraggableModal';
import { getBodyScrollLockDepth, forceReleaseBodyScroll } from '../src/ui/scrollLock';
import type { ManualContent } from '../src/ui/manual-types';

const CONTENT: ManualContent = {
  appName: '試験用アプリ',
  sections: [
    { id: 'what', title: '① これは何か', blocks: [{ type: 'paragraph', text: '説明の本文。' }] },
    { id: 'how', title: '② 使い方', blocks: [{ type: 'steps', items: ['開く', '読む'] }] },
  ],
};

beforeEach(() => {
  forceReleaseBodyScroll();
  document.body.style.overflow = '';
});

afterEach(() => {
  cleanup();
  forceReleaseBodyScroll();
});

function ManualHost() {
  const [open, setOpen] = useState(true);
  return open ? <ManualViewer content={CONTENT} onClose={() => setOpen(false)} /> : <p>閉じました</p>;
}

/** マニュアルの上に確認モーダルが重なり、同時に閉じる形（メニュー内マニュアルの標準構成）。 */
function ManualWithConfirm() {
  const [open, setOpen] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!open) return <p>閉じました</p>;
  return (
    <>
      <ManualViewer content={CONTENT} onClose={() => setOpen(false)} />
      <button onClick={() => setConfirmOpen(true)} type="button">確認を開く</button>
      {confirmOpen ? (
        <DraggableModal onClose={() => setConfirmOpen(false)} title="確認" zIndex={60}>
          <button onClick={() => { setConfirmOpen(false); setOpen(false); }} type="button">両方閉じる</button>
        </DraggableModal>
      ) : null}
    </>
  );
}

describe('ManualViewer の背景スクロール', () => {
  it('開いている間は止まり、閉じたら戻る', () => {
    render(<ManualHost />);
    expect(document.body.style.overflow).toBe('hidden');
    expect(getBodyScrollLockDepth()).toBe(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByText('閉じました')).toBeTruthy();
    expect(document.body.style.overflow).toBe('');
    expect(getBodyScrollLockDepth()).toBe(0);
  });

  it('確認モーダルと同時に閉じても戻る（入れ子の同時閉じ）', () => {
    render(<ManualWithConfirm />);
    fireEvent.click(screen.getByText('確認を開く'));
    expect(getBodyScrollLockDepth()).toBe(2);

    fireEvent.click(screen.getByText('両方閉じる'));
    expect(document.body.style.overflow).toBe('');
    expect(getBodyScrollLockDepth()).toBe(0);
  });
});
