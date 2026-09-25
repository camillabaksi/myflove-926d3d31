from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/live"
FONTS = ROOT / "assets/fonts"
TMP = Path("/tmp/venture-editorial")
TMP.mkdir(exist_ok=True)

BG = (248, 246, 251)
PAPER = (255, 255, 255)
INK = (31, 17, 78)
VIOLET = (119, 82, 184)
PINK = (239, 190, 220)
LILAC = (221, 207, 244)
MINT = (202, 237, 226)
MUTED = (103, 94, 117)
LINE = (226, 219, 235)

DISPLAY = str(FONTS / "PlusJakartaSans.ttf")
BODY = str(FONTS / "Inter.ttf")
SCRIPT = str(FONTS / "Caveat.ttf")

DURATIONS = [10] * 18

SV = [
    ("PROBLEMET", "Vi planerar tid. Men lever med|begränsad kapacitet.", "När vardagen blir komplex räcker kalendern inte alltid till. Mental belastning, osynligt arbete och förändrad energi avgör vad som faktiskt är möjligt.", "kalender.png", "Tid är bara halva bilden."),
    ("INSIKTEN", "En tom kalender kan fortfarande kännas|helt full.", "Det som tar kraft syns sällan i en att-göra-lista. MyFlove gör kapaciteten till en del av planeringen — utan skuld.", "historik.png", "Det osynliga arbetet räknas också."),
    ("LÖSNINGEN", "Ett vardagsstöd som|anpassar sig efter dig.", "MyFlove hjälper dig att fånga det som snurrar, förstå dagens kapacitet och hitta ett genomförbart nästa steg.", "hem.png", "Mindre press. Mer riktning."),
    ("PRODUKTEN · QUICKFLOW", "Fånga först.|Sortera sen.", "Skriv eller prata fritt. QuickFlow tar emot tanken utan att kräva att användaren först väljer rätt funktion.", "quickflow2.png", "En tanke räcker för att börja."),
    ("PRODUKTEN · MITT BATTERI", "Din kapacitet blir|synlig.", "Energi, mående och aktiviteternas påverkan bygger ett levande batteri över tid — med snabb incheckning, inte långa formulär.", "batteri.png", "Ditt eget levande batteri."),
    ("PRODUKTEN · FLOW", "Nästa steg som faktiskt|går.", "Flow väger ihop dagens kapacitet och det som behöver göras. Användaren kan acceptera, justera eller göra senare.", "vadnu.png", "Du godkänner alltid förändringen."),
    ("PRODUKTEN · ÅTERHÄMTNING", "Vila är en del av|planeringen.", "Återhämtning samlar en paus där du väljer 5 till 60 minuter, Ljusboost och Stopp-knappen. Efteråt räcker ett tryck: mer, samma eller mindre energi.", "aterhamtning.png", "Paus · Ljusboost · Stopp · Snabb energikoll"),
    ("PRODUKTEN · STRUKTUREN", "Fem vägar in.|Inget mer letande.", "Översikt, Flow, Hälsa, Återhämtning och Mer. Träning, studier, jobb, familj och hem ligger där de hör hemma.", "historik.png", "Översikt · Flow · Hälsa · Återhämtning · Mer"),
    ("PRODUKTEN · ENERGIKOPPLINGEN", "Varje avklarad sak|kan svara på en fråga.", "Efter studier, jobb, familj, hem, träningspass, paus, Ljusboost och Stopp frågar appen frivilligt: mer, samma eller mindre energi? Ett tryck räcker, och det syns direkt i batteriet.", "batteri.png", "Mer · Samma · Mindre — alltid frivilligt."),
    ("PRODUKTEN · INSIKTER", "Energi och mående|vecka för vecka.", "Insikter visar hur energin och måendet rört sig över veckor och månader, tillsammans med faktisk tid på aktiviteter. Beskrivande språk, inga diagnoser eller betyg.", "insikter.png", "Mönster som beskriver, inte dömer."),
    ("PRODUKTEN · FAMILJEDELNING", "Dela det du vill.|Inget annat.", "Bjud in familjen med en länk där koden fylls i automatiskt, och välj sak för sak vem som ska se vad. Allt är privat tills användaren väljer delning.", "familj.png", "Privat som standard · Delning sak för sak"),

    ("SAMMANHÄNGANDE VÄRDE", "Från tanke till en rimligare|vardag.", "Ett sammanhängande flöde — inte ännu en fristående kalender.", "hem.png", "Fånga · Förstå · Anpassa · Göra · Återhämta · Synliggöra"),
    ("KUNDSEGMENT", "För människor med hög|mental belastning.", "Första hypotesen är personer som lätt blir överväldigade i en komplex vardag. NPF, stress, studier, familjeliv och arbetsliv är behovsområden som valideras — inte etiketter som begränsar produkten.", "quickflow2.png", "Primärt segment och betalande kund valideras vidare."),
    ("MARKNAD", "Ett stort behov i en växande|digital marknad.", "Över 140 miljoner vuxna globalt uppskattas leva med ADHD. I Sverige uppskattas omkring 3 % av vuxna ha ADHD. MyFlove börjar med ett tydligt behov men byggs för bredare vardagskomplexitet.", "historik.png", "140M+ globalt · cirka 3 % i Sverige*\n*Externa uppskattningar: Song et al. 2021; Socialstyrelsen."),
    ("POSITIONERING", "Tid + uppgifter räcker inte.|Kapacitet förändrar svaret.", "Kalendrar visar när. Att-göra-listor visar vad. MyFlove hjälper användaren förstå vad som är rimligt nu — och hur det kan genomföras.", "kalender.png", "Kapacitet · Osynligt arbete · Nästa steg · Återhämtning"),
    ("AFFÄR & VALIDERING", "B2C först.|Fler vägar testas.", "Free/Premium är utgångspunkten. Arbetsgivare och offentlig sektor är möjliga framtida spår — först efter validerade piloter, betalningsvilja och återkommande användning.", "hem.png", "Fungerande MVP · Tidiga testare · Retention och pris ska mätas"),
    ("KAPITAL & NÄSTA STEG", "€250 000 för 18 månaders|validering.", "Arbetscaset finansierar en stabil produkt, retention- och prisvalidering, piloter, regelefterlevnad och ett bevisat kommersiellt spår.", "minday.png", "Stabilisera · Mäta värde · Validera betalning · Skala\nKapital och värdering är arbetsantaganden."),
    ("MYFLOVE", "Bygg vardagen efter den kapacitet|du faktiskt har.", "MyFlove anpassar sig efter dig — så att du slipper bära allt själv.", "aterhamtning.png", "myflove.lovable.app"),
]

EN = [
    ("THE PROBLEM", "We plan time. But live with|limited capacity.", "When everyday life gets complex, a calendar is not always enough. Mental load, invisible work and changing energy determine what is actually possible.", "kalender.png", "Time is only half the picture."),
    ("THE INSIGHT", "An empty calendar can still feel|completely full.", "What drains us rarely appears on a to-do list. MyFlove makes capacity part of planning — without guilt.", "historik.png", "Invisible work counts too."),
    ("THE SOLUTION", "Everyday support that|adapts to you.", "MyFlove helps you capture what is spinning, understand today’s capacity and find one achievable next step.", "hem.png", "Less pressure. More direction."),
    ("THE PRODUCT · QUICKFLOW", "Capture first.|Sort later.", "Write or speak freely. QuickFlow receives the thought without asking the user to choose the right feature first.", "quickflow2.png", "One thought is enough to begin."),
    ("THE PRODUCT · MY BATTERY", "Your capacity becomes|visible.", "Energy, wellbeing and activity impact build a living battery over time — through quick check-ins, not long forms.", "batteri.png", "Your own living battery."),
    ("THE PRODUCT · FLOW", "A next step that actually|works.", "Flow combines today’s capacity with what needs to be done. The user can accept, adjust or choose later.", "vadnu.png", "You always approve the change."),
    ("THE PRODUCT · RECOVERY", "Rest is part of|the plan.", "Recovery gathers one pause of 5 to 60 minutes, Light Boost and the Stop button. Afterwards one tap is enough: more, same or less energy.", "aterhamtning.png", "Pause · Light Boost · Stop · Quick energy check"),
    ("THE PRODUCT · STRUCTURE", "Five ways in.|No more searching.", "Overview, Flow, Health, Recovery and More. Training, studies, work, family and home live where they belong.", "historik.png", "Overview · Flow · Health · Recovery · More"),
    ("THE PRODUCT · ENERGY LINK", "Every finished task|can answer one question.", "After studies, work, family, home, workouts, pause, Light Boost and Stop the app optionally asks: more, same or less energy? One tap, and the battery reflects it right away.", "batteri.png", "More · Same · Less — always optional."),
    ("THE PRODUCT · INSIGHTS", "Energy and mood,|week by week.", "Insights show how energy and wellbeing have moved across weeks and months, alongside the actual time spent on activities. Descriptive language, no diagnoses or scores.", "insikter.png", "Patterns that describe, never judge."),
    ("THE PRODUCT · FAMILY SHARING", "Share what you want.|Nothing else.", "Invite the family with a link that fills in the code automatically, then choose item by item who sees what. Everything stays private until the user shares it.", "familj.png", "Private by default · Item-by-item sharing"),

    ("CONNECTED VALUE", "From thought to a more|manageable day.", "One connected flow — not another standalone calendar.", "hem.png", "Capture · Understand · Adapt · Do · Recover · Reveal"),
    ("CUSTOMER SEGMENTS", "For people carrying a high|mental load.", "The first hypothesis is people easily overwhelmed by complex everyday life. Neurodivergence, stress, studies, family and work are need areas to validate — not labels that limit the product.", "quickflow2.png", "The primary segment and paying customer require validation."),
    ("MARKET", "A major need in a growing|digital market.", "More than 140 million adults worldwide are estimated to live with ADHD. In Sweden, around 3% of adults are estimated to have ADHD. MyFlove starts with a clear need and is built for broader everyday complexity.", "historik.png", "140M+ globally · around 3% in Sweden*\n*External estimates: Song et al. 2021; Swedish National Board."),
    ("POSITIONING", "Time + tasks are not enough.|Capacity changes the answer.", "Calendars show when. To-do lists show what. MyFlove helps users understand what is reasonable now — and how to get started.", "kalender.png", "Capacity · Invisible work · Next step · Recovery"),
    ("BUSINESS & VALIDATION", "B2C first.|More paths to test.", "Free/Premium is the starting point. Employers and public services are possible future paths — after validated pilots, willingness to pay and recurring use.", "hem.png", "Working MVP · Early testers · Retention and pricing to measure"),
    ("FUNDING & NEXT STEP", "€250,000 for 18 months of|validation.", "The working case funds product stability, retention and pricing validation, pilots, compliance and one proven commercial path.", "minday.png", "Stabilise · Measure value · Validate payment · Scale\nFunding and valuation are working assumptions."),
    ("MYFLOVE", "Build everyday life around the capacity|you actually have.", "MyFlove adapts to you — so you do not have to carry everything alone.", "aterhamtning.png", "myflove.lovable.app"),
]

# Version 5.1 has one canonical bilingual source shared with the editable deck.
from pitch_content_60 import DURATIONS, SV, EN


def font(path, size, variation=None):
    f = ImageFont.truetype(path, max(12, int(size)))
    if variation:
        try:
            f.set_variation_by_name(variation)
        except OSError:
            pass
    return f


def wrapped(draw, text, f, width):
    lines = []
    for paragraph in text.split("\n"):
        current = ""
        for word in paragraph.split():
            candidate = f"{current} {word}".strip()
            if draw.textbbox((0, 0), candidate, font=f)[2] <= width or not current:
                current = candidate
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def fitting_lines(draw, text, path, start, min_size, width, max_lines, variation=None):
    size = start
    while size >= min_size:
        f = font(path, size, variation)
        lines = wrapped(draw, text.replace("|", "\n"), f, width)
        if len(lines) <= max_lines and all(draw.textbbox((0, 0), line, font=f)[2] <= width for line in lines):
            return f, lines
        size -= 1
    f = font(path, min_size, variation)
    return f, wrapped(draw, text.replace("|", "\n"), f, width)[:max_lines]


def heart(draw, x, y, size, color, width=3):
    points = []
    for i in range(101):
        t = 6.28318 * i / 100
        px = 16 * __import__("math").sin(t) ** 3
        py = 13 * __import__("math").cos(t) - 5 * __import__("math").cos(2*t) - 2 * __import__("math").cos(3*t) - __import__("math").cos(4*t)
        points.append((x + size * (px + 17) / 34, y + size * (17 - py) / 34))
    draw.line(points, fill=color, width=width, joint="curve")


def line_icon(draw, kind, box, color):
    x0, y0, x1, y1 = box
    w, h = x1-x0, y1-y0
    sw = max(2, int(w*.07))
    if kind == 0:  # battery
        draw.rounded_rectangle((x0+w*.12,y0+h*.25,x1-w*.12,y1-h*.25), radius=int(w*.12), outline=color, width=sw)
        draw.rectangle((x1-w*.1,y0+h*.42,x1,y1-h*.42), fill=color)
        draw.rectangle((x0+w*.25,y0+h*.38,x0+w*.55,y1-h*.38), fill=color)
    elif kind == 1:  # spark
        pts=[(x0+w*.58,y0),(x0+w*.18,y0+h*.58),(x0+w*.48,y0+h*.58),(x0+w*.38,y1),(x0+w*.84,y0+h*.4),(x0+w*.56,y0+h*.4)]
        draw.line(pts+[pts[0]], fill=color, width=sw, joint="curve")
    elif kind == 2:  # check
        draw.ellipse(box, outline=color, width=sw)
        draw.line((x0+w*.22,y0+h*.52,x0+w*.43,y0+h*.72,x0+w*.8,y0+h*.3), fill=color, width=sw, joint="curve")
    else:  # path
        draw.arc((x0,y0,x0+w*.55,y0+h*.55), 200, 20, fill=color, width=sw)
        draw.arc((x0+w*.42,y0+h*.42,x1,y1), 20, 200, fill=color, width=sw)


def shadow_panel(im, box, radius, fill=PAPER):
    layer = Image.new("RGBA", im.size, (0,0,0,0))
    ld = ImageDraw.Draw(layer)
    x0,y0,x1,y1=box
    ld.rounded_rectangle((x0+8,y0+12,x1+8,y1+12), radius=radius, fill=(42,22,85,34))
    layer = layer.filter(ImageFilter.GaussianBlur(14))
    im.paste(layer, (0,0), layer)
    ImageDraw.Draw(im).rounded_rectangle(box, radius=radius, fill=fill)


def phone(im, src, box):
    x0,y0,x1,y1=map(int,box)
    shadow_panel(im, (x0,y0,x1,y1), max(18,int((x1-x0)*.11)), INK)
    pad=max(6,int((x1-x0)*.025))
    app=Image.open(ASSETS/src).convert("RGB")
    inner=(x1-x0-2*pad,y1-y0-2*pad)
    app.thumbnail(inner, Image.Resampling.LANCZOS)
    canvas=Image.new("RGB",inner,PAPER)
    canvas.paste(app,((inner[0]-app.width)//2,(inner[1]-app.height)//2))
    mask=Image.new("L",inner,0)
    ImageDraw.Draw(mask).rounded_rectangle((0,0,inner[0],inner[1]),radius=max(14,int(inner[0]*.09)),fill=255)
    im.paste(canvas,(x0+pad,y0+pad),mask)


def visual_panel(im, draw, idx, item, box, portrait):
    x0,y0,x1,y1=map(int,box)
    draw.rounded_rectangle(box, radius=int(min(x1-x0,y1-y0)*.08), fill=(241,234,249))
    draw.ellipse((x1-(x1-x0)*.62,y0-(y1-y0)*.08,x1+(x1-x0)*.12,y0+(y1-y0)*.48), fill=PINK)
    if item[3]:
        ph=(y1-y0)*.86
        pw=ph*430/932
        phone(im,item[3],((x0+x1-pw)/2,y0+(y1-y0)*.07,(x0+x1+pw)/2,y0+(y1-y0)*.93))
        return
    # Calm editorial artwork. Keep non-product slides free from floating icon cards.
    cx=(x0+x1)/2
    cy=(y0+y1)/2
    panel_w=x1-x0
    panel_h=y1-y0

    # Layered fields echo the deck's hand-cut paper shapes without suggesting UI.
    draw.ellipse(
        (x0-panel_w*.10, cy-panel_h*.29, x0+panel_w*.58, cy+panel_h*.15),
        fill=LILAC,
    )
    draw.ellipse(
        (cx-panel_w*.04, y0+panel_h*.12, x1+panel_w*.17, y0+panel_h*.57),
        fill=PINK,
    )
    draw.rounded_rectangle(
        (x0+panel_w*.14, cy+panel_h*.08, x1-panel_w*.11, y1-panel_h*.10),
        radius=int(min(panel_w,panel_h)*.12),
        fill=MINT,
    )

    # A single hand-drawn path gives the artwork direction without recurring icons.
    path_color=(142, 112, 193)
    sw=max(2,int(min(panel_w,panel_h)*.008))
    path=[
        (x0+panel_w*.13, y0+panel_h*.72),
        (x0+panel_w*.30, y0+panel_h*.62),
        (x0+panel_w*.43, y0+panel_h*.67),
        (x0+panel_w*.58, y0+panel_h*.52),
        (x0+panel_w*.73, y0+panel_h*.57),
        (x0+panel_w*.88, y0+panel_h*.39),
    ]
    draw.line(path, fill=path_color, width=sw, joint="curve")
    for px,py in (path[0],path[-1]):
        r=sw*1.8
        draw.ellipse((px-r,py-r,px+r,py+r),fill=path_color)
    if item[0] in ("MARKNAD", "MARKET", "KAPITAL & NÄSTA STEG", "FUNDING & NEXT STEP"):
        market = item[0] in ("MARKNAD", "MARKET")
        big="140M+" if market else "18"
        sub="GLOBAL ESTIMATE" if market else "MONTHS"
        stat_size=min(panel_w,panel_h)*(.20 if portrait else .24)
        bf=font(DISPLAY,stat_size*.42,"ExtraBold")
        sf=font(BODY,stat_size*.09,"Bold")
        tw=draw.textbbox((0,0),big,font=bf)[2]
        draw.text((cx-tw/2,y0+(y1-y0)*.12),big,font=bf,fill=INK)
        tw=draw.textbbox((0,0),sub,font=sf)[2]
        draw.text((cx-tw/2,y0+(y1-y0)*.12+bf.size*1.05),sub,font=sf,fill=VIOLET)


def draw_note(draw, note, x, y, width, max_height, portrait):
    if not note:
        return
    start=34 if portrait else 29
    f, lines=fitting_lines(draw,note,SCRIPT,start,19,width,3,"Bold")
    line_h=int(f.size*1.12)
    if line_h*len(lines)>max_height:
        return
    for line in lines:
        draw.text((x,y),line,font=f,fill=VIOLET)
        y+=line_h
    # Hand-drawn underline rather than a font symbol.
    draw.arc((x,y-3,x+min(width, f.size*5),y+11),190,350,fill=VIOLET,width=2)


def footer(draw,w,h,portrait):
    y=h-int(h*.055)
    size=int(h*(.020 if portrait else .024))
    heart(draw,int(w*.06),y-size*.12,size*.8,INK,max(2,int(size*.09)))
    f=font(DISPLAY,size,"ExtraBold")
    draw.text((int(w*.06)+size,y-size*.12),"MyFlove",font=f,fill=INK)
    rf=font(BODY,int(size*.47),"Bold")
    right="MYFLOVE · 2026"
    rw=draw.textbbox((0,0),right,font=rf)[2]
    draw.text((w-int(w*.06)-rw,y+size*.12),right,font=rf,fill=VIOLET)


def slide(item,w,h,portrait,idx):
    im=Image.new("RGB",(w,h),BG)
    draw=ImageDraw.Draw(im)
    # Restrained editorial backdrop.
    draw.ellipse((w*.72,-h*.20,w*1.18,h*.27),fill=PINK)
    draw.ellipse((-w*.18,h*.76,w*.32,h*1.17),fill=LILAC)
    margin=int(w*(.060 if portrait else .065))
    top=int(h*(.060 if portrait else .075))
    footer_y=int(h*.89)

    if portrait:
        text_x=margin; text_w=w-2*margin
        visual_box=(margin,int(h*.50),w-margin,int(h*.84))
        title_start=int(h*.050); title_min=int(h*.033); title_lines=3
        body_start=int(h*.019); body_min=int(h*.014); body_lines=6
    else:
        text_x=margin; text_w=int(w*.52)
        visual_box=(int(w*.64),int(h*.10),int(w*.94),int(h*.86))
        title_start=int(h*.070); title_min=int(h*.042); title_lines=3
        body_start=int(h*.027); body_min=int(h*.020); body_lines=6

    # Label pill, always plain text and safe within bounds.
    label_f=font(BODY,int(h*(.014 if portrait else .017)),"Bold")
    label=item[0]
    lw=draw.textbbox((0,0),label,font=label_f)[2]
    pad=int(h*.014)
    draw.rounded_rectangle((text_x,top,text_x+lw+2*pad,top+label_f.size+pad),radius=int(pad*.65),fill=INK)
    draw.text((text_x+pad,top+pad*.28),label,font=label_f,fill=PAPER)

    y=top+label_f.size+int(h*.045)
    title_f,title_lines_text=fitting_lines(draw,item[1],DISPLAY,title_start,title_min,text_w,title_lines,"ExtraBold")
    title_h=int(title_f.size*1.12)
    for n,line in enumerate(title_lines_text):
        draw.text((text_x,y),line,font=title_f,fill=INK if n==0 else VIOLET)
        y+=title_h
    y+=int(h*.025)

    body_f,body_lines_text=fitting_lines(draw,item[2],BODY,body_start,body_min,text_w,body_lines,"Regular")
    body_h=int(body_f.size*1.43)
    # Keep text and handwritten note above the visual panel in portrait.
    text_limit=int(h*.455) if portrait else int(h*.70)
    allowed=max(1,(text_limit-y)//body_h)
    if len(body_lines_text)>allowed:
        body_f,body_lines_text=fitting_lines(draw,item[2],BODY,max(body_f.size-2,12),12,text_w,allowed,"Regular")
        body_h=int(body_f.size*1.38)
    for line in body_lines_text:
        draw.text((text_x,y),line,font=body_f,fill=MUTED)
        y+=body_h

    note_y=y+int(h*.018)
    note_limit=(int(h*.485) if portrait else footer_y-int(h*.07))-note_y
    draw_note(draw,item[4],text_x,note_y,text_w,max(0,note_limit),portrait)
    visual_panel(im,draw,idx,item,visual_box,portrait)
    footer(draw,w,h,portrait)
    return im


def build(lang,portrait):
    data=SV if lang=="SV" else EN
    w,h=((720,1280) if portrait else (1280,720))
    out_dir=TMP/f'{lang}_{"9x16" if portrait else "16x9"}'
    out_dir.mkdir(exist_ok=True)
    inputs=[]
    for idx,(item,duration) in enumerate(zip(data,DURATIONS)):
        path=out_dir/f"{idx:02}.png"
        slide(item,w,h,portrait,idx).save(path,quality=95)
        inputs += ["-loop","1","-t",str(duration),"-i",str(path)]
    filters=[]
    for idx,duration in enumerate(DURATIONS):
        filters.append(f"[{idx}:v]fps=30,fade=t=in:st=0:d=0.6:color=#EEE5FA,fade=t=out:st={duration-0.6}:d=0.6:color=#EEE5FA,format=yuv420p[v{idx}]")
    filters.append("".join(f"[v{i}]" for i in range(len(DURATIONS)))+f"concat=n={len(DURATIONS)}:v=1:a=0[out]")
    output=Path("/mnt/documents")/f'MyFlove_Pitchfilm_6.0_{lang}_{"9x16" if portrait else "16x9"}.mp4'
    cmd=["ffmpeg","-y",*inputs,"-filter_complex",";".join(filters),"-map","[out]","-an","-c:v","libx264","-preset","veryfast","-crf","18","-profile:v","high","-level","4.1","-r","30","-g","30","-pix_fmt","yuv420p","-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709","-movflags","+faststart",str(output)]
    subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    print(output)


if __name__=="__main__":
    jobs={"sv-landscape":("SV",False),"sv-portrait":("SV",True),"en-landscape":("EN",False),"en-portrait":("EN",True)}
    for key in (sys.argv[1:] or jobs):
        build(*jobs[key])