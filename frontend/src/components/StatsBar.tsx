import { useI18n } from "../i18n";
import type { PlatformStats } from "../types";

interface Props {
  stats: PlatformStats | null;
}

export default function StatsBar({ stats }: Props) {
  const { t } = useI18n();
  if (!stats) return null;

  const items = [
    { value: `${stats.active_properties}+`, label: t("statObjects") },
    { value: `${stats.duplicates_removed ?? 0}`, label: t("statDuplicates") },
    { value: `${stats.verified_owners}`, label: t("statOwners") },
    { value: `${stats.total_listings}+`, label: t("statProcessed") },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-10 px-6 md:gap-16">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-2xl font-extrabold text-slate-900 md:text-3xl">{item.value}</div>
          <div className="mt-1 text-xs font-medium text-slate-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
