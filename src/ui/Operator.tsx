/**
 * Operator — 操作者チップ＋選択モーダル（v0.7・全MAGI共通）
 * ─────────────────────────────────────────────────────────────────────
 * 何のための部品か:
 *   施設の端末は職員が共通アカウントで使うため、ログイン情報からは
 *   「いま操作しているのが誰か」が分からない。保存の前に本人が名乗り、
 *   その名前を記録へ残す——これが操作者。16番§3.5「すべての操作はアプリを
 *   通す。ログを残す」を成立させている部品である。
 *
 * なぜ core に置くか（2026-07-28 実測）:
 *   同じ `OperatorSelectModal.tsx` が **8アプリ**（adl / seat-chart / staff-master /
 *   floor-calendar / staff-tasks / survey / 2f-inventory / cushion）に手写しで存在した。
 *   `01_UI標準` の型v1.6では既に「必須型」と決まっているのに core 実装が無く、
 *   文言と見た目が枝分かれし始めていた。1か所に集約して枝分かれを止める。
 *
 * 型として守ること:
 *   1. **本人認証ではないと画面に明示する**（共通ログイン＋自己申告の限界を隠さない）
 *   2. select 要素を使わない（型違反。一覧から押して選ぶ）
 *   3. 未選択でも閲覧・印刷はできる。止めるのは保存・取消だけ
 *   4. チップは未選択が一目で分かる見た目にする（色だけに頼らず文字でも示す）
 */
import { useLayoutEffect, useRef } from 'react';
import { UserRound } from 'lucide-react';

import { DraggableModal } from './DraggableModal';
import { domFitTarget, fitOperatorLabel } from './operatorFit';

export type OperatorStaff = {
  id: string;
  /** 表示名。アプリ側で名簿の氏名を渡す。 */
  name: string;
};

export interface OperatorChipProps {
  /** 選択済みの操作者名。未選択なら null。 */
  operatorName: string | null;
  onClick: () => void;
  /** 未選択時のラベル。既定「未選択」。**従来表示（`fixedWidth={false}`）でのみ使う**。 */
  unsetLabel?: string;
  /**
   * 2026-08-27 社長裁定の表示形（2026-09-01 裁定で**既定ON**へ昇格）:
   *   未選択＝アイコン＋「操作者」（赤枠）／選択済み＝アイコン＋名前だけ（「操作者:」接頭辞なし）。
   *   チップ幅は固定し、収まらない名前は文字を縮小して全文表示する（省略記号にしない）。
   *
   *   **既定 `true`**（幅は CSS の既定に従う）。数値を渡すとその px で幅を固定する。
   *   `fixedWidth={false}` で従来表示（「操作者: 名前」／未選択は `unsetLabel`）へ戻せる（opt-out）。
   *   既定にできる理由は、各アプリが core の版をピンで固定しているため——文言が変わるのは
   *   各アプリが版を上げると決めた時点だけで、その卓が検査文字列も一緒に直せる。
   */
  fixedWidth?: number | boolean;
  className?: string;
}

/* 固定幅チップ内でラベルを収める算法は `operatorFit.ts`（DOM 無しで試験できるように切り出した）。
   2026-09-05: 下限10pxで止めていたため17字の名前が枠外へ出て切れていた——下限7px＋字間詰めで入れ切る。 */

export function OperatorChip({ operatorName, onClick, unsetLabel = '未選択', fixedWidth = true, className }: OperatorChipProps) {
  const isSet = Boolean(operatorName);
  // 既定ON。opt-out は false 明示だけ（undefined は既定値 true に解決済み）。
  const fixed = fixedWidth !== false;
  const labelRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    if (!fixed) return;
    const span = labelRef.current;
    if (!span) return;
    fitOperatorLabel(domFitTarget(span));
  }, [fixed, operatorName]);

  const label = fixed ? (operatorName ?? '操作者') : `操作者: ${operatorName ?? unsetLabel}`;
  return (
    <button
      className={`operator-chip ${isSet ? 'is-set' : 'is-unset'}${fixed ? ' is-fixed' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      // 幅の明示は数値を渡された時だけ（true/未指定は CSS の既定幅に任せる）。
      style={typeof fixedWidth === 'number' ? { width: `${fixedWidth}px` } : undefined}
      title="保存の記録に残る操作者です。クリックして本人の名前を選びます。閲覧・印刷だけなら選択不要です。"
      type="button"
    >
      <UserRound size={16} aria-hidden />
      <span className="operator-chip-label" ref={labelRef}>{label}</span>
    </button>
  );
}

export interface OperatorSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (staffId: string) => void;
  staff: OperatorStaff[];
  selectedOperatorId: string;
  /** 名簿が空のときの案内。アプリの事情（名簿の取り方）に合わせて差し替え可。 */
  emptyMessage?: string;
}

export function OperatorSelectModal({
  open,
  onClose,
  onSelect,
  staff,
  selectedOperatorId,
  emptyMessage = '在籍職員の名簿を確認できません。更新してから管理者へ確認してください。',
}: OperatorSelectModalProps) {
  if (!open) return null;

  return (
    <DraggableModal maxWidth="md" onClose={onClose} subtitle="保存の記録に残ります" title="操作者を選択">
      <div className="operator-select-body">
        {/* 本人認証ではない旨を必ず出す（型v1.6 / adl-app 実証）。
            共通ログイン＋自己申告の組み合わせは「本人確認」ではなく
            「担当外の操作を防ぐための自己申告」。UIでこの限界を隠さない。 */}
        <p className="operator-select-note operator-select-disclaimer" role="note">
          これは本人認証ではありません。共有端末で操作した本人が、自分の名前を選んでください。
        </p>

        {staff.length === 0 ? (
          <p className="operator-select-note">{emptyMessage}</p>
        ) : (
          <div aria-label="在籍職員の一覧" className="operator-select-grid" role="listbox">
            {staff.map((member) => (
              <button
                aria-selected={member.id === selectedOperatorId}
                className={`operator-select-item ${member.id === selectedOperatorId ? 'is-current' : ''}`}
                key={member.id}
                onClick={() => {
                  onSelect(member.id);
                  onClose();
                }}
                role="option"
                type="button"
              >
                <span className="operator-select-name">{member.name}</span>
              </button>
            ))}
          </div>
        )}

        <p className="operator-select-note">閲覧と印刷は未選択でも使えます。保存・取消では選択が必須です。</p>
      </div>
    </DraggableModal>
  );
}
