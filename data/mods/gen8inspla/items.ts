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
};
