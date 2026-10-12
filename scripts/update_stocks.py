#!/usr/bin/env python3
"""Refetch AI-stock price history into data/stocks/*.json (Yahoo Finance chart API, Stooq fallback for daily).
Run from repo root: python3 scripts/update_stocks.py. Only publicly traded companies on the page."""
import json, time, os, sys, urllib.request, csv, io, datetime as dt
TICKERS = [  # symbol, label, company, lab key, colour
 ("GOOGL","Alphabet","Google","g","#60a5fa"),("META","Meta","Meta","meta","#fb7185"),
 ("MSFT","Microsoft","Microsoft","msft","#22d3ee"),("AMZN","Amazon","Amazon","amzn","#f97316"),
 ("NVDA","NVIDIA","NVIDIA","nvda","#84cc16"),("SPCX","SpaceX (xAI)","xAI","x","#a78bfa"),
 ("BABA","Alibaba","Alibaba","baba","#ef4444"),("BIDU","Baidu","Baidu","bidu","#e879f9"),
 ("0700.HK","Tencent","Tencent","tcehy","#2dd4bf"),("1810.HK","Xiaomi","Xiaomi","xiaomi","#fdba74"),
 ("2513.HK","Zhipu (Z.ai)","Zhipu (Z.ai)","zhipu","#c4b5fd"),("0100.HK","MiniMax","MiniMax","minimax","#fde047"),
 ("QYLD","QYLD (Nasdaq-100 covered call ETF)","Global X","etf","#94a3b8")]  # ETF benchmark, not a lab
SETS = {"1d":("1d","5m"),"5d":("5d","30m"),"daily":("2y","1d"),"weekly":("max","1wk")}
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "stocks")
def yahoo(sym, rng, iv):
    u=f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range={rng}&interval={iv}"
    for i in range(3):
        try:
            r=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=20))["chart"]["result"][0]
            q=r["indicators"]["quote"][0]["close"]; pts=[[t,round(c,4)] for t,c in zip(r.get("timestamp",[]),q) if c is not None]
            return r["meta"], pts
        except Exception as e: err=e; time.sleep(2)
    raise err
def stooq(sym):
    s=sym.lower().replace(".hk",".hk") if "." in sym else sym.lower()+".us"
    t=urllib.request.urlopen(f"https://stooq.com/q/d/l/?s={s}&i=d",timeout=20).read().decode()
    rows=list(csv.DictReader(io.StringIO(t)))
    return [[int(dt.datetime.fromisoformat(r["Date"]).replace(tzinfo=dt.timezone.utc).timestamp()),float(r["Close"])] for r in rows]
HOLD_CSV=os.path.join(os.path.dirname(__file__),"..","data","stocks","qyld_holdings.csv")
def holdings():
    """QYLD stock holdings (Global X full-holdings CSV, saved weekly). Returns [(sym,name,weight)] by weight."""
    try:
        d=dt.date.today()
        for i in range(10):
            u=f"https://assets.globalxetfs.com/funds/holdings/qyld_full-holdings_{(d-dt.timedelta(i)).strftime('%Y%m%d')}.csv"
            try: t=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=20).read().decode("utf-8","ignore"); break
            except Exception: t=None
        if t:
            lines=t.splitlines(); h=next(i for i,l in enumerate(lines) if l.startswith("% of Net") or "Ticker" in l)
            rows=[r for r in csv.DictReader(io.StringIO("\n".join(lines[h:])))]
            out=[]
            for r in rows:
                tk=(r.get("Ticker") or "").strip(); w=(r.get("% of Net Assets") or "").strip()
                if not tk or not w or " " in tk or tk.upper() in ("CASH",) : continue
                try: out.append((tk.replace(".","-"),(r.get("Name") or "").strip().title(),float(w)))
                except ValueError: pass
            if len(out)>50:
                with open(HOLD_CSV,"w",newline="") as f: csv.writer(f).writerows([("Ticker","Name","Weight")]+out)
    except Exception as e: print("holdings fetch fail",e,file=sys.stderr)
    return [(r["Ticker"],r["Name"],float(r["Weight"])) for r in csv.DictReader(open(HOLD_CSV))]
def rnd(pts): return [[t,float(f"{c:.4g}")] for t,c in pts]
def fetch_all(sym):
    res={}
    for k,(rng,iv) in SETS.items():
        try:
            m,p=yahoo(sym,rng,iv); res[k]=rnd(p)
            if k=="weekly": res["_m"]=m
        except Exception as e:
            print("fail",sym,k,e,file=sys.stderr)
            if k=="daily":
                try: res[k]=rnd(stooq(sym)[-520:])
                except Exception as e2: print("stooq fail",sym,e2,file=sys.stderr)
    return res
def main():
    from concurrent.futures import ThreadPoolExecutor
    os.makedirs(OUT,exist_ok=True); meta={"source":"Yahoo Finance chart API (query1.finance.yahoo.com/v8/finance/chart)","tickers":[],"holdings":[],"missing":[]}
    main_syms={t[0] for t in TICKERS}; H=[h for h in holdings() if h[0] not in main_syms]
    allsyms=[t[0] for t in TICKERS]+[h[0] for h in H]
    with ThreadPoolExecutor(8) as ex: R=dict(zip(allsyms,ex.map(fetch_all,allsyms)))
    data={k:{} for k in SETS}; hdata={k:{} for k in SETS}
    def add(sym,dst,rec,group):
        r=R[sym]
        if "daily" not in r: meta["missing"].append(sym); return
        for k in SETS:
            if k in r: dst[k][sym]=r[k]
        info=r.get("_m",{})
        rec.update({"exchange":info.get("fullExchangeName"),"currency":info.get("currency"),"first_trade":info.get("firstTradeDate"),
          "tz":info.get("exchangeTimezoneName"),"price":info.get("regularMarketPrice"),"market_time":info.get("regularMarketTime")})
        meta[group].append(rec)
    for sym,lab,co,key,col in TICKERS: add(sym,data,{"sym":sym,"label":lab,"company":co,"key":key,"color":col,"etf":key=="etf"},"tickers")
    for i,(sym,name,w) in enumerate(H):
        add(sym,hdata,{"sym":sym,"label":name,"weight":w,"color":f"hsl({(i*137.5)%360:.0f},65%,62%)"},"holdings")
    try:  # S&P 500 E-mini futures: reference price only (no line)
        m,p=yahoo("ES=F","1d","5m"); _,d=yahoo("ES=F","2y","1d")
        meta["es"]={"sym":"ES=F","price":m.get("regularMarketPrice"),"prev":m.get("chartPreviousClose") or m.get("previousClose"),"time":m.get("regularMarketTime"),"closes":rnd(d)}
    except Exception as e: print("ES fail",e,file=sys.stderr)
    meta["as_of"]=int(time.time())
    for k in SETS:
        json.dump(data[k],open(os.path.join(OUT,k+".json"),"w"),separators=(",",":"))
        enc={sym:[v for i,(t,c) in enumerate(p) for v in ((t-p[i-1][0]) if i else t,c)] for sym,p in hdata[k].items()}  # flat delta-time encoding
        json.dump(enc,open(os.path.join(OUT,"h_"+k+".json"),"w"),separators=(",",":"))  # loaded only when a holding is switched on
    json.dump(meta,open(os.path.join(OUT,"meta.json"),"w"),separators=(",",":"))
    print(len(meta["tickers"]),"tickers,",len(meta["holdings"]),"holdings; missing:",meta["missing"])
if __name__=="__main__": main()
