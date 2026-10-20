import Layout from "@/components/layout";
import { PacePageHeader } from "@/components/paceable/page-header";
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
      <MyFlovePageGrid className="pace-ds pace-compact-page">
        <MyFloveWide>
          <PacePageHeader icon={NotebookPen} title={t("Anteckningar")}
            description={t(
                "Din idébank. Skriv ner tankar utan deadline – och omvandla dem när du vill, eller flytta tillbaka dem till Fånga.",
              )} />
        </MyFloveWide>

        <MyFloveWide>
          <NotesPanel />
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
