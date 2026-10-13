# Paceable – gemensamma block på sekundära sidor

51 sidfiler inventerades mot den befintliga Paceable-stilen. Äldre block, pastellytor, höga minimerade rutor, dekorativa sidhuvuden och fristående kort använder nu samma presentation genom en uttrycklig sidscope och befintliga komponenter.

| Område | Uppdaterade ytor |
| --- | --- |
| Profil, inställningar och anpassning | Rubriker, inställningsblock, separata kort och visning av långa etiketter |
| Familj, barn och relationer | Gemensamma block och äldre paneler; barnens bildstöd och profilfärger ligger kvar i sina egna komponenter |
| Arbete och studier | Paneler, sammanfattningar och hopfällbara sektioner |
| Ekonomi och inköp | Block, transaktionskort, statistikytor och äldre paneler |
| Rutiner, medicin och påminnelser | Block, minimerade rubrikrader och fristående påminnelsekort |
| Batteri, mående, återhämtning och historik | Ytor runt befintliga mätvärden, listor och diagram |
| Övriga sekundära sidor | Gemensamma Card/MyFloveCard/ExpandableBlock/CollapsibleSection och surface-card-ytor |

## Presentation

- Samma Paceable-ytor, radier och diskreta skuggor används för gemensamma och fristående block.
- MyFloveBlock har en kompakt ikon–rubrik–pil-rad. Minimerade block saknar fasta höjdgränser och klippta rubriker.
- Blockrutnätet har en kolumn på smal skärm och två från 640 px. Expanderade block fortsätter att ta hela raden.
- ExpandableBlock behåller länk-, widget- och expansionslägen. Sammanfattningar får en egen rad i de vanliga kompakta blocken.
- Sidhuvuden använder en lugn rubrikyta med befintliga namn, hjälpknappar och handlingar.

## Avgränsning

`usesRefreshedDesign` väljer scope. Idag, Kalender, Fånga, Hälsa, Träning, den isolerade designsystemreferensen och publika vyer använder sina redan godkända presentationer. Träning och träningskomponenterna får ingen ny designscope. Scope tas bort vid navigation/avmontering och sätts före nästa målning.

Befintliga collapse-id, lagring, formulär, sparfunktioner, kontoseparering, delningsbehörigheter, energivärden, diagramfärger och bildfiler används vidare. Ändringen lägger inte till någon datalagring eller migrering. Personliga färgteman och livskategorifärger fortsätter via sina befintliga tokens.

## Verifiering

64 tester för scope, befintliga blockhandlingar och hopfällning, sparade blocklägen, länk/inline-expansion, designsystem, uppgifter, påminnelser, träning, hjälpnivå och personliga inställningar passerar. TypeScript och produktionsbygget kontrolleras separat.

En visuell kontroll i mobil-/desktopwebbläsare kunde inte slutföras i denna miljö: Chromium-installationen fick en ogiltig nedladdning och molnwebbläsarens URL-policy avvisade den lokala komponentförhandsgranskningen (file-protokollet tillåts inte). Ingen pixel- eller överflödeskontroll i en riktig webbläsare påstås. Kontrollera efter publicering särskilt 320/390 px och förstorad text på Profil, Anpassa, Ekonomi och Studier, samt att Träning/Kalender behåller sin geometri.
