"""Pull the latest prices from the Buildocrat Rate Book (rates.buildocrat.store).

Writes:
  data/rate-data.json    the rate book's full data file (source of truth for every price)
  data/equip-cats.json   the rate book's equipment-for-sale categories (slug, name, codes, drivers)
  src/engine.js          the rate book's rate engine, so the maths here matches it to the naira

Run: python3 tools/sync.py
"""
import ast, json, pathlib, sys, urllib.request

REPO = "alpontif/buildocrat-rate-book"
RAW = f"https://raw.githubusercontent.com/{REPO}/main/"
ROOT = pathlib.Path(__file__).resolve().parent.parent


def get(name):
    req = urllib.request.Request(RAW + name, headers={"User-Agent": "yellowmetal-store-sync"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def equip_categories(src):
    """Find the list of dict(...) page definitions whose codes are M-EQ equipment."""
    tree = ast.parse(src)
    cats = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and getattr(node.func, "id", None) == "dict":
            kw = {k.arg: k.value for k in node.keywords if k.arg}
            if "codes" in kw and "slug" in kw:
                try:
                    d = {k: ast.literal_eval(v) for k, v in kw.items()}
                except Exception:
                    continue
                if d["codes"] and all(c.startswith("M-EQ") for c in d["codes"]):
                    cats.append({k: d.get(k) for k in ("slug", "name", "h1", "q", "primary", "codes", "drivers")})
    return cats


def main():
    data = json.loads(get("rate-data.json"))
    for key in ("meta", "params", "locations", "resources", "labour", "plant"):
        if key not in data:
            sys.exit(f"rate-data.json is missing '{key}'; not updating")
    cats = equip_categories(get("site_build.py"))
    if len(cats) < 8:
        sys.exit("could not read equipment categories from site_build.py; not updating")
    engine = get("engine.js")
    if "function buildEngine" not in engine:
        sys.exit("engine.js looks wrong; not updating")

    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data/rate-data.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))
    (ROOT / "data/equip-cats.json").write_text(json.dumps(cats, ensure_ascii=False, indent=1))
    (ROOT / "src/engine.js").write_text(engine)
    n_eq = sum(1 for r in data["resources"] if r["c"].startswith("M-EQ"))
    print(f"Rate book {data['meta']['updated']}: {len(data['plant'])} hire items, {n_eq} equipment prices, {len(cats)} sale categories")


if __name__ == "__main__":
    main()
