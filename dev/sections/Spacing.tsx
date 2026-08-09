/**
 * ③スペーシング — `--magi-*` レイアウトトークンの実物一覧（視覚化バー付き）。
 *
 * 一覧は CSSOM から集めた実在トークンそのもの。バーの長さは実値の px をそのまま使う
 * （目盛りを作らない＝ここで新しいスケールを発明しない）。
 */
import { useMemo } from 'react';
import { Section } from '../lib/Section';
import { readAllTokens } from '../lib/tokens';

interface Props {
  revision: number;
}

/** 「12px」「18px 20px」等から最初の px 値を取り出す（バーの長さ用・表示値は原文のまま出す）。 */
function firstPx(value: string): number | null {
  const m = value.match(/(-?\d+(?:\.\d+)?)px/);
  return m ? Number(m[1]) : null;
}

export function SpacingSection({ revision }: Props) {
  const tokens = useMemo(() => readAllTokens(), [revision]);
  const magi = tokens.filter((t) => t.name.startsWith('--magi-'));
  const layers = magi.filter((t) => t.group === 'layer');
  const sizes = magi.filter((t) => t.group !== 'layer');
  const tap = tokens.find((t) => t.name === '--tap-min');

  return (
    <Section
      id="spacing"
      index="③"
      title="スペーシング・寸法"
      note={
        <>
          フロントページ5層標準の寸法体系（<code className="ds-mono">--magi-*</code>）の現物 {magi.length} 件。
          「語彙だけ定義して実体を配っていない」トークンは <code>npm run verify:tokens</code> が機械で捕まえる
          （<code className="ds-mono">scripts/verify-token-consumers.mjs</code> の例外リストに理由が書いてある）。
        </>
      }
    >
      <h3 className="ds-subhead">寸法トークン（{sizes.length}件）</h3>
      <table className="ds-table">
        <thead>
          <tr>
            <th className="ds-mono">token</th>
            <th className="ds-mono">値</th>
            <th>実寸（先頭の px 値をそのまま描く）</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((t) => {
            const px = firstPx(t.value);
            return (
              <tr key={t.name}>
                <td className="ds-mono">{t.name}</td>
                <td className="ds-mono">{t.value}</td>
                <td>
                  {px !== null ? (
                    <span className="ds-bar" style={{ display: 'block', inlineSize: `${px}px` }} />
                  ) : (
                    <span className="ds-swatch-value">（長さでない値）</span>
                  )}
                </td>
              </tr>
            );
          })}
          {tap ? (
            <tr>
              <td className="ds-mono">{tap.name}</td>
              <td className="ds-mono">{tap.value}</td>
              <td>
                <span className="ds-bar" style={{ display: 'block', inlineSize: tap.value }} />
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h3 className="ds-subhead">重なり順（z-index・{layers.length}件）</h3>
      <table className="ds-table">
        <thead>
          <tr>
            <th className="ds-mono">token</th>
            <th className="ds-mono">値</th>
            <th>約束</th>
          </tr>
        </thead>
        <tbody>
          {layers.map((t) => (
            <tr key={t.name}>
              <td className="ds-mono">{t.name}</td>
              <td className="ds-mono">{t.value}</td>
              <td>
                {t.name === '--magi-z-app-sticky-max'
                  ? 'アプリ側の sticky 帯・独自ポップアップはこの値未満に収める（CIガード (g) が機械検査）'
                  : 'Core の帯・ポップアップの層'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
