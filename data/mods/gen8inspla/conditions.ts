export const Conditions: {[k: string]: ModdedConditionData} = {
	fro: {
		name: 'fro',
		effectType: 'Status',
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.id === 'frostorb') {
				this.add('-status', target, 'frz', '[from] item: Frost Orb');
			} else if (sourceEffect && sourceEffect.effectType === 'Ability') {
				this.add('-status', target, 'frz', '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else {
				this.add('-status', target, 'frz');
			}
			if (target.species.name === 'Shaymin-Sky' && target.baseSpecies.baseSpecies === 'Shaymin') {
				target.formeChange('Shaymin', this.effect, true);
			}
		},
		// Damage reduction is handled directly in the sim/battle.js damage function
		onResidualOrder: 9,
		onResidual(pokemon) {
			this.damage(pokemon.baseMaxhp / 16);
		},
		onModifyMove(move, pokemon) {
			if (move.flags['defrost']) {
				this.add('-curestatus', pokemon, 'frz', '[from] move: ' + move);
				pokemon.setStatus('');
			}
		},
		onHit(target, source, move) {
			if (move.thawsTarget || move.type === 'Fire' && move.category !== 'Status') {
				target.cureStatus();
			}
		},
	},
	drz: {
		name: 'drz',
		effectType: 'Status',
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.effectType === 'Ability') {
				this.add('-status', target, 'drz', '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else if (sourceEffect && sourceEffect.effectType === 'Move') {
				this.add('-status', target, 'drz', '[from] move: ' + sourceEffect.name);
			} else {
				this.add('-status', target, 'drz');
			}
			// 1-3 turns
			this.effectData.startTime = 3;
			this.effectData.time = this.effectData.startTime;
		},
		onHit(target, source, move) {
			if (move.wakesTarget) {
				target.cureStatus();
			}
		},
		onBeforeMovePriority: 3,
		onBeforeMove(pokemon, target, move) {
			if (pokemon.hasAbility('earlybird')) {
				pokemon.statusData.time--;
			}
			pokemon.statusData.time--;
			if (pokemon.statusData.time <= 0) {
				pokemon.cureStatus();
				return;
			}
			this.add('cant', pokemon, 'drz');
			if (move.sleepUsable || (!this.field.isWeather('sleet') && !this.field.isWeather('hail') && this.randomChance(1, 4))) {
				return;
			} else if ((this.field.isWeather('sleet') || this.field.isWeather('hail')) && this.randomChance(33, 100)) {
				return;
			}
			return false;
		},
	},
};
