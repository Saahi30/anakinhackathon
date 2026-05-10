"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MonitorList from "./MonitorList";
import EventFeed from "./EventFeed";
import SettingsPanel from "./SettingsPanel";
import AddMonitor from "./AddMonitor";
import StatsBar from "./StatsBar";
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

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [realtimeOk, setRealtimeOk] = useState(false);
  const monitorsRef = useRef<Monitor[]>([]);
  monitorsRef.current = monitors;

  async function refreshMonitors() {
    const r = await fetch("/api/monitors").then((r) => r.json());
    setMonitors(r.monitors || []);
  }
  async function refreshEvents() {
    const r = await fetch("/api/events?limit=80").then((r) => r.json());
    setEvents(r.events || []);
  }
  async function refreshSettings() {
    const r = await fetch("/api/settings").then((r) => r.json());
    setSettings(r.settings || {});
  }

  useEffect(() => {
    refreshMonitors();
    refreshEvents();
    refreshSettings();
  }, []);

  // Realtime subscriptions — events + monitors
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
          // Refetch monitors on transitions, since their last_status changes too.
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

  return (
    <div className="min-h-screen">
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
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <StatsBar stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            <AddMonitor onAdded={refreshMonitors} />
            <MonitorList monitors={monitors} onChange={refreshMonitors} />
          </div>

          <div className="space-y-6">
            <SettingsPanel settings={settings} onChange={refreshSettings} />
            <EventFeed events={events} />
          </div>
        </div>

        <footer className="text-xs text-muted text-center pt-6 pb-12">
          Powered by{" "}
          <a
            href="https://anakin.io"
            className="text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            anakin.io
          </a>{" "}
          · Supabase Realtime · Slack alerts · Groq Llama 3.3 70B for ad copy
        </footer>
      </main>
    </div>
  );
}
