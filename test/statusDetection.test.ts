import { describe, it, expect } from 'vitest';
import {
  detectRuntime,
  validateDeclaredState,
  deriveStatusDisplay,
  type StatusResolution,
} from '../src/ui/statusDetection';

function baseResolution(overrides: Partial<StatusResolution> = {}): StatusResolution {
  return {
    healthReady: true,
    runtimeSurface: 'preview',
    writable: false,
    writeDetectorFailed: false,
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
});

describe('validateDeclaredState（許可リスト照合）', () => {
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
});

describe('deriveStatusDisplay', () => {
  it('全検出成功かつ安全側で 1 バッジへ集約する', () => {
    const result = deriveStatusDisplay(baseResolution());
    expect(result.mode).toBe('aggregate');
    expect(result.visible.map((i) => i.label)).toEqual(['試験運用・書込OFF']);
  });

  it('local + 書込OFF は「このPC内・書込OFF」で集約', () => {
    const result = deriveStatusDisplay(baseResolution({ runtimeSurface: 'local' }));
    expect(result.mode).toBe('aggregate');
    expect(result.visible[0].label).toBe('このPC内・書込OFF');
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
