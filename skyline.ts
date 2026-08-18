// skyline.ts: one building per week, one lit window per contribution.
// Reads weekly.csv (week,n) produced by skyline.sql and writes skyline.svg. No dependencies.
const weekly = (await Bun.file("weekly.csv").text())
  .split("\n").filter(Boolean)
  .map(l => { const [w, n] = l.split(","); return { w, n: +n }; });

// deterministic pseudo-random so the render is stable between runs
const rnd = (i: number, salt = 0) => { const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453; return x - Math.floor(x); };

const H = 250, ground = 214, gap = 2, pitch = 3, win = 2, marginX = 12;
const ks = [3, 4, 3, 5, 4, 3, 4, 5, 3, 4];               // windows per floor, varies the widths
const bl = weekly.map((r, i) => {
  const k = ks[i % ks.length];
  const bw = 3 + k * pitch;
  const floors = r.n === 0 ? 0 : Math.ceil(r.n / k);
  return { ...r, k, bw, floors, i };
});
const maxFloors = Math.max(...bl.map(b => b.floors), 1);
const fp = Math.max(2, Math.min(pitch, Math.floor(150 / maxFloors)));   // floor pitch; tallest building stays around 150px
const wh = fp - 1;
const totalW = bl.reduce((s, b) => s + b.bw + gap, 0) - gap;
const W = Math.max(900, totalW + marginX * 4);
let x = Math.round((W - totalW) / 2);

let buildings = "", windows = "";
for (const b of bl) {
  if (b.floors > 0) {
    const h = b.floors * fp + 2, y = ground - h;
    buildings += `<rect class="b" x="${x}" y="${y}" width="${b.bw}" height="${h}"/>`;
    if (rnd(b.i, 1) > 0.7) buildings += `<rect class="b" x="${x + Math.floor(b.bw / 2) - 1}" y="${y - 4}" width="2" height="4"/>`;
    let left = b.n;
    for (let f = 0; f < b.floors && left > 0; f++) {
      for (let c = 0; c < b.k && left > 0; c++, left--) {
        const op = 0.55 + 0.45 * rnd(b.i * 131 + f * 17 + c, 2);
        windows += `<rect class="w" x="${x + 2 + c * pitch}" y="${y + 2 + f * fp}" width="${win}" height="${wh}" opacity="${op.toFixed(2)}"/>`;
      }
    }
  }
  x += b.bw + gap;
}
// Fernsehturm, behind the buildings
const tx = Math.round(W * 0.62), th = 175, ty = ground - th;
const tower = `<g class="b"><rect x="${tx - 1}" y="${ty}" width="3" height="${th}"/><circle cx="${tx + 0.5}" cy="${ty + 44}" r="9"/><rect x="${tx - 5}" y="${ty + 56}" width="11" height="3"/><rect x="${tx - 3}" y="${ty + 62}" width="7" height="2"/></g>`;
const towerLight = `<circle class="w" cx="${tx + 0.5}" cy="${ty + 44}" r="1.2" opacity="0.9"/>`;
let stars = "";
for (let i = 0; i < 60; i++) { const sx = 10 + rnd(i, 3) * (W - 20), sy = 8 + rnd(i, 4) * 120; stars += `<circle class="s" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(0.5 + rnd(i, 5) * 0.7).toFixed(2)}"/>`; }
const moon = `<g class="moon"><circle class="m" cx="${W - 70}" cy="38" r="9"/><circle class="sky2" cx="${W - 66}" cy="35" r="8"/></g>`;

const first = weekly[0].w.slice(0, 7), last = weekly.at(-1)!.w.slice(0, 7);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Skyline: one building per week, one lit window per contribution">
<style>
  :root { --sky1:#eaf0f6; --sky2:#f6f8fa; --b:#3d444d; --w:#40c463; --g:#d0d7de; --t:#57606a; --s:transparent; --m:#c9d1d9; --moon:none; }
  @media (prefers-color-scheme: dark) { :root { --sky1:#0b0f16; --sky2:#161b22; --b:#2a3237; --w:#39d353; --g:#30363d; --t:#8b949e; --s:#c9d1d9; --m:#c9d1d9; --moon:inline; } }
  .sky2{fill:var(--sky2)} .b{fill:var(--b)} .w{fill:var(--w)} .s{fill:var(--s);opacity:.6} .m{fill:var(--m)} .moon{display:var(--moon)}
  .g{stroke:var(--g)} text{font:10px ui-monospace,SFMono-Regular,Menlo,monospace;fill:var(--t)}
</style>
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky1)"/><stop offset="1" stop-color="var(--sky2)"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#sky)" rx="6"/>
${stars}${moon}${tower}${buildings}${windows}${towerLight}
<line class="g" x1="0" x2="${W}" y1="${ground + 0.5}" y2="${ground + 0.5}"/>
<text x="${marginX}" y="${H - 10}">one lit window = one contribution, past 12 months</text>
<text x="${W - marginX}" y="${H - 10}" text-anchor="end">${first} to ${last}</text>
</svg>`;
await Bun.write("skyline.svg", svg);
console.log(`skyline.svg: ${weekly.length} weeks, ${weekly.reduce((s, r) => s + r.n, 0)} windows`);
