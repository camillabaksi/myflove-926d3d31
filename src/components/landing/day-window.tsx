import { useState } from "react";
import { Check, Leaf, Sun } from "lucide-react";

/** A local illustration. Never reads or writes account data. */
export function DayWindow() {
  const [done, setDone] = useState(false);
  return (
    <figure className="welcome-day" aria-label="Illustrativ förhandsvisning av Paceable">
      <div className="welcome-day-label">
        <Sun aria-hidden="true" />
        En glimt av din dag
      </div>
      <h2>Hej, du.</h2>
      <p className="welcome-day-greeting">Vi tar en sak i taget.</p>
      <div className="welcome-energy">
        <div>
          <span>Din energi just nu</span>
          <strong>
            60<span>%</span>
          </strong>
        </div>
        <div className="welcome-battery" role="img" aria-label="Illustrativt batteri, 60 procent">
          <span />
        </div>
        <p>Det finns plats för pauser också.</p>
      </div>
      <h3>En liten plan</h3>
      <div className="welcome-example-task">
        <button
          type="button"
          aria-label="Markera Lite frisk luft i förhandsvisningen"
          aria-pressed={done}
          onClick={() => setDone((value) => !value)}
        >
          <span className="welcome-task-check">{done && <Check aria-hidden="true" />}</span>
          <span className={done ? "welcome-task-done" : undefined}>Lite frisk luft</span>
        </button>
        <time>10:00</time>
      </div>
      <div className="welcome-example-pause">
        <Leaf aria-hidden="true" />
        <span>En stund för återhämtning</span>
      </div>
      <div className="welcome-day-note">Det får vara lagom.</div>
      <figcaption>Exempelvy – inga uppgifter sparas här</figcaption>
    </figure>
  );
}
