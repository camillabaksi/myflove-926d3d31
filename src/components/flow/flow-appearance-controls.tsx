import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlowAppearance } from "@/hooks/use-my-flow";

type Choice<T extends string> = { value: T; label: string; image?: string };

export function AppearanceChoice<T extends string>({ title, value, options, onChange }: {
  title: string;
  value: T;
  options: Choice<T>[];
  onChange: (value: T) => void;
}) {
  return <fieldset className="space-y-2">
    <legend className="font-semibold text-foreground">{title}</legend>
    <div className="grid grid-cols-3 gap-2">
      {options.map(option => <Button key={option.value} type="button" variant="outline" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={`h-auto min-h-16 min-w-0 flex-col gap-1 whitespace-normal rounded-2xl p-2 text-center text-xs ${value === option.value ? "border-primary bg-secondary ring-1 ring-ring" : "bg-card"}`}>
        {option.image ? <img src={option.image} alt="" className="h-12 w-12 object-contain" loading="lazy" /> : value === option.value ? <Check className="size-4 text-primary" /> : null}
        <span className="break-words">{option.label}</span>
      </Button>)}
    </div>
  </fieldset>;
}

export type AppearanceUpdate = <K extends keyof FlowAppearance>(key: K, value: FlowAppearance[K]) => void;