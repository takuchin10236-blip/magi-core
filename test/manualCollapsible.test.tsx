/**
 * 防御目的: 既定で閉じる節（ManualSection.collapsed・v0.20.0）が、
 *   ①閉じて描かれる ②検索でヒットした時だけ開く ③手順の節を閉じない
 * ことを固定する。手順を折りたたむと「読まれない手順」が生まれるため、用途を試験で縛る。
 */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ManualViewer } from '../src/ui/ManualViewer';
import type { ManualContent } from '../src/ui/manual-types';

const content: ManualContent = {
  appName: '検査用',
  sections: [
    { id: 'howto', title: '① 使い方', blocks: [{ type: 'paragraph', text: '手順の本文です。' }] },
    {
      id: 'column',
      title: '（コラム）読み物',
      summary: '読みたい方だけどうぞ',
      collapsed: true,
      keywords: ['コラム'],
      blocks: [{ type: 'paragraph', text: 'うみのはなし。' }],
    },
  ],
};

afterEach(() => cleanup());

function search(text: string): void {
  fireEvent.change(document.getElementById('manual-search-input') as HTMLInputElement, {
    target: { value: text },
  });
}

function sectionEl(id: string): HTMLElement {
  const el = document.getElementById(`manual-section-${id}`);
  if (!el) throw new Error(`節が描かれていない: ${id}`);
  return el;
}

describe('既定で閉じる節', () => {
  it('collapsed の節は details で描かれ、閉じた状態で始まる', () => {
    render(<ManualViewer content={content} onClose={() => {}} />);
    const el = sectionEl('column');
    expect(el.tagName.toLowerCase()).toBe('details');
    expect((el as HTMLDetailsElement).open).toBe(false);
  });

  it('collapsed でない節は section のまま（折りたたまない）', () => {
    render(<ManualViewer content={content} onClose={() => {}} />);
    expect(sectionEl('howto').tagName.toLowerCase()).toBe('section');
  });

  it('閉じていても見出しと一言は見える（開く前に読むかどうか決められる）', () => {
    render(<ManualViewer content={content} onClose={() => {}} />);
    // 見出しは目次にも出るため、節の中だけを見る
    const summary = sectionEl('column').querySelector('summary');
    expect(summary?.textContent).toContain('（コラム）読み物');
    expect(summary?.textContent).toContain('読みたい方だけどうぞ');
  });

  it('検索語がその節に当たると自動で開く（ヒットが隠れない）', () => {
    render(<ManualViewer content={content} onClose={() => {}} />);
    search('うみ');
    expect((sectionEl('column') as HTMLDetailsElement).open).toBe(true);
  });

  it('当たらない検索では開かない', () => {
    render(<ManualViewer content={content} onClose={() => {}} />);
    search('手順');
    expect((sectionEl('column') as HTMLDetailsElement).open).toBe(false);
  });
});
