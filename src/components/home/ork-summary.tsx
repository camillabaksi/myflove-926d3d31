import CapacitySelector from "@/components/capacity-selector";
import { orkWord } from "@/lib/ork-word";

/** Behålls som export för bakåtkompatibilitet. */
export { orkWord };

/**
 * Bakåtkompatibelt namn för den gemensamma kapacitetskontrollen.
 * Används på Mitt batteri för att skilja dagens val från historiken.
 */
export default function OrkSummary({ onCheckin }: { onCheckin?: () => void }) {
  return (
    <div data-testid="capacity-summary">
      <CapacitySelector onCheckin={onCheckin} />
    </div>
  );
}
