import CapacitySelector from "@/components/capacity-selector";

/**
 * Hemsidans enda kapacitetskontroll.
 */
export default function CapacityPlanCard() {
  return (
    <div data-testid="capacity-plan">
      <CapacitySelector />
    </div>
  );
}
