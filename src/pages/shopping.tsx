import { useState } from "react";
import Layout from "@/components/layout";
import { useSavedStores } from "@/hooks/use-data";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2, Circle, Mic, Square, Users, MapPin, Bell, BellOff, LocateFixed, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRandomEncouragement } from "@/lib/encouragements";
import CollapsibleSection from "@/components/collapsible-section";

interface ListItem {
  id: string;
  title: string;
  completed: boolean;
}

function StoreLocations() {
  const { savedStores, addSavedStore, deleteSavedStore, setStoreAlert } = useSavedStores();
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
    <div className="pt-8 border-t border-border">
      <CollapsibleSection
        title={
          <span className="flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            Sparade butiker
          </span>
        }
        headingClassName="text-xl font-semibold"
        description="Spara en butik där du är just nu, så påminner vi dig om det som är kvar på listan nästa gång du är i närheten."
      >
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="T.ex. ICA Kvantum"
          className="h-12 rounded-2xl"
        />
        <Button
          onClick={handleAddStore}
          disabled={!name.trim() || locating || !geolocationSupported}
          className="h-12 px-4 rounded-2xl shrink-0"
        >
          {locating ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
        </Button>
      </div>
      {!geolocationSupported && (
        <p className="text-xs text-muted-foreground">Platsdelning stöds inte i denna webbläsare.</p>
      )}
      {locationError && <p className="text-xs text-destructive">{locationError}</p>}

      {savedStores.length > 0 && (
        <div className="space-y-2">
          {savedStores.map((store) => (
            <div
              key={store.id}
              className="flex items-center justify-between gap-3 bg-card border border-border rounded-2xl p-3 px-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <MapPin size={18} className="text-muted-foreground shrink-0" />
                <span className="truncate">{store.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setStoreAlert(store.id, !store.alertEnabled)}
                  className={`p-2 rounded-xl transition-colors ${
                    store.alertEnabled ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-secondary"
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
          ))}
        </div>
      )}
      </CollapsibleSection>
    </div>
  );
}

export default function Shopping() {
  const { isShared, activeItems, completedItems, addItem, toggleItem, deleteItem } = useSharedShoppingList();
  const { toast } = useToast();
  const [newItem, setNewItem] = useState("");

  const { isSupported: voiceSupported, isListening, toggleListening } = useVoiceInput((transcript) => {
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
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inköpslista</h1>
          <p className="text-muted-foreground">Vad behöver du handla? Släpp tanken på att komma ihåg allt.</p>
          {isShared && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              <Users size={16} />
              Delad med din familj
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="T.ex. Mjölk, toalettpapper..."
            className="h-14 rounded-2xl text-lg bg-card border-border shadow-sm px-6"
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
          <p className="text-xs text-muted-foreground -mt-4">Röstinmatning stöds inte i denna webbläsare, men du kan alltid skriva.</p>
        )}

        <div className="space-y-6">
          {activeItems.length === 0 && completedItems.length === 0 && (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
              <p className="text-lg">Inget att handla just nu.</p>
            </div>
          )}

          {activeItems.length > 0 && (
            <div className="space-y-2">
              {activeItems.map(item => (
                <div 
                  key={item.id}
                  className="group flex items-center justify-between p-3 px-4 bg-card border border-border rounded-2xl hover:border-primary/30 transition-colors"
                >
                  <button 
                    onClick={() => handleToggle(item)}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                      <Circle size={26} strokeWidth={1.5} />
                    </div>
                    <span className="text-lg">{item.title}</span>
                  </button>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-xl transition-colors md:opacity-0 group-hover:opacity-100"
                    aria-label="Ta bort"
                  >
                    <Trash2 size={22} />
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
              {completedItems.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 px-4 bg-card/50 border border-border/50 rounded-2xl opacity-60"
                >
                  <button 
                    onClick={() => handleToggle(item)}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <div className="text-primary">
                      <CheckCircle2 size={26} className="fill-primary/20" strokeWidth={2} />
                    </div>
                    <span className="text-lg line-through">{item.title}</span>
                  </button>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-xl transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </CollapsibleSection>
            </div>
          )}
        </div>

        <StoreLocations />
      </div>
    </Layout>
  );
}
