import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Lock, Trash2, Users, RefreshCw, Mail } from "lucide-react";
import Layout from "@/components/layout";
import { PacePageHeader } from "@/components/paceable/page-header";
import { useIsAdmin } from "@/hooks/use-is-admin";
import {
  listTesterApplicationsFn,
  updateTesterApplicationFn,
  deleteTesterApplicationFn,
  retryTesterApplicationEmailsFn,
  type TesterApplication,
} from "@/lib/tester-recruitment.functions";

const platformLabels: Record<TesterApplication["platform"], string> = {
  android: "Android",
  ios: "iPhone / iPad",
  both: "Android + iPhone",
  web: "Webb",
};
const participationLabels: Record<TesterApplication["participation"], string> = {
  technical: "Teknik",
  everyday: "Vardagsfeedback",
  both: "Båda",
};
const focusLabels: Record<TesterApplication["focus"], string> = {
  planning: "Planering",
  energy: "Energi / batteri",
  capture: "Fånga",
  recovery: "Återhämtning",
  overview: "Vardagsöverblick",
  general: "Allmänt",
};
const statusLabels: Record<TesterApplication["status"], string> = {
  new: "Ny anmälan",
  invited: "Inbjuden",
  testing: "Testar",
  complete: "Avslutad",
};

export default function AdminTesterApplications() {
  const { isAdmin, loading } = useIsAdmin();
  if (loading)
    return (
      <Layout>
        <p className="p-6 text-muted-foreground">Laddar…</p>
      </Layout>
    );
  if (!isAdmin)
    return (
      <Layout>
        <div className="mx-auto max-w-md space-y-3 py-16 text-center">
          <Lock size={36} className="mx-auto" />
          <h1 className="text-2xl font-semibold">Endast för grundaren</h1>
          <p className="text-muted-foreground">Den här sidan är privat.</p>
        </div>
      </Layout>
    );
  return (
    <Layout>
      <TesterList />
    </Layout>
  );
}

function TesterList() {
  const queryClient = useQueryClient();
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mailResult, setMailResult] = useState("");
  const applications = useQuery({
    queryKey: ["admin-tester-applications"],
    queryFn: () => listTesterApplicationsFn(),
    retry: false,
  });
  const update = useMutation({
    mutationFn: (data: { id: string; status: TesterApplication["status"] }) =>
      updateTesterApplicationFn({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tester-applications"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteTesterApplicationFn({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tester-applications"] }),
  });
  const retryMail = useMutation({
    mutationFn: (id: string) => retryTesterApplicationEmailsFn({ data: { id } }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tester-applications"] });
      if (!result.configured) {
        setMailResult(
          "Automatiska mejl är inte aktiverade ännu. Verifiera paceable.se hos Resend och lägg in RESEND_API_KEY som serverhemlighet i Lovable.",
        );
      } else if (result.failed) {
        setMailResult(
          "Mejlstatus är osäker. Kontrollera utskicket manuellt före nytt försök, så att inget mejl skickas dubbelt.",
        );
      } else {
        setMailResult(
          "Saknade mejl har tagits emot av mejltjänsten. Det bekräftar inte leverans till inkorgen.",
        );
      }
    },
    onError: () => setMailResult("Kunde inte kontrollera eller skicka mejlen just nu."),
  });
  const rows = applications.data ?? [];
  const shown = rows.filter(
    (row) =>
      (platformFilter === "all" ||
        row.platform === platformFilter ||
        (platformFilter === "android" && row.platform === "both") ||
        (platformFilter === "ios" && row.platform === "both")) &&
      (statusFilter === "all" || row.status === statusFilter),
  );
  const summary = [
    { label: "Nya", count: rows.filter((row) => row.status === "new").length },
    { label: "Inbjudna", count: rows.filter((row) => row.status === "invited").length },
    { label: "Testar", count: rows.filter((row) => row.status === "testing").length },
    { label: "Avslutade", count: rows.filter((row) => row.status === "complete").length },
  ];
  return (
    <div className="pace-ds pace-compact-page mx-auto max-w-5xl space-y-5">
      <header className="space-y-2">
        <Link
          to="/admin"
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          Till adminöversikten
        </Link>
        <PacePageHeader
          icon={Users}
          title="Intresseanmälningar – testare"
          description="Separat från registrerade konton och appstatistik. Bara administratörer har tillgång till kontaktuppgifterna."
        />
      </header>
      <section aria-label="Testarstatus" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {summary.map(({ label, count }) => (
          <div key={label} className="rounded-2xl border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">{count}</p>
          </div>
        ))}
      </section>
      <p className="text-sm text-muted-foreground">
        Totalt {rows.length} intresseanmälningar. Statusen ändras manuellt och betyder inte att
        testaren är verifierad i Google Play eller TestFlight.
      </p>
      <p className="text-xs leading-5 text-muted-foreground">
        Antalen visar bara intresseanmälningar. De verifierar inte Googles krav på 12 aktiva testare
        under 14 dagar.
      </p>
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Enhet
            <select
              className="ml-2 min-h-10 rounded-lg border bg-background px-2"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="all">Alla</option>
              <option value="android">Android</option>
              <option value="ios">iPhone</option>
              <option value="web">Webb</option>
            </select>
          </label>
          <label className="text-sm">
            Status
            <select
              className="ml-2 min-h-10 rounded-lg border bg-background px-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Alla</option>
              {Object.entries(statusLabels).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm"
            onClick={() => void applications.refetch()}
            disabled={applications.isFetching}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Uppdatera
          </button>
        </div>
        {mailResult && (
          <p role="status" className="mt-3 rounded-xl bg-secondary/70 p-3 text-sm">
            {mailResult}
          </p>
        )}
        {applications.isLoading ? (
          <p className="py-6 text-sm text-muted-foreground">Laddar anmälningar…</p>
        ) : applications.isError ? (
          <p className="py-6 text-sm text-destructive" role="alert">
            Kunde inte hämta anmälningarna. Kontrollera att databasändringen har körts.
          </p>
        ) : shown.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Inga anmälningar i det här urvalet ännu.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {shown.map((row) => (
              <article
                key={row.id}
                className="rounded-xl border border-border/80 bg-background/80 p-3 sm:p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <h2 className="break-all text-sm font-semibold leading-5">{row.email}</h2>
                    <p className="text-xs text-muted-foreground">
                      {platformLabels[row.platform]} · {participationLabels[row.participation]} ·{" "}
                      {focusLabels[row.focus]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.feedback_willing ? "Kan lämna feedback" : "Ingen feedback utlovad"} ·{" "}
                      {new Date(row.created_at).toLocaleDateString("sv-SE")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mejltjänst:{" "}
                      {row.confirmation_accepted_at ? "bekräftelse mottagen" : "bekräftelse saknas"}{" "}
                      · {row.admin_notice_accepted_at ? "avisering mottagen" : "avisering saknas"}
                    </p>
                  </div>
                  <a
                    className="inline-flex min-h-9 w-fit items-center gap-2 rounded-full border px-3 text-xs hover:bg-secondary"
                    href={`mailto:${row.email}`}
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" /> Kontakta
                  </a>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                  <label className="text-xs" htmlFor={`tester-status-${row.id}`}>
                    Status
                  </label>
                  <select
                    id={`tester-status-${row.id}`}
                    className="min-h-9 rounded-lg border bg-card px-2 text-sm"
                    value={row.status}
                    onChange={(e) =>
                      update.mutate({
                        id: row.id,
                        status: e.target.value as TesterApplication["status"],
                      })
                    }
                    disabled={update.isPending}
                  >
                    {Object.entries(statusLabels).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {(!row.confirmation_accepted_at || !row.admin_notice_accepted_at) && (
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center gap-1 rounded-full border px-3 text-xs hover:bg-secondary disabled:opacity-50"
                      disabled={retryMail.isPending}
                      onClick={() => {
                        setMailResult("");
                        retryMail.mutate(row.id);
                      }}
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" /> Skicka saknade mejl
                    </button>
                  )}
                  <button
                    type="button"
                    className="ml-auto inline-flex min-h-10 items-center gap-1 px-2 text-xs text-destructive disabled:opacity-50"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm("Radera denna testanmälan och mejladressen permanent?"))
                        remove.mutate(row.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Radera
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Mejlstatus betyder att leverantören tagit emot utskicket, inte att det säkert nått
          mottagarens inkorg.
        </p>
        {(update.isError || remove.isError) && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            Ändringen kunde inte sparas. Försök igen.
          </p>
        )}
        {rows.length === 500 && (
          <p className="mt-3 text-xs text-destructive">Visar endast 500 senaste anmälningar.</p>
        )}
      </section>
    </div>
  );
}
