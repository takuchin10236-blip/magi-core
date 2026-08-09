/**
 * SgLumenLogo — 旧ロゴ「SG・窓と富士」（SVG）。**廃止裁定済み・新規に選ばない。**
 *
 * @deprecated 2026-08-09 社長裁定でロゴは SgBrandLogo（絵画調PNG・3モード連動）に一本化した。
 *   MagiAppShell の既定もそちらへ移してある。export を残しているのは、この部品を直接 import して
 *   いるアプリのビルドを壊さないため——**削除は次のメジャーの仕事**。新規の画面で使わない。
 *
 * 原本: magi-resident-spine origin/main src/components/SgLumenLogo.tsx をそのまま移植。
 *   文字崩れを避けるため画像生成でなく、同じ入力から同じ形になる SVG で描く。
 *   施設名の aria-label だけ props 化（既定値は原本の文字列）＝他施設でも再利用できるように。
 */
import { useId } from 'react';

export type SgLumenLogoProps = {
  className?: string;
  dark?: boolean;
  /** SVG の aria-label（施設名）。既定は第二湘南グリーン。 */
  label?: string;
};

const WAVE_ROW = 'a10,10 0 0 1 20,0 '.repeat(21).trim();

export function SgLumenLogo({ className, dark = false, label = 'SG 第二湘南グリーン（窓と富士）' }: SgLumenLogoProps) {
  const clipId = useId().replace(/:/g, '');
  const frameColor = dark ? '#87d4ad' : '#0f3d34';
  const glassColor = dark ? '#0f3d34' : '#d8efe3';
  const brandColor = dark ? '#87d4ad' : '#2e6f5d';
  const brandSubColor = dark ? '#87d4ad' : '#5a8277';
  const reflectionColor = dark ? '#87d4ad' : '#d8efe3';

  return (
    <svg
      aria-label={label}
      className={className}
      role="img"
      viewBox="0 0 460 220"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="14" y="14" width="432" height="192" rx="13" />
        </clipPath>
      </defs>

      <rect x="0" y="0" width="460" height="220" rx="24" fill={frameColor} />
      <rect x="14" y="14" width="432" height="192" rx="13" fill={glassColor} />

      <g clipPath={`url(#${clipId})`}>
        <path
          d="M16,160 C150,158 270,150 320,120 C342,104 350,76 356,58 L390,58 C398,84 416,140 430,152 C436,157 440,159 444,160 Z"
          fill="#6b8b84"
        />
        <path
          d="M373,58 L390,58 C398,84 416,140 430,152 C436,157 440,159 444,160 L373,160 Z"
          fill="#54766e"
        />
        <path
          d="M351,92 C354,78 355,68 356,58 L390,58 C391,68 392,78 395,92 L390,98 L385,89 L380,99 L375,89 L370,100 L365,89 L360,99 L356,89 Z"
          fill="#fbfdfc"
          stroke="#d7e8e9"
          strokeLinejoin="round"
          strokeWidth="0.8"
        />

        <g opacity="0.82">
          <rect x="300" y="110" width="148" height="13" rx="6.5" fill="#f7fbf8" />
          <rect x="232" y="120" width="190" height="13" rx="6.5" fill="#f7fbf8" />
          <rect x="150" y="130" width="255" height="13" rx="6.5" fill="#f7fbf8" />
        </g>

        <path
          d="M14,160 C50,153 90,153 130,160 C175,151 225,151 270,160 C320,152 375,152 446,160 Z"
          fill="#bfd8ca"
          opacity="0.4"
        />
        <path
          d="M14,160 C40,151 70,151 100,160 C135,149 175,149 214,160 C255,150 300,150 340,160 C378,151 415,151 446,160 Z"
          fill="#bfd8ca"
          opacity="0.7"
        />
        <path
          d="M14,160 C34,148 54,148 74,160 C96,146 120,146 142,160 C168,148 194,148 220,160 C250,145 282,145 312,160 C344,148 376,148 408,160 C424,152 436,153 446,160 Z"
          fill="#bfd8ca"
        />

        <rect x="14" y="160" width="432" height="46" fill="#315f7a" />
        <rect x="14" y="160" width="432" height="5" fill={reflectionColor} opacity="0.28" />
        <path d={`M18,175 ${WAVE_ROW}`} fill="none" stroke={reflectionColor} strokeLinecap="round" strokeWidth="1.5" opacity="0.85" />
        <path d={`M28,187 ${WAVE_ROW}`} fill="none" stroke={reflectionColor} strokeLinecap="round" strokeWidth="1.5" opacity="0.62" />
        <path d={`M18,199 ${WAVE_ROW}`} fill="none" stroke={reflectionColor} strokeLinecap="round" strokeWidth="1.5" opacity="0.4" />
      </g>

      <rect x="14" y="14" width="432" height="192" rx="13" fill="none" stroke="#2e6f5d" strokeWidth="1" opacity="0.55" />
      <text x="44" y="96" fontFamily="Jost, sans-serif" fontSize="52" fontWeight="600" letterSpacing="1" fill={brandColor}>SG</text>
      <line x1="46" y1="112" x2="138" y2="112" stroke={brandColor} strokeWidth="1.6" />
      <text x="46" y="128" fontFamily="Jost, sans-serif" fontSize="11" fontWeight="400" letterSpacing="4" fill={brandSubColor}>SHONAN GREEN</text>
    </svg>
  );
}
