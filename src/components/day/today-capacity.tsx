import { useState } from "react";
import { Battery, Heart } from "lucide-react";
import { CapacityBattery } from "@/components/calendar/capacity-battery";
import SimpleCheckin from "@/components/simple-checkin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLang } from "@/hooks/use-language";
import { capacityTone } from "@/lib/day-capacity";

const capacityCopy = (percent: number) =>
  capacityTone(percent) === "low"
    ? "En dag med lite mindre kapacitet."
    : capacityTone(percent) === "middle"
      ? "Det här är vad du har att röra dig med idag."
      : "Det finns mer kapacitet att röra sig med idag.";

export function TodayCapacity({ percent }: { percent: number | null }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <>
      <section className="pace-surface rounded-3xl p-5" aria-labelledby="today-capacity-title">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p
              id="today-capacity-title"
              className="text-xs font-semibold uppercase text-muted-foreground"
            >
              {t("Din kapacitet idag")}
            </p>
            {percent === null ? (
              <>
                <h2 className="mt-1 font-sans text-[22px] font-semibold text-ink">
                  {t("Hur börjar du dagen?")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(
                    "Checka in när du vill för att se hur dagen passar det du har att röra dig med.",
                  )}
                </p>
              </>
            ) : (
              <>
                <CapacityBattery percent={percent} size="lg" className="mt-2 w-full max-w-md" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("Utifrån din egen registrering idag. Du kan checka in igen när det ändras.")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t(capacityCopy(percent))}</p>
              </>
            )}
          </div>
          {percent === null && (
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky text-primary"
              aria-hidden
            >
              <Battery size={20} />
            </span>
          )}
        </div>
        <Button
          variant="outline"
          className="mt-4 h-auto min-h-11 w-full whitespace-normal rounded-2xl sm:w-auto"
          onClick={() => setOpen(true)}
        >
          <Heart size={16} aria-hidden />
          <span className="min-w-0">{t("Logga energi & mående")}</span>
        </Button>
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] max-h-[42rem] w-[calc(100%-1rem)] max-w-md grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden rounded-3xl border border-border/70 bg-card p-0 pb-0 sm:p-0 sm:pb-0 [&>button]:right-3 [&>button]:top-[calc(0.5rem+env(safe-area-inset-top))] [&>button]:z-10 [&>button]:grid [&>button]:h-11 [&>button]:w-11 [&>button]:place-items-center [&>button]:rounded-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("Logga energi & mående")}</DialogTitle>
            <DialogDescription>{t("Din energi och ditt mående just nu.")}</DialogDescription>
          </DialogHeader>
          <SimpleCheckin
            source="idag-capacity"
            presentation="dialog"
            onSaved={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
