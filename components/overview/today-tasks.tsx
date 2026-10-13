"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui";

export function TodayTasks({ tasks }: { tasks: { name: string; done: boolean }[] }) {
  const [done, setDone] = useState(() => tasks.map((t) => t.done));

  return tasks.map((task, i) => (
    <label key={task.name} className="flex min-h-11 cursor-pointer items-center gap-3 border-t border-track text-sm">
      <Checkbox checked={done[i]} onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} />
      <span className="flex-1">{task.name}</span>
    </label>
  ));
}
