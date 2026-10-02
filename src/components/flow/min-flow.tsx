import { Link } from "@tanstack/react-router";
import { MessageCircle, Palette, Heart, BookHeart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowRoom } from "@/components/flow/flow-room";

const actions = [
  { title: "Prata med Flow", to: "/assistant", icon: MessageCircle },
  { title: "Anpassa Flow", to: "/flow-anpassa", icon: Palette },
  { title: "Det här vet Flow om mig", to: "/flow-minnen", icon: Heart },
  { title: "Min samling", to: "/flow-samling", icon: BookHeart },
] as const;

export function MinFlow() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-1 pb-8 sm:px-4" aria-label="Min Flow">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold text-foreground">Min Flow <Heart className="inline size-6 fill-primary text-primary" aria-label="hjärta" /></h1>
        <p className="text-muted-foreground">En plats för dig, med dig.</p>
      </header>
      <FlowRoom />
      <p className="text-center text-sm text-muted-foreground">Din Flow är redan här för dig. Du kan göra platsen till din, i din egen takt.</p>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ title, to, icon: Icon }) => (
          <Button key={to} asChild variant="outline" className="h-auto min-h-28 min-w-0 items-start justify-between whitespace-normal rounded-3xl border-border bg-card p-4 text-left shadow-soft hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring">
            <Link to={to} className="flex flex-col gap-2">
              <Icon className="size-6 shrink-0 text-primary" aria-hidden="true" />
              <span className="flex w-full items-end justify-between gap-1 font-semibold leading-snug"><span className="min-w-0 break-words">{title}</span><ArrowRight className="size-4 shrink-0 text-primary" aria-hidden="true" /></span>
            </Link>
          </Button>
        ))}
      </div>
    </main>
  );
}