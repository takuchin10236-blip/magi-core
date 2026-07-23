import { describe, it, expect } from 'vitest';
import {
  detectRuntime,
  validateDeclaredState,
  deriveStatusDisplay,
  createEnvWriteDetector,
  createEndpointWriteDetector,
  isTrustedWriteDetector,
  type StatusResolution,
} from '../src/ui/statusDetection';

function baseResolution(overrides: Partial<StatusResolution> = {}): StatusResolution {
  return {
    healthReady: true,
    runtimeSurface: 'preview',
    writable: false,
    writeDetectorFailed: false,
    writeTrusted: true,
    declared: [],
    rejected: [],
    ...overrides,
  };
}

describe('detectRuntime', () => {
  it('確証が無いホストは unknown に丸める（安全側にしない）', () => {
    expect(detectRuntime({}, 'app.example.com')).toBe('unknown');
  });
  it('localhost は local', () => {
    expect(detectRuntime({}, 'localhost')).toBe('local');
    expect(detectRuntime({}, '127.0.0.1')).toBe('local');
  });
  it('production は明示設定で判定', () => {
    expect(detectRuntime({ productionHosts: ['magi.example.jp'] }, 'magi.example.jp')).toBe('production');
  });
  // R1-C2-FAILCLOSED-EDGE: 空文字・hostname不能を local に丸めない。
  //   （明示 undefined はデフォルト引数 currentHostname() に置換されるため、
  //    hostname 不能の実体＝空文字ガードで担保する。SSR等では currentHostname()→undefined→同ガード。）
  it('空文字ホストは unknown（local に丸めない）', () => {
    expect(detectRuntime({}, '')).toBe('unknown');
  });
  it('空文字は localHosts に混ぜても local へ丸めない（先頭ガードで unknown 確定）', () => {
    expect(detectRuntime({ localHosts: [''] }, '')).toBe('unknown');
  });
});

describe('validateDeclaredState（許可リスト照合・R1-C2-INVALID-KIND-THROW）', () => {
  it('businessLive は通す', () => {
    const result = validateDeclaredState({ kind: 'businessLive', value: true, basis: '運用開始台帳' });
    expect(result.ok).toBe(true);
  });
  it('本番URLや書込を騙る不正 kind は拒否する', () => {
    const result = validateDeclaredState({ kind: 'production', value: true, basis: 'x' });
    expect(result.ok).toBe(false);
  });
  it('basis 空・value 非boolean は拒否する', () => {
    expect(validateDeclaredState({ kind: 'businessLive', value: true, basis: '' }).ok).toBe(false);
    expect(validateDeclaredState({ kind: 'businessLive', value: 'yes', basis: 'x' }).ok).toBe(false);
  });
  it('BigInt kind でも throw せず ok:false（JSON.stringify 事故の回避）', () => {
    expect(() => validateDeclaredState({ kind: 10n, value: true, basis: 'x' })).not.toThrow();
    expect(validateDeclaredState({ kind: 10n, value: true, basis: 'x' }).ok).toBe(false);
  });
  it('循環参照 object の kind でも throw せず ok:false', () => {
    const circular: Record<string, unknown> = { value: true, basis: 'x' };
    circular.self = circular;
    circular.kind = circular; // kind に循環 object
    expect(() => validateDeclaredState(circular)).not.toThrow();
    expect(validateDeclaredState(circular).ok).toBe(false);
  });
  it('Symbol kind でも throw せず ok:false', () => {
    expect(() => validateDeclaredState({ kind: Symbol('x'), value: true, basis: 'x' })).not.toThrow();
    expect(validateDeclaredState({ kind: Symbol('x'), value: true, basis: 'x' }).ok).toBe(false);
  });
  it('複数の不正入力を連続照合しても throw しない', () => {
    const inputs: unknown[] = [null, 42, 'str', { kind: 5n }, { kind: 'production' }, undefined];
    expect(() => inputs.map(validateDeclaredState)).not.toThrow();
    expect(inputs.map(validateDeclaredState).every((r) => r.ok === false)).toBe(true);
  });
});

describe('書込検出ファクトリ（R1-C2-DETECTOR-SELFDECLARATION）', () => {
  it('createEnvWriteDetector は信頼済みブランドを持つ', () => {
    const d = createEnvWriteDetector(() => false);
    expect(isTrustedWriteDetector(d)).toBe(true);
  });
  it('createEndpointWriteDetector も信頼済みブランドを持つ', () => {
    const d = createEndpointWriteDetector('/api/health');
    expect(isTrustedWriteDetector(d)).toBe(true);
  });
  it('生関数は信頼済みでない', () => {
    const raw = () => false;
    expect(isTrustedWriteDetector(raw)).toBe(false);
  });
  it('createEnvWriteDetector は boolean を返す（同期）', () => {
    expect(createEnvWriteDetector(() => true)()).toBe(true);
    expect(createEnvWriteDetector(() => false)()).toBe(false);
  });
  it('createEnvWriteDetector は非boolean で throw（fail-closed）', () => {
    // read() は () => unknown。boolean 以外は同期 throw → 呼び出し側で failed に落ちる。
    expect(() => createEnvWriteDetector(() => 'yes')()).toThrow();
    expect(() => createEnvWriteDetector(() => undefined)()).toThrow();
    expect(() => createEnvWriteDetector(() => 0)()).toThrow();
  });
});

describe('deriveStatusDisplay', () => {
  it('信頼済み検出器の書込OFF＋安全側で 1 バッジへ集約する', () => {
    const result = deriveStatusDisplay(baseResolution());
    expect(result.mode).toBe('aggregate');
    expect(result.visible.map((i) => i.label)).toEqual(['試験運用・書込OFF']);
  });

  it('local + 書込OFF は「このPC内・書込OFF」で集約', () => {
    const result = deriveStatusDisplay(baseResolution({ runtimeSurface: 'local' }));
    expect(result.mode).toBe('aggregate');
    expect(result.visible[0].label).toBe('このPC内・書込OFF');
  });

  // R1-C2-DETECTOR-SELFDECLARATION: 未検証（生関数）書込は集約させない
  it('未検証（生関数）の書込OFFは集約せず「書込OFF（無検証）」を個別表示', () => {
    const result = deriveStatusDisplay(baseResolution({ writeTrusted: false }));
    expect(result.mode).toBe('exposed');
    const off = result.visible.find((i) => i.label === '書込OFF');
    expect(off?.unverified).toBe(true);
  });

  it('未検証の書込ONは無検証併記の danger 個別表示', () => {
    const result = deriveStatusDisplay(baseResolution({ writable: true, writeTrusted: false }));
    expect(result.mode).toBe('exposed');
    const on = result.visible.find((i) => i.label === '書込ON');
    expect(on?.tone).toBe('danger');
    expect(on?.unverified).toBe(true);
  });

  it('無検証宣言があると集約せず個別表示する（宣言があるだけで集約禁止）', () => {
    const result = deriveStatusDisplay(
      baseResolution({ declared: [{ kind: 'businessLive', value: false, basis: '台帳' }] }),
    );
    expect(result.mode).toBe('exposed');
    const unverified = result.visible.find((i) => i.unverified);
    expect(unverified).toBeTruthy();
  });

  it('fail-closed: 書込検出が失敗すると集約せず「書込確認中」を出す', () => {
    const result = deriveStatusDisplay(
      baseResolution({ writable: null, writeDetectorFailed: true }),
    );
    expect(result.mode).toBe('exposed');
    expect(result.visible.some((i) => i.label === '書込確認中')).toBe(true);
  });

  it('production は本番URLを個別に露出する', () => {
    const result = deriveStatusDisplay(baseResolution({ runtimeSurface: 'production', writable: true }));
    expect(result.mode).toBe('exposed');
    expect(result.visible.map((i) => i.label)).toEqual(expect.arrayContaining(['本番URL', '書込ON']));
  });

  it('拒否された宣言はエラーとして個別表示（無検証つき表示ではない）', () => {
    const result = deriveStatusDisplay(
      baseResolution({ rejected: [{ reason: '許可されていない状態種別です', received: {} }] }),
    );
    expect(result.mode).toBe('exposed');
    const err = result.visible.find((i) => i.label === '状態申告エラー');
    expect(err).toBeTruthy();
    expect(err?.unverified).toBeFalsy();
  });

  it('healthReady 前は「状態確認中」だけ', () => {
    const result = deriveStatusDisplay(baseResolution({ healthReady: false }));
    expect(result.visible.map((i) => i.label)).toEqual(['状態確認中']);
  });
});
