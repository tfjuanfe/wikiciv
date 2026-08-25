/**
 * CivCentral - logo concept generator (round 2).
 * Emits standalone SVGs for 5 distinct directions into docs/logo-concepts/v2/.
 * Run: node scripts/make-brand-concepts.cjs
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "docs", "logo-concepts", "v2");
fs.mkdirSync(OUT, { recursive: true });

/* ---------------------------------------------------------------- palette */
const P = {
  em: "#10B981",
  emLt: "#4ADE80",
  emPale: "#A7F3D0",
  emMid: "#059669",
  emDeep: "#047857",
  emDark: "#065F46",
  night: "#0B2E26",
  nightDeep: "#04150F",
  gold: "#FBBF24",
  goldLt: "#FDE68A",
  goldMid: "#F59E0B",
  goldDp: "#B45309",
  ink: "#0F172A",
  inkSoft: "#1E293B",
  cream: "#F5F7F4",
};

/* ------------------------------------------------------------- primitives */
const rad = (d) => (d * Math.PI) / 180;
const n = (v) => Number(v.toFixed(2));
const pt = (cx, cy, r, deg) => [n(cx + r * Math.cos(rad(deg))), n(cy + r * Math.sin(rad(deg)))];

/** Ring with a wedge removed on the right -> a geometric "C". */
function ringC(cx, cy, rOut, rIn, gapHalf) {
  const a0 = gapHalf;
  const a1 = 360 - gapHalf;
  const [ox0, oy0] = pt(cx, cy, rOut, a0);
  const [ox1, oy1] = pt(cx, cy, rOut, a1);
  const [ix1, iy1] = pt(cx, cy, rIn, a1);
  const [ix0, iy0] = pt(cx, cy, rIn, a0);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${ox0} ${oy0} A${rOut} ${rOut} 0 ${big} 1 ${ox1} ${oy1} L${ix1} ${iy1} A${rIn} ${rIn} 0 ${big} 0 ${ix0} ${iy0} Z`;
}

/** Isometric cube. cy = centre of the top rhombus. */
function cube(cx, cy, hw, th, bh) {
  return {
    top: `${cx},${cy - th} ${cx + hw},${cy} ${cx},${cy + th} ${cx - hw},${cy}`,
    left: `${cx - hw},${cy} ${cx},${cy + th} ${cx},${cy + th + bh} ${cx - hw},${cy + bh}`,
    right: `${cx + hw},${cy} ${cx},${cy + th} ${cx},${cy + th + bh} ${cx + hw},${cy + bh}`,
    hex: `${cx},${cy - th} ${cx + hw},${cy} ${cx + hw},${cy + bh} ${cx},${cy + th + bh} ${cx - hw},${cy + bh} ${cx - hw},${cy}`,
  };
}

/* ------------------------------------------------- modular block alphabet */
/* Skeletons on a 100-unit cap height, stroked at 22, chamfer 16.            */
/* Diagonal terminals overshoot the cap box and are cut flat by the clip: a butt
   cap on a slanted stroke leaves an angled notch, a clipped overshoot does not.
   Every horizontal bar centres on y=11 / y=89 so all bars carry full weight. */
const GLYPH = {
  C: { w: 78, d: "M65 11 L27 11 L11 27 L11 73 L27 89 L65 89" },
  I: { w: 24, d: "M11 0 L11 100" },
  V: { w: 78, d: "M5.2 -19.1 L38 89 L70.8 -19.1" },
  E: { w: 74, d: "M63 11 L11 11 L11 89 L63 89 M11 50 L54 50" },
  N: { w: 80, d: "M11 0 L11 100 M11 0 L67 100 M67 0 L67 100" },
  T: { w: 76, d: "M4 11 L72 11 M38 11 L38 100" },
  R: { w: 84, d: "M11 100 L11 11 L40 11 L56 27 L56 39 L40 55 L11 55 M36 55 L69.4 117.6" },
  A: { w: 96, d: "M4.73 119 L44 0 L83.27 119 M25 76 L63 76" },
  L: { w: 70, d: "M11 0 L11 89 L59 89" },
};
const KERN = { VC: -8, TR: -6, RA: -14, AL: -8, CE: -3, NT: -4 };
const TRACK = 14;
const WORD = "CIVCENTRAL";

function layout(word) {
  const pos = [];
  let x = 0;
  for (let i = 0; i < word.length; i++) {
    pos.push(x);
    x += GLYPH[word[i]].w;
    if (i < word.length - 1) x += TRACK + (KERN[word[i] + word[i + 1]] || 0);
  }
  return { pos, width: x };
}
const LAY = layout(WORD);
const wordWidth = (cap) => n((LAY.width * cap) / 100);

/**
 * Wordmark group. First three letters ("CIV") take colour a, the rest take b.
 * Layers are clipped to the cap box so miter spikes read as clean flat tops.
 */
function wordmark({ id, x, y, cap, a, b, extrude = null, faceGrad = false }) {
  const s = cap / 100;
  const strokes = (fill, dy = 0) =>
    WORD.split("")
      .map((ch, i) => {
        const col = typeof fill === "function" ? fill(i) : fill;
        return `<path d="${GLYPH[ch].d}" transform="translate(${n(LAY.pos[i])} ${dy})" stroke="${col}" stroke-width="22" fill="none" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10"/>`;
      })
      .join("");
  const clipTall = `${id}-ct`;
  const clipCap = `${id}-cc`;
  const ext = extrude ? `<g clip-path="url(#${clipTall})">${strokes(extrude.color, extrude.dy)}</g>` : "";
  const face = faceGrad
    ? strokes((i) => (i < 3 ? "url(#bw-ga)" : "url(#bw-gb)"))
    : strokes((i) => (i < 3 ? a : b));
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})">
    <clipPath id="${clipTall}"><rect x="-4" y="0" width="${LAY.width + 8}" height="${(extrude ? extrude.dy : 0) + 100}"/></clipPath>
    <clipPath id="${clipCap}"><rect x="-4" y="0" width="${LAY.width + 8}" height="100"/></clipPath>
    ${ext}
    <g clip-path="url(#${clipCap})">${face}</g>
  </g>`;
}

/* ------------------------------------------------------------- file shell */
function svg({ w, h, title, body, defs = "" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">
  <title>${title}</title>${defs ? `\n  <defs>${defs}\n  </defs>` : ""}
${body}
</svg>
`;
}
function write(name, contents) {
  fs.writeFileSync(path.join(OUT, name), contents);
  console.log("  " + name);
}

/* ================================================================ 01 CORE */
/* An extruded ring-"C" closing around a golden centre block.               */
const CORE = (() => {
  const cx = 60;
  const cy = 53;
  const rO = 42;
  const rI = 23;
  const ring = ringC(cx, cy, rO, rI, 26);
  const cb = cube(cx, cy - 8.5, 15, 8.5, 17);
  const defs = `
    <linearGradient id="c-face" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="${P.emLt}"/><stop offset="0.55" stop-color="${P.em}"/><stop offset="1" stop-color="${P.emMid}"/>
    </linearGradient>
    <linearGradient id="c-edge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.emDeep}"/><stop offset="1" stop-color="${P.emDark}"/>
    </linearGradient>`;
  const art = `
  <path d="${ring}" transform="translate(0 9)" fill="url(#c-edge)"/>
  <path d="${ring}" fill="url(#c-face)"/>
  <path d="M${n(cx - 29.7)} ${n(cy - 29.7)} A42 42 0 0 1 ${n(cx + 12)} ${n(cy - 40.2)}" fill="none" stroke="${P.emPale}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  <polygon points="${cb.left}" fill="${P.goldDp}"/>
  <polygon points="${cb.right}" fill="${P.goldMid}"/>
  <polygon points="${cb.top}" fill="${P.goldLt}"/>
  <polygon points="${cb.top}" fill="none" stroke="${P.gold}" stroke-width="1.5" stroke-linejoin="round" opacity="0.9"/>`;
  const mono = `
  <path d="${ring}" fill="currentColor"/>
  <polygon points="${cb.hex}" fill="currentColor"/>`;
  return { defs, art, mono };
})();

/* ============================================================== 02 BEACON */
/* The landmark at the centre of the map: a block casting a column of light. */
const BEACON = (() => {
  const cb = cube(60, 78, 19, 10.5, 18);
  const defs = `
    <linearGradient id="b-sky" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="${P.night}"/><stop offset="1" stop-color="${P.nightDeep}"/>
    </linearGradient>
    <radialGradient id="b-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${P.em}" stop-opacity="0.55"/><stop offset="1" stop-color="${P.em}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="b-beam" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${P.emPale}" stop-opacity="0.85"/>
      <stop offset="0.55" stop-color="${P.emLt}" stop-opacity="0.32"/>
      <stop offset="1" stop-color="${P.emLt}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="b-core" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="0.6" stop-color="${P.emPale}" stop-opacity="0.32"/>
      <stop offset="1" stop-color="${P.emPale}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="b-tile"><rect x="2" y="2" width="116" height="116" rx="28"/></clipPath>`;
  const art = `
  <rect x="2" y="2" width="116" height="116" rx="28" fill="url(#b-sky)"/>
  <g clip-path="url(#b-tile)">
    <ellipse cx="60" cy="84" rx="52" ry="38" fill="url(#b-glow)"/>
    <polygon points="50,79 70,79 80,2 40,2" fill="url(#b-beam)"/>
    <polygon points="55.5,79 64.5,79 68,2 52,2" fill="url(#b-core)"/>
    <polygon points="${cb.left}" fill="${P.goldDp}"/>
    <polygon points="${cb.right}" fill="${P.goldMid}"/>
    <polygon points="${cb.top}" fill="${P.goldLt}"/>
    <polygon points="41,78 60,88.5 79,78 60,67.5" fill="#FFFFFF" opacity="0.22"/>
  </g>
  <rect x="3.25" y="3.25" width="113.5" height="113.5" rx="26.75" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="2.5"/>`;
  /* Light cannot be a knockout at 16px - a hole in a tile just reads as an
     exclamation mark. Monochrome states the beam as diverging rays instead. */
  const mono = `
  <g stroke="currentColor" stroke-linecap="round" fill="none">
    <path d="M60 62 V22" stroke-width="10"/>
    <path d="M47 64 L36 30" stroke-width="8.5"/>
    <path d="M73 64 L84 30" stroke-width="8.5"/>
  </g>
  <polygon points="${cb.hex}" fill="currentColor"/>`;
  return { defs, art, mono };
})();

/* =========================================================== 04 INTERLOCK */
/* Two Cs threaded through one another - the CC monogram as a woven link.    */
const INTER = (() => {
  const c1 = ringC(46, 58, 38, 21, 28);
  const c2 = ringC(94, 58, 38, 21, 28);
  const defs = `
    <linearGradient id="i-a" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${P.emLt}"/><stop offset="0.6" stop-color="${P.em}"/><stop offset="1" stop-color="${P.emDeep}"/>
    </linearGradient>
    <linearGradient id="i-b" x1="0.2" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${P.gold}"/><stop offset="0.45" stop-color="${P.goldMid}"/><stop offset="1" stop-color="${P.goldDp}"/>
    </linearGradient>
    <clipPath id="i-low"><rect x="0" y="58" width="140" height="62"/></clipPath>
    <clipPath id="i-top"><rect x="0" y="0" width="140" height="58"/></clipPath>
    <mask id="i-m1"><rect width="140" height="120" fill="#fff"/><g clip-path="url(#i-top)"><path d="${c2}" fill="#000" stroke="#000" stroke-width="9"/></g></mask>
    <mask id="i-m2"><rect width="140" height="120" fill="#fff"/><g clip-path="url(#i-low)"><path d="${c1}" fill="#000" stroke="#000" stroke-width="9"/></g></mask>`;
  const art = `
  <path d="${c1}" fill="url(#i-a)"/>
  <g clip-path="url(#i-top)"><path d="${c2}" fill="${P.emDark}" opacity="0.4" transform="translate(-3 3)"/></g>
  <path d="${c2}" fill="url(#i-b)"/>
  <g clip-path="url(#i-low)">
    <path d="${c1}" fill="${P.goldDp}" opacity="0.35" transform="translate(3 -3)"/>
    <path d="${c1}" fill="url(#i-a)"/>
  </g>`;
  const mono = `
  <path d="${c1}" fill="currentColor" mask="url(#i-m1)"/>
  <path d="${c2}" fill="currentColor" mask="url(#i-m2)"/>`;
  return { defs, art, mono };
})();

/* ============================================================ 05 STANDARD */
/* A hung banner - every civilisation flies one; the archive keeps them all. */
const STANDARD = (() => {
  const cloth = "M28 25 H92 V100 L60 82 L28 100 Z";
  const cS = 0.48;
  const cW = 65 * cS;
  const cx0 = n(60 - cW / 2);
  const cy0 = 33.5;
  const letter = (col) =>
    `<g transform="translate(${cx0} ${cy0}) scale(${cS})"><path d="${GLYPH.C.d}" stroke="${col}" stroke-width="22" fill="none" stroke-linejoin="miter" stroke-miterlimit="10"/></g>`;
  const defs = `
    <linearGradient id="s-cloth" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${P.emDeep}"/><stop offset="0.12" stop-color="${P.em}"/>
      <stop offset="0.28" stop-color="${P.emDeep}"/><stop offset="0.42" stop-color="${P.em}"/>
      <stop offset="0.5" stop-color="${P.emLt}"/><stop offset="0.6" stop-color="${P.em}"/>
      <stop offset="0.74" stop-color="${P.emDeep}"/><stop offset="0.88" stop-color="${P.em}"/>
      <stop offset="1" stop-color="${P.emDark}"/>
    </linearGradient>
    <linearGradient id="s-rod" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.goldLt}"/><stop offset="0.5" stop-color="${P.gold}"/><stop offset="1" stop-color="${P.goldDp}"/>
    </linearGradient>
    <linearGradient id="s-shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#00110C" stop-opacity="0.45"/><stop offset="1" stop-color="#00110C" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="s-clip"><path d="${cloth}"/></clipPath>
    <mask id="s-mask"><rect width="120" height="120" fill="#fff"/>${letter("#000")}</mask>`;
  const art = `
  <path d="${cloth}" transform="translate(3 4)" fill="${P.ink}" opacity="0.16"/>
  <path d="${cloth}" fill="url(#s-cloth)" mask="url(#s-mask)"/>
  <g clip-path="url(#s-clip)"><rect x="28" y="25" width="64" height="15" fill="url(#s-shade)"/></g>
  <rect x="14" y="16" width="92" height="9" rx="4.5" fill="url(#s-rod)"/>
  <circle cx="14" cy="20.5" r="6.5" fill="url(#s-rod)"/>
  <circle cx="106" cy="20.5" r="6.5" fill="url(#s-rod)"/>
  <circle cx="11.6" cy="18.2" r="1.9" fill="${P.goldLt}" opacity="0.9"/>`;
  const mono = `
  <path d="${cloth}" fill="currentColor" mask="url(#s-mask)"/>
  <rect x="14" y="16" width="92" height="9" rx="4.5" fill="currentColor"/>
  <circle cx="14" cy="20.5" r="6.5" fill="currentColor"/>
  <circle cx="106" cy="20.5" r="6.5" fill="currentColor"/>`;
  return { defs, art, mono };
})();

/* ------------------------------------------------------------ emit files */
/* Required as a module by make-brand-assets.cjs, which reuses the alphabet. */
module.exports = { P, GLYPH, KERN, TRACK, WORD, LAY, wordWidth, wordmark, svg, ringC, cube };

if (require.main !== module) return;

const CONCEPTS = [
  { slug: "01-core", name: "Core", icon: CORE, iw: 120 },
  { slug: "02-beacon", name: "Beacon", icon: BEACON, iw: 120 },
  { slug: "04-interlock", name: "Interlock", icon: INTER, iw: 140 },
  { slug: "05-standard", name: "Standard", icon: STANDARD, iw: 120 },
];

console.log("Writing concepts to docs/logo-concepts/v2/");

for (const c of CONCEPTS) {
  write(
    `${c.slug}-icon.svg`,
    svg({ w: c.iw, h: 120, title: `CivCentral - ${c.name} icon`, defs: c.icon.defs, body: c.icon.art })
  );
  write(
    `${c.slug}-mono.svg`,
    svg({
      w: c.iw,
      h: 120,
      title: `CivCentral - ${c.name} monochrome`,
      defs: c.icon.mono.includes("mask=") ? c.icon.defs : "",
      body: `  <g color="${P.ink}">${c.icon.mono}\n  </g>`,
    })
  );

  const cap = 42;
  const gapX = 26;
  const lw = c.iw + gapX + wordWidth(cap) + 6;
  const variants = [
    ["lockup", P.em, P.ink],
    ["lockup-dark", P.emLt, P.cream],
  ];
  for (const [suffix, a, b] of variants) {
    write(
      `${c.slug}-${suffix}.svg`,
      svg({
        w: n(lw),
        h: 120,
        title: `CivCentral - ${c.name} lockup`,
        defs: c.icon.defs,
        body: `  ${c.icon.art}\n  ${wordmark({ id: `${c.slug}-${suffix}`, x: c.iw + gapX, y: 60 - cap / 2, cap, a, b })}`,
      })
    );
  }
}

/* 03 Blockwork is wordmark-led: its icon is the C cut from the same face. */
{
  const cap = 96;
  const ext = 11;
  const pad = 14;
  const ww = wordWidth(cap);
  /* userSpaceOnUse over the cap box: an objectBoundingBox gradient is scaled to
     each letter's own bbox, so every glyph shades over a different range - and
     the I, whose bbox is a zero-width line, loses its gradient entirely. */
  const grads = (bStops, aStops) => `
    <linearGradient id="bw-ga" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">${aStops}</linearGradient>
    <linearGradient id="bw-gb" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">${bStops}</linearGradient>`;
  const aLight = `<stop offset="0" stop-color="${P.emLt}"/><stop offset="1" stop-color="${P.emMid}"/>`;
  const aDark = `<stop offset="0" stop-color="#86EFAC"/><stop offset="1" stop-color="${P.em}"/>`;
  const bLight = `<stop offset="0" stop-color="${P.inkSoft}"/><stop offset="1" stop-color="${P.ink}"/>`;
  const bDark = `<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C7D2CB"/>`;
  /* One light source, one material: the whole word is cut from the same stone
     and every letter shows the same green cut face. */
  const body = (extA, extB) =>
    "  " +
    wordmark({
      id: "bw",
      x: pad,
      y: 14,
      cap,
      a: P.em,
      b: P.ink,
      extrude: { color: (i) => (i < 3 ? extA : extB), dy: ext },
      faceGrad: true,
    });

  write(
    "03-blockwork-lockup.svg",
    svg({ w: n(ww + pad * 2), h: 136, title: "CivCentral - Blockwork wordmark", defs: grads(bLight, aLight), body: body(P.emDark, P.emDark) })
  );
  write(
    "03-blockwork-lockup-dark.svg",
    svg({ w: n(ww + pad * 2), h: 136, title: "CivCentral - Blockwork wordmark on dark", defs: grads(bDark, aDark), body: body(P.emDeep, P.emDeep) })
  );
  write(
    "03-blockwork-mono.svg",
    svg({
      w: n(ww + pad * 2),
      h: 136,
      title: "CivCentral - Blockwork monochrome",
      body: `  <g color="${P.ink}">${wordmark({ id: "bwm", x: pad, y: 18, cap, a: "currentColor", b: "currentColor" })}\n  </g>`,
    })
  );

  /* C ink runs 0..65 wide; the skeleton's x=11 is a stroke inset, not an edge. */
  const s = 0.72;
  const lx = 60 - (65 * s) / 2;
  const ly = 60 - (100 * s + 13) / 2;
  const glyph = (col, dy) =>
    `<g transform="translate(${n(lx)} ${n(ly + dy)}) scale(${s})"><path d="${GLYPH.C.d}" stroke="${col}" stroke-width="22" fill="none" stroke-linejoin="miter" stroke-miterlimit="10"/></g>`;
  write(
    "03-blockwork-icon.svg",
    svg({
      w: 120,
      h: 120,
      title: "CivCentral - Blockwork icon",
      defs: `
    <linearGradient id="bwi" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#16211B"/><stop offset="1" stop-color="#080F0C"/></linearGradient>
    <linearGradient id="bwc" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#6EE7A8"/><stop offset="1" stop-color="${P.em}"/></linearGradient>`,
      body: `  <rect x="2" y="2" width="116" height="116" rx="26" fill="url(#bwi)"/>
  <rect x="3.25" y="3.25" width="113.5" height="113.5" rx="26.75" fill="none" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="2.5"/>
  ${glyph(P.emDark, 13)}
  ${glyph("url(#bwc)", 0)}`,
    })
  );
}

console.log("Done.");
