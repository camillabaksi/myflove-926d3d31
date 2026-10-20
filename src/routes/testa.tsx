import { PUBLIC_BASE_URL } from "@/lib/public-url";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Heart, Smartphone, MessageCircle, ShieldCheck } from "lucide-react";
import { PublicPage } from "@/components/landing/public-page";
import { submitTesterApplicationFn } from "@/lib/tester-recruitment.functions";
import "@/components/landing/welcome.css";

export const Route = createFileRoute("/testa")({
  head: () => ({
    meta: [
      { title: "Bli testare – Paceable" },
      { name: "description", content: "Hjälp oss testa Paceable på Android, iPhone eller webben och berätta vad som gör vardagen enklare." },
      { property: "og:title", content: "Bli testare av Paceable" },
      { property: "og:description", content: "Testa Paceable gratis och hjälp oss skapa ett lugnare stöd i vardagen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${PUBLIC_BASE_URL}/testa` }],
  }),
  component: TesterPage,
});

type Platform = "android" | "ios" | "both" | "web";
type Participation = "technical" | "everyday" | "both";
type Focus = "planning" | "energy" | "capture" | "recovery" | "overview" | "general";

const control = "min-h-12 w-full rounded-2xl border border-[#DED7DE] bg-[#FFFEFC] px-4 py-3 text-sm text-[#392B3D] outline-none transition-colors focus-visible:border-[#78557D] focus-visible:ring-2 focus-visible:ring-[#78557D]/25";
const label = "mb-1.5 block text-sm font-semibold text-[#392B3D]";

function TesterPage() {
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [participation, setParticipation] = useState<Participation | "">("");
  const [focus, setFocus] = useState<Focus>("general");
  const [feedback, setFeedback] = useState(true);
  const [adult, setAdult] = useState(false);
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!platform || !participation || !adult || !consent || sending) return;
    setSending(true);
    setError("");
    try {
      await submitTesterApplicationFn({
        data: { email, platform, participation, focus, feedback_willing: feedback, adult: true, consent: true, company },
      });
      setSubmitted(true);
    } catch {
      setError("Det gick inte att skicka anmälan just nu. Försök igen senare, eller mejla kontakt@paceable.se.");
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicPage quiet>
      <div className="bg-[radial-gradient(ellipse_at_90%_8%,#F6E7E0_0%,transparent_48%),radial-gradient(ellipse_at_0%_85%,#EFE7F3_0%,transparent_50%)]">
        <div className="welcome-wrap grid items-start gap-8 py-12 sm:gap-12 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <section className="space-y-6 lg:pt-5" aria-labelledby="tester-title">
            <p className="welcome-eyebrow">Paceable i test</p>
            <h1 id="tester-title" className="!mt-0">Vill du hjälpa oss göra vardagen lite lättare?</h1>
            <p className="max-w-xl text-base leading-8 text-[#635968] sm:text-lg">
              Vi söker vuxna som vill prova Paceable och berätta vad som fungerar.
              Du kan hjälpa oss testa appen tekniskt, använda den i din egen vardag – eller både och.
            </p>
            <p className="max-w-xl text-sm leading-7 text-[#635968]">
              Paceable samlar tankar, planering, energi och återhämtning på ett lugnare sätt.
              Du behöver inte ha någon diagnos eller vara teknikvan. Vi vill lära oss vad som faktiskt hjälper.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-[#E4DCEB] bg-[#F5F0F8]/90 p-5">
                <Smartphone className="mb-3 h-6 w-6 text-[#775584]" aria-hidden="true" />
                <h2 className="text-xl">Testa tekniken</h2>
                <p className="mt-2 text-sm leading-6 text-[#635968]">Hjälp oss upptäcka problem med installation, Android, iPhone och funktioner.</p>
              </div>
              <div className="rounded-3xl border border-[#E0E8DD] bg-[#F0F5EF]/90 p-5">
                <Heart className="mb-3 h-6 w-6 text-[#698471]" aria-hidden="true" />
                <h2 className="text-xl">Testa i vardagen</h2>
                <p className="mt-2 text-sm leading-6 text-[#635968]">Se om Paceable hjälper dig med överblick, ork och nästa lilla steg.</p>
              </div>
            </div>
            <div className="space-y-2 text-sm leading-7 text-[#635968]">
              <p><Check className="mr-2 inline h-4 w-4 text-[#698471]" aria-hidden="true" />Gratis test, ungefär två veckor</p>
              <p><Check className="mr-2 inline h-4 w-4 text-[#698471]" aria-hidden="true" />Ingen skyldighet att använda alla funktioner</p>
              <p><Check className="mr-2 inline h-4 w-4 text-[#698471]" aria-hidden="true" />Några korta frågor om hur det fungerat</p>
            </div>
          </section>
          <section aria-labelledby="form-title" className="min-w-0 rounded-[2rem] border border-[#E9E1E5] bg-[#FFFEFC]/95 p-5 shadow-[0_12px_40px_rgba(81,38,84,0.07)] sm:p-8">
            {submitted ? (
              <div role="status" className="space-y-5 py-8 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EEF4EB] text-[#62816B]"><Check className="h-8 w-8" aria-hidden="true" /></span>
                <h2 className="text-3xl">Tack för ditt intresse! 💜</h2>
                <p className="text-sm leading-7 text-[#635968]">Din intresseanmälan är mottagen. Vi kontaktar dig via mejl om nästa steg och om en testplats finns. Du är inte automatiskt inbjuden till Google Play eller TestFlight än.</p>
                <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#512654] underline underline-offset-4">Till Paceables startsida <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            ) : (
              <>
                <h2 id="form-title" className="text-3xl">Anmäl ditt intresse</h2>
                <p className="mt-2 text-sm leading-6 text-[#635968]">Det tar ungefär en minut. Vi hör av oss via mejl när vi har en testplats.</p>
                <form onSubmit={submit} className="mt-7 space-y-5">
                  <div>
                    <label htmlFor="tester-email" className={label}>Din mejladress *</label>
                    <input id="tester-email" className={control} type="email" name="email" autoComplete="email" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} placeholder="namn@exempel.se" />
                    <p className="mt-1.5 text-xs leading-5 text-[#746979]">För Android: ange gärna adressen du använder i Google Play.</p>
                  </div>
                  <div>
                    <label htmlFor="tester-platform" className={label}>Vilken enhet vill du testa på? *</label>
                    <select id="tester-platform" className={control} required value={platform} onChange={e => setPlatform(e.target.value as Platform | "")}>
                      <option value="">Välj enhet</option>
                      <option value="android">Android</option>
                      <option value="ios">iPhone / iPad</option>
                      <option value="both">Både Android och iPhone</option>
                      <option value="web">Webbläsare</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tester-participation" className={label}>Hur vill du hjälpa till? *</label>
                    <select id="tester-participation" className={control} required value={participation} onChange={e => setParticipation(e.target.value as Participation | "")}>
                      <option value="">Välj det som passar dig</option>
                      <option value="both">Både tekniktest och vardagsfeedback</option>
                      <option value="technical">Främst installation och teknik</option>
                      <option value="everyday">Främst hur appen hjälper i vardagen</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tester-focus" className={label}>Vad är mest intressant att prova?</label>
                    <select id="tester-focus" className={control} value={focus} onChange={e => setFocus(e.target.value as Focus)}>
                      <option value="general">Lite av allt / vet inte än</option>
                      <option value="planning">Planera och få överblick</option>
                      <option value="energy">Energi och batteri</option>
                      <option value="capture">Fånga tankar</option>
                      <option value="recovery">Återhämtning och pauser</option>
                      <option value="overview">Få ihop vardagen</option>
                    </select>
                  </div>
                  <div className="space-y-3 border-t border-[#EAE5E9] pt-5 text-sm leading-6 text-[#493B4D]">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input className="mt-1 h-4 w-4 accent-[#512654]" type="checkbox" checked={feedback} onChange={e => setFeedback(e.target.checked)} />
                      <span>Jag kan tänka mig att svara på några korta frågor om testet.</span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input className="mt-1 h-4 w-4 accent-[#512654]" type="checkbox" required checked={adult} onChange={e => setAdult(e.target.checked)} />
                      <span>Jag är minst 18 år. *</span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input className="mt-1 h-4 w-4 accent-[#512654]" type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} />
                      <span>Jag samtycker till att Paceable sparar min mejladress och mina val för att kontakta mig om testningen. *</span>
                    </label>
                  </div>
                  <p className="text-xs leading-6 text-[#746979]">
                    Uppgifterna används bara för testrekrytering, inte för reklam. Du kan när som helst be oss ta bort din anmälan via <a className="underline underline-offset-2" href="mailto:kontakt@paceable.se">kontakt@paceable.se</a>. Läs vår <Link to="/integritet" className="underline underline-offset-2">integritetspolicy</Link>.
                  </p>
                  {/* Honeypot: kept out of keyboard and screen-reader navigation. */}
                  <div className="absolute -left-[9999px]" aria-hidden="true">
                    <label htmlFor="tester-company">Företag</label>
                    <input id="tester-company" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={e => setCompany(e.target.value)} />
                  </div>
                  {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
                  <button type="submit" disabled={sending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#512654] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#66376a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#512654] disabled:opacity-60">
                    {sending ? "Skickar…" : "Jag vill testa Paceable"}
                    {!sending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
        <div className="welcome-wrap pb-14 text-center text-sm text-[#635968]">
          <MessageCircle className="mx-auto mb-2 h-6 w-6 text-[#967AA0]" aria-hidden="true" />
          <p>Alla ansökningar behöver inte leda till en testplats. Tack för att du vill hjälpa till.</p>
          <p className="mt-2 inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Du behöver inte lämna några hälsouppgifter eller diagnoser.</p>
        </div>
      </div>
    </PublicPage>
  );
}
