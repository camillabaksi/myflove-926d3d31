// Lightweight ICS export/import helpers for MyFlove

export interface IcsEvent {
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM (local)
  description?: string;
  uid?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsDate(date: string, time?: string): { value: string; allDay: boolean } {
  const [y, m, d] = date.split("-");
  if (!time) {
    return { value: `${y}${m}${d}`, allDay: true };
  }
  const [hh, mm] = time.split(":");
  return { value: `${y}${m}${d}T${hh}${mm}00`, allDay: false };
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function nowStamp() {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export function buildIcs(events: IcsEvent[], calName = "MyFlove"): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyFlove//SE",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(calName)}`,
  ];
  for (const ev of events) {
    const start = toIcsDate(ev.date, ev.time);
    const uid = ev.uid || `${Date.now()}-${Math.random().toString(36).slice(2)}@myflow`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStamp()}`);
    if (start.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${start.value}`);
    } else {
      lines.push(`DTSTART:${start.value}`);
      // 30 min default duration
      const [y, m, d] = ev.date.split("-").map(Number);
      const [hh, mm] = (ev.time as string).split(":").map(Number);
      const end = new Date(y, m - 1, d, hh, mm + 30);
      lines.push(
        `DTEND:${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`,
      );
    }
    lines.push(`SUMMARY:${escapeText(ev.title)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(events: IcsEvent[], filename = "myflow.ics") {
  const blob = new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Import ----------

function unfold(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function unescapeText(s: string) {
  return s.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function parseDtStart(
  value: string,
  params: Record<string, string>,
): { date: string; time?: string } | null {
  // DATE form: YYYYMMDD
  if (params.VALUE === "DATE" || /^\d{8}$/.test(value)) {
    if (!/^\d{8}$/.test(value)) return null;
    return { date: `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` };
  }
  // DATETIME: YYYYMMDDTHHMMSS[Z]
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, hh, mm, , z] = m;
  if (z) {
    // UTC → local
    const dt = new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm));
    return {
      date: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
      time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
    };
  }
  return { date: `${y}-${mo}-${d}`, time: `${hh}:${mm}` };
}

export function parseIcs(text: string): IcsEvent[] {
  const lines = unfold(text);
  const events: IcsEvent[] = [];
  let cur: Partial<IcsEvent> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur && cur.title && cur.date) events.push(cur as IcsEvent);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const head = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const [name, ...paramParts] = head.split(";");
    const params: Record<string, string> = {};
    for (const p of paramParts) {
      const [k, v] = p.split("=");
      if (k && v) params[k.toUpperCase()] = v;
    }
    const upper = name.toUpperCase();
    if (upper === "SUMMARY") cur.title = unescapeText(value);
    else if (upper === "DESCRIPTION") cur.description = unescapeText(value);
    else if (upper === "UID") cur.uid = value;
    else if (upper === "DTSTART") {
      const parsed = parseDtStart(value, params);
      if (parsed) {
        cur.date = parsed.date;
        cur.time = parsed.time;
      }
    }
  }
  return events;
}
