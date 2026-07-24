import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MagiStatusSummary } from '../src/ui/MagiStatusSummary';
import { createEndpointWriteDetector, createEnvWriteDetector } from '../src/ui/statusDetection';

// jsdom の location.hostname は 'localhost'（＝detectRuntime→'local'）を既定に使う。
// v0.5.2・R1-C2（round2）: 安全側集約に入れるのは信頼済みの createEndpointWriteDetector
//   （同一オリジン health を storage.writable 固定スキーマで観測）だけ。
//   createEnvWriteDetector・生関数は「無検証」＝集約されない。

// storage.writable を返す health 応答をモックする信頼済み検出器を作るヘルパ。
function mockHealthDetector(writable: boolean) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ storage: { writable } }) })),
  );
  return createEndpointWriteDetector('/api/health');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MagiStatusSummary（P0・状態表示）', () => {
  it('(a) 誤申告拒否: 不正 kind を unsafeDeclaredStates に渡すと表示せずエラー個別表示', async () => {
    render(
      <MagiStatusSummary
        writeDetector={mockHealthDetector(false)}
        unsafeDeclaredStates={[{ kind: 'production', value: true, basis: '偽装' }]}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('状態申告エラー')).toBeTruthy();
    });
    // 偽装した「本番」状態が安全表示や無検証つき表示として出ていないこと。
    expect(screen.queryByText('本番URL')).toBeNull();
    expect(screen.queryByText('このPC内・書込OFF')).toBeNull();
  });

  it('(c) 集約除外: 無検証宣言（declaredStates）があると安全側集約が発動せず個別表示', async () => {
    render(
      <MagiStatusSummary
        writeDetector={mockHealthDetector(false)}
        declaredStates={[{ kind: 'businessLive', value: false, basis: '運用台帳' }]}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('無検証')).toBeTruthy();
    });
    expect(screen.queryByText('このPC内・書込OFF')).toBeNull();
  });

  it('(d) fail-closed: 書込エンドポイントが非OKだと集約せず「書込確認中」を展開', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    render(<MagiStatusSummary writeDetector={createEndpointWriteDetector('/api/health')} />);
    await waitFor(() => {
      expect(screen.getByText('書込確認中')).toBeTruthy();
    });
    expect(screen.queryByText('このPC内・書込OFF')).toBeNull();
  });

  it('安全側: local + 信頼済み書込OFF(health) + 宣言なしなら1バッジへ集約', async () => {
    render(<MagiStatusSummary writeDetector={mockHealthDetector(false)} />);
    await waitFor(() => {
      expect(screen.getByText('このPC内・書込OFF')).toBeTruthy();
    });
  });

  // R1-C2-DETECTOR-SELFDECLARATION（round2 負例）: 生関数（未検証）は安全側集約させない
  it('未検証（生関数）の書込OFFは集約せず「書込OFF」＋「無検証」を個別表示', async () => {
    render(<MagiStatusSummary writeDetector={() => false} />);
    await waitFor(() => {
      expect(screen.getByText('書込OFF')).toBeTruthy();
    });
    expect(screen.getByText('無検証')).toBeTruthy();
    expect(screen.queryByText('このPC内・書込OFF')).toBeNull();
  });

  // round2 負例: createEnvWriteDetector も無検証へ降格＝集約されない
  it('env 経由（createEnvWriteDetector）の書込OFFも集約せず「書込OFF」＋「無検証」', async () => {
    render(<MagiStatusSummary writeDetector={createEnvWriteDetector(() => false)} />);
    await waitFor(() => {
      expect(screen.getByText('書込OFF')).toBeTruthy();
    });
    expect(screen.getByText('無検証')).toBeTruthy();
    expect(screen.queryByText('このPC内・書込OFF')).toBeNull();
  });

  // R1-C2-FAILCLOSED-EDGE: 非boolean を返す生関数は検出失敗へ落ちる（書込OFFにしない）
  it('検出器が非booleanを返すと「書込確認中」（書込OFFに丸めない）', async () => {
    // @ts-expect-error 生JS境界を模す: 検出器が boolean 以外を返すケース
    render(<MagiStatusSummary writeDetector={() => 'yes'} />);
    await waitFor(() => {
      expect(screen.getByText('書込確認中')).toBeTruthy();
    });
    expect(screen.queryByText('書込OFF')).toBeNull();
  });
});
