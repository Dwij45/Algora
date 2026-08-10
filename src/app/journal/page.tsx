"use client";

import { useCallback, useState } from "react";
import { MistakeForm } from "@/components/journal/MistakeForm";
import { MistakeList } from "@/components/journal/MistakeList";

export default function JournalPage() {
  const [listKey, setListKey] = useState(0);
  const refreshList = useCallback(() => {
    setListKey((k) => k + 1);
  }, []);

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-8">
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
  );
}
