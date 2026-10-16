"""Fetch one openly licensed photo per machine type from Wikimedia Commons.

Runs inside GitHub Actions (which has open internet). For every key in photos.json that is not
already in photos.lock.json it searches Commons, scores the results, downloads the best one,
crops it to 4:3 and saves:
  docs/img/m/<key>.jpg     1200x900
  docs/img/m/<key>-s.jpg   640x480 (cards)
and records title, author, licence and source page in photos.lock.json (shown on /credits/).
It also writes tools/review.jpg, a contact sheet of every photo, for a quick visual check.

To replace a photo: add "pin": "File:Exact title.jpg" (or change "q") for that key in photos.json
and delete the key from photos.lock.json. Run: python3 tools/photos.py
"""
import io, json, pathlib, re, sys, time, urllib.parse, urllib.request

from PIL import Image, ImageDraw, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = "https://commons.wikimedia.org/w/api.php"
UA = "YellowmetalStoreBot/1.0 (https://yellowmetal.store; kola@yellowmetal.store)"
OUT = ROOT / "docs/img/m"
BAD = re.compile(r"drawing|diagram|model|toy|lego|museum|miniature|scale|logo|map\b|plan\b|poster|stamp|patent|sketch|cartoon|manual|brochure|1:\d|svg|interior|dashboard|cab view|engine bay|wreck|accident|fire\b|crash|abandon|rust|derelict|1[89]\d\d|monument|statue|exhibit|show|expo|bauma|conexpo|parade|vintage|historic|antique|old\b", re.I)
OK_LICENCE = re.compile(r"^(cc0|public domain|pd|cc[ -]by(-sa)?[ -]?\d|cc by(-sa)? \d|attribution|gfdl|fal|free art)", re.I)


def api(params):
    params = dict(params, format="json", formatversion="2")
    url = API + "?" + urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read())
        except Exception as e:  # noqa
            time.sleep(2 + attempt * 3)
    raise RuntimeError("Commons API failed: " + url)


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def candidates(key, spec, used):
    if spec.get("pin"):
        titles = [spec["pin"]]
    else:
        res = api({"action": "query", "list": "search", "srnamespace": 6, "srlimit": 30,
                   "srsearch": f'{spec["q"]} filetype:bitmap filew:>1100'})
        titles = [h["title"] for h in res.get("query", {}).get("search", [])]
    if not titles:
        return []
    info = api({"action": "query", "titles": "|".join(titles[:30]), "prop": "imageinfo",
                "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1600,
                "iiextmetadatafilter": "LicenseShortName|Artist|ImageDescription|Categories"})
    pages = {p["title"]: p for p in info.get("query", {}).get("pages", [])}
    out = []
    for rank, t in enumerate(titles):
        p = pages.get(t)
        if not p or "imageinfo" not in p:
            continue
        ii = p["imageinfo"][0]
        meta = ii.get("extmetadata", {})
        lic = strip_html(meta.get("LicenseShortName", {}).get("value"))
        if not OK_LICENCE.search(lic):
            continue
        if ii.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
            continue
        w, h = ii.get("width", 0), ii.get("height", 0)
        if not w or not h:
            continue
        ratio = w / h
        desc = strip_html(meta.get("ImageDescription", {}).get("value"))[:300]
        score = 30 - rank
        score += 12 if 1.25 <= ratio <= 1.9 else (4 if 1.05 <= ratio < 1.25 else -20)
        score += 3 if w >= 2000 else 0
        score += 2 if ii.get("mime") == "image/jpeg" else 0
        if not spec.get("pin") and (BAD.search(t) or BAD.search(desc)):
            score -= 40
        if t in used:
            score -= 100
        out.append({"title": t, "score": score, "thumb": ii.get("thumburl") or ii["url"],
                     "page": ii.get("descriptionurl"), "licence": lic,
                     "author": strip_html(meta.get("Artist", {}).get("value"))[:120] or "Unknown",
                     "w": w, "h": h})
    out.sort(key=lambda c: -c["score"])
    return out


def save(img, key):
    img = ImageOps.exif_transpose(img).convert("RGB")
    for name, size, q in ((f"{key}.jpg", (1200, 900), 80), (f"{key}-s.jpg", (640, 480), 74)):
        ImageOps.fit(img, size, Image.LANCZOS, centering=(0.5, 0.55)).save(OUT / name, quality=q, optimize=True, progressive=True)


def download(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return Image.open(io.BytesIO(r.read()))


def review(lock, keys):
    cols, w, h = 8, 240, 200
    names = sorted(keys)
    sheet = Image.new("RGB", (cols * w, ((len(names) + cols - 1) // cols) * h), "white")
    d = ImageDraw.Draw(sheet)
    for i, k in enumerate(names):
        x, y = (i % cols) * w, (i // cols) * h
        f = OUT / f"{k}-s.jpg"
        if f.exists():
            im = Image.open(f); im.thumbnail((w - 6, h - 26)); sheet.paste(im, (x + 3, y + 3))
        d.text((x + 4, y + h - 20), k[:34], fill="black")
    sheet.save(ROOT / "tools/review.jpg", quality=70)


def main():
    spec = json.loads((ROOT / "photos.json").read_text())
    lock_path = ROOT / "photos.lock.json"
    lock = json.loads(lock_path.read_text()) if lock_path.exists() else {}
    OUT.mkdir(parents=True, exist_ok=True)
    used = {v["title"] for v in lock.values()}
    todo = [k for k in spec["keys"] if (k not in lock or not (OUT / f"{k}.jpg").exists()) and not spec["keys"][k].get("alias")]
    print(f"{len(todo)} photos to fetch")
    for key in todo:
        s = spec["keys"][key]
        if s.get("own"):  # one of Yellowmetal's own site photos
            save(Image.open(ROOT / "docs/img/own" / s["own"]), key)
            lock[key] = {"title": "Yellowmetal site photo", "page": "", "licence": "Own photo", "author": "Yellowmetal Plants & Equipment Ltd"}
            print(f"{key}: own photo {s['own']}")
            continue
        if s.get("alias"):  # reuse another key's photo
            continue
        try:
            for c in candidates(key, s, used)[:4]:
                try:
                    save(download(c["thumb"]), key)
                except Exception as e:  # try the next candidate
                    print("  skip", c["title"], e); continue
                lock[key] = {k: c[k] for k in ("title", "page", "licence", "author")}
                used.add(c["title"])
                print(f"{key}: {c['title']} ({c['licence']})")
                break
            else:
                print(f"{key}: NO PHOTO FOUND", file=sys.stderr)
        except Exception as e:
            print(f"{key}: error {e}", file=sys.stderr)
        lock_path.write_text(json.dumps(dict(sorted(lock.items())), indent=1, ensure_ascii=False))
        time.sleep(0.6)
    import shutil
    for key, s in spec["keys"].items():  # aliases copy their source photo once it exists
        src = s.get("alias")
        if src and (OUT / f"{src}.jpg").exists():
            for suf in ("", "-s"):
                shutil.copyfile(OUT / f"{src}{suf}.jpg", OUT / f"{key}{suf}.jpg")
            lock[key] = dict(lock.get(src, {}), alias=src)
    lock_path.write_text(json.dumps(dict(sorted(lock.items())), indent=1, ensure_ascii=False))
    review(lock, spec["keys"].keys())


if __name__ == "__main__":
    main()
