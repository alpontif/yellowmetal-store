/* Yellowmetal storefront — one codebase, two jobs:
   1. In the browser: renders every view, handles forms, ends every flow in WhatsApp.
   2. At build time (build.mjs, in Node): pre-renders each page so search engines see full content.
   Data comes from window.YM, generated from the Buildocrat Rate Book by build.mjs. */
(function (root) {
"use strict";
const Y = root.YM;
const CFG = Y.cfg;
const IS_BROWSER = typeof document !== "undefined" && !root.__PRERENDER;
const MODE = root.YM_MODE || "path";            // "path" on yellowmetal.store, "hash" in previews
const BASE = (CFG.base || "/").replace(/\/?$/, "/");

/* ---------------- helpers ---------------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {
  get(k, d) { try { const v = root.localStorage && localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const N = n => n == null || isNaN(n) ? "–" : "₦" + Math.round(n).toLocaleString("en-NG");
const NS = n => {
  if (n == null || isNaN(n)) return "–";
  if (n >= 1e9) return "₦" + (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "bn";
  if (n >= 1e6) return "₦" + (n / 1e6).toFixed(n >= 1e8 ? 0 : 1).replace(/\.0$/, "") + "m";
  if (n >= 1e3) return "₦" + Math.round(n / 1e3) + "k";
  return "₦" + Math.round(n);
};
const dateLong = iso => { const d = new Date(iso + "T12:00:00Z"); return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); };
const link = p => MODE === "hash" ? "#" + p : BASE + p.replace(/^\//, "");
const ASSET = MODE === "hash" ? "" : BASE;
const img = (key, small) => Y.photos[key] ? `${ASSET}img/m/${key}${small ? "-s" : ""}.jpg` : null;
const own = f => `${ASSET}img/own/${f}`;
const ICON = {
  wa: s => `<svg width="${s||20}" height="${s||20}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.06c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34h.52c.17 0 .39-.06.61.47.24.56.79 1.93.86 2.07.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.17 1.34Z"/></svg>`,
  star: on => `<svg viewBox="0 0 24 24" width="18" height="18" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>`,
  arrow: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  check: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  grid: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  table: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 5h18M3 12h18M3 19h18"/></svg>`,
  video: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  x: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`
};

/* ---------------- data access ---------------- */
const H = {}; Y.hire.forEach(i => H[i.id] = i);
const B = {}; Y.buy.forEach(i => B[i.id] = i);
const HG = {}; Y.hireGroups.forEach(g => HG[g.slug] = g);
const BC = {}; Y.buyCats.forEach(c => BC[c.slug] = c);
const F = {}; Y.fleet.forEach(f => F[f.id] = f);
const SEC = {}; (Y.sections || []).forEach(s => SEC[s.slug] = s);
const estChip = i => i.x ? `<span class="xchip" title="${esc(i.src || "")}">Yellowmetal estimate</span>` : "";
const byCode = {}; Y.hire.forEach(i => byCode[i.c] = i); Y.buy.forEach(i => byCode[i.c] = i);
const LOCS = Y.meta.locations;
const state = { loc: store.get("ym-loc", CFG.defaultLocation || "Lagos"), view: store.get("ym-view", "grid") };
if (!LOCS.some(l => l[0] === state.loc)) state.loc = LOCS[0][0];
const lf = () => { const l = LOCS.find(x => x[0] === state.loc) || LOCS[0]; return { m: l[1], l: l[2], p: l[3] }; };
const hireParts = (i, f = lf()) => ({ dry: i.dry * f.p, lo: i.lo * f.p, hi: i.hi * f.p, fuel: i.fuel * f.p, op: i.op * f.p, all: (i.dry + i.fuel + i.op) * f.p });
const buyPrice = (i, f = lf()) => ({ r: i.r * f.m, lo: i.lo * f.m, hi: i.hi * f.m, pr: i.pr ? i.pr * f.m : null });
const hireHref = i => link(`/hire/${i.g}/${i.id}/`);
const buyHref = i => link(`/buy/${i.cat}/${i.id}/`);
const confLabel = c => ({ HIGH: "High", MEDIUM: "Medium", LOW: "Low" }[c] || c || "–");
const photoBox = (key, alt, small, extra = "") => {
  const src = img(key, small);
  const label = Y.photoLabels[key] || "";
  return src ? `<img src="${src}" alt="${esc(alt)}" loading="lazy" decoding="async"${extra}>` : `<span class="ph-fallback" role="img" aria-label="${esc(alt)}"><b>${esc(label)}</b><small>Photo of the actual unit on request</small></span>`;
};

/* shortlist: entries "h:<id>" for hire, "b:<id>" for buy, "f:<id>" for fleet */
let shortlist = store.get("ym-shortlist", []).filter(k => resolveKey(k));
function resolveKey(k) { const [t, id] = k.split(":"); return t === "h" ? H[id] : t === "b" ? B[id] : t === "f" ? F[id] : null; }
const starBtn = (key, label) => { const on = shortlist.includes(key); return `<button type="button" class="star ${on ? "on" : ""}" data-star="${key}" aria-pressed="${on}" aria-label="Save ${esc(label)} to shortlist">${ICON.star(on)}</button>`; };

/* ---------------- shared bits ---------------- */
const locSelect = (id = "loc") => `<label class="loc"><span>Prices for</span><select id="${id}" data-loc>${LOCS.map(l => `<option ${l[0] === state.loc ? "selected" : ""}>${esc(l[0])}</option>`).join("")}</select></label>`;
const confChip = c => `<span class="conf conf-${(c || "").toLowerCase()}" title="Rate book confidence">${confLabel(c)} confidence</span>`;
const srcLine = () => `<p class="srcline">Market rates from the <a href="https://rates.buildocrat.store/" target="_blank" rel="noopener">Buildocrat Nigeria Construction Rate Book</a>, updated ${dateLong(Y.meta.updated)}. Base location Abuja; other locations use the rate book's factors. Your final price is confirmed in the WhatsApp chat.</p>`;
const crumbs = list => `<nav class="crumbs" aria-label="Breadcrumb">${list.map(([t, h], i) => h && i < list.length - 1 ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`).join('<span class="sep">/</span>')}</nav>`;

function hireCard(i) {
  const p = hireParts(i);
  return `<article class="card">
    <div class="ph-wrap"><a class="ph" href="${hireHref(i)}">${photoBox(i.ph, i.d, true)}</a>${starBtn("h:" + i.id, i.d)}</div>
    <div class="card-body">
      <div class="eyebrow">${esc(HG[i.g].name)}</div>
      <h3><a href="${hireHref(i)}">${esc(i.d)}</a></h3>
      <div class="price"><b class="num">${N(p.all)}</b><span>per ${esc(i.u)}${i.u === "trip" ? "" : " all-in"}</span>${estChip(i)}</div>
      <div class="parts num">Dry ${NS(p.dry)}${i.fuel ? ` · Fuel ${NS(p.fuel)}` : ""}${i.op ? ` · Operator ${NS(p.op)}` : ""}</div>
      ${i.out ? `<div class="meta">${esc(i.out)}</div>` : ""}
    </div>
  </article>`;
}
function buyCard(i) {
  const p = buyPrice(i);
  return `<article class="card">
    <div class="ph-wrap"><a class="ph" href="${buyHref(i)}">${photoBox(i.ph, i.d, true)}</a>${i.cond ? `<span class="tag">${esc(i.cond)}</span>` : ""}${starBtn("b:" + i.id, i.d)}</div>
    <div class="card-body">
      <div class="eyebrow">${esc(BC[i.cat].name)}</div>
      <h3><a href="${buyHref(i)}">${esc(i.d)}</a></h3>
      <div class="price"><b class="num">${N(p.r)}</b><span>per ${esc(i.u === "nr" ? "unit" : i.u)}</span>${estChip(i)}</div>
      <div class="parts num">Market range ${NS(p.lo)} – ${NS(p.hi)}</div>
    </div>
  </article>`;
}
function hireTable(items) {
  return `<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Plant</th><th class="r">Dry hire / day</th><th class="r">Range</th><th class="r">Fuel</th><th class="r">Fuel + lube</th><th class="r">Operator</th><th class="r">All-in</th><th>Typical output</th><th>Confidence</th></tr></thead>
    <tbody>${items.map(i => { const p = hireParts(i); return `<tr>
      <td><a href="${hireHref(i)}">${esc(i.d)}</a></td><td class="r num">${N(p.dry)}</td><td class="r num nowrap">${N(p.lo)} – ${N(p.hi)}</td>
      <td class="r num">${i.lpd ? i.lpd + " L" : "–"}</td><td class="r num">${N(p.fuel)}</td><td class="r num">${N(p.op)}</td>
      <td class="r num"><b>${N(p.all)}</b> / ${esc(i.u)}</td><td>${esc(i.out || "–")}</td><td>${confChip(i.conf)}</td></tr>`; }).join("")}</tbody></table></div>`;
}
function buyTable(items) {
  return `<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Item</th><th>Unit</th><th class="r">Price</th><th class="r">Range</th><th class="r">Change</th><th>Confidence</th><th>Evidence date</th></tr></thead>
    <tbody>${items.map(i => { const p = buyPrice(i); const ch = p.pr ? (p.r - p.pr) / p.pr : null; return `<tr>
      <td><a href="${buyHref(i)}">${esc(i.d)}</a></td><td>${i.u === "nr" ? "unit" : esc(i.u)}</td><td class="r num"><b>${N(p.r)}</b></td>
      <td class="r num nowrap">${N(p.lo)} – ${N(p.hi)}</td><td class="r num">${ch == null || Math.abs(ch) < 0.0005 ? "–" : `<span class="${ch > 0 ? "up" : "down"}">${ch > 0 ? "+" : ""}${(ch * 100).toFixed(1)}%</span>`}</td>
      <td>${confChip(i.conf)}</td><td class="num">${i.der ? "derived" : esc(i.ev || "–")}</td></tr>`; }).join("")}</tbody></table></div>`;
}
const viewToggle = () => `<div class="seg" role="group" aria-label="View"><button type="button" data-view="grid" class="${state.view === "grid" ? "on" : ""}" aria-pressed="${state.view === "grid"}">${ICON.grid} Cards</button><button type="button" data-view="table" class="${state.view === "table" ? "on" : ""}" aria-pressed="${state.view === "table"}">${ICON.table} Rate table</button></div>`;

/* ---------------- views ---------------- */
const V = {};

V.home = () => {
  const hero = img("excavator") || own("loader-1.jpg");
  const pick = codes => codes.map(c => byCode[c]).filter(Boolean);
  const popularHire = pick(["P-EXC20", "P-WL5", "P-DZ7", "P-TP30", "P-CRN", "P-GN100", "P-BHL", "P-ROL"]);
  const popularBuy = pick(["M-EQ-EX21U", "M-EQ-TIP30N", "M-EQ-WL50", "M-EQ-DZ26N", "M-EQ-G100", "M-EQ-BP50", "M-EQ-D12U", "M-EQ-TC25N"]);
  const fleet = Y.fleet[0];
  const fp = fleet && byCode[fleet.rateRef] ? hireParts(byCode[fleet.rateRef]) : null;
  return {
    title: "Yellowmetal · Rent, buy or list heavy equipment in Nigeria",
    desc: `Hire ${Y.hire.length} types of construction plant or buy from ${Y.buy.length} equipment lines at current Nigerian market rates. Excavators, dozers, loaders, tippers, cranes, dredgers. Every deal closes on WhatsApp.`,
    html: `
  <section class="hero">
    <div class="hero-img"><img src="${hero}" alt="" fetchpriority="high"></div>
    <div class="wrap">
      <div class="eyebrow on-dark">Heavy equipment · Lagos · Nationwide</div>
      <h1 class="display">Machines for the work <span>ahead.</span></h1>
      <p class="lead">Rent, buy or list SANY, XCMG, SDLG, Shantui, Zoomlion and HOWO machines at today's Nigerian market rates. Choose a machine and send your request. You close the deal with our team on WhatsApp.</p>
      <form class="hero-search" data-search role="search">
        <label class="sr" for="hq">Search machines</label>
        ${ICON.search}<input id="hq" name="q" placeholder="Try “20 tonne excavator”, “Howo tipper” or “250kVA”" autocomplete="off">
        <button class="btn btn-accent" type="submit">Search</button>
      </form>
      <div class="intent">
        <a class="primary" href="${link("/hire/")}"><i>${ICON.arrow}</i><span><b>Hire equipment</b><small>${Y.hire.length} machine types, rate per day</small></span></a>
        <a href="${link("/buy/")}"><i>${ICON.arrow}</i><span><b>Buy equipment</b><small>${Y.buy.length} lines, new and tokunbo</small></span></a>
        <a href="${link("/list/")}"><i>${ICON.arrow}</i><span><b>List your machine</b><small>We find clients and pay you</small></span></a>
      </div>
    </div>
  </section>
  <div class="ribbon"><div class="wrap">
    <span><b>Rates updated ${dateLong(Y.meta.updated)}</b></span>
    <span>Diesel <b class="num">${N(Y.meta.diesel)}/L</b></span>
    <span>US$1 = <b class="num">${N(Y.meta.fx)}</b></span>
    <span>Source: <a href="https://rates.buildocrat.store/" target="_blank" rel="noopener">Buildocrat Rate Book</a></span>
  </div></div>

  ${Y.sections && Y.sections.length ? `<section class="block desks-wrap"><div class="wrap">
    <div class="sec-head"><div><div class="eyebrow">Specialist desks</div><h2>Haulage, concrete, tools and survey</h2><p>Three desks for the jobs that need more than one machine: hire and buy side by side, priced the same way.</p></div></div>
    <div class="desks">${Y.sections.map((s, n) => `<a class="desk d${n}" href="${link(`/${s.slug}/`)}">${photoBox(s.ph, "", n !== 0)}<span><small>${s.n} priced lines</small><b>${esc(s.name)}</b><em>${esc(s.groups.map(g => g.name).join(" · "))}</em></span></a>`).join("")}</div>
  </div></section>` : ""}

  <section class="block"><div class="wrap">
    <div class="sec-head"><div><div class="eyebrow">Hire · ${Y.hireGroups.length} plant groups</div><h2>Hire by the day, week or month</h2><p>Every rate is broken down into dry hire, fuel and operator, the same way the rate book prices it.</p></div><a class="btn btn-ghost" href="${link("/hire/")}">All hire rates</a></div>
    <div class="tiles">${Y.hireGroups.map(g => `<a class="tile" href="${link(`/hire/${g.slug}/`)}">${photoBox(g.ph, "", true)}<span><b>${esc(g.name)}</b><small>${g.n} types · from ${NS(g.from * lf().p)}/day</small></span></a>`).join("")}</div>
  </div></section>

  <section class="block tint"><div class="wrap">
    <div class="sec-head"><div><div class="eyebrow">Most requested</div><h2>Popular for hire this week</h2></div></div>
    <div class="grid">${popularHire.map(hireCard).join("")}</div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="sec-head"><div><div class="eyebrow">Buy · ${Y.buyCats.length} categories</div><h2>Buy new, tokunbo or Nigerian used</h2><p>Current market prices, with the range we see and how sure we are of each figure.</p></div><a class="btn btn-ghost" href="${link("/buy/")}">All equipment prices</a></div>
    <div class="tiles">${Y.buyCats.map(c => `<a class="tile" href="${link(`/buy/${c.slug}/`)}">${photoBox(c.ph, "", true)}<span><b>${esc(c.name)}</b><small>${c.n} lines · from ${NS(c.from * lf().m)}</small></span></a>`).join("")}</div>
    <div class="grid" style="margin-top:28px">${popularBuy.slice(0, 4).map(buyCard).join("")}</div>
  </div></section>

  ${fleet ? `<section class="band"><div class="wrap">
    <div>
      <div class="eyebrow on-dark">Yellowmetal fleet · ${esc(fleet.ref)}</div>
      <h2>Our own ${esc(fleet.name)}, on hire across Lagos since 2023.</h2>
      <p class="lead">${esc(fleet.notes)}</p>
      <div class="band-price">${fp ? `<b class="num">${N(fp.all)}</b><span>per day all-in, ${esc(state.loc)} market rate</span>` : ""}</div>
      <div class="row-btns"><a class="btn btn-accent btn-lg" href="${link(`/fleet/${fleet.id}/`)}">Book this loader</a><a class="btn btn-ghost-dark btn-lg" href="${link("/how/")}">How hiring works</a></div>
    </div>
    <div class="mosaic">${fleet.photos.slice(0, 3).map((p, n) => `<div class="m${n}"><img src="${own(p)}" alt="${esc(fleet.name)} on site" loading="lazy"></div>`).join("")}</div>
  </div></section>` : ""}

  <section class="block"><div class="wrap">
    <div class="sec-head"><div><div class="eyebrow">How a deal runs</div><h2>From this page to your site</h2></div><a class="btn btn-ghost" href="${link("/how/")}">Questions and answers</a></div>
    ${flowHTML()}
  </div></section>

  <section class="block tint"><div class="wrap trust">
    <div><div class="eyebrow">Why Yellowmetal</div><h2>One company on the contract.</h2><p>Whether the machine is ours or a verified partner's, you contract with ${esc(CFG.company)}. We invoice you, we supply the operator, and we answer for the machine on your site.</p></div>
    <div class="pledges">
      <div>${ICON.check}<span><b>Priced in the open</b>Rates follow the Buildocrat Rate Book, checked weekly, so you can see a fair price before you ask.</span></div>
      <div>${ICON.check}<span><b>Inspected before mobilisation</b>Ask for a current walk-around video of the exact machine, not a stock photo.</span></div>
      <div>${ICON.check}<span><b>Payment only to our corporate account</b>After a proforma invoice in the WhatsApp chat. Never to a personal account.</span></div>
      <div>${ICON.check}<span><b>Engineer-led</b>Run by a COREN-registered engineer. CAC ${esc(CFG.rc)}.</span></div>
    </div>
  </div></section>`
  };
};
const flowHTML = () => `<div class="flow">
  <div><div class="eyebrow">Step 1</div><h4>Pick a machine</h4><p>Hire or buy from ${Y.hire.length + Y.buy.length} priced lines, or tell us what you need.</p></div>
  <div><div class="eyebrow">Step 2</div><h4>Fill a short form</h4><p>Dates, site and your details. The estimate updates as you type.</p></div>
  <div class="wa-step"><div class="eyebrow">Step 3 · WhatsApp</div><h4>Send it on WhatsApp</h4><p>Your request opens pre-written with a reference number. We confirm and send a proforma invoice.</p></div>
  <div><div class="eyebrow">Step 4</div><h4>Pay and mobilise</h4><p>Pay into our corporate account. We move the machine and operator to your site.</p></div>
</div>`;

V.section = slug => {
  const s = SEC[slug]; if (!s) return V.notFound();
  const groupHTML = g => {
    const hs = g.hire.map(id => H[id]), bs = g.buy.map(id => B[id]);
    return `<section class="sgroup" id="g-${g.slug}">
      <div class="sgroup-head"><h2>${esc(g.name)}</h2><p>${esc(g.blurb)}</p></div>
      ${hs.length ? `<div class="sub-h"><span class="pill hire">Hire</span><span>${hs.length} ${hs.length > 1 ? "lines" : "line"}, per day or trip</span></div>${state.view === "table" ? hireTable(hs) : `<div class="grid">${hs.map(hireCard).join("")}</div>`}` : ""}
      ${bs.length ? `<div class="sub-h"><span class="pill buy">Buy</span><span>${bs.length} ${bs.length > 1 ? "lines" : "line"}, market price</span></div>${state.view === "table" ? buyTable(bs) : `<div class="grid">${bs.map(buyCard).join("")}</div>`}` : ""}
    </section>`;
  };
  return {
    title: `${s.h1} · Yellowmetal`,
    desc: `${s.intro} ${s.n} priced lines, updated ${dateLong(Y.meta.updated)}.`,
    og: img(s.ph),
    html: `<section class="sec-hero"><div class="sec-hero-img">${photoBox(s.ph, s.name, false)}</div><div class="wrap">
      ${crumbs([["Home", link("/")], [s.name]])}
      <div class="eyebrow on-dark">Specialist desk · ${s.n} priced lines</div>
      <h1>${esc(s.h1)}</h1><p>${esc(s.intro)}</p>
      <div class="jump">${s.groups.map(g => `<button type="button" data-jump="g-${g.slug}">${esc(g.name)}</button>`).join("")}</div>
    </div></section>
    <div class="wrap"><div class="toolbar">${locSelect()}${viewToggle()}<a class="btn btn-ghost" href="${link("/source/")}">Need something else? We'll source it</a></div></div>
    <div class="wrap pad-b">${s.groups.map(groupHTML).join("")}${srcLine()}</div>`
  };
};

V.hireIndex = () => ({
  title: "Construction equipment hire rates in Nigeria · Yellowmetal",
  desc: `Daily hire rates for ${Y.hire.length} construction machines in Nigeria, broken down into dry hire, fuel and operator. Excavators, dozers, rollers, tippers, cranes, generators, dredgers.`,
  html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["Hire"]])}
    <h1>Equipment hire rates</h1>
    <p>${Y.hire.length} machine types in ${Y.hireGroups.length} groups. Each rate is split into dry hire, fuel with lube, and operator, so you can see exactly what you pay for. Choose your location for local rates.</p>
    <div class="toolbar">${locSelect()}</div></div>
  <div class="wrap pad-b">${Y.hireGroups.map(g => { const items = Y.hire.filter(i => i.g === g.slug); return `
    <section class="group"><div class="group-head"><a class="group-ph" href="${link(`/hire/${g.slug}/`)}">${photoBox(g.ph, "", true)}</a><div><h2><a href="${link(`/hire/${g.slug}/`)}">${esc(g.name)}</a></h2><p>${esc(g.blurb)}</p></div><a class="btn btn-ghost" href="${link(`/hire/${g.slug}/`)}">See ${items.length}</a></div>
    <ul class="mini">${items.slice(0, 6).map(i => `<li><a href="${hireHref(i)}"><span>${esc(i.d)}</span><b class="num">${N(hireParts(i).all)}<small>/${esc(i.u)}</small></b></a></li>`).join("")}</ul></section>`; }).join("")}
    ${srcLine()}</div>`
});

V.hireGroup = slug => {
  const g = HG[slug]; if (!g) return V.notFound();
  const items = Y.hire.filter(i => i.g === slug);
  return {
    title: `${g.name} hire rates in Nigeria (${new Date(Y.meta.updated).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}) · Yellowmetal`,
    desc: `${g.name} hire in Nigeria: ${items.slice(0, 4).map(i => `${i.d} ${N(hireParts(i).all)}/${i.u} all-in`).join("; ")}. Dry, fuel and operator broken down.`,
    og: img(g.ph),
    html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["Hire", link("/hire/")], [g.name]])}
      <h1>${esc(g.name)} hire</h1><p>${esc(g.blurb)}</p>
      <div class="toolbar">${locSelect()}${viewToggle()}<div class="filter"><label class="sr" for="fq">Filter</label>${ICON.search}<input id="fq" data-filter placeholder="Filter ${items.length} machines"></div></div></div>
    <div class="wrap pad-b"><div id="list" data-kind="hire" data-items="${items.map(i => i.id).join(",")}">${state.view === "table" ? hireTable(items) : `<div class="grid">${items.map(hireCard).join("")}</div>`}</div>
    <div class="cta-strip"><span>Need something else in ${esc(g.name.toLowerCase())}?</span><a class="btn btn-ghost" href="${link("/source/?want=hire")}">We'll source it</a></div>
    ${srcLine()}</div>`
  };
};

V.hireItem = (slug, id, fleetId) => {
  const fleet = fleetId ? F[fleetId] : null;
  const i = fleet ? byCode[fleet.rateRef] : H[id];
  if (!i || (!fleet && i.g !== slug)) return V.notFound();
  const g = HG[i.g], p = hireParts(i);
  const name = fleet ? `${fleet.name}` : i.d;
  const related = Y.hire.filter(x => x.g === i.g && x.id !== i.id).slice(0, 4);
  const buyAlt = Y.buy.filter(b => b.ph === i.ph).slice(0, 3);
  const gallery = fleet ? fleet.photos.map(own) : [img(i.ph)].filter(Boolean);
  return {
    title: fleet ? `${fleet.name} for hire · Yellowmetal fleet ${fleet.ref}` : `${i.d} hire rate in Nigeria · ${N(p.all)} per ${i.u} all-in · Yellowmetal`,
    desc: `${name} hire: ${N(p.dry)} per ${i.u} dry, ${N(p.all)} all-in with diesel${i.op ? " and operator" : ""} (${state.loc}). Book on WhatsApp with Yellowmetal.`,
    og: gallery[0], kind: "hire", item: i, fleet,
    html: `<div class="wrap">${crumbs(fleet ? [["Home", link("/")], ["Yellowmetal fleet"], [fleet.ref]] : [["Home", link("/")], ["Hire", link("/hire/")], [g.name, link(`/hire/${g.slug}/`)], [i.d]])}
    <div class="detail">
      <div class="d-main">
        <div class="gallery"><div class="main">${gallery.length ? `<img id="gMain" src="${gallery[0]}" alt="${esc(name)}">` : photoBox(i.ph, name, false)}
          ${fleet ? `<span class="tag fleet">Yellowmetal fleet</span>` : ""}${starBtn((fleet ? "f:" + fleet.id : "h:" + i.id), name)}</div>
          ${gallery.length > 1 ? `<div class="thumbs">${gallery.map((s, n) => `<button type="button" class="${n ? "" : "on"}" data-photo="${s}" aria-label="Photo ${n + 1}"><img src="${s}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
        </div>
        <div class="eyebrow mt">${esc(g.name)} · ${esc(fleet ? fleet.ref : i.c)}</div>
        <h1 class="d-title">${esc(name)}</h1>
        ${fleet ? `<p class="d-notes">${esc(fleet.notes)}</p>` : i.out ? `<p class="d-notes">Typical output: <b>${esc(i.out)}</b>.</p>` : ""}
        <section class="breakdown" aria-labelledby="bdh">
          <div class="bd-head"><h2 id="bdh">Rate breakdown</h2>${locSelect("loc2")}</div>
          <table class="bd">
            <tr><th>Dry hire</th><td>Machine only, per ${esc(i.u)}. Market range ${N(p.lo)} – ${N(p.hi)}.</td><td class="r num">${N(p.dry)}</td></tr>
            <tr><th>Fuel + lube</th><td>${i.lpd ? `${i.lpd} litres of diesel a day at ${N(Y.meta.diesel)}/L, plus ${Math.round(Y.meta.lube * 100)}% for lubricants` : "No diesel; electric, petrol or towed"}</td><td class="r num">${N(p.fuel)}</td></tr>
            <tr><th>Operator</th><td>${i.op ? `${esc(i.opn)}, all-in day rate` : "No operator needed"}</td><td class="r num">${N(p.op)}</td></tr>
            <tr class="tot"><th>All-in</th><td>Per ${esc(i.u)}, before mobilisation and VAT</td><td class="r num">${N(p.all)}</td></tr>
          </table>
          <div class="bd-foot num"><span>Week (6 days) <b>${N(p.all * 6)}</b></span><span>Month (${Y.meta.dpm} days) <b>${N(p.all * Y.meta.dpm)}</b></span><span>${confChip(i.conf)}</span><span>Rate set ${esc(i.set || "–")}</span></div>
          ${i.x ? `<p class="bd-src"><b>Yellowmetal estimate.</b> ${esc(i.src || "")}. Diesel and operator come straight from the rate book.</p>` : ""}
        </section>
        <div class="note">${ICON.video}<span><b>Want to see it working?</b> Ask in the WhatsApp chat for a current walk-around video and hour-meter photo of the machine we'll send.</span></div>
        ${buyAlt.length ? `<div class="alt"><h3>Prefer to buy?</h3>${buyAlt.map(b => `<a href="${buyHref(b)}"><span>${esc(b.d)}</span><b class="num">${NS(buyPrice(b).r)}</b></a>`).join("")}</div>` : ""}
      </div>
      <aside class="panel" id="panel">${rentPanel(i, fleet)}</aside>
    </div>
    ${related.length ? `<section class="block-sm"><div class="sec-head"><div><div class="eyebrow">More in ${esc(g.name)}</div><h2>Related machines</h2></div></div><div class="grid">${related.map(hireCard).join("")}</div></section>` : ""}
    ${srcLine()}</div>`
  };
};

function rentPanel(i, fleet) {
  const p = hireParts(i);
  const c = store.get("ym-contact", {});
  return `<div class="panel-head"><div class="eyebrow">Book this machine</div><div class="big num" id="panelRate">${N(p.all)}<small> / ${esc(i.u)} all-in</small></div></div>
  <form id="rentForm" novalidate data-id="${i.id}" data-fleet="${fleet ? fleet.id : ""}">
    <div class="form-grid">
      <label class="f"><span>Start date</span><input id="r-start" type="date" name="start" required><span class="err-msg">Pick a start date</span></label>
      <div class="f"><span>Duration</span><div class="dur"><input id="r-qty" type="number" name="qty" min="1" value="1" required aria-label="How many"><select id="r-unit" name="unit" aria-label="Unit"><option value="day">days</option><option value="week" selected>weeks</option><option value="month">months</option></select></div></div>
      <label class="f full"><span>Site location</span><select id="r-loc" name="loc" data-loc>${LOCS.map(l => `<option ${l[0] === state.loc ? "selected" : ""}>${esc(l[0])}</option>`).join("")}</select></label>
      <label class="f full"><span>Site address or area <small>optional</small></span><input id="r-area" name="area" placeholder="e.g. Lekki Phase 1, Lagos"></label>
      ${i.op ? `<div class="f full"><span>Operator</span><div class="opts"><label class="opt"><input type="radio" name="op" value="1" checked><span>With operator</span></label><label class="opt"><input type="radio" name="op" value="0"><span>Dry hire</span></label></div></div>` : ""}
      ${i.fuel ? `<div class="f full"><span>Diesel</span><div class="opts"><label class="opt"><input type="radio" name="fuel" value="1" checked><span>Yellowmetal supplies</span></label><label class="opt"><input type="radio" name="fuel" value="0"><span>I'll supply</span></label></div></div>` : ""}
      <label class="f full"><span>The job <small>optional</small></span><textarea id="r-job" name="job" placeholder="e.g. bulk dig for a basement, 8 hours a day"></textarea></label>
      ${contactFields(c)}
    </div>
    <div class="estimate" id="est"></div>
    <button class="btn btn-wa btn-block btn-lg" type="submit">${ICON.wa(20)} Book on WhatsApp</button>
    <p class="wa-note">${ICON.wa(16)}<span>No payment is taken on this site. We confirm availability and send a proforma invoice in the chat.</span></p>
  </form>`;
}
function rentEstimate(i, form) {
  const f = lf(), fd = new FormData(form);
  const qty = Math.max(1, +fd.get("qty") || 1), unit = fd.get("unit") || "day";
  const days = qty * ({ day: 1, week: 6, month: Y.meta.dpm })[unit];
  const withOp = i.op && fd.get("op") !== "0", withFuel = i.fuel && fd.get("fuel") !== "0";
  const daily = (i.dry + (withFuel ? i.fuel : 0) + (withOp ? i.op : 0)) * f.p;
  const hire = daily * days;
  const mob = i.lb ? 2 * Y.meta.lowbed * f.p : 0;
  const sub = hire + mob, vat = sub * Y.meta.vat;
  return { qty, unit, days, withOp, withFuel, daily, hire, mob, sub, vat, total: sub + vat };
}
const estimateHTML = e => `<table class="est">
  <tr><td>Hire, ${e.days} day${e.days > 1 ? "s" : ""} × ${N(e.daily)}</td><td class="r num">${N(e.hire)}</td></tr>
  ${e.mob ? `<tr><td>Low-bed mobilisation and return (≤50 km)</td><td class="r num">${N(e.mob)}</td></tr>` : `<tr><td>Delivery to site</td><td class="r">Quoted in chat</td></tr>`}
  <tr><td>VAT ${(Y.meta.vat * 100).toFixed(1)}%</td><td class="r num">${N(e.vat)}</td></tr>
  <tr class="tot"><td>Estimated total</td><td class="r num">${N(e.total)}</td></tr></table>
  <p class="est-note">${e.withFuel ? "Includes diesel at today's pump price." : "Excludes diesel; you supply it."} ${e.withOp ? "Includes operator." : "Dry hire, no operator."}</p>`;

V.buyIndex = () => ({
  title: "Price of construction equipment in Nigeria (new and tokunbo) · Yellowmetal",
  desc: `Current Nigerian prices for ${Y.buy.length} lines of construction equipment: excavators, bulldozers, payloaders, tipper trucks, cranes, generators, batching plants, crushers and dredgers.`,
  html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["Buy"]])}
    <h1>Equipment prices</h1><p>${Y.buy.length} lines in ${Y.buyCats.length} categories: new, tokunbo (foreign used) and Nigerian used, with the market range for each.</p>
    <div class="toolbar">${locSelect()}</div></div>
  <div class="wrap pad-b">${Y.buyCats.map(c => { const items = Y.buy.filter(i => i.cat === c.slug); const pr = byCode[c.primary]; return `
    <section class="group"><div class="group-head"><a class="group-ph" href="${link(`/buy/${c.slug}/`)}">${photoBox(c.ph, "", true)}</a><div><h2><a href="${link(`/buy/${c.slug}/`)}">${esc(c.name)}</a></h2><p>${pr ? `${esc(pr.d)}: <b class="num">${N(buyPrice(pr).r)}</b>` : ""}</p></div><a class="btn btn-ghost" href="${link(`/buy/${c.slug}/`)}">See ${items.length}</a></div>
    <ul class="mini">${items.slice(0, 6).map(i => `<li><a href="${buyHref(i)}"><span>${esc(i.d)}</span><b class="num">${NS(buyPrice(i).r)}</b></a></li>`).join("")}</ul></section>`; }).join("")}
    ${srcLine()}</div>`
});

V.buyCat = slug => {
  const c = BC[slug]; if (!c) return V.notFound();
  const items = Y.buy.filter(i => i.cat === slug);
  const pr = byCode[c.primary];
  return {
    title: `${c.h1} (${new Date(Y.meta.updated).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}) · Yellowmetal`,
    desc: `${c.q} ${pr ? `${pr.d} costs about ${N(buyPrice(pr).r)} (${state.loc}).` : ""} ${items.length} lines with market ranges, updated weekly.`,
    og: img(c.ph),
    faq: pr ? [[c.q, `As at ${dateLong(Y.meta.updated)}, ${pr.d} costs about ${N(buyPrice(pr).r)} (market range ${N(buyPrice(pr).lo)} to ${N(buyPrice(pr).hi)}).`]] : null,
    html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["Buy", link("/buy/")], [c.name]])}
      <h1>${esc(c.h1)}</h1>
      ${pr ? `<p class="answer">${esc(c.q)} As at ${dateLong(Y.meta.updated)}, <a href="${buyHref(pr)}">${esc(pr.d)}</a> costs about <b class="num">${N(buyPrice(pr).r)}</b>, with a market range of ${N(buyPrice(pr).lo)} to ${N(buyPrice(pr).hi)}.</p>` : ""}
      <div class="toolbar">${locSelect()}${viewToggle()}<div class="filter"><label class="sr" for="fq">Filter</label>${ICON.search}<input id="fq" data-filter placeholder="Filter ${items.length} lines"></div>
      <div class="seg" role="group" aria-label="Condition" id="condSeg">${["All", "New", "Tokunbo", "Nigerian used"].map((t, n) => `<button type="button" data-cond="${t}" class="${n ? "" : "on"}">${t}</button>`).join("")}</div></div></div>
    <div class="wrap pad-b"><div id="list" data-kind="buy" data-items="${items.map(i => i.id).join(",")}">${state.view === "table" ? buyTable(items) : `<div class="grid">${items.map(buyCard).join("")}</div>`}</div>
    ${c.drivers ? `<section class="drivers"><h2>What drives the price</h2><p>${esc(c.drivers)}</p></section>` : ""}
    ${srcLine()}</div>`
  };
};

V.buyItem = (slug, id) => {
  const i = B[id]; if (!i || i.cat !== slug) return V.notFound();
  const c = BC[i.cat], p = buyPrice(i);
  const ch = p.pr ? (p.r - p.pr) / p.pr : null;
  const hireAlt = Y.hire.filter(h => h.ph === i.ph).slice(0, 3);
  const related = Y.buy.filter(x => x.cat === i.cat && x.id !== i.id && x.ph === i.ph).concat(Y.buy.filter(x => x.cat === i.cat && x.id !== i.id && x.ph !== i.ph)).slice(0, 4);
  return {
    title: `${i.d} price in Nigeria · ${N(p.r)} · Yellowmetal`,
    desc: `${i.d}: about ${N(p.r)} (${state.loc}), market range ${N(p.lo)} to ${N(p.hi)}. Get a proforma invoice, inspection or financing through Yellowmetal on WhatsApp.`,
    og: img(i.ph), kind: "buy", item: i,
    html: `<div class="wrap">${crumbs([["Home", link("/")], ["Buy", link("/buy/")], [c.name, link(`/buy/${c.slug}/`)], [i.d]])}
    <div class="detail">
      <div class="d-main">
        <div class="gallery"><div class="main">${photoBox(i.ph, i.d, false)}${i.cond ? `<span class="tag">${esc(i.cond)}</span>` : ""}${starBtn("b:" + i.id, i.d)}</div></div>
        <p class="photo-note">Photo shows a typical ${esc((Y.photoLabels[i.ph] || "machine").toLowerCase())}. We send photos and video of the actual unit in the chat.</p>
        <div class="eyebrow mt">${esc(c.name)} · ${esc(i.c)}</div>
        <h1 class="d-title">${esc(i.d)}</h1>
        <section class="breakdown" aria-labelledby="bdh">
          <div class="bd-head"><h2 id="bdh">Market price</h2>${locSelect("loc2")}</div>
          <table class="bd">
            <tr><th>Typical price</th><td>Per ${i.u === "nr" ? "unit" : esc(i.u)}, ${esc(state.loc)}</td><td class="r num"><b>${N(p.r)}</b></td></tr>
            <tr><th>Market range</th><td>What we see across dealers and listings</td><td class="r num nowrap">${N(p.lo)} – ${N(p.hi)}</td></tr>
            <tr><th>Change</th><td>Since the previous rate-book check</td><td class="r num">${ch == null || Math.abs(ch) < 0.0005 ? "No change" : `<span class="${ch > 0 ? "up" : "down"}">${ch > 0 ? "+" : ""}${(ch * 100).toFixed(1)}%</span>`}</td></tr>
            <tr><th>Evidence</th><td>${i.der ? "Derived from a US-dollar supplier price at today's exchange rate" : "Date of the latest market evidence"}</td><td class="r num">${i.der ? `$1 = ${N(Y.meta.fx)}` : esc(i.ev || "–")}</td></tr>
          </table>
          <div class="bd-foot"><span>${confChip(i.conf)}</span><span>Excludes VAT, duty clearing and delivery unless stated</span></div>
          ${i.x ? `<p class="bd-src"><b>Yellowmetal estimate.</b> ${esc(i.src || "")}.</p>` : ""}
        </section>
        ${c.drivers ? `<section class="drivers sm"><h2>What drives the price</h2><p>${esc(c.drivers)}</p></section>` : ""}
        ${hireAlt.length ? `<div class="alt"><h3>Need it for a short job? Hire instead</h3>${hireAlt.map(h => `<a href="${hireHref(h)}"><span>${esc(h.d)}</span><b class="num">${NS(hireParts(h).all)}/${esc(h.u)}</b></a>`).join("")}</div>` : ""}
      </div>
      <aside class="panel" id="panel">${buyPanel(i)}</aside>
    </div>
    ${related.length ? `<section class="block-sm"><div class="sec-head"><div><div class="eyebrow">More in ${esc(c.name)}</div><h2>Compare</h2></div></div><div class="grid">${related.map(buyCard).join("")}</div></section>` : ""}
    ${srcLine()}</div>`
  };
};
function buyPanel(i) {
  const c = store.get("ym-contact", {}), p = buyPrice(i);
  return `<div class="panel-head"><div class="eyebrow">Buy through Yellowmetal</div><div class="big num">${N(p.r)}</div><div class="sub">Market price. We confirm the exact unit and price on WhatsApp.</div></div>
  <form id="buyForm" novalidate data-id="${i.id}">
    <div class="form-grid">
      <div class="f full"><span>I'd like to</span><div class="opts">
        <label class="opt"><input type="radio" name="action" value="Get a proforma invoice" checked><span>Proforma invoice</span></label>
        <label class="opt"><input type="radio" name="action" value="Book an inspection"><span>Book inspection</span></label>
        <label class="opt"><input type="radio" name="action" value="Make an offer"><span>Make an offer</span></label></div></div>
      <div class="f full"><span>Payment</span><div class="opts">
        <label class="opt"><input type="radio" name="plan" value="Outright" checked><span>Outright</span></label>
        <label class="opt"><input type="radio" name="plan" value="Instalments"><span>Instalments</span></label>
        <label class="opt"><input type="radio" name="plan" value="Lease-to-own"><span>Lease-to-own</span></label></div></div>
      <label class="f"><span>Quantity</span><input id="b-qty" type="number" name="qty" min="1" value="1"></label>
      <label class="f"><span>Your offer <small>optional</small></span><input id="b-offer" name="offer" inputmode="numeric" placeholder="₦"></label>
      <label class="f full"><span>Deliver to</span><select id="b-loc" name="loc" required><option value="">Select location</option>${LOCS.map(l => `<option>${esc(l[0])}</option>`).join("")}<option value="Buyer collects">I'll collect</option></select><span class="err-msg">Choose where it goes</span></label>
      <label class="f full"><span>Anything else <small>optional</small></span><textarea id="b-note" name="note" placeholder="Preferred brand, year, hours, deadline"></textarea></label>
      ${contactFields(c, true)}
    </div>
    <button class="btn btn-wa btn-block btn-lg" type="submit">${ICON.wa(20)} Continue on WhatsApp</button>
    <p class="wa-note">${ICON.wa(16)}<span>We confirm the unit, arrange inspection and send the proforma invoice with our corporate account details.</span></p>
  </form>`;
}
function contactFields(c, buyer) {
  return `<div class="legend full">Your details</div>
  <label class="f"><span>Full name</span><input id="c-name" name="name" required autocomplete="name" value="${esc(c.name)}"><span class="err-msg">Enter your name</span></label>
  <label class="f"><span>WhatsApp number</span><input id="c-phone" name="phone" required type="tel" inputmode="tel" autocomplete="tel" placeholder="0803 000 0000" value="${esc(c.phone)}"><span class="err-msg">Enter a number we can reach on WhatsApp</span></label>
  <label class="f"><span>Company <small>optional</small></span><input id="c-company" name="company" autocomplete="organization" value="${esc(c.company)}"></label>
  <label class="f"><span>Email <small>optional</small></span><input id="c-email" name="email" type="email" autocomplete="email" value="${esc(c.email)}"></label>
  ${buyer ? `<label class="f full"><span>Buying as</span><select id="c-btype" name="buyerType"><option>Individual or contractor</option><option>Registered company</option><option>Government or agency</option><option>Cooperative or association</option></select></label>` : ""}`;
}

V.list = () => ({
  title: "List your equipment for hire or sale · Yellowmetal",
  desc: "Own an idle excavator, loader, tipper or crane? Yellowmetal finds clients, contracts the job in its name, manages the operator and pays you.",
  html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["List your machine"]])}
    <h1>Put your idle machine to work.</h1>
    <p>Rent it out or sell it through Yellowmetal. We find the client, contract the job in our name, manage the operator and collect payment. You are paid on terms we agree in writing.</p></div>
  <div class="wrap two-col">
    <form class="form-card" id="listForm" novalidate>
      <div class="form-grid">
        <div class="legend first full">What do you want to do?</div>
        <div class="f full"><div class="opts">
          <label class="opt"><input type="radio" name="intent" value="Rent it out through Yellowmetal" checked><span>Rent it out</span></label>
          <label class="opt"><input type="radio" name="intent" value="Sell it through Yellowmetal"><span>Sell it</span></label>
          <label class="opt"><input type="radio" name="intent" value="Open to renting or selling"><span>Either</span></label></div></div>
        <div class="legend full">The machine</div>
        <label class="f full"><span>Machine type</span><select id="l-type" name="type" required><option value="">Select the closest match</option>${Y.hireGroups.map(g => `<optgroup label="${esc(g.name)}">${Y.hire.filter(i => i.g === g.slug).map(i => `<option value="${i.id}">${esc(i.d)}</option>`).join("")}</optgroup>`).join("")}<option value="other">Something else</option></select><span class="err-msg">Choose a type</span></label>
        <label class="f"><span>Make</span><input id="l-make" name="make" required placeholder="e.g. Caterpillar"><span class="err-msg">Enter the make</span></label>
        <label class="f"><span>Model</span><input id="l-model" name="model" required placeholder="e.g. 320D"><span class="err-msg">Enter the model</span></label>
        <label class="f"><span>Year <small>optional</small></span><input id="l-year" name="year" inputmode="numeric"></label>
        <label class="f"><span>Hours or mileage <small>optional</small></span><input id="l-hours" name="hours"></label>
        <label class="f"><span>Condition</span><select id="l-cond" name="condition" required><option value="">Select</option><option>Working, excellent</option><option>Working, good</option><option>Working, needs minor repair</option><option>Not working, needs repair</option></select><span class="err-msg">Choose a condition</span></label>
        <label class="f"><span>Where it is</span><select id="l-loc" name="loc" required><option value="">Select</option>${LOCS.map(l => `<option>${esc(l[0])}</option>`).join("")}<option>Elsewhere in Nigeria</option></select><span class="err-msg">Choose a location</span></label>
        <div class="legend full">Your expectations</div>
        <div class="f full hint" id="listHint"></div>
        <label class="f"><span>Asking price <small>if selling</small></span><input id="l-price" name="price" inputmode="numeric" placeholder="₦"></label>
        <label class="f"><span>Day rate you expect <small>if renting</small></span><input id="l-rate" name="rate" inputmode="numeric" placeholder="₦ per day, dry"></label>
        <label class="f"><span>Operator</span><select id="l-op" name="operator"><option>I have an operator</option><option>Yellowmetal to provide one</option></select></label>
        <label class="f"><span>Available from <small>optional</small></span><input id="l-from" type="date" name="from"></label>
        <div class="f full"><span>Papers you can show</span><div class="opts">${["Purchase invoice", "Customs papers", "Registration", "Service records", "Insurance"].map(d => `<label class="opt"><input type="checkbox" name="docs" value="${d}"><span>${d}</span></label>`).join("")}</div></div>
        ${contactFields(store.get("ym-contact", {}))}
      </div>
      <button class="btn btn-wa btn-lg btn-block" type="submit">${ICON.wa(20)} Submit on WhatsApp</button>
      <p class="wa-note">${ICON.wa(16)}<span>Then send 6 to 10 photos in the chat (all four sides, engine, cab, tracks or tyres, hour meter) and a short walk-around video.</span></p>
    </form>
    <aside class="aside"><div class="ph">${photoBox("lowbed-trailer", "Machine on a low-bed", false)}</div>
      <div class="box"><h3>What happens next</h3><ol>
        <li><b>WhatsApp opens</b> with your listing and a reference number.</li>
        <li><b>Send photos, video and papers</b> so we can confirm ownership.</li>
        <li><b>We inspect</b> in person or by live video and agree terms in writing.</li>
        <li><b>We market it</b> here and to our clients. Your name stays private.</li>
        <li><b>We contract and collect.</b> You are paid on the agreed terms.</li></ol>
        <p>Listing is free. Commission and payout timing are agreed before your machine goes live.</p></div></aside>
  </div>`
});

V.source = q => ({
  title: "Source a machine · Yellowmetal",
  desc: "Tell Yellowmetal the machine and the job. We come back on WhatsApp with options and prices from our partner network.",
  html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["Source a machine"]])}
    <h1>Tell us the machine. We'll find it.</h1><p>Describe the machine and the job. We come back on WhatsApp with options and prices, usually the same working day.</p></div>
  <div class="wrap two-col">
    <form class="form-card" id="sourceForm" novalidate>
      <div class="form-grid">
        <div class="f full"><span>I want to</span><div class="opts"><label class="opt"><input type="radio" name="want" value="Hire" ${q.get("want") !== "buy" ? "checked" : ""}><span>Hire</span></label><label class="opt"><input type="radio" name="want" value="Buy" ${q.get("want") === "buy" ? "checked" : ""}><span>Buy</span></label></div></div>
        <label class="f full"><span>Machine and size</span><input id="s-spec" name="spec" required placeholder="e.g. 30 t excavator with breaker, or 12-tyre tipper" value="${esc(q.get("q") || "")}"><span class="err-msg">Describe the machine</span></label>
        <label class="f"><span>How many</span><input id="s-qty" name="qty" type="number" min="1" value="1"></label>
        <label class="f"><span>Needed by <small>optional</small></span><input id="s-by" type="date" name="by"></label>
        <label class="f"><span>Site location</span><select id="s-loc" name="loc" required><option value="">Select</option>${LOCS.map(l => `<option>${esc(l[0])}</option>`).join("")}<option>Elsewhere in Nigeria</option></select><span class="err-msg">Choose a location</span></label>
        <label class="f"><span>Hire length or budget <small>optional</small></span><input id="s-budget" name="budget" placeholder="e.g. 3 months, or ₦150m"></label>
        <label class="f full"><span>About the project <small>optional</small></span><textarea id="s-note" name="note" placeholder="e.g. 4 km estate road, laterite fill and compaction"></textarea></label>
        ${contactFields(store.get("ym-contact", {}))}
      </div>
      <button class="btn btn-wa btn-lg btn-block" type="submit">${ICON.wa(20)} Send request on WhatsApp</button>
    </form>
    <aside class="aside"><div class="ph">${photoBox("crawler-crane", "Crawler crane", false)}</div>
      <div class="box"><h3>Helpful to include</h3><ul>
        <li><b>Size class:</b> tonnage, bucket size, lift capacity or kVA.</li><li><b>Attachments:</b> breaker, auger, long reach, ripper.</li>
        <li><b>Site access:</b> terrain, distance from tarred road, weight limits.</li><li><b>Working hours:</b> single shift, double shift or 24/7.</li></ul></div></aside>
  </div>`
});

V.search = q => {
  const term = (q.get("q") || "").trim();
  const words = term.toLowerCase().split(/\s+/).filter(Boolean).map(w => w.replace(/(es|s)$/, "").replace(/tonnes?|tons?/, "t"));
  const match = (s) => words.length && words.every(w => s.includes(w));
  const hs = Y.hire.filter(i => match(i.s)), bs = Y.buy.filter(i => match(i.s));
  return {
    title: term ? `“${term}” · Yellowmetal` : "Search · Yellowmetal", desc: "Search hire rates and equipment prices.", noindex: true,
    html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["Search"]])}<h1>${term ? `Results for “${esc(term)}”` : "Search"}</h1>
      <form class="hero-search inline" data-search role="search"><label class="sr" for="sq">Search</label>${ICON.search}<input id="sq" name="q" value="${esc(term)}" placeholder="Search ${Y.hire.length + Y.buy.length} machines"><button class="btn btn-accent" type="submit">Search</button></form>
      <div class="toolbar">${locSelect()}</div></div>
    <div class="wrap pad-b">
      ${hs.length ? `<h2 class="res-h">Hire <span>${hs.length}</span></h2><div class="grid">${hs.slice(0, 24).map(hireCard).join("")}</div>` : ""}
      ${bs.length ? `<h2 class="res-h">Buy <span>${bs.length}</span></h2><div class="grid">${bs.slice(0, 24).map(buyCard).join("")}</div>` : ""}
      ${term && !hs.length && !bs.length ? `<div class="empty"><h3>No machine matches “${esc(term)}”</h3><p>Our partner network covers more than these listings. Tell us what you need.</p><a class="btn btn-accent" href="${link("/source/?q=" + encodeURIComponent(term))}">Request it</a></div>` : ""}
    </div>`
  };
};

V.shortlist = () => {
  const rows = shortlist.map(k => [k, resolveKey(k)]).filter(r => r[1]);
  return {
    title: "Shortlist · Yellowmetal", desc: "Machines you saved.", noindex: true,
    html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["Shortlist"]])}<h1>One request for the whole fleet.</h1><p>Save machines from any page and send them together. One chat, one combined quote.</p></div>
    <div class="wrap pad-b" id="slWrap">${rows.length ? `<div class="two-col nop"><div>${rows.map(([k, it]) => { const t = k[0]; const name = t === "f" ? it.name : it.d; const href = t === "h" ? hireHref(it) : t === "b" ? buyHref(it) : link(`/fleet/${it.id}/`); const price = t === "b" ? N(buyPrice(it).r) : N(hireParts(t === "f" ? byCode[it.rateRef] : it).all) + "/day"; return `
      <div class="sl-row"><a class="ph" href="${href}">${t === "f" ? `<img src="${own(it.photos[0])}" alt="">` : photoBox(it.ph, "", true)}</a>
        <div><div class="eyebrow">${t === "b" ? "Buy" : "Hire"}</div><h4><a href="${href}">${esc(name)}</a></h4><div class="num">${price}</div></div>
        <button type="button" class="x" data-star="${k}" aria-label="Remove ${esc(name)}">${ICON.x}</button></div>`; }).join("")}</div>
      <form class="form-card" id="slForm" novalidate><div class="form-grid">
        <label class="f full"><span>Site location</span><select id="q-loc" name="loc" required><option value="">Select</option>${LOCS.map(l => `<option>${esc(l[0])}</option>`).join("")}</select><span class="err-msg">Choose a location</span></label>
        <label class="f"><span>Needed by <small>optional</small></span><input id="q-by" type="date" name="by"></label>
        <label class="f"><span>Hire length <small>for hires</small></span><input id="q-dur" name="duration" placeholder="e.g. 6 weeks"></label>
        <label class="f full"><span>Notes <small>optional</small></span><textarea id="q-note" name="note"></textarea></label>
        ${contactFields(store.get("ym-contact", {}))}</div>
        <button class="btn btn-wa btn-lg btn-block" type="submit">${ICON.wa(20)} Request a combined quote</button></form></div>`
      : `<div class="empty"><h3>Nothing saved yet</h3><p>Tap the star on any machine to add it here.</p><a class="btn btn-accent" href="${link("/hire/")}">Browse hire rates</a></div>`}</div>`
  };
};

V.requests = () => {
  const reqs = store.get("ym-requests", []);
  return {
    title: "My requests · Yellowmetal", desc: "Requests sent from this device.", noindex: true,
    html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["My requests"]])}<h1>My requests</h1><p>Requests sent from this phone or computer. Quote the reference in any follow-up.</p></div>
    <div class="wrap pad-b" id="reqList">${reqs.length ? reqs.map(r => `<div class="req"><div><code>${esc(r.ref)}</code> <b>${esc(r.kind)}</b><div class="meta">${esc(r.summary)} · ${new Date(r.at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</div></div><a class="btn btn-wa" href="${waLink(r.message)}" target="_blank" rel="noopener">${ICON.wa(18)} Reopen chat</a></div>`).join("")
      : `<div class="empty"><h3>No requests yet</h3><p>Requests you send appear here with their reference numbers.</p><a class="btn btn-accent" href="${link("/hire/")}">Browse hire rates</a></div>`}</div>`
  };
};

V.how = () => {
  const faqs = [
    ["Where do your prices come from?", `From the Buildocrat Nigeria Construction Rate Book, which checks plant hire rates, equipment prices, diesel and the exchange rate every week. This site picks up each update automatically. The rates are market rates; your final price for a specific machine, date and site is confirmed in the WhatsApp chat.`],
    ["What does “all-in” mean?", `All-in is dry hire plus diesel (litres per day at the current pump price, plus ${Math.round(Y.meta.lube * 100)}% for lubricants) plus the operator's day rate. Mobilisation to site and VAT are shown separately in the estimate.`],
    ["Why does every deal close on WhatsApp?", "Equipment deals need a conversation: site access, mobilisation, operator hours and inspection. In one WhatsApp thread we confirm all of that, send current photos and video of the actual machine, and issue your proforma invoice."],
    ["How do I pay?", `Only after you receive a proforma invoice in the chat, and only into the corporate account of ${CFG.company}. We never ask for payment into a personal account. If anyone does, stop and call ${CFG.displayPhone}.`],
    ["Who owns the machines?", "Some are in the Yellowmetal fleet; others belong to verified partners. Either way you contract with Yellowmetal, and we are responsible for the machine and operator on your site."],
    ["Do prices change by location?", "Yes. The rate book prices in Abuja and applies a factor for 11 other locations, including a higher factor for riverine and creek sites. Pick your location on any page."],
    ["Can I inspect before I buy?", "Yes. Choose Book inspection on any machine for sale. We arrange a viewing where the machine is, or a live video inspection if you are far away."],
    ["Do you offer instalments or lease-to-own?", "For qualifying buyers, yes. Choose Instalments or Lease-to-own when you send your request."],
    ["I own equipment. What does listing cost?", "Nothing to list. If your machine is hired out or sold through us, commission and payout timing are agreed in writing before it goes live."]
  ];
  return {
    title: "How it works · Yellowmetal", desc: "How hiring and buying through Yellowmetal works, how rates are built, and how payment is made.", faq: faqs,
    html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["How it works"]])}<h1>Simple to start. One company to answer to.</h1><p>No accounts and no card payments on this site. Choose a machine, send your request, talk to a person.</p></div>
    <div class="wrap">${flowHTML()}</div>
    <section class="block"><div class="wrap faq"><div class="sec-head"><div><div class="eyebrow">Questions</div><h2>What people ask us</h2></div></div>
      ${faqs.map(([q, a]) => `<details class="q"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}
      <div class="row-btns"><a class="btn btn-wa btn-lg" href="${waLink(generalMessage())}" target="_blank" rel="noopener">${ICON.wa(20)} Ask us on WhatsApp</a><a class="btn btn-ghost btn-lg" href="${link("/source/")}">Source a machine</a></div>
    </div></section>`
  };
};

V.credits = () => ({
  title: "Photo credits · Yellowmetal", desc: "Credits and licences for photos used on yellowmetal.store.",
  html: `<div class="wrap page-head">${crumbs([["Home", link("/")], ["Photo credits"]])}<h1>Photo credits</h1><p>Machine-type photos show Chinese-manufactured equipment (SANY, XCMG, SDLG, Shantui, Zoomlion, LiuGong, Sinotruk HOWO, DJI and others), sourced from Wikimedia Commons and Openverse under the licences shown. They show a typical machine of each type; we send photos of the actual unit in the WhatsApp chat. Photos of the Yellowmetal fleet are our own.</p></div>
  <div class="wrap pad-b"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Machine type</th><th>Photo</th><th>Author</th><th>Licence</th></tr></thead><tbody>
  ${Object.entries(Y.credits).sort().map(([k, c]) => `<tr><td>${esc(Y.photoLabels[k] || k)}</td><td><a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.title.replace(/^File:/, ""))}</a></td><td>${esc(c.author)}</td><td>${esc(c.licence)}</td></tr>`).join("")}
  </tbody></table></div></div>`
});

V.notFound = () => ({ title: "Page not found · Yellowmetal", desc: "", noindex: true, status: 404,
  html: `<div class="wrap" style="padding-block:80px"><div class="empty"><h3>That page isn't here</h3><p>The machine may have been renamed. Search, or tell us what you need.</p><div class="row-btns center"><a class="btn btn-accent" href="${link("/hire/")}">Hire rates</a><a class="btn btn-ghost" href="${link("/buy/")}">Equipment prices</a></div></div></div>` });

/* ---------------- router ---------------- */
function route(path, query) {
  const q = new URLSearchParams(query || "");
  const s = path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (!s.length) return V.home();
  switch (s[0]) {
    case "hire": return s.length === 1 ? V.hireIndex() : s.length === 2 ? V.hireGroup(s[1]) : V.hireItem(s[1], s[2]);
    case "buy": return s.length === 1 ? V.buyIndex() : s.length === 2 ? V.buyCat(s[1]) : V.buyItem(s[1], s[2]);
    case "fleet": return F[s[1]] ? V.hireItem(null, null, s[1]) : V.notFound();
    case "list": return V.list();
    case "heavy-haulage": case "concrete": case "tools-survey": return SEC[s[0]] ? V.section(s[0]) : V.notFound();
    case "source": return V.source(q);
    case "search": return V.search(q);
    case "shortlist": return V.shortlist();
    case "requests": return V.requests();
    case "how": return V.how();
    case "credits": return V.credits();
  }
  return V.notFound();
}

/* ---------------- WhatsApp ---------------- */
const waLink = text => `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}`;
const generalMessage = () => `*YELLOWMETAL · ENQUIRY*\n\nHello Yellowmetal, I have a question about equipment:\n\n\n— sent from ${CFG.domain}`;
function makeRef(t) {
  const d = new Date(), p = n => String(n).padStart(2, "0"), ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = ""; for (let i = 0; i < 4; i++) r += ch[Math.floor(Math.random() * ch.length)];
  return `YM-${t}${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${r}`;
}
function buildMessage(heading, ref, sections, closing) {
  const out = [`*YELLOWMETAL · ${heading}*`, `Ref: ${ref}`, ""];
  sections.forEach(sec => { const rows = sec.filter(([k, v]) => v != null && String(v).trim() !== ""); rows.forEach(([k, v]) => out.push(k ? `*${k}:* ${v}` : String(v))); if (rows.length) out.push(""); });
  out.push(closing, "", `— sent from ${CFG.domain}`);
  return out.join("\n");
}

/* ---------------- browser ---------------- */
function boot() {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const app = $("#app");
  let current = null;

  const curPath = () => {
    if (MODE === "hash") { const h = location.hash.replace(/^#/, "") || "/"; const [p, q] = h.split("?"); return [p, q || ""]; }
    let p = location.pathname; if (BASE !== "/" && p.startsWith(BASE)) p = "/" + p.slice(BASE.length);
    return [p, location.search.replace(/^\?/, "")];
  };
  function go(href, push = true) {
    if (MODE === "hash") { location.hash = href.replace(/^#/, ""); return; }
    if (push) history.pushState({}, "", href);
    render(); window.scrollTo(0, 0);
  }
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2400); }
  function gtag() { if (root.gtag) root.gtag.apply(null, arguments); }

  function render() {
    const [p, q] = curPath();
    current = route(p, q);
    app.innerHTML = current.html;
    document.title = current.title;
    $$("#nav a").forEach(a => a.classList.toggle("on", p.startsWith(a.dataset.nav)));
    $("#nav").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded", "false");
    $("#slCount").textContent = shortlist.length;
    bind(p);
  }

  function setLoc(v) { state.loc = v; store.set("ym-loc", v); render(); toast(`Prices now for ${v}`); }

  function bind(p) {
    $$("[data-loc]").forEach(s => { if (s.id === "r-loc") return; s.addEventListener("change", () => setLoc(s.value)); });
    $$("[data-view]").forEach(b => b.addEventListener("click", () => { state.view = b.dataset.view; store.set("ym-view", state.view); render(); }));
    $$("[data-jump]").forEach(b => b.addEventListener("click", () => document.getElementById(b.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" })));
    $$("[data-photo]").forEach(b => b.addEventListener("click", () => { $("#gMain").src = b.dataset.photo; $$("[data-photo]").forEach(x => x.classList.toggle("on", x === b)); }));
    $$("form[data-search]").forEach(f => f.addEventListener("submit", e => { e.preventDefault(); const v = f.q.value.trim(); if (v) go(link("/search/?q=" + encodeURIComponent(v))); }));
    const list = $("#list");
    if (list) {
      const kind = list.dataset.kind, ids = list.dataset.items.split(",");
      let cond = "All";
      const draw = () => {
        const term = ($("#fq")?.value || "").toLowerCase().trim();
        let items = ids.map(id => kind === "hire" ? H[id] : B[id]).filter(i => !term || i.s.includes(term));
        if (kind === "buy" && cond !== "All") items = items.filter(i => i.cond === cond);
        list.innerHTML = !items.length ? `<div class="empty"><h3>Nothing matches</h3><p>Try fewer words, or ask us to source it.</p></div>`
          : state.view === "table" ? (kind === "hire" ? hireTable(items) : buyTable(items)) : `<div class="grid">${items.map(kind === "hire" ? hireCard : buyCard).join("")}</div>`;
      };
      $("#fq")?.addEventListener("input", draw);
      $$("#condSeg [data-cond]").forEach(b => b.addEventListener("click", () => { cond = b.dataset.cond; $$("#condSeg button").forEach(x => x.classList.toggle("on", x === b)); draw(); }));
    }
    const rf = $("#rentForm");
    if (rf) {
      const i = H[rf.dataset.id], fleet = F[rf.dataset.fleet];
      rf.start.min = new Date().toISOString().slice(0, 10);
      const upd = () => { $("#est").innerHTML = estimateHTML(rentEstimate(i, rf)); };
      rf.addEventListener("input", upd);
      $("#r-loc").addEventListener("change", e => { state.loc = e.target.value; store.set("ym-loc", state.loc); const pr = hireParts(i); $("#panelRate").innerHTML = `${N(pr.all)}<small> / ${esc(i.u)} all-in</small>`; upd(); });
      upd();
      rf.addEventListener("submit", e => {
        e.preventDefault(); if (!validate(rf)) return;
        const fd = new FormData(rf); remember(fd);
        const est = rentEstimate(i, rf), ref = makeRef("R");
        const msg = buildMessage("HIRE REQUEST", ref, [
          [["Machine", fleet ? `${fleet.name} (Yellowmetal fleet ${fleet.ref})` : i.d], ["Rate book code", i.c]],
          [["Start", fd.get("start")], ["Duration", `${est.qty} ${est.unit}${est.qty > 1 ? "s" : ""} (${est.days} working days)`], ["Site", [fd.get("area"), fd.get("loc")].filter(Boolean).join(", ")], ["Operator", i.op ? (est.withOp ? "With operator" : "Dry hire") : "Not needed"], ["Diesel", i.fuel ? (est.withFuel ? "Yellowmetal supplies" : "I'll supply") : "n/a"], ["Job", fd.get("job")]],
          [[null, "_Estimate from the rate book:_"], ["Day rate", N(est.daily)], ["Hire", N(est.hire)], ["Mobilisation", est.mob ? N(est.mob) : "Please quote"], ["VAT", N(est.vat)], ["Estimated total", N(est.total)]],
          contactRows(fd)
        ], "Please confirm availability and send the proforma invoice.");
        handoff(ref, "Hire", `${fleet ? fleet.name : i.d} · ${est.qty} ${est.unit}${est.qty > 1 ? "s" : ""}`, msg);
      });
    }
    const bf = $("#buyForm");
    if (bf) {
      const i = B[bf.dataset.id];
      bf.addEventListener("submit", e => {
        e.preventDefault(); if (!validate(bf)) return;
        const fd = new FormData(bf); remember(fd);
        const ref = makeRef("B"), offer = String(fd.get("offer") || "").replace(/[^\d]/g, ""), p = buyPrice(i);
        const msg = buildMessage("PURCHASE REQUEST", ref, [
          [["Machine", i.d], ["Rate book code", i.c], ["Quantity", fd.get("qty")], ["Market price", `${N(p.r)} each (range ${N(p.lo)} – ${N(p.hi)})`]],
          [["Request", fd.get("action")], ["My offer", offer ? N(+offer) : ""], ["Payment", fd.get("plan")], ["Deliver to", fd.get("loc")], ["Note", fd.get("note")]],
          contactRows(fd)
        ], "Please confirm available units and send the proforma invoice and inspection options.");
        handoff(ref, "Buy", `${i.d} · ${fd.get("action")}`, msg);
      });
    }
    const lf_ = $("#listForm");
    if (lf_) {
      const hint = () => { const it = H[lf_.type.value]; $("#listHint").innerHTML = it ? `Market dry hire for this type is <b>${N(hireParts(it).dry)}</b> per ${esc(it.u)} (range ${N(hireParts(it).lo)} – ${N(hireParts(it).hi)}), from the rate book.` : ""; };
      lf_.type.addEventListener("change", hint);
      lf_.addEventListener("submit", e => {
        e.preventDefault(); if (!validate(lf_)) return;
        const fd = new FormData(lf_); remember(fd);
        const ref = makeRef("L"), num = v => { const d = String(v || "").replace(/[^\d]/g, ""); return d ? N(+d) : ""; };
        const it = H[fd.get("type")];
        const msg = buildMessage("EQUIPMENT LISTING", ref, [
          [["I want to", fd.get("intent")]],
          [["Type", it ? it.d : "Other"], ["Make and model", `${fd.get("make")} ${fd.get("model")}`], ["Year", fd.get("year")], ["Hours", fd.get("hours")], ["Condition", fd.get("condition")], ["Location", fd.get("loc")]],
          [["Asking price", num(fd.get("price"))], ["Expected day rate", num(fd.get("rate"))], ["Market dry rate", it ? N(hireParts(it).dry) + "/" + it.u : ""], ["Operator", fd.get("operator")], ["Available from", fd.get("from")], ["Papers", fd.getAll("docs").join(", ")]],
          contactRows(fd)
        ], "I'll send photos, a walk-around video and papers here. Please advise on verification and listing terms.");
        handoff(ref, "List", `${fd.get("make")} ${fd.get("model")} · ${fd.get("intent")}`, msg);
      });
    }
    const sf = $("#sourceForm");
    if (sf) sf.addEventListener("submit", e => {
      e.preventDefault(); if (!validate(sf)) return;
      const fd = new FormData(sf); remember(fd); const ref = makeRef("S");
      const msg = buildMessage(`SOURCING REQUEST · ${String(fd.get("want")).toUpperCase()}`, ref, [
        [["I want to", fd.get("want")], ["Machine", fd.get("spec")], ["Quantity", fd.get("qty")], ["Needed by", fd.get("by")], ["Site", fd.get("loc")], ["Length or budget", fd.get("budget")], ["Project", fd.get("note")]],
        contactRows(fd)], "Please send available options with prices.");
      handoff(ref, "Source", `${fd.get("want")} · ${fd.get("spec")}`, msg);
    });
    const slf = $("#slForm");
    if (slf) slf.addEventListener("submit", e => {
      e.preventDefault(); if (!validate(slf)) return;
      const fd = new FormData(slf); remember(fd); const ref = makeRef("Q");
      const lines = shortlist.map((k, n) => { const it = resolveKey(k), t = k[0]; if (!it) return null; const name = t === "f" ? `${it.name} (fleet ${it.ref})` : `${it.d} [${it.c}]`; const pr = t === "b" ? N(buyPrice(it).r) : N(hireParts(t === "f" ? byCode[it.rateRef] : it).all) + "/day all-in"; return [null, `${n + 1}. ${t === "b" ? "BUY" : "HIRE"} · ${name} · ${pr}`]; }).filter(Boolean);
      const msg = buildMessage("FLEET QUOTE", ref, [lines, [["Site", fd.get("loc")], ["Needed by", fd.get("by")], ["Hire length", fd.get("duration")], ["Notes", fd.get("note")]], contactRows(fd)], "Please confirm availability and send a combined quote.");
      handoff(ref, "Quote", `${shortlist.length} machines`, msg);
    });
  }

  function validate(form) {
    let first = null;
    $$("[required]", form).forEach(el => {
      const bad = !String(el.value).trim() || (el.name === "phone" && String(el.value).replace(/\D/g, "").length < 10);
      el.closest(".f")?.classList.toggle("err", bad); if (bad && !first) first = el;
    });
    if (first) { first.focus(); toast("Check the highlighted fields"); return false; }
    return true;
  }
  const remember = fd => store.set("ym-contact", { name: fd.get("name") || "", company: fd.get("company") || "", phone: fd.get("phone") || "", email: fd.get("email") || "" });
  const contactRows = fd => [["Name", fd.get("name")], ["Company", fd.get("company")], ["Phone", fd.get("phone")], ["Email", fd.get("email")], ["Buying as", fd.get("buyerType")]];
  function handoff(ref, kind, summary, message) {
    const reqs = store.get("ym-requests", []); reqs.unshift({ ref, kind, summary, message, at: new Date().toISOString() }); store.set("ym-requests", reqs.slice(0, 50));
    const url = waLink(message);
    $("#mRef").textContent = ref; $("#mMsg").textContent = message; $("#mOpen").href = url;
    $("#modal").hidden = false; $("#mOpen").focus();
    gtag("event", "whatsapp_click", { kind });
    if (MODE === "path" && location.hostname.endsWith(CFG.domain)) { try { window.open(url, "_blank", "noopener"); } catch (e) {} }
  }

  document.addEventListener("click", e => {
    const star = e.target.closest("[data-star]");
    if (star) {
      e.preventDefault(); const k = star.dataset.star, n = shortlist.indexOf(k);
      if (n >= 0) { shortlist.splice(n, 1); toast("Removed from shortlist"); } else { shortlist.push(k); toast("Saved to shortlist"); }
      store.set("ym-shortlist", shortlist); $("#slCount").textContent = shortlist.length;
      if (curPath()[0].startsWith("/shortlist")) return render();
      const on = shortlist.includes(k);
      $$(`[data-star="${k}"]`).forEach(b => { b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.innerHTML = ICON.star(on); });
      return;
    }
    if (MODE !== "path") return;
    const a = e.target.closest("a[href]");
    if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !u.pathname.startsWith(BASE) || /\.\w+$/.test(u.pathname)) return;
    e.preventDefault(); go(u.pathname + u.search);
  });
  window.addEventListener("popstate", () => render());
  window.addEventListener("hashchange", () => { if (MODE === "hash") { render(); window.scrollTo(0, 0); } });
  $("#menuBtn").addEventListener("click", () => { const n = $("#nav"); n.classList.toggle("open"); $("#menuBtn").setAttribute("aria-expanded", n.classList.contains("open")); });
  const close = () => { $("#modal").hidden = true; };
  $("#mClose").addEventListener("click", close);
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal") close(); });
  $("#mOpen").addEventListener("click", () => setTimeout(close, 400));
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  $("#mCopy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("#mMsg").textContent); toast("Message copied"); }
    catch (e) { const r = document.createRange(); r.selectNodeContents($("#mMsg")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Message selected. Copy it from your keyboard menu."); }
  });
  $("#fab").href = waLink(generalMessage());
  render();
}

root.YMApp = { route, setLoc: v => { state.loc = v; } };
if (IS_BROWSER) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot(); }
})(typeof window !== "undefined" ? window : globalThis);
