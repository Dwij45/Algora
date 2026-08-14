"use client";

import { InsightsDashboard } from "@/components/insights/InsightsDashboard";
import { CodeAtmosphereBg } from "@/components/ui/CodeAtmosphereBg";

export default function InsightsPage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      <CodeAtmosphereBg />
      <div className="relative z-10 mx-auto max-w-2xl animate-fade-in space-y-6 px-1 pb-16">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
          <p className="mt-2 text-muted">
            Topic weaknesses and strengths from your journal — counted locally,
            no extra AI calls.
          </p>
        </header>
        <InsightsDashboard />
      </div>
    </div>
  );
}
