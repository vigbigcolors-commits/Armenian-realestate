import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function MasonryGrid({ children }: Props) {
  return <div className="masonry-grid">{children}</div>;
}
