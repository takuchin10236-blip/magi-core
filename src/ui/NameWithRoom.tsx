/**
 * NameWithRoom — 氏名と居室を並べて見せる（v0.6・全MAGI共通）
 * ─────────────────────────────────────────────────────────────────────
 * 2026-07-28 社長指摘: 「氏名（居室）」を1つの文字列で出すと、括弧しか区切りが無く
 *   氏名と番号が同じ強さでぶつかって読みにくい（＝ガチャガチャして見える）。
 *
 * 設計:
 *   - 氏名を主、居室を淡いバッジで従にする。1行のままで行の高さを増やさない
 *   - 居室は等幅数字にして桁違い（204-4 / 209）でも縦に揃える
 *   - 名簿由来の全角スペースを半角へ詰める（「山田　太郎」の間延びを解消）
 *
 * 介護アプリ共通の表示なので core に置く（利用者マスタ・経過観察等へも流用可）。
 */
import type { ReactNode } from 'react';

/** 名簿の氏名に混ざる全角スペース・連続空白を、表示用に1つの半角スペースへ詰める。 */
export function compactPersonName(name: string): string {
  return name.replace(/[　\s]+/g, ' ').trim();
}

export interface NameWithRoomProps {
  name: string;
  /** 居室番号。空なら氏名だけを出す。 */
  room?: string;
  /** 居室バッジの前に付ける短い語（既定は付けない）。 */
  roomPrefix?: string;
  /** 警告時などにアプリ側で色を足すためのクラス。 */
  className?: string;
  /** 氏名の後ろに差し込む補足（注意アイコン等）。 */
  suffix?: ReactNode;
}

export function NameWithRoom({ name, room, roomPrefix, className, suffix }: NameWithRoomProps) {
  return (
    <span className={`magi-name-room${className ? ` ${className}` : ''}`}>
      <span className="magi-name-room-name">
        {compactPersonName(name)}
        {suffix}
      </span>
      {room ? (
        <span className="magi-name-room-badge" title={`居室 ${room}`}>
          {roomPrefix ? `${roomPrefix} ` : ''}
          {room}
        </span>
      ) : null}
    </span>
  );
}
