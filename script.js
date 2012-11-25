
var
	dRest = document.getElementById('dRest'),
	dFirstIteration = document.getElementById('dFirstIteration'),
	dfAttackers = document.getElementById('dfAttackers'),
	dfDefenders = document.getElementById('dfDefenders'),
	dfNumSim = document.getElementById('dfNumSim'),
	btnFight = document.getElementById('btnFight'),

//	unitGroupGetNames = function (e) {
//		return e.name;
//	},

	/**
	 * return array of units
	 */
	dfToUnits = function (e) {
		var units = [];
		e.split(',').forEach(function (e) {
					var name = e.trim().match(/^([0-9]+)?\s*(.+)$/), i;
					if (name) {
						if (!name[1]) {
							name[1] = 1;
						}
						for (i = 0; i < name[1]; i += 1) {
							units.push(LIB_AA.unitFactory[name[2]]());
						}
					}
				});
		return units;
	},
	calculate = function () {
		var attackers = LIB_AA.newArmy(dfToUnits(dfAttackers.value)),
			defenders = LIB_AA.newArmy(dfToUnits(dfDefenders.value)),
			ul = dFirstIteration.getElementsByTagName('ul')[0],
			logFirstFight = function (attackers, defenders) {
				var
					returnName = function (a) {
						return a.name;
					};

				ul.innerHTML += '<li>' + attackers.map(returnName).join(',') + ' vs ' + defenders.map(returnName).join(',') + '</li>';
			},
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

		ul.innerHTML = '';

		for (i = 0; i < numSim; i += 1) {
			a = attackers.clone();
			d = defenders.clone();
			if (i === 1) {
				LIB_AA.events.add('afterFight', logFirstFight);
			}
			LIB_AA.fight(a, d);
			if (i === 1) {
				LIB_AA.events.remove('afterFight', logFirstFight);
			}
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
		dRest.innerHTML = 'win: ' + (win/numSim) +
			',<br/> draw: ' + (draw/numSim) +
			',<br/> lose: ' + (lose/numSim) +
		'<br>, avg attacker lost IPC: ' + (lostIPCa/numSim) +
		'<br>, avg defender lost IPC: ' + (lostIPCd/numSim);

	};
