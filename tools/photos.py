"""Fetch one photo per machine type, strictly of Chinese-manufactured equipment.

Runs inside GitHub Actions (open internet). Sources, in order:
  1. Wikimedia Commons (free licences)
  2. Openverse (openly licensed Flickr and other photos, commercial use allowed)

A candidate is accepted ONLY if its title, description, tags or categories name a Chinese
manufacturer (SANY, XCMG, SDLG, Shantui, Zoomlion, LiuGong, Sinotruk/HOWO, Shacman, DJI ...).
Old, rusty, toy, model and drawing images are scored down; trade-show photos of new machines are welcome.

Writes docs/img/m/<key>.jpg (1200x900) and <key>-s.jpg (640x480), records credit and licence in
photos.lock.json (shown on /credits/), and writes tools/review.jpg (contact sheet).
Keys with no acceptable photo are recorded as {"none": true}; the site then shows a designed tile.

photos.json per key: "q" list of searches, optional "pin" (exact Commons file), "own" (file in
docs/img/own/), "alias" (reuse another key), "brands" (override brand pattern), "tile" (never fetch).
To retry a key, delete it from photos.lock.json and push.
"""
import io, json, pathlib, re, shutil, sys, time, urllib.parse, urllib.request

from PIL import Image, ImageDraw, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
COMMONS = "https://commons.wikimedia.org/w/api.php"
OPENVERSE = "https://api.openverse.org/v1/images/"
UA = "YellowmetalStoreBot/2.0 (https://yellowmetal.store; kola@yellowmetal.store)"
OUT = ROOT / "docs/img/m"
CHINESE = r"\b(sany|xcmg|sdlg|shantui|zoomlion|liugong|liu ?gong|sinotruk|howo|shacman|shaanxi|lonking|sunward|dingli|sinoboom|hangcha|heli forklift|\bheli\b|foton|dongfeng|beiben|faw\b|cimc|lovol|xgma|changlin|yutong|king ?long|higer|golden dragon|great wall|gwm|jac\b|zpmc|dji|chc nav|hi-?target|kaishan|weichai|yuchai|sinomach|sdlg|xe\d{2,3}|sy\d{2,3}|lg9\d\d|sd(16|22|32)|qy\d{2})"
BAD = re.compile(r"drawing|diagram|\bmodel\b|toy|lego|miniature|scale model|logo|\bmap\b|poster|stamp|patent|sketch|cartoon|brochure|1:\d|svg|interior|dashboard|wreck|accident|\bfire\b|crash|abandon|rust|derelict|scrap|vintage|antique|museum|statue|monument|night", re.I)
OK_LICENCE = re.compile(r"^(cc0|public domain|pd|cc[ -]by(-sa)?[ -]?\d|cc by(-sa)? \d|by(-sa)?$|attribution|gfdl|fal|free art|pdm)", re.I)
OPENVERSE_BUDGET = [180]
MIN_YEAR = 2019            # photos older than this are rejected (old models)
OBSOLETE = re.compile(r"\b(a7|steyr|zl50|zl30|lw300f|sy210|sy215c?-?[0-8]\b|sy235|sd16l|sd22l|pc200-[1-7]|howo 336|howo 371 a|1[89]\d\d|200[0-9]|201[0-6])\b", re.I)


def photo_year(meta):
    for k in ("DateTimeOriginal", "DateTime"):
        m = re.search(r"(19|20)\d\d", strip_html(meta.get(k, {}).get("value", "")))
        if m:
            return int(m.group(0))
    return None   # stay under anonymous daily limit


def get_json(url):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read())
        except Exception as e:  # noqa
            if "429" in str(e):
                time.sleep(20)
            time.sleep(2 + attempt * 3)
    return {}


def strip_html(s):
    return re.sub(r"<[^>]+>", " ", s or "").strip()


def score(rank, w, h, text, used_key):
    ratio = w / h if h else 0
    s = 30 - rank
    s += 14 if 1.25 <= ratio <= 1.9 else (5 if 1.05 <= ratio < 1.25 else -25)
    s += 4 if w >= 2000 else (0 if w >= 1200 else -10)
    if BAD.search(text):
        s -= 45
    if re.search(r"new|202[0-9]|bauma|expo|exhibition|delivery", text, re.I):
        s += 4
    if used_key:
        s -= 200
    return s


def commons(q, brand, used, models=None):
    res = get_json(COMMONS + "?" + urllib.parse.urlencode({"action": "query", "list": "search", "srnamespace": 6, "srlimit": 30,
        "srsearch": f"{q} filetype:bitmap filew:>900", "format": "json", "formatversion": 2}))
    titles = [h["title"] for h in res.get("query", {}).get("search", [])]
    if not titles:
        return []
    info = get_json(COMMONS + "?" + urllib.parse.urlencode({"action": "query", "titles": "|".join(titles), "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1600, "format": "json", "formatversion": 2,
        "iiextmetadatafilter": "LicenseShortName|Artist|ImageDescription|Categories|DateTimeOriginal|DateTime"}))
    pages = {p["title"]: p for p in info.get("query", {}).get("pages", [])}
    out = []
    for rank, t in enumerate(titles):
        p = pages.get(t)
        if not p or "imageinfo" not in p:
            continue
        ii = p["imageinfo"][0]; meta = ii.get("extmetadata", {})
        lic = strip_html(meta.get("LicenseShortName", {}).get("value"))
        text = " ".join([t, strip_html(meta.get("ImageDescription", {}).get("value"))[:500], strip_html(meta.get("Categories", {}).get("value"))])
        if not OK_LICENCE.search(lic) or ii.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
            continue
        if not re.search(brand, text, re.I):
            continue
        yr = photo_year(meta)
        if yr is None or yr < MIN_YEAR or OBSOLETE.search(t):
            continue
        bonus = 12 if models and re.search(models, text, re.I) else 0
        out.append({"title": t, "thumb": ii.get("thumburl") or ii["url"], "page": ii.get("descriptionurl"), "licence": lic, "year": yr,
                    "author": strip_html(meta.get("Artist", {}).get("value"))[:120] or "Unknown", "source": "Wikimedia Commons",
                    "score": score(rank, ii.get("width", 0), ii.get("height", 0), text, t in used) + bonus + (yr - MIN_YEAR)})
    return out


def openverse(q, brand, used, models=None):
    if OPENVERSE_BUDGET[0] <= 0 or not models:   # no dates in Openverse: only trust named current models
        return []
    OPENVERSE_BUDGET[0] -= 1
    res = get_json(OPENVERSE + "?" + urllib.parse.urlencode({"q": q, "license_type": "commercial", "page_size": 20, "mature": "false"}))
    out = []
    for rank, r in enumerate(res.get("results", [])):
        tags = " ".join(t.get("name", "") for t in (r.get("tags") or []))
        text = " ".join([r.get("title") or "", tags])
        if not re.search(brand, text, re.I) or not re.search(models, text, re.I) or OBSOLETE.search(text):
            continue
        lic = f"CC {r.get('license', '').upper()} {r.get('license_version') or ''}".strip()
        if r.get("license") in ("cc0", "pdm"):
            lic = "CC0" if r["license"] == "cc0" else "Public domain"
        key = r.get("foreign_landing_url") or r.get("url")
        out.append({"title": r.get("title") or "Untitled", "thumb": r.get("url"), "page": key, "licence": lic,
                    "author": (r.get("creator") or "Unknown")[:120], "source": r.get("source") or "Openverse",
                    "score": score(rank, r.get("width") or 0, r.get("height") or 0, text, key in used) - 2})
    return out


def save(img, key):
    img = ImageOps.exif_transpose(img).convert("RGB")
    if img.width < 600:
        raise ValueError("too small")
    for name, size, q in ((f"{key}.jpg", (1200, 900), 82), (f"{key}-s.jpg", (640, 480), 76)):
        ImageOps.fit(img, size, Image.LANCZOS, centering=(0.5, 0.55)).save(OUT / name, quality=q, optimize=True, progressive=True)


def download(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return Image.open(io.BytesIO(r.read()))


def review(keys):
    cols, w, h = 8, 240, 200
    names = sorted(keys)
    sheet = Image.new("RGB", (cols * w, ((len(names) + cols - 1) // cols) * h), "white")
    d = ImageDraw.Draw(sheet)
    for i, k in enumerate(names):
        x, y = (i % cols) * w, (i // cols) * h
        f = OUT / f"{k}-s.jpg"
        if f.exists():
            im = Image.open(f); im.thumbnail((w - 6, h - 26)); sheet.paste(im, (x + 3, y + 3))
        else:
            d.rectangle((x + 3, y + 3, x + w - 3, y + h - 26), fill=(11, 26, 44))
        d.text((x + 4, y + h - 20), k[:34], fill="black")
    sheet.save(ROOT / "tools/review.jpg", quality=70)


def main():
    spec = json.loads((ROOT / "photos.json").read_text())
    lock_path = ROOT / "photos.lock.json"
    lock = json.loads(lock_path.read_text()) if lock_path.exists() else {}
    OUT.mkdir(parents=True, exist_ok=True)
    # drop files for keys no longer in the spec or marked none
    for f in OUT.glob("*.jpg"):
        k = f.stem[:-2] if f.stem.endswith("-s") else f.stem
        if k not in spec["keys"] or lock.get(k, {}).get("none"):
            f.unlink()
    used = {v.get("page") for v in lock.values() if v.get("page")}
    todo = [k for k, s in spec["keys"].items() if not s.get("alias") and not s.get("tile") and (k not in lock or (not lock[k].get("none") and not (OUT / f"{k}.jpg").exists()))]
    print(f"{len(todo)} photos to fetch")
    for key in todo:
        s = spec["keys"][key]
        if s.get("own"):
            save(Image.open(ROOT / "docs/img/own" / s["own"]), key)
            lock[key] = {"title": "Yellowmetal site photo", "page": "", "licence": "Own photo", "author": "Yellowmetal Plants & Equipment Ltd", "source": "Yellowmetal"}
            continue
        brand = s.get("brands", CHINESE)
        queries = s["q"] if isinstance(s.get("q"), list) else [s.get("q", s["label"])]
        cands = []
        if s.get("pin"):
            cands = commons(s["pin"].replace("File:", ""), r".", set())
        for q in queries:
            cands += commons(q, brand, used, s.get("models"))
            time.sleep(0.4)
        if max([c["score"] for c in cands] or [-999]) < 25:
            for q in queries[:2]:
                cands += openverse(q, brand, used, s.get("models"))
                time.sleep(1.2)
        seen, uniq = set(), []
        for c in sorted(cands, key=lambda c: -c["score"]):
            if c["page"] in seen:
                continue
            seen.add(c["page"]); uniq.append(c)
        done = False
        for c in uniq[:5]:
            if c["score"] < -40:
                break
            try:
                save(download(c["thumb"]), key)
            except Exception as e:
                print("  skip", c["title"][:60], e); continue
            lock[key] = {k: c[k] for k in ("title", "page", "licence", "author", "source")}
            used.add(c["page"]); done = True
            print(f"{key}: {c['source']} · {c['title'][:70]} ({c['licence']})")
            break
        if not done:
            lock[key] = {"none": True}
            print(f"{key}: no Chinese-brand photo found; tile will be shown")
        lock_path.write_text(json.dumps(dict(sorted(lock.items())), indent=1, ensure_ascii=False))
    for key, s in spec["keys"].items():
        src = s.get("alias")
        if src and (OUT / f"{src}.jpg").exists():
            for suf in ("", "-s"):
                shutil.copyfile(OUT / f"{src}{suf}.jpg", OUT / f"{key}{suf}.jpg")
            lock[key] = dict(lock.get(src, {}), alias=src)
        elif src:
            lock[key] = {"none": True, "alias": src}
            for suf in ("", "-s"):
                (OUT / f"{key}{suf}.jpg").unlink(missing_ok=True)
    lock_path.write_text(json.dumps(dict(sorted(lock.items())), indent=1, ensure_ascii=False))
    review(spec["keys"].keys())


if __name__ == "__main__":
    main()
