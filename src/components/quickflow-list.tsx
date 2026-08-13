import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock, MapPin, Trash2, X } from "lucide-react";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useSavedStores } from "@/hooks/use-data";
import { sendPushNotification } from "@/lib/push-notifications";
import { celebrateFromEvent } from "@/lib/celebrate";
import {
  LEVEL_META,
  formatWhen,
  guessEmoji,
  isOverdue,
  shouldAskAboutThought,
  type QuickflowItem,
} from "@/lib/quickflow";

const PLACE_CHECK_MS = 3 * 60 * 1000;
const NEARBY_M = 300;

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SNOOZE_OPTIONS = [
  { label: "Om 30 min", ms: 30 * 60_000 },
  { label: "Om 2 timmar", ms: 2 * 60 * 60_000 },
  { label: "Imorgon", ms: 24 * 60 * 60_000 },
];

export function QuickflowList() {
  const { openItems, complete, remove, snooze, update } = useQuickflow();
  const { savedStores } = useSavedStores();
  const [now, setNow] = useState(() => Date.now());
  const [snoozeFor, setSnoozeFor] = useState<string | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  // Tick så att förfallna påminnelser dyker upp utan omladdning.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Lokal notis när tiden är inne – tydlig och med handlingsalternativ i appen.
  useEffect(() => {
    for (const item of openItems) {
      if (!item.remindAt || item.notifiedAt) continue;
      if (item.remindAt > now) continue;
      if (notifiedRef.current.has(item.id)) continue;
      notifiedRef.current.add(item.id);
      sendPushNotification("🔔 MyFlove: Du bad mig komma ihåg detta.", {
        body: item.text,
        tag: `quickflow:${item.id}`,
      });
      update(item.id, { notifiedAt: Date.now() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, openItems.length]);

  // Platsbaserade påminnelser: knuffa när användaren är i närheten.
  const placeItems = openItems.filter((i) => i.placeId && !i.notifiedAt);
  const placeKey = placeItems.map((i) => i.id).join("|");
  useEffect(() => {
    if (placeItems.length === 0 || typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    let cancelled = false;
    const check = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          for (const item of placeItems) {
            const store = savedStores.find((s) => s.id === item.placeId);
            if (!store) continue;
            const d = distanceMeters(pos.coords.latitude, pos.coords.longitude, store.lat, store.lon);
            if (d <= NEARBY_M) {
              sendPushNotification("🔔 MyFlove: Du bad mig komma ihåg detta.", {
                body: `${item.text} – du är nära ${store.name}.`,
                tag: `quickflow:${item.id}`,
              });
              update(item.id, { notifiedAt: Date.now() });
            }
          }
        },
        () => undefined,
        { maximumAge: 60_000, timeout: 15_000 },
      );
    };
    check();
    const t = setInterval(check, PLACE_CHECK_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeKey, savedStores.length]);

  const { needsAnswer, upcoming, thoughts } = useMemo(() => {
    const sorted = [...openItems].sort((a, b) => (a.remindAt ?? Infinity) - (b.remindAt ?? Infinity));
    return {
      needsAnswer: sorted.filter((i) => isOverdue(i, now) || shouldAskAboutThought(i, now)),
      upcoming: sorted.filter((i) => i.remindAt && !isOverdue(i, now)),
      thoughts: sorted.filter((i) => !i.remindAt && !i.placeId && !shouldAskAboutThought(i, now)),
    };
  }, [openItems, now]);

  const placeUpcoming = openItems.filter((i) => i.placeId && !isOverdue(i, now) && !i.notifiedAt);

  if (openItems.length === 0) return null;

  const renderRow = (item: QuickflowItem, extra?: React.ReactNode) => (
    <div key={item.id} className="surface-card p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none mt-0.5">{guessEmoji(item.text, item.level)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink break-words">{item.text}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            {item.remindAt ? (
              <>
                <Clock size={13} /> {formatWhen(item.remindAt, new Date(now))}
              </>
            ) : item.placeName ? (
              <>
                <MapPin size={13} /> När du är nära {item.placeName}
              </>
            ) : (
              <>💭 Öppen tanke</>
            )}
            {item.level === "viktigt" && (
              <span className="ml-1 rounded-full border border-destructive/30 bg-destructive/10 text-destructive px-2 py-0.5 text-[11px]">
                {LEVEL_META.viktigt.label}
              </span>
            )}
            {(item.mergedCount ?? 0) > 0 && (
              <span className="ml-1 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                Sammanfogad ×{(item.mergedCount ?? 0) + 1}
              </span>
            )}

          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="Klar"
            onClick={(e) => {
              celebrateFromEvent(e);
              complete(item.id);
            }}
            className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            aria-label="Ta bort"
            onClick={() => remove(item.id)}
            className="w-9 h-9 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:text-destructive transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {extra}
      {snoozeFor === item.id && (
        <div className="flex flex-wrap gap-2 pt-1">
          {SNOOZE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                snooze(item.id, Date.now() + opt.ms);
                setSnoozeFor(null);
              }}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-primary"
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSnoozeFor(null)}
            className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:underline"
          >
            <X size={12} className="inline -mt-0.5" /> Avbryt
          </button>
        </div>
      )}
    </div>
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          Du bad mig komma ihåg
        </h2>
        <p className="text-sm text-muted-foreground">
          Ingenting här försvinner av sig självt. Jag håller det åt dig. 💙
        </p>
      </div>

      {needsAnswer.length > 0 && (
        <div className="space-y-3">
          {needsAnswer.map((item) =>
            renderRow(
              item,
              <div className="rounded-2xl bg-secondary/50 border border-border p-3 space-y-2">
                <p className="text-sm text-ink">
                  Du bad mig komma ihåg detta. Vill du fortfarande göra det?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => update(item.id, { askedAt: Date.now() })}
                    className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-medium"
                  >
                    Ja – behåll
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnoozeFor(item.id)}
                    className="rounded-full border border-border bg-card px-4 py-1.5 text-xs"
                  >
                    Senare – välj ny tid
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded-full border border-destructive/30 text-destructive px-4 py-1.5 text-xs"
                  >
                    Inte längre
                  </button>
                </div>
              </div>,
            ),
          )}
        </div>
      )}

      {(upcoming.length > 0 || placeUpcoming.length > 0) && (
        <div className="space-y-3">
          {[...upcoming, ...placeUpcoming].map((item) =>
            renderRow(
              item,
              <button
                type="button"
                onClick={() => setSnoozeFor(item.id === snoozeFor ? null : item.id)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Flytta till en annan tid
              </button>,
            ),
          )}
        </div>
      )}

      {thoughts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Öppna tankar</p>
          {thoughts.map((item) =>
            renderRow(
              item,
              <button
                type="button"
                onClick={() => setSnoozeFor(item.id === snoozeFor ? null : item.id)}
                className="text-xs text-primary hover:underline"
              >
                Vill du lägga in en tid för den här?
              </button>,
            ),
          )}
        </div>
      )}
    </section>
  );
}

export default QuickflowList;
