/**
 * 節・見本枠の器（ショーケースの版面部品）。
 * ここは「並べるための器」であって、デザインシステムの部品ではない。
 */
import type { ReactNode } from 'react';

export interface SectionProps {
  id: string;
  /** 節番号（目次と対応）。 */
  index: string;
  title: string;
  /** この節が何を証明しているかの一言（監査リストと対になる）。 */
  note?: ReactNode;
  children: ReactNode;
}

export function Section({ id, index, title, note, children }: SectionProps) {
  return (
    <section className="ds-section" id={id}>
      <div className="ds-section-head">
        <h2 className="ds-section-title">
          <span>{index}</span>
          {title}
        </h2>
        {note ? <p className="ds-section-note">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export interface SpecimenProps {
  /** 部品名（実装のエクスポート名をそのまま出す）。 */
  name: string;
  /** variant / 状態などの但し書き。 */
  tag?: string;
  note?: ReactNode;
  children: ReactNode;
}

export function Specimen({ name, tag, note, children }: SpecimenProps) {
  return (
    <div className="ds-specimen">
      <div className="ds-specimen-head">
        <span className="ds-specimen-name">{name}</span>
        {tag ? <span className="ds-specimen-tag">{tag}</span> : null}
      </div>
      <div className="ds-specimen-body">{children}</div>
      {note ? <p className="ds-specimen-note">{note}</p> : null}
    </div>
  );
}
