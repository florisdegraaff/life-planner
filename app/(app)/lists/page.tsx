import type { Metadata } from "next";
import { TripPlanner } from "@/components/lists/trip-planner";
import { Icon, PageHeader } from "@/components/ui";
import { icons, listTemplates, tripDefaults } from "@/lib/data";

export const metadata: Metadata = { title: "Lists" };

export default function ListsPage() {
  return (
    <>
      <PageHeader eyebrow="Fill in a form, get a list" title="Lists">
        <div className="flex items-center gap-2.5 rounded-xl border border-accent-border bg-accent-soft px-3.5 py-2.5 text-sm">
          <Icon d={icons.calendar} size={18} className="text-accent" />
          <span>
            Prefilled from calendar: <strong className="font-semibold">{tripDefaults.prefill}</strong>
          </span>
        </div>
      </PageHeader>

      <TripPlanner templates={listTemplates} />
    </>
  );
}
