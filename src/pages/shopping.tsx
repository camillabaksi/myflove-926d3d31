import { PacePageHeader } from "@/components/paceable/page-header";
import { useState } from "react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveEmptyIllustration } from "@/components/myflove/motion";
import {
  useSavedStores,
  STORE_RADIUS_OPTIONS,
  DEFAULT_STORE_RADIUS_METERS,
} from "@/hooks/use-data";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ShoppingBasket,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Mic,
  Square,
  Users,
  MapPin,
  Bell,
  BellOff,
  LocateFixed,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRandomEncouragement } from "@/lib/encouragements";
import CollapsibleSection from "@/components/collapsible-section";

interface ListItem {
  id: string;
  title: string;
  completed: boolean;
}

function StoreLocations() {
  const { savedStores, addSavedStore, deleteSavedStore, setStoreAlert, setStoreRadius } =
    useSavedStores();
  const [name, setName] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  const geolocationSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const handleAddStore = () => {
    if (!name.trim()) return;
    if (!geolocationSupported) {
      setLocationError("Din webbläsare stödjer inte platsdelning.");
      return;
    }
    setLocationError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        addSavedStore(name.trim(), position.coords.latitude, position.coords.longitude);
        setName("");
        setLocating(false);
        toast({ description: `${name.trim()} sparad! Du får en påminnelse när du är i närheten.` });
      },
      () => {
        setLocationError("Kunde inte hämta din plats. Kontrollera behörigheten för platsdelning.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="pt-6 border-t border-border">
      <CollapsibleSection
        title={
          <span className="flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            Sparade butiker
          </span>
        }
        headingClassName="text-xl font-semibold"
        description="Påminn mig när jag är nära en butik."
      >
        <div className="flex flex-wrap gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="T.ex. ICA Kvantum"
            className="h-12 min-w-0 flex-1 rounded-2xl"
          />
          <Button
            onClick={handleAddStore}
            disabled={!name.trim() || locating || !geolocationSupported}
            className="h-12 px-4 rounded-2xl shrink-0"
            aria-label="Spara butiken där du är nu"
          >
            {locating ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
          </Button>
        </div>

        {!geolocationSupported && (
          <p className="text-xs text-muted-foreground">
            Platsdelning stöds inte i denna webbläsare.
          </p>
        )}
        {locationError && <p className="text-xs text-destructive">{locationError}</p>}

        {savedStores.length > 0 && (
          <div className="space-y-2">
            {savedStores.map((store) => (
              <div
                key={store.id}
                className="bg-card border border-border rounded-2xl p-3 px-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin size={18} className="text-muted-foreground shrink-0" />
                    <span className="truncate">{store.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setStoreAlert(store.id, !store.alertEnabled)}
                      className={`p-2 rounded-xl transition-colors ${
                        store.alertEnabled
                          ? "text-primary hover:bg-primary/10"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                      aria-label={store.alertEnabled ? "Stäng av påminnelse" : "Sätt på påminnelse"}
                      title={store.alertEnabled ? "Påminnelse på" : "Påminnelse av"}
                    >
                      {store.alertEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                    </button>
                    <button
                      onClick={() => deleteSavedStore(store.id)}
                      className="p-2 text-muted-foreground hover:text-destructive rounded-xl transition-colors"
                      aria-label="Ta bort butik"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {store.alertEnabled && (
                  <div className="flex flex-wrap gap-2">
                    {STORE_RADIUS_OPTIONS.map((option) => {
                      const current = store.alertRadiusMeters ?? DEFAULT_STORE_RADIUS_METERS;
                      const selected = current === option.meters;
                      return (
                        <button
                          key={option.meters}
                          type="button"
                          onClick={() => setStoreRadius(store.id, option.meters)}
                          title={option.hint}
                          className={`px-3 py-1.5 text-sm rounded-full border transition ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}

export default function Shopping() {
  const {
    isShared,
    canShare,
    mode,
    setMode,
    activeItems,
    completedItems,
    addItem,
    toggleItem,
    deleteItem,
  } = useSharedShoppingList();
  const { toast } = useToast();
  const [newItem, setNewItem] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const {
    isSupported: voiceSupported,
    isListening,
    toggleListening,
  } = useVoiceInput((transcript) => {
    addItem(transcript);
    toast({ description: `"${transcript}" tillagd med rösten!` });
  });

  const handleToggle = (item: ListItem) => {
    toggleItem(item.id);
    if (!item.completed) {
      toast({ description: getRandomEncouragement() });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      addItem(newItem.trim());
      setNewItem("");
      setAddOpen(false);
    }
  };

  return (
    <Layout>
      <MyFlovePageGrid area="hem" className="pace-ds pace-compact-page pace-next-page pace-next-health pace-next-tools">
        <MyFloveWide>
          <div>
            <PacePageHeader icon={ShoppingBasket}
              title="Inköpslista"
              description="Vad behöver du handla? Släpp tanken på att komma ihåg allt."
            />
            {canShare ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="pace-segmented">
                  <Button
                    type="button"
                    onClick={() => setMode("shared")}
                    aria-pressed={mode === "shared"}
                    className="pace-segment"
                  >
                    Delad med familjen
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setMode("personal")}
                    aria-pressed={mode === "personal"}
                    className="pace-segment"
                  >
                    Bara min lista
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                  <Users size={14} />
                  {isShared ? "Alla i familjen ser den här listan" : "Bara du ser den här listan"}
                </span>
              </div>
            ) : null}
          </div>
        </MyFloveWide>

        <MyFloveWide>
          <Button onClick={() => setAddOpen(true)} className="h-14 w-full rounded-2xl text-lg shadow-sm">
            <Plus size={22} className="mr-2" /> Lägg till vara
          </Button>
        </MyFloveWide>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Lägg till vara</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                autoFocus
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="T.ex. Mjölk, toalettpapper..."
                className="pace-card-surface h-14 rounded-2xl text-lg bg-card border-border shadow-sm px-6"
              />
              {voiceSupported && (
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={toggleListening}
                  className="h-14 px-4 rounded-2xl shadow-sm shrink-0"
                  aria-label={isListening ? "Sluta lyssna" : "Lägg till med rösten"}
                  title={isListening ? "Sluta lyssna" : "Lägg till med rösten"}
                >
                  {isListening ? <Square size={22} /> : <Mic size={22} />}
                </Button>
              )}
              <Button
                type="submit"
                disabled={!newItem.trim()}
                className="h-14 px-6 rounded-2xl shadow-sm shrink-0"
              >
                <Plus size={24} />
              </Button>
            </form>
            {!voiceSupported && (
              <p className="text-xs text-muted-foreground">
                Röstinmatning stöds inte i denna webbläsare, men du kan alltid skriva.
              </p>
            )}
          </DialogContent>
        </Dialog>

        <MyFloveWide span="wide">
          <div className="space-y-6 pace-compact-stack">
            {activeItems.length === 0 && completedItems.length === 0 && (
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
                <MyFloveEmptyIllustration kind="default" className="mb-2 block" />
                <p className="text-lg">Inget att handla just nu.</p>
              </div>
            )}

            {activeItems.length > 0 && (
              <div className="space-y-2">
                {activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex min-h-14 items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary/30"
                  >
                    <button
                      onClick={() => handleToggle(item)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary">
                        <Circle size={22} strokeWidth={1.5} />
                      </div>
                      <span className="min-w-0 flex-1 text-base">{item.title}</span>
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Ta bort"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {completedItems.length > 0 && (
              <div className="pt-6 border-t border-border">
                <CollapsibleSection
                  title="I korgen"
                  help="Sådant du redan lagt i vagnen. Ligger kvar tills du rensar listan."
                  headingClassName="text-sm font-medium text-muted-foreground uppercase tracking-wider"
                >
                  <div className="space-y-2">
                    {completedItems.map((item) => (
                      <div
                        key={item.id}
                        className="pace-card-surface flex min-h-14 items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/70 px-4 py-2.5"
                      >
                        <button
                          onClick={() => handleToggle(item)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <div className="shrink-0 text-primary">
                            <CheckCircle2 size={22} className="fill-primary/20" strokeWidth={2} />
                          </div>
                          <span className="min-w-0 flex-1 text-base text-muted-foreground line-through decoration-muted-foreground/50">
                            {item.title}
                          </span>
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label="Ta bort"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            )}
          </div>
        </MyFloveWide>

        <div className="min-w-0">
          <StoreLocations />
        </div>
      </MyFlovePageGrid>
    </Layout>
  );
}
