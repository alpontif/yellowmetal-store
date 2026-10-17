// Builds yellowmetal.store into docs/ from the Buildocrat Rate Book data.
// Run: node build.mjs            (after python3 tools/sync.py)
// Output: one static, pre-rendered page per route + assets + sitemap. Also writes preview/artifact.html.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const require = createRequire(import.meta.url);
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const json = f => JSON.parse(read(f));
const DOCS = path.join(ROOT, "docs");

const cfg = Object.assign({ defaultLocation: "Lagos" }, json("site-config.json"));
const D = json("data/rate-data.json");
const CATS = json("data/equip-cats.json");
const PH = json("photos.json");
const LOCK = fs.existsSync(path.join(ROOT, "photos.lock.json")) ? json("photos.lock.json") : {};
const FLEET = json("fleet.json");
const { buildEngine } = require("./src/engine.js");
const X = fs.existsSync(path.join(ROOT, "data/extras.json")) ? json("data/extras.json") : { hire: [], buy: [] };
const SECTIONS = fs.existsSync(path.join(ROOT, "sections.json")) ? json("sections.json") : {};

/* Yellowmetal lines the rate book does not price yet: injected in rate-book format so the same engine prices them */
const P0 = {}; D.plant.forEach(p => P0[p.c] = p);
const EXTRA = new Set();
X.hire.forEach(x => {
  const b = x.base ? P0[x.base] : null;
  const dry = b ? Math.round(b.dry * x.f) : x.dry, lo = b ? Math.round(b.lo * x.f) : x.lo, hi = b ? Math.round(b.hi * x.f) : x.hi;
  D.plant.push({ c: x.c, g: x.g, d: x.d, u: x.u, dry, lo, hi, fuel: x.lpd ? "M-FUE-01" : null, lpd: x.lpd || 0, op: x.op || null, out: x.out || "", src: x.src, set: D.meta.updated, conf: x.conf || "LOW" });
  EXTRA.add(x.c);
});
const SUMS = [];
X.buy.forEach(x => {
  const g = "Equipment for Sale: Yellowmetal";
  if (x.sum) { SUMS.push(x); EXTRA.add(x.c); return; }
  const r = { c: x.c, g, d: x.d, u: x.u || "nr", src: x.src, conf: x.conf || "LOW", set: D.meta.updated, ev: x.ev || D.meta.updated };
  if (x.base) r.k = { b: x.base, f: x.f, s: x.s || 0.15 };
  else if (x.usd) r.k = { b: "M-FX-USD", f: x.usd * (x.lf || 1.4), s: x.s || 0.2 };
  else Object.assign(r, { r: x.r, lo: x.lo ?? x.r * 0.85, hi: x.hi ?? x.r * 1.15 });
  D.resources.push(r); EXTRA.add(x.c);
});
const E = buildEngine(D);
SUMS.forEach(x => {
  const v = w => x.sum.reduce((a, [c, q]) => a + E.rate(c, w) * q, 0);
  const r = v("r");
  const res = { c: x.c, g: "Equipment for Sale: Yellowmetal", d: x.d, u: x.u || "nr", r: Math.round(r), lo: Math.round(r * (1 - (x.s || 0.12))), hi: Math.round(r * (1 + (x.s || 0.12))), src: x.src, conf: x.conf || "LOW", ev: D.meta.updated, set: D.meta.updated };
  D.resources.push(res); E.R[x.c] = Object.assign({ kind: "M" }, res);
});
const XCAT = {}; [...X.buy].forEach(x => XCAT[x.c] = x.cat);

/* ---------- catalogue ---------- */
const slugify = s => s.toLowerCase().replace(/[″"]/g, "-inch").replace(/m3/g, "m3").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-").slice(0, 80).replace(/-+$/, "");
const photoKey = d => { for (const [rx, k] of PH.rules) if (new RegExp(rx, "i").test(d)) return k; return null; };
const hasPhoto = k => fs.existsSync(path.join(DOCS, "img/m", `${k}-s.jpg`));

const GROUPS = {
  "Earthmoving": ["earthmoving", "Excavators, backhoes, loaders, dozers and graders for digging, loading and shaping ground."],
  "Compaction": ["compaction", "Rollers, plate compactors and rammers for fill, sub-base and asphalt."],
  "Haulage & Vehicles": ["haulage-vehicles", "Tippers, tankers, bowsers, trailers, low-bed mobilisation and site vehicles."],
  "Lifting & Access": ["lifting-access", "Mobile and tower cranes, Hiabs, forklifts, telehandlers, hoists and scaffolding."],
  "Concrete": ["concrete", "Mixers, batching plants, transit mixers, pumps, vibrators and finishing tools."],
  "Power, Air & Pumping": ["power-air-pumping", "Generators from 5 to 250 kVA, welding sets, compressors and dewatering pumps."],
  "Roads": ["roads", "Pavers, bitumen sprayers, chip spreaders, brooms, milling and line marking."],
  "Piling & Marine": ["piling-marine", "Bored piling rigs, cutter-suction dredgers, swamp buggies and work boats."],
  "Survey & Site Facilities": ["survey-site-facilities", "Total stations, levels, GNSS kits, drone surveys, site offices and toilets."],
  "Piling Plant": ["piling-plant", "Impact and vibratory hammers, CFA, micropile and wick-drain rigs."],
  "Heavy Lifting": ["heavy-lifting", "100 to 200 tonne crawler cranes and prime movers with heavy trailers."],
  "Marine & Dredging Fleet": ["marine-dredging-fleet", "Crane barges, tugs, spud and flat-top barges, hopper and cutter dredgers."],
  "Pipeline Spread": ["pipeline-spread", "Sidebooms, bending machines, HDD rigs, trenchers and pipeline testing kit."],
  "Roads & Quarry Plant": ["roads-quarry-plant", "Articulated trucks, scrapers, asphalt and crushing plants, slipform pavers, rock drills."],
  "Rail Plant": ["rail-plant", "Ballast tamping, rail welding and grinding."],
  "Access & Small Plant": ["access-small-plant", "Lighting towers, boom and scissor lifts, large generators, compressors and small tools."]
};
const LOWBED_GROUPS = new Set(["earthmoving", "compaction", "piling-marine", "piling-plant", "heavy-lifting", "pipeline-spread", "roads", "roads-quarry-plant", "rail-plant"]);
const SELF_DRIVE = /truck|tanker|bowser|pickup|bus|trailer|prime mover|mobile crane|hiab|plate|rammer|boat|barge|tug|dredger|hopper/i;

const R = {}; D.resources.forEach(r => R[r.c] = r);
const LAB = {}; D.labour.forEach(l => LAB[l.c] = l);
const diesel = E.rate("M-FUE-01");
const usedIds = new Set();
const uid = base => { let id = base, n = 2; while (usedIds.has(id)) id = `${base}-${n++}`; usedIds.add(id); return id; };

const hire = D.plant.map(p => {
  const g = GROUPS[p.g]; if (!g) throw new Error("Unknown plant group " + p.g);
  const parts = E.plantParts(E.R[p.c]);
  const ph = photoKey(p.d);
  return {
    id: uid(slugify(p.d)), c: p.c, d: p.d, g: g[0], u: p.u,
    dry: parts.dry, lo: p.lo, hi: p.hi, lpd: p.fuel ? p.lpd : 0, fuel: Math.round(parts.fuel), op: Math.round(parts.op),
    opn: p.op ? LAB[p.op].d : "", out: /^[-–\s]*$/.test(p.out || "") ? "" : p.out, conf: p.conf, set: p.set || "", ph,
    lb: LOWBED_GROUPS.has(g[0]) && !SELF_DRIVE.test(p.d) && p.dry >= 100000 && p.u === "day",
    x: EXTRA.has(p.c) ? 1 : 0, src: EXTRA.has(p.c) ? p.src : undefined,
    s: [p.d, p.c, p.g, PH.keys[ph]?.label || "", p.out || ""].join(" ").toLowerCase()
  };
});
const catOf = {}; CATS.forEach(c => c.codes.forEach(code => catOf[code] = c.slug));
Object.assign(catOf, XCAT);
D.resources.filter(r => r.c.startsWith("M-TL")).forEach(r => catOf[r.c] = "small-tools");
CATS.push({ slug: "small-tools", name: "Small tools & site kit", h1: "Price of construction tools and small equipment in Nigeria", q: "How much are construction tools in Nigeria?", primary: "M-TL-WBAR",
  codes: D.resources.filter(r => r.c.startsWith("M-TL")).map(r => r.c),
  drivers: "Hand tools vary widely by brand and origin; cheap imports wear out fast on site, so price the durable grade for long jobs. Power tools and small machines follow the exchange rate." });
const cond = d => /\bnew\b/i.test(d) ? "New" : /foreign used/i.test(d) ? "Tokunbo" : /nigerian used/i.test(d) ? "Nigerian used" : /\bused\b/i.test(d) ? "Used" : "";
const EXCLUDE = fs.existsSync(path.join(ROOT, "catalog.json")) ? json("catalog.json").excludeBuy || {} : {};
const buy = D.resources.filter(r => catOf[r.c] && !EXCLUDE[r.c]).map(r => {
  const ph = photoKey(r.d), c = cond(r.d);
  return {
    id: uid(slugify(r.d)), c: r.c, d: r.d, cat: catOf[r.c], u: r.u,
    r: Math.round(E.rate(r.c)), lo: Math.round(E.rate(r.c, "lo")), hi: Math.round(E.rate(r.c, "hi")), pr: r.pr || null,
    conf: r.conf, ev: r.ev || r.set || "", der: !!r.k, cond: c === "Used" ? "Nigerian used" : c, ph,
    x: EXTRA.has(r.c) ? 1 : 0, src: EXTRA.has(r.c) ? r.src : undefined,
    s: [r.d, r.c, r.g, PH.keys[ph]?.label || "", c === "Tokunbo" ? "tokunbo foreign used" : c].join(" ").toLowerCase()
  };
});
[...hire, ...buy].forEach(i => { if (!i.ph) throw new Error("No photo rule for " + i.d); });

const firstPhoto = list => (list.find(i => hasPhoto(i.ph)) || list[0]).ph;
const hireGroups = Object.values(GROUPS).map(([slug, blurb]) => {
  const items = hire.filter(i => i.g === slug);
  const name = Object.keys(GROUPS).find(k => GROUPS[k][0] === slug);
  return { slug, name, blurb, n: items.length, from: Math.min(...items.map(i => i.dry + i.fuel + i.op)), ph: firstPhoto(items) };
}).filter(g => g.n);
const GROUP_PHOTO = { "earthmoving": "excavator", "lifting-access": "truck-crane", "haulage-vehicles": "tipper-truck", "concrete": "transit-mixer", "power-air-pumping": "generator", "roads": "asphalt-paver", "piling-marine": "piling-rig", "heavy-lifting": "crawler-crane", "marine-dredging-fleet": "crane-barge", "roads-quarry-plant": "rigid-dump-truck", "compaction": "vibratory-roller" };
hireGroups.forEach(g => { const k = GROUP_PHOTO[g.slug]; if (k && hasPhoto(k)) g.ph = k; });
const buyCats = CATS.map(c => {
  const items = buy.filter(i => i.cat === c.slug);
  const pr = buy.find(i => i.c === c.primary);
  return { slug: c.slug, name: c.name, h1: c.h1, q: c.q, drivers: c.drivers, primary: pr ? c.primary : items[0].c, n: items.length, from: Math.min(...items.map(i => i.r)), ph: pr && hasPhoto(pr.ph) ? pr.ph : firstPhoto(items) };
});
/* specialist sections: curated hire + buy collections */
const byC = {}; [...hire, ...buy].forEach(i => byC[(i.cat ? "b:" : "h:") + i.c] = i);
const sections = Object.entries(SECTIONS).map(([slug, s]) => {
  const usedB = new Set(s.groups.flatMap(g => g.buy.filter(c => !c.startsWith("@"))));
  const groups = s.groups.map(g => {
    const hireIds = g.hire.map(c => byC["h:" + c]).filter(Boolean).map(i => i.id);
    let buyCodes = g.buy.flatMap(c => c === "@M-TL-rest" ? buy.filter(b => b.c.startsWith("M-TL") && !usedB.has(b.c)).map(b => b.c) : [c]);
    const buyIds = buyCodes.map(c => byC["b:" + c]).filter(Boolean).map(i => i.id);
    [...g.hire.map(c => "h:" + c), ...buyCodes.map(c => "b:" + c)].forEach(k => { if (!byC[k]) console.warn(`sections.json: ${slug} refers to unknown ${k}`); });
    return { name: g.name, blurb: g.blurb, slug: slugify(g.name), hire: hireIds, buy: buyIds };
  });
  const all = groups.flatMap(g => [...g.hire.map(id => hire.find(h => h.id === id)), ...g.buy.map(id => buy.find(b => b.id === id))]);
  const ph = hasPhoto(s.ph) ? s.ph : (all.find(i => hasPhoto(i.ph)) || all[0]).ph;
  return { slug, name: s.name, h1: s.h1, intro: s.intro, ph, groups, n: all.length };
});
const photos = {}, photoLabels = {}, credits = {};
Object.entries(PH.keys).forEach(([k, v]) => { photoLabels[k] = v.label; if (hasPhoto(k)) photos[k] = 1; if (LOCK[k] && LOCK[k].page) credits[k] = LOCK[k]; });

const YM = {
  cfg, hire, buy, hireGroups, buyCats, sections, fleet: FLEET, photos, photoLabels, credits,
  meta: {
    updated: D.meta.updated, fx: D.meta.fx, diesel, lube: D.params.lube, vat: D.params.vat, dpm: D.params.dpm,
    lowbed: E.plantParts(E.R["P-LOW"]).total, locations: D.locations
  }
};

/* ---------- render ---------- */
const appSrc = read("src/app.js");
const css = read("src/style.css");
const ctx = { YM, __PRERENDER: true, URLSearchParams, console, Math, Date, JSON };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(appSrc, ctx);
const route = (p, q) => ctx.YMApp.route(p, q);

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const origin = `https://${cfg.domain}`;
const abs = p => origin + p;
const ver = Date.now().toString(36);
const link = (p, mode) => mode === "hash" ? "#" + p : p;
const LOGO = `<span class="logo-mark"><svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 5h6l6 9 6-9h6l-9 13v9h-6v-9z" fill="#0B1A2C"/></svg></span><span class="logo-word">YELLOWMETAL<small>PLANTS &amp; EQUIPMENT</small></span>`;
const WA = `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.06c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34h.52c.17 0 .39-.06.61.47.24.56.79 1.93.86 2.07.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.17 1.34Z"/></svg>`;

function chrome(main, mode) {
  const L = p => link(p, mode);
  return `<header class="top"><div class="wrap">
    <a class="logo" href="${L("/")}" aria-label="Yellowmetal home">${LOGO}</a>
    <nav class="nav" id="nav" aria-label="Main">
      <a href="${L("/hire/")}" data-nav="/hire">Hire</a><a href="${L("/buy/")}" data-nav="/buy">Buy</a>
      ${sections.map(s => `<a href="${L(`/${s.slug}/`)}" data-nav="/${s.slug}">${esc(s.name)}</a>`).join("")}
      <a href="${L("/list/")}" data-nav="/list">List your machine</a><a class="nav-more" href="${L("/source/")}" data-nav="/source">Source a machine</a><a class="nav-more" href="${L("/how/")}" data-nav="/how">How it works</a>
    </nav>
    <div class="top-right">
      <a class="chip-btn" href="${L("/search/")}" aria-label="Search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></a>
      <a class="chip-btn" href="${L("/shortlist/")}" aria-label="Shortlist"><span class="hide-sm">Shortlist</span><span class="count num" id="slCount">0</span></a>
      <a class="chip-btn hide-sm" href="${L("/requests/")}">My requests</a>
      <button class="menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="nav"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h16M4 16h16"/></svg></button>
    </div></div></header>
  <main id="app" tabindex="-1">${main}</main>
  <footer><div class="wrap"><div class="cols">
    <div><a class="logo" href="${L("/")}">${LOGO}</a><p style="margin:14px 0 0;max-width:360px">${esc(cfg.company)} hires, sells and manages heavy equipment from ${esc(cfg.address)}, for sites across Nigeria.</p></div>
    <div><h5>Specialist desks</h5>${sections.map(s => `<a href="${L(`/${s.slug}/`)}">${esc(s.name)}</a>`).join("")}<a href="${L("/source/")}">Source a machine</a><a href="${L("/how/")}">How it works</a></div>
    <div><h5>Hire</h5>${hireGroups.slice(0, 6).map(g => `<a href="${L(`/hire/${g.slug}/`)}">${esc(g.name)}</a>`).join("")}<a href="${L("/hire/")}">All hire rates</a></div>
    <div><h5>Buy</h5>${buyCats.slice(0, 6).map(c => `<a href="${L(`/buy/${c.slug}/`)}">${esc(c.name)}</a>`).join("")}<a href="${L("/buy/")}">All equipment prices</a></div>
    <div><h5>Contact</h5><a href="https://wa.me/${cfg.whatsapp}" target="_blank" rel="noopener">WhatsApp ${esc(cfg.displayPhone)}</a><div style="padding:4px 0">Email <span class="sel">${esc(cfg.email)}</span></div><div style="padding:4px 0">${esc(cfg.address)}, Nigeria</div><a href="${L("/list/")}">List your machine</a><a href="${L("/requests/")}">My requests</a><a href="${L("/credits/")}">Photo credits</a></div>
  </div><div class="legal"><span>© ${new Date().getFullYear()} ${esc(cfg.company)} · ${esc(cfg.rc)}</span><span>Rates from the <a href="https://rates.buildocrat.store/" style="display:inline" target="_blank" rel="noopener">Buildocrat Rate Book</a>, updated ${esc(D.meta.updated)}. We only take payment into our corporate account, after a proforma invoice.</span></div></div></footer>
  <a class="fab" id="fab" href="https://wa.me/${cfg.whatsapp}" target="_blank" rel="noopener" aria-label="Chat with Yellowmetal on WhatsApp">${WA}<span>Chat with us</span></a>
  <div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle" hidden><div class="modal-box">
    <div class="modal-top"><code id="mRef"></code><h3 id="mTitle">Send this on WhatsApp</h3><p>Your request is written out below. Open WhatsApp and tap send. We reply with availability, a proforma invoice and payment details.</p></div>
    <div class="modal-body"><div class="chat"><div class="bubble" id="mMsg"></div></div>
      <div class="modal-actions"><a class="btn btn-wa btn-lg" id="mOpen" href="#" target="_blank" rel="noopener">${WA.replace(/26/g, "20")} Open WhatsApp</a><button class="btn btn-ghost" id="mCopy" type="button">Copy message</button><button class="btn btn-ghost" id="mClose" type="button">Close</button></div></div>
  </div></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

function jsonld(p, v) {
  const out = [];
  const org = { "@context": "https://schema.org", "@type": "Organization", name: cfg.company, url: origin, email: cfg.email, telephone: cfg.displayPhone, address: { "@type": "PostalAddress", addressLocality: "Festac Town, Lagos", addressCountry: "NG" } };
  if (p === "/") out.push(org, { "@context": "https://schema.org", "@type": "WebSite", name: "Yellowmetal", url: origin, potentialAction: { "@type": "SearchAction", target: `${origin}/search/?q={q}`, "query-input": "required name=q" } });
  const segs = p.split("/").filter(Boolean);
  if (segs.length) {
    const items = [{ name: "Home", item: origin + "/" }];
    if (segs[0] === "hire" || segs[0] === "buy") items.push({ name: segs[0] === "hire" ? "Hire" : "Buy", item: abs(`/${segs[0]}/`) });
    if (segs[1] && segs[0] === "hire" && hireGroups.find(g => g.slug === segs[1])) items.push({ name: hireGroups.find(g => g.slug === segs[1]).name, item: abs(`/hire/${segs[1]}/`) });
    if (segs[1] && segs[0] === "buy" && buyCats.find(c => c.slug === segs[1])) items.push({ name: buyCats.find(c => c.slug === segs[1]).name, item: abs(`/buy/${segs[1]}/`) });
    if (v.item) items.push({ name: v.item.d, item: abs(p) });
    out.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((x, n) => ({ "@type": "ListItem", position: n + 1, ...x })) });
  }
  if (v.kind === "buy") out.push({ "@context": "https://schema.org", "@type": "Product", name: v.item.d, category: buyCats.find(c => c.slug === v.item.cat).name, image: v.og ? abs(v.og) : undefined, itemCondition: v.item.cond === "New" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition", offers: { "@type": "AggregateOffer", priceCurrency: "NGN", lowPrice: v.item.lo, highPrice: v.item.hi, offerCount: 1, seller: { "@type": "Organization", name: cfg.company } } });
  if (v.kind === "hire") out.push({ "@context": "https://schema.org", "@type": "Service", serviceType: "Equipment rental", name: `${v.fleet ? v.fleet.name : v.item.d} hire`, provider: { "@type": "Organization", name: cfg.company }, areaServed: "NG", offers: { "@type": "Offer", priceCurrency: "NGN", price: Math.round((v.item.dry + v.item.fuel + v.item.op) * D.locations.find(l => l[0] === cfg.defaultLocation)[3]), unitText: "DAY" } });
  if (v.faq) out.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: v.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  return out.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");
}

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">`;
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#F5B800"/><path d="M8 9h4l4 6 4-6h4l-6 9v5h-4v-5z" fill="#0B1A2C"/></svg>`;
const GA = cfg.ga4_measurement_id ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${cfg.ga4_measurement_id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${cfg.ga4_measurement_id}');</script>` : "";

function page(p, v) {
  const canonical = abs(p);
  const og = v.og ? abs(v.og) : abs("/img/og.jpg");
  return `<!doctype html>
<html lang="en-NG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(v.title)}</title>
<meta name="description" content="${esc(v.desc)}">
${v.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`}
<meta name="theme-color" content="#0B1A2C">
<meta property="og:type" content="website"><meta property="og:site_name" content="Yellowmetal"><meta property="og:title" content="${esc(v.title)}"><meta property="og:description" content="${esc(v.desc)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${og}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${FONTS}
<link rel="stylesheet" href="/assets/style.css?v=${ver}">
${jsonld(p, v)}
${GA}
</head>
<body>
${chrome(v.html, "path")}
<script src="/assets/data.js?v=${ver}"></script>
<script src="/assets/app.js?v=${ver}"></script>
</body>
</html>
`;
}

/* ---------- write ---------- */
const routes = ["/", "/hire/", "/buy/", "/list/", "/source/", "/how/", "/shortlist/", "/requests/", "/search/", "/credits/", ...sections.map(s => `/${s.slug}/`)];
hireGroups.forEach(g => routes.push(`/hire/${g.slug}/`));
hire.forEach(i => routes.push(`/hire/${i.g}/${i.id}/`));
buyCats.forEach(c => routes.push(`/buy/${c.slug}/`));
buy.forEach(i => routes.push(`/buy/${i.cat}/${i.id}/`));
FLEET.forEach(f => routes.push(`/fleet/${f.id}/`));

// clear previous generated pages but keep images, CNAME and verification files
for (const d of [...sections.map(s => s.slug), "hire", "buy", "fleet", "list", "source", "how", "shortlist", "requests", "search", "credits", "assets"]) fs.rmSync(path.join(DOCS, d), { recursive: true, force: true });
fs.mkdirSync(path.join(DOCS, "assets"), { recursive: true });
fs.writeFileSync(path.join(DOCS, "assets/style.css"), css);
fs.writeFileSync(path.join(DOCS, "assets/app.js"), appSrc);
fs.writeFileSync(path.join(DOCS, "assets/data.js"), "window.YM=" + JSON.stringify(YM) + ";");
fs.writeFileSync(path.join(DOCS, "favicon.svg"), ICON_SVG);
fs.writeFileSync(path.join(DOCS, "CNAME"), cfg.domain + "\n");
fs.writeFileSync(path.join(DOCS, ".nojekyll"), "");

const sitemap = [];
for (const p of routes) {
  const [pp, q] = p.split("?");
  const v = route(pp, q || "");
  const file = path.join(DOCS, pp, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(pp, v));
  if (!v.noindex && v.status !== 404) sitemap.push(abs(pp));
}
fs.writeFileSync(path.join(DOCS, "404.html"), page("/404/", route("/__missing__", "")).replace(/<link rel="canonical"[^>]*>/, '<meta name="robots" content="noindex">'));
fs.writeFileSync(path.join(DOCS, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map(u => `<url><loc>${u}</loc><lastmod>${D.meta.updated}</lastmod></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(DOCS, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /search/\nDisallow: /shortlist/\nDisallow: /requests/\n\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync(path.join(DOCS, "llms.txt"), `# Yellowmetal (${cfg.domain})\n\n${cfg.company} hires, sells and manages heavy construction equipment in Nigeria from ${cfg.address}. Rates come from the Buildocrat Nigeria Construction Rate Book (rates.buildocrat.store), updated ${D.meta.updated}. Requests close on WhatsApp ${cfg.displayPhone}.\n\n## Hire rates (Abuja base, per day all-in = dry + fuel + operator)\n${hire.map(i => `- ${i.d}: dry ${i.dry}, all-in ${Math.round(i.dry + i.fuel + i.op)} NGN/${i.u} (${origin}/hire/${i.g}/${i.id}/)`).join("\n")}\n\n## Equipment prices (Abuja base)\n${buy.map(i => `- ${i.d}: ${i.r} NGN (range ${i.lo}-${i.hi}) (${origin}/buy/${i.cat}/${i.id}/)`).join("\n")}\n`);
if (!fs.existsSync(path.join(DOCS, "img/og.jpg"))) fs.copyFileSync(path.join(DOCS, "img/own/loader-1.jpg"), path.join(DOCS, "img/og.jpg"));

/* ---------- preview (single file, hash routing) for claude.ai ---------- */
fs.mkdirSync(path.join(ROOT, "preview"), { recursive: true });
const homeV = route("/", "");
fs.writeFileSync(path.join(ROOT, "preview/artifact.html"), `<title>Yellowmetal</title>
<meta name="claude:viewport-fit-sides" content="cover">
${FONTS}
<style>${css}</style>
${chrome(homeV.html, "hash")}
<script>window.YM_MODE="hash";</script>
<script src="assets/data.js"></script>
<script src="assets/app.js"></script>
`);
console.log(`Built ${routes.length} pages: ${hire.length} hire, ${buy.length} buy, ${sections.length} sections, ${EXTRA.size} Yellowmetal lines, ${hireGroups.length} hire groups, ${buyCats.length} buy categories, ${Object.keys(photos).length}/${Object.keys(PH.keys).length} photos. Rates ${D.meta.updated}.`);
