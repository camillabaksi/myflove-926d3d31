import VisualChildSchedule from "@/components/family/visual-child-schedule";
import { useChildren } from "@/hooks/use-children";

const readOnlyError = async (): Promise<never> => {
  throw new Error("Bara den som administrerar schemat kan ändra det.");
};

/**
 * Den inloggades vy av en förälders barnprofil som kontot är kopplat till.
 * Två separata, läsbara källor – aldrig förälderns profilfält eller privata anteckningar:
 * 1. Det visuella schemat (säker RPC).
 * 2. Poster föräldern uttryckligen delat med kontot. Poster som redan finns i
 *    schemat filtreras bort i databasen, så inget visas dubbelt.
 * Kontots egen kalender ligger orörd under denna ruta.
 */
export default function OwnChildCalendar() {
  const { selfProfiles, selfItems, sharedToMe, openDoc } = useChildren();
  if (selfProfiles.length === 0 && sharedToMe.length === 0) return null;
  return (
    <div className="mb-4 space-y-4" data-testid="own-child-calendar">
      {selfProfiles.map((profile) => (
        <VisualChildSchedule
          key={profile.id}
          child={profile}
          children={[profile]}
          items={selfItems}
          readOnly
          onClose={() => window.history.back()}
          addItem={readOnlyError}
          updateItem={readOnlyError}
          toggleItem={readOnlyError}
          deleteItem={readOnlyError}
          uploadDoc={readOnlyError}
          copyDoc={readOnlyError}
          openDoc={openDoc}
        />
      ))}
      {sharedToMe.length > 0 && (
        <section
          aria-label="Delat med dig"
          data-testid="shared-to-me"
          className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft"
        >
          <h2 className="text-base font-semibold text-ink">Delat med dig</h2>
          <ul className="mt-3 space-y-2">
            {sharedToMe.map((item) => (
              <li key={item.id} className="flex min-w-0 items-center gap-3 rounded-2xl bg-secondary/30 p-3">
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium leading-snug text-ink">{item.title}</span>
                  {(item.date || item.time) && (
                    <span className="block text-xs text-muted-foreground">
                      {[item.date, item.time?.slice(0, 5)].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
                {item.file_path && (
                  <button
                    type="button"
                    onClick={() => void openDoc(item.file_path as string)}
                    className="min-h-11 rounded-xl px-3 text-sm font-semibold text-primary"
                  >
                    Öppna
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
