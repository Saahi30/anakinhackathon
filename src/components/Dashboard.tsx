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
    const inStock = monitors.filter((m) => m.last_status === "in_stock").length;
    const recentOos = events.filter((e) => e.kind === "oos_detected").length;
    return { total, oos, inStock, recentOos };
  }, [monitors, events]);

  async function reRunOnboarding() {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_completed: "0" }),
    });
    setShowOnboarding(true);
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
              onClick={async () => {
                const r = await fetch("/api/slack-test", { method: "POST" });
                const data = await r.json();
                alert(
                  data.ok
                    ? "Slack test sent ✓"
                    : `Slack failed: ${data.error || data.status}`
                );
              }}
              className="px-4 py-1.5 text-xs font-medium rounded-full bg-ink text-white hover:bg-ink/90 transition"
            >
              Send Slack test
            </button>
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

        {(tab === "monitoring" || tab === "feed") && (
          <SparklinesPanel totalStrikes={stats.recentOos} />
        )}

        {tab === "monitoring" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-6">
              <AddMonitor onAdded={refreshMonitors} />
              <MonitorList
                monitors={monitors}
                onChange={refreshMonitors}
                onOpenWarRoom={openWarRoom}
              />
            </div>
            <div className="space-y-6">
              <BrandSummary onReRun={reRunOnboarding} />
              <NeedsReviewQueue events={events} />
            </div>
          </div>
        )}

        {tab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <MonitoringFeed events={events} />
            <BrandSummary onReRun={reRunOnboarding} />
          </div>
        )}

        {tab === "strikes" && (
          <StrikesPanel events={events} monitors={monitors} />
        )}

        {tab === "playbooks" && <PlaybooksPanel />}

        {tab === "integrations" && <IntegrationsPanel />}

        {tab === "insights" && <InsightsPanel monitors={monitors} />}

        {tab === "alerts" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <AlertHistory events={events} />
            <NeedsReviewQueue events={events} />
          </div>
        )}

        {tab === "review" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <NeedsReviewQueue events={events} />
            <MonitoringFeed events={events.slice(0, 30)} />
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
            <span className="text-brand-teal font-medium">Anakin</span> scrapes
            brand &amp; listings ·{" "}
            <span className="text-brand-teal font-medium">Groq</span> extracts
            the brand profile ·{" "}
            <span className="text-brand-teal font-medium">Rainforest</span>{" "}
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
