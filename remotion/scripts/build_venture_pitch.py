from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import subprocess, os, textwrap, sys
ROOT=Path(__file__).resolve().parents[1]; AS=ROOT/'public/live'; TMP=Path('/tmp/venture-final'); TMP.mkdir(exist_ok=True)
BG=(247,243,252); BG2=(238,229,250); INK=(26,13,89); V=(118,87,182); MUT=(113,102,128); PINK=(242,201,226); MINT=(205,239,231); WHITE=(255,255,255); LILAC=(216,200,242)
font='/nix/store/dg3hd9mqha517djbgpgnq8r4q1j1wn30-noto-fonts-2025.11.01/share/fonts/noto/NotoSans[wdth,wght].ttf'; bold='/nix/store/dg3hd9mqha517djbgpgnq8r4q1j1wn30-noto-fonts-2025.11.01/share/fonts/noto/NotoSans[wdth,wght].ttf'
D=[13,13,13,15,15,15,13,14,15,13,14,15,12]
SV=[
('PROBLEMET','Vi planerar tid. Men lever med|begränsad kapacitet.','När vardagen blir komplex räcker kalendern inte alltid till. Mental belastning, osynligt arbete och förändrad energi avgör vad som faktiskt är möjligt.',None,None),
('INSIKTEN','En tom kalender kan fortfarande kännas|helt full.','Det som tar kraft syns sällan i en att-göra-lista. MyFlove gör kapaciteten till en del av planeringen — utan skuld.',None,None),
('LÖSNINGEN','Ett vardagsstöd som|anpassar sig efter dig.','MyFlove hjälper dig att fånga det som snurrar, förstå dagens kapacitet och hitta ett genomförbart nästa steg.',None,None),
('PRODUKTEN · QUICKFLOW','Fånga först.|Sortera sen.','Skriv eller prata fritt. QuickFlow tar emot tanken utan att kräva att användaren först väljer rätt funktion.','quickflow2.png','Riktig MyFlove-skärm'),
('PRODUKTEN · MITT BATTERI','Din kapacitet blir|synlig.','Energi, mående och aktiviteternas påverkan bygger ett levande batteri över tid — med snabb incheckning, inte långa formulär.','batteri.png','Riktig MyFlove-skärm'),
('PRODUKTEN · FLOW','Nästa steg som faktiskt|går.','Flow väger ihop dagens kapacitet och det som behöver göras. Användaren kan acceptera, justera eller göra senare.','vadnu.png','Flow ändrar inget utan godkännande.'),
('SAMMANHÄNGANDE VÄRDE','Från tanke till en rimligare|vardag.','Ett sammanhängande flöde — inte ännu en fristående kalender.',None,'Fånga · Förstå · Anpassa · Göra · Återhämta · Synliggöra'),
('KUNDSEGMENT','För människor med hög|mental belastning.','Första hypotesen är personer som lätt blir överväldigade i en komplex vardag. NPF, stress, studier, familjeliv och arbetsliv är behovsområden som valideras — inte etiketter som begränsar produkten.',None,'Primärt segment och betalande kund ska valideras vidare.'),
('MARKNAD','Ett stort behov i en växande|digital marknad.','Över 140 miljoner vuxna globalt uppskattas leva med ADHD. I Sverige uppskattas omkring 3 % av vuxna ha ADHD. MyFlove börjar med ett tydligt behov men byggs för bredare vardagskomplexitet.',None,'140M+ vuxna globalt · ~3 % av vuxna i Sverige*\n*Externa uppskattningar: Song et al., Journal of Global Health 2021; Socialstyrelsen. Inte MyFloves traction.'),
('POSITIONERING','Tid + uppgifter räcker inte.|Kapacitet förändrar svaret.','Kalendrar visar när. Att-göra-listor visar vad. MyFlove hjälper användaren förstå vad som är rimligt nu — och hur det kan genomföras.',None,'Kapacitetsanpassning · Osynligt arbete · Nästa rimliga steg · Återhämtning'),
('AFFÄR & VALIDERING','B2C först.|Fler vägar testas.','Free/Premium är utgångspunkten. Arbetsgivare och offentlig sektor är möjliga framtida spår — först efter validerade piloter, betalningsvilja och återkommande användning.',None,'Fungerande MVP · Tidiga testare · Retention och pris ska mätas · B2B/B2G är hypoteser'),
('KAPITAL & NÄSTA STEG','€250 000 för 18 månaders|validering.','Arbetscaset finansierar en stabil produkt, retention- och prisvalidering, piloter, regelefterlevnad och ett bevisat kommersiellt spår.',None,'Stabilisera · Mäta återkommande värde · Validera betalningsvilja · Bygga ett skalbart case\nKapital och värdering är arbetsantaganden, inte fastställda villkor.'),
('MYFLOVE','Bygg vardagen efter den kapacitet|du faktiskt har.','MyFlove anpassar sig efter dig — så att du slipper bära allt själv.',None,'myflove.lovable.app · Venture Cup 2026')]
EN=[
('THE PROBLEM','We plan time. But live with|limited capacity.','When everyday life gets complex, a calendar is not always enough. Mental load, invisible work and changing energy determine what is actually possible.',None,None),
('THE INSIGHT','An empty calendar can still feel|completely full.','What drains us rarely appears on a to-do list. MyFlove makes capacity part of planning — without guilt.',None,None),
('THE SOLUTION','Everyday support that|adapts to you.','MyFlove helps you capture what is spinning, understand today’s capacity and find one achievable next step.',None,None),
('THE PRODUCT · QUICKFLOW','Capture first.|Sort later.','Write or speak freely. QuickFlow receives the thought without asking the user to choose the right feature first.','quickflow2.png','Real MyFlove screen'),
('THE PRODUCT · MY BATTERY','Your capacity becomes|visible.','Energy, wellbeing and activity impact build a living battery over time — through quick check-ins, not long forms.','batteri.png','Real MyFlove screen'),
('THE PRODUCT · FLOW','A next step that actually|works.','Flow combines today’s capacity with what needs to be done. The user can accept, adjust or choose later.','vadnu.png','Flow changes nothing without approval.'),
('CONNECTED VALUE','From thought to a more|manageable day.','One connected flow — not another standalone calendar.',None,'Capture · Understand · Adapt · Do · Recover · Reveal'),
('CUSTOMER SEGMENTS','For people carrying a high|mental load.','The first hypothesis is people easily overwhelmed by complex everyday life. Neurodivergence, stress, studies, family and work are need areas to validate — not labels that limit the product.',None,'The primary segment and paying customer require further validation.'),
('MARKET','A major need in a growing|digital market.','More than 140 million adults worldwide are estimated to live with ADHD. In Sweden, around 3% of adults are estimated to have ADHD. MyFlove starts with a clear need and is built for broader everyday complexity.',None,'140M+ adults globally · ~3% of adults in Sweden*\n*External estimates: Song et al., Journal of Global Health 2021; Swedish National Board of Health and Welfare. Not MyFlove traction.'),
('POSITIONING','Time + tasks are not enough.|Capacity changes the answer.','Calendars show when. To-do lists show what. MyFlove helps users understand what is reasonable now — and how to get started.',None,'Capacity adaptation · Invisible work · Next reasonable step · Recovery'),
('BUSINESS & VALIDATION','B2C first.|More paths to test.','Free/Premium is the starting point. Employers and public services are possible future paths — after validated pilots, willingness to pay and recurring use.',None,'Working MVP · Early testers · Retention and pricing to measure · B2B/B2G remain hypotheses'),
('FUNDING & NEXT STEP','€250,000 for 18 months of|validation.','The working case funds product stability, retention and pricing validation, pilots, compliance and one proven commercial path.',None,'Stabilise · Measure recurring value · Validate willingness to pay · Build a scalable case\nFunding and valuation are working assumptions, not final terms.'),
('MYFLOVE','Build everyday life around the capacity|you actually have.','MyFlove adapts to you — so you do not have to carry everything alone.',None,'myflove.lovable.app · Venture Cup 2026')]
def fit(text,size,maxw,draw,path=bold):
 while size>18 and max(draw.textbbox((0,0),x,font=ImageFont.truetype(path,size))[2] for x in text.split('|'))>maxw: size-=2
 return ImageFont.truetype(path,size)
def wrap(draw,text,f,maxw):
 words=text.split(); lines=[]; cur=''
 for w in words:
  test=(cur+' '+w).strip()
  if draw.textbbox((0,0),test,font=f)[2]<=maxw:cur=test
  else: lines.append(cur);cur=w
 if cur:lines.append(cur)
 return lines
def slide(item,w,h,portrait):
 im=Image.new('RGB',(w,h),BG);d=ImageDraw.Draw(im)
 d.ellipse((w*.68,-h*.35,w*1.18,h*.38),fill=PINK);d.ellipse((-w*.22,h*.72,w*.30,h*1.25),fill=MINT)
 mx=int(w*.07); top=int(h*.11); content_w=int(w*.52 if item[3] and not portrait else w*.86)
 d.text((mx,top),item[0],font=ImageFont.truetype(bold,int(h*.022)),fill=V)
 fs=int(h*(.066 if portrait else .075)); tf=fit(item[1],fs,content_w,d); y=top+int(h*.06)
 for j,line in enumerate(item[1].split('|')): d.text((mx,y+j*int(tf.size*1.08)),line,font=tf,fill=V if j else INK)
 y+=len(item[1].split('|'))*int(tf.size*1.08)+int(h*.035); bf=ImageFont.truetype(font,int(h*(.026 if portrait else .029)))
 for line in wrap(d,item[2],bf,content_w): d.text((mx,y),line,font=bf,fill=MUT);y+=int(bf.size*1.45)
 if item[4]:
  y+=int(h*.03); nf=ImageFont.truetype(bold,int(h*.019));
  for line in item[4].split('\n'):
   for wl in wrap(d,line,nf,content_w): d.text((mx,y),wl,font=nf,fill=V);y+=int(nf.size*1.4)
 if item[3]:
  app=Image.open(AS/item[3]).convert('RGB'); ph=int(h*(.56 if portrait else .73)); pw=int(ph*430/932); app=app.resize((pw-16,ph-16),Image.Resampling.LANCZOS)
  phone=Image.new('RGB',(pw,ph),INK); phone.paste(app,(8,8)); x=int((w-pw)/2 if portrait else w*.76-pw/2); yy=int(h*.42 if portrait else h*.14); im.paste(phone,(x,yy))
 d.text((mx,h-int(h*.055)),'♡ MyFlove',font=ImageFont.truetype(bold,int(h*.022)),fill=INK); d.text((w-int(w*.18),h-int(h*.052)),'VENTURE CUP 2026',font=ImageFont.truetype(bold,int(h*.014)),fill=V)
 return im
def build(lang,portrait):
 data=SV if lang=='SV' else EN; w,h=((720,1280) if portrait else (1280,720)); od=TMP/f'{lang}_{"9x16" if portrait else "16x9"}'; od.mkdir(exist_ok=True)
 inputs=[]
 for i,(it,dur) in enumerate(zip(data,D)):
  p=od/f'{i:02}.png';slide(it,w,h,portrait).save(p); inputs+=['-loop','1','-t',str(dur),'-i',str(p)]
 filters=[]
 for i,dur in enumerate(D): filters.append(f'[{i}:v]fps=30,fade=t=in:st=0:d=.6:color=#EEE5FA,fade=t=out:st={dur-.6}:d=.6:color=#EEE5FA,format=yuv420p[v{i}]')
 filters.append(''.join(f'[v{i}]' for i in range(len(D)))+f'concat=n={len(D)}:v=1:a=0[out]')
 out=Path('/mnt/documents')/f'MyFlove_Venture_Cup_2026_{lang}_{"9x16" if portrait else "16x9"}.mp4'
 cmd=['ffmpeg','-y']+inputs+['-filter_complex',';'.join(filters),'-map','[out]','-an','-c:v','libx264','-preset','veryfast','-crf','18','-profile:v','high','-level','4.1','-r','30','-g','30','-pix_fmt','yuv420p','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',str(out)]
 subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);print(out)
if __name__=='__main__':
 jobs={'sv-landscape':('SV',False),'sv-portrait':('SV',True),'en-landscape':('EN',False),'en-portrait':('EN',True)}
 for key in (sys.argv[1:] or jobs): build(*jobs[key])
