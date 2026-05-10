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
      <header className="border-b border-border bg-panel/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/40 grid place-items-center">
              <span className="text-accent font-bold text-lg">⚡</span>
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight">
                StockStrike
              </div>
              <div className="text-xs text-muted">
                Capture competitor OOS traffic in real time
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats.oos > 0 && (
              <button
                onClick={() => setTab("strikes")}
                className="inline-flex items-center gap-1.5 text-xs text-danger px-2 py-1 rounded border border-danger/40 bg-danger/10 hover:bg-danger/20 transition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                {stats.oos} live strike{stats.oos === 1 ? "" : "s"}
              </button>
            )}
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${realtimeOk ? "text-accent" : "text-muted"}`}
              title={
                realtimeOk
                  ? "Connected to Supabase Realtime"
                  : "Realtime disconnected"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${realtimeOk ? "bg-accent animate-pulse" : "bg-muted"}`}
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
              className="px-3 py-1.5 text-xs rounded-md border border-border hover:border-accent/60 hover:text-accent transition"
            >
              Send Slack test
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition shrink-0 inline-flex items-center gap-1.5 ${
                  tab === t.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-gray-200"
                }`}
              >
                {t.label}
                {t.badge && (
                  <span className="text-[9px] px-1.5 rounded-full bg-danger/20 text-danger border border-danger/40">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
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

        <footer className="text-xs text-muted text-center pt-6 pb-12">
          Onboarding: <span className="text-accent">Anakin</span> scrapes brand &
          listings · <span className="text-accent">Groq</span> extracts brand
          profile · <span className="text-accent">Rainforest</span> finds Amazon
          competitors · <span className="text-accent">Slack</span> alerts on OOS
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
