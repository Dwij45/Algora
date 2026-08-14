"use client";

import { useCallback, useState } from "react";
import { MistakeForm } from "@/components/journal/MistakeForm";
import { MistakeList } from "@/components/journal/MistakeList";
import { CodeAtmosphereBg } from "@/components/ui/CodeAtmosphereBg";

export default function JournalPage() {
  const [listKey, setListKey] = useState(0);
  const refreshList = useCallback(() => {
    setListKey((k) => k + 1);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      <CodeAtmosphereBg />
      <div className="relative z-10 mx-auto max-w-2xl animate-fade-in space-y-8 px-1 pb-16">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Topic journal
          </h1>
          <p className="mt-2 text-muted">
            Log concept gaps (two pointers, trees, …) — not syntax typos. All
            logs stay here; Insights will count them later to show weak topics.
          </p>
        </header>

        <MistakeList key={listKey} />

        <MistakeForm onCreated={refreshList} />
      </div>
    </div>
  );
}
