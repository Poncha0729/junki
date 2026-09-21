#!/usr/bin/env python3
"""parsed_rows.json → 直近期間の tidy 時系列 (recent_tidy.json)。決定論的。"""
import json, re, collections
rows = json.load(open('parsed_rows.json', encoding='utf-8'))
by_page = collections.defaultdict(list)
for r in rows: by_page[r['page']].append(r)

REPORT_OF = {}
for base, rm in ((0,'2025-01'),(12,'2025-02'),(24,'2025-03')):
    for off in range(1,13): REPORT_OF[base+off] = rm
for base, rm in ((36,'2025-04'),(46,'2025-05'),(56,'2025-06')):
    for off in range(1,11): REPORT_OF[base+off] = rm

REGION_ALIAS = {'横浜・川崎市':'横浜市・川崎市','横浜･川崎市':'横浜市・川崎市',
                '北海道札幌市':'札幌市','宮城県仙台市':'仙台市'}
REGIONS = ['東京都','東京都区部','東京都多摩','埼玉県','千葉県','神奈川県','横浜市・川崎市','神奈川県他']

def clean_label(lbl):
    lbl = lbl.replace('　',' ').strip()
    unit = None
    m = re.search(r'[（(]\s*([^（()）]+?)\s*[）)]\s*$', lbl)
    if m:
        unit = m.group(1).strip()
        lbl = lbl[:m.start()].strip()
    return lbl, unit

def basis_of(lbl):
    if '前年同月比' in lbl or lbl.strip() in ('前年同月比','前年比'): return 'yoy_pct'
    if '前月比' in lbl: return 'mom_pct'
    return 'value'

out = []
def emit(page, ptype, region, metric, basis, unit, months, values):
    for mo, v in zip(months, values):
        out.append({'month':mo,'ptype':ptype,'region':region,'metric':metric,'basis':basis,
                    'value':v,'unit':unit,'page':page,'report':REPORT_OF[page]})

# ---------- 首都圏全体（明示ラベル型） ----------
def shutoken(page, ptype):
    cur_metric = None; cur_unit=None
    for r in by_page[page]:
        lbl, unit = clean_label(r['label'])
        b = basis_of(lbl)
        if b == 'value':
            cur_metric = lbl.replace(' ','') ; cur_unit = unit
            # 旧様式は「成約件数」など、新様式は「成約専有面積」など。表記をそろえる
            if cur_metric in ('専有面積','土地面積','建物面積','築年数','築後年数'):
                cur_metric = '成約'+cur_metric.replace('築後年数','築年数')
        if cur_metric is None: continue
        emit(page, ptype, '首都圏', cur_metric, b, cur_unit if b=='value' else '％', r['months'], r['values'])

# ---------- エリア別（地域ラベル型） ----------
def area(page, ptype, metrics_by_unit):
    seen = collections.Counter(); cur_region=None; cur_metric=None; cur_unit=None
    for r in by_page[page]:
        lbl, unit = clean_label(r['label'])
        b = basis_of(lbl)
        if b == 'value':
            reg = REGION_ALIAS.get(lbl.replace(' ',''), lbl.replace(' ',''))
            if reg not in REGIONS: 
                continue
            cur_region = reg
            seen[reg]+=1
            # 単位で表を判定（件→1つ目、万円→2つ目）。単位が無ければ出現回数で判定
            if unit and '件' in unit: cur_metric, cur_unit = metrics_by_unit[0]
            elif unit and '万円' in unit: cur_metric, cur_unit = metrics_by_unit[-1]
            else: cur_metric, cur_unit = metrics_by_unit[min(seen[reg]-1, len(metrics_by_unit)-1)]
        if cur_region is None: continue
        emit(page, ptype, cur_region, cur_metric, b, cur_unit if b=='value' else '％', r['months'], r['values'])

# ---------- 札幌・仙台 ----------
def sapporo_new(page):
    # 新様式: 札幌市 中古マンション → 仙台市 中古マンション → 札幌市 戸建 → 仙台市 戸建 の順に「件数」行で切り替わる
    order = [('札幌市','mansion'),('仙台市','mansion'),('札幌市','detached'),('仙台市','detached')]
    idx=-1; cur=None
    for r in by_page[page]:
        lbl, unit = clean_label(r['label'])
        b = basis_of(lbl)
        if b=='value':
            name = lbl.replace(' ','')
            if name=='件数':
                idx+=1
            cur = {'件数':'成約件数','㎡単価':'成約㎡単価','価格':'成約価格','専有面積':'成約専有面積',
                   '土地面積':'成約土地面積','建物面積':'成約建物面積','築年数':'成約築年数'}.get(name, name)
            cur_unit = {'成約件数':'件','成約㎡単価':'万円/㎡','成約価格':'万円','成約専有面積':'㎡',
                        '成約土地面積':'㎡','成約建物面積':'㎡','成約築年数':'年'}.get(cur, unit)
        if idx<0 or cur is None: continue
        region, ptype = order[min(idx,3)]
        emit(page, ptype, region, cur, b, cur_unit if b=='value' else '％', r['months'], r['values'])

def sapporo_old(page):
    # 旧様式: 「成約件数 北海道札幌市 （件）」「前年同月比」「前月比」「宮城県仙台市 （件）」…
    # マンション表 → 戸建表 の順。metric はラベル中のキーワードで判定し、無ければ直前を引き継ぐ
    ptype='mansion'; cur_metric=None; cur_region=None; cur_unit=None; count_kensu=0
    for r in by_page[page]:
        lbl, unit = clean_label(r['label'])
        b = basis_of(lbl)
        if b=='value':
            s = lbl.replace(' ','')
            if '札幌' in s: cur_region='札幌市'
            elif '仙台' in s: cur_region='仙台市'
            for k,mname in (('成約件数','成約件数'),('㎡単価','成約㎡単価'),('成約価格','成約価格'),
                            ('専有面積','成約専有面積'),('土地面積','成約土地面積'),('建物面積','成約建物面積'),('築年数','成約築年数')):
                if k in s:
                    if mname=='成約件数' and cur_region=='札幌市':
                        count_kensu+=1
                        if count_kensu==2: ptype='detached'
                    cur_metric=mname; break
            cur_unit = unit or cur_unit
        if cur_metric is None or cur_region is None: continue
        emit(page, ptype, cur_region, cur_metric, b, cur_unit if b=='value' else '％', r['months'], r['values'])

M_AREA = [('成約件数','件'),('成約㎡単価','万円/㎡')]
D_AREA = [('成約件数','件'),('成約価格','万円')]
# 新様式
for base in (36,46,56):
    shutoken(base+3,'mansion'); area(base+5,'mansion',M_AREA)
    shutoken(base+6,'detached'); area(base+8,'detached',D_AREA)
    sapporo_new(base+9)
# 旧様式
for base in (0,12,24):
    shutoken(base+3,'mansion'); shutoken(base+5,'mansion')
    area(base+4,'mansion',[('成約件数','件')]); area(base+6,'mansion',[('成約㎡単価','万円/㎡')])
    shutoken(base+7,'detached'); shutoken(base+9,'detached')
    area(base+8,'detached',[('成約件数','件')]); area(base+10,'detached',[('成約価格','万円')])
    # sapporo_old(base+11)  # 旧様式はラベル折返しで誤対応が出るため不採用（新様式 2024-04〜 を使用）

# ---------- 統合: 同一セルは最新レポート優先、相違はconflictsに ----------
cells = collections.defaultdict(dict)
for o in out:
    key=(o['ptype'],o['region'],o['metric'],o['basis'],o['month'])
    cells[key][o['report']] = o
tidy=[]; conflicts=[]
for key, byrep in cells.items():
    latest = max(byrep)
    o = dict(byrep[latest]); o['reports']=sorted(byrep)
    vals = {byrep[r]['value'] for r in byrep}
    if len(vals)>1:
        conflicts.append({'key':key,'values':{r:byrep[r]['value'] for r in byrep}})
        o['revised']=True
    tidy.append(o)
tidy.sort(key=lambda o:(o['ptype'],o['region'],o['metric'],o['basis'],o['month']))
json.dump(tidy, open('recent_tidy.json','w',encoding='utf-8'), ensure_ascii=False, indent=0)
json.dump(conflicts, open('recent_conflicts.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)

months = sorted({o['month'] for o in tidy})
print("tidy records:", len(tidy), " months:", months[0], "..", months[-1], f"({len(months)})")
print("conflicts (revised between reports):", len(conflicts))
big=[c for c in conflicts if max(abs((v or 0)-(w or 0)) for v in c['values'].values() for w in c['values'].values())>0.05]
print('material conflicts (>0.05):',len(big))
for c in big[:30]: print('  ',c)
print("\nmetrics by ptype/region:")
mm = collections.defaultdict(set)
for o in tidy: mm[(o['ptype'],o['region'])].add(o['metric'])
for k in sorted(mm): print(" ", k, sorted(mm[k]))
# spot checks
def get(pt,reg,met,bas,mo):
    for o in tidy:
        if (o['ptype'],o['region'],o['metric'],o['basis'],o['month'])==(pt,reg,met,bas,mo): return o['value']
print("\nspot: 首都圏 mansion 成約件数 2025-06 =", get('mansion','首都圏','成約件数','value','2025-06'), "(期待 4299)")
print("spot: 首都圏 mansion 成約件数 2024-01 =", get('mansion','首都圏','成約件数','value','2024-01'), "(期待 2711)")
print("spot: 東京都区部 mansion 成約㎡単価 2025-04 =", get('mansion','東京都区部','成約㎡単価','value','2025-04'), "(期待 124.89)")
print("spot: 首都圏 detached 成約価格 2025-04 =", get('detached','首都圏','成約価格','value','2025-04'), "(期待 3804)")
print("spot: 札幌市 mansion 成約件数 2025-01 =", get('mansion','札幌市','成約件数','value','2025-01'), "(期待 150)")
print("spot: 仙台市 detached 成約件数 2025-01 =", get('detached','仙台市','成約件数','value','2025-01'), "(期待 30)")
print("spot: 首都圏 mansion 在庫件数 2025-06 =", get('mansion','首都圏','在庫件数','value','2025-06'), "(期待 44428)")
