import { useState } from "react";
import { useClerk, Show } from "@clerk/react";
import Layout from "@/components/layout";
import {
  useGetMyHousehold,
  useCreateHousehold,
  useJoinHousehold,
  useLeaveHousehold,
  getGetMyHouseholdQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Copy, LogOut, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = [
  { value: "#8a9a5b", label: "Oliv" },
  { value: "#e8c547", label: "Gul" },
  { value: "#c17a56", label: "Terrakotta" },
  { value: "#6b8e9e", label: "Blå" },
  { value: "#a06cd5", label: "Lila" },
  { value: "#d16d6d", label: "Röd" },
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2">
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

function CreateOrJoin() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useCreateHousehold({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyHouseholdQueryKey() });
        toast({ description: "Din familj är skapad!" });
      },
      onError: () => toast({ description: "Något gick fel. Försök igen.", variant: "destructive" }),
    },
  });

  const joinMutation = useJoinHousehold({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyHouseholdQueryKey() });
        toast({ description: "Du gick med i familjen!" });
      },
      onError: () => toast({ description: "Hittade ingen familj med den koden.", variant: "destructive" }),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    if (mode === "create") {
      if (!name.trim()) return;
      createMutation.mutate({ data: { name: name.trim(), displayName: displayName.trim(), color } });
    } else {
      if (!inviteCode.trim()) return;
      joinMutation.mutate({ data: { inviteCode: inviteCode.trim(), displayName: displayName.trim(), color } });
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex bg-secondary rounded-2xl p-1">
        <button
          onClick={() => setMode("create")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            mode === "create" ? "bg-card shadow-sm" : "text-muted-foreground"
          }`}
        >
          Skapa familj
        </button>
        <button
          onClick={() => setMode("join")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            mode === "join" ? "bg-card shadow-sm" : "text-muted-foreground"
          }`}
        >
          Gå med i familj
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-3xl p-6 shadow-sm">
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

        <Button
          type="submit"
          className="w-full h-12 rounded-2xl"
          disabled={createMutation.isPending || joinMutation.isPending}
        >
          {mode === "create" ? "Skapa familj" : "Gå med"}
        </Button>
      </form>
    </div>
  );
}

function HouseholdView({
  household,
}: {
  household: { id: number; name: string; inviteCode: string; members: { id: number; displayName: string; color: string; isMe: boolean }[] };
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const leaveMutation = useLeaveHousehold({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyHouseholdQueryKey() });
        toast({ description: "Du har lämnat familjen." });
      },
    },
  });

  const copyCode = () => {
    navigator.clipboard.writeText(household.inviteCode).catch(() => {});
    toast({ description: "Koden är kopierad!" });
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
            <div className="text-sm text-muted-foreground">{household.members.length} medlemmar</div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-secondary rounded-2xl p-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Inbjudningskod</div>
            <div className="text-lg font-mono font-bold tracking-widest">{household.inviteCode}</div>
          </div>
          <button
            onClick={copyCode}
            className="p-3 hover:bg-card rounded-xl transition-colors"
            aria-label="Kopiera kod"
          >
            <Copy size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {household.members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
            <span className="text-lg">{m.displayName}</span>
            {m.isMe && <span className="text-xs text-muted-foreground ml-auto">Du</span>}
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => leaveMutation.mutate()}
        disabled={leaveMutation.isPending}
        className="w-full h-12 rounded-2xl text-destructive hover:text-destructive"
      >
        <LogOut size={18} className="mr-2" />
        Lämna familjen
      </Button>
    </div>
  );
}

function FamilyContent() {
  const { data, isLoading } = useGetMyHousehold({
    query: { queryKey: getGetMyHouseholdQueryKey() },
  });

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground">Laddar...</div>;
  }

  if (data?.id && data.name && data.inviteCode) {
    return (
      <HouseholdView
        household={{
          id: data.id,
          name: data.name,
          inviteCode: data.inviteCode,
          members: data.members,
        }}
      />
    );
  }

  return <CreateOrJoin />;
}

export default function FamilyPage() {
  const { openSignIn } = useClerk();

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Familj</h1>
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
    </Layout>
  );
}
