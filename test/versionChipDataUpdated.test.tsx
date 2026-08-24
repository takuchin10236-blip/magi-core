/**
 * 防御目的: 版チップの時刻が「コードを直した時」だけでなく「データ台帳を直した時」にも動くことを固定する。
 *   版表示は "何か手を加えて本番へ反映した" ことを捉えるためにあり、コードが変わらなくても
 *   台帳を変えれば最低でも時刻は動く（社長要望 2026-08-25）。ここが壊れると
 *   「直したのにヘッダが昨日のまま」＝反映されたか判らない画面へ戻る。
 */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MagiVersionChip } from '../src/ui/MagiVersionChip';
import { formatReleaseLabel, resolveReleaseTime } from '../src/ui/versionFormat';

// JST 8/24 15:50 と 8/25 09:12。整形は Asia/Tokyo 固定なので、機のTZに依らず同じ値になる。
const BUILD_ISO = '2026-08-24T06:50:00.000Z';
const DATA_NEWER_ISO = '2026-08-25T00:12:00.000Z';
const DATA_OLDER_ISO = '2026-08-23T00:12:00.000Z';
const BUILD_TEXT = '8/24 15:50';
const DATA_NEWER_TEXT = '8/25 09:12';
const DATA_OLDER_TEXT = '8/23 09:12';

afterEach(cleanup);

/** 詳細パネルを開き、dt→dd の対応表を取り出す。 */
function openPanel(props: { version: string; buildTime?: string; dataUpdatedAt?: string }) {
  const view = render(<MagiVersionChip {...props} />);
  const chip = view.container.querySelector('.magi-appshell-version-chip') as HTMLButtonElement;
  const label = chip.textContent ?? '';
  fireEvent.click(chip);
  const rows = Object.fromEntries([...view.container.querySelectorAll('.magi-appshell-version-panel dl > div')]
    .map((row) => [row.querySelector('dt')?.textContent ?? '', row.querySelector('dd')?.textContent ?? '']));
  return { label, rows };
}

describe('版チップ: データ台帳の更新時刻（v0.22.0）', () => {
  it('ビルド時刻だけならビルド時刻を出し、データの更新行は出さない', () => {
    const { label, rows } = openPanel({ version: '0.7.0', buildTime: BUILD_ISO });
    expect(label).toBe(`v0.7.0 ${BUILD_TEXT}`);
    expect(rows['ビルド時刻']).toBe(BUILD_TEXT);
    expect(rows['データの更新']).toBeUndefined();
  });

  it('データの更新だけならその時刻を出し、ビルド時刻は確認中のままにする', () => {
    const { label, rows } = openPanel({ version: '0.7.0', dataUpdatedAt: DATA_NEWER_ISO });
    expect(label).toBe(`v0.7.0 ${DATA_NEWER_TEXT}`);
    expect(rows['ビルド時刻']).toBe('確認中');
    expect(rows['データの更新']).toBe(DATA_NEWER_TEXT);
  });

  it('両方あってデータの更新が新しければ、ラベルはデータ側になり、その行に表示中の印が付く', () => {
    const { label, rows } = openPanel({ version: '0.7.0', buildTime: BUILD_ISO, dataUpdatedAt: DATA_NEWER_ISO });
    expect(label).toBe(`v0.7.0 ${DATA_NEWER_TEXT}`);
    expect(rows['ビルド時刻']).toBe(BUILD_TEXT);
    expect(rows['データの更新']).toBe(`${DATA_NEWER_TEXT}（ヘッダに表示中）`);
  });

  it('両方あってビルドが新しければ、ラベルはビルド側になり、その行に表示中の印が付く', () => {
    const { label, rows } = openPanel({ version: '0.7.0', buildTime: BUILD_ISO, dataUpdatedAt: DATA_OLDER_ISO });
    expect(label).toBe(`v0.7.0 ${BUILD_TEXT}`);
    expect(rows['ビルド時刻']).toBe(`${BUILD_TEXT}（ヘッダに表示中）`);
    expect(rows['データの更新']).toBe(DATA_OLDER_TEXT);
  });

  it('読めない日付が混ざっても落ちず、読める方だけを使う（両方読めなければ版だけ）', () => {
    const brokenBuild = openPanel({ version: '0.7.0', buildTime: 'not-a-date', dataUpdatedAt: DATA_NEWER_ISO });
    expect(brokenBuild.label).toBe(`v0.7.0 ${DATA_NEWER_TEXT}`);
    expect(brokenBuild.rows['ビルド時刻']).toBe('確認中');
    expect(brokenBuild.rows['データの更新']).toBe(DATA_NEWER_TEXT);

    const brokenData = openPanel({ version: '0.7.0', buildTime: BUILD_ISO, dataUpdatedAt: '2026-13-45T99:99:99Z' });
    expect(brokenData.label).toBe(`v0.7.0 ${BUILD_TEXT}`);
    expect(brokenData.rows['データの更新']).toBeUndefined();

    const bothBroken = openPanel({ version: '0.7.0', buildTime: 'x', dataUpdatedAt: 'y' });
    expect(bothBroken.label).toBe('v0.7.0');
    expect(bothBroken.rows['ビルド時刻']).toBe('確認中');
    expect(bothBroken.rows['データの更新']).toBeUndefined();
  });
});

describe('resolveReleaseTime（整形の単一ソース）', () => {
  it('新しい方のISOと、その出どころを返す', () => {
    expect(resolveReleaseTime(BUILD_ISO, DATA_NEWER_ISO)).toEqual({ iso: DATA_NEWER_ISO, source: 'data' });
    expect(resolveReleaseTime(BUILD_ISO, DATA_OLDER_ISO)).toEqual({ iso: BUILD_ISO, source: 'build' });
    expect(resolveReleaseTime(BUILD_ISO, '')).toEqual({ iso: BUILD_ISO, source: 'build' });
    expect(resolveReleaseTime('', DATA_NEWER_ISO)).toEqual({ iso: DATA_NEWER_ISO, source: 'data' });
    expect(resolveReleaseTime('', '')).toEqual({ iso: '', source: 'none' });
    expect(resolveReleaseTime('壊れた値', DATA_NEWER_ISO)).toEqual({ iso: DATA_NEWER_ISO, source: 'data' });
    // 同時刻はビルド側（コード反映の方が広い出来事）。
    expect(resolveReleaseTime(BUILD_ISO, BUILD_ISO)).toEqual({ iso: BUILD_ISO, source: 'build' });
  });

  it('formatReleaseLabel は第3引数を受けても既存の2引数呼び出しの意味を変えない', () => {
    expect(formatReleaseLabel('0.7.0', BUILD_ISO)).toBe(`v0.7.0 ${BUILD_TEXT}`);
    expect(formatReleaseLabel('0.7.0')).toBe('v0.7.0');
    expect(formatReleaseLabel('0.7.0', '', DATA_NEWER_ISO)).toBe(`v0.7.0 ${DATA_NEWER_TEXT}`);
  });
});
