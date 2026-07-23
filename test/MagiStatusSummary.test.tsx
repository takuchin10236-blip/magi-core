import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MagiStatusSummary } from '../src/ui/MagiStatusSummary';

// jsdom の location.hostname は 'localhost'（＝detectRuntime→'local'）を既定に使う。

describe('MagiStatusSummary（P0・状態表示）', () => {
  it('(a) 誤申告拒否: 不正 kind の declaredStates は表示せずエラー個別表示', async () => {
    render(
      <MagiStatusSummary
        writeDetector={() => false}
        declaredStates={[{ kind: 'production', value: true, basis: '偽装' }]}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('状態申告エラー')).toBeTruthy();
    });
    // 偽装した「本番」状態が安全表示や無検証つき表示として出ていないこと。
    expect(screen.queryByText('本番URL')).toBeNull();
    expect(screen.queryByText('このPC内・書込OFF')).toBeNull();
  });

  it('(c) 集約除外: 無検証宣言があると安全側集約が発動せず個別表示', async () => {
    render(
      <MagiStatusSummary
        writeDetector={() => false}
        declaredStates={[{ kind: 'businessLive', value: false, basis: '運用台帳' }]}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('無検証')).toBeTruthy();
    });
    expect(screen.queryByText('このPC内・書込OFF')).toBeNull();
  });

  it('(d) fail-closed: 書込検出が例外で落ちると集約せず「書込確認中」を展開', async () => {
    render(
      <MagiStatusSummary
        writeDetector={() => {
          throw new Error('detector down');
        }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('書込確認中')).toBeTruthy();
    });
    expect(screen.queryByText('このPC内・書込OFF')).toBeNull();
  });

  it('安全側: local + 書込OFF + 宣言なしなら1バッジへ集約', async () => {
    render(<MagiStatusSummary writeDetector={() => false} />);
    await waitFor(() => {
      expect(screen.getByText('このPC内・書込OFF')).toBeTruthy();
    });
  });
});
