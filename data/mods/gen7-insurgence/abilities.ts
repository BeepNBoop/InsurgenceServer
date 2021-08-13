export const Abilities: {[k: string]: ModdedAbilityData} = {
	absolution: {
		onModifySpAPriority: 5,
		onModifySpA(spa, pokemon) {
			if (['newmoon'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(1.5);
			}
		},
		onWeather(target, source, effect) {
			if (effect.id === 'newmoon') {
				this.damage(target.baseMaxhp / 8, target, target);
			}
		},
		name: "Absolution",
		rating: 3,
		num: 94,
	},
	amplifier: {
		onBasePowerPriority: 7,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['sound']) {
				this.debug('Amplifier boost');
				return this.chainModify(1.25);
			}
		},
		name: "Amplifier",
		rating: 3,
		num: 277,
	},
	ancientpresence: {
		onModifyMove(move) {
			if (move.category !== 'Status') {
					move.stab = 1.5;
				}
			},
		onSourceEffectiveness() {
			return 0;
		},
		name: "Ancient Presence",
		rating: 3,
		num: 277,
	},
	athenian: {
		onModifySpAPriority: 5,
		onModifySpA(SpA) {
			return this.chainModify(2);
		},
		name: "Athenian",
		rating: 5,
		num: 37,
	},
	blazeboost: {
		onBeforeMove(pokemon, source, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Emolga' || pokemon.transformed) return;
			let forme = null;
			switch (move.type) {
			case 'Fire':
				this.boost({atk: 1}, pokemon);
				this.boost({spa: 1}, pokemon);
				this.boost({spe: 1}, pokemon);
				if (pokemon.species.name !== 'emolgadeltablaze') forme = 'Emolga-Delta-Blaze';
				pokemon.setAbility('Flame Body');
				break;
			}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
			}
		},
		name: "Blaze Boost",
		rating: 2,
		num: 66,
	},
	castlemoat: {
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Water') {
				if (!this.boost({spd: 1})) {
					this.add('-immune', target, '[from] ability: Castle Moat');
					this.add(`c|${('Palossand')}|Om nom nom`);
				}
				return null;
			}
		},
		name: "Castle Moat",
		rating: 5,
		num: 171,
	},
	chlorofury: {
		onStart(pokemon) {
			pokemon.addVolatile('chlorofury');
		},
		onEnd(pokemon) {
			delete pokemon.volatiles['chlorofury'];
			this.add('-end', pokemon, 'Chlorofury', '[silent]');
		},
		condition: {
			duration: 2,
			onStart(target) {
				this.add('-start', target, 'ability: Chlorofury', '[silent]');
				{const i = target.side.pokemon.filter(ally => ally.fainted);
					this.boost({spa: i.length}, target)};
				this.boost({spe: 1}, target);
			},
			onEnd(target) {
				this.add('-end', target, 'Chlorofury', '[silent]');
				{const i = target.side.pokemon.filter(ally => ally.fainted);
					this.boost({spa: -i.length}, target)};
				this.boost({spe: -1}, target);
			},
		},
		name: "Chlorofury",
		rating: 2,
		num: 200,
	},
	disguise: {
		inherit: true,
		onUpdate(pokemon) {
			if (['mimikyu', 'mimikyutotem'].includes(pokemon.species.id) && this.effectData.busted) {
				const speciesid = pokemon.species.id === 'mimikyutotem' ? 'Mimikyu-Busted-Totem' : 'Mimikyu-Busted';
				pokemon.formeChange(speciesid, this.effect, true);
			}
		},
	},
	etherealshroud: {
		onStart(pokemon) {
			this.add('-start', pokemon, 'typeadd', 'Ghost', '[from] ability: Ethereal Shroud');
		},
		onTryHit(target, source, move) {
			if (move.category === 'Status' || source.hasAbility('scrappy') || target === source) return;
			if (target.volatiles['miracleeye'] || target.volatiles['foresight'] || target.hasItem('ringtarget') ) return;
			if (move.type === 'Normal' || move.type === 'Fighting') {
				this.add('-immune', target);
				return null;
			}
		},
		onAllyTryHitSide(target, source, move) {
			if (move.category === 'Status' || source.hasAbility('scrappy') || target === source) return;
			if (target.volatiles['miracleeye'] || target.volatiles['foresight'] || target.hasItem('ringtarget')) return;
			if (move.type === 'Normal' || move.type === 'Fighting') {
				this.add('-immune', this.effectData.target);
			}
		},
		onSourceBasePowerPriority: 18,
		onSourceBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Bug' || move.type === 'Poison') {
				return this.chainModify(0.5);
			}
		},
		onModifyMove(move) {
			if (move.type === 'Ghost')
				move.stab = 1;
		},
		name: "Ethereal Shroud",
		rating: 1,
		num: 194,
	},
	eventhorizon: {
		onDamagingHit(damage, target, source, move) {
			if (move.flags['contact']) {
			source.addVolatile('trapped', source, move, 'trapper');
			}
		},
		name: "Event Horizon",
		rating: 4.5,
		num: 194,
	},
	foundry: {
		onModifyMovePriority: -1,
		onModifyMove(move, attacker) {
			if (move.flags['foundry']) {
				move.id == 'stealthrockfire';
			}
		},
		onModifyType(move, source) {
			if (move.type === 'Rock' && !(move.isZ && move.category !== 'Status')) {
				move.type = 'Fire';
				move.foundryBoosted = true;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.foundryBoosted) return this.chainModify([0x14CD, 0x1000]);
		},
		name: "Foundry",
		rating: 3,
		num: 108,
	},
	glitch: {
		onDamagingHit(damage, target, source, move) {
			if (move.flags['contact']) {
				source.faint();
			}
		},
		name: "Glitch",
		rating: 5,
		num: 206,
	},
	heliophobia: {
		onWeather(target, source, effect) {
			if (target.hasItem('utilityumbrella')) return;
			if (effect.id === 'newmoon') {
				this.heal(target.baseMaxhp / 8);
			} else if (effect.id === 'sunnyday' || effect.id === 'desolateland') {
				this.damage(target.baseMaxhp / 8, target, target);
			}
		},
		name: "Heliophobia",
		rating: 3,
		num: 87,
	},
	hubris: {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({spa: length}, source);
			}
		},
		name: "Hubris",
		rating: 3,
		num: 270,
	},
	icecleats: {
		onModifySpe(spe, pokemon) {
			if (this.field.isWeather('hail') || this.field.isWeather('sleet')) {
				return this.chainModify(2);
			}
		},
		name: "Ice Cleats",
		rating: 3,
		num: 202,
	},
	innerfocus: {
		inherit: true,
		rating: 1,
		onBoost() {},
	},
	intimidate: {
		inherit: true,
		rating: 4,
	},	
	intoxicate: {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.isZ && move.category !== 'Status')) {
				move.type = 'Poison';
				move.intoxicateBoosted = true;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.intoxicateBoosted) return this.chainModify([0x14CD, 0x1000]);
		},
		name: "Intoxicate",
		rating: 4,
		num: 182,
	},
	irrelephant: {
		onModifyMovePriority: -5,
		onModifyMove(move) {
			if (!move.ignoreImmunity) move.ignoreImmunity = {};
			if (move.ignoreImmunity !== true) {
				move.ignoreImmunity['Bug'] = true;
				move.ignoreImmunity['Dark'] = true;
				move.ignoreImmunity['Dragon'] = true;
				move.ignoreImmunity['Electric'] = true;
				move.ignoreImmunity['Fairy'] = true;
				move.ignoreImmunity['Fighting'] = true;
				move.ignoreImmunity['Fire'] = true;
				move.ignoreImmunity['Flying'] = true;
				move.ignoreImmunity['Ghost'] = true;
				move.ignoreImmunity['Grass'] = true;
				move.ignoreImmunity['Ground'] = true;
				move.ignoreImmunity['Ice'] = true;
				move.ignoreImmunity['Normal'] = true;
				move.ignoreImmunity['Poison'] = true;
				move.ignoreImmunity['Psychic'] = true;
				move.ignoreImmunity['Rock'] = true;
				move.ignoreImmunity['Steel'] = true;
				move.ignoreImmunity['Water'] = true;
				move.ignoreImmunity['Crystal'] = true;
			}
		},
		name: "Irrelephant",
		rating: 3,
		num: 280,
	},
	lernean: {
		onBeforeMove(pokemon, target, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Hydreigon' || pokemon.transformed) return;
				if (pokemon.hp <= pokemon.maxhp / 5 && pokemon.species.id !== 'hydreigonmegad') {
					pokemon.formeChange('hydreigonmegad');
				} else if (pokemon.hp <= pokemon.maxhp / 2.5 && (pokemon.species.id !== 'hydreigonmegac' && pokemon.species.id !== 'hydreigonmegad')) {
					pokemon.formeChange('hydreigonmegac');
				} else if (pokemon.hp <= pokemon.maxhp / 1.667 && (pokemon.species.id === 'hydreigonmegaa' || pokemon.species.id === 'hydregionmega')) {
					pokemon.formeChange('hydreigonmegab');
				} else if (pokemon.hp <= pokemon.maxhp / 1.25 && pokemon.species.id === 'hydreigonmega') {
					pokemon.formeChange('hydreigonmegaa');
				}
		},
		onModifyMove(move, attacker) {
			if (move.category === 'Status' || move.selfdestruct || move.multihit) return;
			if (['endeavor', 'fling', 'iceball', 'rollout'].includes(move.id)) return;
			if (!move.flags['charge'] && !move.spreadHit && !move.isZ && !move.isMax && attacker.species.id === 'hydreigonmega') {
				move.multihit = 5;
			} else if (!move.flags['charge'] && !move.spreadHit && !move.isZ && !move.isMax && attacker.species.id === 'hydreigonmegaa') {
				move.multihit = 6;
			} else if (!move.flags['charge'] && !move.spreadHit && !move.isZ && !move.isMax && attacker.species.id === 'hydreigonmegab') {
				move.multihit = 7;
			} else if (!move.flags['charge'] && !move.spreadHit && !move.isZ && !move.isMax && attacker.species.id === 'hydreigonmegac') {
				move.multihit = 8;
			} else if (!move.flags['charge'] && !move.spreadHit && !move.isZ && !move.isMax && attacker.species.id === 'hydreigonmegad') {
				move.multihit = 9;
			}
		},
		onModifyDamage(damage, source, target, move) {
			if (move.category === 'Status' || move.selfdestruct || move.multihit) return;
			if (['endeavor', 'fling', 'iceball', 'rollout'].includes(move.id)) return;
			if (!move.flags['charge'] && !move.spreadHit && !move.isZ && !move.isMax && source.species.id === 'hydreigonmega') {
				return this.chainModify(0.23);
			} else if (!move.flags['charge'] && !move.spreadHit && !move.isZ && !move.isMax && source.species.id === 'hydreigonmegaa') {
				return this.chainModify(0.20416667);
			} else if (!move.flags['charge'] && !move.spreadHit && !move.isZ && !move.isMax && source.species.id === 'hydreigonmegab') {
				return this.chainModify(0.18571429);
			} else if (!move.flags['charge'] && !move.spreadHit && !move.isZ && !move.isMax && source.species.id === 'hydreigonmegac') {
				return this.chainModify(0.171875);
			} else if (!move.flags['charge'] && !move.spreadHit && !move.isZ && !move.isMax && source.species.id === 'hydreigonmegad') {
				return this.chainModify(0.16111111);
			}
		},
		name: "Lernean",
		rating: 4,
		num: 102,
	},
	moody: {
		inherit: true,
		onResidual(pokemon) {
			let stats: BoostName[] = [];
			const boost: SparseBoostsTable = {};
			let statPlus: BoostName;
			for (statPlus in pokemon.boosts) {
				if (pokemon.boosts[statPlus] < 6) {
					stats.push(statPlus);
				}
			}
			let randomStat = stats.length ? this.sample(stats) : undefined;
			if (randomStat) boost[randomStat] = 2;

			stats = [];
			let statMinus: BoostName;
			for (statMinus in pokemon.boosts) {
				if (pokemon.boosts[statMinus] > -6 && statMinus !== randomStat) {
					stats.push(statMinus);
				}
			}
			randomStat = stats.length ? this.sample(stats) : undefined;
			if (randomStat) boost[randomStat] = -1;

			this.boost(boost);
		},
	},
	noctem: {
		onStart(source) {
			this.field.setWeather('newmoon');
		},
		name: "Noctem",
		rating: 4,
		num: 271,
	},
	oblivious: {
		inherit: true,
		onBoost() {},
	},
	omnitype: {
		onModifyMove(move) {
			if (move.type === 'Dragon' || move.type === 'Ghost')
				move.stab = 1.5;
		},
		onTryHit(target, source, move) {
			if (move.category === 'Status' || source.hasAbility('scrappy') || target === source) return;
			if (target.volatiles['miracleeye'] || target.volatiles['foresight'] || target.hasItem('ringtarget')) return;
			if (move.type === 'Normal' || move.type === 'Fighting' || move.type === 'Poison' || move.type === 'Ground'
			|| move.type === 'Ghost' || move.type === 'Electric' || move.type === 'Psychic' || move.type === 'Dragon') {
				this.add('-immune', target);
				return null;
			}
		},
		onAllyTryHitSide(target, source, move) {
			if (move.category === 'Status' || source.hasAbility('scrappy') || target === source) return;
			if (target.volatiles['miracleeye'] || target.volatiles['foresight'] || target.hasItem('ringtarget')) return;
			if (move.type === 'Normal' || move.type === 'Fighting' || move.type === 'Poison' || move.type === 'Ground'
			|| move.type === 'Ghost' || move.type === 'Electric' || move.type === 'Psychic' || move.type === 'Dragon') {
				this.add('-immune', this.effectData.target);
			}
		},
		onSourceBasePowerPriority: 18,
		onSourceBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Bug' || move.type === 'Grass') {
				return this.chainModify(0.0625);
			} else if (move.type === 'Steel' || move.type === 'Dark' || move.type === 'Electric') {
				return this.chainModify(0.5);
			} else if (move.type === 'Rock' || move.type === 'Ghost') {
				return this.chainModify(2);
			} if (move.type === 'Normal' || move.type === 'Poison') {
				return this.chainModify(0.25);
			} if (move.type === 'Ground') {
				return this.chainModify(8);
			}
		},
		name: "Omnitype",
		rating: 5,
		num: 290,
	},
	owntempo: {
		inherit: true,
		onBoost() {},
	},
	pendulum: {
		onStart(pokemon) {
			pokemon.addVolatile('pendulum');
		},
		condition: {
			onStart(pokemon) {
				this.effectData.lastMove = '';
				this.effectData.numConsecutive = 0;
			},
			onTryMovePriority: -2,
			onTryMove(pokemon, target, move) {
				if (this.effectData.lastMove === move.id && pokemon.moveLastTurnResult) {
					this.effectData.numConsecutive++;
				} else if (pokemon.volatiles['twoturnmove'] && this.effectData.lastMove !== move.id) {
					this.effectData.numConsecutive = 1;
				} else {
					this.effectData.numConsecutive = 0;
				}
				this.effectData.lastMove = move.id;
			},
			onModifyDamage(damage, source, target, move) {
				const dmgMod = [0x1000, 0x1333, 0x1666, 0x1999, 0x1CCC, 0x2000];
				const numConsecutive = this.effectData.numConsecutive > 5 ? 5 : this.effectData.numConsecutive;
				return this.chainModify([dmgMod[numConsecutive], 0x1000]);
			},
		},
		name: "Pendulum",
		rating: 3,
		num: 253,
	},
	periodicorbit: {
		//coded into the moves themselves
		name: "Periodic Orbit",
		rating: 3,
		num: 253,
	},
	phototroph: {
		onResidualOrder: 5,
		onResidualSubOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hasItem('utilityumbrella')) return;
			switch (pokemon.effectiveWeather()) {
				case 'raindance':
				case 'primordialsea':
				case 'newmoon':
			return;
				case 'sunnyday':
				case 'desolateland':
			this.heal(pokemon.baseMaxhp / 8, pokemon, pokemon);
			return;
				case 'hail':
				case 'sleet':
				case 'sandstorm':
				case 'deltastream':
			this.heal(pokemon.baseMaxhp / 16);
			return;
				default:
			this.heal(pokemon.baseMaxhp / 16);
			return;
			}
		},
		name: "Phototroph",
		rating: 2,
		num: 253,
	},
	prismguard: {
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (!move.flags['contact'] && move.category !== 'Status') {
				this.damage(source.baseMaxhp / 8, source, target);
			}
		},
		name: "Prism Guard",
		rating: 2.5,
		num: 24,
	},
	proteanmaxima: {
		onBeforeMove(pokemon, target, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Eevee' || pokemon.transformed) return;
			let forme = null;
			switch (move.type) {
			case 'Water':
				if (pokemon.species.name !== 'vaporeon') forme = 'Vaporeon';
				pokemon.setAbility('Protean Maxima V');
				break;
			case 'Fire':
				if (pokemon.species.name !== 'flareon') forme = 'Flareon';
				pokemon.setAbility('Protean Maxima F');
				break;
			case 'Electric':
				if (pokemon.species.name !== 'jolteon') forme = 'Jolteon';
				pokemon.setAbility('Protean Maxima J');
				break;
			case 'Psychic':
				if (pokemon.species.name !== 'espeon') forme = 'Espeon';
				pokemon.setAbility('Protean Maxima E');
				break;
			case 'Dark':
				if (pokemon.species.name !== 'umbreon') forme = 'Umbreon';
				pokemon.setAbility('Protean Maxima U');
				break;
			case 'Grass':
				if (pokemon.species.name !== 'leafeon') forme = 'Leafeon';
				pokemon.setAbility('Protean Maxima L');
				break;
			case 'Ice':
				if (pokemon.species.name !== 'glaceon') forme = 'Glaceon';
				pokemon.setAbility('Protean Maxima G');
				break;
			case 'Fairy':
				if (pokemon.species.name !== 'sylveon') forme = 'Sylveon';
				pokemon.setAbility('Protean Maxima S');
				break;
			}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
				}
			},
		name: "Protean Maxima",
		rating: 5,
		num: 168,
	},
	proteanmaximae: {
		onBeforeMove(pokemon, target, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Eevee' || pokemon.transformed) return;
			let forme = null;
			switch (move.type) {
				case 'Water':
					if (pokemon.species.name !== 'vaporeon') forme = 'Vaporeon';
					pokemon.setAbility('Protean Maxima V');
					break;
				case 'Fire':
					if (pokemon.species.name !== 'flareon') forme = 'Flareon';
					pokemon.setAbility('Protean Maxima F');
					break;
				case 'Electric':
					if (pokemon.species.name !== 'jolteon') forme = 'Jolteon';
					pokemon.setAbility('Protean Maxima J');
					break;
				case 'Dark':
					if (pokemon.species.name !== 'umbreon') forme = 'Umbreon';
					pokemon.setAbility('Protean Maxima U');
					break;
				case 'Grass':
					if (pokemon.species.name !== 'leafeon') forme = 'Leafeon';
					pokemon.setAbility('Protean Maxima L');
					break;
				case 'Ice':
					if (pokemon.species.name !== 'glaceon') forme = 'Glaceon';
					pokemon.setAbility('Protean Maxima G');
					break;
				case 'Fairy':
					if (pokemon.species.name !== 'sylveon') forme = 'Sylveon';
					pokemon.setAbility('Protean Maxima S');
					break;
				case 'Normal':
					if (pokemon.species.name !== 'eeveemega') forme = 'Eevee-Mega';
					pokemon.setAbility('Protean Maxima');
					break;
				}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
				}
			},
		onTryHitPriority: 1,
		onTryHit(target, source, move) {
			if (target === source || move.hasBounced || !move.flags['reflectable']) {
				return;
			}
			const newMove = this.dex.getActiveMove(move.id);
			newMove.hasBounced = true;
			newMove.pranksterBoosted = false;
			this.useMove(newMove, target, source);
			return null;
		},
		onAllyTryHitSide(target, source, move) {
			if (target.side === source.side || move.hasBounced || !move.flags['reflectable']) {
				return;
			}
			const newMove = this.dex.getActiveMove(move.id);
			newMove.hasBounced = true;
			newMove.pranksterBoosted = false;
			this.useMove(newMove, this.effectData.target, source);
			return null;
		},
		condition: {
			duration: 1,
		},
		name: "Protean Maxima E",
		rating: 5,
		num: 168,
	},
	proteanmaximaf: {
		onBeforeMove(pokemon, target, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Eevee' || pokemon.transformed) return;
			let forme = null;
			switch (move.type) {
				case 'Water':
					if (pokemon.species.name !== 'vaporeon') forme = 'Vaporeon';
					pokemon.setAbility('Protean Maxima V');
					break;
				case 'Electric':
					if (pokemon.species.name !== 'jolteon') forme = 'Jolteon';
					pokemon.setAbility('Protean Maxima J');
					break;
				case 'Psychic':
					if (pokemon.species.name !== 'espeon') forme = 'Espeon';
					pokemon.setAbility('Protean Maxima E');
					break;
				case 'Dark':
					if (pokemon.species.name !== 'umbreon') forme = 'Umbreon';
					pokemon.setAbility('Protean Maxima U');
					break;
				case 'Grass':
					if (pokemon.species.name !== 'leafeon') forme = 'Leafeon';
					pokemon.setAbility('Protean Maxima L');
					break;
				case 'Ice':
					if (pokemon.species.name !== 'glaceon') forme = 'Glaceon';
					pokemon.setAbility('Protean Maxima G');
					break;
				case 'Fairy':
					if (pokemon.species.name !== 'sylveon') forme = 'Sylveon';
					pokemon.setAbility('Protean Maxima S');
					break;
				case 'Normal':
					if (pokemon.species.name !== 'eeveemega') forme = 'Eevee-Mega';
					pokemon.setAbility('Protean Maxima');
					break;
				}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
				}
			},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Fire') {
				move.accuracy = true;
				if (!target.addVolatile('flashfire')) {
					this.add('-immune', target, '[from] ability: Flash Fire');
				}
				return null;
			}
		},
		onEnd(pokemon) {
			pokemon.removeVolatile('flashfire');
		},
		condition: {
			noCopy: true, // doesn't get copied by Baton Pass
			onStart(target) {
				this.add('-start', target, 'ability: Flash Fire');
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, attacker, defender, move) {
				if (move.type === 'Fire' && attacker.hasAbility('flashfire')) {
					this.debug('Flash Fire boost');
					return this.chainModify(1.5);
				}
			},
			onModifySpAPriority: 5,
			onModifySpA(atk, attacker, defender, move) {
				if (move.type === 'Fire' && attacker.hasAbility('flashfire')) {
					this.debug('Flash Fire boost');
					return this.chainModify(1.5);
				}
			},
			onEnd(target) {
				this.add('-end', target, 'ability: Flash Fire', '[silent]');
			},
		},
		name: "Protean Maxima F",
		rating: 5,
		num: 168,
	},
	proteanmaximag: {
		onBeforeMove(pokemon, target, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Eevee' || pokemon.transformed) return;
			let forme = null;
			switch (move.type) {
				case 'Water':
					if (pokemon.species.name !== 'vaporeon') forme = 'Vaporeon';
					pokemon.setAbility('Protean Maxima V');
					break;
				case 'Fire':
					if (pokemon.species.name !== 'flareon') forme = 'Flareon';
					pokemon.setAbility('Protean Maxima F');
					break;
				case 'Electric':
					if (pokemon.species.name !== 'jolteon') forme = 'Jolteon';
					pokemon.setAbility('Protean Maxima J');
					break;
				case 'Psychic':
					if (pokemon.species.name !== 'espeon') forme = 'Espeon';
					pokemon.setAbility('Protean Maxima E');
					break;
				case 'Dark':
					if (pokemon.species.name !== 'umbreon') forme = 'Umbreon';
					pokemon.setAbility('Protean Maxima U');
					break;
				case 'Grass':
					if (pokemon.species.name !== 'leafeon') forme = 'Leafeon';
					pokemon.setAbility('Protean Maxima L');
					break;
				case 'Fairy':
					if (pokemon.species.name !== 'sylveon') forme = 'Sylveon';
					pokemon.setAbility('Protean Maxima S');
					break;
				case 'Normal':
					if (pokemon.species.name !== 'eeveemega') forme = 'Eevee-Mega';
					pokemon.setAbility('Protean Maxima');
					break;
				}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
				}
			},
		onImmunity(type, pokemon) {
			if (type === 'hail' || type === 'sleet') return false;
		},
		onModifyAccuracyPriority: -1,
		onModifyAccuracy(accuracy) {
			if (typeof accuracy !== 'number') return;
			if (this.field.isWeather('hail') || this.field.isWeather('sleet')) {
				this.debug('Snow Cloak - decreasing accuracy');
				return this.chainModify([0x0CCD, 0x1000]);
			}
		},
		name: "Protean Maxima G",
		rating: 5,
		num: 168,
	},
	proteanmaximaj: {
		onBeforeMove(pokemon, target, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Eevee' || pokemon.transformed) return;
			let forme = null;
			switch (move.type) {
				case 'Water':
					if (pokemon.species.name !== 'vaporeon') forme = 'Vaporeon';
					pokemon.setAbility('Protean Maxima V');
					break;
				case 'Fire':
					if (pokemon.species.name !== 'flareon') forme = 'Flareon';
					pokemon.setAbility('Protean Maxima F');
					break;
				case 'Psychic':
					if (pokemon.species.name !== 'espeon') forme = 'Espeon';
					pokemon.setAbility('Protean Maxima E');
					break;
				case 'Dark':
					if (pokemon.species.name !== 'umbreon') forme = 'Umbreon';
					pokemon.setAbility('Protean Maxima U');
					break;
				case 'Grass':
					if (pokemon.species.name !== 'leafeon') forme = 'Leafeon';
					pokemon.setAbility('Protean Maxima L');
					break;
				case 'Ice':
					if (pokemon.species.name !== 'glaceon') forme = 'Glaceon';
					pokemon.setAbility('Protean Maxima G');
					break;
				case 'Fairy':
					if (pokemon.species.name !== 'sylveon') forme = 'Sylveon';
					pokemon.setAbility('Protean Maxima S');
					break;
				case 'Normal':
					if (pokemon.species.name !== 'eeveemega') forme = 'Eevee-Mega';
					pokemon.setAbility('Protean Maxima');
					break;
				}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
				}
			},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Electric') {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: Volt Absorb');
				}
				return null;
			}
		},
		name: "Protean Maxima J",
		rating: 5,
		num: 168,
	},
	proteanmaximal: {
		onBeforeMove(pokemon, target, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Eevee' || pokemon.transformed) return;
			let forme = null;
			switch (move.type) {
				case 'Water':
					if (pokemon.species.name !== 'vaporeon') forme = 'Vaporeon';
					pokemon.setAbility('Protean Maxima V');
					break;
				case 'Fire':
					if (pokemon.species.name !== 'flareon') forme = 'Flareon';
					pokemon.setAbility('Protean Maxima F');
					break;
				case 'Electric':
					if (pokemon.species.name !== 'jolteon') forme = 'Jolteon';
					pokemon.setAbility('Protean Maxima J');
					break;
				case 'Psychic':
					if (pokemon.species.name !== 'espeon') forme = 'Espeon';
					pokemon.setAbility('Protean Maxima E');
					break;
				case 'Dark':
					if (pokemon.species.name !== 'umbreon') forme = 'Umbreon';
					pokemon.setAbility('Protean Maxima U');
					break;
				case 'Ice':
					if (pokemon.species.name !== 'glaceon') forme = 'Glaceon';
					pokemon.setAbility('Protean Maxima G');
					break;
				case 'Fairy':
					if (pokemon.species.name !== 'sylveon') forme = 'Sylveon';
					pokemon.setAbility('Protean Maxima S');
					break;
				case 'Normal':
					if (pokemon.species.name !== 'eeveemega') forme = 'Eevee-Mega';
					pokemon.setAbility('Protean Maxima');
					break;
				}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
				}
			},
		onModifySpe(spe, pokemon) {
			if (['sunnyday', 'desolateland'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2);
			}
		},
		name: "Protean Maxima L",
		rating: 5,
		num: 168,
	},
	proteanmaximas: {
		onBeforeMove(pokemon, target, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Eevee' || pokemon.transformed) return;
			let forme = null;
			switch (move.type) {
				case 'Water':
					if (pokemon.species.name !== 'vaporeon') forme = 'Vaporeon';
					pokemon.setAbility('Protean Maxima V');
					break;
				case 'Fire':
					if (pokemon.species.name !== 'flareon') forme = 'Flareon';
					pokemon.setAbility('Protean Maxima F');
					break;
				case 'Electric':
					if (pokemon.species.name !== 'jolteon') forme = 'Jolteon';
					pokemon.setAbility('Protean Maxima J');
					break;
				case 'Psychic':
					if (pokemon.species.name !== 'espeon') forme = 'Espeon';
					pokemon.setAbility('Protean Maxima E');
					break;
				case 'Dark':
					if (pokemon.species.name !== 'umbreon') forme = 'Umbreon';
					pokemon.setAbility('Protean Maxima U');
					break;
				case 'Grass':
					if (pokemon.species.name !== 'leafeon') forme = 'Leafeon';
					pokemon.setAbility('Protean Maxima L');
					break;
				case 'Ice':
					if (pokemon.species.name !== 'glaceon') forme = 'Glaceon';
					pokemon.setAbility('Protean Maxima G');
					break;
				case 'Normal':
					if (pokemon.species.name !== 'eeveemega') forme = 'Eevee-Mega';
					pokemon.setAbility('Protean Maxima');
					break;
				}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
				}
			},
		onDamagingHit(damage, target, source, move) {
			if (move.flags['contact']) {
				if (this.randomChance(3, 10)) {
					source.addVolatile('attract', this.effectData.target);
				}
			}
		},
		name: "Protean Maxima S",
		rating: 5,
		num: 168,
	},
	proteanmaximau: {
		onBeforeMove(pokemon, target, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Eevee' || pokemon.transformed) return;
			let forme = null;
			switch (move.type) {
				case 'Water':
					if (pokemon.species.name !== 'vaporeon') forme = 'Vaporeon';
					pokemon.setAbility('Protean Maxima V');
					break;
				case 'Fire':
					if (pokemon.species.name !== 'flareon') forme = 'Flareon';
					pokemon.setAbility('Protean Maxima F');
					break;
				case 'Electric':
					if (pokemon.species.name !== 'jolteon') forme = 'Jolteon';
					pokemon.setAbility('Protean Maxima J');
					break;
				case 'Psychic':
					if (pokemon.species.name !== 'espeon') forme = 'Espeon';
					pokemon.setAbility('Protean Maxima E');
					break;
				case 'Grass':
					if (pokemon.species.name !== 'leafeon') forme = 'Leafeon';
					pokemon.setAbility('Protean Maxima L');
					break;
				case 'Ice':
					if (pokemon.species.name !== 'glaceon') forme = 'Glaceon';
					pokemon.setAbility('Protean Maxima G');
					break;
				case 'Fairy':
					if (pokemon.species.name !== 'sylveon') forme = 'Sylveon';
					pokemon.setAbility('Protean Maxima S');
					break;
				case 'Normal':
					if (pokemon.species.name !== 'eeveemega') forme = 'Eevee-Mega';
					pokemon.setAbility('Protean Maxima');
					break;
				}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
				}
			},
		onAfterSetStatus(status, target, source, effect) {
			if (!source || source === target) return;
			if (effect && effect.id === 'toxicspikes') return;
			if (status.id === 'slp' || status.id === 'frz') return;
			this.add('-activate', target, 'ability: Synchronize');
			// Hack to make status-prevention abilities think Synchronize is a status move
			// and show messages when activating against it.
			source.trySetStatus(status, target, {status: status.id, id: 'synchronize'} as Effect);
		},
		name: "Protean Maxima U",
		rating: 5,
		num: 168,
	},
	proteanmaximav: {
		onBeforeMove(pokemon, target, move) {
			if (pokemon.baseSpecies.baseSpecies !== 'Eevee' || pokemon.transformed) return;
			let forme = null;
			switch (move.type) {
				case 'Fire':
					if (pokemon.species.name !== 'flareon') forme = 'Flareon';
					pokemon.setAbility('Protean Maxima F');
					break;
				case 'Electric':
					if (pokemon.species.name !== 'jolteon') forme = 'Jolteon';
					pokemon.setAbility('Protean Maxima J');
					break;
				case 'Psychic':
					if (pokemon.species.name !== 'espeon') forme = 'Espeon';
					pokemon.setAbility('Protean Maxima E');
					break;
				case 'Dark':
					if (pokemon.species.name !== 'umbreon') forme = 'Umbreon';
					pokemon.setAbility('Protean Maxima U');
					break;
				case 'Grass':
					if (pokemon.species.name !== 'leafeon') forme = 'Leafeon';
					pokemon.setAbility('Protean Maxima L');
					break;
				case 'Ice':
					if (pokemon.species.name !== 'glaceon') forme = 'Glaceon';
					pokemon.setAbility('Protean Maxima G');
					break;
				case 'Fairy':
					if (pokemon.species.name !== 'sylveon') forme = 'Sylveon';
					pokemon.setAbility('Protean Maxima S');
					break;
				case 'Normal':
					if (pokemon.species.name !== 'eeveemega') forme = 'Eevee-Mega';
					pokemon.setAbility('Protean Maxima');
					break;
				}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
				}
			},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Water') {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: Protean Maxima V');
				}
				return null;
			}
		},
		name: "Protean Maxima V",
		rating: 5,
		num: 168,
	},
	psychocall: {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Psychic' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Psycho Call boost');
				return this.chainModify(1.5);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Psychic' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Psycho Call boost');
				return this.chainModify(1.5);
			}
		},
		name: "Psycho Call",
		rating: 2,
		num: 268,
	},
	rattled: {
		onDamagingHit(damage, target, source, move) {
			if (['Dark', 'Bug', 'Ghost'].includes(move.type)) {
				this.boost({spe: 1});
			}
		},
		name: "Rattled",
		rating: 1.5,
		num: 155,
	},
	regurgitation: {
		onFoeHit(target, source, move) {
			if (move.category === 'Status' || move.selfdestruct || move.multihit || move.flags['regurgitate']) return;
			const regurgitate = this.dex.getMove('regurgitate');
			this.useMove(regurgitate, source);
			return null;
		},
		condition: {
			duration: 1,
		},
		onResidual(pokemon) {
			if (pokemon.species.baseSpecies !== 'Muk'|| pokemon.transformed) return;
			const result = this.random(6);
				if (result === 0) {
					pokemon.formeChange('mukdeltawater');
				} else if (result === 1) {
					pokemon.formeChange('mukdeltagrass');
				} else if (result === 2) {
					pokemon.formeChange('mukdeltafire');
				} else if (result === 3) {
					pokemon.formeChange('mukdeltadark');
				} else if (result === 4) {
					pokemon.formeChange('mukdeltanormal');
				} else if (result === 5) {
					pokemon.formeChange('mukdeltapsychic');
				}
		},
		name: "Regurgitation",
		rating: 4.5,
		num: 276,
	},
	scrappy: {
		inherit: true,
		onBoost() {},
	},
	shadowcall: {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Dark' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Shadow Call boost');
				return this.chainModify(1.5);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Dark' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Shadow Call boost');
				return this.chainModify(1.5);
			}
		},
		name: "Shadow Call",
		rating: 2,
		num: 272,
	},
	shadowdance: {
		//coded into New Moon directly in condition.ts
		name: "Shadow Dance",
		rating: 2,
		num: 272,
	},
	shadowsynergy: {
		onModifyDamage(damage, source, target, move) {
			if (['Dark'].includes(move.type)) {
				this.debug('Shadow Synergy boost');
				return this.chainModify(1.5);
			}
		},
		name: "Shadow Synergy",
		rating: 2,
		num: 272,
	},
	sleet: {
		onStart(source) {
			this.field.setWeather('sleet');
		},
		onFaint(pokemon) {
			if (this.field.isWeather('sleet'))
				this.field.setWeather('hail');
		},
		onSwitchOut(pokemon) {
			if (this.field.isWeather('sleet'))
				this.field.setWeather('hail');
		},
		name: "Sleet",
		rating: 4,
		num: 117,
	},
	soundproof: {
		inherit: true,
		onTryHit(target, source, move) {
			if (move.flags['sound']) {
				this.add('-immune', target, '[from] ability: Soundproof');
				return null;
			}
		},
	},
	spectraljaws: {
		onBasePowerPriority: 7,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['bite']) {
				this.debug('Spectral Jaws Boost');
				return this.chainModify(1.3);
			}
		},
		onModifyMove(move, pokemon, target) {
			if (move.flags['bite']) {
				this.debug('Spectral Jaws Boost');
				move.category = 'Special';
			}
		},
		name: "Spectral Jaws",
		rating: 1.5,
		num: 43,
	},
	speedswap: {
		onStart(source) {
			this.field.addPseudoWeather('trickroom');
		},
		name: "Speed Swap",
		rating: 4,
		num: 226,
	},
	spiritcall: {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Ghost' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Spirit Call boost');
				return this.chainModify(1.5);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Ghost' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Spirit Call boost');
				return this.chainModify(1.5);
			}
		},
		name: "Spirit Call",
		rating: 2,
		num: 269,
	},
	supercell: {
		onUpdate(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== 'Typhlosion' || pokemon.transformed) return;
			let forme = null;
			switch (pokemon.effectiveWeather()) {
			case 'raindance':
			case 'primordialsea':
			case 'newmoon':
				if (pokemon.species.id !== 'typhlosiondeltamegaactive') forme = 'Typhlosion-Delta-Mega-Active';
				break;
			default:
				if (pokemon.species.id !== 'typhlosiondeltamega') forme = 'Typhlosion-Delta-Mega';
				break;
			}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
			}
		},
		onModifySpA(SpA, pokemon) {
			if (['raindance', 'primordialsea', 'newmoon'].includes(pokemon.effectiveWeather())) {
				this.debug('Supercell boost');
				return this.chainModify(1.5);
			}
		},
		name: "Supercell",
		rating: 3,
		num: 105,
	},
	syntheticalloy: {
		onEffectiveness(typeMod, target, type, move) {
			if (move.type == 'fire') return 0;
		},
		name: "Synthetic Alloy",
		rating: 2,
		num: 28,
	},
	technician: {
		inherit: true,
		onBasePowerPriority: 19,
	},
	unleafed: {
		onStart(pokemon) {
			pokemon.addVolatile('unleafed');
		},
		onEnd(pokemon) {
			delete pokemon.volatiles['unleafed'];
			this.add('-end', pokemon, 'Unleafed', '[silent]');
		},
		condition: {
			duration: 1,
			durationCallback(pokemon, move) {
				const friends = pokemon.side.pokemon.filter(ally => ally.fainted);
				return friends.length + 1;
			},
			onStart(target) {
				this.add('-start', target, 'ability: Unleafed', '[silent]');
				this.boost({atk: 1}, target);
				this.boost({def: 1}, target);
				this.boost({spa: 1}, target);
				this.boost({spd: 1}, target);
				this.boost({spe: 1}, target);
			},
			onEnd(target) {
				this.add('-end', target, 'Unleafed', '[silent]');
				this.boost({atk: -1}, target);
				this.boost({def: -1}, target);
				this.boost({spa: -1}, target);
				this.boost({spd: -1}, target);
				this.boost({spe: -1}, target);
			},
		},
		name: "Unleafed",
		rating: 3.5,
		num: 84,
	},
	vampiric: {
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (move.flags['contact']) this.heal(pokemon.lastDamage / 4, pokemon);
		},
		name: "Vampiric",
		rating: 3,
		num: 274,
	},
	vaporization: {
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Water') {
				if (!this.boost({spa: 0})) {
					this.add('-immune', target, '[from] ability: Vaporization');
				}
				return null;
			}
		},
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) {
			if (!pokemon.hp) return;
			for (const target of pokemon.side.foe.active) {
				if (!target || !target.hp) continue;
				if (target.hasType('Water')) {
					this.damage(target.baseMaxhp / 8, target, pokemon);
				}
			}
			for (const target of pokemon.side.active) {
				if (!target || !target.hp) continue;
				if (target.hasType('Water')) {
					this.damage(target.baseMaxhp / 8, target, pokemon);
				}
			}
		},
		name: "Vaporization",
		rating: 3,
		num: 274,
	},
	venomous: {
		// The Toxic part of this mechanic is implemented in moves that inflict poison under `onModifyMove` in moves.ts
		name: "Venomous",
		rating: 2,
		num: 275,
	},
	windforce: {
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Flying') {
				if (!this.boost({spe: 1})) {
					this.add('-immune', target, '[from] ability: Wind Force');
				}
				return null;
			}
		},
		name: "Wind Force",
		rating: 2,
		num: 273,
	},
	winterjoy: {
		onModifyAtk(Atk, pokemon) {
			if (pokemon.hasAbility('winterjoy')) {
				return this.chainModify(.7);
			}
		},
		onModifySpA(spa, pokemon) {
			if (pokemon.hasAbility('winterjoy')) {
				return this.chainModify(.7);
			}
		},
		name: "Winter Joy",
		rating: 3,
		num: 277,
	},
};
