# Scorecard data

Every edition of the page is one JSON snapshot. `index.html` renders any snapshot with the same template.
In split view, the current week is on the left (`current.json`) and the edition you picked is on the right (`?compare=YYYY-MM-DD`).

## Cadence
- **Weekly snapshot every Sunday** (`YYYY-MM-DD.json`, starting 2026-01-04).
- **Editions** are the hand-written reports (2026-09-21, 2026-10-10, and the current one). They use the same schema and may include estimates.
- `current.json` is the live edition. It is also saved under its own date.

## Files
- `index.json`: `{schema, current, cadence, snapshots:[{date,file,kind,tag}], legacy:[{t,url}]}`. The picker reads this.
- `history.json`: precomputed series for the "Over time" charts (`weeks[]` with best Elo and AA per lab, open/closed gap, frontier price, `aa_version`; `releases[]`).
- `<date>.json`: one snapshot.

## Snapshot schema (schema: 1)
| key | meaning |
|---|---|
| date, kind (`weekly`/`edition`/`current`), kind_label, tag | identity |
| aa_version | Artificial Analysis Intelligence Index version (e.g. `v4.3`). **Only compare AA scores within one version.** |
| arena_total | number of models on the archived LMArena board |
| captions{arena,aa,usage,unlock,ctx,land} | short, date-specific chart captions |
| leaders[] | `{lab:x/o/a/g, model, released, ctx_k, pin, pout, note, gated, public_model}` |
| changes[] | `{lab, k, t}` "what changed" chips |
| models[] | `{g, company, model, short, released, released_basis, open, country, rank, elo, votes, prelim, aa, aa_name, aa_partial, code, pin, pout, ctx_k, status, sec, hide_table}`. `g` = x/o/a/g/big/cn/op/nl. `sec` = secondary big-four model, which is faded in charts. `hide_table` = shown only in the top charts. |
| usage[] | `{label, sub, value_m, period, display, lab, as_of, source}`. Only figures public on or before `date`. |
| unlock[], overhang[], effort[] | estimates, or `null` if none were made for that edition |
| aidb[], harness[], matrix{cols,rows} | `null` if not tracked |
| coverage{} | for each data family: real (with Wayback URL) vs null |
| caveats[], links[] | sources & caveats section |

Missing values are always `null`, never guessed. The UI shows `—` or "Not tracked in this edition".

## Stocks (`data/stocks/`)
Publicly traded companies only (no private valuations). `meta.json` = tickers, exchange, currency, IPO date, `as_of`; `1d.json` (5‑min), `5d.json` (30‑min), `daily.json` (2y daily), `weekly.json` (max weekly): `{SYMBOL:[[unix_ts, close],…]}`.
Every snapshot shares these files; the page cuts each series at the snapshot's date, so past editions show their stock block as of that week (1D/5D only for the current edition). Snapshots from 2026‑10‑12 carry a `stocks` reference key.
**Weekly refresh:** run `python3 scripts/update_stocks.py` from the repo root before committing. It refetches every ticker from Yahoo Finance (Stooq fallback for daily) and rewrites `data/stocks/`. To add a newly listed AI company, add it to `TICKERS` in the script.

## How a refresh adds a snapshot
1. Build the new edition with the schema above and write it to `data/<today>.json` **and** `data/current.json`.
2. On Sundays (or whenever a refresh crosses one), also write `data/<sunday>.json` from that week's LMArena and AA data, if one doesn't exist yet.
3. Add both entries to `index.json.snapshots` in date order, and set `index.json.current`.
4. Add a week to `history.json.weeks` (same fields), and add to `releases` when a lab's best model changes.
5. Run `scripts/update_stocks.py`.
6. Never edit older snapshots. `archive/*.html` stays as the original text editions.
Backfill scripts live outside the repo (`/workspace/frontier-scorecard/hist/`: arena.py, aa.py, aa3.py, build.py).
