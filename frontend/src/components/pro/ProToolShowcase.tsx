interface Props {
  id: string;
  index: number;
  badge: string;
  title: string;
  inside: string;
  why: string;
  tone: "sage" | "forest" | "clay";
  layout: "wide" | "tall";
}

export default function ProToolShowcase({
  id,
  index,
  badge,
  title,
  inside,
  why,
  tone,
  layout,
}: Props) {
  return (
    <article
      id={id}
      className={`pro-tool-nature pro-tool-nature-${tone} pro-tool-nature-${layout}`}
    >
      <div className="pro-tool-nature-head">
        <span className="pro-tool-nature-index">{String(index).padStart(2, "0")}</span>
        <span className="pro-tool-nature-badge">{badge}</span>
      </div>
      <h3 className="pro-tool-nature-title">{title}</h3>
      <div className="pro-tool-nature-body">
        <p className="pro-tool-nature-inside">{inside}</p>
        <blockquote className="pro-tool-nature-why">{why}</blockquote>
      </div>
    </article>
  );
}
