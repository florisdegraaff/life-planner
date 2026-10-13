"use client";

import { useState } from "react";
import { button, Card, CardTitle, Checkbox, cx, OptionButton, SectionLabel } from "@/components/ui";
import { packingCategories, tripActivities, tripDefaults, tripStay, tripWeather } from "@/lib/data";

type PackingItem = { cat: string; name: string; qty: number; rule: string };
type Trip = { days: number; activities: Record<string, boolean>; weather: string; stay: string };

// Placeholder rule set for the Trip template until rules are user-editable.
function packingList({ days: d, activities: acts, weather, stay }: Trip): PackingItem[] {
  const list: PackingItem[] = [];
  const add = (cat: string, name: string, qty: number, rule: string) => list.push({ cat, name, qty, rule });

  add("Clothing", "Underwear", d + 1, "days + 1");
  add("Clothing", "T-shirts", d, "days");
  add("Toiletries", "Toiletry bag", 1, "always");
  add("Electronics", "Phone charger", 1, "always");
  if (acts.Hiking) {
    add("Clothing", "Hiking socks", d + 1, "hiking · days + 1");
    add("Gear", "Hiking shoes", 1, "hiking");
    add("Gear", "Water bottle", 2, "hiking");
    add("Gear", "Daypack", 1, "hiking");
    add("Toiletries", "Blister plasters", 1, "hiking");
  }
  if (acts.Swimming) {
    add("Clothing", "Swimwear", 1, "swimming");
    if (stay !== "Hotel") add("Gear", "Beach towel", 1, "swimming · not hotel");
  }
  if (acts.City) add("Clothing", "Sneakers", 1, "city");
  if (acts.Work) add("Electronics", "Laptop + charger", 1, "work");
  if (weather === "Cold") {
    add("Clothing", "Warm jacket", 1, "cold");
    add("Clothing", "Thermal layer", Math.ceil(d / 2), "cold · days ÷ 2");
    add("Clothing", "Beanie", 1, "cold");
  }
  if (weather === "Rainy") {
    add("Clothing", "Rain jacket", 1, "rainy");
    if (acts.Hiking) add("Clothing", "Rain trousers", 1, "rainy + hiking");
  }
  if (weather === "Hot") {
    add("Toiletries", "Sunscreen", 1, "hot");
    add("Gear", "Sunglasses", 1, "hot");
  }
  if (stay === "Cabin") {
    add("Sleeping", "Bed linen set", 1, "cabin");
    add("Gear", "Breakfast groceries", 1, "cabin");
  }
  if (stay === "Tent") {
    add("Sleeping", "Sleeping bag", 1, "tent");
    add("Sleeping", "Sleeping mat", 1, "tent");
    add("Gear", "Head torch", 1, "tent");
  }
  return list;
}

const fieldLabel = "text-[13px] font-semibold";

export function TripPlanner({ templates }: { templates: { name: string; rules: number; active?: boolean }[] }) {
  const [trip, setTrip] = useState<Trip>({
    days: tripDefaults.days,
    activities: tripDefaults.activities,
    weather: tripDefaults.weather,
    stay: tripDefaults.stay,
  });
  const [packed, setPacked] = useState<Record<string, boolean>>({});

  const list = packingList(trip);
  const groups = packingCategories
    .map((cat) => ({ cat, items: list.filter((x) => x.cat === cat) }))
    .filter((g) => g.items.length);
  const packedCount = list.filter((x) => packed[x.name]).length;
  const setDays = (days: number) => setTrip((t) => ({ ...t, days: Math.min(30, Math.max(1, days)) }));

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section aria-label="Templates" className="flex flex-[1_1_200px] flex-col gap-1.5">
        <SectionLabel className="px-1 pb-1.5">Templates</SectionLabel>
        {templates.map((t) => (
          <a
            key={t.name}
            href="#template"
            aria-current={t.active ? "true" : undefined}
            className={cx(
              "flex min-h-11 items-center justify-between rounded-[10px] px-3.5 text-sm text-ink no-underline hover:text-ink",
              t.active ? "border-[1.5px] border-primary bg-surface font-semibold" : "border border-transparent hover:bg-surface",
            )}
          >
            <span>{t.name}</span>
            <span className="text-xs font-normal text-muted">{t.rules} rules</span>
          </a>
        ))}
        <button
          type="button"
          className="mt-2 min-h-11 rounded-[10px] border border-dashed border-locked-line bg-transparent text-sm text-ink-2"
        >
          + New template
        </button>
      </section>

      <Card aria-label="Trip form" className="flex min-w-0 flex-[2_1_340px] flex-col gap-[22px]">
        <div className="flex items-center justify-between">
          <CardTitle>Trip</CardTitle>
          <a href="#edit-rules" className="text-[13px] font-medium no-underline">
            Edit rules (14)
          </a>
        </div>

        <label className={cx(fieldLabel, "flex flex-col gap-1.5")}>
          Destination
          <input
            type="text"
            defaultValue={tripDefaults.destination}
            className="h-11 rounded-[10px] border border-line-strong bg-surface px-3 text-[15px] font-normal text-ink"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <div className={fieldLabel}>Duration</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-[10px] border border-line-strong">
              <button type="button" aria-label="One day less" onClick={() => setDays(trip.days - 1)} className="size-11 text-lg">
                −
              </button>
              <span className="w-10 text-center font-mono text-base">{trip.days}</span>
              <button type="button" aria-label="One day more" onClick={() => setDays(trip.days + 1)} className="size-11 text-lg">
                +
              </button>
            </div>
            <span className="text-sm text-muted">days</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className={fieldLabel}>
            Activities <span className="font-normal text-muted">· pick any</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tripActivities.map((a) => {
              const on = !!trip.activities[a];
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTrip((t) => ({ ...t, activities: { ...t.activities, [a]: !on } }))}
                  className={cx(
                    "min-h-11 rounded-full px-4 text-sm",
                    on ? "bg-primary font-medium text-white" : "border border-line-strong bg-surface text-ink",
                  )}
                >
                  {on ? `✓ ${a}` : a}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className={fieldLabel}>Expected weather</div>
          <div role="radiogroup" aria-label="Expected weather" className="grid grid-cols-4 gap-2">
            {tripWeather.map((w) => (
              <OptionButton key={w} on={trip.weather === w} onClick={() => setTrip((t) => ({ ...t, weather: w }))}>
                {w}
              </OptionButton>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className={fieldLabel}>Accommodation</div>
          <div role="radiogroup" aria-label="Accommodation" className="grid grid-cols-3 gap-2">
            {tripStay.map((s) => (
              <OptionButton key={s} on={trip.stay === s} onClick={() => setTrip((t) => ({ ...t, stay: s }))}>
                {s}
              </OptionButton>
            ))}
          </div>
        </div>
      </Card>

      <Card aria-label="Generated packing list" className="flex min-w-0 flex-[2_1_360px] flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <CardTitle>Packing list</CardTitle>
          <span className="text-[13px] text-muted">
            {packedCount} of {list.length} packed
          </span>
        </div>
        {groups.map((g) => (
          <div key={g.cat}>
            <SectionLabel className="mb-0.5">{g.cat}</SectionLabel>
            {g.items.map((it) => (
              <label key={it.name} className="flex min-h-10 cursor-pointer items-center gap-3 border-b border-track text-sm">
                <Checkbox checked={!!packed[it.name]} onChange={() => setPacked((p) => ({ ...p, [it.name]: !p[it.name] }))} />
                <span className="flex-1">{it.name}</span>
                <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-muted">{it.rule}</span>
                <span className="w-8 text-right font-mono text-[13px]">×{it.qty}</span>
              </label>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button type="button" className={cx(button.strong, "flex-[1_1_140px]")}>
            Export to Todoist
          </button>
          <button type="button" className={cx(button.secondary, "flex-[1_1_140px]")}>
            Save list
          </button>
        </div>
      </Card>
    </div>
  );
}
