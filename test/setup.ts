/**
 * 試験環境の共通スタブ。
 *
 * jsdom には IntersectionObserver が無く、ManualViewer（目次の現在位置追従に使う）が
 * 描画できなかった。「試験しにくい」が「試験が無い」を正当化し、背景スクロールの
 * 全面退行が全ゲートを素通りする穴になっていた（2026-08-05 二系統レビュー・v0.13.7）。
 */
class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return [];
  }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}
