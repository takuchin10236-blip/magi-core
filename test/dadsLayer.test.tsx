/**
 * dadsLayer.test.tsx — v0.6 デジタル庁DS整合レイヤの「約束」を固定する試験。
 *
 * ここで守っているのは見た目ではなく作法:
 *   ラベルと入力の結線 / エラーの読み上げ / 必須の文字表示 /
 *   待ち状態の文言 / 連打の物理防止 / 種別の文字伝達。
 * これらが壊れたら失敗する＝次に触る人が気づける。
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '../src/ui/Button';
import { RadioGroup } from '../src/ui/choice';
import { TextField } from '../src/ui/fields';
import { LoadingState } from '../src/ui/LoadingState';
import { NotificationBanner } from '../src/ui/NotificationBanner';
import { useBusyGuard } from '../src/ui/useBusyGuard';

describe('FormField 配線（DADSフォーム作法）', () => {
  it('ラベルをクリックすると入力欄にフォーカスが移る（htmlFor結線）', () => {
    render(<TextField label="番号札" onChange={() => {}} value="" />);
    const input = screen.getByLabelText(/番号札/);
    expect(input).toBeDefined();
    expect(input.tagName).toBe('INPUT');
  });

  it('必須は記号でなく「必須」の文字で示し、aria-required を立てる', () => {
    render(<TextField label="番号札" onChange={() => {}} required value="" />);
    expect(screen.getByText('必須')).toBeDefined();
    expect(screen.getByLabelText(/番号札/).getAttribute('aria-required')).toBe('true');
  });

  it('任意項目は「任意」と明示する（必須かどうかを推測させない）', () => {
    render(<TextField label="所在メモ" onChange={() => {}} value="" />);
    expect(screen.getByText('任意')).toBeDefined();
  });

  it('補足文が aria-describedby で入力欄に結ばれる', () => {
    render(<TextField label="番号札" onChange={() => {}} supportText="例: C-024" value="" />);
    const input = screen.getByLabelText(/番号札/);
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe('例: C-024');
  });

  it('エラーは role="alert" で読み上げられ、aria-invalid が立ち、describedby に載る', () => {
    render(<TextField errorText="同じ番号札があります" label="番号札" onChange={() => {}} value="" />);
    const input = screen.getByLabelText(/番号札/);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('同じ番号札があります');
    expect(input.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('エラーが無いときは aria-invalid を立てない', () => {
    render(<TextField label="番号札" onChange={() => {}} value="" />);
    expect(screen.getByLabelText(/番号札/).getAttribute('aria-invalid')).toBeNull();
  });
});

describe('RadioGroup（排他選択）', () => {
  const options = [
    { value: '2F', label: '2F' },
    { value: '3F', label: '3F' },
  ];

  it('fieldset/legend で何についての選択かを伝える', () => {
    render(<RadioGroup legend="フロア" onChange={() => {}} options={options} value="2F" />);
    expect(screen.getByRole('group', { name: /フロア/ })).toBeDefined();
  });

  it('選択でコールバックが選択肢の値を返す', () => {
    const seen: string[] = [];
    render(<RadioGroup legend="フロア" onChange={(v) => seen.push(v)} options={options} value="2F" />);
    fireEvent.click(screen.getByLabelText('3F'));
    expect(seen).toEqual(['3F']);
  });

  it('エラーは group に1回だけ出す', () => {
    render(
      <RadioGroup errorText="フロアを選んでください" legend="フロア" onChange={() => {}} options={options} value="" />,
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
});

describe('LoadingState（待ち状態の文言強制・社長指示2026-07-28）', () => {
  it('状態を文字で伝え、読み上げにも届く', () => {
    render(<LoadingState label="読み込み中です。お待ちください" />);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('読み込み中です。お待ちください');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('時間がかかる処理では予告も出せる', () => {
    render(<LoadingState label="保存しています…" slowHint="件数が多いと時間がかかることがあります" />);
    expect(screen.getByRole('status').textContent).toContain('時間がかかることがあります');
  });
});

describe('useBusyGuard（連打・二重送信の物理防止）', () => {
  function Harness({ onRun }: { onRun: () => Promise<unknown> }) {
    const { busy, run } = useBusyGuard();
    return (
      <Button busy={busy} onClick={() => void run(onRun)}>
        保存
      </Button>
    );
  }

  it('処理中の連打は2回目以降が発火しない', async () => {
    let calls = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    render(
      <Harness
        onRun={async () => {
          calls += 1;
          await gate;
        }}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(calls).toBe(1);
    await act(async () => {
      release();
      await gate;
    });
    expect(calls).toBe(1);
  });

  it('処理中はボタンが押せなくなり、状態を文字で示す', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    render(<Harness onRun={() => gate} />);

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.textContent).toContain('処理中');

    await act(async () => {
      release();
      await gate;
    });
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('処理が失敗しても押せないまま固まらない', async () => {
    render(
      <Harness
        onRun={async () => {
          throw new Error('保存に失敗');
        }}
      />,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(button);
    });
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('NotificationBanner（色だけで伝えない）', () => {
  it('種別を文字ラベルでも示す', () => {
    render(<NotificationBanner title="名簿を確認できません" tone="error" />);
    expect(screen.getByText('エラー')).toBeDefined();
  });

  it('error / warning は即時読み上げ（alert）', () => {
    render(<NotificationBanner title="保存できません" tone="error" />);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('info / success は穏やかな読み上げ（status）', () => {
    render(<NotificationBanner title="保存しました" tone="success" />);
    expect(screen.getByRole('status')).toBeDefined();
  });
});
