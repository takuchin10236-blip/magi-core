/**
 * 操作者選択モーダルの注意文（3-C・2026-08-02 UI標準コア還流）。
 *
 * 型v1.6 の必須要件「**本人認証ではないと画面に明示する**」は不変。
 * 折りたたみ（disclaimerCollapsible）は opt-in で、畳んだ形でも要旨は常に画面に出る。
 * 「消す prop が存在しない」ことも機械で縛る（型要件を将来こっそり外させない）。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { OperatorSelectModal } from '../src/ui/Operator';

const OPERATOR_SRC = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'ui', 'Operator.tsx'),
  'utf8',
);

const FULL_TEXT = 'これは本人認証ではありません。共有端末で操作した本人が、自分の名前を選んでください。';

afterEach(() => {
  cleanup();
});

function renderModal(props: Partial<React.ComponentProps<typeof OperatorSelectModal>> = {}) {
  return render(
    <OperatorSelectModal
      onClose={() => {}}
      onSelect={() => {}}
      open
      selectedOperatorId="s1"
      staff={[{ id: 's1', name: '職員A' }]}
      {...props}
    />,
  );
}

const disclaimer = (container: HTMLElement) =>
  container.querySelector('.operator-select-disclaimer') as HTMLElement;

describe('3-C: 注意文の折りたたみ（opt-in）', () => {
  it('渡さなければ従来どおり <p> の常時表示（既定動作不変・スナップショット固定）', () => {
    const { container } = renderModal();
    const el = disclaimer(container);
    expect(el.tagName).toBe('P');
    expect(el.textContent).toBe(FULL_TEXT);
    expect(el.outerHTML).toMatchInlineSnapshot(`"<p class="operator-select-note operator-select-disclaimer" role="note">これは本人認証ではありません。共有端末で操作した本人が、自分の名前を選んでください。</p>"`);
  });

  it('disclaimerCollapsible={false} は「渡さない」と完全一致', () => {
    const withoutProp = renderModal();
    const htmlA = disclaimer(withoutProp.container).outerHTML;
    cleanup();

    const withFalse = renderModal({ disclaimerCollapsible: false });
    expect(disclaimer(withFalse.container).outerHTML).toBe(htmlA);
  });

  it('true なら <details>＋summary に要旨が常時見える', () => {
    const { container } = renderModal({ disclaimerCollapsible: true });
    const el = disclaimer(container);
    expect(el.tagName).toBe('DETAILS');
    const summary = el.querySelector('summary') as HTMLElement;
    // 畳んだ状態（open なし）でも summary の要旨は画面に出ている＝「明示」は成立する。
    expect((el as HTMLDetailsElement).open).toBe(false);
    expect(summary.textContent).toBe('これは本人認証ではありません');
    // 開けば全文（要旨＋詳しい説明）が読める。
    expect(el.textContent).toContain('共有端末で操作した本人が、自分の名前を選んでください。');
  });

  it('折りたたんでも他の案内・一覧は従来どおり', () => {
    renderModal({ disclaimerCollapsible: true });
    expect(screen.getByText('閲覧と印刷は未選択でも使えます。保存・取消では選択が必須です。')).toBeTruthy();
    expect(screen.getByRole('option', { name: '職員A' })).toBeTruthy();
  });

  it('選ぶ操作は畳んだ形でも壊れない', () => {
    let picked = '';
    renderModal({ disclaimerCollapsible: true, onSelect: (id: string) => { picked = id; } });
    fireEvent.click(screen.getByRole('option', { name: '職員A' }));
    expect(picked).toBe('s1');
  });
});

describe('型要件の不変（本人認証ではないと明示する）', () => {
  it('注意文を消す prop は存在しない', () => {
    const propsBlock = OPERATOR_SRC.slice(
      OPERATOR_SRC.indexOf('export interface OperatorSelectModalProps'),
      OPERATOR_SRC.indexOf('export function OperatorSelectModal'),
    );
    for (const forbidden of ['hideDisclaimer', 'showDisclaimer', 'disclaimer?:', 'withoutDisclaimer']) {
      expect(propsBlock).not.toContain(forbidden);
    }
  });

  it('どちらの形でも「本人認証ではありません」は必ず画面に出る', () => {
    const plain = renderModal();
    expect(plain.container.textContent).toContain('これは本人認証ではありません');
    cleanup();

    const collapsed = renderModal({ disclaimerCollapsible: true });
    expect(collapsed.container.textContent).toContain('これは本人認証ではありません');
  });
});
