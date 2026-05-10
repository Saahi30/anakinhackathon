"use client";

import type { WizardStep } from "../Onboarding";

const SHORT: Record<WizardStep, string> = {
  brand: "Brand",
  brand_review: "Review",
  product_import: "Products",
  enrichment: "Enrich",
  competitor_discovery: "Discover",
  competitor_review: "Approve",
  activation: "Activate",
};

export default function StepIndicator({
  current,
  order,
}: {
  current: WizardStep;
  order: WizardStep[];
}) {
  const idx = order.indexOf(current);
  return (
    <div className="px-6 py-3 border-b border-border bg-bg/30">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {order.map((s, i) => {
          const state =
            i < idx ? "done" : i === idx ? "current" : "upcoming";
          const dot =
            state === "done"
              ? "bg-accent border-accent"
              : state === "current"
                ? "bg-accent/20 border-accent"
                : "bg-bg border-border";
          const text =
            state === "current"
              ? "text-gray-100"
              : state === "done"
                ? "text-accent"
                : "text-muted";
          return (
            <div key={s} className="flex items-center gap-1.5 shrink-0">
              <span
                className={`w-2 h-2 rounded-full border ${dot}`}
              />
              <span className={`text-xs ${text}`}>{SHORT[s]}</span>
              {i < order.length - 1 && (
                <span className="w-3 h-px bg-border mx-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
