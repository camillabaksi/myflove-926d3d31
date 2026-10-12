import { useRef, useState } from "react";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { getDataOwner } from "@/lib/account-scope";
import { todayISO } from "@/lib/day";
import type { EnergySavedDetail } from "@/lib/energy-save-feedback";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/use-language";

/** Optional, explicit self-report. The small step is a labelled suggestion,
 * never an inferred measurement; neither factors nor the planner are written. */
export default function EnergyBatteryOffer({
  detail,
  onSaved,
  onCheckin,
}: {
  detail: EnergySavedDetail;
  onSaved: (synced: boolean) => void;
  onCheckin: () => void;
}) {
  const { t } = useLang();
  const capacityFor = useDayCapacity();
  const { logEnergyPercent } = useQuickCheckin();
  const current = capacityFor(todayISO()).percent;
  const baseline = useRef(current);
  const [draft, setDraft] = useState<number | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  const changed = draft != null && baseline.current !== current;
  const next =
    draft ??
    (current == null
      ? null
      : Math.max(0, Math.min(100, current + (detail.direction === "gives" ? 5 : -5))));
  const eligible = () => detail.owner === getDataOwner() && detail.date === todayISO();
  const save = async () => {
    if (saving.current || next == null || !eligible()) return;
    // A newer registration is never silently replaced by a stale proposal.
    if (changed) {
      setError(t("Din energi har uppdaterats. Välj nivå igen."));
      return;
    }
    saving.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await logEnergyPercent(next);
      if (eligible()) onSaved(result.synced);
    } catch {
      if (eligible()) setError(t("Det gick inte att spara. Ditt val finns kvar – försök igen."));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2 text-sm">
      <p>
        {detail.direction === "gives"
          ? t("Du har loggat något som gav energi.")
          : t("Du har loggat något som tog energi.")}
      </p>
      {current == null ? (
        <Button className="min-h-11 w-full" onClick={onCheckin}>
          {t("Uppdatera mitt batteri")}
        </Button>
      ) : (
        <>
          <p>
            {t("Ditt batteri är")}: {current} %. {t("Förslag på en liten ändring – du bestämmer.")}
          </p>
          {adjusting && (
            <label className="block space-y-2">
              {t("Min energi nu")}: {next} %
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={next ?? current}
                disabled={busy}
                aria-label={t("Min energi i procent")}
                className="min-h-11 w-full accent-primary"
                onChange={(e) => {
                  baseline.current = current;
                  setDraft(Number(e.target.value));
                  setError(null);
                }}
              />
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || changed}
              onClick={() => void save()}
              className="min-h-11 h-auto max-w-full whitespace-normal"
            >
              {busy ? t("Sparar…") : `${t("Uppdatera till")} ${next} %`}
            </Button>
            <Button
              disabled={busy}
              variant="outline"
              className="min-h-11"
              onClick={() => {
                baseline.current = current;
                setDraft(current);
                setAdjusting(true);
              }}
            >
              {t("Justera")}
            </Button>
          </div>
          {changed && <p role="status">{t("Din energi har uppdaterats. Välj nivå igen.")}</p>}
        </>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {t("Batteriet ändras bara om du godkänner. Återhämtning lägger inte till nya uppgifter.")}
      </p>
    </div>
  );
}
