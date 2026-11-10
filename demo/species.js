/* Demo species, copied from reefnetwork.com's encyclopedia. The plugin builds this list from WooCommerce on the live site. */
(function (root) {
	var list = [
		{
			"sid": "17831",
			"name": "Yellowtail Blue Damselfish",
			"sci": "Chrysiptera parasema",
			"slug": "yellowtail-blue-damselfish-chrysiptera-parasema",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/yellowtail-blue-damselfish-chrysiptera-parasema/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/10/yellowtail-blue-damselfish-chrysiptera-parasema-1-300x300.jpg"
		},
		{
			"sid": "17515",
			"name": "Lyretail Anthias",
			"sci": "Pseudanthias squamipinnis",
			"slug": "lyretail-anthias-pseudanthias-squamipinnis",
			"cat": "fish",
			"care": "difficult",
			"url": "https://reefnetwork.com/lyretail-anthias-pseudanthias-squamipinnis/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/10/lyretail-anthias-pseudanthias-squamipinnis-300x300.jpg"
		},
		{
			"sid": "17410",
			"name": "Yellow Tang",
			"sci": "Zebrasoma flavescens",
			"slug": "yellow-tang-zebrasoma-flavescens",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/yellow-tang-zebrasoma-flavescens/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/10/yellow-tang-zebrasoma-flavescens-300x300.jpg"
		},
		{
			"sid": "16458",
			"name": "Ocellaris Clownfish",
			"sci": "Amphiprion ocellaris",
			"slug": "ocellaris-clownfish-amphiprion-ocellaris",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/ocellaris-clownfish-amphiprion-ocellaris/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/10/ocellaris-clownfish-amphiprion-ocellaris-300x300.jpg"
		},
		{
			"sid": "16181",
			"name": "Green Chromis",
			"sci": "Chromis viridis",
			"slug": "green-chromis-chromis-viridis",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/green-chromis-chromis-viridis/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/10/green-chromis-chromis-viridis-300x300.jpg"
		},
		{
			"sid": "15943",
			"name": "Neon Goby",
			"sci": "Elacatinus oceanops",
			"slug": "neon-goby-elacatinus-oceanops",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/neon-goby-elacatinus-oceanops/",
			"img": "https://reefnetwork.com/wp-content/uploads/neon-goby-elacatinus-oceanops-300x300.jpg"
		},
		{
			"sid": "15503",
			"name": "Mushroom Coral",
			"sci": "Discosoma sp.",
			"slug": "mushroom-coral-discosoma-sp",
			"cat": "coral",
			"care": "easy",
			"url": "https://reefnetwork.com/mushroom-coral-discosoma-sp/",
			"img": "https://reefnetwork.com/wp-content/uploads/mushroom-coral-discosoma-sp-300x300.jpg"
		},
		{
			"sid": "15341",
			"name": "Hammer Coral",
			"sci": "Fimbriaphyllia ancora",
			"slug": "hammer-coral-fimbriaphyllia-ancora",
			"cat": "coral",
			"care": "moderate",
			"url": "https://reefnetwork.com/hammer-coral-fimbriaphyllia-ancora/",
			"img": "https://reefnetwork.com/wp-content/uploads/hammer-coral-fimbriaphyllia-ancora-300x300.jpg"
		},
		{
			"sid": "14865",
			"name": "Neon Pineapple Tree Coral",
			"sci": "Capnella sp.",
			"slug": "neon-pineapple-tree-coral-capnella-sp",
			"cat": "coral",
			"care": "easy",
			"url": "https://reefnetwork.com/neon-pineapple-tree-coral-capnella-sp/",
			"img": "https://reefnetwork.com/wp-content/uploads/neon-pineapple-tree-coral-capnella-sp-300x300.jpg"
		},
		{
			"sid": "14103",
			"name": "Citron Goby",
			"sci": "Gobiodon citrinus",
			"slug": "citron-goby-gobiodon-citrinus",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/citron-goby-gobiodon-citrinus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/08/citron-goby-gobiodon-citrinus-300x300.jpg"
		},
		{
			"sid": "13331",
			"name": "Yellow Line Goby",
			"sci": "Elacatinus figaro",
			"slug": "yellow-line-goby-elacatinus-figaro",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/yellow-line-goby-elacatinus-figaro/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/08/yellow-line-goby-elacatinus-figaro-300x300.jpg"
		},
		{
			"sid": "11366",
			"name": "Electric Blue Hermit Crab",
			"sci": "Calcinus elegans",
			"slug": "electric-blue-hermit-crab-calcinus-elegans",
			"cat": "invert",
			"care": "easy",
			"url": "https://reefnetwork.com/electric-blue-hermit-crab-calcinus-elegans/",
			"img": "https://reefnetwork.com/wp-content/uploads/electric-blue-hermit-crab-calcinus-elegans-300x300.jpg"
		},
		{
			"sid": "9172",
			"name": "Red Head Goby",
			"sci": "Elacatinus puncticulatus",
			"slug": "red-head-goby-elacatinus-puncticulatus",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/red-head-goby-elacatinus-puncticulatus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/07/red-head-goby-elacatinus-puncticulatus-300x300.jpg"
		},
		{
			"sid": "9040",
			"name": "Tangaroa Goby",
			"sci": "Ctenogobiops tangaroai",
			"slug": "tangaroa-goby-ctenogobiops-tangaroai",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/tangaroa-goby-ctenogobiops-tangaroai/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/07/tangaroa-goby-ctenogobiops-tangaroai-300x300.jpg"
		},
		{
			"sid": "8651",
			"name": "Yellow Cardinalfish",
			"sci": "Ostorhinchus luteus",
			"slug": "yellow-cardinalfish-ostorhinchus-luteus",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/yellow-cardinalfish-ostorhinchus-luteus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/07/yellow-cardinalfish-ostorhinchus-luteus-300x300.jpg"
		},
		{
			"sid": "8130",
			"name": "Candy Basslet",
			"sci": "Liopropoma carmabi",
			"slug": "deepwater-candy-basslet-liopropoma-carmabi",
			"cat": "fish",
			"care": "expert-only",
			"url": "https://reefnetwork.com/deepwater-candy-basslet-liopropoma-carmabi/",
			"img": "https://reefnetwork.com/wp-content/uploads/deepwater-candy-basslet-liopropoma-carmabi-300x300.jpg"
		},
		{
			"sid": "7882",
			"name": "Sharknose Goby",
			"sci": "Elacatinus evelynae",
			"slug": "sharknose-goby-elacatinus-evelynae",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/sharknose-goby-elacatinus-evelynae/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/05/sharknose-goby-elacatinus-evelynae-300x300.jpg"
		},
		{
			"sid": "7775",
			"name": "Panamic Barnacle Blenny",
			"sci": "Acanthemblemaria hancocki",
			"slug": "panamic-barnacle-blenny",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/panamic-barnacle-blenny/",
			"img": "https://reefnetwork.com/wp-content/uploads/panamic-barnacle-blenny-300x300.jpg"
		},
		{
			"sid": "7679",
			"name": "Black Barred Convict Goby",
			"sci": "Priolepis nocturna",
			"slug": "black-barred-convict-goby-priolepis-nocturna",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/black-barred-convict-goby-priolepis-nocturna/",
			"img": "https://reefnetwork.com/wp-content/uploads/black-barred-convict-goby-black-barred-convict-goby-300x300.jpg"
		},
		{
			"sid": "7499",
			"name": "Broadstripe Goby",
			"sci": "Elacatinus prochilos",
			"slug": "broadstripe-goby-elacatinus-prochilos",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/broadstripe-goby-elacatinus-prochilos/",
			"img": "https://reefnetwork.com/wp-content/uploads/broadstripe-goby-elacatinus-prochilos-300x300.jpg"
		},
		{
			"sid": "7251",
			"name": "Allen’s Damselfish",
			"sci": "Pomacentrus alleni",
			"slug": "allens-damselfish-pomacentrus-alleni",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/allens-damselfish-pomacentrus-alleni/",
			"img": "https://reefnetwork.com/wp-content/uploads/allens-damselfish-pomacentrus-alleni-300x300.jpg"
		},
		{
			"sid": "6944",
			"name": "Speckled Damsel",
			"sci": "Pomacentrus bankanensis",
			"slug": "speckled-damsel-pomacentrus-bankanensis",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/speckled-damsel-pomacentrus-bankanensis/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/04/speckled-damsel-pomacentrus-bankanensis-300x300.jpg"
		},
		{
			"sid": "6729",
			"name": "Pink-Streaked Wrasse",
			"sci": "Pseudocheilinops ataenia",
			"slug": "pink-streaked-wrasse",
			"cat": "fish",
			"care": "difficult",
			"url": "https://reefnetwork.com/pink-streaked-wrasse/",
			"img": "https://reefnetwork.com/wp-content/uploads/pink-streaked-wrasse-300x300.jpg"
		},
		{
			"sid": "6532",
			"name": "Tail Spot Blenny",
			"sci": "Ecsenius stigmatura",
			"slug": "tail-spot-blenny-ecsenius-stigmatura",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/tail-spot-blenny-ecsenius-stigmatura/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/03/tail-spot-blenny-ecsenius-stigmatura-300x300.jpg"
		},
		{
			"sid": "6308",
			"name": "Ring-Eyed Dottyback",
			"sci": "Pseudoplesiops typus",
			"slug": "ring-eyed-dottyback-pseudoplesiops-typus",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/ring-eyed-dottyback-pseudoplesiops-typus/",
			"img": "https://reefnetwork.com/wp-content/uploads/ring-eyed-dottyback-300x300.jpg"
		},
		{
			"sid": "6157",
			"name": "Yellow Priolepis Goby",
			"sci": "Priolepis aureoviridis",
			"slug": "yellow-priolepis-goby",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/yellow-priolepis-goby/",
			"img": "https://reefnetwork.com/wp-content/uploads/yellow-priolepis-goby-300x300.jpg"
		},
		{
			"sid": "6036",
			"name": "Starry Goby",
			"sci": "Asterropteryx semipunctatus",
			"slug": "starry-goby-asterropteryx-semipunctatus",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/starry-goby-asterropteryx-semipunctatus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/02/starry-goby-asterropteryx-semipunctatus-300x300.jpg"
		},
		{
			"sid": "5973",
			"name": "Link’s Goby",
			"sci": "Amblygobius linki",
			"slug": "links-goby-amblygobius-linki",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/links-goby-amblygobius-linki/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/02/links-goby-amblygobius-linki-300x300.jpg"
		},
		{
			"sid": "5862",
			"name": "Mandarin Dragonet",
			"sci": "Synchiropus splendidus",
			"slug": "mandarin-dragonet-synchiropus-splendidus",
			"cat": "fish",
			"care": "difficult",
			"url": "https://reefnetwork.com/mandarin-dragonet-synchiropus-splendidus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/02/mandarin-dragonet-synchiropus-splendidus-300x300.jpg"
		},
		{
			"sid": "5728",
			"name": "Turban Snail",
			"sci": "Tectus fenestratus",
			"slug": "turban-snail-tectus-fenestratus",
			"cat": "invert",
			"care": "easy",
			"url": "https://reefnetwork.com/turban-snail-tectus-fenestratus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/01/turban-snail-tectus-fenestratus-300x300.jpg"
		},
		{
			"sid": "5568",
			"name": "Yasha Goby",
			"sci": "Stonogobiops yasha",
			"slug": "yasha-goby-stonogobiops-yasha",
			"cat": "fish",
			"care": "difficult",
			"url": "https://reefnetwork.com/yasha-goby-stonogobiops-yasha/",
			"img": "https://reefnetwork.com/wp-content/uploads/yasha-goby-stonogobiops-yasha-300x300.jpg"
		},
		{
			"sid": "5192",
			"name": "Rose Anthias",
			"sci": "Odontanthias katayamai",
			"slug": "rose-anthias-odontanthias-katayamai",
			"cat": "fish",
			"care": "expert-only",
			"url": "https://reefnetwork.com/rose-anthias-odontanthias-katayamai/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/01/rose-anthias-odontanthias-katayamai-300x300.jpg"
		},
		{
			"sid": "4873",
			"name": "Azure Damselfish",
			"sci": "Chrysiptera hemicyanea",
			"slug": "azure-damselfish-chrysiptera-hemicyanea",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/azure-damselfish-chrysiptera-hemicyanea/",
			"img": "https://reefnetwork.com/wp-content/uploads/azure-damselfish-chrysiptera-hemicyanea-300x300.jpg"
		}
	];
	if (typeof module === 'object' && module.exports) module.exports = list;
	else root.RK_DEMO_SPECIES = list;
})(this);
