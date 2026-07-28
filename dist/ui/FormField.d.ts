/**
 * FormField — ラベル・必須・補足・エラーを1つの器にまとめる原子部品（v0.6）
 * ─────────────────────────────────────────────────────────────────────
 * なぜ器を作るか:
 *   デジタル庁DS のフォーム作法（Label / RequirementBadge / SupportText / ErrorText）は
 *   「見た目」ではなく **id と aria の配線** に本体がある。各アプリが手で書くと必ず
 *   aria-describedby の付け忘れ・エラーの読み上げ漏れが起きる。器で機械的に配線する。
 *
 * 自動でやること（アプリが書き忘れられない）:
 *   - label と入力欄を htmlFor / id で結ぶ
 *   - 補足文とエラー文を aria-describedby へ自動連結
 *   - エラー時に aria-invalid を立て、エラー文を role="alert" で読み上げさせる
 *   - 必須を「※」等の記号でなく RequirementBadge の文字で示す（色・記号だけで伝えない）
 */
import { type ReactNode } from 'react';
/** 入力欄へ配る配線情報。children 関数が受け取ってそのまま展開する。 */
export interface FormFieldControlProps {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
    'aria-required': boolean | undefined;
}
export interface FormFieldProps {
    /** 項目名。必ず入れる（プレースホルダで代用しない＝DADS/WCAG作法）。 */
    label: ReactNode;
    /** 必須項目か。true でバッジを出し aria-required を立てる。 */
    required?: boolean;
    /** 入力の助け（書式・例・注意）。エラーではない常時表示の説明。 */
    supportText?: ReactNode;
    /** エラー文。空文字・undefined なら正常状態。 */
    errorText?: ReactNode;
    /** 入力欄本体。配線済みの props を受け取って展開する。 */
    children: (control: FormFieldControlProps) => ReactNode;
    className?: string;
}
export declare function RequirementBadge({ required }: {
    required: boolean;
}): import("react").JSX.Element;
export declare function FormField({ label, required, supportText, errorText, children, className, }: FormFieldProps): import("react").JSX.Element;
//# sourceMappingURL=FormField.d.ts.map