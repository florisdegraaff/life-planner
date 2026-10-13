"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { icons, integrations, nav, user } from "@/lib/data";
import { useTheme } from "./theme";
import { cx, Icon } from "./ui";

// Below the md breakpoint the sidebar collapses into a top bar with a hamburger menu,
// and the integrations list folds away inside that menu.
export function Sidebar() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const needsAttention = integrations.filter((i) => !i.ok).length;

  return (
    <nav
      aria-label="Modules"
      className="sticky top-0 z-20 flex max-h-dvh flex-col overflow-y-auto bg-nav px-3.5 py-3 text-[#ECE8F2] md:static md:max-h-none md:w-[220px] md:flex-none md:gap-7 md:overflow-visible md:py-6"
    >
      <div className="flex items-center justify-between">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-2.5 px-2.5 text-inherit no-underline hover:text-inherit"
        >
          <div aria-hidden="true" className="flex size-[34px] items-center justify-center rounded-[9px] bg-primary text-white">
            <Icon d={icons.goals} />
          </div>
          <div className="font-display text-lg font-semibold tracking-[-0.01em]">Life Planner</div>
        </Link>
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="sidebar-menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex size-11 items-center justify-center rounded-[10px] text-[#D2CBE0] hover:bg-white/5 hover:text-white md:hidden"
        >
          <Icon d={menuOpen ? icons.close : icons.menu} size={22} />
        </button>
      </div>

      <div
        id="sidebar-menu"
        className={cx("flex-1 flex-col gap-7 pt-4 pb-3 md:flex md:p-0", menuOpen ? "flex" : "hidden")}
      >
        <div className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] no-underline",
                  active
                    ? "bg-primary font-medium text-white hover:text-white"
                    : "text-[#D2CBE0] hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon d={item.icon} strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-2.5 px-2.5">
          <div className="hidden text-xs uppercase tracking-[0.08em] text-[#A79FB8] md:block">Integrations</div>
          <button
            type="button"
            aria-expanded={integrationsOpen}
            aria-controls="sidebar-integrations"
            onClick={() => setIntegrationsOpen((o) => !o)}
            className="flex min-h-11 items-center gap-2.5 text-left text-xs uppercase tracking-[0.08em] text-[#A79FB8] md:hidden"
          >
            <span className="flex-1">Integrations</span>
            {needsAttention > 0 && (
              <span className="flex items-center gap-1.5 normal-case tracking-normal">
                <span aria-hidden="true" className="size-2 rounded-full bg-[#E3A13B]" />
                {needsAttention} not set up
              </span>
            )}
            <Icon
              d={icons.chevronDown}
              size={16}
              className={cx("transition-transform", integrationsOpen && "rotate-180")}
            />
          </button>
          <div
            id="sidebar-integrations"
            className={cx("flex-col gap-2.5 md:flex", integrationsOpen ? "flex" : "hidden")}
          >
            {integrations.map((i) => (
              <div key={i.name} className="flex items-center gap-2.5 text-[13px]">
                <span aria-hidden="true" className={cx("size-2 rounded-full", i.ok ? "bg-[#5FB98A]" : "bg-[#E3A13B]")} />
                <span className="flex-1">{i.name}</span>
                <span className="font-mono text-[11px] text-[#A79FB8]">{i.status}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={toggleTheme}
            className="mt-2 flex min-h-11 items-center gap-2.5 border-0 bg-transparent p-0 text-left text-sm text-[#D2CBE0]"
          >
            <Icon d={icons.moon} size={18} />
            <span className="flex-1">Dark mode</span>
            <span
              aria-hidden="true"
              className={cx("relative block h-[22px] w-[38px] flex-none rounded-full", isDark ? "bg-[#7E55CC]" : "bg-[#463A5A]")}
            >
              <span
                className={cx(
                  "absolute top-[3px] size-4 rounded-full bg-surface transition-[left]",
                  isDark ? "left-[19px]" : "left-[3px]",
                )}
              />
            </span>
          </button>

          <Link
            href="/settings"
            onClick={closeMenu}
            className="mt-3 flex min-h-11 items-center gap-2.5 border-t border-[#332B42] pt-2 text-sm text-[#D2CBE0] no-underline hover:text-white"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-[#463A5A] text-xs font-semibold text-white">
              {user.initials}
            </span>
            {user.name}
          </Link>
        </div>
      </div>
    </nav>
  );
}
