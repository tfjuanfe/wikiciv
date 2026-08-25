/**
 * CivCentral - site brand assets, built from the Blockwork logo.
 *
 * Emits the vector masters into public/ and rasterises the PNGs the app and
 * the platforms (favicon, Discord) actually load. The letterforms come from
 * make-brand-concepts.cjs so there is a single source of truth for the shape.
 *
 * Run: node scripts/make-brand-assets.cjs
 */
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { P, GLYPH, LAY, wordmark, svg } = require("./make-brand-concepts.cjs");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BRAND = path.join(PUBLIC, "brand");
const APPDIR = path.join(ROOT, "src", "app");
fs.mkdirSync(BRAND, { recursive: true });

const n = (v) => Number(v.toFixed(2));

/* ------------------------------------------------------------- wordmark */
/* Tight crop: the cap box plus the 11-unit extrusion, with a small margin,
   so the header can size it by height without hauling empty space around. */
const PAD = 5;
const EXT = 11;
const W = LAY.width + PAD * 2;
const H = 100 + EXT + PAD * 2;

const GRAD = {
  light: {
    a: `<stop offset="0" stop-color="${P.emLt}"/><stop offset="1" stop-color="${P.emMid}"/>`,
    b: `<stop offset="0" stop-color="${P.inkSoft}"/><stop offset="1" stop-color="${P.ink}"/>`,
    ext: P.emDark,
  },
  dark: {
    a: `<stop offset="0" stop-color="#86EFAC"/><stop offset="1" stop-color="${P.em}"/>`,
    b: `<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C7D2CB"/>`,
    ext: P.emDeep,
  },
};

function logoSvg(mode) {
  const g = GRAD[mode];
  return svg({
    w: n(W),
    h: n(H),
    title: mode === "dark" ? "CivCentral (for dark backgrounds)" : "CivCentral",
    defs: `
    <linearGradient id="bw-ga" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">${g.a}</linearGradient>
    <linearGradient id="bw-gb" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">${g.b}</linearGradient>`,
    body:
      "  " +
      wordmark({
        id: "bw",
        x: PAD,
        y: PAD,
        cap: 100,
        a: P.em,
        b: P.ink,
        extrude: { color: g.ext, dy: EXT },
        faceGrad: true,
      }),
  });
}

/* ----------------------------------------------------------- app marks */
/* The C from the same alphabet, extruded on a dark tile. `rx` 0 gives the
   full-bleed square Discord crops to a circle. */
function markSvg({ rx, scale, title }) {
  /* C ink spans local x 0..65 and y 0..100 (the skeleton is inset by half the
     stroke, so it is not the ink edge). Nudge up by half the extrusion so the
     solid plus its cut face reads centred. */
  const s = scale;
  const ext = 13 * (s / 0.72);
  const lx = 60 - (65 * s) / 2;
  const ly = 60 - (100 * s + ext) / 2;
  const glyph = (col, dy) =>
    `<g transform="translate(${n(lx)} ${n(ly + dy)}) scale(${s})"><path d="${GLYPH.C.d}" stroke="${col}" stroke-width="22" fill="none" stroke-linejoin="miter" stroke-miterlimit="10"/></g>`;
  const inset = rx > 0 ? 2 : 0;
  const size = 120 - inset * 2;
  return svg({
    w: 120,
    h: 120,
    title,
    defs: `
    <linearGradient id="bwi" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#16211B"/><stop offset="1" stop-color="#080F0C"/></linearGradient>
    <linearGradient id="bwc" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#6EE7A8"/><stop offset="1" stop-color="${P.em}"/></linearGradient>`,
    body: `  <rect x="${inset}" y="${inset}" width="${size}" height="${size}" rx="${rx}" fill="url(#bwi)"/>${
      rx > 0
        ? `\n  <rect x="3.25" y="3.25" width="113.5" height="113.5" rx="${rx - 1.25}" fill="none" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="2.5"/>`
        : ""
    }
  ${glyph(P.emDark, ext)}
  ${glyph("url(#bwc)", 0)}`,
  });
}

/* ------------------------------------------------------------ raster */
/* resvg honours the SVG's width/height, so render at the target size rather
   than scaling a small bitmap up. */
async function renderPng(svgText, w, h) {
  const sized = svgText.replace(/width="[\d.]+" height="[\d.]+"/, `width="${w}" height="${h}"`);
  const img = await loadImage(Buffer.from(sized, "utf8"));
  const canvas = createCanvas(w, h);
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return canvas.toBuffer("image/png");
}

async function png(svgText, w, h, out) {
  fs.writeFileSync(out, await renderPng(svgText, w, h));
  console.log(`  ${path.relative(ROOT, out).replace(/\\/g, "/")}  ${w}x${h}`);
}

/* ICO container holding PNG-encoded entries (supported since Vista). Note the
   App Router serves app/icon.png at /icon.png, which would shadow the footer's
   public/icon.png - favicon.ico has no such collision. */
function icoWrap(entries) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o);
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(e.png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.png.length;
  });
  return Buffer.concat([head, dir, ...entries.map((e) => e.png)]);
}

function writeSvg(out, text) {
  fs.writeFileSync(out, text);
  console.log(`  ${path.relative(ROOT, out).replace(/\\/g, "/")}`);
}

(async () => {
  const light = logoSvg("light");
  const dark = logoSvg("dark");
  const tile = markSvg({ rx: 26, scale: 0.72, title: "CivCentral mark" });
  const disc = markSvg({ rx: 0, scale: 0.7, title: "CivCentral Discord icon" });

  /* Raster height 180 keeps the wordmark near 5x its rendered header size. */
  const LOGO_H = 180;
  const LOGO_W = Math.round((W / H) * LOGO_H);

  console.log("Vector masters");
  writeSvg(path.join(PUBLIC, "logo.svg"), light);
  writeSvg(path.join(PUBLIC, "logo-dark.svg"), dark);
  writeSvg(path.join(PUBLIC, "icon.svg"), tile);
  writeSvg(path.join(BRAND, "discord-server-icon.svg"), disc);

  console.log("Raster");
  await png(light, LOGO_W, LOGO_H, path.join(PUBLIC, "logo.png"));
  await png(dark, LOGO_W, LOGO_H, path.join(PUBLIC, "logo-dark.png"));
  await png(tile, 512, 512, path.join(PUBLIC, "icon.png"));
  await png(tile, 192, 192, path.join(PUBLIC, "icon-192.png"));
  await png(disc, 512, 512, path.join(BRAND, "discord-server-icon.png"));

  const sizes = [16, 32, 48];
  const favicon = icoWrap(
    await Promise.all(sizes.map(async (size) => ({ size, png: await renderPng(tile, size, size) })))
  );
  fs.writeFileSync(path.join(APPDIR, "favicon.ico"), favicon);
  console.log(`  src/app/favicon.ico  ${sizes.join("/")}px`);

  console.log(`\nLogo intrinsic size: ${LOGO_W}x${LOGO_H} (aspect ${(W / H).toFixed(3)})`);
})();
