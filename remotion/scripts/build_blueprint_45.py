"""Bygger Living Blueprint 4.5 utifrån 4.4 och lägger till Energikopplingen, Insikter och Familjedelning."""
import copy
import re
import subprocess
from pathlib import Path

from docx import Document

SRC = Path("/mnt/documents/MyFlove_Living_Blueprint_4.4.docx")
OUT = Path("/mnt/documents/MyFlove_Living_Blueprint_4.5.docx")

NEW_SECTIONS = [
    (
        "14. Energikopplingen – varje avklarad sak kan svara",
        "När något markeras klart i Studier, Jobb, Familj, Hem (ett helt städpass), Träningsprogram, "
        "efter en paus, efter Ljusboost eller efter Stopp-knappen frågar MyFlove frivilligt hur energin "
        "känns: mer, samma eller mindre. Ett tryck räcker och frågan går alltid att hoppa över. Svaret "
        "sparas i den befintliga energiloggen, syns direkt i batteriet och används av Flow när nästa steg "
        "föreslås. Samma händelse loggas bara en gång, oavsett var i appen den markerades klar.",
    ),
    (
        "15. Insikter – energi och mående över tid",
        "Insikter (tidigare Mina mönster) visar hur energin och måendet rört sig vecka för vecka och månad "
        "för månad, tillsammans med batteriets utveckling och den tid som faktiskt gått åt till aktiviteter. "
        "Upp till åtta veckor och sex månader visas, och perioder utan loggar lämnas tomma i stället för att "
        "fyllas med gissningar. Språket är beskrivande – 'senaste perioden ligger något lägre än perioden "
        "innan' – aldrig diagnostiskt, och innehåller inga betyg eller medicinska slutsatser.",
    ),
    (
        "16. Familjedelning – privat tills du väljer annat",
        "Familjesidan samlar hushållet: skapa eller gå med i en familj, bjud in med en länk där koden fylls i "
        "automatiskt, och se vilka som är med. Kalender, inköpslista och matlista är gemensamma, medan allt "
        "annat är privat tills användaren väljer att dela. Under 'Dela valda saker' väljs sak för sak vem som "
        "ska se den: en specifik familjemedlem, hela familjen eller ingen alls. Delning kan alltid tas tillbaka.",
    ),
]

NEW_BULLETS = [
    "Insikter visar nu energi- och måendetrender för upp till 8 veckor och 6 månader, med tomma perioder "
    "kvar som tomma.",
    "Energikopplingen täcker studier, jobb, familj, hem, träningspass, paus, Ljusboost och Stopp – alltid "
    "frivilligt och utan dubbelloggning.",
    "Familjedelning har egen vy med inbjudningslänk, medlemmar och delning sak för sak.",
]


def para_after(anchor, text, style):
    new = copy.deepcopy(anchor._p)
    anchor._p.addnext(new)
    from docx.text.paragraph import Paragraph

    p = Paragraph(new, anchor._parent)
    for r in p.runs[1:]:
        r._r.getparent().remove(r._r)
    if not p.runs:
        p.add_run("")
    p.runs[0].text = text
    p.style = style
    return p


def build():
    doc = Document(SRC)
    paras = doc.paragraphs

    # Versionsnummer och datum.
    for p in paras:
        if not p.runs:
            continue
        joined = p.text
        if "4.4" in joined:
            new_text = joined.replace("Version 4.4", "Version 4.5").replace("version 4.4", "version 4.5")
            new_text = re.sub(r"^Om version 4\.4$", "Om version 4.5", new_text)
            new_text = new_text.replace("Vad som är nytt i version 4.4", "Vad som är nytt i version 4.5")
            new_text = new_text.replace("2026-09-22", "2026-09-22")
            if new_text != joined:
                for r in p.runs[1:]:
                    r._r.getparent().remove(r._r)
                p.runs[0].text = new_text

    # Nya punkter i "Vad som är nytt".
    anchor = None
    for i, p in enumerate(doc.paragraphs):
        if p.text.startswith("Vad som är nytt"):
            anchor = doc.paragraphs[i + 1]
            break
    if anchor is not None:
        for text in reversed(NEW_BULLETS):
            para_after(anchor, text, anchor.style)

    # Nya avsnitt före "Del IV".
    target = None
    for p in doc.paragraphs:
        if p.text.startswith("Del IV"):
            target = p
            break
    heading_style = next(p.style for p in doc.paragraphs if p.text.startswith("13."))
    body_style = next(p.style for p in doc.paragraphs if p.style.name == "Normal" and len(p.text) > 120)
    prev = None
    for title, body in NEW_SECTIONS:
        h = para_after(prev or target, title, heading_style) if prev else None
        if h is None:
            new = copy.deepcopy(target._p)
            target._p.addprevious(new)
            from docx.text.paragraph import Paragraph

            h = Paragraph(new, target._parent)
            for r in h.runs[1:]:
                r._r.getparent().remove(r._r)
            if not h.runs:
                h.add_run("")
            h.runs[0].text = title
            h.style = heading_style
        b = para_after(h, body, body_style)
        prev = b

    # Renumrera efterföljande avsnitt (gamla 14–22 blir 17–25).
    seen_new = False
    for p in doc.paragraphs:
        if p.text.startswith("16. Familjedelning"):
            seen_new = True
            continue
        if not seen_new or not p.runs:
            continue
        m = re.match(r"^(\d+)\. ", p.text)
        if m and p.style.name.startswith("Heading"):
            n = int(m.group(1))
            if n >= 14:
                new_text = re.sub(r"^\d+\. ", f"{n + 3}. ", p.text)
                for r in p.runs[1:]:
                    r._r.getparent().remove(r._r)
                p.runs[0].text = new_text

    # Versionshistorik.
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip() == "Versionshistorik":
            entry = doc.paragraphs[i + 1]
            para_after(
                entry,
                "4.5  ·  Egna avsnitt för energikopplingen, Insikter med trender och full familjedelning.",
                entry.style,
            ).._p.addprevious(entry._p) if False else None
            new = copy.deepcopy(entry._p)
            entry._p.addprevious(new)
            from docx.text.paragraph import Paragraph

            np = Paragraph(new, entry._parent)
            for r in np.runs[1:]:
                r._r.getparent().remove(r._r)
            np.runs[0].text = (
                "4.5  ·  Egna avsnitt för energikopplingen, Insikter med trender och full familjedelning."
            )
            break

    doc.save(OUT)
    print(OUT)
    subprocess.run(
        ["python3", "/tmp/run_libreoffice.py", "--headless", "--convert-to", "pdf", "--outdir", "/mnt/documents", str(OUT)],
        check=False,
    )


if __name__ == "__main__":
    build()
