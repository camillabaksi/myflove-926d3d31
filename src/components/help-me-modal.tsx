import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HELP_FEELING_OPTIONS, type HelpFeelingId } from "@/lib/help-me";

interface HelpMeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFeeling: (feeling: HelpFeelingId) => void;
}

export default function HelpMeModal({ open, onOpenChange, onSelectFeeling }: HelpMeModalProps) {
  const [selected, setSelected] = useState<HelpFeelingId | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelected(null);
    onOpenChange(next);
  };

  const handleSelect = (feeling: HelpFeelingId) => {
    setSelected(feeling);
    onSelectFeeling(feeling);
    setSelected(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Hur mår du just nu?</DialogTitle>
          <DialogDescription>
            Ingen press. Berätta hur det känns, så gör jag idag lite lättare att överblicka.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {HELP_FEELING_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              disabled={selected !== null}
              className="w-full text-left p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all font-medium"
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => handleOpenChange(false)}
          className="w-full rounded-xl h-12"
        >
          Ingen av delarna, stäng bara
        </Button>
      </DialogContent>
    </Dialog>
  );
}
