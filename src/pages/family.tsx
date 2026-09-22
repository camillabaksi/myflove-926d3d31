import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useUser, useClerk, Show } from "@clerk/react";
import Layout from "@/components/layout";
import CollapsibleSection from "@/components/collapsible-section";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveHeart } from "@/components/myflove/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Copy, LogOut, Check, Share2 } from "lucide-react";
import FamilySharing from "@/components/family/family-sharing";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PERSON_COLORS } from "@/lib/palette";

const COLORS = PERSON_COLORS;

/** Det som familjen delar – länkar till befintliga vyer. */
const SHARED_LINKS = [
  { href: "/kalender", label: "Kalender" },
  { href: "/shopping", label: "Inköpslista" },
  { href: "/matlista", label: "Matlista" },
] as const;

type Member = { user_id: string; display_name: string; color: string };
type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  members: Member[];
};

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          aria-label={c.label}
          className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all"
          style={{
            backgroundColor: c.value,
            borderColor: value === c.value ? "var(--foreground)" : "transparent",
          }}
        >
          {value === c.value && <Check size={16} className="text-white drop-shadow" />}
        </button>
      ))}
    </div>
  );
}

async function fetchMyHousehold(userId: string): Promise<Household | null> {
  const { data: memberships, error: mErr } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1);
  if (mErr) throw mErr;
  const hid = memberships?.[0]?.household_id;
  if (!hid) return null;

  const { data: h, error: hErr } = await supabase
    .from("households")
    .select("id, name, invite_code, created_by")
    .eq("id", hid)
    .single();
  if (hErr) throw hErr;

  const { data: members, error: memErr } = await supabase
    .from("household_members")
    .select("user_id, display_name, color")
    .eq("household_id", hid);
  if (memErr) throw memErr;

  return { ...h, members: members ?? [] };
}

function CreateOrJoin({ onReady }: { onReady: () => void }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  // Kommer man via en inbjudningslänk är koden redan ifylld.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("kod");
    if (code) {
      setInviteCode(code.toUpperCase());
      setMode("join");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setPending(true);
    try {
      if (mode === "create") {
        if (!name.trim()) return;
        const { error } = await supabase.rpc("create_household", {
          _name: name.trim(),
          _display_name: displayName.trim(),
          _color: color,
        });
        if (error) throw error;
        toast({ description: "Din familj är skapad!" });
      } else {
        if (!inviteCode.trim()) return;
        const { error } = await supabase.rpc("join_household_by_code", {
          _code: inviteCode.trim().toUpperCase(),
          _display_name: displayName.trim(),
          _color: color,
        });
        if (error) throw error;
        toast({ description: "Du gick med i familjen!" });
      }
      onReady();
    } catch (err) {
      toast({
        description:
          mode === "join" ? "Hittade ingen familj med den koden." : "Något gick fel. Försök igen.",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-card border border-border rounded-3xl p-6 shadow-sm"
      >
        <div className="flex bg-secondary rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              mode === "create" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            Skapa familj
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              mode === "join" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            Gå med med kod
          </button>
        </div>

        {mode === "create" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Familjens namn</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Familjen Andersson"
              className="h-12 rounded-2xl"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium">Inbjudningskod</label>
            <Input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="T.ex. A1B2C3D4"
              className="h-12 rounded-2xl uppercase"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Ditt namn</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="T.ex. Mamma, Pappa, Alex..."
            className="h-12 rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Din färg</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <Button type="submit" className="w-full h-12 rounded-2xl" disabled={pending}>
          {pending ? "Vänta..." : mode === "create" ? "Skapa familj" : "Gå med"}
        </Button>
      </form>
    </div>
  );
}

function HouseholdView({
  household,
  currentUserId,
  onLeave,
}: {
  household: Household;
  currentUserId: string;
  onLeave: () => void;
}) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(household.invite_code).catch(() => {});
    toast({ description: "Koden är kopierad!" });
  };

  const inviteLink = () =>
    `${window.location.origin}/familj?kod=${encodeURIComponent(household.invite_code)}`;

  const shareInvite = async () => {
    const url = inviteLink();
    const text = `Gå med i ${household.name} i MyFlove: ${url}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Gå med i familjen", text, url });
        return;
      }
    } catch {
      return;
    }
    navigator.clipboard.writeText(url).catch(() => {});
    toast({ description: "Inbjudningslänken är kopierad!" });
  };

  const leave = async () => {
    setPending(true);
    try {
      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("household_id", household.id)
        .eq("user_id", currentUserId);
      if (error) throw error;
      toast({ description: "Du har lämnat familjen." });
      onLeave();
    } catch (err) {
      console.error(err);
      toast({ description: "Kunde inte lämna familjen.", variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="text-primary" size={24} />
          </div>
          <div>
            <div className="text-xl font-bold">{household.name}</div>
            <div className="text-sm text-muted-foreground">
              {household.members.length} medlem{household.members.length === 1 ? "" : "mar"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-secondary rounded-2xl p-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Inbjudningskod
            </div>
            <div className="text-lg font-mono font-bold tracking-widest">
              {household.invite_code}
            </div>
          </div>
          <button
            onClick={copyCode}
            className="p-3 hover:bg-card rounded-xl transition-colors"
            aria-label="Kopiera kod"
          >
            <Copy size={20} />
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={shareInvite}
          className="h-12 w-full rounded-2xl"
        >
          <Share2 size={18} className="mr-2" />
          Bjud in med länk
        </Button>

        <div className="flex flex-wrap gap-2">
          {household.members.map((m) => (
            <span
              key={m.user_id}
              className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-3 py-2 text-sm"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              {m.display_name}
              {m.user_id === currentUserId && (
                <span className="text-xs text-muted-foreground">Du</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <section className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
        <h2 className="font-display text-base text-ink">Vad ni delar</h2>
        <p className="text-sm text-muted-foreground">
          Kalender och listor är gemensamma för alla i familjen.
        </p>
        <div className="flex flex-wrap gap-2">
          {SHARED_LINKS.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="rounded-2xl border border-border bg-secondary/40 px-3 py-2 text-sm text-ink hover:border-primary/50"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      <CollapsibleSection
        title="Mer"
        id="familj-mer"
        defaultCollapsed
        headingClassName="font-display text-base text-ink"
        className="bg-card border border-border rounded-3xl p-5 shadow-sm"
      >
        <Button
          variant="outline"
          onClick={leave}
          disabled={pending}
          className="w-full h-12 rounded-2xl text-destructive hover:text-destructive"
        >
          <LogOut size={18} className="mr-2" />
          Lämna familjen
        </Button>
      </CollapsibleSection>
    </div>
  );
}

function FamilyContent() {
  const { user } = useUser();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const h = await fetchMyHousehold(user.id);
      setHousehold(h);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Laddar...</div>;
  if (household && user?.id) {
    return <HouseholdView household={household} currentUserId={user.id} onLeave={load} />;
  }
  return <CreateOrJoin onReady={load} />;
}

export default function FamilyPage() {
  const { openSignIn } = useClerk();

  return (
    <Layout>
      <MyFlovePageGrid area="hem">
        <MyFloveWide>
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl mb-2 flex items-center gap-2">
                <MyFloveHeart size={26} /> Familj
              </h1>
              <p className="text-muted-foreground">
                Skapa eller gå med i en familj för att dela kalender och matlista.
              </p>
            </div>

            <Show when="signed-out">
              <div className="max-w-md mx-auto text-center py-16 bg-card/50 border-2 border-dashed border-border rounded-3xl space-y-4">
                <Users className="mx-auto text-muted-foreground" size={40} />
                <p className="text-lg">Logga in för att komma åt familjefunktioner.</p>
                <Button onClick={() => openSignIn()} className="rounded-2xl h-12 px-8">
                  Logga in
                </Button>
              </div>
            </Show>

            <Show when="signed-in">
              <FamilyContent />
            </Show>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
