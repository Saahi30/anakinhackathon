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
    <div className="px-8 py-4 border-b border-hairline bg-canvas">
      <div className="flex items-center gap-2 overflow-x-auto">
        {order.map((s, i) => {
          const state =
            i < idx ? "done" : i === idx ? "current" : "upcoming";
          const dot =
            state === "done"
              ? "bg-brand-teal text-white"
              : state === "current"
                ? "bg-ink text-white"
                : "bg-soft text-muted-soft";
          const text =
            state === "current"
              ? "text-ink font-medium"
              : state === "done"
                ? "text-brand-teal"
                : "text-muted";
          return (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <span
                className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-semibold ${dot}`}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span className={`text-xs ${text}`}>{SHORT[s]}</span>
              {i < order.length - 1 && (
                <span className="w-6 h-px bg-hairline mx-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
