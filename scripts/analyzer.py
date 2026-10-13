#!/usr/bin/env python3
"""AI stock analyzer data: daily OHLCV + sectors (Yahoo) for every QYLD stock holding -> data/stocks/analyzer.json
(weekly indicator snapshots back to Jan 4 2026, so past editions read their own week) and data/stocks/ax_series.json
(2y daily close+volume, lazy-loaded for sparklines/detail). Technical indicators only; not advice.
Run: python3 scripts/analyzer.py (also called at the end of update_stocks.py)."""
import json, os, sys, time, math, csv, datetime as dt, urllib.request, http.cookiejar
from concurrent.futures import ThreadPoolExecutor
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","data","stocks")
AI={  # AI exposure tag (editorial): chips / infra / cloud / apps ; everything else = non
 "chips":"NVDA AMD AVGO INTC MU QCOM ARM MRVL TXN ADI KLAC LRCX AMAT ASML MPWR NXPI MCHP TER ALAB SNPS CDNS SNDK STX WDC LITE",
 "infra":"CSCO CEG CRWV NBIS AEP XEL EXC BKR FANG HONA",
 "cloud":"MSFT AMZN GOOGL GOOG ORCL META",
 "apps":"SPCX PLTR APP CRWD PANW FTNT DDOG ADBE INTU WDAY ADSK SHOP NFLX TSLA AAPL MSTR AXON TTWO ROP TRI DASH ZS TEAM"}
TAG={s:k for k,v in AI.items() for s in v.split()}
UA={"User-Agent":"Mozilla/5.0"}
def chart(sym):
    u=f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=2y&interval=1d"
    for i in range(3):
        try:
            r=json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=25))["chart"]["result"][0]
            q=r["indicators"]["quote"][0]; out=[]
            for t,c,v in zip(r["timestamp"],q["close"],q["volume"]):
                if c is not None: out.append((t,c,v or 0))
            return out
        except Exception as e: err=e; time.sleep(2)
    print("chart fail",sym,err,file=sys.stderr); return None
def sectors(syms,old):
    cj=http.cookiejar.CookieJar(); op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj)); op.addheaders=list(UA.items())
    try: op.open("https://fc.yahoo.com",timeout=15)
    except Exception: pass
    try: crumb=op.open("https://query1.finance.yahoo.com/v1/test/getcrumb",timeout=15).read().decode()
    except Exception as e: print("crumb fail",e,file=sys.stderr); return old
    def one(s):
        try:
            p=json.load(op.open(f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{s}?modules=assetProfile&crumb={crumb}",timeout=20))["quoteSummary"]["result"][0]["assetProfile"]
            return s,[p.get("sector") or "Other",p.get("industry") or ""]
        except Exception: return s,old.get(s,["Other",""])
    with ThreadPoolExecutor(6) as ex: return dict(ex.map(one,syms))
def r1(x,n=1): return None if x is None or (isinstance(x,float) and math.isnan(x)) else round(x,n)
def stats(S,Q,end):
    """Indicators from rows (t,c,v) with t<=end. Q = QQQ rows for beta."""
    s=[x for x in S if x[0]<=end]
    if len(s)<30: return None
    c=[x[1] for x in s]; t=[x[0] for x in s]; p=c[-1]
    def chg(sec):
        b=[x for x in s if x[0]<=t[-1]-sec]; return (p/b[-1][1]-1)*100 if b else None
    ye=dt.datetime(dt.datetime.fromtimestamp(t[-1],dt.timezone.utc).year,1,1).timestamp()
    yb=[x for x in s if x[0]<ye]; ytd=(p/yb[-1][1]-1)*100 if yb else None
    ma=lambda n: sum(c[-n:])/n if len(c)>=n else None
    m50,m200=ma(50),ma(200)
    g=[max(c[i]-c[i-1],0) for i in range(1,len(c))]; l=[max(c[i-1]-c[i],0) for i in range(1,len(c))]
    ag=sum(g[:14])/14; al=sum(l[:14])/14
    for i in range(14,len(g)): ag=(ag*13+g[i])/14; al=(al*13+l[i])/14
    rsi=100 if al==0 else 100-100/(1+ag/al)
    y=[x for x in s if x[0]>t[-1]-365*864e2]; yc=[x[1] for x in y]
    hi,lo=max(yc),min(yc)
    rets=[yc[i]/yc[i-1]-1 for i in range(1,len(yc))]
    mu=sum(rets)/len(rets); vol=math.sqrt(sum((r-mu)**2 for r in rets)/(len(rets)-1))*math.sqrt(252)*100
    pk=yc[0]; mdd=0
    for v in yc: pk=max(pk,v); mdd=min(mdd,v/pk-1)
    qd={x[0]//86400:x[1] for x in Q}; pr=[]
    for i in range(1,len(y)):
        a,b=qd.get(y[i-1][0]//86400),qd.get(y[i][0]//86400)
        if a and b: pr.append((y[i][1]/y[i-1][1]-1,b/a-1))
    beta=None
    if len(pr)>30:
        mx=sum(q for _,q in pr)/len(pr); my=sum(r for r,_ in pr)/len(pr)
        cv=sum((r-my)*(q-mx) for r,q in pr); vq=sum((q-mx)**2 for _,q in pr); beta=cv/vq if vq else None
    c1m=chg(30*864e2); cl=lambda v:max(0,min(1,v))
    score=20*(p>(m50 or 9e9))+20*(p>(m200 or 9e9))+20*((m50 or 0)>(m200 or 9e9))+20*cl((rsi-30)/40)+20*cl(((c1m or 0)+10)/20)
    d1=(p/c[-2]-1)*100
    return [r1(p,2),r1(d1,2),r1(chg(7*864e2)),r1(c1m),r1(ytd),r1(chg(365*864e2)),r1(rsi),
            r1((p/m50-1)*100 if m50 else None),r1((p/m200-1)*100 if m200 else None),r1((p/hi-1)*100),r1((p/lo-1)*100),
            r1(vol),r1(mdd*100),r1(beta,2),round(score),t[-1]]
COLS=["p","d1","d5","m1","ytd","y1","rsi","v50","v200","hi","lo","vol","mdd","beta","score","t"]
def main():
    H=[(r["Ticker"],r["Name"],float(r["Weight"])) for r in csv.DictReader(open(os.path.join(ROOT,"qyld_holdings.csv")))]
    syms=[h[0] for h in H]
    try: old=json.load(open(os.path.join(ROOT,"analyzer.json"))).get("sector",{})
    except Exception: old={}
    with ThreadPoolExecutor(8) as ex: R=dict(zip(syms+["QQQ"],ex.map(chart,syms+["QQQ"])))
    Q=R.pop("QQQ") or []
    sec=sectors(syms,old)
    now=max(x[-1][0] for x in R.values() if x)
    d=dt.date(2026,1,4); dates=set()
    while d<=dt.date.today(): dates.add(d); d+=dt.timedelta(7)
    try: dates|={dt.date.fromisoformat(x["date"]) for x in json.load(open(os.path.join(ROOT,"..","index.json")))["snapshots"]}
    except Exception as e: print("index.json",e,file=sys.stderr)
    dates=sorted(x for x in dates if dt.datetime(x.year,x.month,x.day,23,59,tzinfo=dt.timezone.utc).timestamp()<now-86400*2 or x<dt.date.today())
    snaps={}
    for dd in dates+["live"]:
        end=now+1 if dd=="live" else dt.datetime(dd.year,dd.month,dd.day,23,59,tzinfo=dt.timezone.utc).timestamp()
        snaps["live" if dd=="live" else dd.isoformat()]={s:st for s in syms if R.get(s) and (st:=stats(R[s],Q,end))}
    out={"as_of":int(time.time()),"cols":COLS,"names":{s:n for s,n,_ in H},"weight":{s:w for s,_,w in H},
         "sector":{s:sec.get(s,["Other",""]) for s in syms},"ai":{s:TAG.get(s,"non") for s in syms},
         "missing":[s for s in syms if not R.get(s)],"snap":snaps}
    json.dump(out,open(os.path.join(ROOT,"analyzer.json"),"w"),separators=(",",":"))
    try: corr(R,syms,list(snaps))
    except Exception as e: print("corr fail (kept previous ax_corr.json)",e,file=sys.stderr)
    ser={}
    for s,rows in R.items():
        if not rows: continue
        a=[];pt=0
        for t,c,v in rows: a+= [t-pt,float(f"{c:.4g}"),round(v/1000)]; pt=t
        ser[s]=a
    json.dump(ser,open(os.path.join(ROOT,"ax_series.json"),"w"),separators=(",",":"))
    print("analyzer:",len(snaps["live"]),"stocks live,",len(snaps)-1,"weekly snapshots; missing",out["missing"])
def corr(R,syms,keys):
    """1-year daily-return correlations per snapshot -> ax_corr.json: edges >=0.4 (top 12 per node) + histogram of all pairs."""
    import numpy as np
    days=sorted({x[0]//86400 for s in syms if R.get(s) for x in R[s]}); di={d:i for i,d in enumerate(days)}
    P=np.full((len(syms),len(days)),np.nan)
    for a,s in enumerate(syms):
        for t,c,v in R.get(s) or []: P[a,di[t//86400]]=c
    out={"syms":syms,"snap":{}}
    for k in keys:
        end=len(days) if k=="live" else sum(1 for d in days if d*86400<=dt.datetime.fromisoformat(k+"T23:59:59+00:00").timestamp())
        W=P[:,max(0,end-253):end]; r=W[:,1:]/W[:,:-1]-1
        ok=~np.isnan(r); n=ok.sum(1)
        if end<60: continue
        rf=np.where(ok,r,0); m=rf.sum(1)/np.maximum(n,1); z=np.where(ok,r-m[:,None],0); sd=np.sqrt((z*z).sum(1)/np.maximum(n,1))
        both=ok.astype(float)@ok.T.astype(float); C=(z@z.T)/np.maximum(both,1)/np.outer(sd,sd)
        C[both<60]=np.nan; np.fill_diagonal(C,np.nan)
        iu=np.triu_indices(len(syms),1); allc=C[iu]; allc=allc[~np.isnan(allc)]
        hist=np.histogram(allc,bins=np.linspace(-0.2,1,13))[0].tolist()
        keep=set()
        for a in range(len(syms)):
            row=np.nan_to_num(C[a],nan=-9); top=np.argsort(-row)[:12]
            keep|={(min(a,b),max(a,b)) for b in top if row[b]>=0.4}
        q=np.nan_to_num(np.round(C[iu]*100),nan=-128).clip(-128,100).astype(np.int8)
        import base64; mtx=base64.b64encode(q.tobytes()).decode()
        out["snap"][k]={"m":mtx,"e":[v for a,b in sorted(keep) for v in (int(a),int(b),int(round(C[a,b]*100)))],"h":hist}
    fn=os.path.join(ROOT,"ax_corr.json"); json.dump(out,open(fn+".tmp","w"),separators=(",",":")); os.replace(fn+".tmp",fn)
    print("corr:",len(out["snap"]),"snapshots, live edges",len(out["snap"]["live"]["e"])//3)
if __name__=="__main__": main()
