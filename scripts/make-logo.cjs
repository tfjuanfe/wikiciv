// Generates WikiCiv PNG logos with @napi-rs/canvas.
// Run: node scripts/make-logo.cjs
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("@napi-rs/canvas");

const OUT = path.join(__dirname, "..", "public");
fs.mkdirSync(OUT, { recursive: true });

const C = {
  outline: "#241c12",
  grass: "#5d8f3a",
  grassLight: "#7cb15a",
  grassHi: "#9bd178",
  dirt: "#7a5733",
  dirtLight: "#946b46",
  dirtDark: "#5b4026",
  ink: "#23271d", // wordmark on light bg
  cream: "#f3f0e7", // wordmark on dark bg
  accent: "#6ba23f", // "Civ" + tagline
};

// deterministic pseudo-random in [0,1)
function rnd(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draw a pixel-art Minecraft grass block into the given square.
function drawBlock(ctx, ox, oy, size) {
  const grid = 16;
  const pix = size / grid;
  const radius = size * 0.07;

  ctx.save();
  roundRectPath(ctx, ox, oy, size, size, radius);
  ctx.clip();

  for (let gx = 0; gx < grid; gx++) {
    // irregular grass/dirt boundary per column
    const r = rnd(gx, 42);
    const off = r < 0.3 ? -1 : r < 0.75 ? 0 : 1;
    const boundary = 5 + off;

    for (let gy = 0; gy < grid; gy++) {
      let color;
      if (gy <= boundary) {
        const v = rnd(gx, gy);
        if (gy <= 1) color = v < 0.5 ? C.grassLight : C.grassHi;
        else if (gy === boundary) color = v < 0.6 ? C.grass : C.grassLight;
        else color = v < 0.15 ? C.grassHi : v < 0.55 ? C.grassLight : C.grass;
      } else {
        // occasional hanging grass tuft just below the boundary
        if (gy === boundary + 1 && rnd(gx, 7) < 0.33) {
          color = C.grass;
        } else {
          const v = rnd(gx, gy);
          color = v < 0.12 ? C.dirtDark : v < 0.3 ? C.dirtLight : C.dirt;
        }
      }
      ctx.fillStyle = color;
      // +1 to avoid hairline seams between cells
      ctx.fillRect(
        Math.floor(ox + gx * pix),
        Math.floor(oy + gy * pix),
        Math.ceil(pix) + 1,
        Math.ceil(pix) + 1,
      );
    }
  }
  ctx.restore();

  // crisp dark outline for definition
  ctx.lineWidth = Math.max(2, size * 0.03);
  ctx.strokeStyle = C.outline;
  roundRectPath(
    ctx,
    ox + ctx.lineWidth / 2,
    oy + ctx.lineWidth / 2,
    size - ctx.lineWidth,
    size - ctx.lineWidth,
    radius,
  );
  ctx.stroke();
}

function save(canvas, name) {
  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(`wrote public/${name}  (${(buf.length / 1024).toFixed(1)} KB)`);
}

// ---- 1) Square app icon (just the block) ----
function makeIcon(size, name) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const margin = Math.round(size * 0.08);
  drawBlock(ctx, margin, margin, size - margin * 2);
  save(canvas, name);
}

// ---- 2) Horizontal wordmark ----
function makeWordmark(name, textColor) {
  const H = 420;
  const block = 300;
  const pad = 48;
  const gap = 44;
  const fs = 210;
  const tagFs = 46;

  // measure text first
  const probe = createCanvas(10, 10).getContext("2d");
  probe.font = `800 ${fs}px "Segoe UI", Arial, sans-serif`;
  const wWiki = probe.measureText("Wiki").width;
  const wCiv = probe.measureText("Civ").width;
  const textW = wWiki + wCiv;

  const W = Math.ceil(pad + block + gap + textW + pad);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  drawBlock(ctx, pad, (H - block) / 2, block);

  const textX = pad + block + gap;
  const baseline = H / 2 + fs * 0.34;
  ctx.font = `800 ${fs}px "Segoe UI", Arial, sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = textColor;
  ctx.fillText("Wiki", textX, baseline);
  ctx.fillStyle = C.accent;
  ctx.fillText("Civ", textX + wWiki, baseline);

  // tagline
  ctx.font = `700 ${tagFs}px "Segoe UI", Arial, sans-serif`;
  ctx.fillStyle = C.accent;
  const tag = "L O R E   A R C H I V E";
  ctx.fillText(tag, textX + 4, baseline + tagFs + 18);

  save(canvas, name);
}

makeIcon(512, "icon.png");
makeIcon(192, "icon-192.png");
makeWordmark("logo.png", C.ink); // for light backgrounds
makeWordmark("logo-dark.png", C.cream); // for dark backgrounds
console.log("done.");
