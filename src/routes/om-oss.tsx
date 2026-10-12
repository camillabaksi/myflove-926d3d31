import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicPage } from "@/components/landing/public-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: "Om Paceable – Ditt liv, i din takt." },
      {
        name: "description",
        content:
          "Paceable hjälper dig att samla tankar, planera efter din energi och ta ett steg i taget.",
      },
      { property: "og:title", content: "Om Paceable – Ditt liv, i din takt." },
      {
        property: "og:description",
        content: "Ett mjukare sätt att planera vardagen, med omtanke om din energi och ditt fokus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicPage>
      <div className="px-5 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <section className="py-20 sm:py-28">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Om Paceable
            </p>
            <h1 className="mt-5 font-display text-4xl leading-tight font-extrabold sm:text-5xl">
              Vardagen ska kräva mindre av hjärnan.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
              Paceable är en vardagsplanerare som hjälper dig samla det som snurrar, planera efter
              din dagsform och fokusera på nästa rimliga steg. Du behöver inte göra allt på en gång.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full">
              <Link to="/sign-up">Prova Paceable</Link>
            </Button>
          </section>
        </div>
      </div>
    </PublicPage>
  );
}
