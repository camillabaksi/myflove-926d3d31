import { createFileRoute } from "@tanstack/react-router";
import CollapsibleSection from "@/components/collapsible-section";

export const Route = createFileRoute("/tmp-collapse-test")({
  component: TmpCollapseTest,
});

function TmpCollapseTest() {
  return (
    <div className="p-6">
      <CollapsibleSection id="tmp::test" title="Testsektion">
        <p data-testid="body">Innehåll</p>
      </CollapsibleSection>
    </div>
  );
}
