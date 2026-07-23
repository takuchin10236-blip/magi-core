import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SgLumenLogo } from '../src/ui/SgLumenLogo';

describe('SgLumenLogo', () => {
  it('(e) SVGロゴが aria-label 付きで描画される', () => {
    const { container, getByLabelText } = render(<SgLumenLogo />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // 既定の施設名 aria-label が付く。
    expect(getByLabelText('SG 第二湘南グリーン（窓と富士）')).toBeTruthy();
    // ブランド文字 SG が含まれる。
    expect(container.textContent).toContain('SG');
  });

  it('label props で施設名を差し替えられる', () => {
    const { getByLabelText } = render(<SgLumenLogo label="別施設ロゴ" />);
    expect(getByLabelText('別施設ロゴ')).toBeTruthy();
  });
});
