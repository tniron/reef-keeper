/*
 * Reef Keeper — hand-made looks for the encyclopedia species, keyed by the
 * product slug and matched to the photos on reefnetwork.com. Species that
 * aren't listed here get a generated look (see sprites.js).
 *
 * shape: a body profile from sprites.js (damsel, chromis, clown, tang,
 *   anthias, cardinal, basslet, wrasse, dottyback, goby, stubgoby, cleaner,
 *   blenny, dragonet; corals: mushroom, hammer, tree; inverts: snail, crab).
 * marks: drawn on the body in order. x runs 1 (nose) → -1 (tail),
 *   y runs -1 (back) → 1 (belly).
 */
(function (root) {
	'use strict';

	var looks = {
		'yellowtail-blue-damselfish-chrysiptera-parasema': {
			shape: 'damsel', body: '#1f30c8', fin: '#2232b4', tail: '#ffc414', eye: '#1b2a8a',
			marks: [{ t: 'back', y: -0.5, color: '#1a248f' }, { t: 'split', x: -0.6, color: '#ffc414' }]
		},
		'lyretail-anthias-pseudanthias-squamipinnis': {
			shape: 'anthias', body: '#ff9416', fin: '#ffa320', tail: '#ff9a16', pelvic: '#ff4fa3', eye: '#4a3cc8',
			marks: [{ t: 'belly', y: 0.5, color: '#ffab3a' }, { t: 'streak', x0: 0.62, y0: 0.2, x1: 0.28, y1: 0.45, w: 0.06, color: '#a64dff' }]
		},
		'yellow-tang-zebrasoma-flavescens': {
			shape: 'tang', body: '#ffd51a', fin: '#ffc90c', eye: '#5a4200',
			marks: [{ t: 'streak', x0: -0.74, y0: 0.08, x1: -0.62, y1: 0.08, w: 0.07, color: '#ffffff' }]
		},
		'ocellaris-clownfish-amphiprion-ocellaris': {
			shape: 'clown', body: '#ff7212', fin: '#ff7a18', finEdge: '#16161c', eye: '#ff9a40',
			marks: [{ t: 'bands', xs: [0.5, -0.02, -0.72], w: 0.17, wide: 1, color: '#ffffff', edge: '#16161c', bulge: [0.06, 0.2, 0] }]
		},
		'green-chromis-chromis-viridis': {
			shape: 'chromis', body: '#b2de6a', fin: '#cfe8b0', tail: '#c4e6b8', eye: '#eaffd8',
			marks: [{ t: 'back', y: -0.35, slope: 0.1, color: '#86d4a0' }, { t: 'scales', color: 'rgba(40,90,40,.22)' }]
		},
		'neon-goby-elacatinus-oceanops': {
			shape: 'cleaner', body: '#16182a', fin: '#1e2132',
			marks: [{ t: 'belly', y: 0.35, color: '#c6ccd8' }, { t: 'stripe', y: -0.12, h: 0.4, x0: 1.0, color: '#36d2ff' }]
		},
		'citron-goby-gobiodon-citrinus': {
			shape: 'stubgoby', body: '#c6cd2a', fin: '#c2c822', eye: '#e8eef0',
			marks: [{ t: 'vlines', xs: [0.74, 0.55, 0.36], w: 0.03, color: '#eef6ff' }, { t: 'streak', x0: 0.2, y0: -0.6, x1: -0.3, y1: -0.6, w: 0.025, color: '#e6f0ff' }]
		},
		'yellow-line-goby-elacatinus-figaro': {
			shape: 'cleaner', body: '#17171f', fin: '#1d1d26', tail: '#e8a812',
			marks: [{ t: 'belly', y: 0.4, color: '#b8b4c8' }, { t: 'stripe', y: -0.1, h: 0.34, x0: 1.0, color: '#ffcf1a' }]
		},
		'red-head-goby-elacatinus-puncticulatus': {
			shape: 'goby', body: '#e4dccb', fin: 'rgba(236,230,218,.85)', eye: '#d42020',
			marks: [
				{ t: 'dash', y: 0.1, h: 0.2, n: 8, x0: 0.4, x1: -1, color: '#2e2a2a', color2: '#f2d42a' },
				{ t: 'head', x: 0.45, color: '#e8302a' },
				{ t: 'streak', x0: 0.95, y0: -0.1, x1: 0.5, y1: -0.25, w: 0.05, color: '#ffffff' }
			]
		},
		'tangaroa-goby-ctenogobiops-tangaroai': {
			shape: 'goby', body: '#bfd2d4', fin: '#d6e2e2', eye: '#4a8ab8',
			marks: [
				{ t: 'belly', y: 0.45, color: '#e2ece8' },
				{ t: 'dots', n: 24, r: 0.045, color: '#f4fbff', seed: 3 },
				{ t: 'dots', n: 9, r: 0.032, color: '#e8a050', seed: 9 }
			]
		},
		'yellow-cardinalfish-ostorhinchus-luteus': {
			shape: 'cardinal', body: '#ffc21c', fin: '#ffb020', tail: '#e8a030', tailEdge: '#8a4a30', eye: '#ff8a1a', p: { ry: 0.42, dh: 0.22, ah: 0.18 },
			marks: [{ t: 'belly', y: 0.45, color: '#ffd860' }, { t: 'streak', x0: 0.95, y0: -0.05, x1: 0.45, y1: -0.15, w: 0.05, color: '#fff0a8' }]
		},
		'deepwater-candy-basslet-liopropoma-carmabi': {
			shape: 'basslet', body: '#ffa11a', fin: '#ffb12a',
			dorsalSpot: { color: '#111522', ring: '#2f5bff' }, finSpot: { color: '#111522', ring: '#2f5bff' },
			marks: [{ t: 'lines', n: 4, y0: -0.62, y1: 0.55, w: 0.11, color: '#cc2a9c' }]
		},
		'sharknose-goby-elacatinus-evelynae': {
			shape: 'cleaner', body: '#121620', fin: '#1a1e28',
			marks: [{ t: 'belly', y: 0.35, color: '#dcdfe6' }, { t: 'stripe', y: -0.12, h: 0.38, x0: 1.05, split: 0.18, color: '#ffd21a', color2: '#2ae0d8' }]
		},
		'panamic-barnacle-blenny': {
			shape: 'blenny', body: '#7d6a46', fin: '#b0a280', eye: '#e04a2a',
			marks: [
				{ t: 'bands', xs: [0.3, 0, -0.3, -0.6], w: 0.12, color: 'rgba(60,40,20,.45)' },
				{ t: 'dots', n: 18, r: 0.05, color: '#3a2a18', seed: 5 },
				{ t: 'dots', n: 8, r: 0.04, color: '#d8c8a0', seed: 12 }
			]
		},
		'black-barred-convict-goby-priolepis-nocturna': {
			shape: 'stubgoby', body: '#f2e6e2', fin: '#efe2dc', finBands: '#5a2c1c', dorsalKind: 'spiky', eye: '#c8a040',
			marks: [{ t: 'bands', xs: [0.62, 0.34, 0.04, -0.28, -0.6], w: 0.11, color: '#5a2a1a' }]
		},
		'broadstripe-goby-elacatinus-prochilos': {
			shape: 'cleaner', body: '#121420', fin: '#1a1c28', p: { ry: 0.17 },
			marks: [
				{ t: 'belly', y: 0.45, color: '#e9e9ee' },
				{ t: 'stripe', y: 0.0, h: 0.22, x0: 1.0, x1: -1.05, color: '#f0f0f4' },
				{ t: 'spot', x: 0.5, y: 0.45, r: 0.12, color: '#e86a7a' }
			]
		},
		'allens-damselfish-pomacentrus-alleni': {
			shape: 'damsel', body: '#1fb0e6', fin: '#1a8ad8', tail: '#1a8ad8', tailEdge: '#0c1628', anal: '#ffc22a', eye: '#1a4aa0',
			marks: [{ t: 'back', y: -0.4, color: '#1d74c8' }, { t: 'belly', y: 0.55, color: '#32cbe8' }, { t: 'scales', color: 'rgba(10,40,90,.18)' }]
		},
		'speckled-damsel-pomacentrus-bankanensis': {
			shape: 'damsel', body: '#5a6a2c', fin: '#2c3a2a', tail: '#d4dcd8', dorsal: '#1f2a24', finEdge: '#3a6cff', pelvic: '#c8d040',
			dorsalSpot: { color: '#0a0a0a', ring: '#e8e8e0' },
			marks: [{ t: 'back', y: -0.3, color: '#26321f' }, { t: 'belly', y: 0.4, color: '#9aae3a' }, { t: 'scales', color: 'rgba(0,0,0,.18)' }]
		},
		'pink-streaked-wrasse': {
			shape: 'wrasse', body: '#e4683a', fin: '#e8743a', tail: '#c4b23a', eye: '#ff8800', p: { er: 0.15 },
			marks: [{ t: 'lines', n: 6, y0: -0.7, y1: 0.7, w: 0.05, color: '#ff9ccc' }, { t: 'head', x: 0.84, color: '#ff7a9a' }]
		},
		'tail-spot-blenny-ecsenius-stigmatura': {
			shape: 'blenny', body: '#ff9a2c', fin: '#ffb050', tail: 'rgba(220,230,245,.55)', eye: '#4a90ff',
			marks: [
				{ t: 'grad', head: '#3a78e8', tail: '#ff9a2c', x0: 0.7, x1: 0.15 },
				{ t: 'spot', x: -0.74, y: 0, r: 0.08, color: '#111111', ring: '#ffffff' }
			]
		},
		'ring-eyed-dottyback-pseudoplesiops-typus': {
			shape: 'dottyback', body: '#e05a44', fin: '#e8664c', finEdge: '#ff9a7a', eye: '#ffb030',
			marks: [{ t: 'scales', color: 'rgba(120,20,10,.18)' }]
		},
		'yellow-priolepis-goby': {
			shape: 'stubgoby', body: '#c4ac2c', fin: '#ffe41a', tail: '#ffe41a', pelvic: '#ffe41a', eye: '#3ab8e8', p: { dh: 0.34, tl: 0.42, th: 0.44 },
			marks: [{ t: 'back', y: -0.4, color: '#b09a28' }]
		},
		'starry-goby-asterropteryx-semipunctatus': {
			shape: 'goby', body: '#2c2220', fin: '#3a302a',
			marks: [{ t: 'belly', y: 0.5, color: '#4a3a32' }, { t: 'dots', n: 28, r: 0.035, color: '#56d8ff', seed: 7 }]
		},
		'links-goby-amblygobius-linki': {
			shape: 'goby', body: '#ece4d2', fin: '#e4d4bc', finBands: '#c46a3a',
			marks: [{ t: 'lines', n: 3, y0: -0.55, y1: 0.3, w: 0.12, color: '#2a1c16' }]
		},
		'mandarin-dragonet-synchiropus-splendidus': {
			shape: 'dragonet', body: '#1d68e6', fin: '#1d68e6', tail: '#ff8a20', tailEdge: '#1d4fd8', finEdge: '#1b3fd0', pectoral: '#2a7af0',
			marks: [{ t: 'psy', color: '#ff8a1a', edge: '#0b1a4a' }, { t: 'head', x: 0.62, color: 'rgba(60,200,150,.5)' }]
		},
		'yasha-goby-stonogobiops-yasha': {
			shape: 'goby', body: '#f6f2ee', fin: '#e4ecee', filament: '#ffffff', dorsalSpot: { color: '#111111' }, eye: '#e86a1a',
			marks: [
				{ t: 'lines', n: 2, y0: -0.25, y1: 0.3, w: 0.13, color: '#e8521c' },
				{ t: 'dots', n: 6, r: 0.07, color: '#f08a1a', x0: 1, x1: 0.45, seed: 2 }
			]
		},
		'rose-anthias-odontanthias-katayamai': {
			shape: 'anthias', body: '#ffc83c', fin: '#ffaa30', tail: '#ff5a32', pelvic: '#fff4e0', dorsalKind: 'spiky', p: { tail: 'fork' },
			marks: [
				{ t: 'grad', head: '#ffc83c', tail: '#ffa08a', x0: 0.2, x1: -0.9 },
				{ t: 'lines', n: 5, y0: -0.6, y1: 0.5, w: 0.04, color: 'rgba(255,120,60,.45)' },
				{ t: 'spot', x: 0.86, y: 0.35, r: 0.1, color: '#ff9ab0' }
			]
		},
		'azure-damselfish-chrysiptera-hemicyanea': {
			shape: 'damsel', body: '#1d58ea', fin: '#1d4fd8', tail: '#ffc414', anal: '#ffc414', pelvic: '#ffc414', eye: '#1b2a8a',
			marks: [{ t: 'belly', y: 0.22, slope: 0.36, color: '#ffc414' }, { t: 'scales', color: 'rgba(10,20,80,.22)' }]
		},

		'mushroom-coral-discosoma-sp': { shape: 'mushroom', body: '#b47aac', accent: '#e2b0d8', fin: '#7a4a7a' },
		'hammer-coral-fimbriaphyllia-ancora': { shape: 'hammer', body: '#3aa6ee', accent: '#9ae4ff', fin: '#25509e' },
		'neon-pineapple-tree-coral-capnella-sp': { shape: 'tree', body: '#6fe89a', accent: '#d2ff9a', fin: '#5a6ed8' },
		'electric-blue-hermit-crab-calcinus-elegans': { shape: 'crab', body: '#3aa0f0', band: '#4a1424', accent: '#ece4dc', spots: '#c4483a', antenna: '#ff9a1a' },
		'turban-snail-tectus-fenestratus': { shape: 'snail', body: '#c8a49a', accent: '#8a5a4a', spots: '#d86a3a', fin: '#b8a890' }
	};

	if (typeof module === 'object' && module.exports) module.exports = looks;
	else root.ReefLooks = looks;
})(this);
