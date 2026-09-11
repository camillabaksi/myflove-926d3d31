import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, MapPin, CalendarClock, Upload, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CollapsibleSection from "@/components/collapsible-section";
import HelpHint from "@/components/help-hint";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { parseScheduleText } from "@/lib/schedule-parse";
import { supabase } from "@/integrations/supabase/client";
import { ACCEPT_DOCUMENTS } from "@/lib/file-formats";

interface ScheduleFile {
  path: string;
  name: string;
  isImage: boolean;
}

const FILES_KEY = "myflove-child-schedule-files";

export interface ChildScheduleEntry {
  id: string;
  /** 0 = måndag … 6 = söndag */
  weekday: number;
  start: string; // HH:MM
  end?: string; // HH:MM
  title: string;
  location?: string;
  teacher?: string;
}

const DAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
const SHORT = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const KEY = "myflove-child-schedules";

const newId = () => Math.random().toString(36).slice(2, 11);
/** JS getDay(): 0 = söndag → vårt index där 0 = måndag */
const todayIndex = () => (new Date().getDay() + 6) % 7;

export default function ChildSchedule({
  childId,
  childName,
  canEdit,
}: {
  childId: string;
  childName: string;
  canEdit: boolean;
}) {
  const [all, setAll] = useCloudSyncedStorage<Record<string, ChildScheduleEntry[]>>(KEY, {});
  const entries = useMemo(() => all[childId] ?? [], [all, childId]);

  const [weekday, setWeekday] = useState(todayIndex());
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [teacher, setTeacher] = useState("");
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  // Bild eller dokument på schemat
  const uploadDoc = async (id: string, file: File) => {
    const path = `${id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("child-docs").upload(path, file);
    if (error) throw error;
    return path;
  };
  const openDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("child-docs").createSignedUrl(path, 300);
    if (error) throw error;
    return data.signedUrl;
  };
  const [allFiles, setAllFiles] = useCloudSyncedStorage<Record<string, ScheduleFile[]>>(
    FILES_KEY,
    {},
  );
  const files = useMemo(() => allFiles[childId] ?? [], [allFiles, childId]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      for (const f of files) {
        if (!f.isImage) continue;
        try {
          const url = await openDoc(f.path);
          if (active) setPreviews((p) => ({ ...p, [f.path]: url }));
        } catch {
          /* ignorera */
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [files]);

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadDoc(childId, file);
      const entry: ScheduleFile = {
        path,
        name: file.name,
        isImage: file.type.startsWith("image/"),
      };
      setAllFiles((prev) => ({ ...prev, [childId]: [...(prev[childId] ?? []), entry] }));
      toast.success("Schemat är uppladdat");
    } catch {
      toast.error("Kunde inte ladda upp filen");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const removeFile = (path: string) =>
    setAllFiles((prev) => ({
      ...prev,
      [childId]: (prev[childId] ?? []).filter((f) => f.path !== path),
    }));

  const open = async (path: string) => {
    try {
      const url = await openDoc(path);
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Kunde inte öppna filen");
    }
  };

  const save = (next: ChildScheduleEntry[]) => setAll((prev) => ({ ...prev, [childId]: next }));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    save([
      ...entries,
      {
        id: newId(),
        weekday,
        start,
        end: end || undefined,
        title: title.trim(),
        location: location.trim() || undefined,
        teacher: teacher.trim() || undefined,
      },
    ]);
    setTitle("");
    setLocation("");
    setTeacher("");
    setEnd("");
  };

  const remove = (id: string) => save(entries.filter((e) => e.id !== id));

  const importPaste = () => {
    const parsed = parseScheduleText(paste);
    if (parsed.length === 0) return;
    save([
      ...entries,
      ...parsed.map((p) => ({
        id: newId(),
        weekday: p.weekday,
        start: p.start,
        end: p.end,
        title: p.title,
        location: p.location,
      })),
    ]);
    setPaste("");
    setShowPaste(false);
  };

  const byDay = useMemo(() => {
    const map: ChildScheduleEntry[][] = [[], [], [], [], [], [], []];
    for (const e of entries) (map[e.weekday] ?? map[0]).push(e);
    for (const list of map) list.sort((a, b) => a.start.localeCompare(b.start));
    return map;
  }, [entries]);

  const today = todayIndex();

  const next = useMemo(() => {
    if (entries.length === 0) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return (h ?? 0) * 60 + (m ?? 0);
    };
    for (let offset = 0; offset < 7; offset++) {
      const day = (today + offset) % 7;
      const list = (byDay[day] ?? []).filter((e) => offset > 0 || toMin(e.start) >= nowMin);
      if (list[0]) return { entry: list[0], offset, day };
    }
    return null;
  }, [entries, byDay, today]);

  return (
    <section className="surface-card p-5">
      <CollapsibleSection
        id="Barnets skolschema"
        title={
          <span className="flex items-center gap-2">
            <CalendarClock size={18} className="text-primary" />
            {childName}s skolschema
          </span>
        }
        help={
          <>
            Lägg in skolschemat en gång – det ligger kvar vecka efter vecka. Dagens lektioner
            markeras och nästa lektion visas överst.
          </>
        }
        headingClassName="text-lg font-semibold"
        className="space-y-4"
      >
        <div className="space-y-3">
          {canEdit && (
            <>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT_DOCUMENTS}
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl w-full"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={18} className="mr-2" />
                {uploading ? "Laddar upp…" : "Ladda upp bild eller dokument på schemat"}
              </Button>
            </>
          )}

          {files.map((f) => (
            <div key={f.path} className="rounded-2xl border border-border overflow-hidden">
              {f.isImage && previews[f.path] ? (
                <button type="button" onClick={() => open(f.path)} className="block w-full">
                  <img
                    src={previews[f.path]}
                    alt={`Skolschema för ${childName}`}
                    className="w-full object-contain"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => open(f.path)}
                  className="flex items-center gap-2 p-3 text-sm w-full text-left"
                >
                  <FileText size={16} className="text-primary shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{f.name}</span>
                  <ExternalLink size={14} className="text-muted-foreground" />
                </button>
              )}
              {canEdit && (
                <div className="flex justify-end border-t border-border p-2">
                  <button
                    type="button"
                    onClick={() => removeFile(f.path)}
                    className="text-muted-foreground hover:text-destructive text-xs flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Ta bort
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {next && (
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-3">
            <div className="text-xs text-muted-foreground">
              Nästa lektion ·{" "}
              {next.offset === 0 ? "idag" : next.offset === 1 ? "imorgon" : DAYS[next.day]}
            </div>
            <div className="font-medium">
              {next.entry.start}
              {next.entry.end ? `–${next.entry.end}` : ""} {next.entry.title}
            </div>
            {(next.entry.location || next.entry.teacher) && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin size={12} />{" "}
                {[next.entry.location, next.entry.teacher].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        )}

        {canEdit && (
          <form onSubmit={add} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {SHORT.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWeekday(i)}
                  aria-pressed={weekday === i}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    weekday === i
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ämne, t.ex. Matematik"
              className="h-11 rounded-2xl"
            />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                aria-label="Starttid"
                className="h-11 rounded-2xl"
              />
              <Input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                aria-label="Sluttid (valfritt)"
                className="h-11 rounded-2xl"
              />
            </div>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sal eller plats (valfritt)"
              className="h-11 rounded-2xl"
            />
            <Input
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Lärare (valfritt)"
              className="h-11 rounded-2xl"
            />
            <div className="flex gap-2">
              <Button type="submit" className="h-11 rounded-2xl flex-1">
                <Plus size={18} className="mr-1" /> Lägg till lektion
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={() => setShowPaste((v) => !v)}
              >
                Klistra in
              </Button>
            </div>

            {showPaste && (
              <div className="space-y-2">
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  rows={5}
                  placeholder={
                    "Måndag 08:20-09:05 Matematik, sal 3\nTis 09:15-10:00 Svenska, sal 12"
                  }
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-2xl"
                  onClick={importPaste}
                >
                  Tolka och lägg till
                </Button>
              </div>
            )}
          </form>
        )}

        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Inget skolschema än – lägg in en lektion i taget, eller klistra in hela schemat.
            </p>
          ) : (
            DAYS.map((day, i) =>
              (byDay[i] ?? []).length === 0 ? null : (
                <div
                  key={day}
                  className={`rounded-2xl border p-3 ${
                    i === today ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="text-sm font-semibold mb-2">
                    {day}
                    {i === today && <span className="text-primary text-xs ml-2">idag</span>}
                  </div>
                  <ul className="space-y-1.5">
                    {(byDay[i] ?? []).map((e) => (
                      <li key={e.id} className="flex items-start gap-3 text-sm">
                        <span className="tabular-nums text-muted-foreground w-24 shrink-0">
                          {e.start}
                          {e.end ? `–${e.end}` : ""}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="font-medium">{e.title}</span>
                          {(e.location || e.teacher) && (
                            <span className="text-muted-foreground flex items-center gap-1 text-xs">
                              <MapPin size={12} />{" "}
                              {[e.location, e.teacher].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => remove(e.id)}
                            aria-label={`Ta bort ${e.title}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )
          )}
        </div>
      </CollapsibleSection>
    </section>
  );
}
