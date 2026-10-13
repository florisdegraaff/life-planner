"use client";

import Link from "next/link";
import { useState } from "react";
import { button, Checkbox, Chip, cx, Icon, SectionLabel } from "@/components/ui";
import { aisles, cartWeek, icons, recipeTags, type Recipe, type Unit } from "@/lib/data";

const nl = (x: number, digits: number) => x.toFixed(digits).replace(".", ",").replace(/,0$/, "");

function formatQty(q: number, unit: Unit) {
  if (unit === "g") return q >= 1000 ? `${nl(q / 1000, 1)} kg` : `${Math.round(q)} g`;
  if (unit === "ml") return q >= 1000 ? `${nl(q / 1000, 1)} l` : `${Math.round(q)} ml`;
  if (unit === "cloves") return `${Math.ceil(q)} cloves`;
  return `× ${Math.ceil(q)}`;
}

export function RecipePlanner({
  recipes,
  initialCart,
  initialStock,
}: {
  recipes: Recipe[];
  initialCart: Record<number, number>;
  initialStock: Record<string, boolean>;
}) {
  const [tag, setTag] = useState("All");
  const [cart, setCart] = useState(initialCart);
  const [stock, setStock] = useState(initialStock);

  const library = recipes.filter((r) => tag === "All" || r.tags.includes(tag));
  const inCart = recipes.filter((r) => cart[r.id] != null);
  const totalKcal = inCart.reduce((sum, r) => sum + r.kcal * cart[r.id], 0);

  function toggleRecipe(id: number) {
    setCart(({ [id]: current, ...rest }) => (current == null ? { ...rest, [id]: 2 } : rest));
  }

  function setServings(id: number, servings: number) {
    setCart((c) => ({ ...c, [id]: Math.min(12, Math.max(1, servings)) }));
  }

  // Merge ingredients across the cart; recipe quantities are written for 2 servings.
  const merged = new Map<string, { key: string; name: string; unit: Unit; aisle: string; qty: number; n: number }>();
  for (const r of inCart) {
    for (const [name, qty, unit, aisle] of r.ingredients) {
      const key = `${name}|${unit}`;
      const item = merged.get(key) ?? { key, name, unit, aisle, qty: 0, n: 0 };
      item.qty += (qty * cart[r.id]) / 2;
      item.n += 1;
      merged.set(key, item);
    }
  }
  const items = [...merged.values()];
  const groups = aisles
    .map((aisle) => ({
      aisle,
      items: items.filter((m) => m.aisle === aisle).sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.items.length);
  const inStock = items.filter((m) => stock[m.key]).length;
  const toBuy = items.length - inStock;

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section aria-label="Recipe library" className="flex min-w-0 flex-[3_1_540px] flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex h-11 flex-[1_1_220px] items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3.5 text-muted">
            <Icon d={icons.search} size={18} />
            <input
              type="search"
              aria-label="Search recipes"
              placeholder={`Search ${recipes.length} recipes or ingredients`}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
            />
          </label>
          <div role="group" aria-label="Filter by tag" className="flex flex-wrap gap-1.5">
            {recipeTags.map((t) => (
              <Chip key={t} on={tag === t} onClick={() => setTag(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {library.map((r) => {
            const added = cart[r.id] != null;
            return (
              <article key={r.id} className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface">
                <div className="flex h-[84px] items-end justify-between p-3.5" style={{ background: r.tint }}>
                  <Icon d={icons.recipes} size={30} strokeWidth={1.6} className="text-[#1A1E1C]/55" />
                  <span className="font-mono text-xs text-[#2B302D]">{r.min} min</span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                  <h3 className="text-[15px] leading-[1.3] font-semibold">{r.name}</h3>
                  <div className="text-xs text-muted">{r.tags.join(" · ")}</div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                    <span className="font-mono text-xs text-muted">{r.kcal} kcal/serv.</span>
                    <button
                      type="button"
                      onClick={() => toggleRecipe(r.id)}
                      className={cx(
                        "min-h-9 rounded-lg px-3 text-[13px]",
                        added
                          ? "bg-primary-soft font-semibold text-primary-strong"
                          : "border border-line-strong bg-surface font-medium text-ink",
                      )}
                    >
                      {added ? "In cart ✓" : "Add to cart"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside
        aria-label="This week's cart"
        className="flex min-w-0 flex-[2_1_360px] flex-col gap-[18px] rounded-2xl border border-line bg-surface p-6"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">Cart · week {cartWeek}</h2>
          <span className="font-mono text-xs text-muted">{totalKcal.toLocaleString("nl-NL")} kcal total</span>
        </div>
        <div className="flex flex-col">
          {inCart.map((r) => (
            <div key={r.id} className="flex items-center gap-2.5 border-t border-track py-2">
              <span className="min-w-0 flex-1 text-sm">{r.name}</span>
              <div className="flex items-center rounded-lg border border-line-strong">
                <button type="button" aria-label="Fewer servings" onClick={() => setServings(r.id, cart[r.id] - 1)} className="size-9 text-base">
                  −
                </button>
                <span className="w-7 text-center font-mono text-[13px]">{cart[r.id]}</span>
                <button type="button" aria-label="More servings" onClick={() => setServings(r.id, cart[r.id] + 1)} className="size-9 text-base">
                  +
                </button>
              </div>
              <button
                type="button"
                aria-label="Remove from cart"
                onClick={() => toggleRecipe(r.id)}
                className="flex size-9 items-center justify-center text-muted"
              >
                <Icon d={icons.close} size={16} />
              </button>
            </div>
          ))}
          {inCart.length === 0 && <div className="py-4 text-sm text-muted">Add recipes from the library to plan your week.</div>}
        </div>

        <div className="flex items-baseline justify-between pt-1.5">
          <h3 className="font-display text-[17px] font-semibold">Shopping list</h3>
          <span className="text-[13px] text-muted">
            {toBuy} to buy · {inStock} in stock
          </span>
        </div>
        {groups.map((g) => (
          <div key={g.aisle}>
            <SectionLabel className="mb-0.5">{g.aisle}</SectionLabel>
            {g.items.map((it) => {
              const have = !!stock[it.key];
              return (
                <label key={it.key} className="flex min-h-10 cursor-pointer items-center gap-3 border-b border-track text-sm">
                  <Checkbox
                    checked={have}
                    onChange={() => setStock((s) => ({ ...s, [it.key]: !have }))}
                    aria-label="Already in stock"
                  />
                  {have ? (
                    <>
                      <span className="flex-1 text-faint line-through">{it.name}</span>
                      <span className="text-xs text-muted">in stock</span>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">
                        {it.name}
                        {it.n > 1 && <span className="text-xs text-muted"> · {it.n} recipes</span>}
                      </span>
                      <span className="font-mono text-[13px]">{formatQty(it.qty, it.unit)}</span>
                    </>
                  )}
                </label>
              );
            })}
          </div>
        ))}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button type="button" className={cx(button.strong, "flex-[1_1_140px]")}>
            Send to Todoist
          </button>
          <Link href="/shopping" className={cx(button.secondary, "flex-[1_1_140px] no-underline hover:text-ink")}>
            Open on phone
          </Link>
        </div>
      </aside>
    </div>
  );
}
