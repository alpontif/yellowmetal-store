# yellowmetal.store

Storefront for **Yellowmetal Plants & Equipment Ltd**: hire, buy or list heavy equipment in Nigeria. Every request ends in a pre-written WhatsApp chat.

Prices come from the **[Buildocrat Nigeria Construction Rate Book](https://rates.buildocrat.store/)** (repo `alpontif/buildocrat-rate-book`). When the rate book's weekly refresh lands, this site picks it up on its next daily build. Nothing here needs editing by hand.

## How it works

| Step | File | What it does |
|---|---|---|
| 1 | `tools/sync.py` | Downloads `rate-data.json`, the equipment categories and `engine.js` from the rate book |
| 2 | `tools/photos.py` | Fetches one openly licensed photo per machine type from Wikimedia Commons (only ones not yet fetched) |
| 3 | `build.mjs` | Builds `docs/`: one pre-rendered page per route (378 pages), sitemap, robots, structured data |
| — | `.github/workflows/build.yml` | Runs 1–3 on every push and daily at 07:15 Lagos time, then commits the result |

GitHub Pages serves `docs/` at `yellowmetal.store`.

## Things you might change

- **WhatsApp number, email, Google Analytics:** `site-config.json`
- **Your own machines (Yellowmetal fleet):** `fleet.json`. Put photos in `docs/img/own/`, set `rateRef` to the rate-book code whose rates apply.
- **A photo you don't like:** in `photos.json`, give that key a new `q` (search words), a `pin` (exact Commons file name), an `own` photo or an `alias` to another key. Delete the key from `photos.lock.json` and push. `tools/review.jpg` shows every photo on one sheet.
- **Design and copy:** `src/style.css` and `src/app.js`

## Run locally

```
python3 tools/sync.py && python3 tools/photos.py && node build.mjs
cd docs && python3 -m http.server 8000
```

## One-time setup (GitHub Pages and domain)

1. Repo **Settings → Pages → Deploy from a branch**, branch `main`, folder `/docs`. Save.
2. **Custom domain:** `yellowmetal.store`. Save. The `docs/CNAME` file is already in place.
3. At your DNS provider for `yellowmetal.store`, add four **A** records on `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Add a **CNAME** record `www` → `alpontif.github.io`.
4. Once DNS resolves, tick **Enforce HTTPS**.
5. **Settings → Actions → General → Workflow permissions:** choose *Read and write*, so the daily build can commit.

## Search engines, AI assistants and the installable app

Built automatically by `build.mjs` on every build:

| File | Purpose |
|---|---|
| `docs/sitemap.xml` | Every page with last-updated date and photo, for Google and Bing |
| `docs/robots.txt` | Lets search engines and AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot and others) read everything |
| `docs/llms.txt`, `docs/llms-full.txt` | Plain-text summaries AI assistants use to describe and cite Yellowmetal, with key prices and links |
| `docs/data/*.csv`, `docs/data/catalog.json` | Every rate as downloadable data (linked from /data/) |
| `docs/feed.xml` | Atom feed of rate updates |
| Structured data in each page | Organization and LocalBusiness, WebSite search, Breadcrumbs, Product (buy), Service with daily price (hire), ItemList (categories), FAQ, Dataset |
| `docs/manifest.webmanifest`, `docs/sw.js`, `docs/icons/` | Installable app with offline pages; "Install app" button appears on supported phones and computers |
| IndexNow | After each build the workflow tells Bing and other IndexNow engines that pages changed (`tools/indexnow.py`) |

### One-time: register with Google and Bing (after the site is live)
1. **Google Search Console** (search.google.com/search-console): add property `https://yellowmetal.store`, choose the **HTML tag** method, copy only the `content="..."` value into `google_site_verification` in `site-config.json`, push, then click Verify. Submit `https://yellowmetal.store/sitemap.xml` under Sitemaps.
2. **Bing Webmaster Tools** (bing.com/webmasters): sign in, choose **Import from Google Search Console** (fastest) or use the meta-tag method with `bing_site_verification`. Submit the sitemap. Bing also feeds ChatGPT search and Microsoft Copilot.
3. Optional: add the GA4 Measurement ID to `ga4_measurement_id` to track visits and WhatsApp clicks.
