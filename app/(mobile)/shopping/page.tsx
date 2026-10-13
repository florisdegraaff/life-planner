import type { Metadata } from "next";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { cartWeek, initialGot, shoppingList } from "@/lib/data";

export const metadata: Metadata = { title: "Shopping list" };

export default function ShoppingPage() {
  return <ShoppingList groups={shoppingList} initialGot={initialGot} subtitle={`Week ${cartWeek} · 4 recipes`} />;
}
