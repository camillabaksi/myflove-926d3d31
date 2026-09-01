import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Check, X, Zap } from "lucide-react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveHeart } from "@/components/myflove/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CollapsibleSection from "@/components/collapsible-section";
import HelpHint from "@/components/help-hint";
import { useRelations } from "@/hooks/use-relations";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import {
  RELATION_TYPES,
  peopleOfType,
  relationTypeMeta,
  type RelationPerson,
  type RelationTypeId,
} from "@/lib/relations";

/** Lägg till en person under en relationstyp. */
function AddPerson({
  type,
  onAdd,
}: {
  type: RelationTypeId;
  onAdd: (name: string, note: string) => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-ink"
      >
        <Plus size={16} /> Lägg till {relationTypeMeta(type).label.toLowerCase()}
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd(name, note);
        setName("");
        setNote("");
        setOpen(false);
      }}
      className="space-y-2 rounded-2xl border border-border bg-secondary/40 p-3"
    >
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Namn – t.ex. Johan"
        className="h-11 rounded-2xl"
      />
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Valfritt: något du vill komma ihåg"
        className="h-11 rounded-2xl"
      />
      <div className="flex gap-2">
        <Button type="submit" className="h-10 rounded-2xl">
          Spara
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-10 rounded-2xl"
          onClick={() => setOpen(false)}
        >
          Avbryt
        </Button>
      </div>
    </form>
  );
}

function PersonRow({
  person,
  onSave,
  onRemove,
  onEnergy,
}: {
  person: RelationPerson;
  onSave: (patch: { name: string; note?: string }) => void;
  onRemove: () => void;
  onEnergy: (direction: "gives" | "drains") => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(person.name);
  const [note, setNote] = useState(person.note ?? "");
  const [energyOpen, setEnergyOpen] = useState(false);

  if (editing) {
    return (
      <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10 rounded-2xl"
        />
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Valfri information"
          className="h-10 rounded-2xl"
        />
        <div className="flex gap-2">
          <Button
            className="h-9 rounded-2xl"
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), note: note.trim() || undefined });
              setEditing(false);
            }}
          >
            <Check size={16} className="mr-1" /> Spara
          </Button>
          <Button variant="ghost" className="h-9 rounded-2xl" onClick={() => setEditing(false)}>
            <X size={16} className="mr-1" /> Avbryt
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{relationTypeMeta(person.type).emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words font-medium text-ink">{person.name}</p>
          {person.note && (
            <p className="line-clamp-2 break-words text-xs text-muted-foreground">{person.note}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEnergyOpen((v) => !v)}
          className="rounded-xl p-2 text-muted-foreground hover:text-ink"
          aria-label={`Energi kring ${person.name}`}
        >
          <Zap size={16} />
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-xl p-2 text-muted-foreground hover:text-ink"
          aria-label={`Ändra ${person.name}`}
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl p-2 text-muted-foreground hover:text-destructive"
          aria-label={`Ta bort ${person.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {energyOpen && (
        <div className="mt-3 space-y-2 rounded-2xl bg-secondary/50 p-3">
          <p className="text-sm text-ink">Hur påverkade det här dig idag? Du bestämmer själv.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-2xl"
              onClick={() => {
                onEnergy("gives");
                setEnergyOpen(false);
              }}
            >
              🔋 Gav energi
            </Button>
            <Button
              variant="outline"
              className="h-9 rounded-2xl"
              onClick={() => {
                onEnergy("drains");
                setEnergyOpen(false);
              }}
            >
              🪫 Tog energi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RelationsContent() {
  const { enabledTypes, people, toggleType, addPerson, updatePerson, removePerson } =
    useRelations();
  const { addFactor } = useEnergyFlow();

  const hidden = useMemo(
    () => RELATION_TYPES.filter((t) => !enabledTypes.includes(t.id)),
    [enabledTypes],
  );

  const logEnergy = async (person: RelationPerson, direction: "gives" | "drains") => {
    await addFactor({
      title: person.name,
      direction,
      strength: 3,
      category: "socialt",
      note: relationTypeMeta(person.type).label,
    });
    toast.success(
      direction === "gives"
        ? `Sparad som något som gav energi. 🔋`
        : `Sparad som något som tog energi. 🪫`,
    );
  };

  return (
    <div className="space-y-6">
      {enabledTypes.length === 0 && (
        <div className="surface-card space-y-2 p-5 text-center">
          <p className="text-ink">Du har inga relationstyper valda än.</p>
          <p className="text-sm text-muted-foreground">
            Välj bara det som stämmer för dig – ingen behöver ha alla.
          </p>
        </div>
      )}

      {enabledTypes.map((type) => {
        const meta = relationTypeMeta(type);
        const list = peopleOfType({ enabledTypes, people }, type);
        return (
          <CollapsibleSection
            key={type}
            id={`relationer-${type}`}
            title={`${meta.emoji} ${meta.label}`}
            description={meta.blurb}
          >
            <div className="space-y-2">
              {list.map((p) => (
                <PersonRow
                  key={p.id}
                  person={p}
                  onSave={(patch) => updatePerson(p.id, patch)}
                  onRemove={() => {
                    removePerson(p.id);
                    toast.success("Borttagen.");
                  }}
                  onEnergy={(dir) => logEnergy(p, dir)}
                />
              ))}
              <AddPerson type={type} onAdd={(name, note) => addPerson(type, name, { note })} />
              {type === "familj" && (
                <p className="text-xs text-muted-foreground">
                  Vill ni dela kalender och listor?{" "}
                  <Link to="/familj" className="underline underline-offset-2">
                    Öppna hushållet
                  </Link>
                  .
                </p>
              )}
              {type === "barn" && (
                <p className="text-xs text-muted-foreground">
                  Scheman och rutiner för barnen finns i{" "}
                  <Link to="/barn" className="underline underline-offset-2">
                    Barn
                  </Link>
                  .
                </p>
              )}
            </div>
          </CollapsibleSection>
        );
      })}

      <div className="surface-card space-y-3 p-5">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-ink">Vilka relationer vill du ha med?</h2>
          <HelpHint>
            Du väljer själv vilka relationstyper som visas. Inget läggs till automatiskt och du kan
            stänga av när du vill.
          </HelpHint>
        </div>
        <div className="flex flex-wrap gap-2">
          {RELATION_TYPES.map((t) => {
            const on = enabledTypes.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleType(t.id)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  on
                    ? "border-primary/50 bg-primary/10 text-ink"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            );
          })}
        </div>
        {hidden.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Personer du lagt in finns kvar även om du gömmer en relationstyp.
          </p>
        )}
      </div>
    </div>
  );
}

export default function RelationsPage() {
  return (
    <Layout>
      <MyFlovePageGrid area="hem">
        <MyFloveWide>
          <div className="space-y-8">
            <div>
              <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
                <MyFloveHeart size={26} /> Relationer
              </h1>
              <p className="text-muted-foreground">
                Människorna – och djuren – som hör till ditt liv. Flow använder dem som kontext i
                Quickflow, kalender, uppgifter och påminnelser, men gissar aldrig vad någon betyder
                för dig.
              </p>
            </div>
            <RelationsContent />
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
