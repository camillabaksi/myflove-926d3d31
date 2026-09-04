import Layout from "@/components/layout";
import NotesPanel from "@/components/notes-panel";
import { NotebookPen } from "lucide-react";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { useLang } from "@/hooks/use-language";

/**
 * Anteckningar & idébank – egen del under Flow.
 * Här bor tankar som bara får finnas, utan krav på åtgärd.
 */
export default function NotesPage() {
  const { t } = useLang();

  return (
    <Layout>
      <MyFlovePageGrid>
        <MyFloveWide>
          <header className="space-y-1">
            <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
              <NotebookPen className="h-7 w-7 text-primary" /> {t("Anteckningar")}
            </h1>
            <p className="text-muted-foreground">
              {t(
                "Din idébank. Skriv ner tankar utan deadline – och omvandla dem när du vill, eller flytta tillbaka dem till Quickflow.",
              )}
            </p>
          </header>
        </MyFloveWide>

        <MyFloveWide>
          <NotesPanel />
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
