/**
 * ④モーション — duration / ease トークンの実物と、@keyframes の実物デモ。
 *
 * duration も keyframes も CSSOM から集めた実在物。押すと実際にその時間・その keyframes で動く
 * （動画やGIFではなく、いま読み込んでいる CSS が動かしている）。
 */
import { useMemo, useState } from 'react';
import { Button } from '@magi/core/ui';
import { Section } from '../lib/Section';
import { collectKeyframeNames, readAllTokens } from '../lib/tokens';

interface Props {
  revision: number;
}

/** keyframes が core のどこで実際に使われているか（物理 grep の結果を注記として添える）。 */
const KEYFRAME_USAGE: Record<string, string> = {
  'side-peek-breathe': '.side-peek-toggle.closed（2.8s ease-in-out infinite）— 旧サイドパネル型の呼吸',
  'toast-slide-in': 'Toast.tsx のインライン style（0.2s ease-out）— トーストの入場',
  'btn-spinner-rotate': '.btn-spinner（0.7s linear infinite）— ConfirmModal のボタン内スピナー',
  'magi-spin': '.magi-loading-spinner（700ms linear infinite）— LoadingState の待ち表示',
  'magi-pulse': 'prefers-reduced-motion 時の .magi-loading-spinner（1.2s ease-in-out infinite）— 回転の代わりに明滅',
};

export function MotionSection({ revision }: Props) {
  const tokens = useMemo(() => readAllTokens(), [revision]);
  const motion = tokens.filter((t) => t.group === 'motion');
  const durations = motion.filter((t) => !t.name.startsWith('--ease'));
  const eases = motion.filter((t) => t.name.startsWith('--ease'));
  const keyframes = useMemo(() => collectKeyframeNames(), [revision]);

  const [movedToken, setMovedToken] = useState<string | null>(null);
  const [playing, setPlaying] = useState<{ name: string; nonce: number } | null>(null);

  return (
    <Section
      id="motion"
      index="④"
      title="モーション"
      note={
        <>
          時間トークン {durations.length} 件・イージング {eases.length} 件・keyframes {keyframes.length} 件。
          「再生」を押すと、その場でトークンの時間・実在の keyframes で動く。
          <code>prefers-reduced-motion: reduce</code> の端末では core 側が duration を 1ms へ落とすので、
          その環境ではボタンを押しても<strong>一瞬で終わる（＝正しい挙動）</strong>。
        </>
      }
    >
      <h3 className="ds-subhead">時間トークン（押すと、その時間で動く）</h3>
      <table className="ds-table">
        <thead>
          <tr>
            <th className="ds-mono">token</th>
            <th className="ds-mono">値</th>
            <th>実演</th>
          </tr>
        </thead>
        <tbody>
          {durations.map((t) => (
            <tr key={t.name}>
              <td className="ds-mono">{t.name}</td>
              <td className="ds-mono">{t.value}</td>
              <td>
                <div className="ds-motion-track">
                  <Button
                    onClick={() => setMovedToken((prev) => (prev === t.name ? null : t.name))}
                    variant="secondary"
                  >
                    {movedToken === t.name ? '戻す' : '再生'}
                  </Button>
                  <span
                    className={`ds-motion-box${movedToken === t.name ? ' is-moved' : ''}`}
                    style={{
                      transition: `transform ${t.value} var(--ease-standard)`,
                    }}
                  >
                    {t.value}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="ds-subhead">イージング</h3>
      <table className="ds-table">
        <thead>
          <tr>
            <th className="ds-mono">token</th>
            <th className="ds-mono">値</th>
          </tr>
        </thead>
        <tbody>
          {eases.map((t) => (
            <tr key={t.name}>
              <td className="ds-mono">{t.name}</td>
              <td className="ds-mono">{t.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="ds-subhead">@keyframes（{keyframes.length}種・実在物）</h3>
      <div className="ds-grid-wide">
        {keyframes.map((name) => (
          <div className="ds-specimen" key={name}>
            <div className="ds-specimen-head">
              <span className="ds-specimen-name">@keyframes {name}</span>
              <Button onClick={() => setPlaying({ name, nonce: Date.now() })} variant="secondary">
                再生
              </Button>
            </div>
            <div className="ds-keyframe-stage">
              <span
                className="ds-motion-box"
                key={playing?.name === name ? playing.nonce : 'idle'}
                style={
                  playing?.name === name
                    ? { animation: `${name} 1.2s var(--ease-standard) 2` }
                    : undefined
                }
              >
                {name.includes('spin') || name.includes('rotate') ? '↻' : '見本'}
              </span>
            </div>
            <p className="ds-specimen-note">
              {KEYFRAME_USAGE[name] ?? 'core 内の使用箇所は未注記（新設されたら注記を足す）'}
              <br />
              ※ 上のステージは確認用に 1.2s×2回で再生している（本来の時間は左記の使用箇所の値）。
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
