import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLang } from "@/hooks/use-language";
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
  BarChart3,
  Briefcase,
} from "lucide-react";
import ChangelogExport from "@/components/changelog-export";
import UserAnalytics from "@/components/admin/user-analytics";
import InvestorDocs from "@/components/admin/investor-docs";
import RegistrationPlatformSummary from "@/components/admin/registration-platform-summary";
import { REGISTRATION_PLATFORM_LABELS, type RegistrationPlatform } from "@/lib/registration-platform";
import { isActiveAccount } from "@/lib/account-activity";

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
  const { t } = useLang();
  const [tab, setTab] = useState<"friction" | "users" | "investor" | "changelog">("friction");

  if (adminLoading) {
    return (
      <Layout>
        <p className="text-muted-foreground">{t("Laddar…")}</p>
      </Layout>
    );
  }
  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center space-y-3 py-16">
          <Lock size={40} className="mx-auto text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            {t("Endast för grundaren")}
          </h1>
          <p className="text-muted-foreground">{t("Denna sida kräver admin-behörighet.")}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-w-0 max-w-5xl mx-auto space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              {t("Adminöversikt")}
            </h1>
            <p className="text-muted-foreground">{t("Hantera feedback, roller och åtkomst.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin-statistik"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <BarChart3 size={16} /> {t("Appstatistik")}
            </Link>
            <Link
              to="/pitch"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <PlayCircle size={16} /> {t("Pitchmaterial")}
            </Link>
          </div>
        </header>

        <UserAnalytics />

        <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto border-b border-border">
          <TabBtn
            active={tab === "friction"}
            onClick={() => setTab("friction")}
            icon={<MessageSquareWarning size={16} />}
          >
            {t("Feedback")}
          </TabBtn>
          <TabBtn
            active={tab === "users"}
            onClick={() => setTab("users")}
            icon={<UsersIcon size={16} />}
          >
            {t("Användare & roller")}
          </TabBtn>
          <TabBtn
            active={tab === "investor"}
            onClick={() => setTab("investor")}
            icon={<Briefcase size={16} />}
          >
            {t("Pitch & Investor")}
          </TabBtn>
          <TabBtn
            active={tab === "changelog"}
            onClick={() => setTab("changelog")}
            icon={<FileDown size={16} />}
          >
            {t("Changelog")}
          </TabBtn>
        </div>

        {tab === "friction" ? (
          <FrictionSection />
        ) : tab === "users" ? (
          <UsersSection />
        ) : tab === "investor" ? (
          <InvestorDocs />
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
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap [overflow-wrap:normal] [&>svg]:shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition ${
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
  const { t, locale } = useLang();
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

  if (isLoading) return <p className="text-muted-foreground">{t("Laddar rapporter…")}</p>;
  if (isError)
    return (
      <p className="text-destructive text-sm">
        {t("Fel:")} {(error as Error).message}
      </p>
    );
  if (!data || data.length === 0)
    return <p className="text-muted-foreground">{t("Inga rapporter ännu.")}</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {data.length} {t("rapporter totalt")}
      </p>
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
            {item.impact != null && (
              <span>
                {t("Effekt:")} {item.impact}
              </span>
            )}
            {item.frequency != null && (
              <span>
                {t("Frekvens:")} {item.frequency}
              </span>
            )}
            {item.mental_load != null && (
              <span>
                {t("Mental last:")} {item.mental_load}
              </span>
            )}
            <span>
              {t("Från:")} {item.reporter_email ?? item.reporter_id.slice(0, 8)}
            </span>
            <span>{new Date(item.created_at).toLocaleString(locale)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-muted-foreground">{t("Status:")}</label>
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
                  {t(STATUS_LABELS[s])}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (confirm(t('Ta bort rapport "{title}"?').replace("{title}", item.title)))
                  remove.mutate(item.id);
              }}
              disabled={remove.isPending}
              className="ml-auto flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
            >
              <Trash2 size={14} /> {t("Ta bort")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function fmtDateTime(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SortKey = "name" | "last_visit" | "last_login" | "created" | "roles";
type SortDir = "asc" | "desc";

export function UsersSection() {
  const { t, locale } = useLang();
  const qc = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("last_login");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [platform, setPlatform] = useState<RegistrationPlatform | "all">("all");
  const [includeInactive, setIncludeInactive] = useState(false);
  const filter = { ...(from ? { from } : {}), ...(to ? { to } : {}) };
  const hasFilter = Boolean(from || to);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users", "observed-activity", from, to],
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

  const active = (data ?? []).filter(user => isActiveAccount(user.last_visit_at));
  const scoped = includeInactive ? data ?? [] : active;
  const sorted = scoped.filter(user => platform === "all" || (user.registration_platform ?? "unknown") === platform).sort(sortUsers(sortKey, sortDir));

  const filterBar = (
    <div className="pace-card-surface flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
      <label className="w-full min-w-0 text-xs text-muted-foreground sm:w-auto">
        {t("Från")}
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </label>
      <label className="w-full min-w-0 text-xs text-muted-foreground sm:w-auto">
        {t("Till")}
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
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
          {t("Rensa filter")}
        </button>
      )}
      <p className="ml-auto text-xs text-muted-foreground">
        {t("Filtret gäller besök, inloggning och registrering.")}
      </p>
    </div>
  );

  if (isLoading)
    return (
      <div className="space-y-3">
        {filterBar}
        <p className="text-muted-foreground">{t("Laddar användare…")}</p>
      </div>
    );
  if (isError)
    return (
      <div className="space-y-3">
        {filterBar}
        <p className="text-destructive text-sm">
          {t("Fel:")} {(error as Error).message}
        </p>
      </div>
    );
  if (!data)
    return (
      <div className="space-y-3">
        {filterBar}
        <p className="text-muted-foreground">{t("Inga användare i vald period.")}</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {filterBar}
      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={includeInactive} onChange={event => setIncludeInactive(event.target.checked)} />
          {t("Visa även inaktiva konton")}
        </label>
        <p className="text-xs text-muted-foreground">{t("Aktiv betyder användning eller inloggning de senaste 30 dagarna. Konton utan registrerad aktivitet döljs också. Inga konton raderas.")}</p>
        <p className="text-sm" aria-live="polite">{includeInactive ? t("Alla konton visas") : t("Visar aktiva senaste 30 dagarna")} · {scoped.length} / {data.length}</p>
      </div>
      <RegistrationPlatformSummary users={scoped} value={platform} onChange={setPlatform} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {sorted.length} {t("användare")}{platform !== "all" && ` · ${t(REGISTRATION_PLATFORM_LABELS[platform])}`}
      </p>
      {sorted.length === 0 && <p className="text-sm text-muted-foreground">{t("Inga användare med valda filter.")}</p>}
      <div className="space-y-3 md:hidden">
        <div className="grid items-end gap-2 sm:flex sm:flex-wrap">
          <label className="min-w-0 flex-1 text-xs text-muted-foreground">
            {t("Sortera efter")}
            <select
              value={sortKey}
              onChange={(e) => handleSort(e.target.value as SortKey)}
              className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="name">{t("Namn")}</option>
              <option value="last_visit">{t("Senast aktiv")}</option>
              <option value="last_login">{t("Senaste inloggning")}</option>
              <option value="created">{t("Skapad")}</option>
              <option value="roles">{t("Roller")}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => handleSort(sortKey)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
          >
            {sortDir === "asc" ? (
              <ArrowUp size={16} aria-hidden="true" />
            ) : (
              <ArrowDown size={16} aria-hidden="true" />
            )}
            {t(sortDir === "asc" ? "Stigande" : "Fallande")}
          </button>
        </div>
        {sorted.map((u) => (
          <article
            key={u.user_id}
            className="min-w-0 rounded-2xl border border-border bg-card p-4 space-y-4"
          >
            <div className="min-w-0 space-y-1">
              <h3 className="font-medium [overflow-wrap:anywhere]">{u.name ?? u.email ?? "—"}</h3>
              <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                {u.email ?? "—"}
              </p>
              <UserRoleBadges roles={u.roles} />
            </div>
            <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
              {[
                [t("Konto skapat via"), t(REGISTRATION_PLATFORM_LABELS[u.registration_platform ?? "unknown"])],
                [t("Senast aktiv"), fmtDateTime(u.last_visit_at, locale)],
                [t("Senaste inloggning"), fmtDateTime(u.last_sign_in_at, locale)],
                [
                  t("Skapad"),
                  u.created_at ? new Date(u.created_at).toLocaleDateString(locale) : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 [overflow-wrap:normal]">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-sm break-normal">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-border pt-3">
              <UserRoleAction
                user={u}
                pending={grant.isPending || revoke.isPending}
                onGrant={() => grant.mutate({ userId: u.user_id, role: "admin" })}
                onRevoke={() => revoke.mutate({ userId: u.user_id, role: "admin" })}
              />
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <SortHeader
                active={sortKey === "name"}
                dir={sortDir}
                onClick={() => handleSort("name")}
              >
                {t("Namn")}
              </SortHeader>
              <SortHeader
                active={sortKey === "last_visit"}
                dir={sortDir}
                onClick={() => handleSort("last_visit")}
              >
                {t("Senast aktiv")}
              </SortHeader>
              <SortHeader
                active={sortKey === "last_login"}
                dir={sortDir}
                onClick={() => handleSort("last_login")}
              >
                {t("Senaste inloggning")}
              </SortHeader>
              <SortHeader
                active={sortKey === "created"}
                dir={sortDir}
                onClick={() => handleSort("created")}
              >
                {t("Skapad")}
              </SortHeader>
              <SortHeader
                active={sortKey === "roles"}
                dir={sortDir}
                onClick={() => handleSort("roles")}
              >
                {t("Roller")}
              </SortHeader>
              <th className="p-3 text-right">{t("Åtgärd")}</th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((u) => {
              return (
                <tr key={u.user_id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium">{u.name ?? u.email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{t("Konto skapat via")}: {t(REGISTRATION_PLATFORM_LABELS[u.registration_platform ?? "unknown"])}</div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {fmtDateTime(u.last_visit_at, locale)}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {fmtDateTime(u.last_sign_in_at, locale)}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString(locale) : "—"}
                  </td>

                  <td className="p-3">
                    <UserRoleBadges roles={u.roles} />
                  </td>
                  <td className="p-3 text-right">
                    <UserRoleAction
                      user={u}
                      pending={grant.isPending || revoke.isPending}
                      onGrant={() => grant.mutate({ userId: u.user_id, role: "admin" })}
                      onRevoke={() => revoke.mutate({ userId: u.user_id, role: "admin" })}
                    />
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

function UserRoleBadges({ roles }: { roles: AdminUserRow["roles"] }) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap gap-1">
      {roles.length === 0 ? (
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t("användare")}</span>
      ) : (
        roles.map((role) => (
          <span
            key={role}
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${role === "admin" ? "bg-primary/15 text-primary" : "bg-secondary"}`}
          >
            {role}
          </span>
        ))
      )}
    </div>
  );
}

function UserRoleAction({
  user,
  pending,
  onGrant,
  onRevoke,
}: {
  user: AdminUserRow;
  pending: boolean;
  onGrant: () => void;
  onRevoke: () => void;
}) {
  const { t } = useLang();
  const isAdmin = user.roles.includes("admin");
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (isAdmin) {
          if (confirm(t("Ta bort admin-roll från {email}?").replace("{email}", user.email ?? "")))
            onRevoke();
        } else {
          onGrant();
        }
      }}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-sm break-normal [overflow-wrap:normal] hover:underline disabled:opacity-50 ${isAdmin ? "text-destructive" : "text-primary"}`}
    >
      {isAdmin ? (
        <ShieldOff size={16} className="shrink-0" aria-hidden="true" />
      ) : (
        <Shield size={16} className="shrink-0" aria-hidden="true" />
      )}
      {t(isAdmin ? "Ta bort admin" : "Gör till admin")}
    </button>
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
    <th className="p-3 whitespace-nowrap">
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-11 items-center gap-1 whitespace-nowrap [&>svg]:shrink-0 font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
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
      case "roles":
        cmp = (a.roles[0] ?? "användare").localeCompare(b.roles[0] ?? "användare", "sv");
        break;
    }
    return cmp * mult;
  };
}
