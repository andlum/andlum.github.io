// The field behind the homepage: a painting in small marks, dots far off,
// dabs in the middle distance, upright strokes underfoot, in one of five
// palettes, keyed to the whole palette or to a single hue, composed one of
// twelve ways, seeded by today's date. Everyone who visits on the same day
// at the same window size sees the same field. The prose column is a
// clearing dissolved into it as a dither. Nothing moves.
//
// Query string knobs, for the curious:
//   ?study=meadow|thicket|heath|blossom|strata|fog|dunes|sky|grove|patchwork|terraces|garden
//   ?palette=dusk|hot|chalk|spring|ember
//   ?key=full|duo|ink        the whole palette, one hue plus an accent, or one hue
//   ?density=sparse|usual|dense
//   ?seed=123    any integer; the default is today's date. The palette in
//                the nav paints a fresh one in place.
//   ?cell=4      mark cell size in CSS px, 2 to 10
(function () {
  var canvas = document.querySelector(".field");
  var column = document.querySelector(".stage");
  var q = new URLSearchParams(location.search);
  var STUDIES = ["meadow", "thicket", "heath", "blossom", "strata", "fog", "dunes", "sky", "grove", "patchwork", "terraces", "garden"];

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
  // Most days are polychrome: about three in four take the whole palette,
  // one in six is a duotone, and one in twelve is ink.
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


  // --- Marks -------------------------------------------------------------
  // The painter's medium rather than the collagist's. A region is not an
  // outline with a fill but a cloud of small marks: dots far off, dabs in
  // the middle distance, upright strokes underfoot. Each cloud keeps to one
  // family of colour with a pepper of another, and the pale ground shows
  // through between the marks. Form is the cluster, not the edge. The only
  // flat passages are washes: the pale ground itself and, some days, a sky.
  var W, H, phone, dpr, ctx, shapes, study, MC;

  function add(sh) { shapes.push(sh); return sh; }
  // amp is how far an outline wanders from an ellipse: 0.5 is a lumpy
  // crown, 0.1 a sun.
  function lobe(cx, cy, rx, ry, amp) { return { cx: cx, cy: cy, rx: rx, ry: ry, seed: rnd(0, 100), amp: amp == null ? 0.5 : amp }; }
  function cloud(cx, cy, rx, ry, lobes) {
    var ls = [lobe(cx, cy, rx, ry)];
    for (var l = 1; l < lobes; l++) ls.push(lobe(cx + rx * rnd(-0.7, 0.7), cy + ry * rnd(-0.5, 0.4), rx * rnd(0.45, 0.8), ry * rnd(0.45, 0.8)));
    return { kind: "blob", lobes: ls };
  }
  function flat(topFn) { return { kind: "below", top: topFn }; }
  function level(y) { return function () { return y; }; }
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

  // A wash: the one flat medium, a vertical gradient under a top edge,
  // for the pale ground and for skies.
  function wash(topFn, c1, c2, until) { return add({ kind: "wash", base: flat(topFn), c1: c1, c2: c2 || c1, until: until }); }
  function pale() { return [P.ground[0], Math.min(35, P.ground[1]), 86]; }
  function ground() { var p = pale(); wash(level(0), shift(p, 3), shift(p, -4)); return p; }
  function sky(hz) { var sc = pick(P.sky); wash(level(0), shift(sc, 8), sc, hz == null ? H : hz + H * 0.1); return sc; }

  // A cloud of marks over a base shape. size is the mark in cells [w, h];
  // cover is how much of the base the marks would cover laid side by side;
  // spread and dl jitter hue and lightness; one mark in `rate` takes the
  // pepper colour; slant leans strokes at random and lean leans them all one
  // way; shade lightens the top of the region (positive) or the foot
  // (negative); edge and fade thin the marks out above a band's top; fall
  // thins them toward a cloud's rim and ring keeps them out of its middle.
  function marksOf(base, o) {
    return add({ kind: "marks", base: base, size: o.size, cover: o.cover, c: o.c, spread: o.spread == null ? 10 : o.spread,
      dl: o.dl || [-12, 12], pepper: o.pepper || o.c, rate: o.rate || 0, slant: o.slant || 0, lean: o.lean || 0, shade: o.shade || 0,
      until: o.until, edge: o.edge, fade: o.fade || 0, fall: o.fall || 0, ring: o.ring || 0 });
  }
  function stamp(sh, bb) {
    var bx = bb[0], by = bb[1], bw = bb[2] - bb[0], bh = bb[3] - bb[1];
    if (bw <= 0 || bh <= 0) return;
    var cols = Math.ceil(bw / MC), rows = Math.ceil(bh / MC);
    var off = document.createElement("canvas");
    off.width = cols; off.height = rows;
    var octx = off.getContext("2d"), img = octx.createImageData(cols, rows), px = img.data;
    var mw = sh.size[0], mh = sh.size[1], n = Math.round(cols * rows * sh.cover / (mw * mh));
    for (var m = 0; m < n; m++) {
      var i = Math.floor(rand() * (cols + mw)) - mw, j = Math.floor(rand() * (rows + mh)) - mh;
      // Marks thin out toward a band's top edge and a cloud's rim, so no
      // region ends in a line.
      var mx = bx + (i + mw / 2) * MC, my = by + (j + mh / 2) * MC;
      if (sh.edge && rand() > clamp01((my - sh.edge(mx) + sh.fade) / (sh.fade * 1.4))) continue;
      if (sh.fall || sh.ring) {
        var nd = Infinity;
        for (var q2 = 0; q2 < sh.base.lobes.length; q2++) {
          var lb2 = sh.base.lobes[q2], ddx = (mx - lb2.cx) / lb2.rx, ddy = (my - lb2.cy) / lb2.ry;
          nd = Math.min(nd, Math.sqrt(ddx * ddx + ddy * ddy));
        }
        if (sh.fall && rand() > clamp01((1.05 - nd) / sh.fall)) continue;
        if (sh.ring && rand() > clamp01((nd - sh.ring) / 0.12 + 0.5)) continue;
      }
      var c = rand() < sh.rate ? sh.pepper : sh.c;
      var l = c[2] + rnd(sh.dl[0], sh.dl[1]) - (sh.shade ? (j / rows - 0.5) * sh.shade : 0);
      var col = rgb([(c[0] + rnd(-sh.spread, sh.spread) + 360) % 360, cl(c[1] + rnd(-6, 6)), cl(l)]);
      var sl = sh.lean + (sh.slant ? rnd(-sh.slant, sh.slant) : 0);
      for (var dy = 0; dy < mh; dy++) {
        var ox = Math.round(sl * dy), y = j + dy;
        if (y < 0 || y >= rows) continue;
        for (var dx = 0; dx < mw; dx++) {
          var x = i + dx + ox;
          if (x < 0 || x >= cols) continue;
          var k = (y * cols + x) * 4;
          px[k] = col[0]; px[k + 1] = col[1]; px[k + 2] = col[2]; px[k + 3] = 255;
        }
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, bx, by, cols * MC, rows * MC);
  }

  // --- Colour choices ----------------------------------------------------
  // A colour from the pool at least `far` degrees of hue from `not`.
  function pickFar(pool, not, far) {
    var c = pick(pool);
    for (var t = 0; t < 8 && not && hueDist(c[0], not[0]) < far; t++) c = pick(pool);
    return c;
  }
  // A lead hue for a composition: most clusters are near it, in hue and in
  // lightness, and about one in six takes the accent instead. This is what
  // keeps a polychrome day from being every colour at once.
  function leadHue(pool, spread) {
    var lead = pick(pool), accent = pick(P.bloom), sp = spread || 16;
    if (hueDist(accent[0], lead[0]) < 30) accent = pick(P.accent);
    return {
      lead: lead, accent: accent,
      near: function (dl) { return shift(lead, rnd(-sp, sp), dl == null ? rnd(-10, 6) : dl); },
      one: function (dl) { return rand() < 0.16 ? accent : this.near(dl); }
    };
  }

  // --- Vocabulary --------------------------------------------------------
  // The pieces every study is built from. d is nearness, 0 at the horizon
  // and 1 underfoot: it sets the size of the mark.
  function markSize(d) {
    return d > 0.67 ? [rand() < 0.4 ? 2 : 1, Math.round(rnd(3, 7))] : d > 0.34 ? [2, 2] : [1, 1];
  }
  // A band of ground behind a top edge. The marks thin out above the edge
  // so the band dissolves into the one behind it, and stop at `until`.
  function terrace(top, until, d, fam, o) {
    o = o || {};
    var fade = o.fade == null ? H * (0.03 + d * 0.05) : o.fade;
    var raised = function (x) { return top(x) - fade; };
    marksOf(flat(raised), { size: o.size || markSize(d), cover: o.cover || (d > 0.67 ? rnd(0.9, 1.2) : d > 0.34 ? rnd(0.7, 1) : 1),
      c: fam, spread: o.spread == null ? 10 : o.spread, dl: o.dl || [-12, 14], pepper: o.pepper || pick(P.bloom),
      rate: o.rate == null ? (d > 0.67 ? rnd(0.1, 0.3) : rnd(0.06, 0.18)) : o.rate, slant: o.slant == null ? (d > 0.67 ? 0.35 : 0) : o.slant,
      lean: o.lean, shade: o.shade == null ? -10 : o.shade, until: until, edge: top, fade: fade });
    return { top: top, raised: raised, fade: fade, until: until };
  }
  // Flowers scattered over a terrace: a few dabs of one bloom colour.
  function flowers(t, fam, cover) {
    marksOf(flat(t.raised), { size: [2, 2], cover: cover || rnd(0.06, 0.16), c: fam, spread: 8, dl: [-6, 10], until: t.until, edge: t.top, fade: t.fade });
  }
  // A bush, a crown, a cloud: a mass of marks that thins toward its rim.
  function bush(cx, cy, rx, ry, fam, d, o) {
    o = o || {};
    marksOf(cloud(cx, cy, rx, ry, o.lobes || Math.round(rnd(1, 3))),
      { size: o.size || (d > 0.5 ? [2, 3] : d > 0.2 ? [2, 2] : rand() < 0.5 ? [1, 1] : [2, 1]), cover: o.cover || 1.1, c: fam, spread: o.spread == null ? 8 : o.spread,
        dl: o.dl || [-16, 10], pepper: o.pepper || pick(P.bloom), rate: o.rate == null ? 0.15 : o.rate, slant: o.slant, lean: o.lean,
        shade: o.shade == null ? 24 : o.shade, fall: o.fall || 0.45 });
  }
  // A clump of flowers in one colour, sitting on the ground.
  function posy(cx, cy, rx, ry, fam) {
    marksOf(cloud(cx, cy, rx, ry, 1), { size: [2, 2], cover: rnd(0.25, 0.5), c: fam, spread: 6, dl: [-6, 10], fall: 0.6 });
  }
  // A limb: a chain of small lobes from one point to another, the width
  // easing from w0 to w1 and the whole bowed a little to one side. A
  // trunk is a limb too, just a long one.
  function limb(x0, y0, x1, y1, w0, w1, bow) {
    var dx = x1 - x0, dy = y1 - y0, len = Math.sqrt(dx * dx + dy * dy), ls = [], k;
    var n = Math.max(3, Math.min(40, Math.round(len / Math.max(w0, MC * 2)))), step = len / n;
    for (k = 0; k <= n; k++) {
      var t = k / n, b = Math.sin(t * Math.PI) * bow, w = w0 + (w1 - w0) * t;
      ls.push(lobe(x0 + dx * t - dy * b, y0 + dy * t + dx * b, w, Math.max(w * 1.2, step * 0.8), 0.25));
    }
    return ls;
  }
  // A tree: a trunk that tapers and leans and forks near the top into a
  // few limbs, under a crown wrapped round the fork so the limbs vanish
  // into it. The trunk is broken strokes thinning toward its sides, not a
  // line, with the odd pale fleck of bark; the crown is shaded underneath
  // so it reads as a mass with weight. Options: rx, the crown's half-width
  // (else a share of the height); size, pepper, rate, cover, lobes for
  // the crown.
  function tree(x, base, h, w, fam, d, o) {
    o = o || {};
    var lean = rnd(-0.2, 0.2), fh = h * rnd(0.55, 0.7), fx = x + fh * lean, fy = base - fh, k;
    var ls = limb(x, base, fx, fy, w, w * 0.45, rnd(-0.07, 0.07));
    var limbs = Math.round(rnd(2, 3)), a0 = rnd(-0.3, 0.3);
    for (k = 0; k < limbs; k++) {
      var a = a0 + (k / (limbs - 1) - 0.5) * rnd(1.2, 2) + rnd(-0.2, 0.2), L = h * rnd(0.14, 0.26);
      ls = ls.concat(limb(fx, fy, fx + Math.sin(a) * L, fy - Math.cos(a) * L, w * 0.45, w * 0.15, rnd(-0.1, 0.1)));
    }
    marksOf({ kind: "blob", lobes: ls }, { size: [1, 2], cover: 1.3, c: shift(P.line, 8), spread: 5, dl: [-8, 8],
      pepper: shift(P.line, 34, -10), rate: 0.08, fall: 0.5 });
    var rx = o.rx || Math.max(w * 4, h * rnd(0.3, 0.5)), ry = rx * rnd(0.6, 0.9);
    bush(fx, fy - ry * rnd(0.4, 0.6), rx, ry, fam, d, { lobes: o.lobes || Math.round(rnd(3, 4)), size: o.size, cover: o.cover || 1.3,
      pepper: o.pepper, rate: o.rate, fall: 0.45, shade: 30 });
  }
  // A sun or a moon: a tight disc of pale dots.
  function sun() {
    var r = W * rnd(0.02, 0.045), c = pick(P.bloom);
    marksOf({ kind: "blob", lobes: [lobe(W * rnd(0.1, 0.9), H * rnd(0.08, 0.3), r, r, 0.1)] },
      { size: [1, 1], cover: 1.3, c: c, spread: 5, dl: [-4, 10], pepper: shift(c, 14), rate: 0.2, fall: 0.3 });
  }
  // A path or a stream: a string of small clouds in a pale or an accent
  // colour, so it reads as a gap in the marks rather than a line.
  function trail(width, y0, y1, c) {
    var ls = [], x = W * rnd(-0.1, 0.5), y = rnd(y0, y1), ang = rnd(-0.6, 0.6), step = Math.max(width * 0.8, W * 0.012), gone = 0;
    while (gone < W * 1.3) {
      ls.push(lobe(x, y, width * rnd(0.7, 1.3), width * rnd(0.5, 1), 0.3));
      ang += rnd(-0.3, 0.3); ang = Math.max(-1.2, Math.min(1.2, ang));
      x += Math.cos(ang) * step; y += Math.sin(ang) * step; gone += step;
    }
    marksOf({ kind: "blob", lobes: ls }, { size: [2, 1], cover: 1, c: c || (rand() < 0.5 ? shift(pale(), 4) : pick(P.accent)), spread: 6, dl: [-8, 8], fall: 0.6 });
  }
  // The tops of n bands from a horizon to the foot of the frame, the near
  // ones taller, as they would be.
  function tiers(hz, n, pow) {
    var tops = [];
    for (var k = 0; k <= n; k++) tops.push(hz + (H - hz) * Math.pow(k / n, pow || 1.5));
    return tops;
  }

  // --- Studies -----------------------------------------------------------
  // A meadow: a low horizon with a hedge of far masses along it, wide bands
  // of grass in one hue, flowers thick underfoot, and a path through.
  function buildMeadow() {
    ground();
    var hz = H * rnd(0.3, 0.45), L = leadHue(P.field, 14), last = null, i, n;
    sky(hz);
    n = count(3, 6);
    for (i = 0; i < n; i++) {
      var fam = pickFar(P.mass, last, 24), rx = W * rnd(0.08, 0.22), ry = H * rnd(0.05, 0.14); last = fam;
      bush(W * rnd(-0.05, 1.05), hz + H * rnd(-0.02, 0.02) - ry * 0.4, rx, ry, fam, 0, { shade: 18, fall: 0.5, pepper: pickFar(P.mass, fam, 40) });
    }
    var tops = tiers(hz, 3, 1.4), ts = [];
    for (i = 0; i < 3; i++) {
      var d = (i + 0.5) / 3;
      ts.push(terrace(wobbleTop(tops[i], H * (0.02 + d * 0.06)), Math.min(H, tops[i + 1] + H * 0.1), d, L.near(rnd(-8, 8)), { pepper: L.accent, rate: rnd(0.04, 0.12) }));
    }
    n = count(3, 8);
    for (i = 0; i < n; i++) {
      var py = rnd(tops[1], H), pd = (py - hz) / (H - hz);
      posy(W * rnd(0, 1), py, W * rnd(0.03, 0.1) * (0.5 + pd), H * rnd(0.015, 0.05) * (0.5 + pd), pickFar(P.bloom, L.lead, 30));
    }
    if (rand() < 0.7) trail(rnd(8, 20), hz + H * 0.1, H);
  }
  // A thicket: no horizon, no sky. Masses of leaf crowd the frame in one
  // hue and its neighbours, the nearer the larger the mark, and the pale
  // ground shows in the gaps between them.
  function buildThicket() {
    ground();
    var L = leadHue(P.mass.concat(P.field), 18), n = count(8, 16), ys = [], i;
    for (i = 0; i < n; i++) ys.push(rand());
    ys.sort();
    for (i = 0; i < n; i++) {
      var d = ys[i], rx = W * rnd(0.1, 0.3), ry = Math.min(H * 0.4, rx * rnd(0.5, 1)), fam = L.one(rnd(-12, 8));
      bush(W * rnd(0, 1), H * (d * 1.1 - 0.05), rx, ry, fam, d, { lobes: Math.round(rnd(2, 4)),
        size: d > 0.6 ? [rand() < 0.5 ? 1 : 2, Math.round(rnd(2, 5))] : d > 0.3 ? [2, 2] : [1, 1], cover: rnd(0.9, 1.2),
        rate: rnd(0.08, 0.2), pepper: pickFar(P.bloom.concat(P.field), fam, 30), fall: 0.4, shade: 20, slant: d > 0.6 ? 0.3 : 0 });
    }
  }
  // A heath: open moor under a wide sky. Low bands in muted colours, thinly
  // marked so the ground shows through, a few low bushes, and a broad track.
  function buildHeath() {
    var pl = ground(), hz = H * rnd(0.22, 0.38), n = count(4, 7), tops = tiers(hz, n, 1.3), last = null, k;
    sky(hz);
    for (k = 0; k < n; k++) {
      var d = (k + 0.5) / n, fam = pickFar(P.field, last, 20); last = fam;
      terrace(wobbleTop(tops[k], H * (0.02 + d * 0.06)), Math.min(H, tops[k + 1] + H * 0.08), d, shift(fam, rnd(0, 8), -12),
        { cover: rnd(0.45, 0.75), rate: rnd(0.03, 0.1), pepper: pickFar(P.field, fam, 40) });
    }
    n = count(2, 5);
    for (k = 0; k < n; k++) {
      var by = rnd(hz + H * 0.05, H * 0.9), bd = (by - hz) / (H - hz), rx = W * rnd(0.03, 0.1) * (0.5 + bd);
      bush(W * rnd(0, 1), by, rx, rx * rnd(0.35, 0.6), pick(P.mass), bd, { cover: 1, rate: 0.1 });
    }
    trail(rnd(14, 36), hz + H * 0.1, H, shift(pl, -6));
  }
  // Blossom: trees in flower. Crowns of bloom colour with a pepper of pale,
  // over a ground of green dabs with petals fallen onto it.
  function buildBlossom() {
    var pl = ground(), hz = H * rnd(0.5, 0.7), L = leadHue(P.bloom, 12), i, n;
    if (rand() < 0.5) sky(hz);
    var g = pickFar(P.mass.concat(P.field), L.lead, 60);
    terrace(wobbleTop(hz, H * 0.04), H, 0.5, g, { pepper: L.near(10), rate: rnd(0.1, 0.25), shade: -8 });
    terrace(wobbleTop(hz + (H - hz) * 0.55, H * 0.05), H, 0.9, shift(g, -6), { pepper: L.near(10), rate: rnd(0.15, 0.3) });
    // The orchard: broad low trees standing on the ground, the nearer ones
    // in front.
    n = count(4, 9);
    var trees = [];
    for (i = 0; i < n; i++) trees.push({ x: W * rnd(0, 1), base: rnd(hz + H * 0.03, H * 0.95) });
    trees.sort(function (a, b) { return a.base - b.base; });
    trees.forEach(function (t) {
      var d = clamp01((t.base - hz) / (H - hz)), h = H * rnd(0.18, 0.4) * (0.6 + d * 0.5);
      tree(t.x, t.base, h, h * rnd(0.02, 0.035), L.one(rnd(-6, 8)), 0.5,
        { rx: h * rnd(0.4, 0.6), lobes: 3, size: [2, 2], cover: rnd(1.1, 1.4), pepper: shift(pl, 4), rate: rnd(0.12, 0.25) });
    });
  }
  // Strata: the land as stacked bands of colour, each its own family, far
  // ones in dots, near ones in strokes, every edge dissolving into the next.
  function buildStrata() {
    ground();
    var skyed = rand() < 0.5, hz = skyed ? H * rnd(0.1, 0.25) : 0, n = count(5, 9), tops = tiers(hz, n, 1.25), pool = P.field.concat(P.mass), last = null, k, b;
    if (skyed) sky(hz);
    for (k = 0; k < n; k++) {
      var d = (k + 0.5) / n, fam = pickFar(pool, last, 30); last = fam;
      var top = k || skyed ? wobbleTop(tops[k], H * rnd(0.04, 0.12)) : level(-H * 0.1);
      terrace(top, Math.min(H, tops[k + 1] + H * 0.1), d, fam, { rate: rnd(0.04, 0.14) });
      var nb = d > 0.3 ? count(0, 2) : 0;
      for (b = 0; b < nb; b++) {
        var bx = W * rnd(0, 1), brx = W * rnd(0.03, 0.1) * (0.6 + d * 0.6), bry = brx * rnd(0.6, 1);
        bush(bx, top(bx) + H * 0.01 - bry * 0.7, brx, bry, pickFar(pool, fam, 30), d);
      }
    }
    if (rand() < 0.3) trail(rnd(6, 16), hz + H * 0.2, H);
  }
  // A range in fog: ridges in one hue, the far ones pale and thin so the
  // ground reads as mist, each nearer one darker and denser. Some days a sun.
  function buildFog() {
    ground();
    sky();
    if (rand() < 0.5) sun();
    var base = pick(P.mass), n = count(4, 7);
    for (var i = 0; i < n; i++) {
      var t = n > 1 ? i / (n - 1) : 1, d = (i + 0.5) / n;
      var c = [base[0], cl(base[1] * (0.45 + 0.55 * t)), 80 - 52 * t];
      terrace(ridgeTop(H * (0.22 + 0.62 * t) + H * rnd(-0.05, 0.05), H * rnd(0.08, 0.22)), H, d, c,
        { cover: 0.35 + 0.75 * t, fade: H * (0.08 - 0.05 * t), rate: rnd(0.02, 0.08), pepper: shift(c, 14), slant: d > 0.67 ? 0.25 : 0, shade: -6 });
    }
  }
  // Dunes: leaning slopes that cross, lit face and shadow face by turns,
  // the strokes leaning with the slope.
  function buildDunes() {
    var pl = ground(), y0 = H * rnd(0.15, 0.45), a = pick(P.field), n = count(4, 8), y = y0, k;
    sky(y0);
    if (rand() < 0.5) sun();
    for (k = 0; k < n; k++) {
      var lit = k % 2 === 0, d = (k + 0.5) / n, m = rnd(-0.35, 0.35);
      var c = lit ? shift(a, rnd(-2, 10)) : shift(a, rnd(-18, -8), -6);
      terrace(slopeTop(y, m, H * rnd(0.02, 0.08)), H, d, c, { cover: 0.5 + 0.6 * d, rate: rnd(0.02, 0.08), pepper: lit ? shift(a, -14) : shift(a, 10),
        slant: 0.1, lean: d > 0.5 ? (m > 0 ? -0.5 : 0.5) : 0, size: d > 0.67 ? [1, Math.round(rnd(3, 6))] : d > 0.34 ? [2, 2] : [1, 1],
        fade: H * rnd(0.01, 0.03), shade: 0 });
      y += (H - y0) / n * rnd(0.6, 1.5);
    }
    if (rand() < 0.4) trail(rnd(4, 10), y0 + H * 0.1, H, shift(pl, -8));
  }
  // Big sky: most of the frame is weather, built from the same marks as the
  // land, with a thin strip of ground at the foot.
  function buildSky() {
    ground();
    var y0 = H * rnd(0.68, 0.88), sc = pick(P.sky), sc2 = rand() < 0.6 ? pickOther(P.sky, sc) : shift(sc, 12), i, n;
    wash(level(0), shift(sc, 10), sc, y0 + H * 0.1);
    marksOf(flat(level(-10)), { size: rand() < 0.5 ? [1, 1] : [2, 1], cover: rnd(0.5, 0.9), c: sc, spread: 8, dl: [-8, 10], pepper: sc2, rate: rnd(0.2, 0.4), shade: 14, until: y0 + H * 0.05 });
    n = count(1, 4);
    for (i = 0; i < n; i++) {
      var cc = shift(sc, rnd(14, 24), -14);
      bush(W * rnd(0.05, 0.95), y0 * rnd(0.1, 0.7), W * rnd(0.1, 0.25), H * rnd(0.02, 0.06), cc, 0.3, { lobes: Math.round(rnd(2, 4)), size: [2, 1], cover: 1.2, pepper: shift(cc, -10), fall: 0.5, shade: 20 });
    }
    if (rand() < 0.5) sun();
    var fam = pick(P.field.concat(P.mass));
    terrace(wobbleTop(y0, H * 0.03), H, 0.8, fam, { cover: rnd(1, 1.3), fade: H * 0.02 });
    n = count(0, 3);
    for (i = 0; i < n; i++) {
      var rx = W * rnd(0.03, 0.1), ry = H * rnd(0.02, 0.06);
      bush(W * rnd(0.05, 0.95), y0 + H * rnd(-0.01, 0.03) - ry * 0.5, rx, ry, pickFar(P.mass, fam, 20), 0.3, { shade: 18 });
    }
  }
  // A grove: stems and crowns, the nearer trees in front, standing in
  // clumps. One hue leads the crowns, and one tree in five takes an accent.
  function buildGrove() {
    ground();
    var hz = H * rnd(0.45, 0.7), lead = pick(P.mass.concat(P.field)), gc = shift(lead, rnd(14, 24), -8), accent = pick(P.bloom), i;
    sky(hz);
    if (hueDist(accent[0], lead[0]) < 30) accent = pick(P.accent);
    terrace(wobbleTop(hz, H * 0.03), H, 0.4, gc, { pepper: accent, rate: 0.06 });
    terrace(wobbleTop(hz + (H - hz) * 0.55, H * 0.05), H, 0.9, shift(gc, -5), { pepper: accent, rate: rnd(0.08, 0.2) });
    var clumps = count(1, 3), cs = [];
    for (i = 0; i < clumps; i++) cs.push(W * rnd(0.05, 0.95));
    var n = count(5, 11), trees = [];
    for (i = 0; i < n; i++) trees.push({ x: pick(cs) + W * rnd(-0.14, 0.14), base: rnd(hz + H * 0.02, H * 1.02) });
    trees.sort(function (a, b) { return a.base - b.base; });
    trees.forEach(function (t) {
      var d = clamp01((t.base - hz) / (H - hz)), h = H * rnd(0.2, 0.5) * (0.6 + d * 0.5);
      var fam = rand() < 0.18 ? accent : shift(lead, rnd(-16, 16), rnd(-10, 6));
      tree(t.x, t.base, h, h * rnd(0.018, 0.03), fam, d,
        { size: d > 0.6 ? [2, 3] : [2, 2], pepper: pickFar(P.bloom.concat(P.field), fam, 30), rate: rnd(0.08, 0.2) });
    });
  }
  // Patchwork: the land from above, a quilt of plots each in its own family
  // of marks, hedged by the pale ground showing between them, with a river
  // through it.
  function buildPatchwork() {
    ground();
    var L = leadHue(P.field.concat(P.mass), 20), i, j;
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
        var pts = [v[j][i], v[j][i + 1], v[j + 1][i + 1], v[j + 1][i]], cx = 0, cy = 0, k;
        for (k = 0; k < 4; k++) { cx += pts[k][0] / 4; cy += pts[k][1] / 4; }
        // Each plot pulled in a little from its fences, so the ground shows
        // between them as hedge and lane.
        var inset = rnd(0.88, 0.96), fam = L.one(rnd(-14, 18));
        pts = pts.map(function (p) { return [cx + (p[0] - cx) * inset, cy + (p[1] - cy) * inset]; });
        marksOf({ kind: "poly", pts: pts }, { size: pick([[1, 1], [2, 2], [2, 1], [1, 2], [1, 3]]), cover: rnd(0.7, 1.1), c: fam, spread: 8, dl: [-10, 10],
          pepper: pickFar(P.bloom.concat(P.field), fam, 30), rate: rnd(0.04, 0.15), slant: rand() < 0.3 ? 0.4 : 0 });
      }
    }
    trail(rnd(10, 28), 0, H);
    var n = count(1, 4);
    for (i = 0; i < n; i++) bush(W * rnd(0.05, 0.95), H * rnd(0.05, 0.95), W * rnd(0.02, 0.05), W * rnd(0.015, 0.04), L.near(rnd(-26, -14)), 0.4, { size: [2, 2] });
  }
  // Terraces: contour rings around a summit, by turns one colour and the
  // other, each ring a band of marks from its outer rim to the next ring in.
  // The outer rings are near, so their marks are strokes; the summit is dots.
  function buildTerraces() {
    ground();
    var cx = W * rnd(0.15, 0.85), cy = H * rnd(0.15, 0.85), R = Math.max(W, H) * rnd(0.6, 1.0), ry = rnd(0.55, 1), sd = rnd(0, 100), i;
    // One ring colour from the field, the other from the masses, so the
    // rings alternate light and dark as well as hue.
    var n = count(6, 12), a = pick(P.field), b = pickFar(P.mass, a, 30);
    if (hueDist(a[0], b[0]) < 20) b = shift(b, 24);
    for (var k = n; k >= 1; k--) {
      var t = k / n, odd = k % 2 === 1, c = shift(odd ? a : b, (1 - t) * 20);
      var lb = { cx: cx, cy: cy, rx: R * t, ry: R * ry * t, seed: sd + k * 0.015, amp: 0.44 };
      marksOf({ kind: "blob", lobes: [lb] }, { size: t > 0.66 ? [1, Math.round(rnd(2, 4))] : t > 0.33 ? [2, 2] : [1, 1], cover: 1.3, c: c, spread: 8, dl: [-10, 10],
        pepper: pick(P.bloom), rate: odd ? 0.08 : 0.03, slant: t > 0.66 ? 0.3 : 0, fall: 0.12, ring: k > 1 ? (k - 1) / k : 0 });
    }
    if (rand() < 0.5) trail(rnd(4, 12), 0, H);
    n = count(0, 3);
    for (i = 0; i < n; i++) bush(W * rnd(0.05, 0.95), H * rnd(0.05, 0.95), W * rnd(0.015, 0.04), W * rnd(0.012, 0.03), pick(P.mass), 0.4, { size: [2, 2] });
  }
  // A terraced garden seen from where you stand: bands of ground step back
  // to a high horizon, each its own colour family, dots in the distance and
  // tall strokes at your feet, with bushes sitting on the terrace edges.
  function buildGarden() {
    ground();
    var hz = H * rnd(0.16, 0.4), n = Math.round(rnd(4, 7)), tops = tiers(hz, n), k, b, nb, fam, last = null;
    var groundPool = P.field.concat(P.mass), massPool = P.mass.concat(P.bloom, P.field);
    var skyed = rand() < 0.4;
    if (skyed) sky(hz);
    // Without a sky, a far band of dots fills the top so no bare ground
    // shows between the masses.
    else { fam = pick(massPool); last = fam; terrace(level(-H * 0.1), hz + H * 0.15, 0, shift(fam, 0, 6), { fade: H * 0.02, cover: 0.9 }); }
    // The far masses along the horizon.
    nb = count(skyed ? 3 : 5, skyed ? 7 : 9);
    for (b = 0; b < nb; b++) {
      var fx = W * rnd(-0.05, 1.05), frx = W * rnd(0.08, 0.2), fry = H * rnd(0.1, skyed ? 0.22 : 0.34);
      fam = pickFar(massPool, last, 28); last = fam;
      bush(fx, hz + H * rnd(-0.03, 0.03) - fry * (skyed ? 0.6 : rnd(0.3, 0.8)), frx, fry, fam, 0,
        { lobes: Math.round(rnd(1, 3)), dl: [-14, 10], pepper: pickFar(massPool, fam, 40), rate: rnd(0.1, 0.22), shade: 22, fall: 0.5 });
    }
    for (k = 0; k < n; k++) {
      var d = (k + 0.5) / n, top = wobbleTop(tops[k], H * (0.03 + d * 0.08));
      fam = pickFar(groundPool, last, 28); last = fam;
      var t = terrace(top, Math.min(H, tops[k + 1] + H * 0.1), d, fam);
      if (d > 0.67 && rand() < 0.7) flowers(t, pickFar(P.bloom, fam, 30));
      nb = count(0, d < 0.5 ? 3 : 1);
      for (b = 0; b < nb; b++) {
        var bx = W * rnd(0, 1), brx = W * rnd(0.04, 0.12) * (0.6 + d * 0.4), bry = brx * rnd(0.6, 1.1);
        bush(bx, top(bx) + H * 0.01 - bry * 0.7, brx, bry, pickFar(massPool, fam, 30), d, { lobes: Math.round(rnd(1, 2)) });
      }
    }
  }
  var BUILD = { meadow: buildMeadow, thicket: buildThicket, heath: buildHeath, blossom: buildBlossom, strata: buildStrata,
    fog: buildFog, dunes: buildDunes, sky: buildSky, grove: buildGrove, patchwork: buildPatchwork, terraces: buildTerraces, garden: buildGarden };

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


  // --- Drawing -----------------------------------------------------------
  function drawShape(sh) {
    var path = shapePath(sh.base), bb = bbox(sh.base);
    if (sh.until != null) bb[3] = Math.min(bb[3], sh.until);
    ctx.save(); ctx.clip(path);
    if (sh.kind === "marks") stamp(sh, bb);
    else {
      var g = ctx.createLinearGradient(0, bb[1], 0, bb[3]);
      g.addColorStop(0, css(sh.c1)); g.addColorStop(1, css(sh.c2));
      ctx.fillStyle = g; ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    }
    ctx.restore();
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
    keyName = KEYS.indexOf(kp) >= 0 ? kp : kr < 0.75 ? "full" : kr < 0.92 ? "duo" : "ink";
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
    MC = phone ? Math.max(2, Math.round(CELL / 2)) : CELL;

    shapes = [];
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

  // The palette: a fresh seed, painted in place, with the address kept in
  // step so the picture can be shared or come back to. On phones the
  // picture is at the top of the page, so the page scrolls up to show it.
  var reseed = document.querySelector(".reseed");
  function nextSeed() { return Math.floor(Math.random() * 1e6) + 1; }
  function seedUrl(n) { var u = new URL(location.href); u.searchParams.set("seed", n); return u.pathname + u.search; }
  if (reseed) {
    reseed.href = seedUrl(nextSeed());
    reseed.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      seed = parseInt(new URL(reseed.href, location.href).searchParams.get("seed"), 10);
      history.replaceState(null, "", seedUrl(seed));
      render();
      reseed.href = seedUrl(nextSeed());
      if (phone) scrollTo({ top: 0, behavior: "smooth" });
    });
  }
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
