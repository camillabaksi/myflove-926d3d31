import VisualChildSchedule from "@/components/family/visual-child-schedule";
import { useChildren } from "@/hooks/use-children";

const readOnlyError = async (): Promise<never> => {
  throw new Error("Bara den som administrerar schemat kan ändra det.");
};

/**
 * Barnkontots egen visuella kalender. Data kommer från säkra RPC:er
 * (namn, färg, avatar och aktiviteter utan förälderns privata anteckningar);
 * stödbehov och administrativa uppgifter hämtas aldrig hit.
 */
export default function OwnChildCalendar() {
  const { selfProfiles, selfItems, openDoc } = useChildren();
  if (selfProfiles.length === 0) return null;
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
    </div>
  );
}
