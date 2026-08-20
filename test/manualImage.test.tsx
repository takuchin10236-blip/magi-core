/**
 * 防御目的: 図（image ブロック・v0.21.0）が
 *   ①figure/img/figcaption で描かれ ②alt が必ず渡り ③遅延読み込みで本文の表示を止めず
 *   ④検索は alt と caption を見る（画像の中の文字は機械が読めない）
 * ことを固定する。alt が落ちると、読み上げ環境と画像が出ない端末で意味が消える。
 */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ManualViewer } from '../src/ui/ManualViewer';
import { SG_LOGO_FIGURES } from '../src/ui/manualFigures';
import type { ManualContent } from '../src/ui/manual-types';

const content: ManualContent = {
  appName: '検査用',
  sections: [
    {
      id: 'howto',
      title: '① 使い方',
      blocks: [
        { type: 'paragraph', text: '手順の本文です。' },
        {
          type: 'image',
          src: '/figures/login.png',
          alt: 'ログイン画面。メールの欄と青いボタンがある。',
          caption: '図1　この画面が出たら押します',
        },
      ],
    },
    { id: 'other', title: '② ほか', blocks: [{ type: 'paragraph', text: 'べつの節です。' }] },
  ],
};

afterEach(() => cleanup());

function search(text: string): void {
  fireEvent.change(document.getElementById('manual-search-input') as HTMLInputElement, {
    target: { value: text },
  });
}

describe('マニュアルの図（image ブロック）', () => {
  it('figure / img / figcaption で描き、alt と遅延読み込みを渡す', () => {
    const { container } = render(<ManualViewer content={content} onClose={() => {}} />);
    const figure = container.querySelector('figure.manual-figure');
    expect(figure).toBeTruthy();
    const img = figure!.querySelector('img.manual-figure-image') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/figures/login.png');
    expect(img.getAttribute('alt')).toBe('ログイン画面。メールの欄と青いボタンがある。');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(figure!.querySelector('figcaption.manual-figure-caption')?.textContent).toContain('図1');
  });

  it('図の alt に当たる語で、その節が検索の件数に入る', () => {
    render(<ManualViewer content={content} onClose={() => {}} />);
    search('青いボタン');
    expect(document.getElementById('manual-search-summary')?.textContent).toContain('1 件');
  });

  it('図の caption に当たる語でも検索に入り、caption はハイライトされる', () => {
    const { container } = render(<ManualViewer content={content} onClose={() => {}} />);
    search('押します');
    expect(document.getElementById('manual-search-summary')?.textContent).toContain('1 件');
    const marks = [...container.querySelectorAll('figcaption mark.search-hit')].map((m) => m.textContent);
    expect(marks).toContain('押します');
  });

  it('どの節にも無い語では0件（図があるだけで当たらない）', () => {
    render(<ManualViewer content={content} onClose={() => {}} />);
    search('存在しない語');
    expect(document.getElementById('manual-search-summary')?.textContent).toContain('0 件');
  });

  it('ロゴ節用の図6枚が公開APIから取れる', () => {
    const names = Object.keys(SG_LOGO_FIGURES).sort();
    expect(names).toEqual(['fuji', 'full', 'karakusa', 'monogram', 'threeSkies', 'wave']);
    for (const value of Object.values(SG_LOGO_FIGURES)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
