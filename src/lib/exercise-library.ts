/**
 * Övningsbiblioteket – ren data, helt utan UI.
 *
 * Varje övning beskrivs en gång och återanvänds av generatorn, träningskorten
 * och steg-för-steg-läget. Här finns inga medicinska påståenden: "avoid" säger
 * bara vilka kroppsdelar övningen typiskt belastar mer, så att generatorn kan
 * välja skonsammare alternativ när användaren angett att något gör ont.
 */

export type ExerciseFocus = "helkropp" | "överkropp" | "underkropp" | "bål" | "rörlighet";
export type Equipment = "kroppsvikt" | "hantlar" | "kettlebell" | "medicinboll" | "miniband";
export type Difficulty = "lätt" | "medel" | "utmanande";
/** Kroppsdelar som användaren kan ange som ömma. */
export type BodyArea = "knän" | "skuldra" | "rygg" | "handled" | "nacke" | "höft";
/** Vilken sorts arbete övningen är – styr uppvärmning, huvuddel och nedvarvning. */
export type ExerciseRole = "uppvärmning" | "huvuddel" | "nedvarvning";

export interface Exercise {
  id: string;
  name: string;
  /** Kort beskrivning i du-form, en mening. */
  summary: string;
  focus: ExerciseFocus;
  /** Muskler/områden som jobbar mest. */
  muscles: string[];
  difficulty: Difficulty;
  equipment: Equipment[];
  role: ExerciseRole;
  /** 2–4 korta teknikpunkter. */
  cues: string[];
  /** Diskret säkerhetsnotis, aldrig medicinsk. */
  safety?: string;
  /** Skonsammare variant om något känns för mycket. */
  modification?: string;
  /** Tuffare variant när energin räcker. */
  progression?: string;
  /** Kroppsdelar som ofta blir provocerade – undviks vid angiven ömhet. */
  avoid?: BodyArea[];
  /** Tid- eller repbaserad. */
  measure: "reps" | "tid";
  /** Standardupplägg, justeras av generatorn. */
  defaultSets: number;
  defaultReps?: number;
  defaultSeconds?: number;
  /** Ungefärlig intensitet, används för grov kaloriuppskattning (MET-liknande). */
  intensity: 1 | 2 | 3;
  /** Enkel illustrationsnyckel – mappar till en ritad figur i UI:t. */
  illustration: IllustrationKey;
}

export type IllustrationKey =
  | "bridge"
  | "hinge"
  | "squat"
  | "calf"
  | "quadruped"
  | "row"
  | "press"
  | "curl"
  | "carry"
  | "band"
  | "step"
  | "lunge"
  | "core"
  | "stretch"
  | "breath"
  | "march"
  | "plank"
  | "sideplank"
  | "pushup"
  | "swing"
  | "jump"
  | "overhead"
  | "twist"
  | "childpose"
  | "hamstring"
  | "neck";


export const EXERCISES: Exercise[] = [
  {
    id: "glute-bridge",
    name: "Höftlyft (glute bridge)",
    summary: "Ligg på rygg och lyft höften – snäll mot knän och rygg.",
    focus: "underkropp",
    muscles: ["säte", "baksida lår", "bål"],
    difficulty: "lätt",
    equipment: ["kroppsvikt", "miniband"],
    role: "huvuddel",
    cues: ["Fötterna höftbrett, hälarna nära rumpan", "Tryck genom hälarna", "Spänn sätet i toppen"],
    modification: "Lyft bara halvvägs och vila mellan varje lyft.",
    progression: "Lägg ett miniband runt låren eller gör en fot i taget.",
    measure: "reps",
    defaultSets: 3,
    defaultReps: 12,
    intensity: 1,
    illustration: "bridge",
  },
  {
    id: "hip-thrust-floor",
    name: "Höftlyft med paus",
    summary: "Samma rörelse som höftlyft men med två sekunders paus i toppen.",
    focus: "underkropp",
    muscles: ["säte", "bål"],
    difficulty: "medel",
    equipment: ["kroppsvikt", "hantlar"],
    role: "huvuddel",
    cues: ["Håll hakan lätt nedåt", "Pausa 2 sekunder överst", "Sänk långsamt"],
    measure: "reps",
    defaultSets: 3,
    defaultReps: 10,
    intensity: 2,
    illustration: "bridge",
  },
  {
    id: "rdl",
    name: "Rumänska marklyft",
    summary: "Fäll i höften med rak rygg och känn baksidan av låren.",
    focus: "underkropp",
    muscles: ["baksida lår", "säte", "rygg"],
    difficulty: "medel",
    equipment: ["hantlar", "kettlebell"],
    role: "huvuddel",
    cues: ["Skjut höften bakåt", "Lätt böjda knän", "Håll vikten nära benen"],
    safety: "Gå bara så långt ner som du kan hålla ryggen lång.",
    modification: "Kortare rörelse, lättare vikt eller helt utan vikt.",
    avoid: ["rygg"],
    measure: "reps",
    defaultSets: 3,
    defaultReps: 10,
    intensity: 2,
    illustration: "hinge",
  },
  {
    id: "sit-to-stand",
    name: "Sitt-till-stå (box squat)",
    summary: "Res dig från en stol och sätt dig ner med kontroll.",
    focus: "underkropp",
    muscles: ["lår", "säte"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "huvuddel",
    cues: ["Fötterna stadigt i golvet", "Luta överkroppen lätt framåt", "Res dig genom hela foten"],
    modification: "Använd armstöd eller en högre stol.",
    progression: "Håll en hantel mot bröstet.",
    measure: "reps",
    defaultSets: 3,
    defaultReps: 10,
    intensity: 2,
    illustration: "squat",
  },
  {
    id: "calf-raise",
    name: "Tåhävningar",
    summary: "Res dig upp på tå med stöd av en vägg eller stolsrygg.",
    focus: "underkropp",
    muscles: ["vader"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "huvuddel",
    cues: ["Håll lätt i något för balans", "Upp långsamt, ner ännu långsammare"],
    measure: "reps",
    defaultSets: 2,
    defaultReps: 15,
    intensity: 1,
    illustration: "calf",
  },
  {
    id: "bird-dog",
    name: "Bird dog",
    summary: "Stå på alla fyra och sträck ut motsatt arm och ben.",
    focus: "bål",
    muscles: ["bål", "rygg", "säte"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "huvuddel",
    cues: ["Håll höften stilla", "Sträck långt istället för högt", "Andas jämnt"],
    modification: "Sträck bara ut armen, eller bara benet.",
    avoid: ["handled"],
    measure: "reps",
    defaultSets: 2,
    defaultReps: 8,
    intensity: 1,
    illustration: "quadruped",
  },
  {
    id: "dead-bug",
    name: "Dead bug",
    summary: "Ligg på rygg och sänk motsatt arm och ben med kontroll.",
    focus: "bål",
    muscles: ["bål"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "huvuddel",
    cues: ["Håll svanken mot golvet", "Rör dig långsamt", "Andas ut när du sänker"],
    modification: "Rör bara ett ben i taget.",
    measure: "reps",
    defaultSets: 2,
    defaultReps: 10,
    intensity: 1,
    illustration: "core",
  },
  {
    id: "pelvic-tilt",
    name: "Bäckentippning",
    summary: "Mjuk bålövning på rygg som är snäll mot ländryggen.",
    focus: "bål",
    muscles: ["bål", "bäcken"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "huvuddel",
    cues: ["Tryck ländryggen mjukt mot golvet", "Släpp långsamt tillbaka", "Andas lugnt"],
    measure: "reps",
    defaultSets: 2,
    defaultReps: 12,
    intensity: 1,
    illustration: "core",
  },
  {
    id: "one-arm-row",
    name: "Enarmsrodd",
    summary: "Dra hanteln mot höften med stöd av stol eller bänk.",
    focus: "överkropp",
    muscles: ["rygg", "biceps"],
    difficulty: "medel",
    equipment: ["hantlar", "kettlebell"],
    role: "huvuddel",
    cues: ["Stötta med andra handen", "Dra armbågen bakåt", "Håll nacken lång"],
    modification: "Lättare vikt och färre repetitioner.",
    avoid: ["skuldra"],
    measure: "reps",
    defaultSets: 3,
    defaultReps: 10,
    intensity: 2,
    illustration: "row",
  },
  {
    id: "seated-row-band",
    name: "Sittande rodd",
    summary: "Sitt ner och dra ett miniband mot magen.",
    focus: "överkropp",
    muscles: ["rygg"],
    difficulty: "lätt",
    equipment: ["miniband"],
    role: "huvuddel",
    cues: ["Sitt lång i ryggen", "Dra mot naveln", "Släpp tillbaka långsamt"],
    measure: "reps",
    defaultSets: 3,
    defaultReps: 12,
    intensity: 1,
    illustration: "row",
  },
  {
    id: "chest-press",
    name: "Bröstpress på golv",
    summary: "Ligg på rygg och pressa hantlarna rakt upp.",
    focus: "överkropp",
    muscles: ["bröst", "triceps", "axlar"],
    difficulty: "medel",
    equipment: ["hantlar"],
    role: "huvuddel",
    cues: ["Armbågarna i cirka 45 grader", "Pressa jämnt upp", "Sänk tills armbågarna nuddar golvet"],
    avoid: ["skuldra"],
    modification: "Lättare vikt eller bara en arm i taget.",
    measure: "reps",
    defaultSets: 3,
    defaultReps: 10,
    intensity: 2,
    illustration: "press",
  },
  {
    id: "biceps-curl",
    name: "Bicepscurl",
    summary: "Böj armbågarna och lyft hantlarna mot axlarna.",
    focus: "överkropp",
    muscles: ["biceps"],
    difficulty: "lätt",
    equipment: ["hantlar", "kettlebell", "miniband"],
    role: "huvuddel",
    cues: ["Håll armbågarna nära kroppen", "Lyft utan att gunga", "Sänk kontrollerat"],
    avoid: ["handled"],
    measure: "reps",
    defaultSets: 2,
    defaultReps: 12,
    intensity: 1,
    illustration: "curl",
  },
  {
    id: "suitcase-carry",
    name: "Suitcase carry",
    summary: "Gå med en vikt i ena handen och håll kroppen rak.",
    focus: "helkropp",
    muscles: ["bål", "grepp", "axlar"],
    difficulty: "medel",
    equipment: ["hantlar", "kettlebell"],
    role: "huvuddel",
    cues: ["Stå lång", "Låt inte kroppen luta", "Byt sida"],
    avoid: ["handled", "rygg"],
    modification: "Kortare sträcka och lättare vikt.",
    measure: "tid",
    defaultSets: 2,
    defaultSeconds: 30,
    intensity: 2,
    illustration: "carry",
  },
  {
    id: "band-side-walk",
    name: "Miniband sidogång",
    summary: "Små steg i sidled med bandet runt låren.",
    focus: "underkropp",
    muscles: ["säte", "höft"],
    difficulty: "lätt",
    equipment: ["miniband"],
    role: "huvuddel",
    cues: ["Lätt böjda knän", "Små steg", "Håll spänningen i bandet"],
    measure: "tid",
    defaultSets: 2,
    defaultSeconds: 30,
    intensity: 1,
    illustration: "band",
  },
  {
    id: "low-step-up",
    name: "Step-up på låg höjd",
    summary: "Kliv upp på ett lågt steg och ner igen.",
    focus: "underkropp",
    muscles: ["lår", "säte"],
    difficulty: "medel",
    equipment: ["kroppsvikt", "hantlar"],
    role: "huvuddel",
    cues: ["Hela foten på steget", "Tryck genom hälen", "Kliv ner mjukt"],
    avoid: ["knän"],
    modification: "Lägre steg eller håll i något för balans.",
    measure: "reps",
    defaultSets: 3,
    defaultReps: 8,
    intensity: 2,
    illustration: "step",
  },
  {
    id: "reverse-lunge",
    name: "Bakåtlunge med stöd",
    summary: "Kliv bakåt och sänk dig mjukt med handen mot en stol.",
    focus: "underkropp",
    muscles: ["lår", "säte"],
    difficulty: "utmanande",
    equipment: ["kroppsvikt", "hantlar"],
    role: "huvuddel",
    cues: ["Håll i en stol", "Kliv bakåt, inte framåt", "Sänk bara så långt det känns bra"],
    avoid: ["knän"],
    modification: "Halv rörelse eller byt till sitt-till-stå.",
    measure: "reps",
    defaultSets: 3,
    defaultReps: 8,
    intensity: 3,
    illustration: "lunge",
  },
  {
    id: "med-ball-twist",
    name: "Sittande vridning med boll",
    summary: "Sitt ner och vrid bollen lugnt från sida till sida.",
    focus: "bål",
    muscles: ["bål", "sidor"],
    difficulty: "medel",
    equipment: ["medicinboll"],
    role: "huvuddel",
    cues: ["Vrid från bålen, inte bara armarna", "Håll ryggen lång", "Andas jämnt"],
    avoid: ["rygg"],
    measure: "tid",
    defaultSets: 2,
    defaultSeconds: 30,
    intensity: 2,
    illustration: "core",
  },
  {
    id: "march-in-place",
    name: "Marsch på stället",
    summary: "Lugn uppvärmning som får igång blodet.",
    focus: "helkropp",
    muscles: ["ben", "bål"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "uppvärmning",
    cues: ["Lyft knäna lagom högt", "Svinga armarna lätt", "Andas genom näsan"],
    measure: "tid",
    defaultSets: 1,
    defaultSeconds: 60,
    intensity: 1,
    illustration: "march",
  },
  {
    id: "shoulder-rolls",
    name: "Axelrullningar",
    summary: "Mjuka cirklar för att värma upp axlar och nacke.",
    focus: "rörlighet",
    muscles: ["axlar", "nacke"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "uppvärmning",
    cues: ["Stora långsamma cirklar", "Slappna av i käken"],
    measure: "tid",
    defaultSets: 1,
    defaultSeconds: 40,
    intensity: 1,
    illustration: "stretch",
  },
  {
    id: "cat-cow",
    name: "Katt–ko",
    summary: "Mjuka rörelser för ryggen på alla fyra.",
    focus: "rörlighet",
    muscles: ["rygg", "bål"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "uppvärmning",
    cues: ["Följ andningen", "Rör hela ryggen", "Inget ska göra ont"],
    avoid: ["handled"],
    measure: "tid",
    defaultSets: 1,
    defaultSeconds: 45,
    intensity: 1,
    illustration: "quadruped",
  },
  {
    id: "hip-opener",
    name: "Höftöppnare sittande",
    summary: "Sitt och luta dig lugnt framåt för att mjuka upp höften.",
    focus: "rörlighet",
    muscles: ["höft", "säte"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "nedvarvning",
    cues: ["Luta från höften", "Håll 20–30 sekunder per sida", "Andas långsamt"],
    measure: "tid",
    defaultSets: 2,
    defaultSeconds: 30,
    intensity: 1,
    illustration: "stretch",
  },
  {
    id: "chest-stretch",
    name: "Bröststräck i dörrkarm",
    summary: "Mjuk öppning för bröst och axlar.",
    focus: "rörlighet",
    muscles: ["bröst", "axlar"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "nedvarvning",
    cues: ["Armen i axelhöjd", "Vrid kroppen lugnt bort", "Stanna där det känns skönt"],
    avoid: ["skuldra"],
    measure: "tid",
    defaultSets: 2,
    defaultSeconds: 25,
    intensity: 1,
    illustration: "stretch",
  },
  {
    id: "breathing-down",
    name: "Lugn andning",
    summary: "Avsluta med några djupa andetag, 4 in och 6 ut.",
    focus: "rörlighet",
    muscles: ["andning"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "nedvarvning",
    cues: ["Andas in 4", "Andas ut 6", "Släpp axlarna"],
    measure: "tid",
    defaultSets: 1,
    defaultSeconds: 60,
    intensity: 1,
    illustration: "breath",
  },
  {
    id: "wall-pushup",
    name: "Armhävning mot vägg",
    summary: "Skonsam pressövning för bröst och axlar.",
    focus: "överkropp",
    muscles: ["bröst", "triceps"],
    difficulty: "lätt",
    equipment: ["kroppsvikt"],
    role: "huvuddel",
    cues: ["Händerna i axelhöjd", "Kroppen rak som en planka", "Tryck ifrån lugnt"],
    modification: "Stå närmare väggen.",
    measure: "reps",
    defaultSets: 2,
    defaultReps: 12,
    intensity: 1,
    illustration: "press",
  },
  {
    id: "kb-deadlift",
    name: "Marklyft med kettlebell",
    summary: "Lyft kettlebellen från golvet med rak rygg.",
    focus: "helkropp",
    muscles: ["säte", "baksida lår", "rygg"],
    difficulty: "medel",
    equipment: ["kettlebell"],
    role: "huvuddel",
    cues: ["Höften bakåt", "Bröstet upp", "Tryck ifrån golvet med fötterna"],
    avoid: ["rygg"],
    modification: "Lyft från en låg låda så du inte behöver ner lika djupt.",
    measure: "reps",
    defaultSets: 3,
    defaultReps: 10,
    intensity: 2,
    illustration: "hinge",
  },
];

export const exerciseById = (id: string): Exercise | undefined =>
  EXERCISES.find((e) => e.id === id);

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  kroppsvikt: "Kroppsvikt",
  hantlar: "Hantlar",
  kettlebell: "Kettlebell",
  medicinboll: "Medicinboll",
  miniband: "Miniband",
};

export const BODY_AREAS: BodyArea[] = ["knän", "skuldra", "rygg", "handled", "nacke", "höft"];
