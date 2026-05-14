"use client";

import { useEffect, useState } from "react";

export default function ActivationStep({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [activatedCount, setActivatedCount] = useState<number | null>(null);
  const [stats, setStats] = useState({ approved: 0, products: 0 });
  const [slackOk, setSlackOk] = useState<boolean | null>(null);

  async function loadStats() {
    const r = await fetch("/api/competitors").then((r) => r.json());
    const all = r.competitors || [];
    const approved = all.filter((c: any) => c.status === "approved").length;
    const products = await fetch("/api/products").then((r) => r.json());
    setStats({ approved, products: (products.products || []).length });
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function activate() {
    setBusy(true);
    try {
      const r = await fetch("/api/competitors/activate-approved", {
        method: "POST",
      });
      const data = await r.json();
      setActivatedCount(data.activated || 0);
      // mark onboarding complete
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed: "1" }),
      });
    } finally {
      setBusy(false);
    }
  }

  async function testSlack() {
    const r = await fetch("/api/slack-test", { method: "POST" });
    const data = await r.json();
    setSlackOk(Boolean(data.ok));
  }

  if (activatedCount !== null) {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="text-5xl">⚡</div>
        <div className="text-xl font-semibold">
          Monitoring {activatedCount} competitor{activatedCount === 1 ? "" : "s"}
        </div>
        <p className="text-sm text-muted">
          The scraping engine will check each one repeatedly. The instant a
          competitor goes out of stock, Slack gets pinged with a real-time
          alert and (optionally) AI-generated ad copy.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={testSlack}
            className="px-4 py-2 rounded-md border border-border text-sm hover:border-accent/60"
          >
            Test Slack alert
          </button>
          <button
            onClick={onDone}
            className="px-4 py-2 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90"
          >
            Open dashboard
          </button>
        </div>
        {slackOk !== null && (
          <div
            className={`text-xs ${slackOk ? "text-accent" : "text-danger"}`}
          >
            {slackOk ? "Slack test sent ✓" : "Slack test failed — check webhook URL"}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Activate monitoring for the {stats.approved} approved competitor
        {stats.approved === 1 ? "" : "s"} across {stats.products} product
        {stats.products === 1 ? "" : "s"}. The scraping engine polls each one,
        and Slack Incoming Webhooks deliver real-time OOS alerts.
      </p>

      <ul className="space-y-2 text-xs">
        <CheckRow label="Brand profile saved" ok />
        <CheckRow
          label={`${stats.products} products imported & enriched`}
          ok={stats.products > 0}
        />
        <CheckRow
          label={`${stats.approved} competitors approved`}
          ok={stats.approved > 0}
        />
        <CheckRow label="Slack webhook configured" hint="check Settings" />
      </ul>

      <div className="flex gap-2 pt-2 border-t border-border">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-md border border-border text-sm hover:border-accent/60"
        >
          Back
        </button>
        <button
          onClick={activate}
          disabled={busy || !stats.approved}
          className="flex-1 px-4 py-2.5 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
        >
          {busy
            ? "Activating…"
            : `Activate monitoring (${stats.approved})`}
        </button>
      </div>
    </div>
  );
}

function CheckRow({
  label,
  ok,
  hint,
}: {
  label: string;
  ok?: boolean;
  hint?: string;
}) {
  return (
    <li className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-bg/40">
      <span
        className={`w-4 h-4 rounded-full grid place-items-center text-[10px] ${
          ok ? "bg-accent/20 text-accent" : "bg-bg text-muted border border-border"
        }`}
      >
        {ok ? "✓" : "·"}
      </span>
      <span className={ok ? "text-gray-200" : "text-muted"}>{label}</span>
      {hint && <span className="ml-auto text-muted text-[10px]">{hint}</span>}
    </li>
  );
}
