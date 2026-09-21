import pdfplumber, os
import sys
SRC=sys.argv[1] if len(sys.argv)>1 else 'reins_market_watch.pdf'

def render(line, gap_ratio=0.30):
    s=[]; prev=None
    for c in line:
        if prev is not None:
            gap = c['x0'] - prev['x1']
            if gap > max(c['size'], prev['size'])*gap_ratio:
                n = max(1, int(round(gap / (max(c['size'],1)*0.5))))
                s.append(' '*min(n,8))
        s.append(c['text']); prev=c
    return ''.join(s).rstrip()

def extract_page(p):
    chars = sorted(p.chars, key=lambda c:(round(c['top'],1), c['x0']))
    lines=[]; cur=[]; base=None
    for c in chars:
        if base is None or abs(c['top']-base) <= max(2.0, c['size']*0.35):
            if base is None: base=c['top']
            cur.append(c)
        else:
            lines.append(cur); cur=[c]; base=c['top']
    if cur: lines.append(cur)
    out=[]
    for ln in lines:
        txt = render(sorted(ln, key=lambda c:c['x0']))
        if txt.strip(): out.append(txt)
    return '\n'.join(out)

os.makedirs('txt', exist_ok=True)
tot=0
with pdfplumber.open(SRC) as pdf:
    for i,p in enumerate(pdf.pages):
        t=extract_page(p)
        open(f'txt/p{i+1:03d}.txt','w').write(t)
        tot+=len(t)
print("total chars:", tot)
