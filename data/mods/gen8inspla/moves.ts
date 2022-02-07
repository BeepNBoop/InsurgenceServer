export const Moves: {[k: string]: ModdedMoveData} = {
	bleakwindstorm: {
		inherit: true,
		secondary: {
			chance: 30,
			status: 'fro',
		},
	},
	bittermalice: {
		inherit: true,
		secondary: {
			chance: 30,
			status: 'fro',
		},
	},
	blizzard: {
		inherit: true,
		secondary: {
			chance: 10,
			status: 'fro',
		},
	},
	direclaw: {
		inherit: true,
		secondary: {
			chance: 50,
			onHit(target, source) {
				const result = this.random(3);
				if (result === 0) {
					target.trySetStatus('par', source);
				} else if (result === 1) {
					target.trySetStatus('psn', source);
				} else {
					target.trySetStatus('drz', source);
				}
			},
		},
	},
	darkvoid: {
		inherit: true,
		isNonstandard: null,
		status: 'drz',
	},
	dreameater: {
		inherit: true,
		onTryImmunity(target) {
			return target.status === 'drz' || target.hasAbility('comatose');
		},
	},
	electricterrain: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onSetStatus(status, target, source, effect) {
				if (status.id === 'drz' && target.isGrounded() && !target.isSemiInvulnerable()) {
					if (effect.id === 'yawn' || (effect.effectType === 'Move' && !effect.secondaries)) {
						this.add('-activate', target, 'move: Electric Terrain');
					}
					return false;
				}
			},
			onTryAddVolatile(status, target) {
				if (!target.isGrounded() || target.isSemiInvulnerable()) return;
				if (status.id === 'yawn') {
					this.add('-activate', target, 'move: Electric Terrain');
					return null;
				}
			},
			onBasePowerPriority: 6,
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Electric' && attacker.isGrounded() && !attacker.isSemiInvulnerable()) {
					this.debug('electric terrain boost');
					return this.chainModify([0x14CD, 0x1000]);
				}
			},
			onStart(battle, source, effect) {
				if (effect?.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Electric Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Electric Terrain');
				}
			},
			onResidualOrder: 21,
			onResidualSubOrder: 2,
			onEnd() {
				this.add('-fieldend', 'move: Electric Terrain');
			},
		},
	},
	facade: {
		inherit: true,
		onBasePower(basePower, pokemon) {
			if (pokemon.status) {
				return this.chainModify(2);
			}
		},
	},
	freezedry: {
		inherit: true,
		secondary: {
			chance: 10,
			status: 'fro',
		},
	},
	freezingglare: {
		inherit: true,
		secondary: {
			chance: 10,
			status: 'fro',
		},
	},
	gmaxbefuddle: {
		inherit: true,
		self: {
			onHit(source) {
				for (const pokemon of source.side.foe.active) {
					const result = this.random(3);
					if (result === 0) {
						pokemon.trySetStatus('drz', source);
					} else if (result === 1) {
						pokemon.trySetStatus('par', source);
					} else {
						pokemon.trySetStatus('psn', source);
					}
				}
			},
		},
	},
	gmaxsnooze: {
		inherit: true,
		onHit(target) {
			if (target.status || !target.runStatusImmunity('drz')) return;
			if (this.random(2) === 0) return;
			target.addVolatile('yawn');
		},
		onAfterSubDamage(damage, target) {
			if (target.status || !target.runStatusImmunity('drz')) return;
			if (this.random(2) === 0) return;
			target.addVolatile('yawn');
		},
	},
	grasswhistle: {
		inherit: true,
		status: 'drz',
	},
	hypnosis: {
		inherit: true,
		status: 'drz',
	},
	iceball: {
		inherit: true,
		basePowerCallback(pokemon, target, move) {
			let bp = move.basePower;
			if (pokemon.volatiles['iceball'] && pokemon.volatiles['iceball'].hitCount) {
				bp *= Math.pow(2, pokemon.volatiles['iceball'].hitCount);
			}
			if (pokemon.status !== 'drz') pokemon.addVolatile('iceball');
			if (pokemon.volatiles['defensecurl']) {
				bp *= 2;
			}
			this.debug("Ice Ball bp: " + bp);
			return bp;
		},
	},
	icebeam: {
		inherit: true,
		secondary: {
			chance: 10,
			status: 'fro',
		},
	},
	icefang: {
		inherit: true,
		secondaries: [
			{
				chance: 10,
				status: 'fro',
			}, {
				chance: 10,
				volatileStatus: 'flinch',
			},
		],
	},
	icepunch: {
		inherit: true,
		secondary: {
			chance: 10,
			status: 'fro',
		},
	},
	lovelykiss: {
		inherit: true,
		status: 'drz',
	},
	nightmare: {
		inherit: true,
		condition: {
			noCopy: true,
			onStart(pokemon) {
				if (pokemon.status !== 'drz' && !pokemon.hasAbility('comatose')) {
					return false;
				}
				this.add('-start', pokemon, 'Nightmare');
			},
			onResidualOrder: 9,
			onResidual(pokemon) {
				if (['newmoon'].includes(pokemon.effectiveWeather())) {
				this.damage(pokemon.baseMaxhp / 2);
				} else this.damage(pokemon.baseMaxhp / 4);
			},
		},
	},
	permafrost: {
		inherit: true,
		condition: {
			// this is a side condition
			onStart: function (side) {
				this.add('-sidestart', side, 'Permafrost');
				this.effectData.layers = 1;
			},
			onRestart: function (side) {
				if (this.effectData.layers >= 5)
					return false;
				this.add('-sidestart', side, 'Permafrost');
				this.effectData.layers++;
			},
			onSwitchIn: function (pokemon) {
				if (!pokemon.isGrounded())
					return;
				if (pokemon.hasType('Fire') || pokemon.hasType('Ice') && ((!pokemon.hasAbility('Levitate') && !pokemon.hasType('Flying')) || pokemon.hasItem('ironball'))) {
					this.add('-sideend', pokemon.side, 'move: Permafrost', '[of] ' + pokemon);
					pokemon.side.removeSideCondition('permafrost');
					return;
				} else if (pokemon.hasItem('heavydutyboots')) {
					return;
				} else if (!pokemon.hasItem('ironball') && (pokemon.hasAbility('Levitate') || pokemon.hasType('Flying'))) {
					return;
				} else if (pokemon.hasAbility('Leaf Guard') && ['sunnyday'].includes(pokemon.effectiveWeather())) {
					return;
				} if (this.effectData.layers == 1 && !['hail', 'sleet'].includes(pokemon.effectiveWeather())) {
					if (this.randomChance(1, 10)) {
						pokemon.trySetStatus('fro', pokemon.side.foe.active[0]);
					}
				} else if (this.effectData.layers == 1 && ['hail', 'sleet'].includes(pokemon.effectiveWeather())) {
					if (this.randomChance(2, 10)) {
						pokemon.trySetStatus('fro', pokemon.side.foe.active[0]);
					}
				} else if (this.effectData.layers == 2 && !['hail', 'sleet'].includes(pokemon.effectiveWeather())) {
					if (this.randomChance(2, 10)) {
						pokemon.trySetStatus('fro', pokemon.side.foe.active[0]);
					}
				} else if (this.effectData.layers == 2 && ['hail', 'sleet'].includes(pokemon.effectiveWeather())) {
					if (this.randomChance(4, 10)) {
						pokemon.trySetStatus('fro', pokemon.side.foe.active[0]);
					}
				} else if (this.effectData.layers == 3 && !['hail', 'sleet'].includes(pokemon.effectiveWeather())) {
					if (this.randomChance(3, 10)) {
						pokemon.trySetStatus('fro', pokemon.side.foe.active[0]);
					}
				} else if (this.effectData.layers == 3 && ['hail', 'sleet'].includes(pokemon.effectiveWeather())) {
					if (this.randomChance(6, 10)) {
						pokemon.trySetStatus('fro', pokemon.side.foe.active[0]);
					}
				} else if (this.effectData.layers == 4 && !['hail', 'sleet'].includes(pokemon.effectiveWeather())) {
					if (this.randomChance(4, 10)) {
						pokemon.trySetStatus('fro', pokemon.side.foe.active[0]);
					}
				} else if (this.effectData.layers == 4 && ['hail', 'sleet'].includes(pokemon.effectiveWeather())) {
					if (this.randomChance(8, 10)) {
						pokemon.trySetStatus('fro', pokemon.side.foe.active[0]);
					}
				} else if (this.effectData.layers == 5 && !['hail', 'sleet'].includes(pokemon.effectiveWeather())) {
					if (this.randomChance(5, 10)) {
						pokemon.trySetStatus('fro', pokemon.side.foe.active[0]);
					}
				} else if (this.effectData.layers == 5 && ['hail', 'sleet'].includes(pokemon.effectiveWeather())) {
					pokemon.trySetStatus('fro', pokemon.side.foe.active[0]);
				}
			}
		},
	},
	powdersnow: {
		inherit: true,
		secondary: {
			chance: 10,
			status: 'fro',
		},
	},
	refresh: {
		inherit: true,
		onHit(pokemon) {
			if (['', 'drz', 'fro'].includes(pokemon.status)) return false;
			pokemon.cureStatus();
		},
	},
	relicsong: {
		inherit: true,
		secondary: {
			chance: 10,
			status: 'drz',
		},
	},
	rest: {
		inherit: true,
		onTry(source) {
			if (source.status === 'drz' || source.hasAbility('comatose')) return false;

			if (source.hp === source.maxhp) {
				this.add('-fail', source, 'heal');
				return null;
			}
			if (source.hasAbility(['insomnia', 'vitalspirit'])) {
				this.add('-fail', source, '[from] ability: ' + source.getAbility().name, '[of] ' + source);
				return null;
			}
		},
		onHit(target, source, move) {
			if (!target.setStatus('drz', source, move)) return false;
			target.statusData.time = 3;
			target.statusData.startTime = 3;
			this.heal(target.maxhp); // Aesthetic only as the healing happens after you fall asleep in-game
		},
	},
	rollout: {
		inherit: true,
		basePowerCallback(pokemon, target, move) {
			let bp = move.basePower;
			if (pokemon.volatiles['rollout'] && pokemon.volatiles['rollout'].hitCount) {
				bp *= Math.pow(2, pokemon.volatiles['rollout'].hitCount);
			}
			if (pokemon.status !== 'drz') pokemon.addVolatile('rollout');
			if (pokemon.volatiles['defensecurl']) {
				bp *= 2;
			}
			this.debug("Rollout bp: " + bp);
			return bp;
		},
	},
	secretpower: {
		inherit: true,
		onModifyMove(move, pokemon) {
			if (this.field.isTerrain('')) return;
			move.secondaries = [];
			if (this.field.isTerrain('electricterrain')) {
				move.secondaries.push({
					chance: 30,
					status: 'par',
				});
			} else if (this.field.isTerrain('grassyterrain')) {
				move.secondaries.push({
					chance: 30,
					status: 'drz',
				});
			} else if (this.field.isTerrain('mistyterrain')) {
				move.secondaries.push({
					chance: 30,
					boosts: {
						spa: -1,
					},
				});
			} else if (this.field.isTerrain('psychicterrain')) {
				move.secondaries.push({
					chance: 30,
					boosts: {
						spe: -1,
					},
				});
			}
		},
	},
	sing: {
		inherit: true,
		status: 'drz',
	},
	sleeppowder: {
		inherit: true,
		status: 'drz',
	},
	sleeptalk: {
		inherit: true,
		onTry(source) {
			return source.status === 'drz' || source.hasAbility('comatose');
		},
	},
	snore: {
		inherit: true,
		onTry(source) {
			return source.status === 'drz' || source.hasAbility('comatose');
		},
	},
	spark: {
		inherit: true,
		wakesTarget: true,
	},
	spore: {
		inherit: true,
		status: 'drz',
	},
	triattack: {
		inherit: true,
		secondary: {
			chance: 20,
			onHit(target, source) {
				const result = this.random(3);
				if (result === 0) {
					target.trySetStatus('brn', source);
				} else if (result === 1) {
					target.trySetStatus('par', source);
				} else {
					target.trySetStatus('fro', source);
				}
			},
		},
	},
	uproar: {
		inherit: true,
		onTryHit(target) {
			for (const [i, allyActive] of target.side.active.entries()) {
				if (allyActive && allyActive.status === 'drz') allyActive.cureStatus();
				const foeActive = target.side.foe.active[i];
				if (foeActive && foeActive.status === 'drz') foeActive.cureStatus();
			}
		},
		condition: {
			duration: 3,
			onStart(target) {
				this.add('-start', target, 'Uproar');
			},
			onResidual(target) {
				if (target.lastMove && target.lastMove.id === 'struggle') {
					// don't lock
					delete target.volatiles['uproar'];
				}
				this.add('-start', target, 'Uproar', '[upkeep]');
			},
			onEnd(target) {
				this.add('-end', target, 'Uproar');
			},
			onLockMove: 'uproar',
			onAnySetStatus(status, pokemon) {
				if (status.id === 'drz') {
					if (pokemon === this.effectData.target) {
						this.add('-fail', pokemon, 'drz', '[from] Uproar', '[msg]');
					} else {
						this.add('-fail', pokemon, 'drz', '[from] Uproar');
					}
					return null;
				}
			},
		},
	},
	volttackle: {
		inherit: true,
		wakesTarget: true,
	},
	wakeupslap: {
		inherit: true,
		basePowerCallback(pokemon, target, move) {
			if (target.status === 'drz' || target.hasAbility('comatose')) return move.basePower * 2;
			return move.basePower;
		},
		onHit(target) {
			if (target.status === 'drz') target.cureStatus();
		},
	},
	wildcharge: {
		inherit: true,
		wakesTarget: true,
	},
	worryseed: {
		inherit: true,
		onHit(pokemon) {
			const oldAbility = pokemon.setAbility('insomnia');
			if (oldAbility) {
				this.add('-ability', pokemon, 'Insomnia', '[from] move: Worry Seed');
				if (pokemon.status === 'drz') {
					pokemon.cureStatus();
				}
				return;
			}
			return false;
		},
	},
	yawn: {
		inherit: true,
		onTryHit(target) {
			if (target.status || !target.runStatusImmunity('drz')) {
				return false;
			}
		},
		condition: {
			noCopy: true, // doesn't get copied by Baton Pass
			duration: 2,
			onStart(target, source) {
				this.add('-start', target, 'move: Yawn', '[of] ' + source);
			},
			onResidualOrder: 19,
			onEnd(target) {
				this.add('-end', target, 'move: Yawn', '[silent]');
				target.trySetStatus('drz', this.effectData.source);
			},
		},
	},
};
