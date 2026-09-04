import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { useIsAdmin } from "@/hooks/use-is-admin";
import {
  listAllFrictionItemsFn,
  updateFrictionStatusFn,
  deleteFrictionItemFn,
  listUsersWithRolesFn,
  grantRoleFn,
  revokeRoleFn,
} from "@/lib/admin.functions";
import {
  Lock,
  Shield,
  ShieldOff,
  Trash2,
  MessageSquareWarning,
  Users as UsersIcon,
  FileDown,
  ArrowUp,
  ArrowDown,
  PlayCircle,
} from "lucide-react";
import ChangelogExport from "@/components/changelog-export";
import type { AdminUserRow } from "@/lib/admin.functions";

const STATUS_LABELS: Record<string, string> = {
  open: "Öppen",
  planned: "Planerad",
  in_progress: "Pågår",
  done: "Klar",
  wontfix: "Avvisad",
};

const STATUS_OPTIONS = ["open", "planned", "in_progress", "done", "wontfix"] as const;

export default function AdminPage() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [tab, setTab] = useState<"friction" | "users" | "changelog">("friction");

  if (adminLoading) {
    return (
      <Layout>
        <p className="text-muted-foreground">Laddar…</p>
      </Layout>
    );
  }
  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center space-y-3 py-16">
          <Lock size={40} className="mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-serif font-bold">Endast för grundaren</h1>
          <p className="text-muted-foreground">Denna sida kräver admin-behörighet.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold">Adminöversikt</h1>
            <p className="text-muted-foreground">Hantera feedback, roller och åtkomst.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin-statistik"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <BarChart3 size={16} /> Appstatistik
            </Link>
            <Link
              to="/pitch"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <PlayCircle size={16} /> Pitchmaterial
            </Link>
          </div>
        </header>

        <div className="flex gap-2 border-b border-border">
          <TabBtn
            active={tab === "friction"}
            onClick={() => setTab("friction")}
            icon={<MessageSquareWarning size={16} />}
          >
            Feedback
          </TabBtn>
          <TabBtn
            active={tab === "users"}
            onClick={() => setTab("users")}
            icon={<UsersIcon size={16} />}
          >
            Användare & roller
          </TabBtn>
          <TabBtn
            active={tab === "changelog"}
            onClick={() => setTab("changelog")}
            icon={<FileDown size={16} />}
          >
            Changelog
          </TabBtn>
        </div>

        {tab === "friction" ? (
          <FrictionSection />
        ) : tab === "users" ? (
          <UsersSection />
        ) : (
          <ChangelogExport />
        )}
      </div>
    </Layout>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function FrictionSection() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-friction"],
    queryFn: () => listAllFrictionItemsFn(),
    retry: false,
  });

  const updateStatus = useMutation({
    mutationFn: (v: { id: string; status: (typeof STATUS_OPTIONS)[number] }) =>
      updateFrictionStatusFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-friction"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteFrictionItemFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-friction"] }),
  });

  if (isLoading) return <p className="text-muted-foreground">Laddar rapporter…</p>;
  if (isError) return <p className="text-destructive text-sm">Fel: {(error as Error).message}</p>;
  if (!data || data.length === 0)
    return <p className="text-muted-foreground">Inga rapporter ännu.</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{data.length} rapporter totalt</p>
      {data.map((item) => (
        <div key={item.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif font-semibold text-lg">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {item.description}
                </p>
              )}
            </div>
            <span className="text-xs bg-secondary rounded-full px-2 py-0.5 whitespace-nowrap">
              👍 {item.vote_count}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {item.category && (
              <span className="rounded-full bg-muted px-2 py-0.5">{item.category}</span>
            )}
            {item.impact != null && <span>Effekt: {item.impact}</span>}
            {item.frequency != null && <span>Frekvens: {item.frequency}</span>}
            {item.mental_load != null && <span>Mental last: {item.mental_load}</span>}
            <span>Från: {item.reporter_email ?? item.reporter_id.slice(0, 8)}</span>
            <span>{new Date(item.created_at).toLocaleString("sv-SE")}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-muted-foreground">Status:</label>
            <select
              value={item.status}
              onChange={(e) =>
                updateStatus.mutate({
                  id: item.id,
                  status: e.target.value as (typeof STATUS_OPTIONS)[number],
                })
              }
              disabled={updateStatus.isPending}
              className="rounded-lg border border-border bg-background text-sm px-2 py-1"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (confirm(`Ta bort rapport "${item.title}"?`)) remove.mutate(item.id);
              }}
              disabled={remove.isPending}
              className="ml-auto flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
            >
              <Trash2 size={14} /> Ta bort
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SortKey = "name" | "last_visit" | "last_login" | "created";
type SortDir = "asc" | "desc";

function UsersSection() {
  const qc = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("last_login");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const filter = { ...(from ? { from } : {}), ...(to ? { to } : {}) };
  const hasFilter = Boolean(from || to);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users", from, to],
    queryFn: () => listUsersWithRolesFn(hasFilter ? { data: filter } : undefined),
    retry: false,
  });

  const grant = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "user" }) => grantRoleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  const revoke = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "user" }) => revokeRoleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sorted = data ? [...data].sort(sortUsers(sortKey, sortDir)) : [];

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
      <label className="text-xs text-muted-foreground">
        Från
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="mt-1 block rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </label>
      <label className="text-xs text-muted-foreground">
        Till
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="mt-1 block rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </label>
      {hasFilter && (
        <button
          type="button"
          onClick={() => {
            setFrom("");
            setTo("");
          }}
          className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary"
        >
          Rensa filter
        </button>
      )}
      <p className="ml-auto text-xs text-muted-foreground">
        Filtret gäller besök, inloggning och registrering.
      </p>
    </div>
  );

  if (isLoading)
    return (
      <div className="space-y-3">
        {filterBar}
        <p className="text-muted-foreground">Laddar användare…</p>
      </div>
    );
  if (isError)
    return (
      <div className="space-y-3">
        {filterBar}
        <p className="text-destructive text-sm">Fel: {(error as Error).message}</p>
      </div>
    );
  if (!data || data.length === 0)
    return (
      <div className="space-y-3">
        {filterBar}
        <p className="text-muted-foreground">Inga användare i vald period.</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {filterBar}
      <p className="text-sm text-muted-foreground">{data.length} användare</p>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <SortHeader
                active={sortKey === "name"}
                dir={sortDir}
                onClick={() => handleSort("name")}
              >
                Namn
              </SortHeader>
              <th className="p-3">Senast aktiv</th>
              <SortHeader
                active={sortKey === "last_login"}
                dir={sortDir}
                onClick={() => handleSort("last_login")}
              >
                Senaste inloggning
              </SortHeader>
              <SortHeader
                active={sortKey === "created"}
                dir={sortDir}
                onClick={() => handleSort("created")}
              >
                Skapad
              </SortHeader>
              <th className="p-3">Roller</th>
              <th className="p-3 text-right">Åtgärd</th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((u) => {
              const isAdminRow = u.roles.includes("admin");
              return (
                <tr key={u.user_id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium">{u.name ?? u.email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {fmtDateTime(u.last_visit_at)}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {fmtDateTime(u.last_sign_in_at)}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString("sv-SE") : "—"}
                  </td>

                  <td className="p-3">
                    {u.roles.length === 0 ? (
                      <span className="text-xs text-muted-foreground">användare</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`text-xs rounded-full px-2 py-0.5 ${
                              r === "admin" ? "bg-primary/15 text-primary" : "bg-secondary"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {isAdminRow ? (
                      <button
                        onClick={() => {
                          if (confirm(`Ta bort admin-roll från ${u.email}?`))
                            revoke.mutate({ userId: u.user_id, role: "admin" });
                        }}
                        disabled={revoke.isPending}
                        className="inline-flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
                      >
                        <ShieldOff size={14} /> Ta bort admin
                      </button>
                    ) : (
                      <button
                        onClick={() => grant.mutate({ userId: u.user_id, role: "admin" })}
                        disabled={grant.isPending}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                      >
                        <Shield size={14} /> Gör till admin
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <th className="p-3">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        {children}
        {active && (dir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
      </button>
    </th>
  );
}

function sortUsers(key: SortKey, dir: SortDir) {
  const mult = dir === "asc" ? 1 : -1;
  return (a: AdminUserRow, b: AdminUserRow) => {
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = (a.name ?? a.email ?? "").localeCompare(b.name ?? b.email ?? "", "sv");
        break;
      case "last_visit":
        cmp = (a.last_visit_at ?? "").localeCompare(b.last_visit_at ?? "");
        break;
      case "last_login":
        cmp = (a.last_sign_in_at ?? "").localeCompare(b.last_sign_in_at ?? "");
        break;
      case "created":
        cmp = (a.created_at ?? "").localeCompare(b.created_at ?? "");
        break;
    }
    return cmp * mult;
  };
}
