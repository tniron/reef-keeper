/*
 * Reef Keeper — procedural 2D sprites. Every species is drawn from a small
 * "look": a body profile, colours and a list of marks (stripes, bands,
 * spots…). Hand-made looks for the encyclopedia species live in looks.js;
 * species added later get a generated one, so they never need art.
 * All drawers paint centred on (0, 0), facing right.
 */
(function (root) {
	'use strict';

	var TAU = Math.PI * 2;

	function hash(str) {
		var h = 2166136261;
		for (var i = 0; i < str.length; i++) {
			h ^= str.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return h >>> 0;
	}

	/* Deterministic 0..1 numbers, so spots stay put between frames. */
	function seeded(seed) {
		var s = seed >>> 0 || 1;
		return function () {
			s = Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9 >>> 0;
			return (s >>> 8) / 16777216;
		};
	}

	/*
	 * Body profiles. ry: body height / half length; nose: 0 pointed … 1 blunt;
	 * ped: tail-root height (share of ry); hx: where the body is tallest;
	 * bel: belly depth; tail kind + length/height; dorsal/anal fin kind,
	 * height and span (d0→d1, a0→a1 along the body, 1 = nose, -1 = tail);
	 * eye position (ex, ey) and radius (er); pect: pectoral fin scale.
	 */
	var PROFILES = {
		damsel: { ry: 0.6, nose: 0.75, ped: 0.3, hx: 0.05, bel: 1, tail: 'fork', tl: 0.5, th: 0.5, dorsal: 'long', dh: 0.22, d0: 0.3, d1: -0.74, anal: 'long', ah: 0.2, a0: -0.1, a1: -0.72, ex: 0.6, ey: 0.22, er: 0.12, pect: 1 },
		chromis: { ry: 0.56, nose: 0.7, ped: 0.26, hx: 0.05, bel: 1, tail: 'deepfork', tl: 0.62, th: 0.58, dorsal: 'long', dh: 0.2, d0: 0.3, d1: -0.72, anal: 'long', ah: 0.18, a0: -0.12, a1: -0.7, ex: 0.62, ey: 0.18, er: 0.14, pect: 1 },
		clown: { ry: 0.52, nose: 0.95, ped: 0.36, hx: 0.05, bel: 1, tail: 'round', tl: 0.4, th: 0.42, dorsal: 'double', dh: 0.2, d0: 0.32, d1: -0.72, anal: 'round', ah: 0.2, a0: -0.15, a1: -0.65, ex: 0.62, ey: 0.18, er: 0.11, pect: 1 },
		tang: { ry: 0.88, nose: 0.3, ped: 0.17, hx: -0.05, bel: 1, tail: 'truncate', tl: 0.36, th: 0.42, dorsal: 'sail', dh: 0.3, d0: 0.32, d1: -0.8, anal: 'sail', ah: 0.28, a0: 0.05, a1: -0.8, ex: 0.42, ey: 0.36, er: 0.1, pect: 1 },
		anthias: { ry: 0.45, nose: 0.5, ped: 0.22, hx: 0.05, bel: 1, tail: 'lyre', tl: 0.62, th: 0.55, dorsal: 'long', dh: 0.2, d0: 0.32, d1: -0.75, anal: 'round', ah: 0.22, a0: -0.2, a1: -0.64, ex: 0.68, ey: 0.15, er: 0.12, pect: 1, pelvic: 'long' },
		cardinal: { ry: 0.52, nose: 0.75, ped: 0.28, hx: 0.05, bel: 1, tail: 'fork', tl: 0.48, th: 0.5, dorsal: 'double', dh: 0.3, d0: 0.3, d1: -0.7, anal: 'round', ah: 0.24, a0: -0.15, a1: -0.62, ex: 0.62, ey: 0.18, er: 0.17, pect: 1 },
		basslet: { ry: 0.36, nose: 0.55, ped: 0.32, hx: 0.05, bel: 1, tail: 'truncate', tl: 0.42, th: 0.44, dorsal: 'long', dh: 0.17, d0: 0.32, d1: -0.76, anal: 'round', ah: 0.2, a0: -0.2, a1: -0.68, ex: 0.7, ey: 0.12, er: 0.1, pect: 1 },
		wrasse: { ry: 0.4, nose: 0.45, ped: 0.34, hx: 0.05, bel: 1, tail: 'round', tl: 0.4, th: 0.36, dorsal: 'long', dh: 0.13, d0: 0.38, d1: -0.76, anal: 'long', ah: 0.13, a0: -0.08, a1: -0.74, ex: 0.66, ey: 0.15, er: 0.13, pect: 1 },
		dottyback: { ry: 0.4, nose: 0.65, ped: 0.34, hx: 0.05, bel: 1, tail: 'round', tl: 0.44, th: 0.4, dorsal: 'long', dh: 0.15, d0: 0.38, d1: -0.78, anal: 'long', ah: 0.15, a0: -0.12, a1: -0.76, ex: 0.7, ey: 0.15, er: 0.12, pect: 1 },
		goby: { ry: 0.3, nose: 0.95, ped: 0.55, hx: 0.2, bel: 0.85, tail: 'round', tl: 0.34, th: 0.22, dorsal: 'double', dh: 0.22, d0: 0.25, d1: -0.72, anal: 'long', ah: 0.12, a0: -0.05, a1: -0.7, ex: 0.68, ey: 0.42, er: 0.085, pect: 1 },
		stubgoby: { ry: 0.46, nose: 1, ped: 0.5, hx: 0.2, bel: 0.95, tail: 'round', tl: 0.34, th: 0.3, dorsal: 'double', dh: 0.26, d0: 0.25, d1: -0.72, anal: 'round', ah: 0.18, a0: -0.1, a1: -0.66, ex: 0.62, ey: 0.4, er: 0.11, pect: 1 },
		cleaner: { ry: 0.2, nose: 0.55, ped: 0.6, hx: 0.1, bel: 1, tail: 'round', tl: 0.28, th: 0.14, dorsal: 'double', dh: 0.12, d0: 0.2, d1: -0.74, anal: 'long', ah: 0.08, a0: -0.05, a1: -0.74, ex: 0.74, ey: 0.1, er: 0.065, pect: 0.8 },
		blenny: { ry: 0.26, nose: 1, ped: 0.45, hx: 0.35, bel: 0.9, tail: 'round', tl: 0.3, th: 0.2, dorsal: 'long', dh: 0.14, d0: 0.45, d1: -0.8, anal: 'long', ah: 0.1, a0: 0, a1: -0.76, ex: 0.7, ey: 0.55, er: 0.11, pect: 1 },
		dragonet: { ry: 0.48, nose: 0.9, ped: 0.32, hx: 0.25, bel: 0.95, tail: 'fan', tl: 0.5, th: 0.5, dorsal: 'sail', dh: 0.36, d0: 0.15, d1: -0.72, anal: 'long', ah: 0.18, a0: -0.1, a1: -0.72, ex: 0.62, ey: 0.45, er: 0.13, pect: 1.8 }
	};
	var LEGACY_SHAPE = { round: 'damsel', long: 'goby', tall: 'tang', slim: 'anthias' };
	var FIXED = { mushroom: 1, hammer: 1, tree: 1 };

	/* Older looks used one "pattern" + "accent"; turn that into marks. */
	function legacyMarks(look) {
		var c = look.accent;
		switch (look.pattern) {
			case 'bands': return [{ t: 'bands', xs: [0.48, -0.02, -0.68], w: 0.18, color: c, edge: '#1b1b24' }];
			case 'split': return [{ t: 'split', x: -0.25, color: c }];
			case 'stripe': return [{ t: 'stripe', y: -0.2, h: 0.34, color: c }];
			case 'gradient': return [{ t: 'grad', head: c, tail: look.body, x0: 0.9, x1: -0.1 }];
			case 'spots': return [{ t: 'dots', n: 14, r: 0.06, color: c, seed: 1 }];
			case 'psy': return [{ t: 'psy', color: c, edge: 'rgba(0,0,0,.35)' }];
			default: return [];
		}
	}

	var normCache = typeof WeakMap === 'function' ? new WeakMap() : null;

	/* A look with everything filled in: profile, colours, marks. */
	function normalize(look) {
		if (normCache && normCache.has(look)) return normCache.get(look);
		var shape = LEGACY_SHAPE[look.shape] || look.shape;
		var n = {};
		for (var k in look) n[k] = look[k];
		n.shape = shape;
		if (PROFILES[shape]) {
			var p = {};
			var base = PROFILES[shape];
			for (var j in base) p[j] = base[j];
			var over = look.p || {};
			for (var o in over) p[o] = over[o];
			n.prof = p;
			n.marks = look.marks || legacyMarks(look);
			n.fin = look.fin || look.body;
			n.tail = look.tail || n.fin;
			n.dorsalColor = look.dorsal || n.fin;
			n.analColor = look.anal || n.fin;
		}
		if (normCache) normCache.set(look, n);
		return n;
	}

	/* Fallback look for species without one: derived from the name. */
	function generated(species) {
		var h = hash(species.slug || species.name || species.sid);
		var rnd = seeded(h);
		var hue = h % 360;
		var body = 'hsl(' + hue + ',75%,58%)';
		var accent = 'hsl(' + ((hue + 150) % 360) + ',85%,62%)';
		var fin = 'hsl(' + hue + ',70%,48%)';
		if (species.cat === 'coral') {
			return { shape: ['mushroom', 'hammer', 'tree'][h % 3], body: body, accent: accent, fin: fin };
		}
		if (species.cat === 'invert') {
			return { shape: ['snail', 'crab'][h % 2], body: body, accent: accent, fin: fin, band: 'hsl(' + hue + ',60%,25%)', spots: fin, antenna: accent };
		}
		var shapes = ['damsel', 'chromis', 'clown', 'tang', 'anthias', 'cardinal', 'basslet', 'wrasse', 'dottyback', 'goby', 'stubgoby', 'cleaner', 'blenny'];
		var dark = 'hsl(' + hue + ',55%,22%)';
		var templates = [
			[],
			[{ t: 'stripe', y: -0.15, h: 0.3, color: accent }],
			[{ t: 'split', x: -0.3, color: accent }],
			[{ t: 'grad', head: accent, tail: body, x0: 0.8, x1: -0.2 }],
			[{ t: 'dots', n: 16, r: 0.05, color: accent, seed: h }],
			[{ t: 'bands', xs: [0.45, 0, -0.5], w: 0.14, color: accent, edge: dark }],
			[{ t: 'lines', n: 4, y0: -0.6, y1: 0.5, w: 0.07, color: accent }],
			[{ t: 'belly', y: 0.2, slope: 0.3, color: accent }],
			[{ t: 'back', y: -0.2, color: dark }, { t: 'stripe', y: 0.1, h: 0.18, color: accent }]
		];
		return {
			shape: shapes[(h >>> 8) % shapes.length],
			body: body,
			fin: fin,
			marks: templates[Math.floor(rnd() * templates.length)]
		};
	}

	function lookFor(species) {
		var raw = species.look || (root.ReefLooks && root.ReefLooks[species.slug]);
		if (!raw) {
			if (!species._rkLook) {
				try {
					Object.defineProperty(species, '_rkLook', { value: generated(species), enumerable: false });
				} catch (e) {
					return normalize(generated(species));
				}
			}
			raw = species._rkLook;
		}
		return normalize(raw);
	}

	/* ---------- fish ---------- */

	function drawFish(ctx, look, size, t, sick) {
		var P = look.prof;
		var a = size / 2;
		var b = a * P.ry;
		var tx = -a * 0.86;
		var pd = b * P.ped;
		var hxA = a * P.hx;
		var wag = Math.sin(t * (sick ? 4 : 9)) * 0.18;
		var pointy = 0.5 + (1 - P.nose) * 0.8;

		// Half height of the body at x (top side; the belly is scaled by bel).
		function half(x) {
			if (x >= hxA) {
				var v = Math.min(1, (x - hxA) / (a - hxA));
				return b * Math.pow(Math.max(0, 1 - v * v), pointy);
			}
			var u = Math.max(0, Math.min(1, (x - tx) / (hxA - tx)));
			return pd + (b - pd) * Math.sin(u * Math.PI / 2);
		}
		function edge(x, side) {
			return side < 0 ? -half(x) : half(x) * P.bel;
		}
		// Body-relative y: -1 back edge, +1 belly edge, at x.
		function yAt(x, y) {
			var hh = Math.max(half(Math.min(x, a)), b * 0.05);
			return y < 0 ? y * hh : y * hh * P.bel;
		}

		function bodyPath() {
			var N = 24;
			ctx.beginPath();
			ctx.moveTo(a, 0);
			for (var i = 1; i <= N; i++) {
				var x = a + (tx - a) * i / N;
				ctx.lineTo(x, edge(x, -1));
			}
			for (var j = N; j >= 0; j--) {
				var x2 = a + (tx - a) * j / N;
				ctx.lineTo(x2, edge(x2, 1));
			}
			ctx.closePath();
		}

		// A fin running along the back (side -1) or belly (side 1).
		function fin(kind, x0, x1, hgt, side, color, ring) {
			if (!kind || kind === 'none') return;
			var N = 18;
			var pts = [];
			for (var i = 0; i <= N; i++) {
				var u = i / N;
				var x = a * (x0 + (x1 - x0) * u);
				var f;
				switch (kind) {
					case 'round': f = Math.sin(Math.PI * u); break;
					case 'sail': f = Math.pow(Math.sin(Math.PI * u), 0.6) * (1.1 - 0.3 * u); break;
					case 'double':
						f = u < 0.42 ? Math.sin(Math.PI * u / 0.42) : 0.15 + 0.7 * Math.pow(Math.sin(Math.PI * (u - 0.42) / 0.58), 0.6);
						break;
					case 'spiky': f = Math.pow(Math.sin(Math.PI * u), 0.5) * (i % 2 ? 0.7 : 1.15); break;
					default: f = Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + u * 0.96)), 0.35);
				}
				pts.push([x, edge(x, side) + side * a * hgt * f * (1 + wag * 0.25)]);
			}
			ctx.beginPath();
			ctx.moveTo(pts[0][0], edge(pts[0][0], side) * 0.6);
			pts.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
			var last = pts[pts.length - 1][0];
			ctx.lineTo(last, edge(last, side) * 0.6);
			ctx.closePath();
			ctx.fillStyle = color;
			ctx.fill();
			if (look.finBands) {
				ctx.save();
				ctx.clip();
				ctx.fillStyle = look.finBands;
				for (var k = 0; k < 4; k++) {
					var bx = a * (x0 + (x1 - x0) * (0.12 + k * 0.25));
					ctx.fillRect(bx - a * 0.04, -a * 2, a * 0.08, a * 4);
				}
				ctx.restore();
			}
			if (look.finEdge) {
				ctx.strokeStyle = look.finEdge;
				ctx.lineWidth = Math.max(1, a * 0.035);
				ctx.beginPath();
				pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
				ctx.stroke();
			}
			if (ring) {
				// An eye-spot near the back of the fin (candy basslet, speckled damsel).
				var q = pts[Math.round(N * 0.8)];
				var r = Math.max(1.2, a * 0.06);
				var qx = q[0];
				var qy = (q[1] + edge(qx, side)) / 2;
				if (ring.ring) {
					ctx.fillStyle = ring.ring;
					ctx.beginPath();
					ctx.arc(qx, qy, r * 1.45, 0, TAU);
					ctx.fill();
				}
				ctx.fillStyle = ring.color;
				ctx.beginPath();
				ctx.arc(qx, qy, r, 0, TAU);
				ctx.fill();
			}
		}

		function tailFin() {
			var tl = a * P.tl;
			var th = a * P.th;
			var p0 = pd * 0.9;
			ctx.save();
			ctx.translate(tx + a * 0.03, 0);
			ctx.rotate(wag);
			ctx.beginPath();
			ctx.moveTo(0, -p0);
			switch (P.tail) {
				case 'deepfork':
				case 'fork':
					var notch = P.tail === 'deepfork' ? 0.32 : 0.55;
					ctx.quadraticCurveTo(-tl * 0.5, -th * 0.55, -tl, -th);
					ctx.quadraticCurveTo(-tl * (notch + 0.15), -th * 0.2, -tl * notch, 0);
					ctx.quadraticCurveTo(-tl * (notch + 0.15), th * 0.2, -tl, th);
					ctx.quadraticCurveTo(-tl * 0.5, th * 0.55, 0, p0);
					break;
				case 'lyre':
					ctx.quadraticCurveTo(-tl * 0.55, -th * 0.6, -tl * 1.35, -th * 1.15);
					ctx.quadraticCurveTo(-tl * 0.7, -th * 0.4, -tl * 0.55, 0);
					ctx.quadraticCurveTo(-tl * 0.7, th * 0.4, -tl * 1.35, th * 1.15);
					ctx.quadraticCurveTo(-tl * 0.55, th * 0.6, 0, p0);
					break;
				case 'truncate':
					ctx.lineTo(-tl, -th);
					ctx.quadraticCurveTo(-tl * 0.9, 0, -tl, th);
					ctx.lineTo(0, p0);
					break;
				case 'fan':
					ctx.bezierCurveTo(-tl * 0.4, -th * 1.1, -tl * 1.15, -th * 1.1, -tl * 1.15, 0);
					ctx.bezierCurveTo(-tl * 1.15, th * 1.1, -tl * 0.4, th * 1.1, 0, p0);
					break;
				default: // round
					ctx.bezierCurveTo(-tl * 0.5, -th, -tl * 1.1, -th * 0.8, -tl * 1.1, 0);
					ctx.bezierCurveTo(-tl * 1.1, th * 0.8, -tl * 0.5, th, 0, p0);
			}
			ctx.closePath();
			ctx.fillStyle = look.tail;
			ctx.fill();
			if (look.finBands) {
				ctx.save();
				ctx.clip();
				ctx.fillStyle = look.finBands;
				for (var k = 1; k < 4; k++) ctx.fillRect(-tl * k * 0.28 - a * 0.03, -th * 1.5, a * 0.06, th * 3);
				ctx.restore();
			}
			if (look.tailEdge || look.finEdge) {
				ctx.strokeStyle = look.tailEdge || look.finEdge;
				ctx.lineWidth = Math.max(1, a * 0.045);
				ctx.stroke();
			}
			if (look.finSpot) {
				ctx.fillStyle = look.finSpot.ring || look.finSpot.color;
				[-1, 1].forEach(function (s) {
					var sx = P.tail === 'truncate' ? -tl * 0.85 : -tl * 0.8;
					var sy = s * th * 0.75;
					if (look.finSpot.ring) {
						ctx.fillStyle = look.finSpot.ring;
						ctx.beginPath();
						ctx.arc(sx, sy, Math.max(1.4, a * 0.085), 0, TAU);
						ctx.fill();
					}
					ctx.fillStyle = look.finSpot.color;
					ctx.beginPath();
					ctx.arc(sx, sy, Math.max(1, a * 0.06), 0, TAU);
					ctx.fill();
				});
			}
			ctx.restore();
		}

		function marks() {
			look.marks.forEach(function (m) {
				switch (m.t) {
					case 'split':
						ctx.fillStyle = m.color;
						ctx.fillRect(-a * 1.2, -b * 1.3, (m.x + 1.2) * a, b * 2.6);
						break;
					case 'head':
						ctx.fillStyle = m.color;
						ctx.fillRect(m.x * a, -b * 1.3, a * 1.3, b * 2.6);
						break;
					case 'belly':
					case 'back':
						// The edge follows the body outline; slope tilts it (higher towards the tail when > 0).
						var sl = m.slope || 0;
						var line = function (x) { return m.y + sl * x; };
						if (m.t === 'belly') contour(line, 1.3, 1.2, -1.2, m.color);
						else contour(-1.3, line, 1.2, -1.2, m.color);
						break;
					case 'grad':
						var g = ctx.createLinearGradient(a * m.x0, 0, a * m.x1, 0);
						g.addColorStop(0, m.head);
						g.addColorStop(1, m.tail);
						ctx.fillStyle = g;
						ctx.fillRect(-a * 1.2, -b * 1.3, a * 2.4, b * 2.6);
						break;
					case 'bands':
						m.xs.forEach(function (x, i) { band(x, m.w * (m.wide === i ? 1.4 : 1), m.color, m.edge, m.bulge && m.bulge[i]); });
						break;
					case 'stripe':
						contour(m.y - m.h / 2, m.y + m.h / 2, m.x0 == null ? 1.1 : m.x0, m.x1 == null ? -1.1 : m.x1, stripeFill(m));
						break;
					case 'lines':
						for (var i = 0; i < m.n; i++) {
							var ly = m.n === 1 ? m.y0 : m.y0 + (m.y1 - m.y0) * i / (m.n - 1);
							contour(ly - m.w / 2, ly + m.w / 2, m.x0 == null ? 1.1 : m.x0, m.x1 == null ? -1.1 : m.x1, m.color);
						}
						break;
					case 'dash':
						var n = m.n;
						var x0 = m.x0 == null ? 0.6 : m.x0;
						var x1 = m.x1 == null ? -1 : m.x1;
						for (var d = 0; d < n; d++) {
							var da = x0 + (x1 - x0) * d / n;
							var db = x0 + (x1 - x0) * (d + 1) / n;
							contour(m.y - m.h / 2, m.y + m.h / 2, da, db, d % 2 ? m.color2 : m.color);
						}
						break;
					case 'dots':
						var r = seeded(m.seed || 7);
						var dx0 = m.x0 == null ? 0.95 : m.x0;
						var dx1 = m.x1 == null ? -0.95 : m.x1;
						ctx.fillStyle = m.color;
						for (var q = 0; q < m.n; q++) {
							var px = a * (dx0 + (dx1 - dx0) * r());
							var py = yAt(px, (r() * 2 - 1) * 0.85);
							ctx.beginPath();
							ctx.arc(px, py, Math.max(0.8, a * m.r * (0.7 + r() * 0.6)), 0, TAU);
							ctx.fill();
						}
						break;
					case 'vlines':
						ctx.fillStyle = m.color;
						m.xs.forEach(function (x) {
							var hh = half(x * a);
							ctx.fillRect(x * a - a * m.w / 2, -hh * 0.9, a * m.w, hh * 1.7);
						});
						break;
					case 'streak':
						ctx.strokeStyle = m.color;
						ctx.lineCap = 'round';
						ctx.lineWidth = Math.max(1, a * m.w);
						ctx.beginPath();
						ctx.moveTo(a * m.x0, yAt(a * m.x0, m.y0));
						ctx.lineTo(a * m.x1, yAt(a * m.x1, m.y1));
						ctx.stroke();
						break;
					case 'spot':
						var sx = a * m.x;
						var sy = yAt(sx, m.y);
						var sr = Math.max(1, a * m.r);
						if (m.ring) {
							ctx.fillStyle = m.ring;
							ctx.beginPath();
							ctx.arc(sx, sy, sr * 1.35, 0, TAU);
							ctx.fill();
						}
						ctx.fillStyle = m.color;
						ctx.beginPath();
						ctx.arc(sx, sy, sr, 0, TAU);
						ctx.fill();
						break;
					case 'scales':
						ctx.strokeStyle = m.color;
						ctx.lineWidth = Math.max(0.6, a * 0.018);
						var step = a * 0.16;
						for (var cx = a * 0.45; cx > tx; cx -= step) {
							for (var cy = -b; cy < b; cy += step * 0.8) {
								ctx.beginPath();
								ctx.arc(cx, cy + ((cx / step) % 2 ? step * 0.4 : 0), step * 0.5, -1.2, 1.2);
								ctx.stroke();
							}
						}
						break;
					case 'psy':
						for (var k = -3; k <= 3; k++) {
							ctx.beginPath();
							for (var wx = -a; wx <= a; wx += a / 10) {
								var wy = k * b * 0.3 + Math.sin(wx / a * 7 + k) * b * 0.12;
								if (wx === -a) ctx.moveTo(wx, wy);
								else ctx.lineTo(wx, wy);
							}
							if (m.edge) {
								ctx.strokeStyle = m.edge;
								ctx.lineWidth = Math.max(2, a * 0.13);
								ctx.stroke();
							}
							ctx.strokeStyle = m.color;
							ctx.lineWidth = Math.max(1.5, a * 0.08);
							ctx.stroke();
						}
						break;
				}
			});
		}

		function stripeFill(m) {
			if (!m.color2) return m.color;
			var x0 = a * (m.x0 == null ? 1.1 : m.x0);
			var x1 = a * (m.x1 == null ? -1.1 : m.x1);
			var g = ctx.createLinearGradient(x0, 0, x1, 0);
			var sp = m.split == null ? 0.5 : m.split;
			g.addColorStop(0, m.color);
			g.addColorStop(sp, m.color);
			g.addColorStop(Math.min(1, sp + 0.08), m.color2);
			g.addColorStop(1, m.color2);
			return g;
		}

		// A band between body-relative heights y0..y1 (numbers, or functions of
		// the normalised x) that follows the body outline.
		function contour(y0, y1, x0, x1, fill) {
			var N = 14;
			var at = function (y, nx) { return typeof y === 'function' ? y(nx) : y; };
			ctx.beginPath();
			for (var i = 0; i <= N; i++) {
				var nx = x0 + (x1 - x0) * i / N;
				var x = a * nx;
				if (i) ctx.lineTo(x, yAt(x, at(y0, nx)));
				else ctx.moveTo(x, yAt(x, at(y0, nx)));
			}
			for (var j = N; j >= 0; j--) {
				var nx2 = x0 + (x1 - x0) * j / N;
				ctx.lineTo(a * nx2, yAt(a * nx2, at(y1, nx2)));
			}
			ctx.closePath();
			ctx.fillStyle = fill;
			ctx.fill();
		}

		// A vertical band; bulge pushes its middle towards the head (clownfish).
		function band(x, w, color, edgeColor, bulge) {
			var bg = (bulge || 0) * a;
			var draw = function (pad, fill) {
				var l = x * a - (w * a) / 2 - pad;
				var r = x * a + (w * a) / 2 + pad;
				ctx.fillStyle = fill;
				ctx.beginPath();
				ctx.moveTo(l, -b * 1.2);
				ctx.quadraticCurveTo(l + bg, 0, l, b * 1.2);
				ctx.lineTo(r, b * 1.2);
				ctx.quadraticCurveTo(r + bg * 1.3, 0, r, -b * 1.2);
				ctx.closePath();
				ctx.fill();
			};
			if (edgeColor) draw(Math.max(1, a * 0.035), edgeColor);
			draw(0, color);
		}

		ctx.save();
		if (sick) ctx.filter = 'saturate(30%) brightness(1.08)';
		ctx.lineJoin = 'round';

		tailFin();
		fin(look.dorsalKind || P.dorsal, P.d0, P.d1, P.dh, -1, look.dorsalColor, look.dorsalSpot);
		fin(look.analKind || P.anal, P.a0, P.a1, P.ah, 1, look.analColor, null);

		if (look.filament) {
			// A long first dorsal ray (yasha goby, anthias).
			var fx = a * (P.d0 - 0.06);
			var fy = edge(fx, -1);
			ctx.strokeStyle = look.filament;
			ctx.lineCap = 'round';
			ctx.lineWidth = Math.max(1, a * 0.035);
			ctx.beginPath();
			ctx.moveTo(fx, fy);
			ctx.quadraticCurveTo(fx + a * 0.05, fy - a * 0.55, fx - a * 0.25 - wag * a * 0.2, fy - a * (P.shape === 'anthias' ? 0.45 : 0.8));
			ctx.stroke();
		}

		// Pelvic fin
		ctx.fillStyle = look.pelvic || look.analColor;
		ctx.strokeStyle = look.pelvic || look.analColor;
		var pvx = a * 0.28;
		var pvy = edge(pvx, 1) * 0.9;
		if (P.pelvic === 'long') {
			ctx.lineWidth = Math.max(1, a * 0.04);
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(pvx, pvy);
			ctx.quadraticCurveTo(pvx - a * 0.1, pvy + a * 0.2, pvx - a * 0.35 + wag * a * 0.1, pvy + a * 0.28);
			ctx.stroke();
		} else {
			ctx.beginPath();
			ctx.moveTo(pvx + a * 0.05, pvy);
			ctx.quadraticCurveTo(pvx - a * 0.05, pvy + a * 0.18, pvx - a * 0.18, pvy + a * 0.14);
			ctx.lineTo(pvx - a * 0.12, pvy - a * 0.02);
			ctx.closePath();
			ctx.fill();
		}

		// Body + marks
		bodyPath();
		ctx.fillStyle = look.body;
		ctx.fill();
		ctx.save();
		bodyPath();
		ctx.clip();
		marks();
		// Soft belly light and back shade for volume
		var g = ctx.createLinearGradient(0, -b, 0, b);
		g.addColorStop(0, 'rgba(0,0,0,0.14)');
		g.addColorStop(0.55, 'rgba(255,255,255,0)');
		g.addColorStop(1, 'rgba(255,255,255,0.22)');
		ctx.fillStyle = g;
		ctx.fillRect(-a, -b * 1.2, a * 2, b * 2.4);
		ctx.restore();

		// Pectoral fin
		ctx.save();
		ctx.translate(a * 0.3, edge(a * 0.3, 1) * 0.3);
		ctx.rotate(0.5 + wag);
		ctx.fillStyle = look.pectoral || look.fin;
		ctx.globalAlpha = look.pectoral ? 0.95 : 0.8;
		var pr = Math.max(b, a * 0.3) * P.pect;
		ctx.beginPath();
		ctx.ellipse(-pr * 0.3, 0, pr * 0.38, pr * 0.16, 0, 0, TAU);
		ctx.fill();
		ctx.restore();

		// Eye: optional coloured iris ring
		var er = Math.max(1.5, a * P.er);
		var ex = a * P.ex;
		var ey = -half(ex) * P.ey * 1.3;
		ctx.fillStyle = look.eye || '#fff';
		ctx.beginPath();
		ctx.arc(ex, ey, er, 0, TAU);
		ctx.fill();
		ctx.fillStyle = '#121a2e';
		ctx.beginPath();
		ctx.arc(ex + er * 0.15, ey, er * (look.eye ? 0.55 : 0.62), 0, TAU);
		ctx.fill();
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(ex + er * 0.35, ey - er * 0.3, er * 0.22, 0, TAU);
		ctx.fill();
		ctx.restore();

		if (sick) {
			// White spots, like marine ich
			ctx.fillStyle = 'rgba(255,255,255,0.9)';
			for (var i = 0; i < 6; i++) {
				var sx = (((i * 37) % 10) / 10 - 0.5) * a * 1.4;
				var sy = (((i * 53) % 10) / 10 - 0.5) * b * 1.2;
				ctx.beginPath();
				ctx.arc(sx, sy, Math.max(1, a * 0.04), 0, TAU);
				ctx.fill();
			}
		}
	}

	/* ---------- corals & inverts ---------- */

	function drawMushroom(ctx, look, size, t) {
		var r = size / 2;
		for (var i = 0; i < 3; i++) {
			var ox = (i - 1) * r * 0.75;
			var oy = (i === 1 ? -r * 0.15 : r * 0.05);
			var rr = r * (i === 1 ? 0.62 : 0.48) * (1 + Math.sin(t * 1.3 + i) * 0.03);
			ctx.fillStyle = look.fin;
			ctx.beginPath();
			ctx.ellipse(ox, oy + rr * 0.3, rr, rr * 0.45, 0, 0, TAU);
			ctx.fill();
			ctx.fillStyle = look.body;
			ctx.beginPath();
			ctx.ellipse(ox, oy, rr, rr * 0.5, 0, 0, TAU);
			ctx.fill();
			// Fine radial texture, then the mouth
			ctx.strokeStyle = look.accent;
			ctx.globalAlpha = 0.45;
			ctx.lineWidth = Math.max(0.7, rr * 0.03);
			for (var k = 0; k < 14; k++) {
				var ang = (k / 14) * TAU;
				ctx.beginPath();
				ctx.moveTo(ox + Math.cos(ang) * rr * 0.2, oy + Math.sin(ang) * rr * 0.1);
				ctx.lineTo(ox + Math.cos(ang) * rr * 0.9, oy + Math.sin(ang) * rr * 0.45);
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
			ctx.fillStyle = look.accent;
			ctx.beginPath();
			ctx.arc(ox, oy, Math.max(1.5, rr * 0.12), 0, TAU);
			ctx.fill();
		}
	}

	function drawHammer(ctx, look, size, t) {
		var h = size * 0.8;
		ctx.fillStyle = '#8a7f72';
		ctx.beginPath();
		ctx.ellipse(0, h * 0.05, size * 0.38, size * 0.1, 0, 0, TAU);
		ctx.fill();
		for (var i = 0; i < 7; i++) {
			var base = (i / 6 - 0.5) * size * 0.5;
			var sway = Math.sin(t * 1.6 + i) * size * 0.06;
			var tipX = base * 1.5 + sway;
			var tipY = -h * (0.55 + ((i * 3) % 4) * 0.1);
			ctx.strokeStyle = look.fin;
			ctx.lineWidth = Math.max(2, size * 0.08);
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(base, 0);
			ctx.quadraticCurveTo(base + sway * 0.5, tipY * 0.5, tipX, tipY);
			ctx.stroke();
			ctx.strokeStyle = look.body;
			ctx.lineWidth = Math.max(3, size * 0.12);
			ctx.beginPath();
			ctx.moveTo(tipX - size * 0.1, tipY - size * 0.02);
			ctx.quadraticCurveTo(tipX, tipY - size * 0.07, tipX + size * 0.1, tipY - size * 0.02);
			ctx.stroke();
			ctx.fillStyle = look.accent;
			ctx.beginPath();
			ctx.arc(tipX - size * 0.1, tipY - size * 0.02, Math.max(1.5, size * 0.045), 0, TAU);
			ctx.arc(tipX + size * 0.1, tipY - size * 0.02, Math.max(1.5, size * 0.045), 0, TAU);
			ctx.fill();
		}
	}

	function drawTree(ctx, look, size, t) {
		var h = size;
		var sway = Math.sin(t * 1.1) * 0.06;
		ctx.save();
		ctx.rotate(sway);
		ctx.strokeStyle = look.fin;
		ctx.lineCap = 'round';
		ctx.lineWidth = Math.max(3, size * 0.16);
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.quadraticCurveTo(size * 0.06, -h * 0.25, 0, -h * 0.45);
		ctx.stroke();
		var tips = [];
		ctx.lineWidth = Math.max(2, size * 0.08);
		[-0.75, -0.35, 0.15, 0.6].forEach(function (dir, i) {
			var x = dir * size * 0.45;
			var y = -h * (0.68 + (i % 2) * 0.15);
			ctx.beginPath();
			ctx.moveTo(0, -h * 0.35);
			ctx.quadraticCurveTo(x * 0.3, -h * 0.55, x, y);
			ctx.stroke();
			tips.push([x, y]);
		});
		tips.push([0, -h * 0.92]);
		tips.forEach(function (p, i) {
			// Each branch tip is a cluster of small polyps.
			for (var k = 0; k < 7; k++) {
				var ang = (k / 7) * TAU + i;
				var cx = p[0] + Math.cos(ang) * size * 0.1;
				var cy = p[1] + Math.sin(ang) * size * 0.09;
				ctx.fillStyle = look.body;
				ctx.beginPath();
				ctx.arc(cx, cy, size * 0.075, 0, TAU);
				ctx.fill();
				ctx.fillStyle = look.accent;
				ctx.beginPath();
				ctx.arc(cx + Math.cos(t * 0.8 + k) * size * 0.015, cy, Math.max(1, size * 0.03), 0, TAU);
				ctx.fill();
			}
		});
		ctx.restore();
	}

	/* A conical turban shell with mottled colour. */
	function drawSnail(ctx, look, size, t) {
		var r = size / 2;
		var glide = Math.sin(t * 1.5) * r * 0.02;
		ctx.fillStyle = look.fin;
		ctx.beginPath();
		ctx.ellipse(glide, r * 0.48, r * 0.92, r * 0.18, 0, 0, TAU);
		ctx.fill();
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(-r * 0.85, r * 0.42);
		ctx.quadraticCurveTo(-r * 0.55, -r * 0.2, -r * 0.05, -r * 0.95);
		ctx.quadraticCurveTo(r * 0.55, -r * 0.2, r * 0.85, r * 0.42);
		ctx.quadraticCurveTo(0, r * 0.62, -r * 0.85, r * 0.42);
		ctx.closePath();
		ctx.fillStyle = look.body;
		ctx.fill();
		ctx.clip();
		if (look.spots) {
			var rnd = seeded(31);
			ctx.fillStyle = look.spots;
			for (var i = 0; i < 34; i++) {
				ctx.globalAlpha = 0.45 + rnd() * 0.45;
				ctx.beginPath();
				ctx.ellipse((rnd() * 2 - 1) * r * 0.75, (rnd() * 1.4 - 0.9) * r, r * (0.06 + rnd() * 0.1), r * (0.04 + rnd() * 0.05), rnd(), 0, TAU);
				ctx.fill();
			}
			ctx.globalAlpha = 1;
		}
		ctx.strokeStyle = look.accent;
		ctx.lineWidth = Math.max(1.5, r * 0.08);
		for (var k = 0; k < 4; k++) {
			var y = r * (0.32 - k * 0.32);
			var w = r * (0.85 - k * 0.2);
			ctx.beginPath();
			ctx.moveTo(-w, y + r * 0.08);
			ctx.quadraticCurveTo(0, y - r * 0.12, w, y - r * 0.06);
			ctx.stroke();
		}
		ctx.restore();
	}

	/* A hermit crab: shell behind, banded legs and claws reaching out front. */
	function drawCrab(ctx, look, size, t) {
		var r = size / 2;
		var step = Math.sin(t * 6) * r * 0.06;
		var legW = Math.max(1.5, r * 0.12);
		// Shell
		ctx.save();
		ctx.translate(-r * 0.25, -r * 0.05);
		ctx.fillStyle = look.accent;
		ctx.beginPath();
		ctx.moveTo(-r * 0.7, r * 0.35);
		ctx.bezierCurveTo(-r * 0.85, -r * 0.45, -r * 0.2, -r * 0.8, r * 0.25, -r * 0.6);
		ctx.bezierCurveTo(r * 0.65, -r * 0.45, r * 0.6, r * 0.1, r * 0.45, r * 0.35);
		ctx.closePath();
		ctx.fill();
		ctx.clip();
		if (look.spots) {
			var rnd = seeded(11);
			ctx.fillStyle = look.spots;
			for (var s = 0; s < 12; s++) {
				ctx.globalAlpha = 0.35 + rnd() * 0.45;
				ctx.beginPath();
				ctx.arc((rnd() * 1.2 - 0.7) * r, (rnd() * 1.1 - 0.75) * r, r * (0.03 + rnd() * 0.06), 0, TAU);
				ctx.fill();
			}
			ctx.globalAlpha = 1;
		}
		ctx.strokeStyle = 'rgba(0,0,0,0.18)';
		ctx.lineWidth = Math.max(1, r * 0.05);
		ctx.beginPath();
		ctx.arc(-r * 0.05, -r * 0.1, r * 0.32, 0.3, 4.4);
		ctx.stroke();
		ctx.restore();
		// Shell opening
		ctx.fillStyle = 'rgba(40,20,20,0.55)';
		ctx.beginPath();
		ctx.ellipse(r * 0.18, r * 0.12, r * 0.14, r * 0.22, 0.2, 0, TAU);
		ctx.fill();

		var limb = function (pts, w) {
			ctx.lineWidth = w;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.strokeStyle = look.body;
			ctx.beginPath();
			ctx.moveTo(pts[0][0], pts[0][1]);
			for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
			ctx.stroke();
			if (look.band) {
				ctx.strokeStyle = look.band;
				ctx.lineCap = 'butt';
				ctx.lineWidth = w * 0.9;
				ctx.setLineDash([w * 0.55, w * 1.1]);
				ctx.stroke();
				ctx.setLineDash([]);
			}
		};
		// Walking legs: knee up, foot down on the sand
		for (var i = 0; i < 3; i++) {
			var k = i % 2 ? step : -step;
			limb([[r * 0.2, r * 0.1], [r * (0.5 + i * 0.14), -r * (0.2 - i * 0.06)], [r * (0.72 + i * 0.18) + k, r * 0.55]], legW);
		}
		// Claw
		limb([[r * 0.22, -r * 0.02], [r * 0.6, -r * 0.18]], legW * 1.3);
		ctx.fillStyle = look.body;
		ctx.beginPath();
		ctx.ellipse(r * 0.7, -r * 0.2, r * 0.15, r * 0.1, -0.2, 0, TAU);
		ctx.fill();
		// Eye stalks and antennae
		ctx.strokeStyle = look.body;
		ctx.lineWidth = Math.max(1, r * 0.05);
		ctx.beginPath();
		ctx.moveTo(r * 0.25, -r * 0.08);
		ctx.lineTo(r * 0.38, -r * 0.42);
		ctx.stroke();
		ctx.fillStyle = '#111';
		ctx.beginPath();
		ctx.arc(r * 0.39, -r * 0.45, Math.max(1, r * 0.06), 0, TAU);
		ctx.fill();
		if (look.antenna) {
			ctx.strokeStyle = look.antenna;
			ctx.lineWidth = Math.max(0.8, r * 0.03);
			[-1, 1].forEach(function (s) {
				ctx.beginPath();
				ctx.moveTo(r * 0.3, -r * 0.3);
				ctx.quadraticCurveTo(r * 0.7, -r * (0.75 + s * 0.08), r * 1.05, -r * (0.45 + s * 0.25) + Math.sin(t * 3 + s) * r * 0.05);
				ctx.stroke();
			});
		}
	}

	function draw(ctx, species, size, t, sick) {
		var look = lookFor(species);
		ctx.save();
		if (sick && species.cat !== 'fish') ctx.filter = 'saturate(25%) brightness(0.9)';
		switch (look.shape) {
			case 'mushroom': drawMushroom(ctx, look, size, t); break;
			case 'hammer': drawHammer(ctx, look, size, t); break;
			case 'tree': drawTree(ctx, look, size, t); break;
			case 'snail': drawSnail(ctx, look, size, t); break;
			case 'crab': drawCrab(ctx, look, size, t); break;
			default: drawFish(ctx, look.prof ? look : normalize({ shape: 'damsel', body: look.body || '#7ab', fin: look.fin }), size, t, sick);
		}
		ctx.restore();
	}

	/* A small static picture for shop and album cards. */
	function thumb(species, px, silhouette) {
		var dpr = Math.min(2, root.devicePixelRatio || 1);
		var c = document.createElement('canvas');
		c.width = px * dpr;
		c.height = px * dpr;
		c.style.width = px + 'px';
		c.style.height = px + 'px';
		var ctx = c.getContext('2d');
		ctx.scale(dpr, dpr);
		var fixed = FIXED[lookFor(species).shape];
		ctx.translate(px / 2, fixed ? px * 0.82 : px / 2);
		if (silhouette) ctx.filter = 'brightness(0) opacity(0.25)';
		draw(ctx, species, px * (fixed ? 0.62 : 0.66), 0.6, false);
		return c;
	}

	var api = { draw: draw, thumb: thumb, lookFor: lookFor, hash: hash, isFixed: function (sp) { return !!FIXED[lookFor(sp).shape]; } };
	if (typeof module === 'object' && module.exports) module.exports = api;
	else root.ReefSprites = api;
})(this);
