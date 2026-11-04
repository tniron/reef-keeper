/*
 * Reef Keeper — demo surprises. Purely cosmetic layer on top of the game:
 * it never touches the saved state, coins or rules (those stay in engine.js).
 *
 *  1. Rare visitors: a sea turtle, a manta ray or (very rarely) a golden fish
 *     drifts through the tank now and then. Tap it!
 *  2. Bioluminescent night: a hidden mode. Konami code on a keyboard, or tap
 *     the tank name 5 times quickly on a phone.
 *  3. Sound & sparkle: WebAudio blips and coin / confetti particles for care
 *     tasks, discoveries and tank upgrades (mute button in the tank corner).
 *  4. Badges: little achievements, kept in this browser only.
 */
(function (root) {
	'use strict';

	var TAU = Math.PI * 2;
	var BADGE_KEY = 'reef_keeper_badges_v1';
	var MUTE_KEY = 'reef_keeper_muted';

	var STR = {
		tr: {
			badges: 'Rozetler',
			badges_title: 'Rozet koleksiyonu',
			badges_sub: 'Tankında küçük sürprizler saklı. Hepsini bulabilecek misin?',
			badge_new: 'Yeni rozet!',
			locked: 'Kilitli',
			hidden: 'Gizli rozet',
			mute: 'Sesi kapat',
			unmute: 'Sesi aç',
			night_on: 'Biyolüminesans gecesi! Parmağını suda gezdir.',
			night_off: 'Sabah oldu, ışıklar yandı.',
			v_turtle: 'Bir deniz kaplumbağası selam verdi!',
			v_manta: 'Dev bir manta vatozu süzülüp geçti!',
			v_golden: 'Efsanevi Altın Balık! Bu çok nadir görülür.',
			b_feed: ['İlk Lokma', 'Balıklarını besle.'],
			b_glass: ['Kristal Cam', 'Camdaki yosunu sil.'],
			b_change: ['Taze Dalga', 'Su değişimi yap.'],
			b_test: ['Küçük Kimyager', 'Suyu test et.'],
			b_discover: ['Kaşif', 'Yeni bir tür keşfet.'],
			b_visitor: ['Nadir Ziyaretçi', 'Tanka uğrayan nadir bir canlıya dokun.'],
			b_golden: ['Altın Şans', 'Efsanevi Altın Balığı yakala.', 'İpucu: Çok nadir uğrar, gözünü dört aç.'],
			b_night: ['Gece Bekçisi', 'Gizli biyolüminesans gecesini aç.', 'İpucu: Eski bir oyun kodu… ya da tank adına ısrarla dokunmak.'],
			b_upgrade: ['Büyük Hayaller', 'Tankını büyüt.']
		},
		en: {
			badges: 'Badges',
			badges_title: 'Badge collection',
			badges_sub: 'Your tank hides a few surprises. Can you find them all?',
			badge_new: 'New badge!',
			locked: 'Locked',
			hidden: 'Hidden badge',
			mute: 'Mute',
			unmute: 'Unmute',
			night_on: 'Bioluminescent night! Drag your finger through the water.',
			night_off: 'Morning came, lights are back on.',
			v_turtle: 'A sea turtle says hello!',
			v_manta: 'A giant manta ray glided by!',
			v_golden: 'The legendary Golden Fish! Very few ever see it.',
			b_feed: ['First Bite', 'Feed your fish.'],
			b_glass: ['Crystal Glass', 'Wipe the algae off the glass.'],
			b_change: ['Fresh Wave', 'Do a water change.'],
			b_test: ['Little Chemist', 'Test the water.'],
			b_discover: ['Explorer', 'Discover a new species.'],
			b_visitor: ['Rare Visitor', 'Tap a rare creature passing through.'],
			b_golden: ['Golden Luck', 'Catch the legendary Golden Fish.', 'Hint: it rarely shows up, keep your eyes open.'],
			b_night: ['Night Watch', 'Unlock the secret bioluminescent night.', 'Hint: an old game code… or tapping the tank name a lot.'],
			b_upgrade: ['Big Dreams', 'Upgrade your tank.']
		}
	};

	var BADGES = [
		{ id: 'feed', icon: '#f59e0b' },
		{ id: 'glass', icon: '#38bdf8' },
		{ id: 'change', icon: '#0ea5e9' },
		{ id: 'test', icon: '#a78bfa' },
		{ id: 'discover', icon: '#22c55e' },
		{ id: 'upgrade', icon: '#f97316' },
		{ id: 'visitor', icon: '#14b8a6', secret: true },
		{ id: 'night', icon: '#6366f1', secret: true },
		{ id: 'golden', icon: '#eab308', secret: true }
	];

	var KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

	function get(key) {
		try { return root.localStorage.getItem(key); } catch (e) { return null; }
	}
	function set(key, value) {
		try { root.localStorage.setItem(key, value); } catch (e) {}
	}
	function el(tag, cls, html) {
		var n = document.createElement(tag);
		if (cls) n.className = cls;
		if (html != null) n.innerHTML = html;
		return n;
	}
	function esc(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}
	function rnd(a, b) { return a + Math.random() * (b - a); }

	var reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ---------- sound (WebAudio, no files) ---------- */

	var Sound = {
		ctx: null,
		muted: get(MUTE_KEY) === '1',
		unlock: function () {
			if (Sound.ctx || !(root.AudioContext || root.webkitAudioContext)) return;
			try {
				Sound.ctx = new (root.AudioContext || root.webkitAudioContext)();
				Sound.master = Sound.ctx.createGain();
				Sound.master.gain.value = 0.5;
				Sound.master.connect(Sound.ctx.destination);
			} catch (e) { Sound.ctx = null; }
		},
		ready: function () {
			if (Sound.muted || !Sound.ctx) return false;
			if (Sound.ctx.state === 'suspended') Sound.ctx.resume().catch(function () {});
			return true;
		},
		tone: function (f0, f1, dur, type, vol, delay) {
			if (!Sound.ready()) return;
			var c = Sound.ctx;
			var t = c.currentTime + (delay || 0);
			var o = c.createOscillator();
			var g = c.createGain();
			o.type = type || 'sine';
			o.frequency.setValueAtTime(f0, t);
			if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
			g.gain.setValueAtTime(0.0001, t);
			g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
			g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
			o.connect(g);
			g.connect(Sound.master);
			o.start(t);
			o.stop(t + dur + 0.05);
		},
		noise: function (dur, from, to, vol) {
			if (!Sound.ready()) return;
			var c = Sound.ctx;
			var t = c.currentTime;
			var len = Math.floor(c.sampleRate * dur);
			var buf = c.createBuffer(1, len, c.sampleRate);
			var d = buf.getChannelData(0);
			for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
			var src = c.createBufferSource();
			src.buffer = buf;
			var f = c.createBiquadFilter();
			f.type = 'bandpass';
			f.Q.value = 0.8;
			f.frequency.setValueAtTime(from, t);
			f.frequency.exponentialRampToValueAtTime(to, t + dur);
			var g = c.createGain();
			g.gain.setValueAtTime(0.0001, t);
			g.gain.exponentialRampToValueAtTime(vol || 0.3, t + dur * 0.3);
			g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
			src.connect(f);
			f.connect(g);
			g.connect(Sound.master);
			src.start(t);
		},
		bloop: function () {
			for (var i = 0; i < 3; i++) Sound.tone(rnd(500, 700), rnd(180, 240), 0.14, 'sine', 0.18, i * 0.09);
		},
		coin: function () {
			Sound.tone(988, null, 0.08, 'square', 0.06);
			Sound.tone(1319, null, 0.22, 'square', 0.06, 0.07);
		},
		arp: function (notes, step, type, vol) {
			notes.forEach(function (f, i) { Sound.tone(f, null, step * 2.2, type || 'triangle', vol || 0.14, i * step); });
		},
		sad: function () { Sound.tone(330, 180, 0.4, 'triangle', 0.15); },
		whoosh: function () { Sound.noise(1.1, 300, 2400, 0.35); },
		squeak: function () { Sound.tone(1800, 2600, 0.12, 'sine', 0.08); Sound.tone(2400, 1700, 0.12, 'sine', 0.08, 0.12); },
		shimmer: function () { Sound.arp([523, 659, 784, 1047, 1319, 1568], 0.07, 'sine', 0.12); },
		fanfare: function () { Sound.arp([523, 659, 784, 1047], 0.11, 'triangle', 0.16); Sound.tone(1047, null, 0.6, 'triangle', 0.12, 0.45); },
		badge: function () { Sound.arp([784, 988, 1175, 1568], 0.06, 'square', 0.05); }
	};

	/* ---------- the layer ---------- */

	function attach(g) {
		if (!g || g.__surprises) return;
		g.__surprises = true;
		var lang = (g.cfg && g.cfg.lang) === 'en' ? 'en' : 'tr';
		var T = STR[lang];
		var S = root.ReefSprites;

		var fx = { parts: [], plankton: [], night: 0, nightOn: false, visitor: null, nextVisit: performance.now() + rnd(30000, 55000) };
		var earned = {};
		try { earned = JSON.parse(get(BADGE_KEY) || '{}') || {}; } catch (e) { earned = {}; }

		/* --- audio unlock on first gesture --- */
		var unlock = function () { Sound.unlock(); };
		document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
		document.addEventListener('keydown', unlock, true);

		/* --- UI: badge button in the HUD, mute button on the stage --- */
		var stats = g.rootEl.querySelector('.rk-stats');
		var badgeBtn = el('button', 'rks-badge-btn');
		badgeBtn.type = 'button';
		badgeBtn.addEventListener('click', function () { badgeModal(); });
		if (stats) stats.appendChild(badgeBtn);

		var muteBtn = el('button', 'rks-mute');
		muteBtn.type = 'button';
		var paintMute = function () {
			muteBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>' +
				(Sound.muted ? '<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' :
					'<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>') + '</svg>';
			muteBtn.setAttribute('aria-label', Sound.muted ? T.unmute : T.mute);
			muteBtn.title = muteBtn.getAttribute('aria-label');
		};
		muteBtn.addEventListener('click', function () {
			Sound.muted = !Sound.muted;
			set(MUTE_KEY, Sound.muted ? '1' : '0');
			paintMute();
			if (!Sound.muted) { Sound.unlock(); Sound.coin(); }
		});
		paintMute();
		g.stage.appendChild(muteBtn);

		function countBadges() {
			return BADGES.filter(function (b) { return earned[b.id]; }).length;
		}
		function paintBadgeBtn() {
			badgeBtn.innerHTML = medal('#f4b81c', 18) + '<b>' + countBadges() + '</b>/' + BADGES.length;
			badgeBtn.setAttribute('aria-label', T.badges + ': ' + countBadges() + '/' + BADGES.length);
			badgeBtn.title = T.badges;
		}
		paintBadgeBtn();

		function medal(color, px) {
			return '<svg class="rks-medal" width="' + px + '" height="' + px + '" viewBox="0 0 24 24" aria-hidden="true">' +
				'<path d="M7 2h4l2 6H9zM13 2h4l-2 6h-4z" fill="#e5484d" opacity=".85"/>' +
				'<circle cx="12" cy="15" r="7" fill="' + color + '"/><circle cx="12" cy="15" r="5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>' +
				'<path d="M12 11.6l1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" fill="#fff"/></svg>';
		}

		function award(id) {
			if (earned[id]) return;
			var b = BADGES.filter(function (x) { return x.id === id; })[0];
			if (!b) return;
			earned[id] = Date.now();
			set(BADGE_KEY, JSON.stringify(earned));
			paintBadgeBtn();
			badgeBtn.classList.remove('rks-pop');
			void badgeBtn.offsetWidth;
			badgeBtn.classList.add('rks-pop');
			var info = T['b_' + id];
			var n = el('div', 'rk-toast rks-badge-toast', medal(b.icon, 30) + '<span><small>' + esc(T.badge_new) + '</small><b>' + esc(info[0]) + '</b></span>');
			g.toasts.appendChild(n);
			root.setTimeout(function () { n.classList.add('rk-toast-out'); }, 3200);
			root.setTimeout(function () { n.remove(); }, 3700);
			root.setTimeout(Sound.badge, 250);
			burst(g.W / 2, g.H * 0.35, 26, 'confetti');
		}

		function badgeModal() {
			var n = el('div', 'rks-badges');
			n.innerHTML = '<h3>' + esc(T.badges_title) + ' · ' + countBadges() + '/' + BADGES.length + '</h3><p class="rk-muted">' + esc(T.badges_sub) + '</p>';
			var grid = el('ul', 'rks-badge-grid');
			BADGES.forEach(function (b) {
				var info = T['b_' + b.id];
				var got = !!earned[b.id];
				var li = el('li', got ? 'rks-got' : 'rks-locked');
				var title = got || !b.secret ? info[0] : T.hidden;
				var desc = got ? info[1] : b.secret ? (info[2] || '???') : info[1];
				li.innerHTML = medal(got ? b.icon : '#c5d3de', 40) + '<b>' + esc(title) + '</b><span class="rk-muted">' + esc(desc) + '</span>';
				grid.appendChild(li);
			});
			n.appendChild(grid);
			g.openModal(n);
		}

		/* --- particles --- */

		var COLORS = ['#f4b81c', '#ff6b9a', '#4dd4ff', '#7cf29a', '#b892ff', '#ffffff'];
		function burst(x, y, n, kind) {
			if (reduced) n = Math.ceil(n / 3);
			for (var i = 0; i < n; i++) {
				var a = kind === 'coin' ? rnd(-Math.PI * 0.85, -Math.PI * 0.15) : rnd(0, TAU);
				var sp = kind === 'coin' ? rnd(120, 260) : rnd(60, 240);
				fx.parts.push({
					kind: kind, x: x, y: y,
					vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
					life: 1, decay: rnd(0.6, 1.1),
					r: kind === 'coin' ? rnd(4, 6.5) : kind === 'spark' ? rnd(1.5, 3.5) : rnd(3, 6),
					rot: rnd(0, TAU), vr: rnd(-8, 8),
					c: kind === 'spark' ? '#fff6c2' : COLORS[i % COLORS.length]
				});
			}
			if (fx.parts.length > 400) fx.parts.splice(0, fx.parts.length - 400);
		}

		/* --- rare visitors --- */

		var GOLD = { sid: 'rks-gold', name: 'Golden', cat: 'fish', look: { shape: 'tall', pattern: 'gradient', body: '#ffd23f', accent: '#fff3b0', fin: '#ffb300' } };

		function spawnVisitor(kind) {
			var W = g.W, H = g.H;
			if (!kind) {
				var r = Math.random();
				kind = r < 0.12 ? 'golden' : r < 0.55 ? 'manta' : 'turtle';
			}
			var dir = Math.random() < 0.5 ? 1 : -1;
			var size = W * (kind === 'manta' ? 0.2 : kind === 'turtle' ? 0.16 : 0.09);
			fx.visitor = {
				kind: kind, dir: dir, size: size,
				x: dir > 0 ? -size * 0.4 : W + size * 0.4,
				baseY: H * rnd(0.22, 0.55),
				y: 0,
				speed: W / (kind === 'golden' ? 7 : kind === 'manta' ? 11 : 15),
				phase: rnd(0, 10),
				tapped: false
			};
		}

		function drawTurtle(ctx, s, t) {
			var flap = Math.sin(t * 3) * 0.5;
			ctx.fillStyle = '#7fae5a';
			[[0.18, -0.28, -1], [0.18, 0.28, 1], [-0.28, -0.22, -1], [-0.28, 0.22, 1]].forEach(function (p, i) {
				ctx.save();
				ctx.translate(p[0] * s, p[1] * s * 0.6);
				ctx.rotate(p[2] * (0.6 + (i < 2 ? flap : -flap * 0.6)));
				ctx.beginPath();
				ctx.ellipse(0, p[2] * s * 0.14, s * (i < 2 ? 0.08 : 0.05), s * (i < 2 ? 0.2 : 0.11), 0, 0, TAU);
				ctx.fill();
				ctx.restore();
			});
			ctx.beginPath();
			ctx.ellipse(s * 0.42, 0, s * 0.11, s * 0.085, 0, 0, TAU);
			ctx.fill();
			ctx.fillStyle = '#1d2a1a';
			ctx.beginPath();
			ctx.arc(s * 0.47, -s * 0.03, s * 0.016, 0, TAU);
			ctx.fill();
			var sh = ctx.createRadialGradient(-s * 0.05, -s * 0.1, s * 0.05, 0, 0, s * 0.36);
			sh.addColorStop(0, '#b38b4a');
			sh.addColorStop(1, '#6b4c24');
			ctx.fillStyle = sh;
			ctx.beginPath();
			ctx.ellipse(0, 0, s * 0.34, s * 0.24, 0, 0, TAU);
			ctx.fill();
			ctx.strokeStyle = 'rgba(255,230,170,.45)';
			ctx.lineWidth = Math.max(1, s * 0.012);
			for (var i = -1; i <= 1; i++) {
				ctx.beginPath();
				ctx.ellipse(i * s * 0.16, 0, s * 0.08, s * 0.07, 0, 0, TAU);
				ctx.stroke();
			}
		}

		function drawManta(ctx, s, t) {
			var flap = Math.sin(t * 2.4);
			ctx.save();
			ctx.scale(1, 0.55 + flap * 0.25);
			var body = ctx.createLinearGradient(0, -s * 0.5, 0, s * 0.5);
			body.addColorStop(0, '#2b3f5c');
			body.addColorStop(1, '#14223a');
			ctx.fillStyle = body;
			ctx.beginPath();
			ctx.moveTo(s * 0.32, 0);
			ctx.quadraticCurveTo(s * 0.1, -s * 0.12, -s * 0.05, -s * 0.5);
			ctx.quadraticCurveTo(-s * 0.12, -s * 0.12, -s * 0.28, 0);
			ctx.quadraticCurveTo(-s * 0.12, s * 0.12, -s * 0.05, s * 0.5);
			ctx.quadraticCurveTo(s * 0.1, s * 0.12, s * 0.32, 0);
			ctx.fill();
			ctx.fillStyle = 'rgba(255,255,255,.18)';
			ctx.beginPath();
			ctx.ellipse(s * 0.04, 0, s * 0.12, s * 0.1, 0, 0, TAU);
			ctx.fill();
			ctx.restore();
			ctx.strokeStyle = '#14223a';
			ctx.lineWidth = Math.max(1, s * 0.015);
			ctx.beginPath();
			ctx.moveTo(-s * 0.26, 0);
			ctx.quadraticCurveTo(-s * 0.45, Math.sin(t * 3) * s * 0.06, -s * 0.62, 0);
			ctx.stroke();
			ctx.fillStyle = '#14223a';
			[-1, 1].forEach(function (k) {
				ctx.beginPath();
				ctx.ellipse(s * 0.34, k * s * 0.05, s * 0.05, s * 0.018, k * 0.4, 0, TAU);
				ctx.fill();
			});
		}

		function updateVisitor(dt, time) {
			var v = fx.visitor;
			var now = performance.now();
			if (!v) {
				if (now > fx.nextVisit && document.visibilityState === 'visible' && !g.mode) spawnVisitor();
				return;
			}
			v.x += v.dir * v.speed * (v.tapped ? 3 : 1) * dt;
			v.y = v.baseY + Math.sin(time * 0.9 + v.phase) * g.H * 0.04 - (v.tapped ? (now - v.tapped) * 0.05 : 0);
			if (v.kind === 'golden' && Math.random() < dt * 14) {
				fx.parts.push({ kind: 'spark', x: v.x - v.dir * v.size * 0.4, y: v.y + rnd(-6, 6), vx: -v.dir * 20, vy: rnd(-15, 15), life: 1, decay: 1.4, r: rnd(1.5, 3), rot: 0, vr: 0, c: '#fff3b0' });
			}
			if (v.x < -v.size * 1.5 || v.x > g.W + v.size * 1.5) {
				fx.visitor = null;
				fx.nextVisit = now + rnd(70000, 150000);
			}
		}

		function drawVisitor(ctx, time) {
			var v = fx.visitor;
			if (!v) return;
			ctx.save();
			ctx.translate(v.x, v.y);
			ctx.scale(v.dir, 1);
			if (fx.night > 0.05 || v.kind === 'golden') {
				ctx.shadowColor = v.kind === 'golden' ? 'rgba(255,215,80,.9)' : 'rgba(120,220,255,.8)';
				ctx.shadowBlur = v.size * 0.3;
			}
			if (v.kind === 'turtle') drawTurtle(ctx, v.size, time + v.phase);
			else if (v.kind === 'manta') drawManta(ctx, v.size, time + v.phase);
			else S.draw(ctx, GOLD, v.size, time * 1.5, false);
			ctx.restore();
			// A soft twinkle hints that it can be tapped.
			if (!v.tapped) {
				var k = (Math.sin(time * 4) + 1) / 2;
				ctx.save();
				ctx.globalCompositeOperation = 'lighter';
				ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + k * 0.5) + ')';
				star(ctx, v.x + v.dir * v.size * 0.25, v.y - v.size * 0.3, 3 + k * 4);
				ctx.restore();
			}
		}

		function star(ctx, x, y, r) {
			ctx.beginPath();
			ctx.moveTo(x, y - r);
			ctx.quadraticCurveTo(x, y, x + r, y);
			ctx.quadraticCurveTo(x, y, x, y + r);
			ctx.quadraticCurveTo(x, y, x - r, y);
			ctx.quadraticCurveTo(x, y, x, y - r);
			ctx.fill();
		}

		function tapVisitor(p) {
			var v = fx.visitor;
			if (!v || v.tapped) return false;
			if (Math.hypot(p.x - v.x, p.y - v.y) > Math.max(34, v.size * 0.55)) return false;
			v.tapped = performance.now();
			burst(v.x, v.y, v.kind === 'golden' ? 60 : 30, v.kind === 'golden' ? 'coin' : 'confetti');
			burst(v.x, v.y, 20, 'spark');
			Sound.shimmer();
			g.toast(T['v_' + v.kind], 'good');
			award('visitor');
			if (v.kind === 'golden') award('golden');
			return true;
		}

		/* --- bioluminescent night --- */

		function toggleNight() {
			fx.nightOn = !fx.nightOn;
			if (fx.nightOn) {
				Sound.shimmer();
				g.toast(T.night_on, 'good');
				award('night');
				if (!fx.plankton.length) {
					for (var i = 0; i < 70; i++) {
						fx.plankton.push({ x: Math.random(), y: Math.random(), r: rnd(0.8, 2.2), ph: rnd(0, TAU), sp: rnd(0.005, 0.02) });
					}
				}
			} else {
				Sound.tone(880, 440, 0.4, 'sine', 0.12);
				g.toast(T.night_off);
			}
		}

		var keys = [];
		document.addEventListener('keydown', function (e) {
			keys.push(String(e.key || '').toLowerCase());
			if (keys.length > KONAMI.length) keys.shift();
			if (keys.join(',') === KONAMI.join(',')) {
				keys = [];
				toggleNight();
			}
		});
		var taps = [];
		g.tankName.addEventListener('click', function () {
			var now = performance.now();
			taps = taps.filter(function (t) { return now - t < 2500; });
			taps.push(now);
			if (taps.length >= 5) {
				taps = [];
				toggleNight();
			}
		});

		function drawNight(ctx, time) {
			var k = fx.night;
			if (k <= 0.01) return;
			var W = g.W, H = g.H;
			ctx.save();
			ctx.fillStyle = 'rgba(3,8,32,' + (0.78 * k) + ')';
			ctx.fillRect(0, 0, W, H);
			// Moonlight from above.
			var moon = ctx.createRadialGradient(W * 0.7, -H * 0.2, 10, W * 0.7, -H * 0.2, H * 1.1);
			moon.addColorStop(0, 'rgba(160,200,255,' + 0.25 * k + ')');
			moon.addColorStop(1, 'rgba(160,200,255,0)');
			ctx.fillStyle = moon;
			ctx.fillRect(0, 0, W, H);
			ctx.restore();

			// The residents glow in their own colours.
			ctx.save();
			ctx.globalAlpha = k;
			Object.keys(g.entities).forEach(function (uid) {
				var e = g.entities[uid];
				if (e.x == null) return;
				var look = S.lookFor(e.sp);
				ctx.save();
				ctx.shadowColor = look.accent || look.body;
				ctx.shadowBlur = Math.max(10, e.size * 0.35);
				if (e.sp.cat === 'fish') {
					ctx.translate(e.x, e.y + Math.sin(time * 2 + e.phase) * 2);
					ctx.scale(e.dir || 1, 1);
					if (e.health < 30) ctx.rotate(0.35);
				} else if (e.sp.cat === 'invert') {
					ctx.translate(e.x, e.y - e.size * 0.3);
					ctx.scale(e.dir || 1, 1);
				} else {
					ctx.translate(e.x, e.y);
				}
				S.draw(ctx, e.sp, e.size, time + e.phase, e.health < 75);
				ctx.restore();
			});
			ctx.restore();

			// Plankton sparkles.
			ctx.save();
			ctx.globalCompositeOperation = 'lighter';
			fx.plankton.forEach(function (p) {
				p.y -= p.sp * 0.016;
				if (p.y < -0.02) p.y = 1.02;
				var a = (0.35 + 0.65 * (Math.sin(time * 2 + p.ph) + 1) / 2) * k;
				ctx.fillStyle = 'rgba(110,240,255,' + a * 0.8 + ')';
				ctx.beginPath();
				ctx.arc(p.x * W + Math.sin(time + p.ph) * 6, p.y * H, p.r, 0, TAU);
				ctx.fill();
			});
			ctx.restore();
		}

		/* --- canvas input: tap visitors, glow trail at night --- */

		var pos = function (e) {
			var r = g.canvas.getBoundingClientRect();
			return { x: e.clientX - r.left, y: e.clientY - r.top };
		};
		g.canvas.addEventListener('pointerdown', function (e) {
			if (g.mode) return;
			var p = pos(e);
			if (!tapVisitor(p) && fx.nightOn) burst(p.x, p.y, 14, 'glow');
		});
		g.canvas.addEventListener('pointermove', function (e) {
			if (!fx.nightOn || g.mode || Math.random() > 0.5) return;
			var p = pos(e);
			fx.parts.push({ kind: 'glow', x: p.x, y: p.y, vx: rnd(-20, 20), vy: rnd(-30, 5), life: 1, decay: 1.2, r: rnd(2, 4), rot: 0, vr: 0, c: '#6ef0ff' });
		});

		/* --- hook into the game loop --- */

		var origDraw = g.draw;
		g.draw = function (time) {
			origDraw.call(g, time);
			var dt = Math.min(0.05, (time - (fx.lastT || time)));
			fx.lastT = time;
			fx.night += ((fx.nightOn ? 1 : 0) - fx.night) * Math.min(1, dt * 2.5);
			updateVisitor(dt, time);
			var ctx = g.ctx;
			ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
			drawNight(ctx, time);
			drawVisitor(ctx, time);
			drawParticles(ctx, dt);
		};

		function drawParticles(ctx, dt) {
			if (!fx.parts.length) return;
			fx.parts.forEach(function (p) {
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				p.rot += p.vr * dt;
				if (p.kind === 'coin' || p.kind === 'confetti') p.vy += 260 * dt;
				else { p.vx *= 0.96; p.vy *= 0.96; }
				p.life -= p.decay * dt;
			});
			fx.parts = fx.parts.filter(function (p) { return p.life > 0; });
			fx.parts.forEach(function (p) {
				ctx.save();
				ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
				ctx.translate(p.x, p.y);
				if (p.kind === 'coin') {
					ctx.scale(Math.abs(Math.cos(p.rot)) * 0.8 + 0.2, 1);
					ctx.fillStyle = '#f4b81c';
					ctx.beginPath();
					ctx.arc(0, 0, p.r, 0, TAU);
					ctx.fill();
					ctx.fillStyle = '#ffe99a';
					ctx.beginPath();
					ctx.arc(-p.r * 0.25, -p.r * 0.25, p.r * 0.45, 0, TAU);
					ctx.fill();
				} else if (p.kind === 'confetti') {
					ctx.rotate(p.rot);
					ctx.fillStyle = p.c;
					ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
				} else {
					ctx.globalCompositeOperation = 'lighter';
					ctx.fillStyle = p.c;
					star(ctx, 0, 0, p.r * 1.6);
				}
				ctx.restore();
			});
		}

		/* --- react to game events --- */

		var origAfter = g.afterAct;
		g.afterAct = function (task, res) {
			origAfter.call(g, task, res);
			var W = g.W, H = g.H;
			if (res.note === 'overfed') { Sound.sad(); return; }
			if (task === 'feed') { Sound.bloop(); root.setTimeout(Sound.coin, 300); burst(W / 2, H * 0.3, 14, 'coin'); award('feed'); }
			else if (task === 'glass') { Sound.squeak(); burst(W / 2, H / 2, 24, 'spark'); root.setTimeout(Sound.coin, 250); award('glass'); }
			else if (task === 'change') { Sound.whoosh(); root.setTimeout(Sound.coin, 600); burst(W / 2, H * 0.9, 16, 'coin'); award('change'); }
			else if (task === 'test') { Sound.arp([660, 880], 0.08, 'sine', 0.1); award('test'); }
			else if (task === 'collect') { Sound.arp([988, 1175, 1319, 1568], 0.05, 'square', 0.05); burst(W - 70, 26, 10 + Math.min(30, res.coins || 0), 'coin'); }
			else if (task === 'restart') { Sound.fanfare(); }
		};

		var origRun = g.run;
		g.run = function (kind, arg) {
			return origRun.call(g, kind, arg).then(function (res) {
				if (!res || !res.ok) return res;
				if (kind === 'buy') {
					Sound.coin();
					if (res.discovered) {
						root.setTimeout(Sound.fanfare, 150);
						burst(g.W / 2, g.H * 0.4, 50, 'confetti');
						award('discover');
					}
				} else if (kind === 'upgrade') {
					Sound.fanfare();
					root.setTimeout(Sound.shimmer, 600);
					burst(g.W * 0.25, g.H * 0.5, 50, 'confetti');
					burst(g.W * 0.75, g.H * 0.5, 50, 'confetti');
					award('upgrade');
				}
				return res;
			});
		};

		// Small hook for the demo test panel.
		root.ReefSurprises.visit = function (kind) { spawnVisitor(kind); };
		root.ReefSurprises.night = toggleNight;
		root.ReefSurprises.fx = fx;
	}

	root.ReefSurprises = { attach: attach };
	if (root.rkGame) attach(root.rkGame);
})(this);
