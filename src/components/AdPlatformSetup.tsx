"use client";

import { useEffect, useState } from "react";

export type AdField = {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: "text" | "password" | "number" | "textarea";
  required?: boolean;
  mono?: boolean;
};

export type AdPlatformConfig = {
  platform: "meta" | "google";
  name: string;
  logo: string;
  logoBg: string;
  logoColor: string;
  intro: string;
  docsHref?: string;
  fields: AdField[];
  defaults?: Record<string, string>;
};

export const META_ADS_CONFIG: AdPlatformConfig = {
  platform: "meta",
  name: "Meta Ads",
  logo: "Ⓜ",
  logoBg: "bg-[#0866FF]",
  logoColor: "text-white",
  intro:
    "Bid up your Meta ad sets the moment a rival goes out of stock, then pull spend back the moment they restock. This screen is a placeholder — no live calls are made yet.",
  docsHref: "https://developers.facebook.com/docs/marketing-apis",
  fields: [
    {
      key: "meta_ad_account_id",
      label: "Ad account ID",
      placeholder: "act_1234567890",
      hint: "Find this under Meta Business Suite → Settings → Accounts → Ad Accounts.",
      required: true,
      mono: true,
    },
    {
      key: "meta_business_id",
      label: "Business Manager ID",
      placeholder: "1029384756",
      hint: "Optional but required for cross-account scoping.",
      mono: true,
    },
    {
      key: "meta_pixel_id",
      label: "Pixel ID (for attribution)",
      placeholder: "9988776655",
      mono: true,
    },
    {
      key: "meta_access_token",
      label: "Long-lived access token",
      placeholder: "EAAG...",
      hint: "System-user token with ads_management + ads_read scopes. Stored encrypted (placeholder).",
      type: "password",
      required: true,
      mono: true,
    },
    {
      key: "meta_default_campaigns",
      label: "Target campaigns (comma-separated IDs or names)",
      placeholder: "spring-launch, evergreen-prospecting",
      type: "textarea",
      hint: "Leave blank to surge every active campaign in the account.",
    },
    {
      key: "meta_bid_surge_pct",
      label: "Bid surge during strike window (%)",
      placeholder: "40",
      type: "number",
    },
    {
      key: "meta_daily_budget_cap",
      label: "Daily budget cap (₹, optional)",
      placeholder: "25000",
      type: "number",
      hint: "Soft ceiling — surge will not push daily spend past this.",
    },
  ],
  defaults: {
    meta_bid_surge_pct: "40",
    meta_daily_budget_cap: "",
  },
};

export const GOOGLE_ADS_CONFIG: AdPlatformConfig = {
  platform: "google",
  name: "Google Ads",
  logo: "G",
  logoBg: "bg-white",
  logoColor: "text-[#4285F4]",
  intro:
    "Bid up rival-brand keywords during the OOS window so shoppers searching for the unavailable competitor see you first. Placeholder — no live API calls.",
  docsHref: "https://developers.google.com/google-ads/api/docs/start",
  fields: [
    {
      key: "google_customer_id",
      label: "Customer ID",
      placeholder: "123-456-7890",
      hint: "Format: XXX-XXX-XXXX. Top-right of your Google Ads dashboard.",
      required: true,
      mono: true,
    },
    {
      key: "google_login_customer_id",
      label: "Manager (MCC) ID, if applicable",
      placeholder: "987-654-3210",
      mono: true,
    },
    {
      key: "google_developer_token",
      label: "Developer token",
      placeholder: "abcDEF123_xYz",
      hint: "Get this from Google Ads → Tools & Settings → API Center.",
      type: "password",
      required: true,
      mono: true,
    },
    {
      key: "google_refresh_token",
      label: "OAuth refresh token",
      placeholder: "1//0g...",
      type: "password",
      required: true,
      mono: true,
    },
    {
      key: "google_rival_keywords",
      label: "Rival-brand keywords (one per line)",
      placeholder: "buy {competitor}\n{competitor} alternative\n{competitor} review",
      type: "textarea",
      hint: "Use {competitor} as a variable — StockStrike substitutes the live competitor name on each strike.",
    },
    {
      key: "google_bid_adjustment_pct",
      label: "Keyword bid adjustment (%)",
      placeholder: "30",
      type: "number",
    },
    {
      key: "google_daily_budget_cap",
      label: "Daily budget cap (₹, optional)",
      placeholder: "20000",
      type: "number",
    },
  ],
  defaults: {
    google_bid_adjustment_pct: "30",
    google_rival_keywords: "buy {competitor}\n{competitor} alternative\n{competitor} review",
  },
};

export default function AdPlatformSetup({
  config,
  onClose,
  onSaved,
}: {
  config: AdPlatformConfig;
  onClose: () => void;
  onSaved: () => void;
}) {
  const connectedKey = `${config.platform}_connected`;
  const [values, setValues] = useState<Record<string, string>>({});
  const [pauseOnRestock, setPauseOnRestock] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const s = d?.settings || {};
        const next: Record<string, string> = { ...(config.defaults || {}) };
        for (const f of config.fields) {
          if (typeof s[f.key] === "string" && s[f.key]) next[f.key] = s[f.key];
        }
        setValues(next);
        setPauseOnRestock(s[`${config.platform}_pause_on_restock`] !== "0");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [config]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function setField(k: string, v: string) {
    setValues((p) => ({ ...p, [k]: v }));
    setErrors((p) => {
      const { [k]: _, ...rest } = p;
      return rest;
    });
  }

  async function save() {
    const errs: Record<string, string> = {};
    for (const f of config.fields) {
      if (f.required && !(values[f.key] || "").trim()) {
        errs[f.key] = "Required";
      }
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setBusy(true);
    try {
      const patch: Record<string, string> = {
        ...values,
        [connectedKey]: "1",
        [`${config.platform}_pause_on_restock`]: pauseOnRestock ? "1" : "0",
      };
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      const patch: Record<string, string> = { [connectedKey]: "0" };
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm grid place-items-center p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-panel rounded-clay border border-hairline shadow-clay-lift w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-7 py-5 border-b border-hairline flex items-start gap-4 bg-soft">
          <div
            className={`w-12 h-12 rounded-lg ${config.logoBg} ${config.logoColor} grid place-items-center font-bold text-xl shrink-0`}
          >
            {config.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
              Connect ad platform
            </div>
            <div className="font-display text-2xl tracking-display text-ink mt-0.5">
              {config.name} setup
            </div>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              {config.intro}
            </p>
            {config.docsHref && (
              <a
                href={config.docsHref}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-teal hover:underline mt-1.5 inline-block"
              >
                API docs →
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink w-8 h-8 grid place-items-center rounded-full hover:bg-canvas"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-7 py-6 space-y-4">
          <div className="rounded-2xl bg-brand-ochre/10 border border-brand-ochre/30 px-4 py-3 text-xs text-ink leading-relaxed">
            <span className="font-semibold">Placeholder mode.</span> Saving
            stores config locally so you can demo the flow. Live bid changes are
            not yet wired to the {config.name} API.
          </div>

          {config.fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-muted">
                {f.label}
                {f.required && <span className="text-brand-coral ml-1">*</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={values[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={`mt-1 w-full bg-canvas border ${errors[f.key] ? "border-brand-coral" : "border-hairline"} rounded-2xl px-4 py-2.5 text-sm ${f.mono ? "font-mono" : ""} text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none transition resize-y`}
                />
              ) : (
                <input
                  type={f.type === "password" ? "password" : f.type === "number" ? "number" : "text"}
                  value={values[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={`mt-1 w-full bg-canvas border ${errors[f.key] ? "border-brand-coral" : "border-hairline"} rounded-2xl px-4 py-2.5 text-sm ${f.mono ? "font-mono" : ""} text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none transition`}
                />
              )}
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="text-[10px] text-muted">{f.hint}</div>
                {errors[f.key] && (
                  <div className="text-[10px] text-brand-coral">
                    {errors[f.key]}
                  </div>
                )}
              </div>
            </div>
          ))}

          <label className="flex items-start gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={pauseOnRestock}
              onChange={(e) => setPauseOnRestock(e.target.checked)}
              className="mt-1 w-4 h-4 accent-accent"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-ink">
                Pull bids back when competitor restocks
              </div>
              <div className="text-xs text-muted mt-0.5">
                Reverts the surge automatically the moment a back-in-stock event
                fires.
              </div>
            </div>
          </label>
        </div>

        <div className="px-7 py-4 border-t border-hairline flex items-center justify-end gap-2 bg-soft/60">
          <button
            onClick={disconnect}
            disabled={busy}
            className="text-xs px-4 py-2 rounded-full bg-canvas text-muted hover:text-brand-coral border border-hairline disabled:opacity-50"
          >
            Disconnect
          </button>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-xs px-4 py-2 rounded-full bg-canvas text-ink border border-hairline hover:bg-soft disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="text-sm px-5 py-2 rounded-full bg-ink text-white font-medium hover:bg-ink/90 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save & connect"}
          </button>
        </div>
      </div>
    </div>
  );
}
