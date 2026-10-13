import type { Metadata } from "next";
import { GoalsView } from "@/components/goals/goals-view";
import { goals, initialGoalsDone } from "@/lib/data";

export const metadata: Metadata = { title: "Goals" };

export default function GoalsPage() {
  return <GoalsView goals={goals} initialDone={initialGoalsDone} />;
}
