import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * MyFlove-modal – kommer upp mjukt, mycket rundade hörn,
 * tydlig rubrik och samma knappmall som resten av appen.
 */
export function MyFloveModal({
  open,
  onOpenChange,
  title,
  emoji,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  emoji?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("rounded-3xl border-border/60 bg-card p-6 shadow-lifted", className)}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-ink">
            {emoji && <span aria-hidden className="mr-1.5">{emoji}</span>}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
        {footer && <div className="mt-2 flex flex-col gap-2">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
