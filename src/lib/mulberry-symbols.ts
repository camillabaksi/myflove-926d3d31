import type { PictogramId } from "@/lib/child-visual-schedule";

/** Vendored, unmodified symbols: private titles never leave the app. */
export const MULBERRY_SYMBOLS = {
  "breakfast": "breakfast_4",
  "meal": "dinner",
  "dress": "get_dressed_,_to",
  "teeth": "brush_teeth_,_to",
  "shower": "shower",
  "sleep": "sleep_on_side_,_to",
  "bag": "school_bag",
  "home": "house",
  "clean": "vacuum_cleaner_1",
  "laundry": "wash_clothes_,_to",
  "shopping": "shop",
  "school": "school",
  "study": "study_,_to",
  "childcare": "toys",
  "walk": "walk_,_to",
  "car": "car_2",
  "bus": "bus",
  "train": "train",
  "bike": "bicycle",
  "play": "toys",
  "friends": "talk_1_,_to",
  "exercise": "exercise_,_to",
  "swim": "swim_,_to",
  "game": "computer_game",
  "tv": "flatscreen_tv",
  "craft": "craft_table",
  "music": "music",
  "pause": "take_a_work_break_,_to",
  "quiet": "quiet",
  "headphones": "headphones",
  "rest": "rest_,_to",
  "family": "family",
  "visit": "visit_,_to",
  "doctor": "doctor_1a",
  "dentist": "dentist_1a",
  "pharmacy": "tablets",
  "clinic": "surgery_health_centre",
  "vaccination": "syringe",
  "nurse": "nurse_1a",
  "emergency": "ambulance",
  "conversation": "talk_1_,_to",
  "optician": "glasses",
  "hearing": "hearing_aid_1",
  "physio": "physio_therapist_1a",
  "work": "work_,_to",
  "money": "money",
  "calendar": "calendar",
  "coffee": "coffee",
  "phone": "telephone_handset",
  "mail": "letter",
  "birthday": "birthday_cake",
  "pets": "dog",
  "medication": "tablets",
  "break": "take_a_work_break_,_to"
} as const;
export type MulberrySymbolId = PictogramId | keyof typeof MULBERRY_SYMBOLS;
export function mulberrySymbolUrl(id: MulberrySymbolId): string | undefined {
  const name = (MULBERRY_SYMBOLS as Partial<Record<MulberrySymbolId, string>>)[id];
  return name ? `/symbols/mulberry/${encodeURIComponent(name)}.svg` : undefined;
}

// Specific actions precede broader activities. Match word starts, never a
// substring inside another word ("matematik" is not food; "passa" is not exercise).
const RULES: Array<[MulberrySymbolId, RegExp]> = [
  ["teeth", /(?:^|[^\p{L}])(?:borsta tänder|tandborst)/u],
  ["dentist", /(?:^|[^\p{L}])(?:tandläkar|tandvård|tandhygien)/u],
  ["medication", /(?:^|[^\p{L}])(?:medicin|tablett|dosett)/u],
  ["pharmacy", /(?:^|[^\p{L}])(?:apotek)/u],
  ["vaccination", /(?:^|[^\p{L}])(?:vaccin)/u],
  ["doctor", /(?:^|[^\p{L}])(?:läkar|doktor)/u],
  ["clinic", /(?:^|[^\p{L}])(?:vårdcentral|bvc|mottagning)/u],
  ["breakfast", /(?:^|[^\p{L}])(?:frukost|mellanmål)/u],
  ["coffee", /(?:^|[^\p{L}])(?:fika|kaffe)/u],
  ["meal", /(?:^|[^\p{L}])(?:middag|lunch|äta|matlåda)/u],
  ["dress", /(?:^|[^\p{L}])(?:klä på|påklädning)/u],
  ["bag", /(?:^|[^\p{L}])(?:packa|väska|hämtning|lämning|hämta barn|lämna barn)/u],
  ["shower", /(?:^|[^\p{L}])(?:duscha|dusch|bada)/u],
  ["sleep", /(?:^|[^\p{L}])(?:sova|läggdags|sömn)/u],
  ["laundry", /(?:^|[^\p{L}])(?:tvätt|tvätta|vika kläder)/u],
  ["clean", /(?:^|[^\p{L}])(?:städa|städning|dammsug|plocka undan)/u],
  ["shopping", /(?:^|[^\p{L}])(?:handla|inköp|mataffär|matbutik)/u],
  ["childcare", /(?:^|[^\p{L}])(?:förskola|dagis|fritids|barnomsorg)/u],
  ["study", /(?:^|[^\p{L}])(?:läxa|plugg|studera|föreläsning|matematik|lektion|tenta)/u],
  ["school", /(?:^|[^\p{L}])(?:skola)/u],
  ["walk", /(?:^|[^\p{L}])(?:promenad|gå till)/u],
  ["swim", /(?:^|[^\p{L}])(?:simning|simma)/u],
  ["exercise", /(?:^|[^\p{L}])(?:träning|träna|gym|löpning|springa|yoga)/u],
  ["bike", /(?:^|[^\p{L}])(?:cykel|cykla)/u],
  ["bus", /(?:^|[^\p{L}])(?:buss)/u],
  ["train", /(?:^|[^\p{L}])(?:tåg|pendel|tunnelbana)/u],
  ["car", /(?:^|[^\p{L}])(?:bil|köra|skjuts)/u],
  ["headphones", /(?:^|[^\p{L}])(?:hörlurar)/u],
  ["quiet", /(?:^|[^\p{L}])(?:lugn stund|tyst stund)/u],
  ["rest", /(?:^|[^\p{L}])(?:vila|återhämtning)/u],
  ["pause", /(?:^|[^\p{L}])(?:paus|rast(?:$|[^\p{L}]))/u],
  ["music", /(?:^|[^\p{L}])(?:musik|sjunga)/u],
  ["craft", /(?:^|[^\p{L}])(?:pyssla|pyssel|måla|rita)/u],
  ["game", /(?:^|[^\p{L}])(?:spela|gaming|tv-spel)/u],
  ["tv", /(?:^|[^\p{L}])(?:tv(?:$|[^\p{L}])|film)/u],
  ["play", /(?:^|[^\p{L}])(?:lek(?:$|[^\p{L}])|leka(?:$|[^\p{L}]))/u],
  ["friends", /(?:^|[^\p{L}])(?:kompis|vän(?:$|[^\p{L}]))/u],
  ["birthday", /(?:^|[^\p{L}])(?:födelsedag|kalas)/u],
  ["pets", /(?:^|[^\p{L}])(?:hund|husdjur|rasta hund)/u],
  ["money", /(?:^|[^\p{L}])(?:räkning|faktura|betala|budget|lön)/u],
  ["phone", /(?:^|[^\p{L}])(?:ringa|telefon)/u],
  ["mail", /(?:^|[^\p{L}])(?:mejl|mail|brev|post(?:$|[^\p{L}]))/u],
  ["conversation", /(?:^|[^\p{L}])(?:samtal|terapi|psykolog|kurator)/u],
  ["work", /(?:^|[^\p{L}])(?:jobb|arbete|möte|avstämning|deadline)/u],
  ["home", /(?:^|[^\p{L}])(?:hemma)/u],
];

export function mulberryForTitle(title: string, fallback: MulberrySymbolId = "calendar"): MulberrySymbolId {
  const normalized = title.normalize("NFC").toLocaleLowerCase("sv");
  return RULES.find(([, pattern]) => pattern.test(normalized))?.[0] ?? fallback;
}

/** A local choice overrides the global setting, including an explicit off. */
export function calendarPictogramsEnabled(local: boolean | null, global: boolean): boolean {
  return typeof local === "boolean" ? local : global;
}
