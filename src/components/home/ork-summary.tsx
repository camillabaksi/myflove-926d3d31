import { Link } from "wouter";
import CapacitySelector from "@/components/capacity-selector";
import { useLang } from "@/hooks/use-language";
import { orkWord } from "@/lib/ork-word";

/** Behålls som export för bakåtkompatibilitet. */
export { orkWord };

/**
 * Bakåtkompatibelt namn för den gemensamma kapacitetskontrollen.
 * Används på Mitt batteri för att skilja dagens val från historiken.
 */
export default function OrkSummary() {
  const { t } = useLang();

  return (
    <div data-testid="capacity-summary">
      <CapacitySelector title="Dagens kapacitet" />
      <Link href="/historik" className="mt-2 inline-block text-xs font-semibold text-primary">
        {t("Se historik & mönster")}
      </Link>
    </div>
  );
}
