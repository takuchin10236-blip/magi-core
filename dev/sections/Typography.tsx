/**
 * ②タイポ階層 — core の実クラスに文字を流し込み、**描画された値を計測して**並べる。
 *
 * 「design-system.css には 15px と書いてある」ではなく「いまブラウザが 15px で描いた」を出す。
 * 階層に並べたクラス名はすべて design-system.css に実在するもの（新設していない）。
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Section } from '../lib/Section';
import { measureText, readToken } from '../lib/tokens';

/** 実クラス × 見本文（大きい順に並べるが、順序の根拠は下の実測値そのもの）。 */
const SPECIMENS: Array<{ className: string; role: string; sample: string }> = [
  { className: 'magi-appshell-title', role: 'アプリ名（画面の最大見出し）', sample: '排泄記録' },
  { className: 'magi-appshell-kicker', role: '施設名・フロア名', sample: '第二湘南グリーン 2F' },
  { className: 'magi-input', role: '入力欄の文字（iOS 自動ズーム回避の下限）', sample: '入力した文字' },
  { className: 'magi-choice-item', role: 'チェック・ラジオの選択肢', sample: '選択肢の文字' },
  { className: 'magi-form-label', role: '項目名（ラベル）', sample: '利用者名' },
  { className: 'magi-button', role: 'ボタンの文字', sample: '保存する' },
  { className: 'magi-notification-title', role: '告知帯の見出し', sample: '保存しました' },
  { className: 'magi-empty-state-label', role: '0件表示の主文', sample: '条件に合う記録がありません' },
  { className: 'magi-loading-label', role: '待ち状態の主文', sample: '読み込み中です' },
  { className: 'magi-form-support', role: '補足説明', sample: '半角数字で入力してください' },
  { className: 'magi-form-error', role: 'エラー文', sample: '入力されていません' },
  { className: 'magi-appshell-nav-tab', role: 'メニューのタブ', sample: '一覧' },
  { className: 'magi-status-badge', role: '状態バッジ', sample: 'このPC内' },
  { className: 'magi-loading-hint', role: '待ちの予告文', sample: '件数が多いと時間がかかります' },
  { className: 'magi-name-room-badge', role: '居室バッジ', sample: '201' },
  { className: 'magi-requirement-badge', role: '必須・任意バッジ', sample: '必須' },
];

const FONT_TOKENS = ['--ui-font', '--display-font', '--mono-font'];

interface Props {
  revision: number;
}

export function TypographySection({ revision }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState<Record<string, ReturnType<typeof measureText>>>({});

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const next: Record<string, ReturnType<typeof measureText>> = {};
    for (const el of Array.from(host.querySelectorAll<HTMLElement>('[data-ds-type]'))) {
      const key = el.dataset.dsType;
      if (key) next[key] = measureText(el);
    }
    setMeasured(next);
  }, [revision]);

  const fonts = useMemo(
    () => FONT_TOKENS.map((name) => ({ name, value: readToken(name) })),
    [revision],
  );

  return (
    <Section
      id="typography"
      index="②"
      title="タイポ階層"
      note={
        <>
          左に core の実クラスで描いた文字、右にそれを <code>getComputedStyle</code> で計測した値を出す。
          <strong>core は @font-face を同梱していない</strong>（<code className="ds-mono">design-system.css</code> 内 0件・物理確認）ため、
          実際に使われる書体は「トークンの候補のうち端末にある最初のもの」になる。書体の読込は採用アプリ側の責務。
        </>
      }
    >
      <h3 className="ds-subhead">書体トークン（適用中の値）</h3>
      <table className="ds-table">
        <thead>
          <tr>
            <th className="ds-mono">token</th>
            <th>値（宣言順の候補列）</th>
          </tr>
        </thead>
        <tbody>
          {fonts.map((f) => (
            <tr key={f.name}>
              <td className="ds-mono">{f.name}</td>
              <td>{f.value || '(未定義)'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="ds-subhead">文字階層（実クラス・実測）</h3>
      <div ref={hostRef}>
        <table className="ds-table">
          <thead>
            <tr>
              <th>見本（実クラスで描画）</th>
              <th className="ds-mono">class</th>
              <th>役割</th>
              <th className="ds-mono">実測 size / weight / line-height</th>
            </tr>
          </thead>
          <tbody>
            {SPECIMENS.map((s) => {
              const m = measured[s.className];
              return (
                <tr key={s.className}>
                  <td>
                    <span className={s.className} data-ds-type={s.className}>
                      {s.sample}
                    </span>
                  </td>
                  <td className="ds-mono">.{s.className}</td>
                  <td>{s.role}</td>
                  <td className="ds-mono">{m ? `${m.fontSize} / ${m.fontWeight} / ${m.lineHeight}` : '計測中…'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="ds-note">
        注: <code>.magi-status-badge</code> 等は本来「面と枠を持つ部品」なので、ここでの見た目は文字寸法の確認用。
        部品としての実物は⑤の部品一覧にある。
      </p>
    </Section>
  );
}
