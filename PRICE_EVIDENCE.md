# Block, brick, interlock and paver machine prices

Checked 20 October 2026. Selling prices are taken from the Buildocrat Nigeria Construction Rate Book (`github.com/alpontif/buildocrat-rate-book`, `rate-data.json`, published at [rates.buildocrat.store](https://rates.buildocrat.store/)). Yellowmetal’s copy of those entries already matched the Rate Book, so the naira amounts in `data/rate-data.json` were not changed.

The page price is the Rate Book Abuja figure times the Rate Book Lagos materials factor (1.06). VAT stays excluded, as the pages already say (“Excludes VAT, duty clearing and delivery unless stated”). Jiji, dealer sites and FOB quotes are cross-checks only. Where they disagree, the Rate Book price is kept and the disagreement is flagged. No price was invented.

## What was wrong

On the hydraulic electric block machine page, the title said **₦8.5m** while the meta description, FAQ and body already said **₦8,480,000** (Rate Book ₦8,000,000 × 1.06, rounded in the title). JSON-LD quoted the Abuja range **₦7,000,000–₦9,000,000**, not the Lagos range **₦7,420,000–₦9,540,000** shown in the body, and it had no typical `price`.

**₦583,000** is not that machine’s price. It is the Lagos price of the locally fabricated 2-block machine (M-EQ-BM2, Rate Book ₦550,000 × 1.06). Every other block-machine page lists that machine first under Compare, so ₦583,000 appears on those pages next to a different product. The same figure is also the low end of the electric vibrating machine’s range, because that Rate Book low (₦550,000) equals M-EQ-BM2’s rate. The eight machines do not share one selling price.

The same JSON-LD gap (Abuja low/high, no typical price, rounded title) was on every buy page. The template now writes the Lagos typical price and Lagos range into the title, Open Graph, Twitter and JSON-LD, matching the body. Catalogue downloads stay on the Abuja Rate Book base.

## Method

Proposed selling price = Rate Book `r` (or the dollar build-up, where the entry has no `r`) × 1.06, rounded to the naira. That is the figure now shared by the title, meta description, JSON-LD `price` and the body. The range is Rate Book `lo`–`hi` × 1.06.

## Price table

| Item | Old prices (where they appeared) | Proposed price (Lagos, ex-VAT) | Sources | Confidence |
| --- | --- | --- | --- | --- |
| Block moulding machine, locally fabricated (2 blocks per drop). M-EQ-BM2 | Title ₦583k. Meta, FAQ, body and panel ₦583,000 (range ₦477,000–₦689,000). JSON-LD low/high 450000/650000, no typical price. Catalogue (Abuja) ₦550,000 (₦450,000–₦650,000). This ₦583,000 is the figure repeated on other machines’ Compare cards. | ₦583,000 (range ₦477,000–₦689,000). Unchanged selling price; title and JSON-LD now match the body. | 3 | Medium |
| Electric vibrating block machine 6"/9", locally fabricated. M-EQ-BMEL | Title ₦689k. Meta, FAQ, body and panel ₦689,000 (range ₦583,000–₦795,000). JSON-LD low/high 550000/750000, no typical price. Catalogue (Abuja) ₦650,000 (₦550,000–₦750,000). | ₦689,000 (range ₦583,000–₦795,000). Unchanged selling price; title and JSON-LD now match the body. | 3 | Medium. Flag: the ₦583,000 low is M-EQ-BM2’s rate, not a copied selling price. |
| Egg-laying (mobile) block machine, Nigerian fabricated (~1,000 blocks/day). M-EQ-BMEGG | Title ₦954k. Meta, FAQ, body and panel ₦954,000 (range ₦848,000–₦1,272,000). JSON-LD low/high 800000/1200000, no typical price. Catalogue (Abuja) ₦900,000 (₦800,000–₦1,200,000). | ₦954,000 (range ₦848,000–₦1,272,000). Unchanged selling price; title and JSON-LD now match the body. | 4 | Medium on the Rate Book. Flag: new Jiji egg-layers seen the same day are ₦1.3m–₦2.2m, above this line. Left for the owner. |
| Block moulding line FT4-5 / mobile type (~3,000 blocks/day). M-EQ-BMFT | Title ₦5.5m. Meta, FAQ, body and panel ₦5,512,000 (range ₦4,134,000–₦6,890,000). JSON-LD low/high 3900000/6500000, no typical price. Catalogue (Abuja) ₦5,200,000 (₦3,900,000–₦6,500,000). | ₦5,512,000 (range ₦4,134,000–₦6,890,000). Unchanged selling price; title and JSON-LD now match the body. | 3 | Medium |
| Hydraulic electric block machine. M-EQ-BMHY | Title and social titles ₦8.5m. Meta, FAQ, body table and buy panel ₦8,480,000 (range ₦7,420,000–₦9,540,000). JSON-LD low/high 7000000/9000000, no typical price. Catalogue (Abuja) ₦8,000,000 (₦7,000,000–₦9,000,000). Compare on this page also shows M-EQ-BM2 at ₦583,000. | ₦8,480,000 (range ₦7,420,000–₦9,540,000). Unchanged selling price. Title, meta, JSON-LD `price` 8480000 and body now all say ₦8,480,000. | 4 | Medium on the Rate Book. Flag: a smaller Jiji “ST4 hydraulic” is ₦2,500,000, and a 2026 rewrite of the guide says ₦5m–₦6m. Left at the Rate Book. |
| Fully automatic block and brick machine (small line). M-EQ-BMAUT | Title ₦18m. Meta, FAQ, body and panel ₦18,020,000 (range ₦16,960,000–₦19,080,000). JSON-LD low/high 16000000/18000000, no typical price. Catalogue (Abuja) ₦17,000,000 (₦16,000,000–₦18,000,000). | ₦18,020,000 (range ₦16,960,000–₦19,080,000). Unchanged selling price; title and JSON-LD now match the body. | 3 | Medium |
| Automatic block and paver plant QT10-15 with pan mixer and stacker, new Chinese. M-EQ-QT10 | Title ₦119m. Meta, FAQ, body and panel ₦118,690,320 (range ₦94,952,256–₦142,428,384). JSON-LD low/high 89577600/134366400, no typical price. Catalogue (Abuja) ₦111,972,000 (₦89,577,600–₦134,366,400), from US$60,000 FOB × 1.4 × ₦1,333. | ₦118,690,320 (range ₦94,952,256–₦142,428,384). Unchanged selling price; title and JSON-LD now match the body. | 4 | Low. Flag: published FOB quotes for a QT10-15 host run about US$25,000–US$69,000. US$60,000 is inside that band and this line includes a mixer and stacker, but it is still a desk estimate. |
| Pan mixer JS500 / JQ350 for block plant, new. M-EQ-PANMX | Title ₦7.9m. Meta, FAQ, body and panel ₦7,912,688 (range ₦6,330,150–₦9,495,226). JSON-LD low/high 5971840/8957760, no typical price. Catalogue (Abuja) ₦7,464,800, from US$4,000 FOB × 1.4 × ₦1,333. | ₦7,912,688 (range ₦6,330,150–₦9,495,226). Unchanged selling price; title and JSON-LD now match the body. | 3 | Low. Flag: JS500 twin-shaft FOB quotes seen the same day are about US$5,000–US$6,700, above the Rate Book’s US$4,000. JQ350 would be a smaller mixer. The Rate Book prices them as one line, so they were not split. |
| Asphalt paver (CAT AP-1000/Vogele), foreign used. M-EQ-PAVU | Title ₦265m. Meta and body ₦265,000,000 (range ₦153,700,000–₦296,800,000). JSON-LD low/high 145000000/280000000, no typical price. Catalogue (Abuja) ₦250,000,000 (₦145,000,000–₦280,000,000). | ₦265,000,000 (range ₦153,700,000–₦296,800,000). Unchanged selling price; title and JSON-LD now match the body. | 2 | Medium (Rate Book). Not a block or interlock paver. |
| Asphalt paver 9m, new Chinese (XCMG RP903/SANY). M-EQ-PAVN | Title ₦336m. Meta and body ₦336,289,240 (range ₦269,031,392–₦403,547,088). JSON-LD low/high 253803200/380704800, no typical price. Catalogue (Abuja) ₦317,254,000, from US$170,000 FOB × 1.4 × ₦1,333. | ₦336,289,240 (range ₦269,031,392–₦403,547,088). Unchanged selling price; title and JSON-LD now match the body. | 1 | Low (Rate Book desk estimate). No extra FOB cross-check was used to move it. Not a block or interlock paver. |
| Vibrating block machine (petrol), hire. P-BLM | Title ₦25k/day. Meta and JSON-LD all-in ₦25,487/day (Lagos). Dry hire on the page ₦15,750. Catalogue (Abuja) dry ₦15,000 (₦10,000–₦20,000). | ₦25,487 per day all-in in Lagos. Not changed. Hire JSON-LD already used the Lagos plant factor. | 1 | Low (Rate Book source is “Judgement”). |

## Sources

Seen 20 October 2026 unless noted.

1. Rate Book block-machine hub, updated 15 October 2026: [rates.buildocrat.store/prices/block-making-machines/](https://rates.buildocrat.store/prices/block-making-machines/). Codes M-EQ-BM2, M-EQ-BMEL, M-EQ-BMEGG, M-EQ-BMFT, M-EQ-BMHY, M-EQ-BMAUT, M-EQ-QT10, M-EQ-PANMX. Raw entry: [rate-data.json](https://github.com/alpontif/buildocrat-rate-book/blob/main/rate-data.json).
2. Nigerian Search Guide, “Cost of block moulding machines in Nigeria (2026)”, the source named on those six Rate Book lines: [nigeriansearchguide.com/block-moulding-machine-costs-in-nigeria/](https://nigeriansearchguide.com/block-moulding-machine-costs-in-nigeria/). Locally fabricated ₦450,000–₦650,000; electric 6"/9" ₦550,000–₦750,000; Nigerian egg-layer ₦800,000–₦1,000,000 (a second “multi-functional” line on the same page is ₦850,000–₦1,200,000); FT4-5 complete line ₦3,900,000–₦6,500,000; hydraulic electric ₦7,000,000–₦9,000,000; fully automatic ₦16,000,000–₦18,000,000. The Rate Book midpoint matches these bands.
3. Jiji.ng listings open on 20 October 2026:
   - Egg-layer, new, Olatech, ₦1,300,000, about 1,500 blocks in 8 hours: [jiji.ng listing](https://jiji.ng/ilorin-east/manufacturing-equipments/egg-laying-block-making-machine-kmxy7rmiUosnNlMJ9Y9FtAua.html)
   - Egg-lay, new, Bigway, ₦1,650,000, about 2,000 blocks/day: [jiji.ng listing](https://jiji.ng/ifako-ijaiye/manufacturing-equipments/egg-lay-concrete-block-moulding-machine-wBbZPJxrno93l8bgJ0LmO8rp.html)
   - FT100 mobile egg-layer, Foretech, ₦2,200,000, about 1,500 blocks/day: [jiji.ng listing](https://jiji.ng/karu-nasarawa/manufacturing-equipments/ft100-concrete-mobile-egg-laying-block-molding-machine-kHZtWNXYIIAak68MTGr9JfG0.html)
   - Diesel egg-layer, S.A.M NIG LTD, ₦1,800,000, 1,000–1,500 blocks in 8 hours: [jiji.ng listing](https://jiji.ng/ilorin-south/manufacturing-equipments/diesel-engine-block-making-machine-cqI4CZ2JNW6HBq8JJNYi1nOu.html)
   - ST4, described as hydraulic, new, 2 of 9-inch or 3 of 6-inch per cycle, about 1,500 blocks/day, ₦2,500,000: [jiji.ng listing](https://jiji.ng/epe/manufacturing-equipments/st4-block-making-machine-heCEeiWBO3erDJopo3CRjrc0.html)
   - Category page also showed an FT300 / QMY4-45D at ₦3,500,000 (about 3,000 blocks/day) and a QT4-35 line at ₦20,000,000: [jiji.ng/301-concrete-block-machines](https://jiji.ng/301-concrete-block-machines)
4. Nigerian Tech, “Cost of block moulding machines in Nigeria (2026)”, a different write-up of the same topic, seen 20 October 2026. It puts hydraulic electric at ₦5,000,000–₦6,000,000 and fully automatic at ₦14,000,000–₦16,000,000: [nigeriantech.com.ng/cost-of-block-moulding-machines-in-nigeria-2026/](https://nigeriantech.com.ng/cost-of-block-moulding-machines-in-nigeria-2026/). Used only as a cross-check against the Rate Book’s cited guide.
5. QT10-15 FOB, seen 20 October 2026: Made-in-China host US$25,000–US$31,000 ([listing](https://lyxinming.en.made-in-china.com/product/DfzYAGxvBJpq/China-Qt10-15-Block-Making-Machine-10PCS-Per-10-15s-Cycle.html)); Shandong Shiyue US$34,000–US$49,000 ([shandongshiyue.com](https://shandongshiyue.com/)); Diytrade / Dongyue US$69,000 FOB Qingdao, page last online 2 March 2026 ([listing](https://www.diytrade.com/china/pd/5223147/QT10_15_Block_Machine_Block_making_machine_cement_block_machine.html)).
6. JS500 twin-shaft FOB, seen 20 October 2026: Tradewheel US$5,000–US$5,200 ([listing](https://www.tradewheel.com/p/js500-concrete-mixer-1090198/)); Camelway US$5,000–US$6,500 ([page](https://www.camelwaygroup.com/concrete-mixer/twin-shaft-mixer/js500-concrete-mixer.html)).
7. Asphalt pavers: [rates.buildocrat.store/prices/road-construction-equipment/](https://rates.buildocrat.store/prices/road-construction-equipment/), codes M-EQ-PAVU and M-EQ-PAVN. M-EQ-PAVU’s Rate Book note is Jiji.ng asphalt listings checked 1 October 2026, tokunbo CAT/Vögele ₦145m–₦280m (Abuja).
8. Hire: [rates.buildocrat.store/plant/](https://rates.buildocrat.store/plant/), code P-BLM, dry ₦15,000/day in Abuja.

## No Rate Book entry

The site has no separate listing for a manual-only machine beyond M-EQ-BM2, and none for QT4, QT6, QT8, QT12, or a dedicated interlocking-brick machine. Those were not given a price.

Hire lines checked and left as they are, because their JSON-LD price already matches the Lagos all-in body price: asphalt paver (tracked), P-PAV; slipform concrete paver, P-SFP. They are road pavers, not block or interlock machines.

## What changed in the build

`src/app.js` puts the exact Lagos price in each buy-page title. `build.mjs` writes that same price, and the Lagos low and high, into JSON-LD. Product photos, `photos.json` and non-price copy were not edited.
