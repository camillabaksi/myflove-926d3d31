import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  calendarConnectionStatus,
  completeCalendarConnect,
  disconnectCalendar,
  listExternalEvents,
  pushEventToCalendar,
  removeExternalEvent,
  type CalendarProvider,
  type ExternalEvent,
} from "@/lib/calendar-connect.functions";

export type { CalendarProvider, ExternalEvent };

const CONNECTOR_IDS: Record<CalendarProvider, string> = {
  google: "google_calendar",
  outlook: "microsoft_outlook",
};

export const PROVIDER_LABELS: Record<CalendarProvider, string> = {
  google: "Google Kalender",
  outlook: "Outlook",
};

/** Väntar på att popup-fönstret ska bli klart och lämna tillbaka sin engångskod. */
function waitForOAuthCompletion(popup: Window, connectorId: string) {
  return new Promise<string | null>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; connectorId?: string; code?: string } | null;
      const type = data?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed") ||
        (data?.connectorId && data.connectorId !== connectorId)
      ) {
        return;
      }
      cleanup();
      if (type === "appUserConnectorOAuthComplete") {
        resolve(typeof data?.code === "string" ? data.code : null);
        return;
      }
      popup.close();
      reject(new Error("Kopplingen blev inte klar."));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("Fönstret stängdes innan kopplingen blev klar."));
    }, 500);
  });
}

export function useCalendarConnection() {
  const qc = useQueryClient();

  const status = useQuery({
    queryKey: ["calendar-connection"],
    queryFn: () => calendarConnectionStatus(),
    staleTime: 60_000,
  });

  const connect = useMutation({
    mutationFn: async (provider: CalendarProvider) => {
      const popup = window.open("", "myflove-kalender", "width=600,height=720");
      if (!popup) throw new Error("Popup blockerades. Tillåt popup-fönster och försök igen.");
      let code: string | null;
      try {
        const { startCalendarConnect } = await import("@/lib/calendar-connect.functions");
        const { authorizationUrl } = await startCalendarConnect({ data: { provider } });
        const completion = waitForOAuthCompletion(popup, CONNECTOR_IDS[provider]);
        popup.location.href = authorizationUrl;
        code = await completion;
      } catch (error) {
        popup.close();
        throw error;
      }
      if (code) await completeCalendarConnect({ data: { code, provider } });
      return provider;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["calendar-connection"] });
      void qc.invalidateQueries({ queryKey: ["calendar-external-events"] });
    },
  });

  const disconnect = useMutation({
    mutationFn: (provider: CalendarProvider) => disconnectCalendar({ data: { provider } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["calendar-connection"] });
      void qc.invalidateQueries({ queryKey: ["calendar-external-events"] });
    },
  });

  const anyConnected = Boolean(status.data?.google || status.data?.outlook);

  return { status, connect, disconnect, anyConnected };
}

/** Händelser från de kopplade kalendrarna i ett datumintervall. */
export function useExternalEvents(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: ["calendar-external-events", from, to],
    queryFn: () => listExternalEvents({ data: { from, to } }),
    enabled: enabled && Boolean(from && to),
    staleTime: 60_000,
  });
}

/** Skickar en aktivitet till den kopplade kalendern. */
export function usePushToCalendar() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: {
      provider: CalendarProvider;
      title: string;
      date: string;
      time?: string;
      endTime?: string;
      externalId?: string;
    }) => pushEventToCalendar({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-external-events"] }),
  });

  const push = useCallback(
    (input: Parameters<typeof mutation.mutateAsync>[0]) => mutation.mutateAsync(input),
    [mutation],
  );

  return { push, pushing: mutation.isPending };
}

export function useRemoveExternalEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { provider: CalendarProvider; externalId: string }) =>
      removeExternalEvent({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-external-events"] }),
  });
}
