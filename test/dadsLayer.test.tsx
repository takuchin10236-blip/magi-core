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
import { EmptyState } from '../src/ui/EmptyState';
import { OperatorChip, OperatorSelectModal } from '../src/ui/Operator';
import { NameWithRoom, compactPersonName } from '../src/ui/NameWithRoom';
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
      // run() は失敗を握りつぶさず投げ直す（呼び手が知るべきだから）。`void run(...)` だけだと
      // 未処理の rejection になり、vitest は試験全体を赤にする（v0.13.7 で実際に赤だった）。
      // 実アプリと同じく、呼び手側で受けてから捨てる形にする＝この試験が見たいのは
      // 「失敗しても押せないまま固まらない」ことなので、握り潰す先はここで良い。
      <Button busy={busy} onClick={() => void run(onRun).catch(() => {})}>
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

describe('EmptyState（0件表示）', () => {
  it('何が無いのかを言い切り、次の手を書ける', () => {
    render(<EmptyState hint="フロアと検索条件を見直してください" label="条件に合うクッションがありません" />);
    expect(screen.getByText('条件に合うクッションがありません')).toBeDefined();
    expect(screen.getByText('フロアと検索条件を見直してください')).toBeDefined();
  });
});

describe('NameWithRoom（氏名＋居室）', () => {
  it('名簿由来の全角スペースを詰めて表示する', () => {
    expect(compactPersonName('山田　太郎')).toBe('山田 太郎');
    expect(compactPersonName('  佐藤   花子 ')).toBe('佐藤 花子');
  });

  it('氏名と居室を別要素に分ける（括弧で連結しない）', () => {
    const { container } = render(<NameWithRoom name="山田　太郎" room="204-4" />);
    expect(container.querySelector('.magi-name-room-name')?.textContent).toBe('山田 太郎');
    expect(container.querySelector('.magi-name-room-badge')?.textContent).toBe('204-4');
  });

  it('居室が無ければバッジを出さない', () => {
    const { container } = render(<NameWithRoom name="山田 太郎" />);
    expect(container.querySelector('.magi-name-room-badge')).toBeNull();
  });
});

describe('Operator（型v1.6・8アプリ共通の必須型）', () => {
  const staff = [
    { id: 's1', name: '山田 太郎' },
    { id: 's2', name: '佐藤 花子' },
  ];

  // 2026-09-01 裁定で新様式（fixedWidth）が既定ONへ昇格。
  //   既定＝未選択「操作者」／選択済みは名前だけ。従来表示は fixedWidth={false} で戻せる。
  it('未選択のときは文字（名前が無い＝「操作者」）と is-unset で示す（色だけに頼らない）', () => {
    const { container } = render(<OperatorChip onClick={() => {}} operatorName={null} />);
    expect(screen.getByRole('button').textContent).toContain('操作者');
    expect(container.querySelector('.operator-chip.is-unset.is-fixed')).toBeTruthy();
  });

  it('選択済みのときは名前を出す（既定＝「操作者:」の接頭辞は付けない）', () => {
    render(<OperatorChip onClick={() => {}} operatorName="山田 太郎" />);
    const chip = screen.getByRole('button');
    expect(chip.textContent).toContain('山田 太郎');
    expect(chip.textContent).not.toContain('操作者:');
  });

  it('opt-out: fixedWidth={false} なら従来表示（未選択＝「操作者: 未選択」）へ戻る', () => {
    const { container } = render(<OperatorChip fixedWidth={false} onClick={() => {}} operatorName={null} />);
    expect(screen.getByRole('button').textContent).toContain('操作者: 未選択');
    expect(container.querySelector('.is-fixed')).toBeNull();
  });

  it('opt-out: fixedWidth={false} + 選択済みなら「操作者: 名前」', () => {
    render(<OperatorChip fixedWidth={false} onClick={() => {}} operatorName="山田 太郎" />);
    expect(screen.getByRole('button').textContent).toContain('操作者: 山田 太郎');
  });

  it('幅の明示は数値を渡した時だけ（既定ONでも style.width を書かない）', () => {
    const fixedPx = render(<OperatorChip fixedWidth={180} onClick={() => {}} operatorName="山田 太郎" />);
    expect((fixedPx.container.querySelector('.operator-chip') as HTMLElement).style.width).toBe('180px');
    // 既定（true）で `${undefined}px` のような壊れた幅を書かないこと。
    const byDefault = render(<OperatorChip onClick={() => {}} operatorName="佐藤 花子" />);
    expect((byDefault.container.querySelector('.operator-chip') as HTMLElement).style.width).toBe('');
  });

  // v0.23.0 で採用済みのアプリ（連絡ノート）は `fixedWidth={true}` を渡し続ける。
  //   型を `number | true` → `number | boolean` へ広げた後も、その呼び方が既定と同じ結果になること。
  it('旧API fixedWidth={true} は既定（無指定）と同一の見た目になる', () => {
    const explicit = render(<OperatorChip fixedWidth={true} onClick={() => {}} operatorName="山田 太郎" />);
    const explicitChip = explicit.container.querySelector('.operator-chip') as HTMLElement;
    const implicit = render(<OperatorChip onClick={() => {}} operatorName="山田 太郎" />);
    const implicitChip = implicit.container.querySelector('.operator-chip') as HTMLElement;
    expect(explicitChip.className).toBe(implicitChip.className);
    expect(explicitChip.textContent).toBe(implicitChip.textContent);
    expect(explicitChip.style.width).toBe(implicitChip.style.width);
    expect(explicitChip.className).toContain('is-fixed');
  });

  it('本人認証ではないことを必ず画面に出す（限界を隠さない）', () => {
    render(
      <OperatorSelectModal onClose={() => {}} onSelect={() => {}} open selectedOperatorId="" staff={staff} />,
    );
    expect(screen.getByRole('note').textContent).toContain('本人認証ではありません');
  });

  it('select要素を使わず、一覧から押して選ぶ（型v1.6）', () => {
    const { container } = render(
      <OperatorSelectModal onClose={() => {}} onSelect={() => {}} open selectedOperatorId="" staff={staff} />,
    );
    expect(container.querySelector('select')).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('選ぶとIDを返して閉じる', () => {
    const picked: string[] = [];
    let closed = false;
    render(
      <OperatorSelectModal
        onClose={() => {
          closed = true;
        }}
        onSelect={(id) => picked.push(id)}
        open
        selectedOperatorId=""
        staff={staff}
      />,
    );
    fireEvent.click(screen.getByText('佐藤 花子'));
    expect(picked).toEqual(['s2']);
    expect(closed).toBe(true);
  });

  it('名簿が空でも画面を壊さず、次の手を案内する', () => {
    render(<OperatorSelectModal onClose={() => {}} onSelect={() => {}} open selectedOperatorId="" staff={[]} />);
    expect(screen.getByText(/名簿を確認できません/)).toBeDefined();
  });
});
