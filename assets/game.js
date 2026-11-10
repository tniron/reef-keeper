/*
 * Reef Keeper — the game UI. Mount with:
 *   ReefKeeper.mount(element, { store, species, lang, urls, member, linkFor })
 */
(function (root) {
	'use strict';

	var E = root.ReefEngine;
	var S = root.ReefSprites;
	var TAU = Math.PI * 2;
	var FISH_SCALE = [0.13, 0.11, 0.09, 0.08, 0.07];

	var ICONS = {
		feed: '<svg viewBox="0 0 24 24"><path d="M4 9c3-4 13-4 16 0l-2 9H6z" fill="currentColor" opacity=".25"/><path d="M4 9c3-4 13-4 16 0M6 18h12M8 13h1M12 12h1M15 14h1" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
		test: '<svg viewBox="0 0 24 24"><path d="M9 3v13a3 3 0 0 0 6 0V3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 11h6v5a3 3 0 0 1-6 0z" fill="currentColor" opacity=".35"/><path d="M7 3h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
		glass: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 15l7-7M11 17l6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
		change: '<svg viewBox="0 0 24 24"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2"/><path d="M9 14a3 3 0 0 0 3 3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
	};

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

	function clamp(v, a, b) {
		return Math.max(a, Math.min(b, v));
	}

	function mix(c1, c2, k) {
		return c1.map(function (v, i) { return Math.round(v + (c2[i] - v) * k); });
	}

	function rgb(c, a) {
		return a == null ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + a + ')';
	}

	function rand(seed) {
		var x = Math.sin(seed * 9301 + 49297) * 233280;
		return x - Math.floor(x);
	}

	function Game(mountEl, cfg) {
		this.cfg = cfg;
		this.store = cfg.store;
		this.t = root.ReefI18n.make(cfg.lang || 'en');
		this.species = cfg.species;
		this.catalog = {};
		var self = this;
		cfg.species.forEach(function (s) { self.catalog[s.sid] = s; });
		this.view = null;
		this.skew = 0;
		this.busy = false;
		this.tab = 'residents';
		this.shopFilter = 'all';
		this.mode = null;
		this.entities = {};
		this.pellets = [];
		this.bubbles = [];
		this.disp = { quality: 100, algae: 0 };
		this.seenKey = 'reef_keeper_seen_' + (cfg.member ? 'm' : 'g');
		this.build(mountEl);
		this.store.load().then(function (r) { self.apply(r.view, true); }, function () { self.toast(self.t('err_network'), 'bad'); });
		this.loop = this.loop.bind(this);
		root.requestAnimationFrame(this.loop);
		root.setInterval(function () { self.refresh(); }, 30000);
		root.setInterval(function () { self.reload(); }, 5 * 60000);
		document.addEventListener('visibilitychange', function () {
			if (document.visibilityState === 'visible') self.reload();
		});
	}

	Game.prototype.now = function () {
		return Date.now() + this.skew;
	};

	Game.prototype.reload = function () {
		var self = this;
		if (this.busy || this.mode) return;
		this.store.load().then(function (r) { self.apply(r.view, false); }, function () {});
	};

	/* ---------- DOM ---------- */

	Game.prototype.build = function (mount) {
		var t = this.t;
		var self = this;
		mount.innerHTML = '';
		var rootEl = el('div', 'rk');
		this.rootEl = rootEl;

		var hud = el('header', 'rk-hud');
		this.tankName = el('div', 'rk-tank-name');
		var stats = el('div', 'rk-stats');
		this.coinsEl = el('span', 'rk-coins');
		this.xpEl = el('span', 'rk-xp');
		stats.appendChild(this.coinsEl);
		stats.appendChild(this.xpEl);
		hud.appendChild(this.tankName);
		hud.appendChild(stats);
		rootEl.appendChild(hud);

		this.banner = el('div', 'rk-banner');
		this.banner.hidden = true;
		rootEl.appendChild(this.banner);

		var stage = el('div', 'rk-stage');
		this.stage = stage;
		this.canvas = el('canvas', 'rk-canvas');
		this.canvas.setAttribute('aria-label', t('title'));
		stage.appendChild(this.canvas);
		this.hint = el('div', 'rk-hint');
		this.hint.hidden = true;
		stage.appendChild(this.hint);
		this.collectBtn = el('button', 'rk-collect');
		this.collectBtn.type = 'button';
		this.collectBtn.hidden = true;
		this.collectBtn.addEventListener('click', function () { self.run('act', 'collect'); });
		stage.appendChild(this.collectBtn);
		this.toasts = el('div', 'rk-toasts');
		this.toasts.setAttribute('aria-live', 'polite');
		stage.appendChild(this.toasts);
		rootEl.appendChild(stage);

		var bars = el('div', 'rk-bars');
		this.bars = {};
		['food', 'water', 'glass'].forEach(function (k) {
			var b = el('div', 'rk-bar rk-bar-' + k, '<span class="rk-bar-label">' + t('bar_' + k) + '</span><span class="rk-bar-track"><span class="rk-bar-fill"></span></span>');
			self.bars[k] = b.querySelector('.rk-bar-fill');
			bars.appendChild(b);
		});
		rootEl.appendChild(bars);

		var actions = el('div', 'rk-actions');
		this.actionBtns = {};
		['feed', 'test', 'glass', 'change'].forEach(function (task) {
			var b = el('button', 'rk-action', ICONS[task] + '<span class="rk-action-name">' + t('task_' + task) + '</span><span class="rk-action-sub"></span>');
			b.type = 'button';
			b.dataset.task = task;
			self.actionBtns[task] = b;
			actions.appendChild(b);
		});
		this.bindActions();
		rootEl.appendChild(actions);

		var tabs = el('nav', 'rk-tabs');
		tabs.setAttribute('role', 'tablist');
		this.tabBtns = {};
		['residents', 'shop', 'album', 'tank'].forEach(function (k) {
			var b = el('button', 'rk-tab', esc(t('tab_' + k)));
			b.type = 'button';
			b.setAttribute('role', 'tab');
			b.addEventListener('click', function () {
				self.tab = k;
				self.renderPanel();
			});
			self.tabBtns[k] = b;
			tabs.appendChild(b);
		});
		rootEl.appendChild(tabs);
		this.panel = el('section', 'rk-panel');
		rootEl.appendChild(this.panel);

		this.modal = el('div', 'rk-modal');
		this.modal.hidden = true;
		this.modal.addEventListener('click', function (e) {
			if (e.target === self.modal) self.closeModal();
		});
		rootEl.appendChild(this.modal);

		mount.appendChild(rootEl);

		this.ctx = this.canvas.getContext('2d');
		this.algaeCanvas = document.createElement('canvas');
		this.resize();
		if (root.ResizeObserver) new root.ResizeObserver(function () { self.resize(); }).observe(stage);
		else root.addEventListener('resize', function () { self.resize(); });
		this.bindCanvas();
	};

	Game.prototype.resize = function () {
		var w = this.stage.clientWidth || 600;
		var h = Math.round(clamp(w * 0.6, 240, 520));
		var dpr = Math.min(2, root.devicePixelRatio || 1);
		if (this.W === w && this.H === h) return;
		this.W = w;
		this.H = h;
		this.dpr = dpr;
		this.canvas.width = w * dpr;
		this.canvas.height = h * dpr;
		this.canvas.style.height = h + 'px';
		this.algaeCanvas.width = w * dpr;
		this.algaeCanvas.height = h * dpr;
		this.sandTop = h * 0.84;
		this.paintAlgae();
		var self = this;
		Object.keys(this.entities).forEach(function (uid) { self.placeEntity(self.entities[uid]); });
	};

	Game.prototype.bindActions = function () {
		var self = this;
		var b = this.actionBtns;
		b.feed.addEventListener('click', function () {
			if (self.blocked('feed')) return;
			self.setMode('feed');
		});
		b.test.addEventListener('click', function () {
			if (self.blocked('test')) return;
			self.run('act', 'test');
		});
		b.glass.addEventListener('click', function () {
			if (self.blocked('glass')) return;
			self.setMode('wipe');
		});
		var hold = null;
		var start = function (e) {
			e.preventDefault();
			if (self.blocked('change') || hold) return;
			var t0 = performance.now();
			b.change.classList.add('rk-holding');
			self.showHint(self.t('hint_hold'));
			hold = root.setInterval(function () {
				var k = (performance.now() - t0) / 1200;
				b.change.style.setProperty('--rk-hold', Math.min(1, k));
				if (k >= 1) {
					stop();
					self.waterRush = 1;
					self.run('act', 'change');
				}
			}, 30);
		};
		var stop = function () {
			if (!hold) return;
			root.clearInterval(hold);
			hold = null;
			b.change.classList.remove('rk-holding');
			b.change.style.setProperty('--rk-hold', 0);
			self.showHint(null);
		};
		b.change.addEventListener('pointerdown', start);
		b.change.addEventListener('pointerup', stop);
		b.change.addEventListener('pointerleave', stop);
		b.change.addEventListener('pointercancel', stop);
		b.change.addEventListener('keydown', function (e) {
			if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) start(e);
		});
		b.change.addEventListener('keyup', stop);
	};

	/* Returns true (and explains why) when a task can't run right now. */
	Game.prototype.blocked = function (task) {
		if (!this.view || this.busy) return true;
		var s = this.view.state;
		if (!s.fish.length) return true;
		var left = E.cooldownLeft(s, task, this.now());
		if (left > 0) {
			this.toast(this.t('err_cooldown', { t: this.t('in_time', { t: this.dur(left) }) }));
			return true;
		}
		if (task === 'glass' && s.algae < 15) {
			this.toast(this.t('err_clean'));
			return true;
		}
		return false;
	};

	Game.prototype.setMode = function (mode) {
		this.mode = mode;
		this.stage.classList.toggle('rk-mode-feed', mode === 'feed');
		this.stage.classList.toggle('rk-mode-wipe', mode === 'wipe');
		this.showHint(mode === 'feed' ? this.t('hint_feed') : mode === 'wipe' ? this.t('hint_wipe') : null);
		if (mode === 'wipe') this.wipeStats = null;
	};

	Game.prototype.showHint = function (text) {
		this.hint.hidden = !text;
		this.hint.textContent = text || '';
	};

	Game.prototype.bindCanvas = function () {
		var self = this;
		var down = false;
		var pos = function (e) {
			var r = self.canvas.getBoundingClientRect();
			return { x: e.clientX - r.left, y: e.clientY - r.top };
		};
		this.canvas.addEventListener('pointerdown', function (e) {
			var p = pos(e);
			if (self.mode === 'feed') {
				for (var i = 0; i < 6; i++) {
					self.pellets.push({ x: p.x + (Math.random() - 0.5) * 40, y: Math.min(p.y, 20) + Math.random() * 10, vy: 18 + Math.random() * 12 });
				}
				self.setMode(null);
				self.run('act', 'feed');
			} else if (self.mode === 'wipe') {
				down = true;
				try { self.canvas.setPointerCapture(e.pointerId); } catch (err) {}
				self.wipe(p);
			}
		});
		this.canvas.addEventListener('pointermove', function (e) {
			if (down && self.mode === 'wipe') self.wipe(pos(e));
		});
		var up = function () {
			if (!down) return;
			down = false;
			if (self.mode === 'wipe' && self.wipedEnough()) {
				self.setMode(null);
				self.run('act', 'glass');
			}
		};
		this.canvas.addEventListener('pointerup', up);
		this.canvas.addEventListener('pointercancel', up);
	};

	/* ---------- algae on the glass ---------- */

	Game.prototype.paintAlgae = function () {
		var c = this.algaeCanvas.getContext('2d');
		var W = this.W;
		var H = this.H;
		c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
		c.clearRect(0, 0, W, H);
		var level = this.view ? this.view.state.algae : 0;
		var n = Math.round(level * 0.7);
		for (var i = 0; i < n; i++) {
			var x = rand(i + 1) * W;
			var y = (0.15 + rand(i + 101) * 0.85) * H;
			var r = (18 + rand(i + 201) * 46) * (0.5 + level / 140);
			var g = c.createRadialGradient(x, y, 0, x, y, r);
			var a = 0.35 + rand(i + 301) * 0.35;
			g.addColorStop(0, 'rgba(78,128,40,' + a + ')');
			g.addColorStop(0.7, 'rgba(98,150,52,' + a * 0.55 + ')');
			g.addColorStop(1, 'rgba(98,150,52,0)');
			c.fillStyle = g;
			c.beginPath();
			c.arc(x, y, r, 0, TAU);
			c.fill();
		}
		this.algaeTotal = null;
	};

	Game.prototype.wipe = function (p) {
		var c = this.algaeCanvas.getContext('2d');
		c.save();
		c.globalCompositeOperation = 'destination-out';
		c.fillStyle = '#000';
		c.beginPath();
		c.arc(p.x, p.y, Math.max(26, this.W * 0.05), 0, TAU);
		c.fill();
		c.restore();
		for (var i = 0; i < 2; i++) {
			this.bubbles.push({ x: p.x, y: p.y, r: 2 + Math.random() * 3, vy: 20 + Math.random() * 20, life: 1 });
		}
	};

	Game.prototype.algaeCoverage = function () {
		var c = this.algaeCanvas;
		var data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
		var sum = 0;
		for (var i = 3; i < data.length; i += 64) sum += data[i];
		return sum;
	};

	Game.prototype.wipedEnough = function () {
		if (this.algaeTotal == null) return true;
		return this.algaeCoverage() < this.algaeTotal * 0.3;
	};

	/* ---------- state ---------- */

	Game.prototype.apply = function (view, first) {
		var prev = this.view;
		this.view = view;
		this.skew = view.now - Date.now();
		var s = view.state;
		if (first) {
			this.disp.quality = s.quality;
			this.disp.algae = s.algae;
		}
		this.syncEntities();
		if (!prev || prev.state.algae !== s.algae || this.mode !== 'wipe') {
			this.paintAlgae();
			this.algaeTotal = s.algae >= 15 ? this.algaeCoverage() : null;
		}
		this.render();
		if (first) this.showAway();
	};

	Game.prototype.syncEntities = function () {
		var self = this;
		var seen = {};
		var coralIndex = 0;
		this.view.state.fish.forEach(function (f) {
			seen[f.uid] = true;
			var sp = self.catalog[f.sid] || { sid: f.sid, name: '?', cat: 'fish' };
			var ent = self.entities[f.uid];
			if (!ent) {
				ent = self.entities[f.uid] = { uid: f.uid, sp: sp, phase: rand(f.uid) * 10, born: performance.now() };
				ent.fresh = true;
			}
			ent.health = f.health;
			if (sp.cat === 'coral') ent.slot = coralIndex++;
			self.placeEntity(ent);
		});
		Object.keys(this.entities).forEach(function (uid) {
			if (!seen[uid]) delete self.entities[uid];
		});
	};

	Game.prototype.placeEntity = function (ent) {
		var W = this.W;
		var H = this.H;
		var tier = this.view ? this.view.state.tank : 0;
		var cat = ent.sp.cat;
		var look = S.lookFor(ent.sp);
		ent.size = W * FISH_SCALE[tier] * (look.shape === 'long' ? 0.85 : look.shape === 'tall' ? 0.95 : 1);
		if (cat === 'coral') {
			ent.size = W * FISH_SCALE[tier] * 1.05;
			var slots = [0.18, 0.82, 0.38, 0.62, 0.08, 0.92, 0.28, 0.72, 0.5];
			ent.x = W * slots[ent.slot % slots.length];
			ent.y = this.sandTop + H * 0.04 - (ent.slot % 2) * H * 0.02;
		} else if (cat === 'invert') {
			ent.size = W * FISH_SCALE[tier] * 0.6;
			if (ent.x == null) {
				ent.x = W * (0.1 + rand(ent.uid + 7) * 0.8);
				ent.dir = rand(ent.uid) > 0.5 ? 1 : -1;
			}
			ent.y = this.sandTop + H * 0.06;
		} else if (ent.x == null || ent.fresh) {
			ent.fresh = false;
			ent.x = W * (0.15 + rand(ent.uid + 3) * 0.7);
			ent.y = H * (0.2 + rand(ent.uid + 5) * 0.5);
			ent.vx = 0;
			ent.vy = 0;
			ent.dir = 1;
			ent.tx = ent.x;
			ent.ty = ent.y;
		}
	};

	Game.prototype.run = function (kind, arg) {
		if (this.busy) return Promise.resolve();
		var self = this;
		var t = this.t;
		this.busy = true;
		this.rootEl.classList.add('rk-busy');
		return this.store[kind](arg).then(function (r) {
			self.busy = false;
			self.rootEl.classList.remove('rk-busy');
			var res = r.result || {};
			if (r.view) self.apply(r.view, false);
			if (!res.ok) {
				var err = res.error || 'network';
				if (err === 'member') self.memberModal();
				else self.toast(t('err_' + err), 'bad');
				return res;
			}
			if (kind === 'act') self.afterAct(arg, res);
			if (kind === 'buy') {
				self.toast('−' + E.price(self.catalog[arg]) + ' ' + t('coins'));
				if (res.discovered) self.discoveryModal(self.catalog[arg]);
			}
			if (kind === 'upgrade') {
				self.toast(t('tank_' + E.TANKS[res.tank].id) + '!', 'good');
				self.entities = {};
				self.syncEntities();
				self.renderPanel();
			}
			return res;
		}, function () {
			self.busy = false;
			self.rootEl.classList.remove('rk-busy');
			self.toast(t('err_network'), 'bad');
		});
	};

	Game.prototype.afterAct = function (task, res) {
		var t = this.t;
		if (task === 'collect') {
			this.toast(t('collected', { c: res.coins }), 'good');
		} else if (res.note === 'overfed') {
			this.toast(t('overfed'), 'bad');
		} else if (task === 'test') {
			this.testModal(res.readings);
			this.toast(t('reward', { c: res.coins, x: res.xp }), 'good');
		} else if (task === 'restart') {
			this.toast(t('tab_residents') + ' +1', 'good');
		} else {
			this.toast(t('reward', { c: res.coins, x: res.xp }), 'good');
		}
	};

	/* ---------- rendering (DOM) ---------- */

	Game.prototype.dur = function (ms) {
		var h = Math.floor(ms / E.HOUR);
		if (h >= 1) return this.t('hours', { n: h });
		return this.t('minutes', { n: Math.max(1, Math.ceil(ms / 60000)) });
	};

	Game.prototype.render = function () {
		var s = this.view.state;
		var t = this.t;
		var tank = E.TANKS[s.tank];
		this.tankName.innerHTML = esc(t('tank_' + tank.id)) + ' <small>' + esc(t('liters', { n: tank.liters })) + '</small>';
		this.coinsEl.innerHTML = '<i class="rk-coin" aria-hidden="true"></i><b>' + s.coins + '</b><span class="rk-sr"> ' + esc(t('coins')) + '</span>';
		var next = E.TANKS[s.tank + 1];
		var pct = next ? clamp(s.xp / next.xp, 0, 1) * 100 : 100;
		this.xpEl.innerHTML = '<b>' + s.xp + '</b> ' + esc(t('xp')) + '<span class="rk-xp-track"><span style="width:' + pct + '%"></span></span>';
		this.refresh();
		this.renderPanel();
	};

	/* Cheap, time-dependent bits: cooldown labels, bars, banner, collect bubble. */
	Game.prototype.refresh = function () {
		if (!this.view) return;
		var s = this.view.state;
		var t = this.t;
		var now = this.now();
		var self = this;
		Object.keys(this.actionBtns).forEach(function (task) {
			var b = self.actionBtns[task];
			var left = E.cooldownLeft(s, task, now);
			var sub = b.querySelector('.rk-action-sub');
			var off = left > 0 || !s.fish.length || (task === 'glass' && s.algae < 15);
			b.classList.toggle('rk-off', off);
			b.setAttribute('aria-disabled', off ? 'true' : 'false');
			sub.textContent = left > 0 ? t('in_time', { t: self.dur(left) }) : task === 'glass' && s.algae < 15 ? '✓' : t('ready');
			var urgent = !left && ((task === 'feed' && s.hunger >= 60) || (task === 'change' && s.quality < 50) || (task === 'glass' && s.algae >= 50));
			b.classList.toggle('rk-urgent', urgent);
		});
		this.bars.food.style.width = (100 - s.hunger) + '%';
		this.bars.water.style.width = s.quality + '%';
		this.bars.glass.style.width = (100 - s.algae) + '%';
		['food', 'water', 'glass'].forEach(function (k) {
			var v = k === 'food' ? 100 - s.hunger : k === 'water' ? s.quality : 100 - s.algae;
			self.bars[k].dataset.level = v < 30 ? 'bad' : v < 60 ? 'warn' : 'ok';
		});

		var since = now - s.lastDeath;
		var sick = E.isSick(s);
		if (s.fish.length && s.lastDeath && since < E.DEATH_GAP && sick) {
			this.banner.hidden = false;
			this.banner.className = 'rk-banner rk-banner-bad';
			this.banner.textContent = t('emergency', { t: this.dur(E.DEATH_GAP - since) });
		} else if (sick) {
			this.banner.hidden = false;
			this.banner.className = 'rk-banner rk-banner-warn';
			this.banner.textContent = t('sick_banner');
		} else {
			this.banner.hidden = true;
		}

		var coins = Math.floor(s.pending);
		this.collectBtn.hidden = coins < 1;
		this.collectBtn.innerHTML = '<i class="rk-coin" aria-hidden="true"></i>' + esc(t('task_collect', { n: '+' + coins }));
	};

	Game.prototype.renderPanel = function () {
		if (!this.view) return;
		var self = this;
		Object.keys(this.tabBtns).forEach(function (k) {
			self.tabBtns[k].setAttribute('aria-selected', k === self.tab ? 'true' : 'false');
		});
		this.panel.innerHTML = '';
		this['panel_' + this.tab]();
	};

	Game.prototype.careBadge = function (sp) {
		return '<span class="rk-badge rk-care-' + esc(sp.care) + '">' + esc(this.t('care_' + sp.care)) + '</span>';
	};

	Game.prototype.panel_residents = function () {
		var s = this.view.state;
		var t = this.t;
		var self = this;
		var tank = E.TANKS[s.tank];
		this.panel.appendChild(el('p', 'rk-muted', esc(t('capacity', { a: s.fish.length, b: tank.cap }))));
		if (!s.fish.length) {
			var empty = el('div', 'rk-empty', '<p>' + esc(t('empty_tank')) + '</p>');
			if (s.coins < E.price({ care: 'easy' })) {
				var b = el('button', 'rk-btn rk-btn-primary', esc(t('restart')));
				b.type = 'button';
				b.addEventListener('click', function () { self.run('act', 'restart'); });
				empty.appendChild(b);
			} else {
				var go = el('button', 'rk-btn rk-btn-primary', esc(t('tab_shop')));
				go.type = 'button';
				go.addEventListener('click', function () { self.tab = 'shop'; self.renderPanel(); });
				empty.appendChild(go);
			}
			this.panel.appendChild(empty);
		}
		var list = el('ul', 'rk-list');
		s.fish.forEach(function (f) {
			var sp = self.catalog[f.sid] || { name: '?', cat: 'fish', care: 'easy' };
			var state = f.health < 30 ? 'critical' : f.health < E.SICK ? 'sick' : 'ok';
			var li = el('li', 'rk-row rk-health-' + state);
			li.appendChild(S.thumb(sp, 44));
			li.appendChild(el('div', 'rk-row-main',
				'<b>' + esc(sp.name) + '</b><span class="rk-muted">' + esc(t('health_' + state)) + '</span>' +
				'<span class="rk-health"><span style="width:' + Math.max(2, f.health) + '%"></span></span>'));
			list.appendChild(li);
		});
		this.panel.appendChild(list);
		if (s.memorial.length) {
			var mem = el('details', 'rk-memorial');
			mem.appendChild(el('summary', null, esc(t('memorial')) + ' (' + s.memorial.length + ')'));
			var ml = el('ul', 'rk-list rk-list-dim');
			s.memorial.slice().reverse().forEach(function (m) {
				var sp = self.catalog[m.sid] || { name: '?' };
				var d = new Date(m.t);
				ml.appendChild(el('li', 'rk-row', '<span>✝</span><div class="rk-row-main"><b>' + esc(sp.name) + '</b><span class="rk-muted">' + d.toLocaleDateString() + '</span></div>'));
			});
			mem.appendChild(ml);
			this.panel.appendChild(mem);
		}
	};

	Game.prototype.panel_shop = function () {
		var s = this.view.state;
		var t = this.t;
		var self = this;
		var chips = el('div', 'rk-chips');
		['all', 'fish', 'coral', 'invert'].forEach(function (k) {
			var c = el('button', 'rk-chip', esc(k === 'all' ? t('all') : t('cat_' + k)));
			c.type = 'button';
			c.setAttribute('aria-pressed', k === self.shopFilter ? 'true' : 'false');
			c.addEventListener('click', function () { self.shopFilter = k; self.renderPanel(); });
			chips.appendChild(c);
		});
		this.panel.appendChild(chips);
		var grid = el('div', 'rk-grid');
		var list = this.species.filter(function (sp) {
			return self.shopFilter === 'all' || sp.cat === self.shopFilter;
		}).slice().sort(function (a, b) {
			return E.careRank(a.care) - E.careRank(b.care) || a.name.localeCompare(b.name);
		});
		list.forEach(function (sp) {
			var why = E.canBuy(s, sp.sid, self.catalog);
			var card = el('div', 'rk-card' + (why === 'tank' ? ' rk-locked' : ''));
			card.appendChild(self.pic(sp, 72));
			card.appendChild(el('div', 'rk-card-body',
				'<b>' + esc(sp.name) + '</b>' + (sp.sci ? '<i class="rk-muted">' + esc(sp.sci) + '</i>' : '') +
				'<span>' + self.careBadge(sp) + (s.discovered.indexOf(sp.sid) >= 0 ? ' <span class="rk-badge rk-badge-owned">' + esc(t('owned')) + '</span>' : '') + '</span>'));
			var btn = el('button', 'rk-btn rk-btn-buy');
			btn.type = 'button';
			if (why === 'tank') {
				btn.disabled = true;
				btn.textContent = t('needs_tank', { tank: t('tank_' + self.tankFor(sp).id) });
			} else {
				btn.innerHTML = '<i class="rk-coin" aria-hidden="true"></i>' + E.price(sp) + ' · ' + esc(t('buy'));
				if (why) btn.classList.add('rk-off');
				btn.addEventListener('click', function () {
					if (why) return self.toast(t('err_' + why), 'bad');
					self.run('buy', sp.sid);
				});
			}
			card.appendChild(btn);
			grid.appendChild(card);
		});
		this.panel.appendChild(grid);
	};

	/* The encyclopedia photo with the in-game sprite in its corner; just the sprite when there's no photo. */
	Game.prototype.pic = function (sp, px) {
		if (!sp.img) return S.thumb(sp, px);
		var box = el('span', 'rk-pic');
		box.style.width = px + 'px';
		box.style.height = px + 'px';
		var img = el('img');
		img.src = sp.img;
		img.alt = '';
		img.loading = 'lazy';
		img.addEventListener('error', function () { box.replaceWith(S.thumb(sp, px)); });
		box.appendChild(img);
		box.appendChild(S.thumb(sp, Math.round(px * 0.5)));
		return box;
	};

	Game.prototype.tankFor = function (sp) {
		var rank = E.careRank(sp.care);
		for (var i = 0; i < E.TANKS.length; i++) {
			if (E.TANKS[i].maxCare >= rank && E.TANKS[i].cats.indexOf(sp.cat) >= 0) return E.TANKS[i];
		}
		return E.TANKS[E.TANKS.length - 1];
	};

	Game.prototype.link = function (sp) {
		return this.cfg.linkFor ? this.cfg.linkFor(sp) : sp.url;
	};

	Game.prototype.panel_album = function () {
		var s = this.view.state;
		var t = this.t;
		var self = this;
		this.panel.appendChild(el('p', 'rk-muted', esc(t('album_count', { a: s.discovered.length, b: this.species.length }))));
		var grid = el('div', 'rk-grid rk-album');
		this.species.forEach(function (sp) {
			var known = s.discovered.indexOf(sp.sid) >= 0;
			var card = el('div', 'rk-card' + (known ? '' : ' rk-unknown'));
			card.appendChild(known ? self.pic(sp, 64) : S.thumb(sp, 64, true));
			if (!known) {
				card.appendChild(el('div', 'rk-card-body', '<b>?</b><span class="rk-muted">' + esc(t('album_unknown')) + '</span>'));
			} else {
				card.appendChild(el('div', 'rk-card-body', '<b>' + esc(sp.name) + '</b>' + self.careBadge(sp)));
				var read = s.read.indexOf(sp.sid) >= 0;
				var a = el('a', 'rk-btn ' + (read ? 'rk-btn-ghost' : 'rk-btn-primary'), esc(read ? '✓ ' + t('album_done') : t('album_read', { n: E.READ_REWARD.coins })));
				a.href = self.link(sp);
				a.target = '_blank';
				a.rel = 'noopener';
				card.appendChild(a);
			}
			grid.appendChild(card);
		});
		this.panel.appendChild(grid);
	};

	Game.prototype.panel_tank = function () {
		var s = this.view.state;
		var t = this.t;
		var self = this;
		var ladder = el('ol', 'rk-ladder');
		E.TANKS.forEach(function (tk, i) {
			ladder.appendChild(el('li', i < s.tank ? 'rk-done' : i === s.tank ? 'rk-current' : '',
				'<b>' + esc(t('tank_' + tk.id)) + '</b><span class="rk-muted">' + esc(t('liters', { n: tk.liters })) + '</span>'));
		});
		this.panel.appendChild(ladder);
		var next = E.TANKS[s.tank + 1];
		if (!next) {
			this.panel.appendChild(el('p', null, esc(t('up_max'))));
			return;
		}
		var box = el('div', 'rk-upgrade');
		box.appendChild(el('h3', null, esc(t('up_title', { tank: t('tank_' + next.id) }))));
		var careNames = E.CARE.slice(0, next.maxCare + 1).map(function (c) { return t('care_' + c); }).join(', ');
		var info = t('up_unlocks', { cap: next.cap, care: careNames });
		if (next.cats.length > E.TANKS[s.tank].cats.length) info += ' ' + t('up_unlocks_cats');
		box.appendChild(el('p', null, esc(info)));
		[['xp', s.xp, next.xp, 'up_need_xp'], ['coins', s.coins, next.cost, 'up_need_coins']].forEach(function (r) {
			var pct = clamp(r[1] / r[2], 0, 1) * 100;
			box.appendChild(el('div', 'rk-req' + (pct >= 100 ? ' rk-req-ok' : ''),
				'<span>' + esc(t(r[3], { a: Math.min(r[1], r[2]), b: r[2] })) + '</span><span class="rk-health"><span style="width:' + pct + '%"></span></span>'));
		});
		if (!this.view.member) {
			box.appendChild(this.memberBlock());
		} else {
			var why = E.canUpgrade(s, true);
			var b = el('button', 'rk-btn rk-btn-primary', esc(t('up_btn')));
			b.type = 'button';
			if (why) b.classList.add('rk-off');
			b.addEventListener('click', function () {
				if (why) return self.toast(t('err_' + why), 'bad');
				self.run('upgrade');
			});
			box.appendChild(b);
		}
		this.panel.appendChild(box);
	};

	Game.prototype.memberBlock = function () {
		var t = this.t;
		var urls = this.cfg.urls || {};
		var box = el('div', 'rk-member');
		box.innerHTML = '<b>' + esc(t('member_title')) + '</b><p>' + esc(t('member_body')) + '</p>' +
			'<div class="rk-btns"><a class="rk-btn rk-btn-primary" href="' + esc(urls.join || '#') + '">' + esc(t('join')) + '</a>' +
			'<a class="rk-btn rk-btn-ghost" href="' + esc(urls.signIn || '#') + '">' + esc(t('sign_in')) + '</a></div>';
		return box;
	};

	/* ---------- modals & toasts ---------- */

	Game.prototype.openModal = function (node) {
		var self = this;
		var dlg = el('div', 'rk-dialog');
		dlg.setAttribute('role', 'dialog');
		dlg.setAttribute('aria-modal', 'true');
		dlg.appendChild(node);
		var close = el('button', 'rk-close', '×');
		close.type = 'button';
		close.setAttribute('aria-label', this.t('close'));
		close.addEventListener('click', function () { self.closeModal(); });
		dlg.appendChild(close);
		this.modal.innerHTML = '';
		this.modal.appendChild(dlg);
		this.modal.hidden = false;
		close.focus();
	};

	Game.prototype.closeModal = function () {
		this.modal.hidden = true;
		this.modal.innerHTML = '';
	};

	Game.prototype.discoveryModal = function (sp) {
		var t = this.t;
		var self = this;
		var n = el('div', 'rk-discovery');
		n.innerHTML = '<p class="rk-eyebrow">' + esc(t('disc_title')) + '</p>' +
			(sp.img ? '<img src="' + esc(sp.img) + '" alt="" loading="lazy">' : '') +
			'<h3>' + esc(sp.name) + '</h3>' + (sp.sci ? '<p class="rk-muted"><i>' + esc(sp.sci) + '</i></p>' : '') +
			'<p>' + this.careBadge(sp) + ' <span class="rk-badge">' + esc(t('cat_' + sp.cat)) + '</span></p>' +
			'<p>' + esc(t('disc_body', { name: sp.name, n: E.READ_REWARD.coins })) + '</p>';
		if (!sp.img) n.insertBefore(S.thumb(sp, 120), n.children[1]);
		var btns = el('div', 'rk-btns');
		var go = el('a', 'rk-btn rk-btn-primary', esc(t('disc_read')) + ' <i class="rk-coin" aria-hidden="true"></i>+' + E.READ_REWARD.coins);
		go.href = this.link(sp);
		go.target = '_blank';
		go.rel = 'noopener';
		go.addEventListener('click', function () { self.closeModal(); });
		var later = el('button', 'rk-btn rk-btn-ghost', esc(t('disc_later')));
		later.type = 'button';
		later.addEventListener('click', function () { self.closeModal(); });
		btns.appendChild(go);
		btns.appendChild(later);
		n.appendChild(btns);
		this.openModal(n);
	};

	Game.prototype.testModal = function (r) {
		var t = this.t;
		var n = el('div', 'rk-test');
		var lvl = function (ok, warn) { return ok ? 'ok' : warn ? 'warn' : 'bad'; };
		var rows = [
			['test_ph', r.ph.toFixed(2), lvl(r.ph >= 8.0, r.ph >= 7.8)],
			['test_no3', r.no3 + ' ppm', lvl(r.no3 <= 20, r.no3 <= 40)],
			['test_temp', r.temp.toFixed(1) + ' °C', 'ok']
		];
		n.innerHTML = '<h3>' + esc(t('test_title')) + '</h3><div class="rk-tubes">' + rows.map(function (row) {
			return '<div class="rk-tube rk-tube-' + row[2] + '"><span class="rk-tube-glass"><span></span></span><b>' + esc(row[1]) + '</b><span class="rk-muted">' + esc(t(row[0])) + '</span></div>';
		}).join('') + '</div><p class="rk-test-verdict rk-' + r.status + '">' + esc(t('test_' + r.status)) + '</p>';
		this.openModal(n);
	};

	Game.prototype.memberModal = function () {
		this.openModal(this.memberBlock());
	};

	Game.prototype.showAway = function () {
		var s = this.view.state;
		var t = this.t;
		var self = this;
		var seen = 0;
		try { seen = Number(root.localStorage.getItem(this.seenKey)) || 0; } catch (e) {}
		var fresh = s.events.filter(function (ev) { return ev.t > seen; });
		if (s.events.length) {
			try { root.localStorage.setItem(this.seenKey, String(s.events[s.events.length - 1].t)); } catch (e) {}
		}
		if (!fresh.length) return;
		var n = el('div', 'rk-away');
		n.innerHTML = '<h3>' + esc(t('away_title')) + '</h3><ul class="rk-list">' + fresh.map(function (ev) {
			var sp = self.catalog[ev.sid] || { name: '?' };
			return '<li class="rk-row"><span>✝</span><div class="rk-row-main">' + esc(t('away_death', { name: sp.name })) + '</div></li>';
		}).join('') + '</ul><p>' + esc(t('away_ok')) + '</p>';
		this.openModal(n);
	};

	Game.prototype.toast = function (text, kind) {
		var n = el('div', 'rk-toast' + (kind ? ' rk-toast-' + kind : ''), esc(text));
		this.toasts.appendChild(n);
		root.setTimeout(function () { n.classList.add('rk-toast-out'); }, 2200);
		root.setTimeout(function () { n.remove(); }, 2700);
	};

	/* ---------- the tank (canvas) ---------- */

	Game.prototype.loop = function (ts) {
		var dt = Math.min(0.05, (ts - (this.lastTs || ts)) / 1000);
		this.lastTs = ts;
		if (this.view) {
			this.update(dt, ts / 1000);
			this.draw(ts / 1000);
		}
		root.requestAnimationFrame(this.loop);
	};

	Game.prototype.update = function (dt, time) {
		var s = this.view.state;
		var W = this.W;
		var H = this.H;
		var self = this;
		this.disp.quality += (s.quality - this.disp.quality) * Math.min(1, dt * 1.5);
		this.disp.algae += (s.algae - this.disp.algae) * Math.min(1, dt * 1.5);
		if (this.waterRush) this.waterRush = Math.max(0, this.waterRush - dt * 0.6);

		this.pellets.forEach(function (p) {
			if (p.y < self.sandTop - 4) p.y += p.vy * dt;
			p.x += Math.sin(time * 2 + p.vy) * 6 * dt;
		});

		Object.keys(this.entities).forEach(function (uid) {
			var e = self.entities[uid];
			var sick = e.health < E.SICK;
			if (e.sp.cat === 'coral') return;
			if (e.sp.cat === 'invert') {
				var sp = e.size * (sick ? 0.05 : 0.15);
				e.x += e.dir * sp * dt;
				if (e.x < W * 0.06 || e.x > W * 0.94) e.dir *= -1;
				return;
			}
			var speed = e.size * (sick ? 0.6 : 1.6) * (e.health < 30 ? 0.5 : 1);
			var food = null;
			var best = Infinity;
			self.pellets.forEach(function (p) {
				var d = Math.hypot(p.x - e.x, p.y - e.y);
				if (d < best) { best = d; food = p; }
			});
			if (food) {
				e.tx = food.x;
				e.ty = food.y;
				speed *= 1.8;
				if (best < e.size * 0.35) food.eaten = true;
			} else if (Math.hypot(e.tx - e.x, e.ty - e.y) < e.size * 0.4 || rand(Math.floor(time * 0.3) + e.uid) > 0.997) {
				e.tx = W * (0.08 + Math.random() * 0.84);
				e.ty = sick ? self.sandTop - e.size * (0.4 + Math.random() * 0.6) : H * (0.12 + Math.random() * 0.6);
			}
			var dx = e.tx - e.x;
			var dy = e.ty - e.y;
			var d = Math.hypot(dx, dy) || 1;
			e.vx += (dx / d * speed - e.vx) * Math.min(1, dt * 1.2);
			e.vy += (dy / d * speed * 0.6 - e.vy) * Math.min(1, dt * 1.2);
			e.x = clamp(e.x + e.vx * dt, e.size * 0.6, W - e.size * 0.6);
			e.y = clamp(e.y + e.vy * dt, H * 0.08, self.sandTop - e.size * 0.3);
			if (Math.abs(e.vx) > 4) e.dir = e.vx > 0 ? 1 : -1;
		});
		this.pellets = this.pellets.filter(function (p) { return !p.eaten && (p.life = (p.life || 0) + dt) < 25; });

		if (Math.random() < dt * (3 + this.waterRush * 40)) {
			this.bubbles.push({ x: W * 0.93 + Math.random() * 8, y: this.sandTop, r: 1.5 + Math.random() * 3, vy: 40 + Math.random() * 30, life: 1 });
			if (this.waterRush) this.bubbles.push({ x: Math.random() * W, y: H, r: 2 + Math.random() * 5, vy: 80 + Math.random() * 80, life: 1 });
		}
		this.bubbles.forEach(function (b) {
			b.y -= b.vy * dt;
			b.x += Math.sin(b.y * 0.05) * 10 * dt;
		});
		this.bubbles = this.bubbles.filter(function (b) { return b.y > -10; }).slice(-160);
	};

	Game.prototype.draw = function (time) {
		var ctx = this.ctx;
		var W = this.W;
		var H = this.H;
		var self = this;
		ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
		var dirt = clamp((80 - this.disp.quality) / 80, 0, 1);

		var top = mix([120, 214, 255], [150, 170, 110], dirt);
		var bottom = mix([14, 74, 140], [52, 70, 38], dirt);
		var g = ctx.createLinearGradient(0, 0, 0, H);
		g.addColorStop(0, rgb(top));
		g.addColorStop(1, rgb(bottom));
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, W, H);

		// Light rays
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		for (var i = 0; i < 4; i++) {
			var x = W * (0.15 + i * 0.24) + Math.sin(time * 0.3 + i) * W * 0.04;
			ctx.fillStyle = 'rgba(255,255,255,' + (0.05 * (1 - dirt * 0.7)) + ')';
			ctx.beginPath();
			ctx.moveTo(x - W * 0.03, 0);
			ctx.lineTo(x + W * 0.03, 0);
			ctx.lineTo(x + W * 0.12, H);
			ctx.lineTo(x - W * 0.02, H);
			ctx.closePath();
			ctx.fill();
		}
		ctx.restore();

		this.drawRocks(ctx);

		var ents = Object.keys(this.entities).map(function (k) { return self.entities[k]; });
		ents.filter(function (e) { return e.sp.cat === 'coral'; }).forEach(function (e) {
			ctx.save();
			ctx.translate(e.x, e.y);
			S.draw(ctx, e.sp, e.size, time + e.phase, e.health < E.SICK);
			ctx.restore();
		});
		ents.filter(function (e) { return e.sp.cat === 'invert'; }).forEach(function (e) {
			ctx.save();
			ctx.translate(e.x, e.y - e.size * 0.3);
			ctx.scale(e.dir, 1);
			S.draw(ctx, e.sp, e.size, time + e.phase, e.health < E.SICK);
			ctx.restore();
		});

		ctx.fillStyle = '#7a4a22';
		this.pellets.forEach(function (p) {
			ctx.beginPath();
			ctx.arc(p.x, p.y, 2.4, 0, TAU);
			ctx.fill();
		});

		ents.filter(function (e) { return e.sp.cat === 'fish'; }).forEach(function (e) {
			var sick = e.health < E.SICK;
			ctx.save();
			ctx.translate(e.x, e.y + Math.sin(time * 2 + e.phase) * 2);
			ctx.scale(e.dir, 1);
			if (e.health < 30) ctx.rotate(0.35);
			var grow = Math.min(1, (performance.now() - e.born) / 600);
			ctx.scale(grow, grow);
			S.draw(ctx, e.sp, e.size, time + e.phase, sick);
			ctx.restore();
		});

		ctx.fillStyle = 'rgba(255,255,255,0.55)';
		this.bubbles.forEach(function (b) {
			ctx.beginPath();
			ctx.arc(b.x, b.y, b.r, 0, TAU);
			ctx.fill();
		});

		if (dirt > 0) {
			ctx.fillStyle = 'rgba(70,86,30,' + dirt * 0.32 + ')';
			ctx.fillRect(0, 0, W, H);
		}
		if (this.waterRush) {
			ctx.fillStyle = 'rgba(190,235,255,' + this.waterRush * 0.35 + ')';
			ctx.fillRect(0, 0, W, H);
		}

		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.drawImage(this.algaeCanvas, 0, 0);
		ctx.restore();

		// Glass sheen and water line
		var sheen = ctx.createLinearGradient(0, 0, W, H);
		sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
		sheen.addColorStop(0.3, 'rgba(255,255,255,0)');
		ctx.fillStyle = sheen;
		ctx.fillRect(0, 0, W, H);
		ctx.fillStyle = 'rgba(255,255,255,0.35)';
		ctx.fillRect(0, H * 0.035, W, 2);
	};

	Game.prototype.drawRocks = function (ctx) {
		var W = this.W;
		var H = this.H;
		var y = this.sandTop;
		var sand = ctx.createLinearGradient(0, y, 0, H);
		sand.addColorStop(0, '#e9dcb8');
		sand.addColorStop(1, '#c8b386');
		ctx.fillStyle = sand;
		ctx.beginPath();
		ctx.moveTo(0, y + 6);
		for (var x = 0; x <= W; x += W / 8) ctx.lineTo(x, y + Math.sin(x * 0.02) * 4);
		ctx.lineTo(W, H);
		ctx.lineTo(0, H);
		ctx.closePath();
		ctx.fill();

		var tier = this.view.state.tank;
		var rocks = [[0.12, 0.13], [0.3, 0.09], [0.78, 0.15], [0.9, 0.1], [0.55, 0.07]].slice(0, 3 + Math.min(2, tier));
		rocks.forEach(function (r, i) {
			var cx = W * r[0];
			var rw = W * r[1];
			var rh = H * (0.12 + (i % 2) * 0.05);
			ctx.fillStyle = i % 2 ? '#a08c80' : '#b49a8a';
			ctx.beginPath();
			ctx.moveTo(cx - rw, y + 8);
			ctx.quadraticCurveTo(cx - rw * 0.9, y - rh, cx - rw * 0.2, y - rh * 0.9);
			ctx.quadraticCurveTo(cx + rw * 0.3, y - rh * 1.2, cx + rw * 0.8, y - rh * 0.4);
			ctx.quadraticCurveTo(cx + rw, y, cx + rw, y + 8);
			ctx.closePath();
			ctx.fill();
			ctx.fillStyle = 'rgba(200,90,140,0.35)';
			for (var k = 0; k < 5; k++) {
				ctx.beginPath();
				ctx.arc(cx + (rand(i * 10 + k) - 0.5) * rw * 1.4, y - rand(i * 10 + k + 5) * rh * 0.8, 2 + rand(k + i) * 4, 0, TAU);
				ctx.fill();
			}
		});
	};

	root.ReefKeeper = {
		mount: function (node, cfg) {
			return new Game(node, cfg);
		}
	};
})(this);
