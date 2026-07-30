/**
 * 書込検出器のシングルトン化（v0.9.4）の試験。
 *
 * 事故: JSX の中で createHealthWriteDetector() を呼ぶと毎レンダー別参照になり、
 *   MagiStatusSummary の検出 effect（依存 [writeDetector]）が回り続けて
 *   /api/health を叩き続ける。同じオブジェクトを返せば参照が変わらず1回で済む。
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { MagiStatusSummary } from '../src/ui/MagiStatusSummary';
import {
  createEndpointWriteDetector,
  createEnvWriteDetector,
  createHealthWriteDetector,
  isTrustedWriteDetector,
} from '../src/ui/statusDetection';

function stubHealthFetch() {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    url: `${location.origin}/api/health`,
    json: async () => ({ storage: { writable: false } }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createHealthWriteDetector はシングルトン', () => {
  it('何度呼んでも同じオブジェクトを返す', () => {
    expect(createHealthWriteDetector()).toBe(createHealthWriteDetector());
  });

  it('createEndpointWriteDetector（@deprecated 別名）も同じ実体へ委譲する', () => {
    expect(createEndpointWriteDetector('/api/health')).toBe(createHealthWriteDetector());
    expect(createEndpointWriteDetector('https://evil.example.com/x')).toBe(createHealthWriteDetector());
  });

  it('信頼済み判定は変わらない（意味論は不変）', () => {
    expect(isTrustedWriteDetector(createHealthWriteDetector())).toBe(true);
    expect(isTrustedWriteDetector(createEndpointWriteDetector())).toBe(true);
    // 環境値アダプタは従来どおり毎回別実体・無検証のまま。
    expect(createEnvWriteDetector(() => true)).not.toBe(createEnvWriteDetector(() => true));
    expect(isTrustedWriteDetector(createEnvWriteDetector(() => true))).toBe(false);
  });
});

describe('親を何度再レンダーしても観測は1回', () => {
  it('JSX 内生成のままでも /api/health の fetch は1回だけ', async () => {
    const fetchMock = stubHealthFetch();
    // 事故が起きていた書き方（JSX の中で毎回呼ぶ）で検証する。
    const view = render(<MagiStatusSummary writeDetector={createHealthWriteDetector()} detailRows={[{ label: 'n', value: '0' }]} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    for (let i = 1; i <= 10; i += 1) {
      view.rerender(
        <MagiStatusSummary writeDetector={createHealthWriteDetector()} detailRows={[{ label: 'n', value: String(i) }]} />,
      );
    }
    await waitFor(() => expect(view.container.textContent).toContain('状態の説明'));

    const healthCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/health'));
    expect(healthCalls.length).toBe(1);
  });

  it('参照が毎回変わる検出器なら再実行される（＝この試験が効いていることの裏取り）', async () => {
    const runs = vi.fn(async () => false);
    const view = render(<MagiStatusSummary writeDetector={() => runs()} />);
    await waitFor(() => expect(runs).toHaveBeenCalledTimes(1));
    for (let i = 1; i <= 3; i += 1) {
      view.rerender(<MagiStatusSummary writeDetector={() => runs()} />);
    }
    await waitFor(() => expect(runs.mock.calls.length).toBeGreaterThan(1));
  });
});

describe('開発時の助言（参照が毎レンダー変わる）', () => {
  it('しきい値を超えたら1回だけ console.warn する', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(<MagiStatusSummary writeDetector={createEnvWriteDetector(() => true)} />);
    for (let i = 0; i < 12; i += 1) {
      view.rerender(<MagiStatusSummary writeDetector={createEnvWriteDetector(() => true)} />);
    }
    await waitFor(() => expect(warn).toHaveBeenCalled());
    const churnWarnings = warn.mock.calls.filter(([msg]) => String(msg).includes('writeDetector の参照が毎レンダー変わっています'));
    expect(churnWarnings.length).toBe(1);
    expect(String(churnWarnings[0][0])).toContain('module 定数や useMemo');
  });

  it('シングルトンを使っていれば助言は出ない', async () => {
    stubHealthFetch();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(<MagiStatusSummary writeDetector={createHealthWriteDetector()} />);
    for (let i = 0; i < 12; i += 1) {
      view.rerender(<MagiStatusSummary writeDetector={createHealthWriteDetector()} />);
    }
    await waitFor(() => expect(view.container.textContent).toContain('状態の説明'));
    const churnWarnings = warn.mock.calls.filter(([msg]) => String(msg).includes('writeDetector の参照が毎レンダー変わっています'));
    expect(churnWarnings.length).toBe(0);
  });
});
