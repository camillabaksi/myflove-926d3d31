import { ArrowRight, Globe, Smartphone } from "lucide-react";
import { Link } from "@tanstack/react-router";

const TESTFLIGHT_URL = "https://testflight.apple.com/join/x7P7ApQ4";
const ANDROID_TEST_URL = "https://play.google.com/apps/testing/app.myflove.mobile";
const ANDROID_INVITE_URL =
  "mailto:kontakt@paceable.se?subject=" +
  encodeURIComponent("Testa Paceable på Android") +
  "&body=" +
  encodeURIComponent(
    "Hej! Jag vill testa Paceable på Android.\n\nMin mejladress i Google Play är: ",
  );

/** Public entry points only. No account data, device detection or automatic enrollment. */
export function PlatformChoices() {
  return (
    <section id="prova" className="welcome-platforms" aria-labelledby="platforms-title">
      <div className="welcome-wrap">
        <div className="welcome-section-heading">
          <p className="welcome-eyebrow">Börja på ditt sätt</p>
          <h2 id="platforms-title">Välj hur du vill prova Paceable.</h2>
          <p>På din mobil eller direkt i webbläsaren.</p>
        </div>
        <div className="welcome-platform-grid">
          <article className="welcome-platform-card" data-platform="ios">
            <Smartphone className="welcome-platform-icon" aria-hidden="true" strokeWidth={1.5} />
            <h3>iPhone och iPad</h3>
            <p className="welcome-platform-label">Testversion via TestFlight</p>
            <p className="welcome-platform-copy">
              Installera TestFlight och öppna sedan testinbjudan.
            </p>
            <p className="welcome-platform-note">
              <span>I TestFlight kan appen fortfarande heta</span>{" "}
              <span data-no-translate>MyFlove</span>.
            </p>
            <div className="welcome-platform-actions">
              <a
                href={TESTFLIGHT_URL}
                className="welcome-platform-button"
                target="_blank"
                rel="noopener noreferrer"
              >
                Öppna TestFlight <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </article>

          <article className="welcome-platform-card" data-platform="android">
            <Smartphone className="welcome-platform-icon" aria-hidden="true" strokeWidth={1.5} />
            <h3>Android</h3>
            <p className="welcome-platform-label">Google Play · slutet test</p>
            <p className="welcome-platform-copy">
              Be om en inbjudan med mejladressen du använder i Google Play.
            </p>
            <div className="welcome-platform-actions">
              <a href={ANDROID_INVITE_URL} className="welcome-platform-button">
                Be om testinbjudan <ArrowRight aria-hidden="true" />
              </a>
              <a
                href={ANDROID_TEST_URL}
                className="welcome-platform-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Jag är redan inbjuden
              </a>
            </div>
          </article>

          <article className="welcome-platform-card" data-platform="web">
            <Globe className="welcome-platform-icon" aria-hidden="true" strokeWidth={1.5} />
            <h3>Webbappen</h3>
            <p className="welcome-platform-label">Ingen installation</p>
            <p className="welcome-platform-copy">
              Prova direkt i webbläsaren på mobil, surfplatta eller dator.
            </p>
            <div className="welcome-platform-actions">
              <Link to="/sign-up" className="welcome-platform-button">
                Prova webbappen <ArrowRight aria-hidden="true" />
              </Link>
              <Link to="/sign-in" className="welcome-platform-secondary">
                Har du redan konto? Logga in
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
