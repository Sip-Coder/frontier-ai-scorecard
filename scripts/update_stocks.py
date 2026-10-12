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
 ("2513.HK","Zhipu (Z.ai)","Zhipu (Z.ai)","zhipu","#c4b5fd"),("0100.HK","MiniMax","MiniMax","minimax","#fde047")]
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
def main():
    os.makedirs(OUT,exist_ok=True); meta={"source":"Yahoo Finance chart API (query1.finance.yahoo.com/v8/finance/chart)","tickers":[],"missing":[]}
    data={k:{} for k in SETS}
    for sym,lab,co,key,col in TICKERS:
        ok=False
        for k,(rng,iv) in SETS.items():
            try:
                m,p=yahoo(sym,rng,iv); data[k][sym]=p; ok=True
                if k=="weekly": info=m
            except Exception as e:
                print("fail",sym,k,e,file=sys.stderr)
                if k=="daily":
                    try: data[k][sym]=stooq(sym)[-520:]; ok=True
                    except Exception as e2: print("stooq fail",sym,e2,file=sys.stderr)
        if not ok or sym not in data["daily"]: meta["missing"].append(sym); continue
        meta["tickers"].append({"sym":sym,"label":lab,"company":co,"key":key,"color":col,
          "exchange":info.get("fullExchangeName"),"currency":info.get("currency"),"first_trade":info.get("firstTradeDate"),
          "tz":info.get("exchangeTimezoneName"),"price":info.get("regularMarketPrice"),"market_time":info.get("regularMarketTime")})
    meta["as_of"]=int(time.time())
    for k,v in data.items(): json.dump(v,open(os.path.join(OUT,k+".json"),"w"),separators=(",",":"))
    json.dump(meta,open(os.path.join(OUT,"meta.json"),"w"),indent=1)
    print(len(meta["tickers"]),"tickers; missing:",meta["missing"])
if __name__=="__main__": main()
