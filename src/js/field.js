// The field behind the homepage: a digital collage of vector shapes filled
// with flat colour, gradients, two-colour ordered dither, pixel patterns,
// coarse blocks and contour lines, in one of five palettes, keyed to the
// whole palette or to a single hue, composed one of eleven ways, seeded by
// today's date. Everyone who visits on the same day at the same window size
// sees the same field. The prose column is a clearing dissolved into it as a
// dither. Nothing moves.
//
// Query string knobs, for the curious:
//   ?study=meadow|thicket|heath|blossom|strata|fog|dunes|sky|grove|patchwork|terraces
//   ?palette=dusk|hot|chalk|spring|ember
//   ?key=full|duo|ink        the whole palette, one hue plus an accent, or one hue
//   ?density=sparse|usual|dense
//   ?seed=123    any integer; the default is today's date
//   ?cell=4      texture cell size in CSS px, 2 to 10
(function () {
  var canvas = document.querySelector(".field");
  var column = document.querySelector(".stage");
  var q = new URLSearchParams(location.search);
  var STUDIES = ["meadow", "thicket", "heath", "blossom", "strata", "fog", "dunes", "sky", "grove", "patchwork", "terraces"];

  // The day's seed. Everyone who visits on the same day gets the same field
  // at the same window size.
  var today = new Date();
  var seedParam = parseInt(q.get("seed"), 10);
  var seed = isNaN(seedParam)
    ? today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    : seedParam;
  var cellParam = parseInt(q.get("cell"), 10);
  var CELL = cellParam >= 2 && cellParam <= 10 ? cellParam : 4;

  var s, lattice;
  function rand() {
    s = s + 0x6D2B79F5 | 0;
    var t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  function rnd(a, b) { return a + rand() * (b - a); }
  function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
  function pickOther(arr, not) {
    var c = pick(arr);
    return c === not && arr.length > 1 ? pickOther(arr, not) : c;
  }

  function lat(ix, iy) { return lattice[((ix * 73856093) ^ (iy * 19349663)) & 1023]; }
  function noise(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = lat(ix, iy), b = lat(ix + 1, iy), c = lat(ix, iy + 1), d = lat(ix + 1, iy + 1);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  }
  function fbm(x, y) {
    return noise(x, y) * 0.5 + noise(x * 2.1 + 7.3, y * 2.1 + 3.1) * 0.3 +
      noise(x * 4.3 + 11.7, y * 4.3 + 5.9) * 0.2;
  }
  function smooth(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  // Ordered dithering: the screen's oldest texture.
  var BAYER = [
    [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]
  ];
  function thr(i, j) { return (BAYER[j & 7][i & 7] + 0.5) / 64; }

  // --- Colour ------------------------------------------------------------
  // Five moods. Each is a handful of HSL colours per role.
  var PALETTES = {
    dusk: { ground: [30, 40, 50], line: [270, 30, 28],
      sky: [[272, 45, 72], [285, 38, 64], [300, 30, 72], [232, 35, 76]],
      mass: [[150, 55, 30], [140, 50, 42], [128, 55, 58], [100, 45, 50], [165, 45, 36]],
      field: [[42, 55, 52], [22, 42, 40], [26, 40, 50], [268, 35, 72], [50, 58, 80], [135, 45, 48],
              [88, 50, 55], [18, 55, 45], [350, 30, 55], [46, 70, 58]],
      bloom: [[52, 82, 58], [56, 72, 72], [335, 58, 66], [20, 80, 62]],
      accent: [[335, 60, 65], [218, 65, 55], [52, 90, 60], [25, 85, 60], [45, 30, 92]] },
    hot: { ground: [225, 45, 22], line: [220, 40, 14],
      sky: [[205, 70, 55], [195, 60, 65], [40, 80, 70]],
      mass: [[95, 70, 45], [80, 80, 55], [150, 60, 35], [200, 60, 45], [320, 65, 50], [25, 85, 55]],
      field: [[330, 70, 55], [20, 85, 60], [85, 65, 50], [210, 70, 50], [55, 90, 60], [170, 55, 45], [280, 50, 55]],
      bloom: [[330, 80, 62], [45, 95, 65], [15, 90, 58], [200, 80, 70]],
      accent: [[55, 95, 65], [330, 85, 65], [205, 85, 60], [20, 95, 55]] },
    chalk: { ground: [28, 50, 90], line: [20, 30, 45],
      sky: [[25, 55, 88], [345, 40, 86], [200, 30, 86]],
      mass: [[110, 25, 55], [140, 20, 45], [160, 20, 60], [95, 30, 62]],
      field: [[30, 45, 82], [350, 35, 78], [80, 25, 70], [200, 25, 75], [45, 40, 78], [20, 30, 65]],
      bloom: [[345, 55, 72], [40, 70, 78], [20, 70, 72]],
      accent: [[345, 60, 65], [210, 45, 65], [45, 75, 70]] },
    spring: { ground: [90, 45, 60], line: [120, 40, 24],
      sky: [[205, 55, 82], [195, 45, 88], [60, 50, 90]],
      mass: [[110, 60, 45], [95, 65, 55], [130, 55, 38], [75, 60, 55], [150, 50, 42]],
      field: [[85, 60, 60], [60, 70, 65], [110, 50, 52], [45, 80, 70], [130, 45, 55], [340, 45, 72]],
      bloom: [[335, 75, 72], [350, 65, 78], [48, 90, 72], [0, 70, 70]],
      accent: [[335, 80, 70], [48, 95, 65], [210, 60, 65], [20, 90, 65]] },
    ember: { ground: [355, 45, 25], line: [0, 40, 14],
      sky: [[20, 70, 60], [35, 80, 65], [350, 50, 55]],
      mass: [[85, 45, 40], [60, 50, 45], [120, 35, 32], [30, 60, 45], [345, 55, 45]],
      field: [[25, 80, 50], [10, 70, 45], [45, 70, 55], [350, 55, 50], [75, 45, 45], [290, 35, 45]],
      bloom: [[48, 95, 62], [25, 95, 60], [340, 70, 62]],
      accent: [[48, 95, 65], [200, 55, 55], [330, 70, 60], [90, 70, 55]] }
  };
  var PNAMES = Object.keys(PALETTES);
  var P, paletteName;

  function cl(v) { return Math.max(0, Math.min(100, v)); }
  function css(c, dl) { return "hsl(" + c[0] + "," + c[1] + "%," + cl(c[2] + (dl || 0)) + "%)"; }
  function shift(c, dl, ds) { return [c[0], cl(c[1] + (ds || 0)), cl(c[2] + dl)]; }
  function rgb(c) {
    var h = c[0], sa = c[1] / 100, l = c[2] / 100;
    var a = sa * Math.min(l, 1 - l);
    function f(n) { var k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  function mixRgb(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function token(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function hexRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }

  // --- Keys --------------------------------------------------------------
  // A composition may take the whole palette, or be keyed to one hue: a
  // duotone (one hue in lightness steps plus one accent, like a two-colour
  // print) or ink (one near-grey hue and nothing else, like a woodcut).
  var KEYS = ["full", "duo", "ink"];
  var DENSITIES = { sparse: 0.5, usual: 1, dense: 1.6 };
  var keyName, density, D;
  function hueDist(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
  function steps(h, sa, ls) { return ls.map(function (l) { return [h, cl(sa), l]; }); }
  function keyed(base, mode) {
    if (mode === "full") return base;
    var k = mode === "ink" ? base.line : pick(base.field.concat(base.mass));
    var h = k[0], sa = mode === "ink" ? Math.min(22, k[1]) : Math.max(28, Math.min(72, k[1]));
    var a = pick(base.accent);
    if (hueDist(a[0], h) < 40) a = pickOther(base.accent, a);
    if (mode === "ink") a = [h, sa, 30];
    return {
      ground: [h, sa, mode === "ink" ? 62 : 46], line: [h, sa, 16],
      sky: steps(h, sa * 0.6, [84, 90, 76]),
      mass: steps(h, sa, [24, 32, 40, 48]),
      field: steps(h, sa, [44, 52, 60, 68, 76, 84]),
      bloom: [a, shift(a, 10), [h, sa, 92]],
      accent: [a, shift(a, -10), [h, sa, 92]]
    };
  }
  // How many of a thing: the usual range, scaled by the day's density.
  function count(a, b) { return Math.max(a > 0 ? 1 : 0, Math.round(rnd(a, b) * D)); }

  // --- Shapes ------------------------------------------------------------
  // A composition is a list of shapes drawn back to front. Every shape has a
  // vector outline (a path) and a medium that fills it: flat colour, a
  // gradient, a two-colour dither, a pixel pattern, coarse blocks, contour
  // lines. The contrast between media is the picture.
  var W, H, phone, dpr, ctx, shapes, horizon, study;
  var MEDIA = {
    sky: ["gradient", "gradient", "posterize", "dither", "flat"],
    ground: ["dither", "posterize", "flat", "hatch", "rows", "dots", "contour", "checks", "stubble", "gradient"],
    mass: ["flat", "flat", "dither", "posterize", "blocks", "hatch", "contour", "dots", "stubble"],
    patch: ["blocks", "dots", "checks", "flat"],
    band: ["flat", "dither", "posterize", "rows", "contour", "hatch", "gradient", "stubble", "checks"],
    ring: ["flat", "flat", "dots", "hatch", "dither"]
  };

  // amp is how far the outline wanders from an ellipse: 0.44 is a lumpy
  // canopy, 0.1 a sun.
  function lobe(cx, cy, rx, ry, amp) { return { cx: cx, cy: cy, rx: rx, ry: ry, seed: rnd(0, 100), amp: amp == null ? 0.44 : amp }; }
  function disc(role, cx, cy, rx, ry, c1, c2, medium, amp) {
    return add({ kind: "blob", role: role, lobes: [lobe(cx, cy, rx, ry, amp)], c1: c1, c2: c2, medium: medium, outline: false });
  }
  function add(sh) { sh.tex = rnd(0, 100); shapes.push(sh); return sh; }
  function mound(role, cx, cy, rx, ry, extra, c1, c2) {
    var sh = add({ kind: "blob", role: role, lobes: [lobe(cx, cy, rx, ry)], c1: c1, c2: c2, medium: pick(MEDIA[role]) });
    for (var l = 0; l < extra; l++) {
      sh.lobes.push(lobe(cx + rx * rnd(-0.9, 0.9), cy + ry * rnd(-0.7, 0.5), rx * rnd(0.4, 0.9), ry * rnd(0.4, 0.9)));
    }
    sh.outline = role === "mass" ? rand() < 0.45 : rand() < 0.15;
    return sh;
  }
  function ribbon(width, y0, y1) {
    var pts = [], x = W * rnd(-0.1, 0.5), y = rnd(y0, y1), ang = rnd(-0.6, 0.6);
    for (var k = 0; k < 40; k++) {
      pts.push([x, y]);
      ang += rnd(-0.35, 0.35); ang = Math.max(-1.2, Math.min(1.2, ang));
      x += Math.cos(ang) * W * 0.03; y += Math.sin(ang) * W * 0.03;
    }
    return add({ kind: "ribbon", pts: pts, width: width, c1: pick(P.accent), dash: rand() < 0.3 });
  }
  function below(role, topFn, c1, c2) {
    return add({ kind: "below", role: role, top: topFn, c1: c1, c2: c2, medium: pick(MEDIA[role]) });
  }
  function wobbleTop(y0, amp) {
    var w = rnd(0, 100);
    return function (x) { return y0 + (fbm(x / 200 + w, w) - 0.5) * amp; };
  }
  // A top edge that leans, for dunes and hillsides.
  function slopeTop(y0, m, amp) {
    var w = rnd(0, 100);
    return function (x) { return y0 + m * (x - W * 0.5) + (fbm(x / 300 + w, w) - 0.5) * amp; };
  }
  // A top edge with peaks, for ranges.
  function ridgeTop(y0, amp) {
    var w = rnd(0, 100), f = rnd(1.5, 3.5);
    return function (x) {
      var u = x / W;
      return y0 - Math.abs(fbm(u * f + w, w) - 0.5) * amp * 2.2 + (fbm(u * 9 + w, w + 3) - 0.5) * amp * 0.45;
    };
  }
  function fieldPair() { var a = pick(P.field); return [a, rand() < 0.5 ? pickOther(P.field, a) : shift(a, -14)]; }
  function massPair() { var a = pick(P.mass); return [a, rand() < 0.4 ? pickOther(P.mass, a) : shift(a, -16)]; }

  function buildMeadow() {
    horizon = H * rnd(0.2, 0.42);
    var sc = pick(P.sky);
    below("sky", function () { return 0; }, sc, rand() < 0.5 ? pickOther(P.sky, sc) : shift(sc, 12));
    var fp = fieldPair();
    below("ground", wobbleTop(horizon, H * 0.1), fp[0], fp[1]);
    var n = count(2, 5);
    for (var i = 0; i < n; i++) {
      var mp = massPair();
      mound("mass", W * rnd(0.05, 0.95), horizon - H * rnd(-0.02, 0.16), W * rnd(0.08, 0.22), H * rnd(0.08, 0.22), Math.round(rnd(0, 3)), mp[0], mp[1]);
    }
    n = count(4, 8);
    for (i = 0; i < n; i++) { fp = fieldPair(); mound("ground", W * rnd(0.05, 0.95), rnd(horizon + H * 0.04, H), W * rnd(0.2, 0.55), H * rnd(0.08, 0.26), 0, fp[0], fp[1]); }
    n = count(0, 3);
    for (i = 0; i < n; i++) { fp = fieldPair(); mound("ground", W * rnd(0.05, 0.95), H * rnd(0.75, 1), W * rnd(0.03, 0.08), H * rnd(0.2, 0.5), 0, fp[0], fp[1]); }
    n = count(1, 4);
    for (i = 0; i < n; i++) mound("patch", W * rnd(0.1, 0.9), rnd(horizon - H * 0.05, H * 0.85), W * rnd(0.03, 0.09), H * rnd(0.03, 0.09), 0, pick(P.bloom), pick(P.accent));
    n = count(1, 3);
    for (i = 0; i < n; i++) ribbon(rnd(6, 24), horizon, H);
  }
  function buildThicket() {
    below("band", function () { return 0; }, P.ground, shift(P.line, 18));
    shapes[0].medium = pick(["contour", "flat", "stubble", "dots"]);
    var n = count(2, 4);
    for (var i = 0; i < n; i++) { var fp = fieldPair(); mound("ground", W * rnd(0.1, 0.9), H * rnd(0.5, 1.1), W * rnd(0.25, 0.6), H * rnd(0.1, 0.3), 0, fp[0], fp[1]); }
    n = count(6, 12);
    for (i = 0; i < n; i++) {
      var rx = W * rnd(0.06, 0.2), mp = massPair();
      mound("mass", W * rnd(0, 1), H * rnd(0.1, 1), rx, Math.min(H * 0.35, rx * rnd(0.6, 1.3)), Math.round(rnd(0, 2)), mp[0], mp[1]);
    }
    n = count(0, 2);
    for (i = 0; i < n; i++) mound("patch", W * rnd(0.1, 0.9), H * rnd(0.1, 0.9), W * rnd(0.02, 0.06), W * rnd(0.02, 0.06), 0, pick(P.bloom), pick(P.accent));
  }
  function buildHeath() {
    var n = count(3, 5), y = 0;
    for (var i = 0; i < n; i++) {
      var fp = fieldPair();
      below("band", i ? wobbleTop(y, H * 0.12) : function () { return 0; }, fp[0], fp[1]);
      y += H / n * rnd(0.6, 1.4);
    }
    n = count(1, 2);
    for (i = 0; i < n; i++) ribbon(rnd(24, 60), H * 0.2, H);
    n = count(2, 5);
    for (i = 0; i < n; i++) {
      var rx = W * rnd(0.04, 0.12), mp = massPair();
      mound("mass", W * rnd(0.05, 0.95), H * rnd(0.15, 0.95), rx, rx * rnd(0.5, 0.9), Math.round(rnd(0, 1)), mp[0], mp[1]);
    }
  }
  function buildBlossom() {
    var fp = fieldPair();
    below("band", function () { return 0; }, fp[0], fp[1]);
    var n = count(5, 10);
    for (var i = 0; i < n; i++) {
      var r = W * rnd(0.06, 0.18), c1 = pick(P.bloom);
      add({ kind: "rings", cx: W * rnd(0, 1), cy: H * rnd(0, 1), r: r, ry: r * rnd(0.75, 1.1), ringW: rnd(10, 22),
        seed: rnd(0, 100), c1: c1, c2: rand() < 0.5 ? pick(P.accent) : pickOther(P.bloom, c1), medium: pick(MEDIA.ring) });
    }
  }
  function buildStrata() {
    var n = count(5, 9), y = 0, tops = [];
    for (var i = 0; i < n; i++) {
      var sky = i === 0 && rand() < 0.6, fp = fieldPair();
      if (sky) { var sc = pick(P.sky); fp = [sc, shift(sc, 12)]; }
      var b = below(sky ? "sky" : "band", i ? wobbleTop(y, H * 0.12) : function () { return 0; }, fp[0], fp[1]);
      tops.push(y); y += H / n * rnd(0.5, 1.5);
    }
    n = count(1, 4);
    for (i = 0; i < n; i++) {
      var rx = W * rnd(0.06, 0.16), mp = massPair();
      mound("mass", W * rnd(0.05, 0.95), pick(tops.slice(1)), rx, rx * rnd(0.5, 1), Math.round(rnd(0, 2)), mp[0], mp[1]);
    }
    n = count(0, 2);
    for (i = 0; i < n; i++) ribbon(rnd(6, 20), H * 0.2, H);
  }
  // A range in fog: ridges in one hue, each nearer one darker.
  function buildFog() {
    var sc = pick(P.sky);
    below("sky", function () { return 0; }, sc, rand() < 0.5 ? pickOther(P.sky, sc) : shift(sc, 10));
    if (rand() < 0.5) disc("patch", W * rnd(0.15, 0.85), H * rnd(0.08, 0.3), W * rnd(0.025, 0.05), W * rnd(0.025, 0.05), pick(P.bloom), pick(P.accent), pick(["flat", "flat", "dots"]), 0.1);
    var base = pick(P.mass), n = count(4, 7);
    for (var i = 0; i < n; i++) {
      var t = n > 1 ? i / (n - 1) : 1;
      var c = [base[0], cl(base[1] * (0.45 + 0.55 * t)), 84 - 58 * t];
      var sh = below("band", ridgeTop(H * (0.22 + 0.62 * t) + H * rnd(-0.05, 0.05), H * rnd(0.08, 0.22)), c, shift(c, -7));
      sh.medium = pick(["flat", "flat", "flat", "dither", "posterize", "stubble"]);
    }
  }
  // Dunes: leaning slopes that cross, lit face and shadow face by turns.
  function buildDunes() {
    var y0 = H * rnd(0.15, 0.45), sc = pick(P.sky);
    var sky = below("sky", function () { return 0; }, sc, rand() < 0.5 ? pickOther(P.sky, sc) : shift(sc, 12));
    sky.medium = pick(["flat", "gradient", "gradient", "dither"]);
    if (rand() < 0.5) disc("patch", W * rnd(0.1, 0.9), y0 * rnd(0.2, 0.8), W * rnd(0.02, 0.05), W * rnd(0.02, 0.05), pick(P.bloom), pick(P.accent), "flat", 0.08);
    var a = pick(P.field), n = count(4, 8), y = y0;
    for (var i = 0; i < n; i++) {
      var lit = i % 2 === 0, c = lit ? shift(a, rnd(-4, 8)) : shift(a, rnd(-18, -10), -6);
      var sh = below("band", slopeTop(y, rnd(-0.35, 0.35), H * rnd(0.02, 0.08)), c, shift(c, lit ? -10 : 8));
      sh.medium = pick(["flat", "flat", "flat", "dither", "rows", "stubble", "posterize"]);
      y += (H - y0) / n * rnd(0.6, 1.5);
    }
    if (rand() < 0.4) ribbon(rnd(3, 8), y0 + H * 0.1, H).dash = true;
  }
  // Big sky: most of the frame is weather, with a thin strip of land.
  function buildSky() {
    var y0 = H * rnd(0.68, 0.88), sc = pick(P.sky);
    var sky = below("sky", function () { return 0; }, sc, rand() < 0.6 ? pickOther(P.sky, sc) : shift(sc, 14));
    sky.medium = pick(["gradient", "dither", "dither", "posterize"]);
    var n = count(0, 2), i;
    for (i = 0; i < n; i++) {
      var cc = shift(sc, 12, -10);
      disc("patch", W * rnd(0.05, 0.95), y0 * rnd(0.1, 0.7), W * rnd(0.08, 0.2), H * rnd(0.02, 0.05), cc, shift(cc, -6), pick(["flat", "flat", "dither"]), 0.3);
    }
    if (rand() < 0.7) disc("patch", W * rnd(0.1, 0.9), y0 * rnd(0.15, 0.75), W * rnd(0.02, 0.06), W * rnd(0.02, 0.06), pick(P.bloom), pick(P.accent), pick(["flat", "flat", "dots", "dither"]), 0.08);
    var fp = fieldPair();
    var g = below("ground", wobbleTop(y0, H * 0.04), fp[0], fp[1]);
    g.medium = pick(["flat", "flat", "dither", "rows", "stubble"]);
    n = count(0, 2);
    for (i = 0; i < n; i++) { var mp = massPair(); mound("mass", W * rnd(0.05, 0.95), y0 + H * rnd(-0.01, 0.03), W * rnd(0.03, 0.1), H * rnd(0.02, 0.06), Math.round(rnd(0, 1)), mp[0], mp[1]); }
  }
  // A grove: stems with canopies, nearer trees in front.
  function buildGrove() {
    horizon = H * rnd(0.45, 0.75);
    var sc = pick(P.sky);
    below("sky", function () { return 0; }, sc, rand() < 0.5 ? pickOther(P.sky, sc) : shift(sc, 12));
    var fp = fieldPair();
    below("ground", wobbleTop(horizon, H * 0.05), fp[0], fp[1]);
    var n = count(5, 12), trees = [], i;
    for (i = 0; i < n; i++) trees.push({ x: W * rnd(0.02, 0.98), base: rnd(horizon + H * 0.02, H * 1.05), h: H * rnd(0.25, 0.7) });
    trees.sort(function (a, b) { return a.base - b.base; });
    var stem = shift(P.line, 10);
    trees.forEach(function (t) {
      var w = W * rnd(0.004, 0.012), mp = massPair(), tilt = rnd(-0.06, 0.06);
      disc("mass", t.x + tilt * t.h * 0.5, t.base - t.h * 0.5, w, t.h * 0.5, stem, stem, "flat", 0.12);
      var rx = Math.max(w * 3, W * rnd(0.03, 0.11));
      mound("mass", t.x + tilt * t.h, t.base - t.h, rx, rx * rnd(0.45, 0.9), Math.round(rnd(0, 3)), mp[0], mp[1]);
    });
    n = count(1, 3);
    for (i = 0; i < n; i++) { fp = fieldPair(); mound("ground", W * rnd(0.05, 0.95), H * rnd(0.85, 1.05), W * rnd(0.1, 0.3), H * rnd(0.04, 0.1), 0, fp[0], fp[1]); }
  }
  // Patchwork: the land from above, a quilt of plots with a river through it.
  function buildPatchwork() {
    var fp = fieldPair(), i, j;
    var bg = below("band", function () { return 0; }, fp[0], fp[1]);
    bg.medium = pick(["flat", "flat", "stubble", "dots"]);
    var R = Math.max(2, Math.round(rnd(3, 6) * Math.sqrt(D))), C = Math.max(2, Math.round(rnd(3, 7) * Math.sqrt(D)));
    var ws = [], hs = [], tw = 0, th = 0;
    for (i = 0; i < C; i++) { ws.push(rnd(0.5, 1.5)); tw += ws[i]; }
    for (j = 0; j < R; j++) { hs.push(rnd(0.5, 1.5)); th += hs[j]; }
    var xs = [-W * 0.05], ys = [-H * 0.05];
    for (i = 0; i < C; i++) xs.push(xs[i] + ws[i] / tw * W * 1.1);
    for (j = 0; j < R; j++) ys.push(ys[j] + hs[j] / th * H * 1.1);
    var jx = W * 1.1 / C * 0.18, jy = H * 1.1 / R * 0.18, sk = rnd(-0.25, 0.25), v = [];
    for (j = 0; j <= R; j++) {
      v.push([]);
      for (i = 0; i <= C; i++) v[j].push([xs[i] + rnd(-jx, jx) + (ys[j] - H / 2) * sk, ys[j] + rnd(-jy, jy)]);
    }
    for (j = 0; j < R; j++) {
      for (i = 0; i < C; i++) {
        if (rand() < 0.1) continue;
        var cp = fieldPair();
        add({ kind: "poly", role: "patch", pts: [v[j][i], v[j][i + 1], v[j + 1][i + 1], v[j + 1][i]], c1: cp[0], c2: cp[1],
          medium: pick(["flat", "flat", "flat", "hatch", "rows", "checks", "dots", "dither", "stubble", "posterize"]), outline: rand() < 0.5 });
      }
    }
    ribbon(rnd(10, 28), 0, H);
    var n = count(1, 4);
    for (i = 0; i < n; i++) { var mp = massPair(); mound("mass", W * rnd(0.05, 0.95), H * rnd(0.05, 0.95), W * rnd(0.02, 0.05), W * rnd(0.015, 0.04), Math.round(rnd(0, 2)), mp[0], mp[1]); }
  }
  // Terraces: contour rings around a summit, by turns one colour and the other.
  function buildTerraces() {
    var fp = fieldPair(), i;
    var bg = below("band", function () { return 0; }, fp[0], fp[1]);
    bg.medium = pick(["flat", "flat", "dither", "stubble"]);
    var cx = W * rnd(0.15, 0.85), cy = H * rnd(0.15, 0.85), R = Math.max(W, H) * rnd(0.6, 1.0), ry = rnd(0.55, 1), sd = rnd(0, 100);
    var n = count(6, 12), a = pick(P.field), b = rand() < 0.5 ? pickOther(P.field, a) : shift(a, 30);
    for (var k = n; k >= 1; k--) {
      var t = k / n, odd = k % 2 === 1, c = shift(odd ? a : b, (1 - t) * 30);
      add({ kind: "blob", role: "band", lobes: [{ cx: cx, cy: cy, rx: R * t, ry: R * ry * t, seed: sd + k * 0.015, amp: 0.44 }],
        c1: c, c2: shift(c, -9), medium: odd ? pick(["flat", "flat", "rows", "hatch"]) : pick(["flat", "dots", "dither"]), outline: rand() < 0.6 });
    }
    if (rand() < 0.5) ribbon(rnd(4, 12), 0, H);
    n = count(0, 3);
    for (i = 0; i < n; i++) { var mp = massPair(); mound("mass", W * rnd(0.05, 0.95), H * rnd(0.05, 0.95), W * rnd(0.015, 0.04), W * rnd(0.012, 0.03), Math.round(rnd(0, 1)), mp[0], mp[1]); }
  }
  var BUILD = { meadow: buildMeadow, thicket: buildThicket, heath: buildHeath, blossom: buildBlossom, strata: buildStrata,
    fog: buildFog, dunes: buildDunes, sky: buildSky, grove: buildGrove, patchwork: buildPatchwork, terraces: buildTerraces };

  // --- Paths -------------------------------------------------------------
  function smoothClosed(path, pts) {
    var n = pts.length, m0 = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
    path.moveTo(m0[0], m0[1]);
    for (var k = 0; k < n; k++) {
      var p = pts[k], nx = pts[(k + 1) % n];
      path.quadraticCurveTo(p[0], p[1], (p[0] + nx[0]) / 2, (p[1] + nx[1]) / 2);
    }
    path.closePath();
  }
  function lobePath(path, lb, scale) {
    var pts = [], N = 72;
    for (var k = 0; k < N; k++) {
      var a = k / N * Math.PI * 2;
      var A = lb.amp == null ? 0.44 : lb.amp;
      var r = (1 - A / 2 + A * fbm(Math.cos(a) * 1.4 + lb.seed, Math.sin(a) * 1.4 + lb.seed)) * (scale || 1);
      pts.push([lb.cx + Math.cos(a) * lb.rx * r, lb.cy + Math.sin(a) * lb.ry * r]);
    }
    smoothClosed(path, pts);
  }
  function shapePath(sh) {
    var path = new Path2D(), k;
    if (sh.kind === "blob") { for (k = 0; k < sh.lobes.length; k++) lobePath(path, sh.lobes[k]); }
    else if (sh.kind === "below") {
      path.moveTo(-2, sh.top(0));
      for (var x = 0; x <= W + 8; x += 8) path.lineTo(x, sh.top(x));
      path.lineTo(W + 2, H + 2); path.lineTo(-2, H + 2); path.closePath();
    }
    else if (sh.kind === "poly") {
      path.moveTo(sh.pts[0][0], sh.pts[0][1]);
      for (k = 1; k < sh.pts.length; k++) path.lineTo(sh.pts[k][0], sh.pts[k][1]);
      path.closePath();
    }
    return path;
  }
  function bbox(sh) {
    if (sh.kind === "below") {
      var mn = H;
      for (var x = 0; x <= W; x += 8) mn = Math.min(mn, sh.top(x));
      return [0, Math.max(0, mn), W, H];
    }
    var b = [W, H, 0, 0];
    if (sh.kind === "poly") {
      sh.pts.forEach(function (p) {
        b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]);
      });
      return [Math.max(0, b[0]), Math.max(0, b[1]), Math.min(W, b[2]), Math.min(H, b[3])];
    }
    sh.lobes.forEach(function (lb) {
      b[0] = Math.min(b[0], lb.cx - lb.rx * 1.25); b[1] = Math.min(b[1], lb.cy - lb.ry * 1.25);
      b[2] = Math.max(b[2], lb.cx + lb.rx * 1.25); b[3] = Math.max(b[3], lb.cy + lb.ry * 1.25);
    });
    return [Math.max(0, b[0]), Math.max(0, b[1]), Math.min(W, b[2]), Math.min(H, b[3])];
  }

  // --- Media -------------------------------------------------------------
  // Shade runs 0 (first colour) to 1 (second colour) across a shape.
  function shadeFn(sh, bb) {
    var t = sh.tex;
    if (sh.kind === "blob") {
      return function (x, y) {
        var best = sh.lobes[0], bd = Infinity;
        for (var k = 0; k < sh.lobes.length; k++) {
          var lb = sh.lobes[k], dx = (x - lb.cx) / lb.rx, dy = (y - lb.cy) / lb.ry, d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = lb; }
        }
        return 0.5 + 0.45 * ((y - best.cy) / best.ry) + 0.15 * ((x - best.cx) / best.rx) + (fbm(x / 50 + t, y / 50 + t) - 0.5) * 0.4;
      };
    }
    var by = bb[1], bh = Math.max(1, bb[3] - bb[1]);
    return function (x, y) { return 0.1 + 0.8 * ((y - by) / bh) + (fbm(x / 140 + t, y / 90 + t) - 0.5) * 0.5; };
  }

  var tiles;
  var TILES = {
    hatch: [4, [[0, 0], [1, 1], [2, 2], [3, 3]]],
    rows: [3, [[0, 0], [1, 0], [2, 0]]],
    dots: [3, [[1, 1]]],
    checks: [2, [[0, 0], [1, 1]]]
  };
  function tile(kind, c) {
    var key = kind + css(c);
    if (tiles[key]) return tiles[key];
    var spec = TILES[kind], n = spec[0], px = CELL * dpr;
    var tc = document.createElement("canvas");
    tc.width = tc.height = n * px;
    var t = tc.getContext("2d");
    t.fillStyle = css(c);
    spec[1].forEach(function (p) { t.fillRect(p[0] * px, p[1] * px, px, px); });
    var pat = ctx.createPattern(tc, "repeat");
    pat.setTransform(new DOMMatrix().scale(1 / dpr));
    tiles[key] = pat;
    return pat;
  }

  function paint(sh, bb) {
    var med = sh.medium, bx = bb[0], by = bb[1], bw = bb[2] - bb[0], bh = bb[3] - bb[1];
    if (bw <= 0 || bh <= 0) return;
    if (med === "flat") { ctx.fillStyle = css(sh.c1); ctx.fillRect(bx, by, bw, bh); return; }
    if (med === "gradient") {
      var g = ctx.createLinearGradient(0, by, 0, by + bh);
      g.addColorStop(0, css(sh.c1)); g.addColorStop(1, css(sh.c2));
      ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh); return;
    }
    if (TILES[med]) {
      ctx.fillStyle = css(sh.c1); ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = tile(med, sh.c2); ctx.fillRect(bx, by, bw, bh); return;
    }
    // Raster media: a small image, one pixel per cell, scaled up unsmoothed.
    var cell = med === "blocks" ? CELL * 4 : CELL;
    var cols = Math.ceil(bw / cell), rows = Math.ceil(bh / cell);
    var off = document.createElement("canvas");
    off.width = cols; off.height = rows;
    var octx = off.getContext("2d"), img = octx.createImageData(cols, rows), px = img.data;
    var A = rgb(sh.c1), B = rgb(sh.c2), C = mixRgb(A, B, 0.5), shade = shadeFn(sh, bb), t = sh.tex;
    var levels = med === "posterize" ? Math.round(rnd(3, 5)) : 0;
    var gi = Math.floor(bx / cell), gj = Math.floor(by / cell);
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var x = bx + (i + 0.5) * cell, y = by + (j + 0.5) * cell, c;
        switch (med) {
          case "dither": c = clamp01(shade(x, y)) > thr(i + gi, j + gj) ? B : A; break;
          case "posterize": c = mixRgb(A, B, Math.floor(clamp01(shade(x, y)) * levels) / (levels - 1)); break;
          case "contour": {
            var iso = Math.floor(fbm(x / 90 + t, y / 70 + t) * 7);
            c = iso !== Math.floor(fbm((x - cell) / 90 + t, y / 70 + t) * 7) ||
                iso !== Math.floor(fbm(x / 90 + t, (y - cell) / 70 + t) * 7) ? B : A;
            break;
          }
          case "blocks": {
            var v = fbm(x / 60 + t, y / 60 + t);
            c = v < 0.44 ? A : v < 0.56 ? C : B;
            break;
          }
          default: // stubble
            c = noise(x / 3 + t, y / 3 + t) > 0.3 + 0.4 * clamp01(shade(x, y)) ? A : B;
        }
        var k = (j * cols + i) * 4;
        px[k] = c[0]; px[k + 1] = c[1]; px[k + 2] = c[2]; px[k + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, bx, by, cols * cell, rows * cell);
  }

  function drawShape(sh) {
    if (sh.kind === "ribbon") {
      ctx.save();
      ctx.strokeStyle = css(sh.c1); ctx.lineWidth = sh.width;
      ctx.lineCap = sh.dash ? "butt" : "round"; ctx.lineJoin = "round";
      if (sh.dash) ctx.setLineDash([sh.width * 1.2, sh.width * 0.8]);
      ctx.beginPath();
      var p = sh.pts; ctx.moveTo(p[0][0], p[0][1]);
      for (var k = 1; k < p.length - 1; k++) ctx.quadraticCurveTo(p[k][0], p[k][1], (p[k][0] + p[k + 1][0]) / 2, (p[k][1] + p[k + 1][1]) / 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (sh.kind === "rings") {
      var n = Math.max(2, Math.round(sh.r / sh.ringW));
      for (k = n; k >= 1; k--) {
        var lb = { cx: sh.cx, cy: sh.cy, rx: sh.r * k / n, ry: sh.ry * k / n, seed: sh.seed + k * 0.07 };
        var path = new Path2D(); lobePath(path, lb);
        if (k % 2 === 0) { ctx.fillStyle = css(sh.c1); ctx.fill(path); }
        else {
          ctx.save(); ctx.clip(path);
          paint({ kind: "blob", lobes: [lb], c1: sh.c2, c2: sh.c1, medium: sh.medium, tex: sh.seed }, bbox({ kind: "blob", lobes: [lb] }));
          ctx.restore();
        }
      }
      return;
    }
    var path2 = shapePath(sh), bb = bbox(sh);
    ctx.save(); ctx.clip(path2); paint(sh, bb); ctx.restore();
    if (sh.outline) {
      ctx.save();
      ctx.strokeStyle = css(P.line); ctx.lineWidth = 1; ctx.globalAlpha = 0.75;
      ctx.stroke(path2);
      ctx.restore();
    }
  }

  // --- Render ------------------------------------------------------------
  function render() {
    s = seed | 0;
    lattice = [];
    for (var i = 0; i < 1024; i++) lattice.push(rand());
    var sp = q.get("study");
    study = STUDIES.indexOf(sp) >= 0 ? sp : pick(STUDIES);
    paletteName = PALETTES[q.get("palette")] ? q.get("palette") : pick(PNAMES);
    var kr = rand(), dr = rand(), kp = q.get("key"), dp = q.get("density");
    keyName = KEYS.indexOf(kp) >= 0 ? kp : kr < 0.5 ? "full" : kr < 0.85 ? "duo" : "ink";
    density = DENSITIES[dp] ? dp : dr < 0.3 ? "sparse" : dr < 0.8 ? "usual" : "dense";
    D = DENSITIES[density];
    P = keyed(PALETTES[paletteName], keyName);

    phone = matchMedia("(max-width: 44rem)").matches;
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tiles = {};

    shapes = []; horizon = -1;
    BUILD[study]();
    ctx.fillStyle = css(P.ground); ctx.fillRect(0, 0, W, H);
    shapes.forEach(drawShape);

    // The clearing: the prose column dissolves into the field as a dither,
    // with a feathered, wandering edge. On phones the field dissolves
    // upward into the paper at its foot.
    var paper = hexRgb(token("--paper"));
    var rect = column.getBoundingClientRect();
    var colL = rect.left + 8, colR = rect.right - 8, FEATHER = 140;
    function paperness(x, y) {
      if (phone) return 1 - smooth((H - y) / (H * 0.45));
      var wob = (fbm(y / 160 + 7, 2) - 0.5) * 48;
      var l = colL + wob, r = colR + wob;
      if (x > l && x < r) return 1;
      return 1 - smooth((x < l ? l - x : x - r) / FEATHER);
    }
    var cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
    var off = document.createElement("canvas");
    off.width = cols; off.height = rows;
    var octx = off.getContext("2d"), img = octx.createImageData(cols, rows), px = img.data;
    for (var j = 0; j < rows; j++) {
      for (i = 0; i < cols; i++) {
        var pv = paperness((i + 0.5) * CELL, (j + 0.5) * CELL);
        if (pv <= 0 || pv < thr(i, j)) continue;
        var k = (j * cols + i) * 4;
        px[k] = paper[0]; px[k + 1] = paper[1]; px[k + 2] = paper[2]; px[k + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, cols * CELL, rows * CELL);

    canvas.setAttribute("data-field", study + " " + paletteName + " " + keyName + " " + density + " " + seed);
  }

  // Draw after the text has had its first paint, and again when the window
  // or the colour scheme changes.
  requestAnimationFrame(function () { setTimeout(render, 0); });
  var timer;
  addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(render, 150); });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);

  // The footer waits below the fold and fades in when scrolled to.
  document.documentElement.classList.add("js");
  var tail = document.querySelector(".tail");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { tail.classList.add("in"); io.disconnect(); } });
    }, { threshold: 0.2 });
    io.observe(tail);
  } else {
    tail.classList.add("in");
  }
})();
