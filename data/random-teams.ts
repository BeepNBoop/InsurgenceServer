/* eslint max-len: ["error", 240] */

import {Dex, toID} from '../sim/dex';
import {PRNG, PRNGSeed} from '../sim/prng';

export interface TeamData {
	typeCount: {[k: string]: number};
	typeComboCount: {[k: string]: number};
	baseFormes: {[k: string]: number};
	megaCount?: number;
	zCount?: number;
	has: {[k: string]: number};
	forceResult: boolean;
	weaknesses: {[k: string]: number};
	resistances: {[k: string]: number};
	weather?: string;
	eeveeLimCount?: number;
	gigantamax?: boolean;
}

export class RandomTeams {
	dex: ModdedDex;
	gen: number;
	factoryTier: string;
	format: Format;
	prng: PRNG;

	constructor(format: Format | string, prng: PRNG | PRNGSeed | null) {
		format = Dex.getFormat(format);
		this.dex = Dex.forFormat(format);
		this.gen = this.dex.gen;

		this.factoryTier = '';
		this.format = format;
		this.prng = prng && !Array.isArray(prng) ? prng : new PRNG(prng);
	}

	setSeed(prng?: PRNG | PRNGSeed) {
		this.prng = prng && !Array.isArray(prng) ? prng : new PRNG(prng);
	}

	getTeam(options?: PlayerOptions | null): PokemonSet[] {
		const generatorName = typeof this.format.team === 'string' && this.format.team.startsWith('random') ? this.format.team + 'Team' : '';
		// @ts-ignore
		return this[generatorName || 'randomTeam'](options);
	}

	randomChance(numerator: number, denominator: number) {
		return this.prng.randomChance(numerator, denominator);
	}

	sample<T>(items: readonly T[]): T {
		return this.prng.sample(items);
	}

	random(m?: number, n?: number) {
		return this.prng.next(m, n);
	}

	/**
	 * Remove an element from an unsorted array significantly faster
	 * than .splice
	 */
	fastPop(list: any[], index: number) {
		// If an array doesn't need to be in order, replacing the
		// element at the given index with the removed element
		// is much, much faster than using list.splice(index, 1).
		const length = list.length;
		const element = list[index];
		list[index] = list[length - 1];
		list.pop();
		return element;
	}

	/**
	 * Remove a random element from an unsorted array and return it.
	 * Uses the battle's RNG if in a battle.
	 */
	sampleNoReplace(list: any[]) {
		const length = list.length;
		const index = this.random(length);
		return this.fastPop(list, index);
	}

	// checkAbilities(selectedAbilities, defaultAbilities) {
	// 	if (!selectedAbilities.length) return true;
	// 	const selectedAbility = selectedAbilities.pop();
	// 	const isValid = false;
	// 	for (const i = 0; i < defaultAbilities.length; i++) {
	// 		const defaultAbility = defaultAbilities[i];
	// 		if (!defaultAbility) break;
	// 		if (defaultAbility.includes(selectedAbility)) {
	// 			defaultAbilities.splice(i, 1);
	// 			isValid = this.checkAbilities(selectedAbilities, defaultAbilities);
	// 			if (isValid) break;
	// 			defaultAbilities.splice(i, 0, defaultAbility);
	// 		}
	// 	}
	// 	if (!isValid) selectedAbilities.push(selectedAbility);
	// 	return isValid;
	// }
	// hasMegaEvo(species) {
	// 	if (!species.otherFormes) return false;
	// 	const firstForme = this.dex.getSpecies(species.otherFormes[0]);
	// 	return !!firstForme.isMega;
	// }
	randomCCTeam(): RandomTeamsTypes.RandomSet[] {
		const dex = this.dex;
		const team = [];

		const natures = Object.keys(this.dex.data.Natures);
		const items = Object.keys(this.dex.data.Items);

		const random6 = this.random6Pokemon();

		for (let i = 0; i < 6; i++) {
			let forme = random6[i];
			let species = dex.getSpecies(forme);
			if (species.isNonstandard) species = dex.getSpecies(species.baseSpecies);

			// Random legal item
			let item = '';
			if (this.gen >= 2) {
				do {
					item = this.sample(items);
				} while (this.dex.getItem(item).gen > this.gen || this.dex.data.Items[item].isNonstandard);
			}

			// Make sure forme is legal
			if (species.battleOnly) {
				if (typeof species.battleOnly === 'string') {
					species = dex.getSpecies(species.battleOnly);
				} else {
					species = dex.getSpecies(this.sample(species.battleOnly));
				}
				forme = species.name;
			} else if (species.requiredItems && !species.requiredItems.some(req => toID(req) === item)) {
				if (!species.changesFrom) throw new Error(`${species.name} needs a changesFrom value`);
				species = dex.getSpecies(species.changesFrom);
				forme = species.name;
			}

			// Make sure that a base forme does not hold any forme-modifier items.
			let itemData = this.dex.getItem(item);
			if (itemData.forcedForme && forme === this.dex.getSpecies(itemData.forcedForme).baseSpecies) {
				do {
					item = this.sample(items);
					itemData = this.dex.getItem(item);
				} while (itemData.gen > this.gen || itemData.isNonstandard || itemData.forcedForme && forme === this.dex.getSpecies(itemData.forcedForme).baseSpecies);
			}

			// Random legal ability
			const abilities = Object.values(species.abilities).filter(a => this.dex.getAbility(a).gen <= this.gen);
			const ability: string = this.gen <= 2 ? 'None' : this.sample(abilities);

			// Four random unique moves from the movepool
			let moves;
			let pool = ['struggle'];
			if (forme === 'Smeargle') {
				pool = Object.keys(this.dex.data.Moves).filter(moveid => {
					const move = this.dex.data.Moves[moveid];
					return !(move.isNonstandard || move.isZ || move.isMax || move.realMove);
				});
			} else {
				let learnset = this.dex.data.Learnsets[species.id] && this.dex.data.Learnsets[species.id].learnset && !['gastrodoneast', 'pumpkaboosuper', 'zygarde10'].includes(species.id) ?
					this.dex.data.Learnsets[species.id].learnset :
					this.dex.data.Learnsets[this.dex.getSpecies(species.baseSpecies).id].learnset;
				if (learnset) {
					pool = Object.keys(learnset).filter(
						moveid => learnset![moveid].find(learned => learned.startsWith(String(this.gen)))
					);
				}
				if (species.changesFrom) {
					learnset = this.dex.data.Learnsets[toID(species.changesFrom)].learnset;
					const basePool = Object.keys(learnset!).filter(
						moveid => learnset![moveid].find(learned => learned.startsWith(String(this.gen)))
					);
					pool = [...new Set(pool.concat(basePool))];
				}
			}
			if (pool.length <= 4) {
				moves = pool;
			} else {
				moves = [this.sampleNoReplace(pool), this.sampleNoReplace(pool), this.sampleNoReplace(pool), this.sampleNoReplace(pool)];
			}

			// Random EVs
			const evs: StatsTable = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
			const s: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];
			let evpool = 510;
			do {
				const x = this.sample(s);
				const y = this.random(Math.min(256 - evs[x], evpool + 1));
				evs[x] += y;
				evpool -= y;
			} while (evpool > 0);

			// Random IVs
			const ivs = {hp: this.random(32), atk: this.random(32), def: this.random(32), spa: this.random(32), spd: this.random(32), spe: this.random(32)};

			// Random nature
			const nature = this.sample(natures);

			// Level balance--calculate directly from stats rather than using some silly lookup table
			const mbstmin = 1307; // Sunkern has the lowest modified base stat total, and that total is 807

			let stats = species.baseStats;
			// If Wishiwashi, use the school-forme's much higher stats
			if (species.baseSpecies === 'Wishiwashi') stats = Dex.getSpecies('wishiwashischool').baseStats;

			// Modified base stat total assumes 31 IVs, 85 EVs in every stat
			let mbst = (stats["hp"] * 2 + 31 + 21 + 100) + 10;
			mbst += (stats["atk"] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats["def"] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats["spa"] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats["spd"] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats["spe"] * 2 + 31 + 21 + 100) + 5;

			let level = Math.floor(100 * mbstmin / mbst); // Initial level guess will underestimate

			while (level < 100) {
				mbst = Math.floor((stats["hp"] * 2 + 31 + 21 + 100) * level / 100 + 10);
				mbst += Math.floor(((stats["atk"] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100); // Since damage is roughly proportional to level
				mbst += Math.floor((stats["def"] * 2 + 31 + 21 + 100) * level / 100 + 5);
				mbst += Math.floor(((stats["spa"] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
				mbst += Math.floor((stats["spd"] * 2 + 31 + 21 + 100) * level / 100 + 5);
				mbst += Math.floor((stats["spe"] * 2 + 31 + 21 + 100) * level / 100 + 5);

				if (mbst >= mbstmin) break;
				level++;
			}

			// Random happiness
			const happiness = this.random(256);

			// Random shininess
			const shiny = this.randomChance(1, 500);

			team.push({
				name: species.baseSpecies,
				species: species.name,
				gender: species.gender,
				item: item,
				ability: ability,
				moves: moves,
				evs: evs,
				ivs: ivs,
				nature: nature,
				level: level,
				happiness: happiness,
				shiny: shiny,
			});
		}

		return team;
	}

	random6Pokemon() {
		// Pick six random pokemon--no repeats, even among formes
		// Also need to either normalize for formes or select formes at random
		// Unreleased are okay but no CAP
		const last = [0, 151, 251, 386, 493, 649, 721, 807, 890][this.gen];

		const pool: number[] = [];
		for (const id in this.dex.data.FormatsData) {
			if (!this.dex.data.Pokedex[id] || this.dex.data.FormatsData[id].isNonstandard && this.dex.data.FormatsData[id].isNonstandard !== 'Unobtainable') continue;
			const num = this.dex.data.Pokedex[id].num;
			if (num <= 0 || pool.includes(num)) continue;
			if (num > last) break;
			pool.push(num);
		}

		const hasDexNumber: {[k: string]: number} = {};
		for (let i = 0; i < 6; i++) {
			const num = this.sampleNoReplace(pool);
			hasDexNumber[num] = i;
		}

		const formes: string[][] = [[], [], [], [], [], []];
		for (const id in this.dex.data.Pokedex) {
			if (!(this.dex.data.Pokedex[id].num in hasDexNumber)) continue;
			const species = this.dex.getSpecies(id);
			if (species.gen <= this.gen && (!species.isNonstandard || species.isNonstandard === 'Unobtainable')) {
				formes[hasDexNumber[species.num]].push(species.name);
			}
		}

		const sixPokemon = [];
		for (let i = 0; i < 6; i++) {
			if (!formes[i].length) {
				throw new Error("Invalid pokemon gen " + this.gen + ": " + JSON.stringify(formes) + " numbers " + JSON.stringify(hasDexNumber));
			}
			sixPokemon.push(this.sample(formes[i]));
		}
		return sixPokemon;
	}

	randomHCTeam(): PokemonSet[] {
		const team = [];

		const itemPool = Object.keys(this.dex.data.Items);
		const abilityPool = Object.keys(this.dex.data.Abilities);
		const movePool = Object.keys(this.dex.data.Moves);
		const naturePool = Object.keys(this.dex.data.Natures);

		const random6 = this.random6Pokemon();

		for (let i = 0; i < 6; i++) {
			// Choose forme
			const species = this.dex.getSpecies(random6[i]);

			// Random unique item
			let item = '';
			if (this.gen >= 2) {
				do {
					item = this.sampleNoReplace(itemPool);
				} while (this.dex.getItem(item).gen > this.gen || this.dex.data.Items[item].isNonstandard);
			}

			// Random unique ability
			let ability = 'None';
			if (this.gen >= 3) {
				do {
					ability = this.sampleNoReplace(abilityPool);
				} while (this.dex.getAbility(ability).gen > this.gen || this.dex.data.Abilities[ability].isNonstandard);
			}

			// Random unique moves
			const m = [];
			do {
				const moveid = this.sampleNoReplace(movePool);
				const move = this.dex.getMove(moveid);
				if (move.gen <= this.gen && !move.isNonstandard && !move.name.startsWith('Hidden Power ')) {
					m.push(moveid);
				}
			} while (m.length < 4);

			// Random EVs
			const evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
			const s: StatName[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
			if (this.gen === 6) {
				let evpool = 510;
				do {
					const x = this.sample(s);
					const y = this.random(Math.min(256 - evs[x], evpool + 1));
					evs[x] += y;
					evpool -= y;
				} while (evpool > 0);
			} else {
				for (const x of s) {
					evs[x] = this.random(256);
				}
			}

			// Random IVs
			const ivs: StatsTable = {
				hp: this.random(32),
				atk: this.random(32),
				def: this.random(32),
				spa: this.random(32),
				spd: this.random(32),
				spe: this.random(32),
			};

			// Random nature
			const nature = this.sample(naturePool);

			// Level balance
			const mbstmin = 1307;
			const stats = species.baseStats;
			let mbst = (stats['hp'] * 2 + 31 + 21 + 100) + 10;
			mbst += (stats['atk'] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats['def'] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats['spa'] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats['spd'] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats['spe'] * 2 + 31 + 21 + 100) + 5;
			let level = Math.floor(100 * mbstmin / mbst);
			while (level < 100) {
				mbst = Math.floor((stats['hp'] * 2 + 31 + 21 + 100) * level / 100 + 10);
				mbst += Math.floor(((stats['atk'] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
				mbst += Math.floor((stats['def'] * 2 + 31 + 21 + 100) * level / 100 + 5);
				mbst += Math.floor(((stats['spa'] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
				mbst += Math.floor((stats['spd'] * 2 + 31 + 21 + 100) * level / 100 + 5);
				mbst += Math.floor((stats['spe'] * 2 + 31 + 21 + 100) * level / 100 + 5);
				if (mbst >= mbstmin) break;
				level++;
			}

			// Random happiness
			const happiness = this.random(256);

			// Random shininess
			const shiny = this.randomChance(1, 1024);

			team.push({
				name: species.baseSpecies,
				species: species.name,
				gender: species.gender,
				item: item,
				ability: ability,
				moves: m,
				evs: evs,
				ivs: ivs,
				nature: nature,
				level: level,
				happiness: happiness,
				shiny: shiny,
			});
		}

		return team;
	}

	queryMoves(moves: string[] | null, hasType: {[k: string]: boolean} = {}, hasAbility: {[k: string]: boolean} = {}, movePool: string[] = []) {
		// This is primarily a helper function for random setbuilder functions.
		const counter: {[k: string]: any} = {
			Physical: 0, Special: 0, Status: 0, damage: 0, recovery: 0, stab: 0, inaccurate: 0, priority: 0, recoil: 0, drain: 0, sound: 0,
			contrary: 0, ironfist: 0, serenegrace: 0, sheerforce: 0, skilllink: 0, strongjaw: 0, technician: 0,
			physicalsetup: 0, specialsetup: 0, mixedsetup: 0, speedsetup: 0, physicalpool: 0, specialpool: 0, hazards: 0,
			damagingMoves: [],
			setupType: '',
			Bug: 0, Dark: 0, Dragon: 0, Electric: 0, Fairy: 0, Fighting: 0, Fire: 0, Flying: 0, Ghost: 0, Grass: 0, Ground: 0,
			Ice: 0, Normal: 0, Poison: 0, Psychic: 0, Rock: 0, Steel: 0, Water: 0,
		};

		let typeDef: string;
		for (typeDef in this.dex.data.TypeChart) {
			counter[typeDef] = 0;
		}

		if (!moves || !moves.length) return counter;

		// Moves that restore HP:
		const RecoveryMove = [
			'healorder', 'milkdrink', 'moonlight', 'morningsun', 'recover', 'roost', 'shoreup', 'slackoff', 'softboiled', 'strengthsap', 'synthesis',
		];
		// Moves which drop stats:
		const ContraryMove = [
			'closecombat', 'leafstorm', 'overheat', 'superpower', 'vcreate',
		];
		// Moves that boost Attack:
		const PhysicalSetup = [
			'bellydrum', 'bulkup', 'coil', 'curse', 'dragondance', 'honeclaws', 'howl', 'poweruppunch', 'swordsdance',
		];
		// Moves which boost Special Attack:
		const SpecialSetup = [
			'calmmind', 'chargebeam', 'geomancy', 'nastyplot', 'quiverdance', 'tailglow',
		];
		// Moves which boost Attack AND Special Attack:
		const MixedSetup = [
			'clangoroussoul', 'growth', 'happyhour', 'holdhands', 'noretreat', 'shellsmash', 'workup',
		];
		// Moves which boost Speed:
		const SpeedSetup = [
			'agility', 'autotomize', 'flamecharge', 'rockpolish', 'shiftgear', 'tailwind'
		];
		// Moves that shouldn't be the only STAB moves:
		const NoStab = [
			'accelerock', 'aquajet', 'beakblast', 'bounce', 'breakingswipe', 'explosion', 'fakeout', 'firstimpression', 'flamecharge',
			'flipturn', 'iceshard', 'machpunch', 'pluck', 'pursuit', 'quickattack', 'selfdestruct', 'skydrop', 'suckerpunch', 'watershuriken',

			'chatter', 'clearsmog', 'eruption', 'icywind', 'incinerate', 'meteorbeam', 'snarl', 'vacuumwave', 'voltswitch', 'waterspout',
		];

		// Iterate through all moves we've chosen so far and keep track of what they do:
		for (const moveId of moves) {
			let move = this.dex.getMove(moveId);
			if (move.id === 'naturepower') {
				if (this.gen === 5) move = this.dex.getMove('earthquake');
			}
			const moveid = move.id;
			let movetype = move.type;
			if (['judgment', 'multiattack', 'revelationdance'].includes(moveid)) movetype = Object.keys(hasType)[0];
			if (move.damage || move.damageCallback) {
				// Moves that do a set amount of damage:
				counter['damage']++;
				counter.damagingMoves.push(move);
			} else {
				// Are Physical/Special/Status moves:
				counter[move.category]++;
			}
			// Moves that have a low base power:
			if (moveid === 'lowkick' || (move.basePower && move.basePower <= 60 && moveid !== 'rapidspin')) counter['technician']++;
			// Moves that hit up to 5 times:
			if (move.multihit && Array.isArray(move.multihit) && move.multihit[1] === 5) counter['skilllink']++;
			if (move.recoil || move.hasCrashDamage) counter['recoil']++;
			if (move.drain) counter['drain']++;
			// Moves which have a base power, but aren't super-weak like Rapid Spin:
			if (move.basePower > 30 || move.multihit || move.basePowerCallback || moveid === 'infestation') {
				counter[movetype]++;
				if (hasType[movetype]) {
					// STAB:
					// Certain moves aren't acceptable as a Pokemon's only STAB attack
					if (!NoStab.includes(moveid) && (moveid !== 'hiddenpower' || Object.keys(hasType).length === 1)) {
						counter['stab']++;
						// Ties between Physical and Special setup should broken in favor of STABs
						counter[move.category] += 0.1;
					}
				} else if (movetype === 'Normal' && (hasAbility['Aerilate'] || hasAbility['Galvanize'] || hasAbility['Pixilate'] || hasAbility['Refrigerate'])) {
					counter['stab']++;
				} else if (move.priority === 0 && (hasAbility['Libero'] || hasAbility['Protean']) && !NoStab.includes(moveid)) {
					counter['stab']++;
				} else if (movetype === 'Steel' && hasAbility['Steelworker']) {
					counter['stab']++;
				}
				if (move.flags['bite']) counter['strongjaw']++;
				if (move.flags['punch']) counter['ironfist']++;
				if (move.flags['sound']) counter['sound']++;
				if (move.priority !== 0 || (moveid === 'grassyglide' && hasAbility['Grassy Surge'])) {
					counter['priority']++;
				}
				counter.damagingMoves.push(move);
			}
			// Moves with secondary effects:
			if (move.secondary) {
				counter['sheerforce']++;
				if (move.secondary.chance && move.secondary.chance >= 20 && move.secondary.chance < 100) {
					counter['serenegrace']++;
				}
			}
			// Moves with low accuracy:
			if (move.accuracy && move.accuracy !== true && move.accuracy < 90) counter['inaccurate']++;

			// Moves that change stats:
			if (RecoveryMove.includes(moveid)) counter['recovery']++;
			if (ContraryMove.includes(moveid)) counter['contrary']++;
			if (PhysicalSetup.includes(moveid)) {
				counter['physicalsetup']++;
				counter.setupType = 'Physical';
			} else if (SpecialSetup.includes(moveid)) {
				counter['specialsetup']++;
				counter.setupType = 'Special';
			}
			if (MixedSetup.includes(moveid)) counter['mixedsetup']++;
			if (SpeedSetup.includes(moveid)) counter['speedsetup']++;
			if (['spikes', 'stealthrock', 'stickyweb', 'toxicspikes', 'livewire', 'permafrost'].includes(moveid)) counter['hazards']++;
		}

		// Keep track of the available moves
		for (const moveid of movePool) {
			const move = this.dex.getMove(moveid);
			if (move.damageCallback) continue;
			if (move.category === 'Physical') counter['physicalpool']++;
			if (move.category === 'Special') counter['specialpool']++;
		}

		// Choose a setup type:
		if (counter['mixedsetup']) {
			counter.setupType = 'Mixed';
		} else if (counter['physicalsetup'] && counter['specialsetup']) {
			const pool = {
				Physical: counter.Physical + counter['physicalpool'],
				Special: counter.Special + counter['specialpool'],
			};
			if (pool.Physical === pool.Special) {
				if (counter.Physical > counter.Special) counter.setupType = 'Physical';
				if (counter.Special > counter.Physical) counter.setupType = 'Special';
			} else {
				counter.setupType = pool.Physical > pool.Special ? 'Physical' : 'Special';
			}
		} else if (counter.setupType === 'Physical') {
			if ((counter.Physical < 2 && (!counter.stab || !counter['physicalpool'])) && (!moves.includes('rest') || !moves.includes('sleeptalk'))) {
				counter.setupType = '';
			}
		} else if (counter.setupType === 'Special') {
			if ((counter.Special < 2 && (!counter.stab || !counter['specialpool'])) && (!moves.includes('rest') || !moves.includes('sleeptalk')) && (!moves.includes('wish') || !moves.includes('protect'))) {
				counter.setupType = '';
			}
		}

		counter['Physical'] = Math.floor(counter['Physical']);
		counter['Special'] = Math.floor(counter['Special']);

		return counter;
	}

	randomSet(species: string | Species, teamDetails: RandomTeamsTypes.TeamDetails = {}, isLead = false, isDoubles = false): RandomTeamsTypes.RandomSet {
		species = this.dex.getSpecies(species);
		let forme = species.name;
		let gmax = false;

		if (typeof species.battleOnly === 'string') {
			// Only change the forme. The species has custom moves, and may have different typing and requirements.
			forme = species.battleOnly;
		}
		if (species.cosmeticFormes) {
			forme = this.sample([species.name].concat(species.cosmeticFormes));
		}
		if (species.name.endsWith('-Gmax')) {
			forme = species.name.slice(0, -5);
			gmax = true;
		}

		const randMoves = !isDoubles ? species.randomBattleMoves : (species.randomDoubleBattleMoves || species.randomBattleMoves);
		const movePool = (randMoves || Object.keys(this.dex.data.Learnsets[species.id]!.learnset!)).slice();
		const rejectedPool = [];
		const moves: string[] = [];
		let ability = '';
		let item = '';
		const evs = {
			hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85,
		};
		const ivs = {
			hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31,
		};
		const hasType: {[k: string]: true} = {};
		hasType[species.types[0]] = true;
		if (species.types[1]) {
			hasType[species.types[1]] = true;
		}
		const hasAbility: {[k: string]: true} = {};
		hasAbility[species.abilities[0]] = true;
		if (species.abilities[1]) {
			hasAbility[species.abilities[1]] = true;
		}
		if (species.abilities['H']) {
			hasAbility[species.abilities['H']] = true;
		}

		let hasMove: {[k: string]: boolean} = {};
		let counter;

		do {
			// Keep track of all moves we have:
			hasMove = {};
			for (const moveid of moves) {
				hasMove[moveid] = true;
			}

			// Choose next 4 moves from learnset/viable moves and add them to moves list:
			const pool = (movePool.length ? movePool : rejectedPool);
			while (moves.length < 4 && pool.length) {
				const moveid = this.sampleNoReplace(pool);
				hasMove[moveid] = true;
				moves.push(moveid);
			}

			counter = this.queryMoves(moves, hasType, hasAbility, movePool);

			// Iterate through the moves again, this time to cull them:
			for (const [k, moveId] of moves.entries()) {
				const move = this.dex.getMove(moveId);
				const moveid = move.id;
				let rejected = false;
				let isSetup = false;

				switch (moveid) {
				// Not very useful without their supporting moves
				case 'lunarcannon':
					if (!hasAbility['noctem'] && ['lunatone'].includes(species.id)) rejected = true;
					break;
				case 'flareblitz':
					if (!hasAbility['drought'] && ['solrock'].includes(species.id)) rejected = true;
					break;
				case 'acrobatics': case 'junglehealing':
					if (!counter.setupType && !isDoubles) rejected = true;
					break;
				case 'destinybond': case 'healbell':
					if (movePool.includes('protect') || movePool.includes('wish')) rejected = true;
					break;
				case 'dualwingbeat': case 'fly': case 'storedpower':
					if (!hasType[move.type] && !counter.setupType && !!counter.Status) rejected = true;
					break;
				case 'fireblast':
					if (hasAbility['Serene Grace'] && (!hasMove['trick'] || counter.Status > 1)) rejected = true;
					break;
				case 'firepunch':
					if (movePool.includes('bellydrum') || hasMove['earthquake'] && movePool.includes('substitute')) rejected = true;
					break;
				case 'flamecharge': case 'sacredsword':
					if (counter.damagingMoves.length < 3 && !counter.setupType) rejected = true;
					if (!hasType['Grass'] && movePool.includes('swordsdance')) rejected = true;
					break;
				case 'hypervoice':
					if (hasType['Electric'] && movePool.includes('thunderbolt')) rejected = true;
					break;
				case 'payback': case 'psychocut':
					if (!counter.Status || hasMove['rest'] && hasMove['sleeptalk']) rejected = true;
					break;
				case 'rest':
					if (movePool.includes('sleeptalk')) rejected = true;
					if (!hasMove['sleeptalk'] && (movePool.includes('bulkup') || movePool.includes('calmmind') || movePool.includes('coil') || movePool.includes('curse'))) rejected = true;
					break;
				case 'sleeptalk':
					if (!hasMove['rest']) rejected = true;
					if (movePool.length > 1 && !hasAbility['Contrary']) {
						const rest = movePool.indexOf('rest');
						if (rest >= 0) this.fastPop(movePool, rest);
					}
					break;
				case 'switcheroo': case 'trick':
					if (counter.Physical + counter.Special < 3 || hasMove['rapidspin']) rejected = true;
					break;
				case 'trickroom':
					if (counter.damagingMoves.length < 2 || movePool.includes('nastyplot') || isLead || teamDetails.stickyWeb) rejected = true;
					break;
				case 'zenheadbutt':
					if (movePool.includes('boltstrike')) rejected = true;
					break;

				// Set up once and only if we have the moves for it
				case 'bellydrum': case 'bulkup': case 'coil': case 'curse': case 'dragondance': case 'honeclaws': case 'swordsdance':
					if (counter.setupType !== 'Physical') rejected = true;
					if (counter.Physical + counter['physicalpool'] < 2 && (!hasMove['rest'] || !hasMove['sleeptalk'])) rejected = true;
					if (moveid === 'swordsdance' && hasMove['dragondance']) rejected = true;
					isSetup = true;
					break;
				case 'calmmind': case 'nastyplot':
					if (counter.setupType !== 'Special') rejected = true;
					if (counter.Special + counter['specialpool'] < 2 && (!hasMove['rest'] || !hasMove['sleeptalk']) && (!hasMove['wish'] || !hasMove['protect'])) rejected = true;
					if (hasMove['healpulse'] || moveid === 'calmmind' && hasMove['trickroom']) rejected = true;
					isSetup = true;
					break;
				case 'quiverdance':
					isSetup = true;
					break;
				case 'clangoroussoul': case 'shellsmash': case 'workup':
					if (counter.setupType !== 'Mixed') rejected = true;
					if (counter.damagingMoves.length + counter['physicalpool'] + counter['specialpool'] < 2) rejected = true;
					isSetup = true;
					break;
				case 'agility': case 'autotomize': case 'rockpolish': case 'shiftgear':
					if (counter.damagingMoves.length < 2 || hasMove['rest']) rejected = true;
					if (movePool.includes('calmmind') || movePool.includes('nastyplot')) rejected = true;
					if (!counter.setupType) isSetup = true;
					break;

				// Bad after setup
				case 'counter': case 'reversal':
					if (counter.setupType) rejected = true;
					break;
				case 'firstimpression': case 'glare': case 'icywind': case 'waterspout':
					if ((counter.setupType && !isDoubles) || !!counter['speedsetup'] || hasMove['rest']) rejected = true;
					break;
				case 'bulletpunch': case 'extremespeed': case 'rockblast':
					if (!!counter['speedsetup'] || counter.damagingMoves.length < 2) rejected = true;
					break;
				case 'closecombat': case 'flashcannon': case 'pollenpuff':
					if ((hasMove['substitute'] && !hasType['Fighting']) || hasMove['toxic'] && movePool.includes('substitute')) rejected = true;
					if (moveid === 'closecombat' && (hasMove['highjumpkick'] || movePool.includes('highjumpkick')) && !counter.setupType) rejected = true;
					break;
				case 'defog':
					if (counter.setupType || hasMove['healbell'] || hasMove['toxicspikes'] || teamDetails.defog) rejected = true;
					break;
				case 'fakeout':
					if (counter.setupType || hasMove['protect'] || hasMove['rapidspin'] || hasMove['substitute'] || hasMove['uturn']) rejected = true;
					break;
				case 'healingwish': case 'memento':
					if (counter.setupType || !!counter['recovery'] || hasMove['substitute'] || hasMove['uturn']) rejected = true;
					break;
				case 'highjumpkick': case 'machpunch':
					if (hasMove['curse']) rejected = true;
					break;
				case 'partingshot':
					if (!!counter['speedsetup'] || hasMove['bulkup'] || hasMove['uturn']) rejected = true;
					break;
				case 'protect':
					if ((counter.setupType && !hasMove['wish'] && !isDoubles) || hasMove['rest'] && hasMove['sleeptalk']) rejected = true;
					if (counter.Status < 2 && !hasAbility['Hunger Switch'] && !hasAbility['Speed Boost'] && !isDoubles) rejected = true;
					if (movePool.includes('leechseed') || movePool.includes('toxic') && !hasMove['wish']) rejected = true;
					if (isDoubles && (movePool.includes('fakeout') || movePool.includes('shellsmash') || movePool.includes('spore') || hasMove['tailwind'] || hasMove['waterspout'])) rejected = true;
					break;
				case 'rapidspin':
					if (hasMove['curse'] || hasMove['nastyplot'] || hasMove['shellsmash'] || teamDetails.rapidSpin) rejected = true;
					if (counter.setupType && counter['Fighting'] >= 2) rejected = true;
					break;
				case 'shadowsneak':
					if (hasMove['substitute'] || hasMove['trickroom']) rejected = true;
					if (hasMove['dualwingbeat'] || hasMove['toxic'] || hasMove['rest'] && hasMove['sleeptalk']) rejected = true;
					break;
				case 'spikes':
					if (counter.setupType || teamDetails.spikes && teamDetails.spikes > 1) rejected = true;
					break;
				case 'stealthrock':
					if (counter.setupType || !!counter['speedsetup'] || hasMove['rest'] || hasMove['substitute'] || hasMove['trickroom'] || teamDetails.stealthRock) rejected = true;
					break;
				case 'stickyweb':
					if (counter.setupType === 'Special' || teamDetails.stickyWeb) rejected = true;
					break;
				case 'taunt':
					if (hasMove['nastyplot'] || hasMove['swordsdance']) rejected = true;
					break;
				case 'thunderwave': case 'voltswitch':
					if (counter.setupType || !!counter['speedsetup'] || hasMove['raindance']) rejected = true;
					if (isDoubles && (hasMove['electroweb'] || hasMove['nuzzle'])) rejected = true;
					break;
				case 'toxic':
					if (counter.setupType || hasMove['sludgewave'] || hasMove['thunderwave'] || hasMove['willowisp']) rejected = true;
					break;
				case 'toxicspikes':
					if (counter.setupType || teamDetails.toxicSpikes) rejected = true;
					break;
				case 'uturn':
					if (!!counter['speedsetup'] || (counter.setupType && (!hasType['Bug'] || !counter.recovery))) rejected = true;
					if (isDoubles && hasMove['leechlife']) rejected = true;
					break;

				// Ineffective having both
				// Attacks:
				case 'explosion':
					if (!!counter['recovery'] || hasMove['painsplit'] || hasMove['wish']) rejected = true;
					if (!!counter['speedsetup'] || hasMove['curse'] || hasMove['drainpunch'] || hasMove['rockblast']) rejected = true;
					break;
				case 'facade':
					if (!!counter['recovery'] || movePool.includes('doubleedge')) rejected = true;
					break;
				case 'quickattack':
					if (!!counter['speedsetup'] || hasType['Rock'] && !!counter.Status) rejected = true;
					if (counter.Physical > 3 && movePool.includes('uturn')) rejected = true;
					break;
				case 'blazekick':
					if (counter.Special >= 1) rejected = true;
					break;
				case 'firefang': case 'flamethrower':
					if (hasMove['heatwave'] || hasMove['overheat'] || hasMove['fireblast'] && counter.setupType !== 'Physical') rejected = true;
					break;
				case 'overheat':
					if (hasMove['flareblitz'] || isDoubles && hasMove['calmmind']) rejected = true;
					break;
				case 'aquajet': case 'psychicfangs':
					if (hasMove['rapidspin'] || hasMove['taunt']) rejected = true;
					break;
				case 'aquatail': case 'flipturn': case 'retaliate':
					if (hasMove['aquajet'] || !!counter.Status) rejected = true;
					break;
				case 'hydropump':
					if (hasMove['scald'] && ((counter.Special < 4 && !hasMove['uturn']) || (species.types.length > 1 && counter.stab < 3))) rejected = true;
					break;
				case 'scald':
					if (hasMove['waterpulse']) rejected = true;
					break;
				case 'thunderbolt':
					if (hasMove['powerwhip']) rejected = true;
					break;
				case 'gigadrain':
					if ((!counter.setupType && hasMove['uturn']) || hasType['Poison'] && !counter['Poison']) rejected = true;
					break;
				case 'leafblade':
					if ((hasMove['leafstorm'] || movePool.includes('leafstorm')) && counter.setupType !== 'Physical') rejected = true;
					break;
				case 'leafstorm':
					if (hasMove['gigadrain'] && !!counter.Status) rejected = true;
					if (isDoubles && hasMove['energyball']) rejected = true;
					break;
				case 'powerwhip':
					if (hasMove['leechlife'] || !hasType['Grass'] && counter.Physical > 3 && movePool.includes('uturn')) rejected = true;
					break;
				case 'woodhammer':
					if (hasMove['hornleech'] && counter.Physical < 4) rejected = true;
					break;
				case 'freezedry':
					if ((hasMove['blizzard'] && counter.setupType) || hasMove['icebeam'] && counter.Special < 4) rejected = true;
					if (movePool.includes('bodyslam') || movePool.includes('thunderwave') && hasType['Electric']) rejected = true;
					break;
				case 'bodypress':
					if (hasMove['mirrorcoat'] || hasMove['whirlwind']) rejected = true;
					if (hasMove['shellsmash'] || hasMove['earthquake'] && movePool.includes('shellsmash')) rejected = true;
					break;
				case 'circlethrow':
					if (hasMove['stormthrow'] && !hasMove['rest']) rejected = true;
					break;
				case 'drainpunch':
					if (hasMove['closecombat'] || !hasType['Fighting'] && movePool.includes('swordsdance')) rejected = true;
					break;
				case 'dynamicpunch': case 'thunderouskick':
					if (hasMove['closecombat'] || hasMove['facade']) rejected = true;
					break;
				case 'focusblast':
					if (movePool.includes('shellsmash') || hasMove['rest'] && hasMove['sleeptalk']) rejected = true;
					break;
				case 'hammerarm':
					if (hasMove['fakeout']) rejected = true;
					break;
				case 'stormthrow':
					if (hasMove['rest'] && hasMove['sleeptalk']) rejected = true;
					break;
				case 'superpower':
					if (hasMove['hydropump'] || counter.Physical >= 4 && movePool.includes('uturn')) rejected = true;
					if (hasMove['substitute'] && !hasAbility['Contrary']) rejected = true;
					if (hasAbility['Contrary']) isSetup = true;
					break;
				case 'poisonjab':
					if (!hasType['Poison'] && counter.Status >= 2) rejected = true;
					break;
				case 'earthquake':
					if (hasMove['bonemerang'] || hasMove['substitute'] && movePool.includes('toxic')) rejected = true;
					if (movePool.includes('bodypress') && movePool.includes('shellsmash')) rejected = true;
					if (isDoubles && (hasMove['earthpower'] || hasMove['highhorsepower'])) rejected = true;
					break;
				case 'scorchingsands':
					if (hasMove['earthpower'] || hasMove['toxic'] && movePool.includes('earthpower')) rejected = true;
					if (hasMove['willowisp']) rejected = true;
					break;
				case 'airslash':
					if ((hasMove['hurricane'] && !counter.setupType) || hasMove['rest'] && hasMove['sleeptalk']) rejected = true;
					if (movePool.includes('flamethrower') || hasAbility['Simple'] && !!counter['recovery']) rejected = true;
					break;
				case 'bravebird':
					if (hasMove['dragondance']) rejected = true;
					break;
				case 'hurricane':
					if (hasAbility['Tinted Lens'] && counter.setupType && !isDoubles) rejected = true;
					break;
				case 'futuresight':
					if (hasMove['psyshock'] || hasMove['trick'] || movePool.includes('teleport')) rejected = true;
					break;
				case 'photongeyser':
					if (hasMove['morningsun']) rejected = true;
					break;
				case 'psychic':
					if (hasMove['psyshock'] && (counter.setupType || isDoubles)) rejected = true;
					break;
				case 'psyshock':
					if ((hasMove['psychic'] || hasAbility['Pixilate']) && counter.Special < 4 && !counter.setupType) rejected = true;
					if (hasAbility['Multiscale'] && !counter.setupType) rejected = true;
					if (isDoubles && hasMove['psychic']) rejected = true;
					break;
				case 'bugbuzz':
					if (hasMove['uturn'] && !counter.setupType) rejected = true;
					break;
				case 'leechlife':
					if (isDoubles && hasMove['lunge']) rejected = true;
					if (movePool.includes('firstimpression') || movePool.includes('spikes')) rejected = true;
					break;
				case 'stoneedge':
					if (hasMove['rockblast'] || hasMove['rockslide'] || !!counter.Status && movePool.includes('rockslide')) rejected = true;
					if (hasAbility['Guts'] && (!hasMove['dynamicpunch'] || hasMove['spikes'])) rejected = true;
					break;
				case 'poltergeist':
					if (hasMove['knockoff']) rejected = true;
					break;
				case 'shadowball':
					if (hasAbility['Pixilate'] && (counter.setupType || counter.Status > 1)) rejected = true;
					if (!hasType['Ghost'] && movePool.includes('focusblast')) rejected = true;
					if (isDoubles && hasMove ['phantomforce']) rejected = true;
					break;
				case 'shadowclaw':
					if (hasType['Steel'] && hasMove['shadowsneak'] && counter.Physical < 4) rejected = true;
					break;
				case 'dragonpulse': case 'spacialrend':
					if (hasMove['dracometeor'] && counter.Special < 4) rejected = true;
					break;
				case 'darkpulse':
					if ((hasMove['foulplay'] || hasMove['knockoff'] || hasMove['suckerpunch'] || hasMove['defog']) && counter.setupType !== 'Special') rejected = true;
					break;
				case 'suckerpunch':
					if (counter.damagingMoves.length < 2 || counter['Dark'] > 1 && !hasType['Dark']) rejected = true;
					if (hasMove['rest']) rejected = true;
					break;
				case 'meteormash':
					if (movePool.includes('extremespeed')) rejected = true;
					break;
				case 'dazzlinggleam':
					if (hasMove['fleurcannon'] || hasMove['moonblast'] || hasMove['petaldance']) rejected = true;
					break;

				// Status:
				case 'bodyslam': case 'clearsmog':
					if (hasMove['sludgebomb'] || hasMove['toxic'] && !hasType['Normal']) rejected = true;
					if (hasMove['trick'] || movePool.includes('recover')) rejected = true;
					break;
				case 'haze':
					if ((hasMove['stealthrock'] || movePool.includes('stealthrock')) && !teamDetails.stealthRock) rejected = true;
					break;
				case 'hypnosis':
					if (hasMove['voltswitch']) rejected = true;
					break;
				case 'willowisp': case 'yawn':
					if (hasMove['thunderwave'] || hasMove['toxic']) rejected = true;
					break;
				case 'painsplit': case 'recover': case 'synthesis':
					if (hasMove['rest'] || hasMove['wish']) rejected = true;
					if (moveid === 'synthesis' && hasMove['gigadrain']) rejected = true;
					break;
				case 'roost':
					if (hasMove['throatchop'] || hasMove['stoneedge'] && !hasType['Rock']) rejected = true;
					break;
				case 'reflect': case 'lightscreen':
					if (teamDetails.screens) rejected = true;
					break;
				case 'substitute':
					if (hasMove['rest'] || !counter['recovery'] && movePool.includes('calmmind')) rejected = true;
					if (movePool.includes('bulkup') || movePool.includes('painsplit') || movePool.includes('roost')) rejected = true;
					if (isDoubles && movePool.includes('powerwhip')) rejected = true;
					break;
				case 'helpinghand':
					if (hasMove['acupressure']) rejected = true;
					break;
				case 'wideguard':
					if (hasMove['protect']) rejected = true;
					break;
				}

				// This move doesn't satisfy our setup requirements:
				if (((move.category === 'Physical' && counter.setupType === 'Special') || (move.category === 'Special' && counter.setupType === 'Physical')) && moveid !== 'photongeyser') {
					// Reject STABs last in case the setup type changes later on
					const stabs: number = counter[species.types[0]] + (counter[species.types[1]] || 0);
					if (!hasType[move.type] || stabs > 1 || counter[move.category] < 2) rejected = true;
				}

				// Pokemon should have moves that benefit their types, stats, or ability
				if (!rejected && !move.damage && !isSetup && !move.weather && !move.stallingMove &&
					(isDoubles || (!['facade', 'lightscreen', 'reflect', 'sleeptalk', 'spore', 'substitute', 'switcheroo', 'teleport', 'toxic', 'trick'].includes(moveid) && (move.category !== 'Status' || !move.flags.heal))) &&
					(!counter.setupType || counter.setupType === 'Mixed' || (move.category !== counter.setupType && move.category !== 'Status') || (counter[counter.setupType] + counter.Status > 3 && !counter.hazards)) &&
				(
					(!counter.stab && counter['physicalpool'] + counter['specialpool'] > 0) ||
					(hasType['Bug'] && movePool.includes('megahorn')) ||
					(hasType['Dark'] && (!counter['Dark'] || (hasMove['suckerpunch'] && (movePool.includes('knockoff') || movePool.includes('wickedblow'))))) ||
					(hasType['Dragon'] && !counter['Dragon'] && !hasMove['dragonascent'] && !hasMove['substitute'] && !(hasMove['rest'] && hasMove['sleeptalk'])) ||
					(hasType['Electric'] && (!counter['Electric'] || movePool.includes('thunder'))) ||
					(hasType['Fairy'] && !counter['Fairy'] && (movePool.includes('dazzlinggleam') || movePool.includes('fleurcannon') || movePool.includes('moonblast') || movePool.includes('playrough'))) ||
					(hasType['Fighting'] && (!counter['Fighting'] || !counter.stab)) ||
					(hasType['Fire'] && (!counter['Fire'] || movePool.includes('flareblitz')) && !hasMove['bellydrum']) ||
					((hasType['Flying'] || hasMove['swordsdance']) && !counter['Flying'] && (movePool.includes('airslash') || movePool.includes('bravebird') || movePool.includes('dualwingbeat') || movePool.includes('oblivionwing'))) ||
					(hasType['Ghost'] && (!counter['Ghost'] || movePool.includes('poltergeist') || movePool.includes('spectralthief')) && !counter['Dark']) ||
					(hasType['Grass'] && ((!counter['Grass'] && (species.baseStats.atk >= 100 || movePool.includes('leafstorm'))) || movePool.includes('grassyglide'))) ||
					(hasType['Ground'] && !counter['Ground']) ||
					(hasType['Ice'] && (!counter['Ice'] || movePool.includes('iciclecrash') || (hasAbility['Snow Warning'] && movePool.includes('blizzard')))) ||
					((hasType['Normal'] && hasAbility['Guts'] && movePool.includes('facade')) || (hasAbility['Pixilate'] && !counter['Normal'])) ||
					(hasType['Poison'] && !counter['Poison'] && (hasType['Ground'] || hasType['Psychic'] || counter.setupType || movePool.includes('gunkshot'))) ||
					(hasType['Psychic'] && !counter['Psychic'] && !hasType['Ghost'] && !hasType['Steel'] && (hasAbility['Psychic Surge'] || counter.setupType || movePool.includes('psychicfangs'))) ||
					(hasType['Rock'] && !counter['Rock'] && species.baseStats.atk >= 80) ||
					((hasType['Steel'] || hasAbility['Steelworker']) && (!counter['Steel'] || (hasMove['bulletpunch'] && counter.stab < 2)) && species.baseStats.atk >= 95) ||
					(hasType['Water'] && ((!counter['Water'] && !hasMove['hypervoice']) || movePool.includes('hypervoice') || (hasAbility['Huge Power'] && movePool.includes('aquajet')))) ||
					((hasAbility['Moody'] || hasMove['wish']) && movePool.includes('protect')) ||
					(((hasMove['lightscreen'] && movePool.includes('reflect')) || (hasMove['reflect'] && movePool.includes('lightscreen'))) && !teamDetails.screens) ||
					((movePool.includes('morningsun') || movePool.includes('recover') || movePool.includes('roost') || movePool.includes('slackoff') || movePool.includes('softboiled')) &&
						!!counter.Status && !counter.setupType && !hasMove['healingwish'] && !hasMove['switcheroo'] && !hasMove['trick'] && !hasMove['trickroom'] && !isDoubles) ||
					(movePool.includes('milkdrink') || movePool.includes('quiverdance') || movePool.includes('stickyweb') && !counter.setupType && !teamDetails.stickyWeb) ||
					(isLead && movePool.includes('stealthrock') && !!counter.Status && !counter.setupType && !counter['speedsetup'] && !hasMove['substitute']) ||
					(isDoubles && species.baseStats.def >= 140 && movePool.includes('bodypress'))
				)) {
					// Reject Status, non-STAB, or low basepower moves
					if (move.category === 'Status' || !hasType[move.type] || move.basePower && move.basePower < 50 && !move.multihit && !hasAbility['Technician']) {
						rejected = true;
					}
				}

				// Sleep Talk shouldn't be selected without Rest
				if (moveid === 'rest' && rejected) {
					const sleeptalk = movePool.indexOf('sleeptalk');
					if (sleeptalk >= 0) {
						if (movePool.length < 2) {
							rejected = false;
						} else {
							this.fastPop(movePool, sleeptalk);
						}
					}
				}

				// Remove rejected moves from the move list
				if (rejected && movePool.length) {
					if (move.category !== 'Status' && !move.damage) rejectedPool.push(moves[k]);
					moves.splice(k, 1);
					break;
				}
				if (rejected && rejectedPool.length) {
					moves.splice(k, 1);
					break;
				}
			}
		} while (moves.length < 4 && (movePool.length || rejectedPool.length));

		const abilities: string[] = Object.values(species.abilities);
		abilities.sort((a, b) => this.dex.getAbility(b).rating - this.dex.getAbility(a).rating);
		let ability0 = this.dex.getAbility(abilities[0]);
		let ability1 = this.dex.getAbility(abilities[1]);
		let ability2 = this.dex.getAbility(abilities[2]);
		if (abilities[1]) {
			if (abilities[2] && ability1.rating <= ability2.rating && this.randomChance(1, 2)) {
				[ability1, ability2] = [ability2, ability1];
			}
			if (ability0.rating <= ability1.rating && this.randomChance(1, 2)) {
				[ability0, ability1] = [ability1, ability0];
			} else if (ability0.rating - 0.6 <= ability1.rating && this.randomChance(2, 3)) {
				[ability0, ability1] = [ability1, ability0];
			}
			ability = ability0.name;

			let rejectAbility: boolean;
			do {
				rejectAbility = false;
				if (['Cloud Nine', 'Flare Boost', 'Hydration', 'Ice Body', 'Innards Out', 'Insomnia', 'Misty Surge', 'Quick Feet', 'Rain Dish', 'Snow Cloak', 'Steadfast', 'Steam Engine', 'Weak Armor'].includes(ability)) {
					rejectAbility = true;
				} else if (['Contrary', 'Serene Grace', 'Skill Link', 'Strong Jaw'].includes(ability)) {
					rejectAbility = !counter[toID(ability)];
				} else if (ability === 'Adaptability') {
					rejectAbility = !!counter['speedsetup'];
				} else if (ability === 'No Guard') {
					rejectAbility = (!hasMove['inferno'] && (species.id === 'drifblimdelta'));
				} else if (ability === 'Vital Spirit') {
					rejectAbility = (species.id === 'greninjadelta');
				} else if (ability === 'Liquid Ooze') {
					rejectAbility = (species.id === 'heatmordelta');
				} else if (ability === 'Simple') {
					rejectAbility = (species.id === 'crustledeltacake' && !hasMove['shellsmash']);
				} else if (ability === 'Mega Launcher') {
					rejectAbility = (hasMove['shiftgear'] && hasMove['ironhead'] && hasMove['poisonjab'] && hasMove['gigadrain']);
				} else if (ability === 'Fur Coat' || ability === 'Oblivious') {
					rejectAbility = (species.id === 'dugtriodelta');
				} else if (ability === 'Steadfast') {
					rejectAbility = (species.id === 'drifblimdelta');
				} else if (ability === 'Synchronize') {
					rejectAbility = (species.id === 'ludicolodelta');
				} else if (ability === 'Heatproof') {
					rejectAbility = (species.id === 'octillerydelta');
				} else if (ability === 'White Smoke') {
					rejectAbility = (species.id === 'octillerydelta' && !hasMove['rockpolish'] && !hasMove['flamethrower']);
				} else if (ability === 'Rough Skin' || ability === 'Rivalry') {
					rejectAbility = (species.id === 'scraftydelta');
				} else if (ability === 'Cursed Body' || ability === 'Technician') {
					rejectAbility = (species.id === 'ambipomdelta');
				} else if (ability === 'Compound Eyes"' || ability === 'Trace') {
					rejectAbility = (species.id === 'dodriodelta');
				} else if (ability === 'Unnerve') {
					rejectAbility = (species.id === 'darmanitandelta');
				} else if (ability === 'Pressure') {
					rejectAbility = (species.id === 'gorebyssdelta' || species.id === 'huntaildelta');
				} else if (ability === 'Analytic') {
					rejectAbility = (hasMove['rapidspin'] || species.nfe || isDoubles);
				} else if (ability === 'Blaze') {
					rejectAbility = (isDoubles && hasAbility['Solar Power']);
				} else if (ability === 'Bulletproof' || ability === 'Overcoat') {
					rejectAbility = (counter.setupType && hasAbility['Soundproof']);
				} else if (ability === 'Chlorophyll') {
					rejectAbility = (species.baseStats.spe > 100 || !counter['Fire'] && !hasMove['sunnyday'] && !teamDetails['sun']);
				} else if (ability === 'Competitive') {
					rejectAbility = (counter['Special'] < 2 || hasMove['rest'] && hasMove['sleeptalk']);
				} else if (ability === 'Compound Eyes' || ability === 'No Guard') {
					rejectAbility = !counter['inaccurate'];
				} else if (ability === 'Cursed Body') {
					rejectAbility = hasAbility['Infiltrator'];
				} else if (ability === 'Defiant') {
					rejectAbility = !counter['Physical'];
				} else if (ability === 'Download') {
					rejectAbility = (counter.damagingMoves.length < 3 || hasMove['trick']);
				} else if (ability === 'Early Bird') {
					rejectAbility = (hasType['Grass'] && isDoubles);
				} else if (ability === 'Flash Fire') {
					rejectAbility = (this.dex.getEffectiveness('Fire', species) < -1 || hasAbility['Drought']);
				} else if (ability === 'Gluttony') {
					rejectAbility = !hasMove['bellydrum'];
				} else if (ability === 'Guts') {
					rejectAbility = (!hasMove['facade'] && !hasMove['sleeptalk'] && !species.nfe);
				} else if (ability === 'Harvest') {
					rejectAbility = (hasAbility['Frisk'] && !isDoubles);
				} else if (ability === 'Hustle' || ability === 'Inner Focus') {
					rejectAbility = (counter.Physical < 2 || hasAbility['Iron Fist']);
				} else if (ability === 'Infiltrator') {
					rejectAbility = ((hasMove['rest'] && hasMove['sleeptalk']) || isDoubles && hasAbility['Clear Body']);
				} else if (ability === 'Intimidate') {
					rejectAbility = (hasMove['bodyslam'] || hasMove['bounce'] || hasMove['tripleaxel']);
				} else if (ability === 'Iron Fist') {
					rejectAbility = (counter['ironfist'] < 2 || hasMove['dynamicpunch']);
				} else if (ability === 'Justified') {
					rejectAbility = (isDoubles && hasAbility['Inner Focus']);
				} else if (ability === 'Lightning Rod') {
					rejectAbility = (species.types.includes('Ground') || counter.setupType === 'Physical');
				} else if (ability === 'Limber') {
					rejectAbility = species.types.includes('Electric');
				} else if (ability === 'Liquid Voice') {
					rejectAbility = !hasMove['hypervoice'];
				} else if (ability === 'Magic Guard') {
					rejectAbility = (hasAbility['Tinted Lens'] && !counter.Status && !isDoubles);
				} else if (ability === 'Mold Breaker') {
					rejectAbility = (hasAbility['Adaptability'] || hasAbility['Scrappy'] || (hasAbility['Sheer Force'] && !!counter['sheerforce']) || hasAbility['Unburden'] && counter.setupType);
				} else if (ability === 'Moxie') {
					rejectAbility = (counter.Physical < 2 || hasMove['stealthrock']);
				} else if (ability === 'Neutralizing Gas') {
					rejectAbility = !hasMove['toxicspikes'];
				} else if (ability === 'Overgrow') {
					rejectAbility = !counter['Grass'];
				} else if (ability === 'Own Tempo') {
					rejectAbility = !hasMove['petaldance'];
				} else if (ability === 'Power Construct') {
					rejectAbility = (species.forme === '10%' && !isDoubles);
				} else if (ability === 'Prankster') {
					rejectAbility = !counter['Status'];
				} else if (ability === 'Pressure') {
					rejectAbility = (counter.setupType || counter.Status < 2 || isDoubles);
				} else if (ability === 'Refrigerate') {
					rejectAbility = !counter['Normal'];
				} else if (ability === 'Regenerator') {
					rejectAbility = hasAbility['Magic Guard'];
				} else if (ability === 'Reckless' || ability === 'Rock Head') {
					rejectAbility = !counter['recoil'];
				} else if (ability === 'Sand Force' || ability === 'Sand Veil') {
					rejectAbility = !teamDetails['sand'];
				} else if (ability === 'Sand Rush') {
					rejectAbility = (!teamDetails['sand'] && (!counter.setupType || !counter['Rock'] || hasMove['rapidspin']));
				} else if (ability === 'Sap Sipper') {
					rejectAbility = hasMove['roost'];
				} else if (ability === 'Scrappy') {
					rejectAbility = (hasMove['earthquake'] && hasMove['milkdrink']);
				} else if (ability === 'Screen Cleaner') {
					rejectAbility = !!teamDetails['screens'];
				} else if (ability === 'Shadow Tag') {
					rejectAbility = (species.name === 'Gothitelle' && !isDoubles);
				} else if (ability === 'Shed Skin') {
					rejectAbility = hasMove['dragondance'];
				} else if (ability === 'Sheer Force') {
					rejectAbility = (!counter['sheerforce'] || hasAbility['Guts']);
				} else if (ability === 'Slush Rush') {
					rejectAbility = (!teamDetails['hail'] && !hasAbility['Swift Swim']);
				} else if (ability === 'Sniper') {
					rejectAbility = (counter['Water'] > 1 && !hasMove['focusenergy']);
				} else if (ability === 'Steely Spirit') {
					rejectAbility = (hasMove['fakeout'] && !isDoubles);
				} else if (ability === 'Sturdy') {
					rejectAbility = (hasMove['bulkup'] || !!counter['recoil'] || hasAbility['Solid Rock']);
				} else if (ability === 'Swarm') {
					rejectAbility = (!counter['Bug'] || !!counter['recovery']);
				} else if (ability === 'Sweet Veil') {
					rejectAbility = hasType['Grass'];
				} else if (ability === 'Swift Swim') {
					rejectAbility = (!hasMove['raindance'] && (hasAbility['Intimidate'] || (hasAbility['Lightning Rod'] && !counter.setupType) || hasAbility['Rock Head'] || hasAbility['Slush Rush'] || hasAbility['Water Absorb']));
				} else if (ability === 'Synchronize') {
					rejectAbility = counter.Status < 3;
				} else if (ability === 'Technician') {
					rejectAbility = (!counter['technician'] || hasMove['tailslap'] || hasAbility['Punk Rock'] || movePool.includes('snarl'));
				} else if (ability === 'Tinted Lens') {
					rejectAbility = (hasMove['defog'] || hasMove['hurricane'] || counter.Status > 2 && !counter.setupType);
				} else if (ability === 'Torrent') {
					rejectAbility = (hasMove['focusenergy'] || hasMove['hypervoice']);
				} else if (ability === 'Tough Claws') {
					rejectAbility = (hasType['Steel'] && !hasMove['fakeout']);
				} else if (ability === 'Unaware') {
					rejectAbility = (counter.setupType || hasMove['fireblast']);
				} else if (ability === 'Unburden') {
					rejectAbility = (hasAbility['Prankster'] || !counter.setupType && !isDoubles);
				} else if (ability === 'Volt Absorb') {
					rejectAbility = (this.dex.getEffectiveness('Electric', species) < -1);
				} else if (ability === 'Water Absorb') {
					rejectAbility = (hasMove['raindance'] || hasAbility['Drizzle'] || hasAbility['Strong Jaw'] || hasAbility['Unaware'] || hasAbility['Volt Absorb']);
				}

				if (rejectAbility) {
					if (ability === ability0.name && ability1.rating >= 1) {
						ability = ability1.name;
					} else if (ability === ability1.name && abilities[2] && ability2.rating >= 1) {
						ability = ability2.name;
					} else {
						// Default to the highest rated ability if all are rejected
						ability = abilities[0];
						rejectAbility = false;
					}
				}
			} while (rejectAbility);

			if (forme === 'Copperajah' && gmax) {
				ability = 'Heavy Metal';
			} else if (hasAbility['Guts'] && (hasMove['facade'] || (hasMove['rest'] && hasMove['sleeptalk']))) {
				ability = 'Guts';
			} else if (hasAbility['Moxie'] && (counter.Physical > 3 || hasMove['bounce']) && !isDoubles) {
				ability = 'Moxie';
			} else if (isDoubles) {
				if (hasAbility['Competitive'] && ability !== 'Shadow Tag' && ability !== 'Strong Jaw') ability = 'Competitive';
				if (hasAbility['Curious Medicine'] && this.randomChance(1, 2)) ability = 'Curious Medicine';
				if (hasAbility['Friend Guard']) ability = 'Friend Guard';
				if (hasAbility['Gluttony'] && hasMove['recycle']) ability = 'Gluttony';
				if (hasAbility['Guts']) ability = 'Guts';
				if (hasAbility['Harvest']) ability = 'Harvest';
				if (hasAbility['Healer'] && hasAbility['Natural Cure']) ability = 'Healer';
				if (hasAbility['Intimidate']) ability = 'Intimidate';
				if (hasAbility['Klutz'] && ability === 'Limber') ability = 'Klutz';
				if (hasAbility['Magic Guard'] && ability !== 'Friend Guard' && ability !== 'Unaware') ability = 'Magic Guard';
				if (hasAbility['Ripen']) ability = 'Ripen';
				if (hasAbility['Stalwart']) ability = 'Stalwart';
				if (hasAbility['Storm Drain']) ability = 'Storm Drain';
				if (hasAbility['Telepathy'] && (ability === 'Pressure' || hasAbility['Analytic'])) ability = 'Telepathy';
			}
		} else {
			ability = ability0.name;
		}

		item = !isDoubles ? 'Leftovers' : 'Sitrus Berry';
		if (species.requiredItems) {
			item = this.sample(species.requiredItems);

		// First, the extra high-priority items
		} else if (['Corsola', 'Garchomp', 'Tangrowth'].includes(species.name) && !!counter.Status && !counter.setupType && !isDoubles) {
			item = 'Rocky Helmet';
		} else if (['torterradelta'].includes(species.id)) {
			item = hasMove['raindance'] ? 'Damp Rock' : ((this.randomChance(1, 2)) ? 'Rocky Helmet' : 'Leftovers');
		} else if (['serperoirdelta'].includes(species.id)) {
			item = hasAbility['drizzle'] ? 'Damp Rock' : 'Leftovers';
		} else if (counter.Physical >= 3 && ['scraftydelta'].includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'Assault Vest' : 'Choice Band';
		} else if (['ambipomdelta'].includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'Life Orb' : 'Choice Band';
		} else if (['heatmordelta'].includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'Life Orb' : 'Choice Scarf';
		} else if (['dugtriodelta'].includes(species.id)) {
			item = (counter.Physical >= 3) ? 'Choice Band' : 'Heavy-Duty Boots';
		} else if (['lilligantdeltawater'].includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'Choice Scarf' : 'Leftovers';
		} else if (['plusledelta'].includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'Life Orb' : 'Heavy-Duty Boots';
		} else if (['cameruptdelta'].includes(species.id)) {
			item = 'Delta Cameruptite';
		} else if (['drifblimdelta'].includes(species.id) || ['greninjadelta'].includes(species.id)) {
			item = 'Heavy-Duty Boots';
		} else if (['dodriodelta'].includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'Focus Sash' : 'Choice Band';
		} else if (counter.Physical >= 3 && ['mukdelta'].includes(species.id)) {
			item = 'Choice Band';
		} else if (['gorebyssdelta'].includes(species.id) || ['huntaildelta'].includes(species.id)) {
			item = (hasMove['shellsmash']) ? 'White Herb' : 'Choice Scarf';
		} else if (['darmanitandelta'].includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'Choice Band' : 'Choice Scarf';
		} else if (['lunatone'].includes(species.id) && hasAbility['noctem']) {
			item = 'Dark Rock';
		} else if (['solrock'].includes(species.id) && hasAbility['drought']) {
			item = 'Heat Rock';
		} else if (species.name === 'Eternatus' && counter.Status < 2) {
			item = 'Metronome';
		} else if (species.name === 'Farfetch\u2019d') {
			item = 'Leek';
		} else if (species.name === 'Froslass' && !isDoubles) {
			item = 'Wide Lens';
		} else if (species.name === 'Latios' && counter.Special === 2 && !isDoubles) {
			item = 'Soul Dew';
		} else if (species.name === 'Lopunny') {
			item = isDoubles ? 'Iron Ball' : 'Toxic Orb';
		} else if (species.baseSpecies === 'Marowak') {
			item = 'Thick Club';
		} else if (species.baseSpecies === 'Pikachu') {
			forme = 'Pikachu' + this.sample(['', '-Original', '-Hoenn', '-Sinnoh', '-Unova', '-Kalos', '-Alola', '-Partner', '-World']);
			item = 'Light Ball';
		} else if (species.name === 'Regieleki' && !isDoubles) {
			item = 'Magnet';
		} else if (species.name === 'Shedinja') {
			item = (!teamDetails.defog && !teamDetails.rapidSpin && !isDoubles) ? 'Heavy-Duty Boots' : 'Focus Sash';
		} else if (species.name === 'Shuckle' && hasMove['stickyweb']) {
			item = 'Mental Herb';
		} else if (species.name === 'Unfezant' || hasMove['focusenergy']) {
			item = 'Scope Lens';
		} else if (species.name === 'Wobbuffet' || ['Cheek Pouch', 'Harvest', 'Ripen'].includes(ability)) {
			item = 'Sitrus Berry';
		} else if (ability === 'Gluttony') {
			item = this.sample(['Aguav', 'Figy', 'Iapapa', 'Mago', 'Wiki']) + ' Berry';
		} else if (ability === 'Gorilla Tactics' || ability === 'Imposter' || (ability === 'Magnet Pull' && hasMove['bodypress'] && !isDoubles)) {
			item = 'Choice Scarf';
		} else if (hasMove['trick'] || hasMove['switcheroo'] && !isDoubles) {
			if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter['priority'] && ability !== 'Triage') {
				item = 'Choice Scarf';
			} else {
				item = (counter.Physical > counter.Special) ? 'Choice Band' : 'Choice Specs';
			}
		} else if (species.evos.length && !hasMove['uturn']) {
			item = 'Eviolite';
		} else if (hasMove['bellydrum']) {
			item = (!!counter['priority'] || !hasMove['substitute']) ? 'Sitrus Berry' : 'Salac Berry';
		} else if (hasMove['geomancy'] || hasMove['meteorbeam']) {
			item = 'Power Herb';
		} else if (hasMove['shellsmash']) {
			item = (ability === 'Sturdy' && !isLead && !isDoubles) ? 'Heavy-Duty Boots' : 'White Herb';
		} else if (ability === 'Guts' && (counter.Physical > 2 || isDoubles)) {
			item = hasType['Fire'] ? 'Toxic Orb' : 'Flame Orb';
		} else if (ability === 'Magic Guard' && counter.damagingMoves.length > 1) {
			item = hasMove['counter'] ? 'Focus Sash' : 'Life Orb';
		} else if (ability === 'Sheer Force' && !!counter['sheerforce']) {
			item = 'Life Orb';
		} else if (ability === 'Unburden') {
			item = (hasMove['closecombat'] || hasMove['curse']) ? 'White Herb' : 'Sitrus Berry';
		} else if (hasMove['acrobatics']) {
			item = (ability === 'Grassy Surge') ? 'Grassy Seed' : '';
		} else if (hasMove['auroraveil'] || hasMove['lightscreen'] && hasMove['reflect']) {
			item = 'Light Clay';
		} else if (hasMove['rest'] && !hasMove['sleeptalk'] && ability !== 'Shed Skin') {
			item = 'Chesto Berry';
		} else if (hasMove['hypnosis'] && ability === 'Beast Boost') {
			item = 'Blunder Policy';
		} else if (this.dex.getEffectiveness('Rock', species) >= 2 && !isDoubles) {
			item = 'Heavy-Duty Boots';

		// Doubles
		} else if (isDoubles && (hasMove['dragonenergy'] || hasMove['eruption'] || hasMove['waterspout']) && counter.damagingMoves.length >= 4) {
			item = 'Choice Scarf';
		} else if (isDoubles && hasMove['blizzard'] && ability !== 'Snow Warning' && !teamDetails['hail']) {
			item = 'Blunder Policy';
		} else if (isDoubles && this.dex.getEffectiveness('Rock', species) >= 2 && !hasType['Flying']) {
			item = 'Heavy-Duty Boots';
		} else if (isDoubles && counter.Physical >= 4 && (hasType['Dragon'] || hasType['Fighting'] || hasType['Rock'] || hasMove['flipturn'] || hasMove['uturn']) &&
			!hasMove['fakeout'] && !hasMove['feint'] && !hasMove['rapidspin'] && !hasMove['suckerpunch']
		) {
			item = (!counter['priority'] && !hasAbility['Speed Boost'] && !hasMove['aerialace'] && species.baseStats.spe >= 60 && species.baseStats.spe <= 100 && this.randomChance(1, 2)) ? 'Choice Scarf' : 'Choice Band';
		} else if (isDoubles && ((counter.Special >= 4 && (hasType['Dragon'] || hasType ['Fighting'] || hasType['Rock'] || hasMove['voltswitch'])) || (counter.Special >= 3 &&
			(hasMove['flipturn'] || hasMove['uturn'])) && !hasMove['acidspray'] && !hasMove['electroweb'])
		) {
			item = (species.baseStats.spe >= 60 && species.baseStats.spe <= 100 && this.randomChance(1, 2)) ? 'Choice Scarf' : 'Choice Specs';
		} else if (isDoubles && counter.damagingMoves.length >= 4 && species.baseStats.hp + species.baseStats.def + species.baseStats.spd >= 280) {
			item = 'Assault Vest';
		} else if (isDoubles && counter.damagingMoves.length >= 3 && species.baseStats.spe >= 60 && ability !== 'Multiscale' && ability !== 'Sturdy' && !hasMove['acidspray'] && !hasMove['clearsmog'] && !hasMove['electroweb'] &&
			!hasMove['fakeout'] && !hasMove['feint'] && !hasMove['icywind'] && !hasMove['incinerate'] && !hasMove['naturesmadness'] && !hasMove['rapidspin'] && !hasMove['snarl'] && !hasMove['uturn']
		) {
			item = (ability === 'Defeatist' || species.baseStats.hp + species.baseStats.def + species.baseStats.spd >= 275) ? 'Sitrus Berry' : 'Life Orb';
		} else if (isDoubles && (hasMove['MeteorBeam'])) { 
			item = 'Power Herb';
		} else if (isDoubles && (hasMove['LightScreen'] && hasMove['Reflect'] || hasMove['auroraveil'])) {
		   item = 'Ligth Clay';
	   } else if (isDoubles && (('aggrondelta').includes(species.id) || ('cofagrigusdelta').includes(species.id))) {
			item = (this.randomChance(1, 2)) ? 'leftovers' : 'shuca berry';
	   } else if (isDoubles && ('amoongussdelta').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'roseli berry' : 'leftovers';
		} else if (isDoubles && ('aurorusdelta').includes(species.id)) {
			item = 'coba berry';
		} else if (isDoubles && ('avaluggdelta').includes(species.id)) {
			item = (ability == 'Solid Rock') ? 'Weakness Policy' : 'Life Orb';
		} else if (isDoubles && ('arcaninedelta' || 'bisharpdelta').includes(species.id)) {  
			item = (counter.damagingMoves.length >= 4) ? 'Assault Vest' : 'Life Orb';                                                                    //AVLO
		} else if (isDoubles && ('mawiledelta' || 'dunsparcedelta' || 'blastoisedelta' || 'sunfloradelta' || 'hoopadeltaunleashed').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'leftovers' : 'life orb';                                                                                 //LftLO
		} else if (isDoubles && ('chandeluredelta').includes(species.id)) {
			item = (counter.Special >= 4) ? 'choice specs' : 'pixie plate'
		} else if (isDoubles && ('scytherdelta' || 'scolipededelta' || 'heatmordelta' || 'galladedelta' || 'darmanitandelta' || 'blazikendelta').includes(species.id)) {
			item = (counter.speedSetup >= 1 || hasAbility['Weak Armor'] || hasAbility['Slush Rush'] && teamDetails['hail']) ? 'Focus Sash' : 'Life Orb'; //FSLO
		} else if (isDoubles && ('drifblimdelta').includes(species.id)) {
			item = (this.randomChance(1, 2) ? 'Charti berry' : 'leftovers') ;
		} else if (isDoubles && ('dugtriodelta').includes(species.id)) {
			item = (hasMove['swordsdance']) ? 'focus sash' : 'life orb';
		} else if (isDoubles && ('electiviredelta').includes(species.id)) {
			item = (hasMove['NewMoon']) ? 'Dark Rock' : 'Power Herb';
		} else if (isDoubles && ('emolgadelta' || 'froslassdelta').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'charcoal' : 'focus sash';
		} else if (isDoubles && ('escavalierdelta').includes(species.id)) {
			item = (hasAbility['Misty Surge']) ? 'Misty Seed' : 'Leftovers';
		} else if (isDoubles && ('glaliedelta').includes(species.id)) {
			item = (counter.damagingMoves.length >=4) ? 'Choice Band' : 'Life Orb';
		} else if (isDoubles && ('golemdelta').includes(species.id)) {
			item = (hasMove['TrickRoom']) ? 'Trick Rock' : ((counter.damagingMoves.length >=2) ? 'Weakness Policy' : 'Leftovers') ;
		} else if (isDoubles && ('golurkdelta' || 'pidgeotdelta' || 'sceptiledelta').includes(species.id)) {
			item = (hasAbility['Guts'] || hasAbility['Marvel Scale']) ? 'Flame Orb' : 'Life Orb';                                                                                        //FOLO
		} else if (isDoubles && ('goodradelta').includes(species.id)) {
			item = (counter.damagingMoves.length >=4) ? 'Assault Vest' : 'Rindo Berry';
		} else if (isDoubles && ('gorebyssdelta').includes(species.id)) {
			item = (hasMove['shellsmash']) ? 'White Herb' : 'Flame Orb';
		} else if (isDoubles && ('greninjadelta' || 'lieparddelta' || 'sableyedelta' || 'minundelta').includes(species.id)) {
			item = 'Focus Sash';                                                                                                                          //FocusSash
		} else if (isDoubles && ('haxorusdelta').includes(species.id)) {
			item = (counter.Physical >=4) ? 'Choice Band' : 'Life Orb';
		} else if (isDoubles && ('hydreigondelta').includes(species.id)) {
			item = (counter.Special >=4) ? 'Choice Specs' : 'Life Orb';
		} else if (isDoubles && ('kabutopsdelta').includes(species.id)) {
			item = (hasMove['swordsdance']) ? 'focus sash' : 'life orb';
		} else if (isDoubles && ('lopunnydelta').includes(species.id)) {
			item = (hasAbility['unburden'] && (hasMove['machpunch'] || hasMove['CloseCombat'] || hasMove['BrickBreak']) ? 'fighting gem' : 'aguav berry');
		} else if (isDoubles && ('huntaildelta').includes(species.id)) {
			item = (hasMove['shellsmash']) ? 'White Herb' : 'Life Orb';
		} else if (isDoubles && ('lucariodelta').includes(species.id)) {
			item = (counter.physicalsetup >=1 || counter.specialsetup >=1 || counter.damagingMoves.length <=2) ? 'sitrus berry' : 'life orb';
		} else if (isDoubles && ('luxraydelta').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'shuca berry' : 'life orb';
		} else if (isDoubles && ('magmortardelta').includes(species.id)) {
			item = (hasAbility['Filter'] || hasMove['autotomize']) ? 'weakness policy' : 'blunder policy';
		} else if (isDoubles && ('maractusdelta').includes(species.id)) {
			item = (hasAbility['Motor Drive']) ? 'Cell Battery' : (hasAbility['Clear Body'] && (hasMove['autotomize'] || hasMove['IronDefense'])) ? 'Weakness Policy' : 'Life Orb';
		} else if (isDoubles && ('medichamdelta').includes(species.id)) {
			item = (counter.damagingMoves.length >=4) ? 'Choice Scarf' : 'Life Orb';
		} else if (isDoubles && ('miloticdelta').includes(species.id)) {
			item = (hasMove['trickroom']) ? 'Trick Rock' : 'leftovers';
		} else if (isDoubles && ('mismagiusdelta').includes(species.id)) {
			item = (hasMove['Thunder'] || hasMove['blizzard'] || hasMove['sing']) ? 'Wide Lens' : 'Life Orb';
		} else if (isDoubles && ('mukdelta' || 'tangrowthdelta' || 'regicedelta' || 'lanturndelta' || 'snorlaxdelta' || 'tentacrueldelta').includes(species.id)) {
			item = (counter.damagingMoves.length >=4) ? 'Assault Vest' : 'Leftovers';                                                                   //AVlftv
		} else if (isDoubles && ('noctowldelta').includes(species.id)) {
			item = (counter.damagingMoves.length <=2) ? 'Charti Berry' : 'Life Orb';
		} else if (isDoubles && ('noiverndelta').includes(species.id)) {
			item = (counter.Special >=4) ? 'Choice Specs' : 'Occa Berry';
		} else if (isDoubles && ('quagsiredelta').includes(species.id)) {
			item = (hasAbility['harvest'] && teamDetails['sun']) ? 'starf berry' : 'sitrus berry';
		} else if (isDoubles && ('registeeldelta').includes(species.id)) {
			item = (hasMove['Recover']) ? 'Weakness Policy' : 'Leftovers';
		} else if (isDoubles && ('reuniclusdelta').includes(species.id)) {
			item = (hasMove['meteorbeam']) ? 'Power herb' : 'Focus Sash';
		} else if (isDoubles && ('scraftydelta').includes(species.id)) {
			item = 'grassy seed';
		} else if (isDoubles && ('serperiordelta' || 'UFI').includes(species.id)) {
			item = 'leftovers';                                                                                                                         //lftv
		} else if (isDoubles && ('shiftrydelta').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'life orb' : 'sitrus berry';
		} else if (isDoubles && ('shuckledelta').includes(species.id)) {
			item = (counter.damagingMoves.length >=3) ? 'Weakness Policy' : 'leftovers';
		} else if (isDoubles && ('torterradelta').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'rindo berry' : 'life orb';
		} else if (isDoubles && ('typhlosiondelta').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'magnet' : 'shuca berry';
		} else if (isDoubles && ('vespiqueendelta').includes(species.id)) {
			item = (hasMove['shiftgear'] && hasAbility['Levitate'] || hasAbility['Speed Boost']) ? 'Weakness Policy' : 'leftovers';
		} else if (isDoubles && ('volcaronadelta').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'Assault Vest' : 'Choice Specs';
		} else if (isDoubles && ('weezingdelta').includes(species.id)) {
			item = (hasMove['overdrive'] || hasMove['boomburst']) ? 'throat spray' : 'leftovers';
		} else if (isDoubles && ('yanmegadelta').includes(species.id)) {
			item = (counter.Special >=4) ? 'Choice Specs' : 'Life Orb';
		} else if (isDoubles && ('crustledeltaberry').includes(species.id)) {
			item = (hasAbility['harvest'] && teamDetails['sun']) ? 'liechi berry' : 'sitrus berry';
		} else if (isDoubles && ('deltalilligantfairy').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'focus sash' : 'sitrus berry';
		} else if (isDoubles && ('metagrossdeltaruin').includes(species.id)) {
			item = (hasMove['RockPolish']) ? 'Weakness Policy' : 'Life Orb';
		} else if (isDoubles && ('metagrossdeltaspider').includes(species.id)) {
			item = (counter.damagingMoves.length >=4) ? 'Assault vest' : 'Toxic Orb';
		} else if (isDoubles && ('meloettadelta').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'Weakness Policy' : 'Life Orb';
		} else if (isDoubles && ('meloettadeltamagician').includes(species.id)) {
			item = (counter.Special >= 4) ? 'Choice Specs' : 'Sitrus berry';
		} else if (isDoubles && ('toxicroakdelta').includes(species.id)) {
			item = (this.randomChance(1, 2)) ? 'Blunder Policy' : 'Life Orb';
		} else if (isDoubles && ('plusledelta').includes(species.id)) {
			item = (hasMove['rest']) ? 'chesto berry' : 'focus sash';
		} else if (isDoubles && ('hoopadelta').includes(species.id)) {
			item = (hasMove['acrobatics'] || hasMove['aeroblast']) ? 'flying gem' : (counter.damagingMoves.length >=4) ? 'Choice Scarf' : 'leftovers';
		
		// Medium priority
		} else if (counter.Physical >= 4 && ability !== 'Serene Grace' && !hasMove['fakeout'] && !hasMove['flamecharge'] && !hasMove['rapidspin'] && (!hasMove['tailslap'] || hasMove['uturn']) && !isDoubles) {
			const scarfReqs = (
				(species.baseStats.atk >= 100 || ability === 'Huge Power') && species.baseStats.spe >= 60 && species.baseStats.spe <= 108 &&
				ability !== 'Speed Boost' && !counter['priority'] && !hasMove['aerialace'] && !hasMove['bounce'] && !hasMove['dualwingbeat']
			);
			item = (scarfReqs && this.randomChance(2, 3)) ? 'Choice Scarf' : 'Choice Band';
		} else if (counter.Physical >= 3 && (hasMove['copycat'] || hasMove['memento'] || hasMove['partingshot']) && !hasMove['rapidspin'] && !isDoubles) {
			item = 'Choice Band';
		} else if (((counter.Special >= 4 && !hasMove['futuresight']) || (counter.Special >= 3 && (hasMove['flipturn'] || hasMove['partingshot'] || hasMove['uturn']))) && !isDoubles) {
			const scarfReqs = species.baseStats.spa >= 100 && species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && ability !== 'Tinted Lens' && !counter.Physical;
			item = (scarfReqs && this.randomChance(2, 3)) ? 'Choice Scarf' : 'Choice Specs';
		} else if (((counter.Physical >= 3 && hasMove['defog']) || (counter.Special >= 3 && hasMove['healingwish'])) && !counter['priority'] && !hasMove['uturn'] && !isDoubles) {
			item = 'Choice Scarf';
		} else if (hasMove['raindance'] || hasMove['sunnyday'] || (ability === 'Speed Boost' && !counter['hazards']) || ability === 'Stance Change' && counter.damagingMoves.length >= 3) {
			item = 'Life Orb';
		} else if (this.dex.getEffectiveness('Rock', species) >= 1 && (['Defeatist', 'Emergency Exit', 'Multiscale'].includes(ability) || hasMove['courtchange'] || hasMove['defog'] || hasMove['rapidspin']) && !isDoubles) {
			item = 'Heavy-Duty Boots';
		} else if (species.name === 'Necrozma-Dusk-Mane' || (this.dex.getEffectiveness('Ground', species) < 2 && !!counter['speedsetup'] &&
			counter.damagingMoves.length >= 3 && species.baseStats.hp + species.baseStats.def + species.baseStats.spd >= 300)
		) {
			item = 'Weakness Policy';
		} else if (counter.damagingMoves.length >= 4 && species.baseStats.hp + species.baseStats.def + species.baseStats.spd >= 235) {
			item = 'Assault Vest';
		} else if ((hasMove['clearsmog'] || hasMove['curse'] || hasMove['haze'] || hasMove['healbell'] || hasMove['protect'] || hasMove['sleeptalk'] || hasMove['strangesteam']) && (ability === 'Moody' || !isDoubles)) {
			item = 'Leftovers';

		// Better than Leftovers
		} else if (isLead && !['Disguise', 'Sturdy'].includes(ability) && !hasMove['substitute'] && !counter['recoil'] && !counter['recovery'] && species.baseStats.hp + species.baseStats.def + species.baseStats.spd < 255 && !isDoubles) {
			item = 'Focus Sash';
		} else if (ability === 'Water Bubble' && !isDoubles) {
			item = 'Mystic Water';
		} else if (hasMove['clangoroussoul'] || hasMove['boomburst'] && !!counter['speedsetup']) {
			item = 'Throat Spray';
		} else if (((this.dex.getEffectiveness('Rock', species) >= 1 && (!teamDetails.defog || ability === 'Intimidate' || hasMove['uturn'] || hasMove['voltswitch'])) ||
			(hasMove['rapidspin'] && (ability === 'Regenerator' || !!counter['recovery']))) && !isDoubles
		) {
			item = 'Heavy-Duty Boots';
		} else if (this.dex.getEffectiveness('Ground', species) >= 2 && !hasType['Poison'] && ability !== 'Levitate' && !hasAbility['Iron Barbs'] && !isDoubles) {
			item = 'Air Balloon';
		} else if (counter.damagingMoves.length >= 3 && !counter['damage'] && ability !== 'Sturdy' && !hasMove['foulplay'] && !hasMove['rapidspin'] && !hasMove['substitute'] && !hasMove['uturn'] && !isDoubles &&
			(!!counter['speedsetup'] || hasMove['trickroom'] || !!counter['drain'] || hasMove['psystrike'] || (species.baseStats.spe > 40 && species.baseStats.hp + species.baseStats.def + species.baseStats.spd < 275))
		) {
			item = 'Life Orb';
		} else if (counter.damagingMoves.length >= 4 && !counter['Dragon'] && !counter['Normal'] && !isDoubles) {
			item = 'Expert Belt';
		} else if ((hasMove['dragondance'] || hasMove['swordsdance']) && !isDoubles &&
			(hasMove['outrage'] || !hasType['Bug'] && !hasType['Fire'] && !hasType['Ground'] && !hasType['Normal'] && !hasType['Poison'] && !['Pastel Veil', 'Storm Drain'].includes(ability))
		) {
			item = 'Lum Berry';
		}

		// For Trick / Switcheroo
		if (item === 'Leftovers' && hasType['Poison']) {
			item = 'Black Sludge';
		}

		const level: number = (!isDoubles ? species.randomBattleLevel : species.randomDoubleBattleLevel) || 80;

		// Prepare optimal HP
		const srWeakness = (ability === 'Magic Guard' || item === 'Heavy-Duty Boots' ? 0 : this.dex.getEffectiveness('Rock', species));
		while (evs.hp > 1) {
			const hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
			if (hasMove['substitute'] && (item === 'Sitrus Berry' || ability === 'Power Construct' || (hasMove['bellydrum'] && item === 'Salac Berry'))) {
				// Two Substitutes should activate Sitrus Berry
				if (hp % 4 === 0) break;
			} else if (hasMove['bellydrum'] && (item === 'Sitrus Berry' || ability === 'Gluttony')) {
				// Belly Drum should activate Sitrus Berry
				if (hp % 2 === 0) break;
			} else if (hasMove['substitute'] && hasMove['reversal']) {
				// Reversal users should be able to use four Substitutes
				if (hp % 4 > 0) break;
			} else {
				// Maximize number of Stealth Rock switch-ins
				if (srWeakness <= 0 || hp % (4 / srWeakness) > 0) break;
			}
			evs.hp -= 4;
		}

		if (hasMove['shellsidearm'] && item === 'Choice Specs') evs.atk -= 4;

		// Minimize confusion damage
		if (!counter['Physical'] && !hasMove['transform'] && (!hasMove['shellsidearm'] || !counter.Status)) {
			evs.atk = 0;
			ivs.atk = 0;
		}

		if (hasMove['gyroball'] || hasMove['trickroom']) {
			evs.spe = 0;
			ivs.spe = 0;
		}

		return {
			name: species.baseSpecies,
			species: forme,
			gender: species.gender,
			moves: moves,
			ability: ability,
			evs: evs,
			ivs: ivs,
			item: item,
			level: level,
			shiny: this.randomChance(1, 1024),
			gigantamax: gmax,
		};
	}

	getPokemonPool(type: string, pokemon: RandomTeamsTypes.RandomSet[] = [], isMonotype = false) {
		const exclude = pokemon.map(p => toID(p.species));
		const pokemonPool = [];
		for (const id in this.dex.data.FormatsData) {
			let species = this.dex.getSpecies(id);
			if (species.gen > this.gen || exclude.includes(species.id)) continue;
			if (isMonotype) {
				if (!species.types.includes(type)) continue;
				if (typeof species.battleOnly === 'string') {
					species = this.dex.getSpecies(species.battleOnly);
					if (!species.types.includes(type)) continue;
				}
			}
			pokemonPool.push(id);
		}
		return pokemonPool;
	}

	randomTeam() {
		const seed = this.prng.seed;
		const ruleTable = this.dex.getRuleTable(this.format);
		const pokemon: RandomTeamsTypes.RandomSet[] = [];

		// For Monotype
		const isMonotype = ruleTable.has('sametypeclause');
		const typePool = Object.keys(this.dex.data.TypeChart);
		const type = this.sample(typePool);

		// PotD stuff
		let potd: Species | false = false;
		if (global.Config && Config.potd && ruleTable.has('potd')) {
			potd = this.dex.getSpecies(Config.potd);
		}

		const baseFormes: {[k: string]: number} = {};

		const tierCount: {[k: string]: number} = {};
		const typeCount: {[k: string]: number} = {};
		const typeComboCount: {[k: string]: number} = {};
		const teamDetails: RandomTeamsTypes.TeamDetails = {};

		const pokemonPool = this.getPokemonPool(type, pokemon, isMonotype);
		while (pokemonPool.length && pokemon.length < 6) {
			let species = this.dex.getSpecies(this.sampleNoReplace(pokemonPool));
			if (!species.exists) continue;

			// Check if the forme has moves for random battle
			if (this.format.gameType === 'singles') {
				if (!species.randomBattleMoves) continue;
			} else {
				if (!species.randomDoubleBattleMoves) continue;
			}

			// Limit to one of each species (Species Clause)
			if (baseFormes[species.baseSpecies]) continue;

			// Adjust rate for species with multiple sets
			switch (species.baseSpecies) {
			case 'Arceus': case 'Silvally':
				if (this.randomChance(8, 9) && !isMonotype) continue;
				break;
			case 'Aegislash': case 'Basculin': case 'Gourgeist': case 'Meloetta':
				if (this.randomChance(1, 2)) continue;
				break;
			case 'Greninja':
				if (this.gen >= 7 && this.randomChance(1, 2)) continue;
				break;
			case 'Darmanitan':
				if (species.gen === 8 && this.randomChance(1, 2)) continue;
				break;
			case 'Magearna': case 'Toxtricity': case 'Zacian': case 'Zamazenta': case 'Zarude':
			case 'Appletun': case 'Blastoise': case 'Butterfree': case 'Copperajah': case 'Grimmsnarl': case 'Inteleon': case 'Rillaboom': case 'Snorlax': case 'Urshifu':
				if (this.gen >= 8 && this.randomChance(1, 2)) continue;
				break;
			}

			// Illusion shouldn't be on the last slot
			if (species.name === 'Zoroark' && pokemon.length > 4) continue;

			const tier = species.tier;
			const types = species.types;
			const typeCombo = types.slice().sort().join();

			// Limit one Pokemon per tier, two for Monotype
			if ((tierCount[tier] >= (isMonotype ? 2 : 1)) && !this.randomChance(1, Math.pow(5, tierCount[tier]))) {
				continue;
			}

			if (!isMonotype) {
				// Limit two of any type
				let skip = false;
				for (const typeName of types) {
					if (typeCount[typeName] > 1) {
						skip = true;
						break;
					}
				}
				if (skip) continue;
			}

			// Limit one of any type combination, two in Monotype
			if (typeComboCount[typeCombo] >= (isMonotype ? 2 : 1)) continue;

			// The Pokemon of the Day
			if (!!potd && potd.exists && pokemon.length === 1) species = potd;

			const set = this.randomSet(species, teamDetails, pokemon.length === 0, this.format.gameType !== 'singles');

			// Okay, the set passes, add it to our team
			pokemon.push(set);

			if (pokemon.length === 6) {
				// Set Zoroark's level to be the same as the last Pokemon
				const illusion = teamDetails['illusion'];
				if (illusion) pokemon[illusion - 1].level = pokemon[5].level;

				// Don't bother tracking details for the 6th Pokemon
				break;
			}

			// Now that our Pokemon has passed all checks, we can increment our counters
			baseFormes[species.baseSpecies] = 1;

			// Increment tier counter
			if (tierCount[tier]) {
				tierCount[tier]++;
			} else {
				tierCount[tier] = 1;
			}

			// Increment type counters
			for (const typeName of types) {
				if (typeName in typeCount) {
					typeCount[typeName]++;
				} else {
					typeCount[typeName] = 1;
				}
			}
			if (typeCombo in typeComboCount) {
				typeComboCount[typeCombo]++;
			} else {
				typeComboCount[typeCombo] = 1;
			}

			// Track what the team has
			if (set.ability === 'Drizzle' || set.moves.includes('raindance')) teamDetails['rain'] = 1;
			if (set.ability === 'Drought' || set.moves.includes('sunnyday')) teamDetails['sun'] = 1;
			if (set.ability === 'Sand Stream') teamDetails['sand'] = 1;
			if (set.ability === 'Snow Warning') teamDetails['hail'] = 1;
			if (set.moves.includes('spikes')) teamDetails['spikes'] = (teamDetails['spikes'] || 0) + 1;
			if (set.moves.includes('stealthrock')) teamDetails['stealthRock'] = 1;
			if (set.moves.includes('stickyweb')) teamDetails['stickyWeb'] = 1;
			if (set.moves.includes('toxicspikes')) teamDetails['toxicSpikes'] = 1;
			if (set.moves.includes('defog')) teamDetails['defog'] = 1;
			if (set.moves.includes('rapidspin')) teamDetails['rapidSpin'] = 1;
			if (set.moves.includes('auroraveil') || set.moves.includes('reflect') && set.moves.includes('lightscreen')) teamDetails['screens'] = 1;

			// For setting Zoroark's level
			if (set.ability === 'Illusion') teamDetails['illusion'] = pokemon.length;
		}
		if (pokemon.length < 6) throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);

		return pokemon;
	}

	randomCAP1v1Sets: AnyObject = require('./cap-1v1-sets.json');

	randomCAP1v1Team() {
		const pokemon = [];
		const pokemonPool = Object.keys(this.randomCAP1v1Sets);

		while (pokemonPool.length && pokemon.length < 3) {
			const species = this.dex.getSpecies(this.sampleNoReplace(pokemonPool));
			if (!species.exists) throw new Error(`Invalid Pokemon "${species}" in ${this.format}`);

			const setData: AnyObject = this.sample(this.randomCAP1v1Sets[species.name]);
			const set = {
				name: species.baseSpecies,
				species: species.name,
				gender: species.gender,
				item: (Array.isArray(setData.item) ? this.sample(setData.item) : setData.item) || '',
				ability: (Array.isArray(setData.ability) ? this.sample(setData.ability) : setData.ability),
				shiny: this.randomChance(1, 1024),
				evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...setData.evs},
				nature: setData.nature,
				ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...setData.ivs || {}},
				moves: setData.moves.map((move: any) => Array.isArray(move) ? this.sample(move) : move),
			};
			pokemon.push(set);
		}
		return pokemon;
	}

	randomBSSFactorySets: AnyObject = require('./bss-factory-sets.json');

	randomBSSFactorySet(
		species: Species, teamData: RandomTeamsTypes.FactoryTeamDetails
	): RandomTeamsTypes.RandomFactorySet | null {
		const id = toID(species.name);
		const setList = this.randomBSSFactorySets[id].sets;

		const movesMax: {[k: string]: number} = {
			batonpass: 1,
			stealthrock: 1,
			toxicspikes: 1,
			trickroom: 1,
			auroraveil: 1,
		};

		const requiredMoves: {[k: string]: number} = {};

		// Build a pool of eligible sets, given the team partners
		// Also keep track of sets with moves the team requires
		let effectivePool: {set: AnyObject, moveVariants?: number[], itemVariants?: number, abilityVariants?: number}[] = [];
		const priorityPool = [];
		for (const curSet of setList) {
			let reject = false;
			let hasRequiredMove = false;
			const curSetMoveVariants = [];
			for (const move of curSet.moves) {
				const variantIndex = this.random(move.length);
				const moveId = toID(move[variantIndex]);
				if (movesMax[moveId] && teamData.has[moveId] >= movesMax[moveId]) {
					reject = true;
					break;
				}
				if (requiredMoves[moveId] && !teamData.has[requiredMoves[moveId]]) {
					hasRequiredMove = true;
				}
				curSetMoveVariants.push(variantIndex);
			}
			if (reject) continue;
			const set = {set: curSet, moveVariants: curSetMoveVariants};
			effectivePool.push(set);
			if (hasRequiredMove) priorityPool.push(set);
		}
		if (priorityPool.length) effectivePool = priorityPool;

		if (!effectivePool.length) {
			if (!teamData.forceResult) return null;
			for (const curSet of setList) {
				effectivePool.push({set: curSet});
			}
		}

		const setData = this.sample(effectivePool);
		const moves = [];
		for (const [i, moveSlot] of setData.set.moves.entries()) {
			moves.push(setData.moveVariants ? moveSlot[setData.moveVariants[i]] : this.sample(moveSlot));
		}

		return {
			name: setData.set.nickname || setData.set.name || species.baseSpecies,
			species: setData.set.species,
			gigantamax: setData.set.gigantamax,
			gender: setData.set.gender || species.gender || (this.randomChance(1, 2) ? 'M' : 'F'),
			item: (Array.isArray(setData.set.item) ? this.sample(setData.set.item) : setData.set.item) || '',
			ability: (Array.isArray(setData.set.ability) ? this.sample(setData.set.ability) : setData.set.ability) || species.abilities['0'],
			shiny: typeof setData.set.shiny === 'undefined' ? this.randomChance(1, 1024) : setData.set.shiny,
			level: setData.set.level || 50,
			happiness: typeof setData.set.happiness === 'undefined' ? 255 : setData.set.happiness,
			evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...setData.set.evs},
			ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...setData.set.ivs},
			nature: setData.set.nature || 'Serious',
			moves: moves,
		};
	}

	randomBSSFactoryTeam(side: PlayerOptions, depth = 0): RandomTeamsTypes.RandomFactorySet[] {
		const forceResult = (depth >= 4);

		const pokemon = [];

		const pokemonPool = Object.keys(this.randomBSSFactorySets);

		const teamData: TeamData = {
			typeCount: {}, typeComboCount: {}, baseFormes: {}, has: {}, forceResult: forceResult,
			weaknesses: {}, resistances: {},
		};
		const requiredMoveFamilies: string[] = [];
		const requiredMoves: {[k: string]: string} = {};
		const weatherAbilitiesSet: {[k: string]: string} = {
			drizzle: 'raindance',
			drought: 'sunnyday',
			snowwarning: 'hail',
			sandstream: 'sandstorm',
		};
		const resistanceAbilities: {[k: string]: string[]} = {
			waterabsorb: ['Water'],
			flashfire: ['Fire'],
			lightningrod: ['Electric'], voltabsorb: ['Electric'],
			thickfat: ['Ice', 'Fire'],
			levitate: ['Ground'],
		};

		while (pokemonPool.length && pokemon.length < 6) {
			// Weighted random sampling
			let maxUsage = 0;
			const sets: {[k: string]: number} = {};
			for (const specie of pokemonPool) {
				if (teamData.baseFormes[this.dex.getSpecies(specie).baseSpecies]) continue; // Species Clause
				const usage: number = this.randomBSSFactorySets[specie].usage;
				sets[specie] = usage + maxUsage;
				maxUsage += usage;
			}

			const usage = this.random(1, maxUsage);
			let last = 0;
			let specie;
			for (const key of Object.keys(sets)) {
				 if (usage > last && usage <= sets[key]) {
					 specie = key;
					 break;
				 }
				 last = sets[key];
			}

			const species = this.dex.getSpecies(specie);
			if (!species.exists) continue;

			// Limit to one of each species (Species Clause)
			if (teamData.baseFormes[species.baseSpecies]) continue;

			// Limit 2 of any type (most of the time)
			const types = species.types;
			let skip = false;
			for (const type of types) {
				if (teamData.typeCount[type] > 1 && this.randomChance(4, 5)) {
					skip = true;
					break;
				}
			}
			if (skip) continue;

			const set = this.randomBSSFactorySet(species, teamData);
			if (!set) continue;

			// Limit 1 of any type combination
			let typeCombo = types.slice().sort().join();
			if (set.ability === 'Drought' || set.ability === 'Drizzle') {
				// Drought and Drizzle don't count towards the type combo limit
				typeCombo = set.ability;
			}
			if (typeCombo in teamData.typeComboCount) continue;

			const itemData = this.dex.getItem(set.item);
			if (teamData.has[itemData.id]) continue; // Item Clause

			// Okay, the set passes, add it to our team
			pokemon.push(set);

			// Now that our Pokemon has passed all checks, we can update team data:
			for (const type of types) {
				if (type in teamData.typeCount) {
					teamData.typeCount[type]++;
				} else {
					teamData.typeCount[type] = 1;
				}
			}
			teamData.typeComboCount[typeCombo] = 1;

			teamData.baseFormes[species.baseSpecies] = 1;

			teamData.has[itemData.id] = 1;

			const abilityData = this.dex.getAbility(set.ability);
			if (abilityData.id in weatherAbilitiesSet) {
				teamData.weather = weatherAbilitiesSet[abilityData.id];
			}

			for (const move of set.moves) {
				const moveId = toID(move);
				if (moveId in teamData.has) {
					teamData.has[moveId]++;
				} else {
					teamData.has[moveId] = 1;
				}
				if (moveId in requiredMoves) {
					teamData.has[requiredMoves[moveId]] = 1;
				}
			}

			for (const typeName in this.dex.data.TypeChart) {
				// Cover any major weakness (3+) with at least one resistance
				if (teamData.resistances[typeName] >= 1) continue;
				if (
					resistanceAbilities[abilityData.id] && resistanceAbilities[abilityData.id].includes(typeName) ||
					!this.dex.getImmunity(typeName, types)
				) {
					// Heuristic: assume that Pokémon with these abilities don't have (too) negative typing.
					teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
					if (teamData.resistances[typeName] >= 1) teamData.weaknesses[typeName] = 0;
					continue;
				}
				const typeMod = this.dex.getEffectiveness(typeName, types);
				if (typeMod < 0) {
					teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
					if (teamData.resistances[typeName] >= 1) teamData.weaknesses[typeName] = 0;
				} else if (typeMod > 0) {
					teamData.weaknesses[typeName] = (teamData.weaknesses[typeName] || 0) + 1;
				}
			}
		}
		if (pokemon.length < 6) return this.randomBSSFactoryTeam(side, ++depth);

		// Quality control
		if (!teamData.forceResult) {
			for (const requiredFamily of requiredMoveFamilies) {
				if (!teamData.has[requiredFamily]) return this.randomBSSFactoryTeam(side, ++depth);
			}
			for (const type in teamData.weaknesses) {
				if (teamData.weaknesses[type] >= 3) return this.randomBSSFactoryTeam(side, ++depth);
			}
		}

		return pokemon;
	}
}

export default RandomTeams;
