import { useState } from "react";
import { Settings2, Check } from "lucide-react";
import { toast } from "sonner";
import { useNpfSettings } from "@/lib/npf-mode";
import { useViewMode } from "@/lib/view-mode";
import { settingForStrategy } from "@/lib/insight-settings";

/**
 * Gör en strategi konkret: slår på de inställningar som redan finns i appen
 * i stället för att bara beskriva dem. Går alltid att ändra i Inställningar.
 */
export default function InsightApplySetting({ strategyId }: { strategyId: string }) {
  const setting = settingForStrategy(strategyId);
  const { update } = useNpfSettings();
  const { setMode } = useViewMode("myflow");
  const [done, setDone] = useState(false);

  if (!setting) return null;

  const apply = () => {
    if (setting.npf) update(setting.npf);
    if (setting.simpleView) setMode("forenklad");
    setDone(true);
    toast.success("Inställningen är påslagen. Du kan ändra den när du vill.");
  };

  return (
    <div className="mt-3 rounded-xl bg-muted/50 p-3 text-sm">
      <p className="text-muted-foreground">{setting.label}</p>
      {done ? (
        <p className="mt-2 flex items-center gap-1.5 font-medium text-primary">
          <Check size={15} /> Påslaget
        </p>
      ) : (
        <button
          type="button"
          onClick={apply}
          className="press mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
        >
          <Settings2 size={15} /> Slå på åt mig
        </button>
      )}
    </div>
  );
}
