
LIB_AA = (function () {

	var
		/**
		 * @param units array of units
		 * @return array containing said units with a few special methods
		 */
		newArmy = function (units) {
				units = units.copy();

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
					return newArmy(units);
				};

				units.byType = function (name) {
					return units.filter(function (u) {
						return u.name === name;
					});
				};

				return units;
		},
		/**
		 * map: which unit combined with which other unit gets which attack bonus
		 */
		combinedArmsRules = {
			infantry: {artillery: 1},
			mech_inf: {artillery: 1},
			tactical_bomber: { fighter: 1, tank: 1},
			/**
			 *
			 * @param unitName name of the unit
			 * @param fn callback function that, for each of this unit's combined arms rule,
			 *                    will be passed two parameters:
			 *                    the attack bonus and the associated unit's name
			 */
			iterate: function (unitName, fn) {
				var
					n,
					ruleSet = combinedArmsRules[unitName];

				if (!ruleSet) {
					return;
				}
				for (n in ruleSet) {
					if (ruleSet.hasOwnProperty(n)) {
						fn(ruleSet[n], n);
					}
				}
			}
		},
		/**
		 * missing are special rules for naval battles, amphibious assaults, anti-aircraft guns et al
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
					attack: 3,
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

		/**
		 * one round within a battle:
		 *
		 * attackers and defenders each throw their dice for all their units,
		 * units to be hit are selected & removed
		 */
		fightStep = function (attackers, defenders) {
			var
				/**
				 * this array collects those units that
				 * have already been registered as "used" for a combined arms attack
				 */
				usedByCombinedArms = [],
				attackerHits = attackers.reduce(function (prev, u) {
					var attackStrength = u.attack;

					// apply modifiers to units attack strength:
					combinedArmsRules.iterate(u.name, function (attackBonus, unitName) {
						attackers.some(function (otherUnit) {
							if ((otherUnit.name === unitName) && (usedByCombinedArms.indexOf(otherUnit) === -1)) {
								usedByCombinedArms.push(otherUnit);
								attackStrength += attackBonus;
							}
						});
					});
					// console.log('attacker: ' + u.name + ': ' + attackStrength);
					if (attack(attackStrength)) {
						prev += 1;
					}
					return prev;
				}, 0),

				defenderHits = defenders.reduce(function (prev, u) {
					var attackStrength = u.defense;

					// apply modifiers to units attack strength... no.
					// combined forces modifiers only apply to attacking units
					// console.log('defender: ' + u.name + ': ' + attackStrength);
					if (attack(attackStrength)) {
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
			}
	//		console.log(
	//			(attackers.map(function (u) {
	//			return u.name;
	//		}).join(', ') || ' -- ') + '; ' +
	//			(defenders.map(function (u) {
	//			return u.name;
	//		}).join(', ') || ' -- '));
		};







	return {
		unitFactory: unitFactory,
		fight: fight,
		newArmy: newArmy
	};
}());
