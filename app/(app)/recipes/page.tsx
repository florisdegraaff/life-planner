import type { Metadata } from "next";
import { RecipePlanner } from "@/components/recipes/recipe-planner";
import { button, Icon, PageHeader } from "@/components/ui";
import { icons, initialCart, initialStock, recipes } from "@/lib/data";

export const metadata: Metadata = { title: "Recipes" };

export default function RecipesPage() {
  return (
    <>
      <PageHeader eyebrow="Library, weekly cart & shopping list" title="Recipes">
        <button type="button" className={button.secondary}>
          <Icon d={icons.sparkle} size={16} className="text-accent" />
          Paste a recipe
        </button>
        <button type="button" className={button.primary}>
          New recipe
        </button>
      </PageHeader>

      <RecipePlanner recipes={recipes} initialCart={initialCart} initialStock={initialStock} />
    </>
  );
}
