"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MonitorList from "./MonitorList";
import MonitoringFeed from "./MonitoringFeed";
import SettingsPanel from "./SettingsPanel";
import AddMonitor from "./AddMonitor";
import StatsBar from "./StatsBar";
import Onboarding from "./Onboarding";
import BrandSummary from "./BrandSummary";
import AlertHistory from "./AlertHistory";
import NeedsReviewQueue from "./NeedsReviewQueue";
import SparklinesPanel from "./SparklinesPanel";
import StrikesPanel from "./StrikesPanel";
import PlaybooksPanel from "./PlaybooksPanel";
import IntegrationsPanel from "./IntegrationsPanel";
import InsightsPanel from "./InsightsPanel";
import WarRoom from "./WarRoom";
import UsageStrip from "./UsageStrip";
import { supabaseBrowser } from "@/lib/supabase";

export type Monitor = {
  id: number;
  url: string;
  label: string | null;
  platform: string;
  sku: string | null;
  brand: string | null;
  last_status: string | null;
  last_checked_at: string | null;
  last_oos_at: string | null;
  last_back_in_stock_at: string | null;
  created_at: string;
  enabled: number;
  last_price: string | null;
  last_price_value: number | null;
  last_price_at: string | null;
  low_stock_since: string | null;
  snooze_until: string | null;
  consecutive_failures: number;
  auto_paused_at: string | null;
};

export type Event = {
  id: number;
  monitor_id: number;
  kind: string;
  status: string | null;
  message: string | null;
  payload: string | null;
  created_at: string;
  monitor_label: string | null;
  monitor_platform: string | null;
  monitor_url: string | null;
};

type Tab =
  | "monitoring"
  | "feed"
  | "strikes"
  | "playbooks"
  | "integrations"
  | "insights"
  | "alerts"
  | "review"
  | "settings";

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("monitoring");
  const [warRoom, setWarRoom] = useState<{
    monitor: Monitor;
    event: Event | null;
  } | null>(null);
  const monitorsRef = useRef<Monitor[]>([]);
  monitorsRef.current = monitors;
  const [slackTestOpen, setSlackTestOpen] = useState(false);
  const [slackTestUrl, setSlackTestUrl] = useState("");
  const [slackTestBusy, setSlackTestBusy] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState<
    { ok: boolean; message: string } | null
  >(null);
  const slackTestRef = useRef<HTMLDivElement>(null);

  async function refreshMonitors() {
    const r = await fetch("/api/monitors").then((r) => r.json());
    setMonitors(r.monitors || []);
  }
  async function refreshEvents() {
    const r = await fetch("/api/events?limit=120").then((r) => r.json());
    setEvents(r.events || []);
  }
  async function refreshSettings() {
    const r = await fetch("/api/settings").then((r) => r.json());
    const s = r.settings || {};
    setSettings(s);
    if (showOnboarding === null) {
      setShowOnboarding(s.onboarding_completed !== "1");
    }
  }

  useEffect(() => {
    refreshMonitors();
    refreshEvents();
    refreshSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (slackTestOpen && !slackTestUrl) {
      setSlackTestUrl(settings.slack_webhook_url || "");
    }
  }, [slackTestOpen, settings.slack_webhook_url, slackTestUrl]);

  useEffect(() => {
    if (!slackTestOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!slackTestRef.current) return;
      if (!slackTestRef.current.contains(e.target as Node)) {
        setSlackTestOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSlackTestOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [slackTestOpen]);

  async function sendSlackTest() {
    setSlackTestBusy(true);
    setSlackTestResult(null);
    try {
      const r = await fetch("/api/slack-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: slackTestUrl || null }),
      });
      const data = await r.json();
      if (data.ok) {
        setSlackTestResult({ ok: true, message: "Sent ✓" });
      } else {
        setSlackTestResult({
          ok: false,
          message: data.error || `failed (${data.status || r.status})`,
        });
      }
    } catch (e: any) {
      setSlackTestResult({
        ok: false,
        message: e?.message || "request failed",
      });
    } finally {
      setSlackTestBusy(false);
    }
  }

  useEffect(() => {
    let supabase: ReturnType<typeof supabaseBrowser>;
    try {
      supabase = supabaseBrowser();
    } catch (e) {
      console.error("Supabase browser client not configured:", e);
      return;
    }

    const channel = supabase
      .channel("stockstrike-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          const e: any = payload.new;
          const m = monitorsRef.current.find((x) => x.id === e.monitor_id);
          const enriched: Event = {
            id: e.id,
            monitor_id: e.monitor_id,
            kind: e.kind,
            status: e.status,
            message: e.message,
            payload: e.payload ? JSON.stringify(e.payload) : null,
            created_at: e.created_at,
            monitor_label: m?.label ?? null,
            monitor_platform: m?.platform ?? null,
            monitor_url: m?.url ?? null,
          };
          setEvents((prev) => [enriched, ...prev].slice(0, 200));
          if (
            e.kind === "oos_detected" ||
            e.kind === "back_in_stock" ||
            e.kind === "check"
          ) {
            refreshMonitors();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "monitors" },
        () => refreshMonitors()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "monitors" },
        () => refreshMonitors()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "monitors" },
        () => refreshMonitors()
      )
      .subscribe((status) => {
        setRealtimeOk(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const total = monitors.length;
    const oos = monitors.filter((m) => m.last_status === "out_of_stock").length;
    const lowStock = monitors.filter(
      (m) => m.last_status === "low_stock"
    ).length;
    const inStock = monitors.filter((m) => m.last_status === "in_stock").length;
    const recentOos = events.filter((e) => e.kind === "oos_detected").length;
    return { total, oos, lowStock, inStock, recentOos };
  }, [monitors, events]);

  async function reRunOnboarding() {
    const alreadySet = settings.onboarding_completed === "1";
    let wipeBrand = false;
    if (alreadySet) {
      wipeBrand = confirm(
        `Test with a different brand?\n\nOK — clear the current brand profile (${settings.brand_name || "Your Brand"}) so the wizard starts blank.\nCancel — keep current data; just re-walk the wizard.`
      );
    }
    if (wipeBrand) {
      const blankBrand: Record<string, string> = {
        brand_name: "",
        brand_tagline: "",
        brand_description: "",
        brand_voice: "",
        brand_categories: "",
        brand_value_props: "",
        brand_target_audience: "",
        brand_website: "",
        brand_source_url: "",
        brand_marketplaces: "",
        brand_regions: "",
        brand_logo_url: "",
        brand_notes: "",
        source_type: "",
        confidence: "",
      };
      await fetch("/api/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blankBrand),
      });
    }
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboarding_completed: "0",
        ...(wipeBrand ? { brand_name: "" } : {}),
      }),
    });
    setShowOnboarding(true);
    refreshSettings();
  }

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: "monitoring", label: "Monitoring" },
    { id: "feed", label: "Live feed" },
    {
      id: "strikes",
      label: "Strikes",
      badge: stats.oos > 0 ? String(stats.oos) : undefined,
    },
    { id: "playbooks", label: "Playbooks" },
    { id: "integrations", label: "Integrations" },
    { id: "insights", label: "Insights" },
    { id: "alerts", label: "Alert history" },
    { id: "review", label: "Needs review" },
    { id: "settings", label: "Settings" },
  ];

  const openWarRoom = (m: Monitor) => {
    const ev =
      events.find(
        (e) => e.monitor_id === m.id && e.kind === "oos_detected"
      ) || null;
    setWarRoom({ monitor: m, event: ev });
  };

  return (
    <div className="min-h-screen">
      {showOnboarding && (
        <Onboarding
          onDone={() => {
            setShowOnboarding(false);
            refreshSettings();
            refreshMonitors();
          }}
          onSkip={async () => {
            await fetch("/api/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ onboarding_completed: "1" }),
            });
            setShowOnboarding(false);
            refreshSettings();
          }}
        />
      )}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-canvas/85 border-b border-hairline">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-peach grid place-items-center shadow-clay">
              <span className="text-ink font-display font-bold text-xl leading-none">
                ⚡
              </span>
            </div>
            <div>
              <div className="font-display text-2xl tracking-display text-ink leading-none">
                StockStrike
              </div>
              <div className="text-xs text-muted mt-1">
                Capture competitor OOS traffic in real time
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {stats.oos > 0 && (
              <button
                onClick={() => setTab("strikes")}
                className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-brand-coral text-white hover:bg-brand-coral/90 transition shadow-clay"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {stats.oos} live strike{stats.oos === 1 ? "" : "s"}
              </button>
            )}
            <span
              className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
                realtimeOk
                  ? "border-brand-mint bg-brand-mint/30 text-brand-teal"
                  : "border-hairline bg-soft text-muted"
              }`}
              title={
                realtimeOk
                  ? "Connected to Supabase Realtime"
                  : "Realtime disconnected"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${realtimeOk ? "bg-brand-teal animate-pulse" : "bg-muted-soft"}`}
              />
              {realtimeOk ? "realtime" : "offline"}
            </span>
            <button
              onClick={reRunOnboarding}
              title={
                settings.onboarding_completed === "1"
                  ? `Re-run the 7-step wizard to test with a different brand. Current: ${settings.brand_name || "Your Brand"}`
                  : "Set up your brand, products, and competitors"
              }
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-full bg-brand-peach text-ink hover:bg-brand-peach/80 transition border border-ink/10 shadow-clay"
            >
              <span className="text-sm leading-none">⚡</span>
              {settings.onboarding_completed === "1"
                ? "Re-run onboarding"
                : "Run onboarding"}
            </button>
            <div className="relative" ref={slackTestRef}>
              <button
                onClick={() => {
                  setSlackTestOpen((o) => !o);
                  setSlackTestResult(null);
                }}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition ${
                  slackTestOpen
                    ? "bg-canvas text-ink border border-ink"
                    : "bg-ink text-white hover:bg-ink/90"
                }`}
              >
                Send Slack test
              </button>
              {slackTestOpen && (
                <div className="absolute right-0 top-full mt-2 w-[360px] rounded-clay bg-panel border border-hairline shadow-clay-lift p-5 z-20">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
                    Test your Slack webhook
                  </div>
                  <div className="font-display text-lg tracking-tightish text-ink mt-1 leading-snug">
                    Paste a webhook URL to send a test alert.
                  </div>
                  <input
                    type="url"
                    value={slackTestUrl}
                    onChange={(e) => {
                      setSlackTestUrl(e.target.value);
                      setSlackTestResult(null);
                    }}
                    placeholder="https://hooks.slack.com/services/..."
                    autoFocus
                    className="mt-3 w-full bg-canvas border border-hairline rounded-2xl px-3.5 py-2.5 text-xs font-mono text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none transition"
                  />
                  <div className="text-[10px] text-muted mt-1.5 leading-relaxed">
                    Leave empty to use the URL saved in Settings.
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={sendSlackTest}
                      disabled={slackTestBusy}
                      className="flex-1 px-4 py-2 text-xs font-medium rounded-full bg-ink text-white hover:bg-ink/90 disabled:opacity-50 transition"
                    >
                      {slackTestBusy ? "Sending…" : "Send test alert"}
                    </button>
                    <button
                      onClick={() => setSlackTestOpen(false)}
                      className="px-4 py-2 text-xs rounded-full bg-soft text-ink hover:bg-strong transition"
                    >
                      Cancel
                    </button>
                  </div>
                  {slackTestResult && (
                    <div
                      className={`mt-3 text-xs px-3 py-2 rounded-2xl ${
                        slackTestResult.ok
                          ? "bg-brand-mint/40 text-brand-teal"
                          : "bg-brand-coral/15 text-brand-coral"
                      }`}
                    >
                      {slackTestResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 pb-3">
          <nav className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition shrink-0 inline-flex items-center gap-2 ${
                  tab === t.id
                    ? "bg-ink text-white"
                    : "text-muted hover:text-ink hover:bg-soft"
                }`}
              >
                {t.label}
                {t.badge && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      tab === t.id
                        ? "bg-brand-coral text-white"
                        : "bg-brand-coral/15 text-brand-coral"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        <StatsBar stats={stats} />
        <UsageStrip />

        {(tab === "monitoring" || tab === "feed") && (
          <SparklinesPanel totalStrikes={stats.recentOos} />
        )}

        {tab === "monitoring" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <div className="min-w-0 space-y-6">
              <AddMonitor onAdded={refreshMonitors} />
              <MonitorList
                monitors={monitors}
                onChange={refreshMonitors}
                onOpenWarRoom={openWarRoom}
              />
            </div>
            <div className="min-w-0 space-y-6">
              <BrandSummary onReRun={reRunOnboarding} />
              <NeedsReviewQueue events={events} />
            </div>
          </div>
        )}

        {tab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <div className="min-w-0">
              <MonitoringFeed events={events} />
            </div>
            <div className="min-w-0">
              <BrandSummary onReRun={reRunOnboarding} />
            </div>
          </div>
        )}

        {tab === "strikes" && (
          <StrikesPanel events={events} monitors={monitors} />
        )}

        {tab === "playbooks" && <PlaybooksPanel />}

        {tab === "integrations" && <IntegrationsPanel />}

        {tab === "insights" && <InsightsPanel monitors={monitors} />}

        {tab === "alerts" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <div className="min-w-0">
              <AlertHistory events={events} />
            </div>
            <div className="min-w-0">
              <NeedsReviewQueue events={events} />
            </div>
          </div>
        )}

        {tab === "review" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <div className="min-w-0">
              <NeedsReviewQueue events={events} />
            </div>
            <div className="min-w-0">
              <MonitoringFeed events={events.slice(0, 30)} />
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingsPanel settings={settings} onChange={refreshSettings} />
            <BrandSummary onReRun={reRunOnboarding} />
          </div>
        )}

        <footer className="mt-12 rounded-clay bg-soft px-8 py-10 text-center">
          <div className="font-display text-2xl tracking-display text-ink mb-3">
            Capture homeless traffic the moment it appears.
          </div>
          <div className="text-sm text-muted max-w-2xl mx-auto leading-relaxed">
            <span className="text-brand-teal font-medium">Real-time scraping</span>{" "}
            of brand &amp; listings ·{" "}
            <span className="text-brand-teal font-medium">AI</span> extracts the
            brand profile ·{" "}
            <span className="text-brand-teal font-medium">Marketplace search</span>{" "}
            finds Amazon competitors ·{" "}
            <span className="text-brand-teal font-medium">Slack</span> pings the
            moment a rival goes out of stock.
          </div>
          <div className="mt-6 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-pink" />
            <span className="w-2 h-2 rounded-full bg-brand-peach" />
            <span className="w-2 h-2 rounded-full bg-brand-ochre" />
            <span className="w-2 h-2 rounded-full bg-brand-mint" />
            <span className="w-2 h-2 rounded-full bg-brand-lavender" />
            <span className="w-2 h-2 rounded-full bg-brand-teal" />
          </div>
        </footer>
      </main>

      {warRoom && (
        <WarRoom
          monitor={warRoom.monitor}
          event={warRoom.event}
          onClose={() => setWarRoom(null)}
        />
      )}
    </div>
  );
}
