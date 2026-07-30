/**
 * BusinessNav の外側クリック判定 × portal モーダルの回帰試験（v0.9.1）。
 *
 * 事故（2026-07-30 shift-v4 実機で再現）:
 *   menuChildren に ManualEntry を置く標準構成で、マニュアル本文をクリックすると
 *   メニューが「外側を押された」と判断して閉じ、ManualEntry ごと unmount され、
 *   開いていたマニュアルが消える。モーダルは portal で body 直下に出るため、
 *   メニューの DOM 配下に居ないのが原因。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { BusinessNav } from '../src/ui/BusinessNav';

afterEach(() => {
  cleanup();
});

/** ManualEntry 相当: ボタンで portal 先（body直下）にモーダルを開く部品。 */
function PortalModalEntry() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        マニュアルを開く
      </button>
      {open
        ? createPortal(
            <div aria-modal="true" data-testid="manual" role="dialog">
              <p data-testid="manual-body">マニュアル本文</p>
              <button onClick={() => setOpen(false)} type="button">
                マニュアルを閉じる
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function renderNav() {
  const view = render(
    <BusinessNav
      activeTab="home"
      menuChildren={<PortalModalEntry />}
      onNavigate={() => {}}
      tabs={[{ value: 'home', label: 'ホーム' }]}
    />,
  );
  // メニューを開き、その中の部品からモーダルを開く。
  fireEvent.click(screen.getByRole('button', { name: /メニュー/ }));
  expect(document.querySelector('.magi-appshell-menu-panel')).toBeTruthy();
  fireEvent.click(screen.getByText('マニュアルを開く'));
  expect(screen.getByTestId('manual')).toBeTruthy();
  return view;
}

describe('BusinessNav × portal モーダル', () => {
  it('モーダル本文をクリックしてもメニューは閉じない（中の部品が消えない）', () => {
    renderNav();

    fireEvent.pointerDown(screen.getByTestId('manual-body'));

    // メニューが開いたまま＝menuChildren も生きている＝マニュアルが消えない。
    expect(document.querySelector('.magi-appshell-menu-panel')).toBeTruthy();
    expect(screen.getByTestId('manual')).toBeTruthy();
    expect(screen.getByText('マニュアルを開く')).toBeTruthy();
  });

  it('モーダルが開いている間の Esc もメニューを畳まない（モーダル側の閉じる操作）', () => {
    renderNav();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.querySelector('.magi-appshell-menu-panel')).toBeTruthy();
    expect(screen.getByTestId('manual')).toBeTruthy();
  });

  it('モーダルの外・メニューの外を押せば従来どおり閉じる', () => {
    renderNav();

    // モーダルを閉じてから（＝aria-modal な要素が無い状態で）画面の外側を押す。
    fireEvent.click(screen.getByText('マニュアルを閉じる'));
    expect(screen.queryByTestId('manual')).toBeNull();
    fireEvent.pointerDown(document.body);

    expect(document.querySelector('.magi-appshell-menu-panel')).toBeNull();
  });

  it('モーダルが無ければ Esc でも従来どおり閉じる', () => {
    render(
      <BusinessNav
        activeTab="home"
        menuChildren={<span>設定</span>}
        onNavigate={() => {}}
        tabs={[{ value: 'home', label: 'ホーム' }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /メニュー/ }));
    expect(document.querySelector('.magi-appshell-menu-panel')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.querySelector('.magi-appshell-menu-panel')).toBeNull();
  });

  it('aria-modal でない popover（版チップのパネル等）は従来どおり外側扱い', () => {
    renderNav();
    fireEvent.click(screen.getByText('マニュアルを閉じる'));

    // role="dialog" だけ・aria-modal 無しの要素は「外側」のまま（挙動を変えない）。
    const popover = document.createElement('div');
    popover.setAttribute('role', 'dialog');
    const inner = document.createElement('span');
    popover.appendChild(inner);
    document.body.appendChild(popover);

    fireEvent.pointerDown(inner);

    expect(document.querySelector('.magi-appshell-menu-panel')).toBeNull();
    popover.remove();
  });
});
