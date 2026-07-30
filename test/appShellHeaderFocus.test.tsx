/**
 * v0.9 標準（社長裁定「フロントページ5層標準」）のCore側試験。
 *   (a) ヘッダーのバッジ行: 視覚順序（右端から 状態の説明→版→その他）と大きさ統一
 *   (b) 作業面の全画面表示: focusMode でヘッダー・ナビが消え、Esc で必ず戻る
 *
 * バッジ行も focus も**CSSで作る**仕組みなので、DOMの検査だけでは緑のまま壊せる。
 * そこで design-system.css の該当ブロックを実際に読み込んで流し込み、
 * getComputedStyle で「効いていること」を見る（規則を消せば落ちる）。
 */
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MagiAppShell } from '../src/ui/MagiAppShell';
import { MagiStatusSummary } from '../src/ui/MagiStatusSummary';
import { MagiVersionChip } from '../src/ui/MagiVersionChip';
import { StatusBadge } from '../src/ui/StatusBadge';
import { FocusToggle } from '../src/ui/FocusToggle';

// v0.9 で追加した節（バッジ行＋focus）だけを取り出して jsdom に流し込む。
// jsdom 環境ではグローバル URL が Node のものと別実装なので、パスは文字列で組む。
const CSS_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'ui', 'design-system.css');
const CSS_MARK = 'ヘッダーのバッジ行 ＋ 作業面の全画面表示';

beforeAll(() => {
  const css = readFileSync(CSS_PATH, 'utf8');
  const start = css.indexOf(CSS_MARK);
  expect(start).toBeGreaterThan(-1);
  const style = document.createElement('style');
  style.textContent = css.slice(start);
  document.head.appendChild(style);
});

afterEach(() => {
  cleanup();
});

function renderShell(props: Partial<React.ComponentProps<typeof MagiAppShell>> = {}) {
  return render(
    <MagiAppShell
      appName="テストアプリ"
      facilityName="第二湘南グリーン"
      headerStatus={
        <>
          <StatusBadge tone="info">その他バッジ</StatusBadge>
          <MagiStatusSummary />
        </>
      }
      headerVersion={<MagiVersionChip version="0.9.0" />}
      nav={<nav className="magi-appshell-nav">ナビ</nav>}
      {...props}
    >
      <p>作業面</p>
    </MagiAppShell>,
  );
}

describe('ヘッダーのバッジ行（v0.9 標準）', () => {
  it('視覚順序は右端から 状態の説明 → 版 → その他バッジ', () => {
    const { container } = renderShell();
    const order = (selector: string) =>
      Number(getComputedStyle(container.querySelector(selector) as Element).order || '0');

    // order が大きいほど右。状態の説明が最右、次に版、その他バッジは左。
    expect(order('.magi-appshell-status-details')).toBe(3);
    expect(order('.magi-appshell-version')).toBe(2);
    expect(order('.magi-appshell-status-badges')).toBe(1);
    // アプリが差した「その他バッジ」は order 未指定＝0 で最も左。
    expect(order('.magi-appshell-header-right > .magi-status-badge')).toBe(0);
  });

  it('状態要約クラスタは display: contents で親の並びへ溶ける（版を間に挟むため）', () => {
    // jsdom の CSS 実装は display: contents を解釈できず落とすため、
    // computed 値では確認できない。規則が消えていないことを CSS 本文で見る。
    const css = readFileSync(CSS_PATH, 'utf8');
    const block = css.slice(css.indexOf(CSS_MARK));
    expect(block).toMatch(/\.magi-appshell-status-cluster\s*\{\s*display:\s*contents;/);
    // 部品側の DOM も、クラスタが badges と details を包む形のままであること
    // （この形だから contents で溶かして間に版を差せる）。
    const { container } = renderShell();
    const cluster = container.querySelector('.magi-appshell-status-cluster') as Element;
    expect(cluster.querySelector(':scope > .magi-appshell-status-badges')).toBeTruthy();
    expect(cluster.querySelector(':scope > .magi-appshell-status-details')).toBeTruthy();
  });

  it('バッジ行は1列（nowrap）', () => {
    const { container } = renderShell();
    const right = container.querySelector('.magi-appshell-header-right') as Element;
    expect(getComputedStyle(right).flexWrap).toBe('nowrap');
  });

  it('ヘッダー内のバッジは高さ・padding が統一される（36px / 6px 10px）', () => {
    const { container } = renderShell();
    const badge = container.querySelector('.magi-appshell-header-right .magi-status-badge') as Element;
    const style = getComputedStyle(badge);
    expect(style.minHeight).toBe('36px');
    expect(style.paddingTop).toBe('6px');
    expect(style.paddingLeft).toBe('10px');
  });

  it('DOM順・各部品のAPIは変えていない（headerStatus → headerVersion のまま）', () => {
    const { container } = renderShell();
    const right = container.querySelector('.magi-appshell-header-right') as Element;
    const classes = Array.from(right.children).map((el) => el.className);
    // 最後が版チップ＝DOM上は従来どおりの並び（見た目だけ order で入れ替えている）。
    expect(classes[classes.length - 1]).toContain('magi-appshell-version');
  });
});

describe('作業面の全画面表示（focusMode）', () => {
  it('未指定なら何も変わらない（既存アプリ非破壊）', () => {
    const { container } = renderShell();
    const shell = container.querySelector('.magi-appshell') as HTMLElement;
    expect(shell.dataset.focusMode).toBe('off');
    expect(shell.classList.contains('magi-appshell-focus-mode')).toBe(false);
    expect(container.querySelector('.magi-appshell-focus-exit')).toBeNull();
    expect(getComputedStyle(container.querySelector('header') as Element).display).not.toBe('none');
  });

  it('focusMode でヘッダーとナビが消え、作業面と戻るボタンだけ残る', () => {
    const { container } = renderShell({ focusMode: true });
    expect(getComputedStyle(container.querySelector('header') as Element).display).toBe('none');
    expect(getComputedStyle(container.querySelector('nav') as Element).display).toBe('none');
    // 作業面は残り、全高に広がる。
    const main = container.querySelector('.magi-appshell-main') as Element;
    expect(getComputedStyle(main).display).not.toBe('none');
    expect(getComputedStyle(main).flexGrow).toBe('1');
    // 戻り口は必ず出る。
    expect(container.querySelector('.magi-appshell-focus-exit')).toBeTruthy();
  });

  it('アプリが .magi-appshell-focus-hidden を付けた帯も隠れる', () => {
    const { container } = render(
      <MagiAppShell appName="テストアプリ" facilityName="第二湘南グリーン" focusMode>
        <div className="magi-appshell-focus-hidden">補助の帯</div>
        <p>作業面</p>
      </MagiAppShell>,
    );
    expect(getComputedStyle(container.querySelector('.magi-appshell-focus-hidden') as Element).display).toBe('none');
  });

  it('Esc で必ず戻る（通知も飛ぶ）', () => {
    const onFocusModeChange = vi.fn();
    const { container } = renderShell({ focusMode: true, onFocusModeChange });
    const shell = container.querySelector('.magi-appshell') as HTMLElement;
    expect(shell.dataset.focusMode).toBe('on');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(shell.dataset.focusMode).toBe('off');
    expect(onFocusModeChange).toHaveBeenCalledWith(false);
    expect(getComputedStyle(container.querySelector('header') as Element).display).not.toBe('none');
  });

  it('onFocusModeChange を実装していないアプリでも Esc で戻れる（詰まない）', () => {
    const { container } = renderShell({ focusMode: true });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect((container.querySelector('.magi-appshell') as HTMLElement).dataset.focusMode).toBe('off');
  });

  it('モーダルが開いている間は Esc を横取りしない', () => {
    const onFocusModeChange = vi.fn();
    const { container } = renderShell({ focusMode: true, onFocusModeChange });
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    document.body.appendChild(modal);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onFocusModeChange).not.toHaveBeenCalled();
    expect((container.querySelector('.magi-appshell') as HTMLElement).dataset.focusMode).toBe('on');
    modal.remove();
  });

  it('戻るボタンを押しても戻る', () => {
    const onFocusModeChange = vi.fn();
    const { container } = renderShell({ focusMode: true, onFocusModeChange });
    fireEvent.click(container.querySelector('.magi-appshell-focus-exit') as Element);
    expect(onFocusModeChange).toHaveBeenCalledWith(false);
    expect((container.querySelector('.magi-appshell') as HTMLElement).dataset.focusMode).toBe('off');
  });

  it('印刷では focus の非表示規則を使わない（@media screen に閉じている）', () => {
    const css = readFileSync(CSS_PATH, 'utf8');
    const block = css.slice(css.indexOf(CSS_MARK));
    const focusRuleIndex = block.indexOf('.magi-appshell-focus-mode > *:not(');
    const screenIndex = block.indexOf('@media screen');
    expect(screenIndex).toBeGreaterThan(-1);
    expect(focusRuleIndex).toBeGreaterThan(screenIndex);
  });
});

describe('FocusToggle', () => {
  it('非focusでは「全画面」、focusでは「戻る」を出す', () => {
    const onChange = vi.fn();
    const enter = render(<FocusToggle focusMode={false} onFocusModeChange={onChange} />);
    expect(enter.container.textContent).toContain('全画面');
    expect(enter.container.querySelector('button')?.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(enter.container.querySelector('button') as Element);
    expect(onChange).toHaveBeenCalledWith(true);
    cleanup();

    const exit = render(<FocusToggle focusMode onFocusModeChange={onChange} />);
    expect(exit.container.textContent).toContain('戻る');
    fireEvent.click(exit.container.querySelector('button') as Element);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('押しやすさ44px（DADS整合レイヤの基準）', () => {
    const { container } = render(<FocusToggle focusMode={false} onFocusModeChange={() => {}} />);
    expect(getComputedStyle(container.querySelector('button') as Element).minHeight).toBe('44px');
  });
});
