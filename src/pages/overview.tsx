import { Link } from "wouter";
import Layout from "@/components/layout";
import { APP_GUIDE } from "@/lib/app-guide";
import { ArrowLeft, ArrowRight } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";

/**
 * Översikt – en enkel sammanfattning av vad som finns i MyFlove
 * och vart man går för att göra respektive sak.
 */
export default function OverviewPage() {
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/idag"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} /> Till Idag
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl mt-2">
            Så funkar Paceable
          </h1>
          <p className="text-sm text-muted-foreground">
            Allt som finns i appen, kort förklarat. Du behöver inte använda allt – börja med det
            översta och lägg till när du vill.
          </p>
        </div>

        {APP_GUIDE.map((group) => (
          <CollapsibleSection
            key={group.id}
            id={`overview-${group.id}`}
            title={
              <span className="flex items-center gap-2">
                <span aria-hidden>{group.emoji}</span> {group.label}
              </span>
            }
            headingClassName="text-base font-semibold"
            className="pace-card-surface rounded-3xl border-2 border-border/60 bg-card p-5 shadow-soft"
          >
            <p className="mt-0.5 text-xs text-muted-foreground">{group.hint}</p>

            <ul className="mt-3 space-y-2">
              {group.entries.map((entry) => (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    className="group flex items-center gap-3 rounded-2xl bg-secondary/30 px-3 py-3 transition-colors hover:bg-secondary/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{entry.label}</span>
                      <span className="block text-xs text-muted-foreground">{entry.what}</span>
                    </span>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        ))}
      </div>
    </Layout>
  );
}
