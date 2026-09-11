import { useMemo, useState } from "react";
import { CalendarCheck, CalendarPlus, Link2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import CollapsibleSection from "@/components/collapsible-section";
import { useToast } from "@/hooks/use-toast";
import {
  PROVIDER_LABELS,
  useCalendarConnection,
  useExternalEvents,
  usePushToCalendar,
  type CalendarProvider,
} from "@/hooks/use-calendar-sync";

export interface CalendarPushItem {
  title: string;
  date: string;
  time?: string;
  endTime?: string;
}

const PUSHED_KEY = "myflove-calendar-pushed";

function pushedMap(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(PUSHED_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function rememberPushed(key: string, externalId: string) {
  try {
    const map = pushedMap();
    map[key] = externalId;
    window.localStorage.setItem(PUSHED_KEY, JSON.stringify(map));
  } catch {
    /* utan lagring fungerar allt annat ändå */
  }
}

function itemKey(provider: CalendarProvider, item: CalendarPushItem) {
  return `${provider}|${item.date}|${item.time ?? ""}|${item.title}`;
}

/**
 * Koppling mellan MyFlove och ett riktigt kalenderkonto.
 * Händelser från kontot visas i appen, och dagens aktiviteter kan skickas dit.
 */
export default function CalendarAccount({
  date,
  itemsToPush,
}: {
  date: string;
  itemsToPush: CalendarPushItem[];
}) {
  const { status, connect, disconnect, anyConnected } = useCalendarConnection();
  const events = useExternalEvents(date, date, anyConnected);
  const { push, pushing } = usePushToCalendar();
  const { toast } = useToast();
  const [busy, setBusy] = useState<CalendarProvider | null>(null);

  const connected = useMemo(
    () =>
      (["google", "outlook"] as CalendarProvider[]).filter((p) =>
        p === "google" ? status.data?.google : status.data?.outlook,
      ),
    [status.data],
  );

  const available = (["google", "outlook"] as CalendarProvider[]).filter((p) =>
    p === "google" ? status.data?.googleAvailable : status.data?.outlookAvailable,
  );

  const onConnect = async (provider: CalendarProvider) => {
    setBusy(provider);
    try {
      await connect.mutateAsync(provider);
      toast({ title: `${PROVIDER_LABELS[provider]} är kopplad` });
    } catch (error) {
      toast({
        title: "Kopplingen blev inte klar",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const onDisconnect = async (provider: CalendarProvider) => {
    setBusy(provider);
    try {
      await disconnect.mutateAsync(provider);
      toast({ title: `${PROVIDER_LABELS[provider]} är frånkopplad` });
    } finally {
      setBusy(null);
    }
  };

  const onPushDay = async (provider: CalendarProvider) => {
    const map = pushedMap();
    let sent = 0;
    for (const item of itemsToPush) {
      const key = itemKey(provider, item);
      const res = await push({ ...item, provider, externalId: map[key] });
      if (res.ok && res.externalId) {
        rememberPushed(key, res.externalId);
        sent += 1;
      }
    }
    toast({
      title: sent
        ? `${sent} ${sent === 1 ? "aktivitet" : "aktiviteter"} finns nu i ${PROVIDER_LABELS[provider]}`
        : "Inget nytt att skicka",
    });
  };

  const dayEvents = events.data?.events ?? [];

  return (
    <CollapsibleSection
      id="kalender-konto"
      title="Din riktiga kalender"
      icon={<CalendarCheck size={18} />}
      help="Koppla ditt Google- eller Outlook-konto. Då syns kalenderns händelser här, och dagens aktiviteter kan skickas dit."
    >
      <div className="space-y-3">
        {available.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Kalenderkoppling är inte påslagen ännu.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {available.map((provider) => {
            const isConnected = connected.includes(provider);
            return (
              <Button
                key={provider}
                variant={isConnected ? "outline" : "default"}
                size="sm"
                disabled={busy === provider}
                onClick={() => (isConnected ? onDisconnect(provider) : onConnect(provider))}
              >
                {busy === provider ? (
                  <Loader2 className="mr-2 animate-spin" size={16} />
                ) : isConnected ? (
                  <Unlink className="mr-2" size={16} />
                ) : (
                  <Link2 className="mr-2" size={16} />
                )}
                {isConnected ? `Koppla från ${PROVIDER_LABELS[provider]}` : `Koppla ${PROVIDER_LABELS[provider]}`}
              </Button>
            );
          })}
        </div>

        {connected.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {connected.map((provider) => (
                <Button
                  key={provider}
                  variant="secondary"
                  size="sm"
                  disabled={pushing || itemsToPush.length === 0}
                  onClick={() => onPushDay(provider)}
                >
                  <CalendarPlus className="mr-2" size={16} />
                  Skicka dagens till {PROVIDER_LABELS[provider]}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => events.refetch()}
                disabled={events.isFetching}
              >
                <RefreshCw className={events.isFetching ? "animate-spin" : ""} size={16} />
              </Button>
            </div>

            {events.data?.reconnectRequired && (
              <p className="text-sm text-muted-foreground">
                Din åtkomst till {PROVIDER_LABELS[events.data.reconnectRequired]} behöver förnyas –
                koppla den igen.
              </p>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Från din kalender
              </p>
              {events.isLoading ? (
                <p className="text-sm text-muted-foreground">Hämtar …</p>
              ) : dayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inget inbokat den här dagen.</p>
              ) : (
                <ul className="space-y-1.5">
                  {dayEvents.map((ev) => (
                    <li
                      key={`${ev.provider}-${ev.id}`}
                      className="flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2 text-sm"
                    >
                      <span className="w-20 shrink-0 text-muted-foreground">
                        {ev.allDay || !ev.time
                          ? "Hela dagen"
                          : ev.endTime
                            ? `${ev.time}–${ev.endTime}`
                            : ev.time}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-ink">{ev.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {PROVIDER_LABELS[ev.provider]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}
