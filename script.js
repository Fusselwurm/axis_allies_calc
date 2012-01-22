Array.prototype.copy = (function (a) {
	var f = function (a) {
		return a;
	};
	return function () {
		return this.map(f);
	};
}());

var
	dfRest = document.getElementById('dfRest'),
	dfAttackers = document.getElementById('dfAttackers'),
	dfDefenders = document.getElementById('dfDefenders'),
	dfNumSim = document.getElementById('dfNumSim'),
	btnFight = document.getElementById('btnFight'),
	newArmy = function (units) {

			units.getIPC = function () {
				return units.reduce(function (sum, u) {
					return sum + u.cost;
				}, 0);
			};
			units.getInitialIPC = (function () {
				var ipc = units.getIPC();
				return function () {
					return ipc;
				};
			}());
			units.clone = function () {
				return newArmy(units.copy());
			};

			return units;
	},

	/**
	 * missing are modificators like
	 * "combined arms"
	 * naval base / air base
	 */
	unitFactory = {
		battleship: function () {
			return {
				name: "battleship",
				name_de: "Schlachtschiff",
				attack: 4,
				defense: 4,
				move: 2,
				cost: 20

			};
		},
		cruiser: function () {
			return {
				name: "cruiser",
				name_de: "Kreuzer",
				attack: 3,
				defense: 3,
				move: 2,
				cost: 12
			};
		},
		destroyer: function () {
			return {
				name: "destroyer",
				name_de: "Zerstörer",
				attack: 2,
				defense: 2,
				move: 2,
				cost: 8
			};
		},
		submarine: function () {
			return {
				name: "submarine",
				name_de: "U-Boot",
				attack: 2,
				defense: 1,
				move: 2,
				cost: 6
			};
		},
		transport: function () {
			return {
				name: "transport",
				name_de: "Transportschiff",
				attack: 0,
				defense: 0,
				move: 2,
				cost: 7
			};
		},
		tank: function () {
			return {
				name: "tank",
				name_de: "Panzer",
				attack: 3,
				defense: 3,
				move: 2,
				cost: 6
			};
		},
		mech_inf: function () {
			return {
				name: "mech_inf",
				name_de: "Panzergrenadiere",
				attack: 1,
				defense: 1,
				move: 2,
				cost: 4
			};
		},
		artillery: function () {
			return {
				name: "artillery",
				name_de: "Artillerie",
				attack: 2,
				defense: 2,
				move: 1,
				cost: 4
			};
		},
		infantry: function () {
			return {
				name: "infantry",
				name_de: "Infanterie",
				attack: 1,
				defense: 2,
				move: 1,
				cost: 3
			};
		},
		bomber: function () {
			return {
				name: "bomber",
				name_de: "Bomber",
				attack: 4,
				defense: 1,
				move: 6,
				cost: 12
			};
		},
		tactical_bomber: function () {
			return {
				name: "tactical_bomber",
				name_de: "Stuka",
				attack: 4,
				defense: 3,
				move: 4,
				cost: 11
			};
		},
		fighter: function () {
			return {
				name: "fighter",
				name_de: "Jäger",
				attack: 3,
				defense: 4,
				move: 4,
				cost: 10
			};
		},
		industry_major: function () {
			return {
				name: "industry_major",
				name_de: "großer Industriekomplex",
				attack: 0, // 1 against bombing raids
				defense: 0,
				move: 0,
				cost: 30
			}
		},
		industry_minor: function () {
			return {
				name: "industry_minor",
				name_de: "kleiner Industriekomplex",
				attack: 0,
				defense: 0,
				move: 0,
				cost: 15
			};
		},
		naval_base: function () {
			return {
				name: "naval_base",
				name_de: "Marinestützpunkt",
				cost: 15,
				attack: 0,
				defense: 0,
				move: 0
			};
		},
		air_base: function () {
			return {
				name: "air_base",
				name_de: "Fliegerhorst",
				cost: 15,
				attack: 0,
				defense: 0,
				move: 0
			};
		},
		anti_aircraft: function () {
			return {
				name: "anti_aircraft",
				name_de: "Flugabwehrkanone",
				cost: 6,
				attack: 0,
				defense: 0,
				move: 1
			};
		}
	},
	attack = function (attackStrength) {
		return attackStrength >= Math.ceil(Math.random() * 6);
		//return attackStrength >= Math.ceil(0.5 * 6);
	},

	fightStep = function (attackers, defenders) {
		var
			attackerHits = attackers.reduce(function (prev, u) {
				if (attack(u.attack)) {
					prev += 1;
				}
				return prev;
			}, 0),
			defenderHits = defenders.reduce(function (prev, u) {
				if (attack(u.defense)) {
					prev += 1;
				}
				return prev;
			}, 0);

		attackers.splice(0, defenderHits);
		defenders.splice(0, attackerHits);
	},


	fight = function (attackers, defenders) {
		while (attackers.length && defenders.length) {
			fightStep(attackers, defenders);
			//console.log(attackers.length, defenders.length);
		}
	},

	unitGroupGetNames = function (e) {
		return e.name;
	},


	dfToUnits = function (e) {
		var units = [];
		e.split(',').forEach(function (e) {
					var name = e.trim().match(/^([0-9]+)?\s*(.+)$/), i;
					if (name) {
						if (!name[1]) {
							name[1] = 1;
						}
						for (i = 0; i < name[1]; i += 1) {
							units.push(unitFactory[name[2]]());
						}
					}
				});
		return units;
	},
	calculate = function () {
		var attackers = newArmy(dfToUnits(dfAttackers.value)),
			defenders = newArmy(dfToUnits(dfDefenders.value)),
			numSim = dfNumSim.value,
			i,
			win = 0,
			draw = 0,
			lose = 0,
			lostIPCa = 0,
			lostIPCd = 0,
			tmp,
			a,
			d;

		for (i = 0; i < numSim; i += 1) {
			a = attackers.clone();
			d = defenders.clone();
			fight(a, d);
			tmp = (a.length - d.length);
			if (!tmp) {
				draw += 1;
				lostIPCd += d.getInitialIPC();
				lostIPCa += a.getInitialIPC();
			} else if (tmp > 0) {
				win += 1;
				lostIPCa += a.getInitialIPC() - a.getIPC();
				lostIPCd += d.getInitialIPC();
			} else {
				lose += 1;
				lostIPCa += a.getInitialIPC();
				lostIPCd += d.getInitialIPC() - d.getIPC();
			}
		}

		//dfRest.innerText = JSON.stringify(attackers.map(unitGroupGetNames)) + '\n' + JSON.stringify(defenders.map(unitGroupGetNames));
		dfRest.innerHTML = 'win: ' + (win/numSim) +
			',<br/> draw: ' + (draw/numSim) +
			',<br/> lose: ' + (lose/numSim) +
		'<br>, avg attacker lost IPC: ' + (lostIPCa/numSim) +
		'<br>, avg defender lost IPC: ' + (lostIPCd/numSim);

	};



btnFight.addEventListener('click', calculate);
window.addEventListener('keyup', function (e) {
	//console.log(e);
	if (e.keyCode === 13) {
		calculate();
	}

});




