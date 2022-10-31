export const Abilities: {[k: string]: ModdedAbilityData} = {
	baddreams: {
		inherit: true,
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) {
			if (!pokemon.hp) return;
			for (const target of pokemon.side.foe.active) {
				if (!target || !target.hp) continue;
				if (target.status === 'drz' || target.hasAbility('comatose') && (['newmoon'].includes(pokemon.effectiveWeather()))) {
					this.damage(target.baseMaxhp / 4, target, pokemon);
				} 
				else if (target.status === 'drz' || target.hasAbility('comatose')) {
					this.damage(target.baseMaxhp / 8, target, pokemon);
				}
				else return;
			}
		},
	},
	effectspore: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (move.flags['contact'] && !source.status && source.runStatusImmunity('powder')) {
				const r = this.random(100);
				if (r < 11) {
					source.setStatus('drz', target);
				} else if (r < 21) {
					source.setStatus('par', target);
				} else if (r < 30) {
					source.setStatus('psn', target);
				}
			}
		},
	},
	insomnia: {
		inherit: true,
		onUpdate(pokemon) {
			if (pokemon.status === 'drz') {
				this.add('-activate', pokemon, 'ability: Insomnia');
				pokemon.cureStatus();
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== 'drz') return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Insomnia');
			}
			return false;
		},
	},
	magmaarmor: {
		inherit: true,
		onUpdate(pokemon) {
			if (pokemon.status === 'fro') {
				this.add('-activate', pokemon, 'ability: Magma Armor');
				pokemon.cureStatus();
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'fro') return false;
		},
	},
	proteanmaximau: {
		inherit: true,
		onAfterSetStatus(status, target, source, effect) {
			if (!source || source === target) return;
			if (effect && effect.id === 'toxicspikes') return;
			if (status.id === 'drz' || status.id === 'fro') return;
			this.add('-activate', target, 'ability: Synchronize');
			// Hack to make status-prevention abilities think Synchronize is a status move
			// and show messages when activating against it.
			source.trySetStatus(status, target, {status: status.id, id: 'synchronize'} as Effect);
		},
	},
	sweetveil: {
		inherit: true,
		onAllySetStatus(status, target, source, effect) {
			if (status.id === 'drz') {
				this.debug('Sweet Veil interrupts sleep');
				const effectHolder = this.effectData.target;
				this.add('-block', target, 'ability: Sweet Veil', '[of] ' + effectHolder);
				return null;
			}
		},
	},
	synchronize: {
		inherit: true,
		onAfterSetStatus(status, target, source, effect) {
			if (!source || source === target) return;
			if (effect && effect.id === 'toxicspikes') return;
			if (status.id === 'drz' || status.id === 'fro') return;
			this.add('-activate', target, 'ability: Synchronize');
			// Hack to make status-prevention abilities think Synchronize is a status move
			// and show messages when activating against it.
			source.trySetStatus(status, target, {status: status.id, id: 'synchronize'} as Effect);
		},
	},
	vitalspirit: {
		inherit: true,
		onUpdate(pokemon) {
			if (pokemon.status === 'drz') {
				this.add('-activate', pokemon, 'ability: Vital Spirit');
				pokemon.cureStatus();
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== 'drz') return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Vital Spirit');
			}
			return false;
		},
	},
};
