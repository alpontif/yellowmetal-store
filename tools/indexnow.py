"""Tell IndexNow search engines (Bing, Yandex, Seznam, Naver; Bing also feeds ChatGPT and Copilot search)
that the site changed. Submits every URL in docs/sitemap.xml. Failures are reported, never fatal."""
import json, pathlib, re, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
cfg = json.loads((ROOT / "site-config.json").read_text())
key, host = cfg.get("indexnow_key"), cfg["domain"]
urls = re.findall(r"<loc>(.*?)</loc>", (ROOT / "docs/sitemap.xml").read_text(encoding="utf-8"))
body = json.dumps({"host": host, "key": key, "keyLocation": f"https://{host}/{key}.txt", "urlList": urls[:10000]}).encode()
req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, headers={"Content-Type": "application/json; charset=utf-8"})
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print("IndexNow:", r.status, f"({len(urls)} URLs)")
except Exception as e:
    print("IndexNow not sent:", e)
