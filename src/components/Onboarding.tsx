"use client";

import { useEffect, useState } from "react";
import BrandStep from "./onboarding/BrandStep";
import BrandReviewStep from "./onboarding/BrandReviewStep";
import ProductImportStep from "./onboarding/ProductImportStep";
import EnrichmentStep from "./onboarding/EnrichmentStep";
import CompetitorDiscoveryStep from "./onboarding/CompetitorDiscoveryStep";
import CompetitorReviewStep from "./onboarding/CompetitorReviewStep";
import ActivationStep from "./onboarding/ActivationStep";
import StepIndicator from "./onboarding/StepIndicator";

export type WizardStep =
  | "brand"
  | "brand_review"
  | "product_import"
  | "enrichment"
  | "competitor_discovery"
  | "competitor_review"
  | "activation";

const STEP_ORDER: WizardStep[] = [
  "brand",
  "brand_review",
  "product_import",
  "enrichment",
  "competitor_discovery",
  "competitor_review",
  "activation",
];

export type BrandDraft = {
  brand_name: string;
  brand_tagline: string;
  brand_description: string;
  brand_voice: string;
  brand_categories: string[];
  brand_value_props: string[];
  brand_target_audience: string;
  brand_marketplaces: string;
  brand_regions: string;
  brand_logo_url: string;
  brand_notes: string;
  brand_website: string;
  brand_source_url: string;
  source_type: string;
  confidence: string;
};

const EMPTY_BRAND: BrandDraft = {
  brand_name: "",
  brand_tagline: "",
  brand_description: "",
  brand_voice: "",
  brand_categories: [],
  brand_value_props: [],
  brand_target_audience: "",
  brand_marketplaces: "",
  brand_regions: "",
  brand_logo_url: "",
  brand_notes: "",
  brand_website: "",
  brand_source_url: "",
  source_type: "manual",
  confidence: "",
};

export default function Onboarding({
  onDone,
  onSkip,
}: {
  onDone: () => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<WizardStep>("brand");
  const [brand, setBrand] = useState<BrandDraft>(EMPTY_BRAND);

  useEffect(() => {
    fetch("/api/brand")
      .then((r) => r.json())
      .then((d) => {
        if (d?.brand?.brand_name) {
          setBrand({
            ...EMPTY_BRAND,
            ...d.brand,
            brand_categories: (d.brand.brand_categories || "")
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean),
            brand_value_props: (d.brand.brand_value_props || "")
              .split("|")
              .map((s: string) => s.trim())
              .filter(Boolean),
          });
        }
      })
      .catch(() => {});
  }, []);

  const idx = STEP_ORDER.indexOf(step);
  const goNext = () => setStep(STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)]);
  const goBack = () => setStep(STEP_ORDER[Math.max(0, idx - 1)]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-ink/40 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto rounded-clay bg-canvas shadow-clay-lift my-6 border border-hairline overflow-hidden">
        <div className="px-8 py-6 border-b border-hairline flex items-center justify-between gap-4 bg-soft">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.16em] text-brand-teal font-semibold">
              StockStrike onboarding
            </div>
            <h1 className="font-display text-3xl tracking-display text-ink mt-1.5">
              {stepTitle(step)}
            </h1>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-muted hover:text-ink shrink-0 px-3 py-1.5 rounded-full hover:bg-canvas transition"
          >
            Skip for now
          </button>
        </div>

        <StepIndicator current={step} order={STEP_ORDER} />

        <div className="p-6">
          {step === "brand" && (
            <BrandStep
              brand={brand}
              setBrand={setBrand}
              onNext={goNext}
            />
          )}
          {step === "brand_review" && (
            <BrandReviewStep
              brand={brand}
              setBrand={setBrand}
              onBack={goBack}
              onNext={goNext}
            />
          )}
          {step === "product_import" && (
            <ProductImportStep onBack={goBack} onNext={goNext} />
          )}
          {step === "enrichment" && (
            <EnrichmentStep onBack={goBack} onNext={goNext} />
          )}
          {step === "competitor_discovery" && (
            <CompetitorDiscoveryStep onBack={goBack} onNext={goNext} />
          )}
          {step === "competitor_review" && (
            <CompetitorReviewStep onBack={goBack} onNext={goNext} />
          )}
          {step === "activation" && (
            <ActivationStep
              onBack={goBack}
              onDone={onDone}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function stepTitle(step: WizardStep): string {
  return (
    {
      brand: "1. Tell us about your brand",
      brand_review: "2. Review your brand profile",
      product_import: "3. Import the products you want to protect",
      enrichment: "4. Enrich product details",
      competitor_discovery: "5. Discover competitors",
      competitor_review: "6. Approve competitors to monitor",
      activation: "7. Activate monitoring",
    } as Record<WizardStep, string>
  )[step];
}
