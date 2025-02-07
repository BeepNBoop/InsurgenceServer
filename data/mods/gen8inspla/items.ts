export const Items: {[k: string]: ModdedItemData} = {
	aspearberry: {
		inherit: true,
		onUpdate(pokemon) {
			if (pokemon.status === 'fro') {
				pokemon.eatItem();
			}
		},
		onEat(pokemon) {
			if (pokemon.status === 'fro') {
				pokemon.cureStatus();
			}
		},
	},
	burntberry: {
		inherit: true,
		onUpdate(pokemon) {
			if (pokemon.status === 'fro') {
				pokemon.eatItem();
			}
		},
		onEat(pokemon) {
			if (pokemon.status === 'fro') {
				pokemon.cureStatus();
			}
		},
	},
	chestoberry: {
		inherit: true,
		onUpdate(pokemon) {
			if (pokemon.status === 'drz') {
				pokemon.eatItem();
			}
		},
		onEat(pokemon) {
			if (pokemon.status === 'drz') {
				pokemon.cureStatus();
			}
		},
	},
	rottenlumberry: {
		inherit: true,
		onEat(pokemon) {
			const result = this.random(5);
				if (result === 0) {
					pokemon.trySetStatus('brn', pokemon);
				} else if (result === 1) {
					pokemon.trySetStatus('par', pokemon);
				} else if (result === 2) {
					pokemon.trySetStatus('psn', pokemon);
				} else if (result === 3) {
					pokemon.trySetStatus('fro', pokemon);
				} else if (result === 4) {
					pokemon.trySetStatus('drz', pokemon);
				}
		},
	},
	mintberry: {
		inherit: true,
		name: "Mint Berry",
		spritenum: 65,
		isBerry: true,
		naturalGift: {
			basePower: 80,
			type: "Water",
		},
		onUpdate(pokemon) {
			if (pokemon.status === 'drz') {
				pokemon.eatItem();
			}
		},
		onEat(pokemon) {
			if (pokemon.status === 'drz') {
				pokemon.cureStatus();
			}
		},
		num: 150,
		gen: 2,
		isNonstandard: "Past",
	},
	rottenaspearberry: {
		inherit: true,
		onUpdate(pokemon) {
			pokemon.trySetStatus('fro', pokemon)},
	},
	rottenchestoberry: {
		inherit: true,
		onEat(pokemon) {
			pokemon.trySetStatus('drz', pokemon);
		},
	},
	snowball: {
		inherit: true,
		fling: {
			basePower: 30,
			status: 'fro',
		},
		onResidualOrder: 26,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			pokemon.trySetStatus('fro', pokemon);
		},
	}
};
