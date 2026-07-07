import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetSlTrip, getSlNearbyStop } from "@workspace/api-client-react";
import { useSavedTrips } from "@/hooks/use-data";
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "@/lib/push-notifications";
import { MapPin, Navigation, Clock, Activity, AlertCircle, Star, X, Route, BellRing, Bell, Smartphone, LocateFixed, Loader2 } from "lucide-react";

const ALERT_MINUTES_OPTIONS = [5, 10, 15, 20, 30];

export default function Travel() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchParams, setSearchParams] = useState<{ from: string; to: string } | null>(null);
  const [savingLabel, setSavingLabel] = useState<string | null>(null);
  const [configuringAlertFor, setConfiguringAlertFor] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>("default");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { savedTrips, addSavedTrip, deleteSavedTrip, setTripAlert } = useSavedTrips();

  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Din webbläsare stödjer inte platsdelning.");
      return;
    }
    setLocationError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const stop = await getSlNearbyStop({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setFrom(stop.name);
        } catch {
          setLocationError("Kunde inte hitta en hållplats nära din plats.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError("Kunde inte hämta din plats. Kontrollera behörigheten för platsdelning.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const { data: suggestion, isFetching: isLoading, error } = useGetSlTrip(
    { from: searchParams?.from ?? "", to: searchParams?.to ?? "" },
    { query: { enabled: !!searchParams, retry: false, queryKey: ["sl-trip", searchParams] } },
  );

  const runSearch = (fromValue: string, toValue: string) => {
    setFrom(fromValue);
    setTo(toValue);
    setSearchParams({ from: fromValue.trim(), to: toValue.trim() });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return;
    runSearch(from, to);
  };

  const isCurrentTripSaved = savedTrips.some(
    (t) => t.from === searchParams?.from && t.to === searchParams?.to,
  );

  const handleSaveTrip = () => {
    if (!savingLabel?.trim() || !searchParams) return;
    addSavedTrip(savingLabel.trim(), searchParams.from, searchParams.to);
    setSavingLabel(null);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Resor</h1>
          <p className="text-muted-foreground">Sök din resa. Lugnt och enkelt.</p>
        </div>

        {notificationPermission === "default" && (
          <div className="flex items-center justify-between gap-3 bg-secondary/40 border border-border rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                Slå på push-notiser för att få pendlingsvarningar även när fliken inte är aktiv.
              </p>
            </div>
            <Button type="button" onClick={handleEnableNotifications} className="rounded-xl shrink-0 h-9 px-4 text-sm">
              Slå på
            </Button>
          </div>
        )}

        {notificationPermission === "denied" && (
          <div className="flex items-start gap-3 bg-secondary/30 border border-border rounded-2xl px-4 py-3 text-xs text-muted-foreground">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>Push-notiser är blockerade i webbläsaren. Ändra behörigheten i webbläsarinställningarna för att aktivera dem.</p>
          </div>
        )}

        {savedTrips.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star size={18} />
              Favoritresor
            </h2>
            <div className="flex flex-col gap-2">
              {savedTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="flex items-center gap-2 pl-4 pr-2 py-2">
                    <button
                      type="button"
                      onClick={() => runSearch(trip.from, trip.to)}
                      className="flex-1 flex items-center gap-2 text-sm font-medium text-left"
                    >
                      <Route size={18} className="text-primary shrink-0" />
                      <span>{trip.label}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfiguringAlertFor(configuringAlertFor === trip.id ? null : trip.id)
                      }
                      aria-label={`Pendlingsvarning för ${trip.label}`}
                      className={`rounded-full p-2 ${
                        trip.alertEnabled
                          ? "text-yellow-600 bg-yellow-100"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {trip.alertEnabled ? <BellRing size={18} /> : <Bell size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedTrip(trip.id)}
                      aria-label={`Ta bort ${trip.label}`}
                      className="text-muted-foreground hover:text-destructive rounded-full p-2"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {configuringAlertFor === trip.id && (
                    <div className="flex items-center flex-wrap gap-2 px-4 pb-3 pt-1 border-t border-border/50 bg-secondary/20">
                      <span className="text-xs text-muted-foreground">Varna mig</span>
                      {ALERT_MINUTES_OPTIONS.map((minutes) => (
                        <button
                          key={minutes}
                          type="button"
                          onClick={() => setTripAlert(trip.id, true, minutes)}
                          className={`text-xs px-2.5 py-1 rounded-full border ${
                            trip.alertEnabled && trip.alertMinutesBefore === minutes
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {minutes} min innan
                        </button>
                      ))}
                      {trip.alertEnabled && (
                        <button
                          type="button"
                          onClick={() => setTripAlert(trip.id, false)}
                          className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-destructive"
                        >
                          Stäng av
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <MapPin size={20} />
            </div>
            <Input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Från (t.ex. Centralen)"
              className="h-14 pl-12 pr-14 text-lg rounded-2xl bg-secondary/50 border-transparent focus-visible:ring-primary"
              required
            />
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              aria-label="Använd min plats"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 p-2 rounded-full disabled:opacity-50"
            >
              {locating ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={20} />}
            </button>
          </div>

          {locationError && (
            <p className="text-xs text-destructive -mt-2">{locationError}</p>
          )}
          
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
              <Navigation size={20} />
            </div>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Till (t.ex. Slussen)"
              className="h-14 pl-12 text-lg rounded-2xl bg-secondary/50 border-transparent focus-visible:ring-primary"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !from.trim() || !to.trim()}
            className="w-full h-14 rounded-2xl text-lg font-medium shadow-sm"
          >
            {isLoading ? "Söker resa..." : "Sök resa"}
          </Button>
          
          <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground/80 bg-secondary/30 p-3 rounded-xl">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>
              <strong>Riktig SL-data.</strong> Resor hämtas live från Trafiklab/ResRobot.
            </p>
          </div>
        </form>

        {error && !isLoading && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 text-destructive">
            {(error as { data?: { message?: string } })?.data?.message ??
              "Kunde inte hitta en resa mellan platserna. Kontrollera stavningen och försök igen."}
          </div>
        )}

        {suggestion && !isLoading && !error && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Nästa avgång</h2>
              {!isCurrentTripSaved && savingLabel === null && (
                <button
                  type="button"
                  onClick={() => setSavingLabel("")}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
                >
                  <Star size={18} />
                  Spara som favorit
                </button>
              )}
              {isCurrentTripSaved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Star size={18} className="fill-primary text-primary" />
                  Sparad favorit
                </span>
              )}
            </div>

            {savingLabel !== null && (
              <div className="flex items-center gap-2 bg-secondary/30 p-3 rounded-2xl">
                <Input
                  autoFocus
                  value={savingLabel}
                  onChange={(e) => setSavingLabel(e.target.value)}
                  placeholder="Namn på resan (t.ex. Hem till jobbet)"
                  className="h-11 rounded-xl bg-background border-transparent focus-visible:ring-primary"
                />
                <Button type="button" onClick={handleSaveTrip} disabled={!savingLabel.trim()} className="h-11 rounded-xl shrink-0">
                  Spara
                </Button>
                <button
                  type="button"
                  onClick={() => setSavingLabel(null)}
                  aria-label="Avbryt"
                  className="text-muted-foreground hover:text-destructive shrink-0 p-2"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-block px-3 py-1 bg-primary/20 text-primary font-medium rounded-lg text-sm mb-2">
                    {suggestion.lineName}
                  </span>
                  <div className="text-3xl font-bold text-foreground">
                    {suggestion.departureTime}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Ankommer {suggestion.arrivalTime}
                  </div>
                </div>
                
                <div className="bg-background rounded-2xl p-3 border border-border shadow-sm text-center min-w-[80px]">
                  <div className="text-2xl font-bold text-primary">{suggestion.durationMinutes}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">min</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 pt-4 border-t border-primary/10 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>{suggestion.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={18} />
                  <span>{suggestion.changes === 0 ? "Inga byten" : `${suggestion.changes} byten`}</span>
                </div>
              </div>
            </div>

            {suggestion.legs.length > 1 && (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Sträckor</h3>
                {suggestion.legs.map((leg, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                    <div>
                      <span className="font-medium text-foreground">{leg.lineName}</span>
                      <span className="text-muted-foreground"> · {leg.fromName} → {leg.toName}</span>
                    </div>
                    <div className="text-muted-foreground shrink-0 ml-3">
                      {leg.departureTime}–{leg.arrivalTime}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
