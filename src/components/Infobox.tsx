import type { EntryType, Infobox as InfoboxData } from "@/lib/types";
import { INFOBOX_FIELDS, TYPE_LABELS } from "@/lib/templates";
import Icon from "./Icon";

export default function Infobox({
  type,
  name,
  data,
}: {
  type: EntryType;
  name: string;
  data: InfoboxData;
}) {
  const fields = INFOBOX_FIELDS[type];
  const rows = fields.filter((f) => (data[f.key] ?? "").trim().length > 0);

  return (
    <aside className="infobox" aria-label={`${TYPE_LABELS[type]} infobox`}>
      <div className="infobox-title">
        <span aria-hidden className="infobox-icon">
          <Icon name={type} />
        </span>
        <div>
          <div className="infobox-name">{name}</div>
          <div className="infobox-kind">{TYPE_LABELS[type]}</div>
        </div>
      </div>
      {rows.length > 0 ? (
        <dl className="infobox-grid">
          {rows.map((f) => (
            <div className="infobox-row" key={f.key}>
              <dt>{f.label}</dt>
              <dd>{data[f.key]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="infobox-empty">No structured details recorded yet.</p>
      )}
    </aside>
  );
}
