#!/usr/bin/env python3
"""txt/pNNN.txt から 13ヶ月表を決定論的にパースする（エージェント抽出との突合用）。"""
import re, json, glob, os
NUM = re.compile(r'^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+(\.\d+)?$')
MONTH_TOK = re.compile(r'^(\d{1,2})月$')
YEAR_TOK = re.compile(r'(\d{4})年')

def tokens(line):
    line = re.sub(r'(\d),\s+(\d{3})', r'\1,\2', line)  # '1, 223' -> '1,223'
    line = re.sub(r'(-?\d+)\s+\.(\d)', r'\1.\2', line)     # '0 .5' -> '0.5'
    return [t for t in re.split(r'[ \u3000]+', line.strip()) if t]

def isnum(t): return bool(NUM.match(t))
def tonum(t):
    t=t.replace(',','')
    return float(t) if '.' in t else int(t)

def parse_page(path):
    lines=open(path,encoding='utf-8').read().split('\n')
    pno=int(re.search(r'p(\d{3})',path).group(1))
    out=[]; months=None; years_seen=[]
    for i,ln in enumerate(lines):
        toks=tokens(ln)
        if not toks: continue
        # year header line
        ys=YEAR_TOK.findall(ln)
        if ys and all(MONTH_TOK.match(t) is None for t in toks) and len(toks)<=6:
            years_seen=[int(y) for y in ys]
        # month header line
        mtoks=[MONTH_TOK.match(t) for t in toks]
        if sum(1 for m in mtoks if m)>=12:
            ms=[int(m.group(1)) for m in mtoks if m]
            # assign years: start from first year seen; increment when month decreases
            y = years_seen[0] if years_seen else None
            months=[]
            prev=None
            for m in ms:
                if prev is not None and m<prev and y is not None: y+=1
                months.append(f"{y}-{m:02d}" if y else f"?-{m:02d}")
                prev=m
            continue
        if months is None: continue
        # data row: trailing numeric tokens
        vals=[]
        j=len(toks)
        while j>0 and isnum(toks[j-1]):
            vals.insert(0,tonum(toks[j-1])); j-=1
        if len(vals)==len(months):
            label=' '.join(toks[:j])
            out.append({'page':pno,'line':i+1,'label':label,'months':months,'values':vals})
    return out

allrows=[]
for f in sorted(glob.glob('txt/p*.txt')):
    allrows.extend(parse_page(f))
json.dump(allrows,open('parsed_rows.json','w',encoding='utf-8'),ensure_ascii=False,indent=0)
from collections import Counter
c=Counter(r['page'] for r in allrows)
print("rows parsed:",len(allrows))
print("per page:",dict(sorted(c.items())))
print("\n--- p059 (2025-06 首都圏マンション) ---")
for r in allrows:
    if r['page']==59: print(r['label'][:28].ljust(28), r['months'][0], '..', r['months'][-1], r['values'][:3], '...', r['values'][-2:])
print("\n--- p003 (2025-01 首都圏マンション件数) ---")
for r in allrows:
    if r['page']==3: print(r['label'][:28].ljust(28), r['months'][0], '..', r['months'][-1], r['values'][:3], '...', r['values'][-2:])
