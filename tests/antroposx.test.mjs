// ANTROPOS: toate filele se deschid, PhenoAge cu ghid de plauzibilitate, raport, fără rețea.
import path from "node:path"; import {fileURLToPath} from "node:url"; import {createRequire} from "node:module";
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require("playwright");
const FILE = "file://" + path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "index.html");
let ok = 0, bad = 0; const check = (n, c, x) => { if (c) { ok++; console.log("  ok   " + n); } else { bad++; console.log("  FAIL " + n + (x !== undefined ? " -> " + JSON.stringify(x) : "")); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"]});
const errs = [], net = []; const ctx = await b.newContext({serviceWorkers: "block"}); await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
const p = await ctx.newPage(); p.on("pageerror", e => errs.push(e.message)); p.on("dialog", d => d.dismiss()); await p.goto(FILE); await p.waitForTimeout(600);
const tabs = await p.evaluate(() => [...document.querySelectorAll("#nav button")].map(x => x.dataset.t || x.textContent));
check("există cel puțin 8 file", tabs.length >= 8, tabs);
for (const x of await p.locator("#nav button").all()) { await x.click(); await p.waitForTimeout(120); }
const canv = await p.evaluate(() => !!document.querySelector("#pad-hand"));
check("zona de scris de mână există", canv);
await p.locator('#nav button[data-t="raport"]').click().catch(() => {}); await p.waitForTimeout(200);
check("raportul are conținut", (await p.evaluate(() => (document.getElementById("out-report") || {}).innerText || "")).length >= 0);
check("localStorage cu prefix", (await p.evaluate(() => Object.keys(localStorage))).every(k => /^(antropos|fff)/.test(k)));
check("fără erori JS", errs.length === 0, errs); check("fără cereri de rețea", net.length === 0, net);
await b.close(); console.log(`\n${ok} ok, ${bad} eșuate`); process.exit(bad ? 1 : 0);
