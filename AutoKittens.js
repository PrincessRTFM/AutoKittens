/*
AutoKittens.js - helper script for the Kittens Game (http://bloodrizer.ru/games/kittens/)

Original author: Michael Madsen <michael@birdiesoft.dk>
Current maintainer: Lilith Song <lsong@princessrtfm.com>
Repository: https://github.princessrtfm.com/AutoKittens/

Last built at 13:10:56 on Friday, April 17, 2020 UTC

#AULBS:1587129056#
*/

/* eslint-env browser, jquery */
/* global game, LCstorage, resetGameLogHeight, dojo, autoOptions:writable, autoKittensCache, gameData */

const defaultTimeFormat = game.toDisplaySeconds;
const gameTickFunc = game.tick;
const checkInterval = 200;
let calculators = [];
const percentages = [
	[
		"1%",
		0.01,
	],
	[
		"5%",
		0.05,
	],
	[
		"10%",
		0.1,
	],
	[
		"20%",
		0.2,
	],
	[
		"25%",
		0.25,
	],
	[
		"30%",
		0.3,
	],
	[
		"40%",
		0.4,
	],
	[
		"50%",
		0.5,
	],
	[
		"60%",
		0.6,
	],
	[
		"70%",
		0.7,
	],
	[
		"75%",
		0.75,
	],
	[
		"80%",
		0.8,
	],
	[
		"90%",
		0.9,
	],
	[
		"95%",
		0.95,
	],
	[
		"98%",
		0.98,
	],
	[
		"99%",
		0.99,
	],
	[
		"99.5%",
		0.995,
	],
	[
		"99.9%",
		0.999,
	],
	[
		"100%",
		1,
	],
];
const faithPercentages = [
	[
		"0%",
		0,
	],
	[
		"0.1%",
		0.001,
	],
].concat(percentages);
// More than APPROXIMATELY this many gigaflops will hit AI level 15, causing the AIpocalypse.
const gigaflopSafeMax = Math.exp(14.5) - 0.1;

const defaultOptions = {
	warnOnLeave: true,
	autoStar: true,
	autoCraft: false,
	autoHunt: false,
	autoPray: false,
	autoResetFaith: false,
	autoTrade: false,
	craftOptions: {
		craftLimit: 0.99,
		secondaryCraftLimit: 0.6,
		craftWood: false,
		woodAmount: 10,
		woodInterval: 15,
		craftBeam: false,
		beamAmount: 1,
		beamInterval: 20,
		craftSlab: false,
		slabAmount: 1,
		slabInterval: 20,
		craftPlate: false,
		plateAmount: 1,
		plateInterval: 20,
		craftSteel: false,
		steelAmount: 1,
		steelInterval: 5,
		craftConcrete: false,
		concreteAmount: 1,
		concreteInterval: 100,
		craftGear: false,
		gearAmount: 1,
		gearInterval: 50,
		craftAlloy: false,
		alloyAmount: 1,
		alloyInterval: 200,
		craftEludium: false,
		eludiumAmount: 1,
		eludiumInterval: 500,
		craftScaffold: false,
		scaffoldAmount: 1,
		scaffoldInterval: 50,
		craftShip: false,
		shipAmount: 1,
		shipInterval: 100,
		craftTanker: false,
		tankerAmount: 1,
		tankerInterval: 200,
		craftKerosene: false,
		keroseneAmount: 1,
		keroseneInterval: 20,
		craftThorium: false,
		thoriumAmount: 1,
		thoriumInterval: 50,
		craftMegalith: false,
		megalithAmount: 1,
		megalithInterval: 20,
		craftBloodstone: false,
		bloodstoneAmount: 1,
		bloodstoneInterval: 100,
		craftParchment: false,
		parchmentAmount: 1,
		parchmentInterval: 30,
		craftManuscript: false,
		manuscriptAmount: 1,
		manuscriptInterval: 80,
		craftCompendium: false,
		compendiumAmount: 1,
		compendiumInterval: 250,
		craftBlueprint: false,
		blueprintAmount: 1,
		blueprintInterval: 500,
		blueprintPriority: false,
	},
	dialogRight: false,
	forceShadow: false,
	forceShadowGlobal: false,
	furOptions: {
		parchmentMode: 0,
		manuscriptMode: 0,
		compendiumMode: 0,
		blueprintMode: 0,
	},
	huntOptions: {
		huntLimit: 0.99,
		suppressHuntLog: false,
		huntEarly: true,
		singleHunts: false,
		craftParchment: false,
		craftManuscript: false,
		craftCompendium: false,
		craftBlueprint: false,
	},
	prayLimit: 0.99,
	widenUI: false,
	displayOptions: {},
	displayOrder: "standard",
	timeDisplay: "standard",
	perfectLeadership: false,
	tradeOptions: {
		tradeCount: 1,
		tradeLimit: 0.99,
		suppressTradeLog: false,
		tradePartner: "",
		tradeSpring: false,
		tradePartnerSpring: "",
		tradeSummer: false,
		tradePartnerSummer: "",
		tradeAutumn: false,
		tradePartnerAutumn: "",
		tradeWinter: false,
		tradePartnerWinter: "",
		playMarket: true,
		buyBlackcoinBelow: 900,
	},
	showTimerDisplays: true,
};
const craftingTickTracker = Object.create(null);
window.autoOptions = defaultOptions;

function ownProp(target, prop) {
	return Object.prototype.hasOwnProperty.call(target, prop);
}
function iterateObject(obj, callback) {
	for (const key of Object.keys(obj)) {
		callback.call(obj, obj[key], key, obj);
	}
	return obj;
}

const NOP = () => {
	// no-op
};

function setArbitrarilyDeepObject(location, value, initialTarget) {
	let target = initialTarget || window;
	if (Array.isArray(location)) {
		location = location.join('.');
	}
	const segments = location.split('.');
	const lastPoint = segments.pop();
	let nextPoint;
	while ((nextPoint = segments.shift())) {
		if (typeof target[nextPoint] == 'undefined' || target[nextPoint] === null) {
			target[nextPoint] = {};
		}
		target = target[nextPoint];
	}
	target[lastPoint] = value;
}
function wrapCallback(trigger) {
	if (typeof trigger == 'function') {
		return trigger;
	}
	else if (typeof trigger == 'string') {
		trigger = trigger.replace(";", '').replace("()", '');
		if (typeof window[trigger] == 'function') {
			return window[trigger];
		}
	}
	return NOP;
}
function runCallback(callback, ...args) {
	return wrapCallback(callback)(...args);
}
function tryNumericSet(collection, attrName, value) {
	const newVal = parseFloat(value);
	if (!isNaN(newVal) && isFinite(newVal) && newVal > 0) {
		setArbitrarilyDeepObject([
			collection,
			attrName,
		], newVal);
	}
}
function copyObject(source, target) {
	for (const attrname in source) {
		if (typeof source[attrname] === "object") {
			if (typeof target[attrname] === "undefined") {
				target[attrname] = {};
			}
			copyObject(source[attrname], target[attrname]);
		}
		else if (attrname == 'supressHuntLog') { // Fixing a typo
			target.suppressHuntLog = source[attrname];
		}
		else {
			target[attrname] = source[attrname];
		}
	}
}

function shortTimeFormat(secondsRaw) {
	const secondsNumeric = parseInt(secondsRaw, 10); // don't forget the second param
	const days = Math.floor(secondsNumeric / 86400);
	const hours = Math.floor(secondsNumeric % 86400 / 3600);
	const minutes = Math.floor(secondsNumeric % 3600 / 60);
	const seconds = secondsNumeric % 60;
	let timeFormated = "";
	if (days) {
		timeFormated += `${days}:`;
	}
	if (timeFormated) {
		timeFormated += `${String(hours).padStart(2, 0)}:`;
	}
	else if (hours) {
		timeFormated += `${hours}:`;
	}
	timeFormated += `${String(minutes).padStart(2, 0)}:${String(seconds).padStart(2, 0)}`;
	return timeFormated;
}
function rawSecondsFormat(secondsRaw) {
	return `${parseInt(secondsRaw, 10)}s`;
}

if (LCstorage["kittensgame.autoOptions"]) {
	copyObject(JSON.parse(LCstorage["kittensgame.autoOptions"]), window.autoOptions);
}

function checkUpdate() {
	const AULBS = '1587129056';
	const SOURCE = 'https://princessrtfm.github.io/AutoKittens/AutoKittens.js';
	const button = $('#autokittens-checkupdate');
	const onError = (xhr, stat, err) => {
		button.val('Update check failed!');
		console.group("AK Update Check (failure)");
		console.info('Status value:', stat);
		console.info('Error value:', err);
		console.groupEnd();
	};
	const doCheck = (data, stat, xhr) => {
		if (typeof data != 'string') {
			return void onError(xhr, stat, data);
		}
		const liveVersion = data.match(/#AULBS:(\d+)#/u);
		if (!liveVersion) {
			return void onError(xhr, 'no version string', data);
		}
		const liveStamp = parseInt(liveVersion[1], 10);
		if (liveStamp > parseInt(AULBS, 10)) {
			button.val('Update found!');
		}
		else if (liveStamp < AULBS) {
			button.val('Release behind live');
		}
		else {
			button.val('No update available');
		}
	};
	try {
		button.val('Checking...');
		$.ajax(SOURCE, {
			method: 'GET',
			cache: false,
			dataType: 'text',
			error: onError,
			success: doCheck,
		});
	}
	catch (e) {
		onError(null, 'request failed', e);
	}
}

function saveAutoOptions() {
	LCstorage["kittensgame.autoOptions"] = JSON.stringify(window.autoOptions);
}
function changeFurCrafts() {
	const crafts = [
		[
			"parchmentMode",
			"craftParchment",
		],
		[
			"manuscriptMode",
			"craftManuscript",
		],
		[
			"compendiumMode",
			"craftCompendium",
		],
		[
			"blueprintMode",
			"craftBlueprint",
		],
	];
	for (let i = 0; i < crafts.length; i++) {
		// Man, I wish I could remember what the fuck I was doing here
		window.autoOptions.huntOptions[crafts[i][1]] = !!(window.autoOptions.furOptions[crafts[i][0]] & 1);
		window.autoOptions.craftOptions[crafts[i][1]] = !!(window.autoOptions.furOptions[crafts[i][0]] & 2);
	}
	saveAutoOptions();
}

function tryCraft(craftName, amount) {
	// Really rudimentary "do we have enough stuff to craft this?" check
	// If so, crafts it and returns true for success
	const craft = game.workshop.getCraft(craftName);
	const prices = craft.prices;
	for (let i = 0; i < prices.length; i++) {
		const res = game.resPool.get(prices[i].name);
		if (res.value < prices[i].val * amount) {
			return false;
		}
	}
	game.craft(craftName, amount);
	return true;
}

function changeTimeFormat() {
	const formats = {
		standard: defaultTimeFormat,
		short: shortTimeFormat,
		seconds: rawSecondsFormat,
	};
	game.toDisplaySeconds = formats[autoOptions.timeDisplay];
}

function handleDisplayOptions(obj) {
	for (const o in obj) {
		if (ownProp(obj, o)) {
			const toggle = $(`#autoKittens_show${o}`);
			if (toggle.length) { // The toggle might not exist yet, since the UI overhaul
				toggle[0].checked = obj[o];
			}
		}
	}
}
function traverseObject(obj) {
	for (const o in obj) {
		if (o === "displayOptions") {
			handleDisplayOptions(obj[o]);
		}
		else if (typeof obj[o] === "object") {
			traverseObject(obj[o]);
		}
		else if (typeof obj[o] === "boolean") {
			const elms = $(`#autoKittens_${o}`);
			if (elms && elms[0]) {
				elms[0].checked = obj[o];
			}
		}
		else {
			const elms = $(`#autoKittens_${o}`);
			if (elms && elms[0]) {
				elms[0].value = obj[o];
			}
		}
	}
}

function updateOptionsUI() {
	const crafts = [
		[
			"manuscriptMode",
			"craftManuscript",
		],
		[
			"compendiumMode",
			"craftCompendium",
		],
		[
			"blueprintMode",
			"craftBlueprint",
		],
	];
	for (let i = 0; i < crafts.length; i++) {
		autoOptions.furOptions[crafts[i][0]]
			= Number(autoOptions.huntOptions[crafts[i][1]])
			+ 2
			* autoOptions.craftOptions[crafts[i][1]];
	}
	traverseObject(autoOptions);
	changeTimeFormat();
}

function adjustColumns() {
	$('#midColumn').css('width', autoOptions.widenUI ? '1000px' : '');
	$('#leftColumn').css('max-width', autoOptions.widenUI ? '25%' : '');
}
function adjustTimerBar() {
	if (autoOptions.showTimerDisplays) {
		$('html')
			.first()
			.addClass('autokittens-show-timers');
	}
	else {
		$('html')
			.first()
			.removeClass('autokittens-show-timers');
	}
}

function addTriggerNamedCheckbox(container, prefix, optionName, controlName, caption, trigger) {
	container
		.append($(`<input id="autoKittens_${controlName}" type="checkbox" />`)
			.on('input', function updateAutoKittensCheckboxSettingOnValueChange() {
				setArbitrarilyDeepObject([
					prefix,
					optionName,
				], this.checked);
				saveAutoOptions();
				runCallback(trigger);
			}), $(`<label for="autoKittens_${controlName}">${caption}</label>`), '<br />');
}
function addTriggerCheckbox(container, prefix, optionName, caption, trigger) {
	addTriggerNamedCheckbox(container, prefix, optionName, optionName, caption, trigger);
}
function addNamedCheckbox(container, prefix, optionName, controlName, caption) {
	addTriggerNamedCheckbox(container, prefix, optionName, controlName, caption, NOP);
}
function addCheckbox(container, prefix, optionName, caption) {
	addNamedCheckbox(container, prefix, optionName, optionName, caption);
}

function addHeading(container, title) {
	container.append(`<h3>${title}</h3>`);
}

function addTriggerOptionMenu(container, prefix, optionName, leftCaption, options, rightCaption, trigger) {
	const select = $(`<select id="autoKittens_${optionName}"></select>`)
		.on('input', function updateAutoKittensDropdownSettingOnValueChange() {
			setArbitrarilyDeepObject([
				prefix,
				optionName,
			], $(this).val());
			saveAutoOptions();
			runCallback(trigger);
		});
	for (let i = 0; i < options.length; i++) {
		const option = options[i];
		if (Array.isArray(option)) {
			select.append(`<option value="${options[i][1]}">${options[i][0]}</option>`);
		}
		else {
			select.append(`<option value="${options[i].value}">${options[i].label}</option>`);
		}
	}
	if (leftCaption.trim()) {
		leftCaption = `${leftCaption.trim()} `;
	}
	if (rightCaption.trim()) {
		rightCaption = ` ${rightCaption.trim()}`;
	}
	container.append(leftCaption, select, rightCaption, '<br />');
}
function addOptionMenu(container, prefix, optionName, leftCaption, options, rightCaption) {
	addTriggerOptionMenu(container, prefix, optionName, leftCaption, options, rightCaption, NOP);
}

function addTriggerButton(container, caption, trigger, hint) {
	const button = $('<input type="button" />').attr('value', caption)
		.on('click', wrapCallback(trigger));
	if (hint) {
		button.attr('title', hint);
	}
	container.append(button, '<br />');
	return button;
}

function addIndent(container) {
	container.append('<span style="width:20px; display:inline-block;"></span>');
}

function addInputField(container, prefix, optionName, leftCaption, rightCaption) {
	const field = $(`<input id="autoKittens_${optionName}" size="6" type="text" />`)
		.on('input', function updateAutoKittensTextSettingOnValueChanged() {
			tryNumericSet(prefix, optionName, this.value);
			saveAutoOptions();
		});
	if (leftCaption.trim()) {
		leftCaption = `${leftCaption.trim()} `;
	}
	if (rightCaption.trim()) {
		rightCaption = ` ${rightCaption.trim()}`;
	}
	container.append(leftCaption, field, rightCaption, '<br />');
}

function prepareContainer(id) {
	let result;
	if (typeof id == "object") {
		result = id;
	}
	else {
		result = $(`#${id}`);
	}
	const containerID = result.attr('id').toLowerCase();
	const closeLink = $('<a class="close" href="#">close</a>').on('click', () => {
		$('.autokittens-dialog').hide();
	});
	const backLink = $('<a class="close" href="#">back</a>').on('click', () => {
		$('.autokittens-dialog').hide();
		$('#akSettingsMaster').show();
	});
	const linkContainer = $('<span style="top: 10px; right: 15px; position: absolute;"></span>').append(closeLink);
	if (containerID.startsWith('aksettings') && !containerID.endsWith('master')) {
		linkContainer.prepend(backLink, ' | ');
	}
	result.empty().append(linkContainer);
	return result;
}

function formatTableRow(name, title, value) {
	if (typeof autoOptions.displayOptions[name] === 'undefined') {
		autoOptions.displayOptions[name] = true;
	}
	if (autoOptions.displayOptions[name]) {
		return `<td style="text-align:center">${title}<br />${value}</td>`;
	}
	return '';
}
function fillTable() {
	let contents = '<tr>';
	const tickRate = game.getTicksPerSecondUI();
	const resources = [];
	for (let resIndex = 0; resIndex < game.resPool.resources.length; resIndex++) {
		const r = game.resPool.resources[resIndex];
		const res = {};
		res.name = r.name;
		res.title = r.title || r.name;
		// Is this the right property name for this? No.
		// Am I willing to refactor all of this to do it right? Also no.
		res.perTickUI = game.getResourcePerTick(res.name, true);
		res.value = r.value;
		res.maxValue = r.maxValue;
		if (res.perTickUI !== 0) {
			if (res.maxValue > 0) {
				if (res.value <= 0) {
					res.time = 0;
				}
				else if (res.value >= r.maxValue) {
					res.time = 0;
				}
				else if (res.perTickUI > 0) {
					res.time = (res.maxValue - res.value) / (res.perTickUI * tickRate);
				}
				else if (res.perTickUI < 0) {
					res.time = -r.value / (res.perTickUI * tickRate);
				}
			}
			else if (res.value > 0 && res.perTickUI < 0) {
				res.time = -r.value / (res.perTickUI * tickRate);
			}
		}
		resources.push(res);
	}
	if (autoOptions.displayOrder == "short") {
		resources.sort((a, b) => a.time - b.time);
	}
	else if (autoOptions.displayOrder == "long") {
		resources.sort((a, b) => b.time - a.time);
	}
	for (let i = 0; i < resources.length; i++) {
		const r = resources[i];
		const name = r.name;
		const title = r.title;
		if (r.perTickUI !== 0) {
			if (r.maxValue > 0) {
				if (r.value <= 0) {
					contents += formatTableRow(name, title, 'Empty');
				}
				else if (r.value >= r.maxValue) {
					contents += formatTableRow(name, title, 'Full');
				}
				else if (r.perTickUI > 0) {
					contents += formatTableRow(
						name,
						title,
						game.toDisplaySeconds(
							(r.maxValue - r.value) / (r.perTickUI * tickRate)
						)
					);
				}
				else if (r.perTickUI < 0) {
					contents += formatTableRow(
						name,
						title,
						`-${game.toDisplaySeconds(-r.value / (r.perTickUI * tickRate))}`
					);
				}
				else {
					// value > 0 && value < maxValue && (perTickUI || perTickCached) == 0
					contents += formatTableRow(name, title, "Err1");
				}
			}
			else if (r.value > 0 && r.perTickUI < 0) {
				contents += formatTableRow(
					name,
					title,
					`-${game.toDisplaySeconds(-r.value / (r.perTickUI * tickRate))}`
				);
			}
		}
		// else contents += formatTableRow(name, title, "Steady");
	}
	contents += '</tr>';
	document.getElementById('timerTable').innerHTML = contents;
}

function mintCalculator() {
	const hunterRatio = game.getEffect("hunterRatio") + game.village.getEffectLeader("manager", 0);
	const expectedFursFromHunts = 32.5 * (hunterRatio + 1);
	let expectedIvoryFromHunts = 20 * (hunterRatio + 1);
	if (2 * hunterRatio < 55) {
		expectedIvoryFromHunts *= 1 - (55 - 2 * hunterRatio) / 100;
	}
	const mintBuildingData = game.bld.getBuildingExt('mint');
	const mintsRunning = mintBuildingData.get('on');
	const catpower = game.resPool.get("manpower");
	const catpowerRateBase = (catpower.perTickUI || catpower.perTickCached) * game.ticksPerSecond;
	const catpowerRateWithMints
		= (
			(catpower.perTickUI || catpower.perTickCached)
			+ mintBuildingData.get('effects').manpowerPerTickCon
			* mintsRunning
		)
		* game.ticksPerSecond;
	const huntTimeWithoutMint = 100 / catpowerRateBase;
	const huntTimeWithMint = 100 / catpowerRateWithMints;
	const fpsHuntsNoMints = expectedFursFromHunts / huntTimeWithoutMint;
	const ipsHuntsNoMints = expectedIvoryFromHunts / huntTimeWithoutMint;
	let fpsHuntsWithMint = expectedFursFromHunts / huntTimeWithMint;
	let ipsHuntsWithMint = expectedIvoryFromHunts / huntTimeWithMint;
	const fpsFromMint = mintBuildingData.get('effects').fursPerTickProd * mintsRunning * game.ticksPerSecond;
	const ipsFromMint = mintBuildingData.get('effects').ivoryPerTickProd * mintsRunning * game.ticksPerSecond;
	fpsHuntsWithMint += fpsFromMint;
	ipsHuntsWithMint += ipsFromMint;
	const fpsProfitWithMints = fpsFromMint + fpsHuntsWithMint - fpsHuntsNoMints;
	const ipsProfitWithMints = ipsFromMint + ipsHuntsWithMint - ipsHuntsNoMints;
	const mintNoun = `mint${mintsRunning == 1 ? '' : 's'}`;
	const mintString = `${mintsRunning} ${mintNoun}`;
	const fpsLossTag = fpsProfitWithMints < 0 ? ' (LOSS)' : '';
	const ipsLossTag = ipsProfitWithMints < 0 ? ' (LOSS)' : '';
	const totalFursPerSecond = game.getDisplayValue(fpsHuntsWithMint + fpsFromMint);
	const totalIvoryPerSecond = game.getDisplayValue(ipsHuntsWithMint + ipsFromMint);
	const result = [];
	result.push(`Average furs per hunt: ${game.getDisplayValue(expectedFursFromHunts)}`);
	result.push(`Average ivory per hunt: ${game.getDisplayValue(expectedIvoryFromHunts)}`);
	result.push(`Average time between hunts (no mints): ${game.getDisplayValue(huntTimeWithoutMint)} sec`);
	result.push(`Approximate furs per second (hunts, no mints): ${game.getDisplayValue(fpsHuntsNoMints)}`);
	result.push(`Approximate ivory per second (hunts, no mints): ${game.getDisplayValue(ipsHuntsNoMints)}`);
	result.push(`Average time between hunts (${mintString}): ${game.getDisplayValue(huntTimeWithMint)}`);
	result.push(`Approximate furs per second (hunts, ${mintString}): ${totalFursPerSecond}`);
	result.push(`Approximate ivory per second (hunts, ${mintString}): ${totalIvoryPerSecond}`);
	result.push(`<br />Profit from ${mintsRunning} running ${mintNoun}:`);
	result.push(`Furs per second: ${game.getDisplayValue(fpsProfitWithMints)}${fpsLossTag}`);
	result.push(`Ivory per second: ${game.getDisplayValue(ipsProfitWithMints)}${ipsLossTag}`);
	return result.join("<br />");
}

function aiCalculator() {
	const gflopsRes = gameData.gigaflops;
	const hashRes = gameData.hashes;
	const aiCoreData = game.bld.get('aiCore');
	const entanglerData = game.space.getBuilding('entangler');
	const gigaflops = gflopsRes.value;
	const hashes = hashRes.value;
	const hashesPerTick = hashRes.perTickUI || hashRes.perTickCached;
	const hashLevel = gameData.hashLevel;
	const gigaflopsPerTick = gflopsRes.perTickUI || gflopsRes.perTickCached;
	const gigaflopProdPerTickRaw = aiCoreData.effects.gflopsPerTickBase;
	const gigaflopProdPerTickEffective = gigaflopProdPerTickRaw * aiCoreData.on;
	const gigaflopConsumePerTickRaw = entanglerData.effects.gflopsConsumption;
	const gigaflopConsumePerTickEffective = gigaflopConsumePerTickRaw * entanglerData.on;
	const aiLevel = gameData.aiLevel;
	const gigaflopsNeeded = gameData.gigaflopsToNextLevel;
	const hashesNeeded = gameData.hashesToNextLevel;
	const timeToNextAiLevel = gigaflopsNeeded / (gigaflopsPerTick * game.ticksPerSecond);
	const timeToNextHashLevel = hashesNeeded / (hashesPerTick * game.ticksPerSecond);
	const internalCheckTag = gigaflopProdPerTickEffective - gigaflopConsumePerTickEffective == gigaflopsPerTick
		? "checks out"
		: "<b>INTERNAL MATH ERROR!</b>";
	const timeToNextLevelOfAI = isFinite(timeToNextAiLevel)
		? game.toDisplaySeconds(timeToNextAiLevel)
		: '<i>no gigaflops being produced</i>';
	const timeToNextLevelOfHashes = isFinite(timeToNextHashLevel)
		? game.toDisplaySeconds(timeToNextHashLevel)
		: '<i>no hashes being produced</i>';
	const result = [
		`Current gigaflops: ${gigaflops}`,
		`Net gigaflops per tick: ${gigaflopsPerTick} - ${internalCheckTag}`,
		`Current AI level: ${aiLevel}`,
	];
	if (aiLevel > 14) {
		const gigaflopsToLose = gigaflops - gigaflopSafeMax;
		const timeUntilSafetyFromSkynet = game.toDisplaySeconds(
			Math.abs(gigaflopsToLose / (gigaflopsPerTick * game.ticksPerSecond))
		) || 'now';
		result.push(
			'<span class="ohshit">THE AI APOCALYPSE WILL OCCUR</span>',
			`Gigaflops beyond safe limit: ${gigaflopsToLose}`
		);
		if (gigaflopsPerTick > 0) {
			result.push('<span class="ohshit">AI LEVEL IS STILL INCREASING - BUILD MORE ENTANGLERS</span>');
		}
		else if (gigaflopsPerTick == 0) {
			result.push('<span class="ohshit">AI LEVEL IS STEADY - BUILD MORE ENTANGLERS</span>');
		}
		else {
			result.push(`Time drop back to safe limit: ${timeUntilSafetyFromSkynet}`);
		}
	}
	else {
		const gigaflopsToHitMax = gigaflopSafeMax - gigaflops;
		const timeUntilDangerFromSkynet = game.toDisplaySeconds(
			Math.abs(gigaflopsToHitMax / (gigaflopsPerTick * game.ticksPerSecond))
		) || 'now';
		result.push(
			'The AI apocalypse will not occur yet',
			`Gigaflops needed to reach maximum safe limit: ${gigaflopsToHitMax}`
		);
		if (gigaflopsPerTick > 0) {
			result.push(`Time to reach maximum safe limit: ${timeUntilDangerFromSkynet}`);
		}
		else if (gigaflopsPerTick == 0) {
			result.push('AI Level is steady - AI apocalypse is not possible');
		}
		else {
			result.push('AI Level is falling - AI apocalypse is not possible');
		}
	}
	result.push(
		`Gigaflops needed for next AI level: ${gigaflopsNeeded}`,
		`Time to reach next AI level: ${timeToNextLevelOfAI}`,
		`Current hashes: ${hashes}`,
		`Net hashes per tick: ${hashesPerTick}`,
		`Current hashlevel: ${hashLevel}`,
		`Hashes needed to reach next hash level: ${hashesNeeded}`,
		`Time to reach next hash level: ${timeToNextLevelOfHashes}`
	);
	return result.join("<br />\n");
}

function addCalculator(container, id, title, contents, calcFunc, subsectionId, subsectionTitle) {
	if (subsectionId) {
		container
			.append($(`<h3 class="fakelink">${title} (click to show/hide)</h3>`)
				.on('click', () => {
					$(`#${id}_container`).toggle();
				}));
		if (calcFunc) {
			calculators.push([
				[
					id,
					subsectionId,
				],
				calcFunc,
			]);
		}
		const outerDiv = $(`<div id="${id}_container"></div>`).hide();
		const innerDiv = $(`<div id="${id}"></div>`);
		const subDiv = $(`<div id="${subsectionId}"></div>`).hide();
		const subToggle = $(`<h4 class="fakelink">${subsectionTitle} (click to show/hide)</h4>`)
			.on('click', () => {
				subDiv.toggle();
			});
		outerDiv.append(contents, innerDiv, subToggle, subDiv);
		container.append(outerDiv);
	}
	else {
		const sect = $(`<div id="${id}">${contents}</div>`).hide();
		const toggle = $(`<h3 class="fakelink">${title} (click to show/hide)</h3>`)
			.on('click', () => {
				sect.toggle();
			});
		container.append(toggle);
		if (calcFunc) {
			calculators.push([
				[id],
				calcFunc,
			]);
		}
		container.append(sect);
	}
}
function updateCalculators() {
	for (let i = 0; i < calculators.length; i++) {
		const c = calculators[i];
		const contents = [].concat(c[1]());
		for (let n = 0; n < c[0].length; n++) {
			document.getElementById(c[0][n]).innerHTML = contents[n];
		}
	}
}
function rebuildCalculatorUI() {
	const calcContainer = prepareContainer('kittenCalcs');
	calculators = [];
	addCalculator(calcContainer, 'mintCalc', 'Mint efficiency calculator', '', mintCalculator);
	addCalculator(calcContainer, 'aiCalc', 'AI, gigaflops, and hashes', '', aiCalculator);
}

function realignSciptDialogs() {
	if (autoOptions.dialogRight) {
		$('html').first()
			.addClass('autokittensRight');
	}
	else {
		$('html').first()
			.removeClass('autokittensRight');
	}
}
function reapplyShadows() {
	if (autoOptions.forceShadowGlobal) {
		$('html').first()
			.addClass('forceShadowGlobal');
		$('html').first()
			.removeClass('forceShadow');
	}
	else if (autoOptions.forceShadow) {
		$('html').first()
			.addClass('forceShadow');
		$('html').first()
			.removeClass('forceShadowGlobal');
	}
	else {
		$('html').first()
			.removeClass('forceShadow');
		$('html').first()
			.removeClass('forceShadowGlobal');
	}
}

function addAutocraftConfigLine(uiContainer, from, to, needsPluralising, labelFix) {
	const internalTo = to.replace(/\s+([a-z])/gu, (m, l) => l.toUpperCase());
	const labelTo = labelFix || internalTo.replace(/([A-Z])/gu, l => ` ${l.toLowerCase()}`);
	const questioningSuffix = needsPluralising ? '(s)' : '';
	const certainSuffix = needsPluralising ? 's' : '';
	addCheckbox(
		uiContainer,
		'autoOptions.craftOptions',
		`craft${internalTo.replace(/^[a-z]/u, l => l.toUpperCase())}`,
		`Automatically convert ${from} to ${labelTo + certainSuffix}`
	);
	addIndent(uiContainer);
	addInputField(
		uiContainer,
		'autoOptions.craftOptions',
		`${internalTo.replace(/^[a-z]/u, l => l.toLowerCase())}Amount`,
		'Craft',
		`${labelTo + questioningSuffix} at a time`
	);
	addIndent(uiContainer);
	addInputField(
		uiContainer,
		'autoOptions.craftOptions',
		`${internalTo.replace(/^[a-z]/u, l => l.toLowerCase())}Interval`,
		`Craft ${labelTo + certainSuffix} every`,
		"game tick(s)"
	);
}

function rebuildOptionsPaneTrading() {
	const uiContainer = prepareContainer('akSettingsTrade');
	addHeading(uiContainer, 'Trading');
	const races = [
		[
			"No one",
			"",
		],
	];
	game.diplomacy.races.forEach(r => {
		if (r.unlocked) {
			races.push([
				r.title || r.name,
				r.name,
			]);
		}
	});
	addCheckbox(
		uiContainer,
		'autoOptions',
		'autoTrade',
		'Trade when gold is near limit'
	);
	addIndent(uiContainer);
	addOptionMenu(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradeLimit',
		'Trade when gold is',
		percentages,
		'full'
	);
	addOptionMenu(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradePartner',
		'Trade with',
		races,
		'by default'
	);
	addCheckbox(
		uiContainer,
		'autoOptions.tradeOptions',
		'suppressTradeLog',
		'Hide log messages when auto-trading'
	);
	races[0][0] = "Default selection";
	addIndent(uiContainer);
	addInputField(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradeCount',
		'Send',
		'caravans at a time'
	);
	addCheckbox(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradeSpring',
		'Allow trading in spring'
	);
	addIndent(uiContainer);
	addOptionMenu(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradePartnerSpring',
		'Trade with',
		races,
		' in spring'
	);
	addCheckbox(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradeSummer',
		'Allow trading in summer'
	);
	addIndent(uiContainer);
	addOptionMenu(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradePartnerSummer',
		'Trade with',
		races,
		' in summer'
	);
	addCheckbox(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradeAutumn',
		'Allow trading in autumn'
	);
	addIndent(uiContainer);
	addOptionMenu(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradePartnerAutumn',
		'Trade with',
		races,
		' in autumn'
	);
	addCheckbox(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradeWinter',
		'Allow trading in winter'
	);
	addIndent(uiContainer);
	addOptionMenu(
		uiContainer,
		'autoOptions.tradeOptions',
		'tradePartnerWinter',
		'Trade with',
		races,
		' in winter'
	);
	addCheckbox(
		uiContainer,
		'autoOptions.tradeOptions',
		'playMarket',
		'Play the blackcoin market like a cheap fiddle'
	);
	addIndent(uiContainer);
	addInputField(
		uiContainer,
		'autoOptions.tradeOptions',
		'buyBlackcoinBelow',
		"Buy blackcoin for at most",
		"relics"
	);
	updateOptionsUI();
}
function rebuildOptionsPaneGeneralUI() {
	const uiContainer = prepareContainer('akSettingsUi');
	addHeading(uiContainer, 'Timer displays');
	addTriggerCheckbox(
		uiContainer,
		'autoOptions',
		'showTimerDisplays',
		'Show timer displays below',
		'adjustTimerBar()'
	);
	uiContainer.append('Note: Ordering by time may cause elements near cap to frequently switch places.<br />');
	addOptionMenu(uiContainer, 'autoOptions', 'displayOrder', 'Order time displays by', [
		[
			'default order',
			'standard',
		],
		[
			'shortest first',
			'short',
		],
		[
			'longest first',
			'long',
		],
	], '');
	game.resPool.resources.forEach(r => {
		if (typeof autoOptions.displayOptions[r.name] !== 'undefined') {
			addNamedCheckbox(
				uiContainer,
				'autoOptions.displayOptions',
				r.name,
				`show${r.name}`,
				`Show ${r.title || r.name}`
			);
		}
	});
	addHeading(
		uiContainer,
		'Game options'
	);
	addCheckbox(
		uiContainer,
		'autoOptions',
		'autoStar',
		'Automatically witness astronomical events'
	);
	addHeading(
		uiContainer,
		'UI options'
	);
	addCheckbox(
		uiContainer,
		'autoOptions',
		'warnOnLeave',
		'Warn before leaving the page'
	);
	addTriggerCheckbox(
		uiContainer,
		'autoOptions',
		'widenUI',
		'Make the game use more horizontal space (particularly useful for Grassy theme)',
		adjustColumns
	);
	addTriggerCheckbox(
		uiContainer,
		'autoOptions',
		'dialogRight',
		"Move AK dialogs to the right of the window to improve playability",
		realignSciptDialogs
	);
	addTriggerCheckbox(
		uiContainer,
		'autoOptions',
		'forceShadow',
		"Enable a light shadow on AK dialogs",
		reapplyShadows
	);
	addTriggerCheckbox(
		uiContainer,
		'autoOptions',
		'forceShadowGlobal',
		"Enable a light shadow on ALL dialogs (overrides the above option!)",
		reapplyShadows
	);
	addTriggerOptionMenu(uiContainer, 'autoOptions', 'timeDisplay', 'Format time displays as', [
		[
			"default",
			"standard",
		],
		[
			"short",
			"short",
		],
		[
			"seconds",
			"seconds",
		],
	], '', changeTimeFormat);
	updateOptionsUI();
}
function rebuildOptionsPaneCrafting() {
	const uiContainer = prepareContainer('akSettingsCraft');
	addHeading(
		uiContainer,
		'Crafting'
	);
	addCheckbox(
		uiContainer,
		'autoOptions',
		'autoCraft',
		'Craft materials when storage is near limit'
	);
	addOptionMenu(
		uiContainer,
		'autoOptions.craftOptions',
		'craftLimit',
		'Craft when storage is',
		percentages,
		'full'
	);
	addOptionMenu(
		uiContainer,
		'autoOptions.craftOptions',
		'secondaryCraftLimit',
		"Keep secondary crafting outputs at least",
		percentages,
		'the amount of the inputs'
	);
	addAutocraftConfigLine(
		uiContainer,
		'catnip',
		'wood'
	);
	addAutocraftConfigLine(
		uiContainer,
		'wood',
		'beam',
		true
	);
	addAutocraftConfigLine(
		uiContainer,
		'minerals',
		'slab',
		true
	);
	addAutocraftConfigLine(
		uiContainer,
		'iron',
		'plate',
		true
	);
	addAutocraftConfigLine(
		uiContainer,
		'iron and coal',
		'steel'
	);
	addAutocraftConfigLine(
		uiContainer,
		'slabs and steel',
		'concrete',
		false
	);
	addAutocraftConfigLine(
		uiContainer,
		'steel',
		'gear',
		true
	);
	addAutocraftConfigLine(
		uiContainer,
		'steel and titanium',
		'alloy'
	);
	addAutocraftConfigLine(
		uiContainer,
		'alloy and unobtainium',
		'eludium'
	);
	addAutocraftConfigLine(
		uiContainer,
		'beams',
		'scaffold',
		true
	);
	addAutocraftConfigLine(
		uiContainer,
		'scaffolds, plates, and starcharts',
		'ship',
		true
	);
	addAutocraftConfigLine(
		uiContainer,
		'ships, alloy, and blueprints',
		'tanker',
		true
	);
	addAutocraftConfigLine(
		uiContainer,
		'oil',
		'kerosene'
	);
	addAutocraftConfigLine(
		uiContainer,
		'uranium',
		'thorium'
	);
	addAutocraftConfigLine(
		uiContainer,
		'slabs, beams, and plates',
		'megalith',
		true
	);
	addAutocraftConfigLine(
		uiContainer,
		'time crystals and relics',
		'bloodstone',
		true
	);
	addHeading(
		uiContainer,
		'Fur product crafting'
	);
	addTriggerOptionMenu(
		uiContainer,
		'autoOptions.furOptions',
		'parchmentMode',
		'Auto-craft parchment',
		[
			[
				'never',
				0,
			],
			[
				'all, before hunting',
				1,
			],
			[
				'on full culture storage',
				2,
			],
			[
				'both',
				3,
			],
		],
		'',
		changeFurCrafts
	);
	addIndent(uiContainer);
	addInputField(
		uiContainer,
		'autoOptions.craftOptions',
		'parchmentAmount',
		'When storage full, craft',
		'parchment at a time'
	);
	addTriggerOptionMenu(
		uiContainer,
		'autoOptions.furOptions',
		'manuscriptMode',
		'Auto-craft manuscripts',
		[
			[
				'never',
				0,
			],
			[
				'all, before hunting',
				1,
			],
			[
				'on full culture storage',
				2,
			],
			[
				'both',
				3,
			],
		],
		'',
		changeFurCrafts
	);
	addIndent(uiContainer);
	addInputField(
		uiContainer,
		'autoOptions.craftOptions',
		'manuscriptAmount',
		'When storage full, craft',
		'manuscript(s) at a time'
	);
	addIndent(uiContainer);
	addTriggerOptionMenu(
		uiContainer,
		'autoOptions.furOptions',
		'compendiumMode',
		'Auto-craft compendiums',
		[
			[
				'never',
				0,
			],
			[
				'all, before hunting',
				1,
			],
			[
				'on full science storage',
				2,
			],
			[
				'both',
				3,
			],
		],
		'',
		changeFurCrafts
	);
	addIndent(uiContainer);
	addInputField(
		uiContainer,
		'autoOptions.craftOptions',
		'compendiumAmount',
		'When storage full, craft',
		'compendium(s) at a time'
	);
	addTriggerOptionMenu(
		uiContainer,
		'autoOptions.furOptions',
		'blueprintMode',
		'Auto-craft blueprints',
		[
			[
				'never',
				0,
			],
			[
				'all, before hunting',
				1,
			],
			[
				'on full science storage',
				2,
			],
			[
				'both',
				3,
			],
		],
		'',
		changeFurCrafts
	);
	addIndent(uiContainer);
	addInputField(
		uiContainer,
		'autoOptions.craftOptions',
		'blueprintAmount',
		'When storage full, craft',
		'blueprints(s) at a time'
	);
	addCheckbox(
		uiContainer,
		'autoOptions.craftOptions',
		'blueprintPriority',
		'When crafting both from full storage, check blueprints before compendiums'
	);
	updateOptionsUI();
}
function buildUI() {
	const tableContainer = $('<div id="timerTableContainer"></div>');
	tableContainer.html('<table id="timerTable" style="width: 100%; table-layout: fixed;"></table>');
	$('body').first()
		.append(tableContainer);
	adjustColumns();
	adjustTimerBar();
	realignSciptDialogs();
	$(resetGameLogHeight);
	const akDialogClasses = 'dialog help autokittens-dialog';
	const switchToDialog = (which, pre) => {
		$('.autokittens-dialog').hide();
		if (typeof pre == 'function') {
			pre();
		}
		which.show();
	};
	const switcher = (...pass) => switchToDialog.bind(null, ...pass);
	const makeContainer = id => prepareContainer(
		$(`<div class="${akDialogClasses}" id="akSettings${id.replace(/^[a-z]/u, c => c.toUpperCase())}"></div>`)
			.hide()
	);
	const masterSettingsContainer = makeContainer("master");
	const prayerSettingsContainer = makeContainer("prayer");
	const tradeSettingsContainer = makeContainer("trade");
	const craftSettingsContainer = makeContainer("craft");
	const huntSettingsContainer = makeContainer("hunt");
	const uiSettingsContainer = makeContainer("ui");
	const miscSettingsContainer = makeContainer("misc");
	// The master panel, from here you have override toggles and the other panels
	addTriggerButton(
		masterSettingsContainer,
		'Prayer Settings',
		switcher(prayerSettingsContainer)
	)
		.addClass('autokittens-dispatch-button');
	addTriggerButton(
		masterSettingsContainer,
		'Trading Settings',
		switcher(tradeSettingsContainer, rebuildOptionsPaneTrading)
	)
		.addClass('autokittens-dispatch-button');
	addTriggerButton(
		masterSettingsContainer,
		'Crafting Settings',
		switcher(craftSettingsContainer, rebuildOptionsPaneCrafting)
	)
		.addClass('autokittens-dispatch-button');
	addTriggerButton(
		masterSettingsContainer,
		'Hunting Settings',
		switcher(huntSettingsContainer)
	)
		.addClass('autokittens-dispatch-button');
	addTriggerButton(
		masterSettingsContainer,
		'UI Settings',
		switcher(uiSettingsContainer, rebuildOptionsPaneGeneralUI)
	)
		.addClass('autokittens-dispatch-button');
	addTriggerButton(
		masterSettingsContainer,
		'Miscellaneous Settings',
		switcher(miscSettingsContainer)
	)
		.addClass('autokittens-dispatch-button');
	addTriggerButton(
		masterSettingsContainer,
		'Check for update',
		checkUpdate
	)
		.addClass('autokittens-dispatch-button')
		.attr('id', 'autokittens-checkupdate');
	addTriggerButton(masterSettingsContainer, 'Reset options', () => {
		autoOptions = defaultOptions;
		saveAutoOptions();
		updateOptionsUI();
	}, 'DANGER! This CANNOT be undone!')
		.addClass('autokittens-dispatch-button')
		.attr('id', 'autokittens-reset-options');
	// Prayer settings
	addHeading(prayerSettingsContainer, 'Prayer');
	addCheckbox(
		prayerSettingsContainer,
		'autoOptions',
		'autoPray',
		'Praise the sun when faith is near limit'
	);
	addIndent(prayerSettingsContainer);
	addOptionMenu(
		prayerSettingsContainer,
		'autoOptions',
		'prayLimit',
		'Pray when faith is',
		faithPercentages,
		'full'
	);
	addIndent(prayerSettingsContainer);
	addCheckbox(
		prayerSettingsContainer,
		'autoOptions',
		'autoResetFaith',
		'Perform an apocrypha reset just before praising the sun'
	);
	// Hunting settings
	addHeading(huntSettingsContainer, 'Hunting');
	addCheckbox(
		huntSettingsContainer,
		'autoOptions',
		'autoHunt',
		'Hunt when catpower is near limit'
	);
	addOptionMenu(
		huntSettingsContainer,
		'autoOptions.huntOptions',
		'huntLimit',
		'Hunt when catpower is',
		percentages,
		'full'
	);
	addCheckbox(
		huntSettingsContainer,
		'autoOptions.huntOptions',
		'suppressHuntLog',
		'Hide log messages when auto-hunting (includes hunt-triggered crafts)'
	);
	addCheckbox(
		huntSettingsContainer,
		'autoOptions.huntOptions',
		'singleHunts',
		'Only send one hunt at a time'
	);
	addCheckbox(
		huntSettingsContainer,
		'autoOptions.huntOptions',
		'huntEarly',
		'Hunt as soon as the maximum number of hunts is reached (relative to the limit)'
	);
	// Miscellaneous settings
	addHeading(miscSettingsContainer, 'Miscellaneous');
	addCheckbox(
		miscSettingsContainer,
		'autoOptions',
		'perfectLeadership',
		"Pretend that your leader is perfect at everything"
	);
	// The rest of the settings panels are dynamic, so they have `rebuildOptionsPane<Purpose>()`
	// functions above instead of being in here
	const calcContainer = $(`<div class="${akDialogClasses}" id="kittenCalcs"></div>`).hide();
	$('#gamePageContainer').append([
		masterSettingsContainer,
		prayerSettingsContainer,
		tradeSettingsContainer,
		craftSettingsContainer,
		huntSettingsContainer,
		uiSettingsContainer,
		miscSettingsContainer,
		calcContainer,
	]);
	// Put the links in the headers
	const optLink = $('<a id="autokittens-optlink" href="#">AutoKittens</a>')
		.on('click', switcher(masterSettingsContainer));
	const calcLink = $('<a id="autokittens-calclink" href="#">Calculators</a>')
		.attr('title', "According to my catculations...")
		.on('click', switcher(calcContainer, rebuildCalculatorUI));
	$('#headerLinks').append(' | ', optLink, ' | ', calcLink);
	// Inject our stylesheet, because trying to manage inline styles with
	// this sort of logic/selection criteria is /not/ happening
	const inlineStylesheet = $('<style type="text/css"></style>');
	inlineStylesheet.text(`
		#gamePageContainer > div.dialog.help.autokittens-dialog {
			top: 24% !important;
			bottom: 14% !important;
			overflow-y: scroll;
		}
		html.autokittensRight #gamePageContainer > div.autokittens-dialog {
			right: 10px;
			left: auto;
		}
		html.autokittensRight > body.scheme_sleek .autokittens-dialog,
		html.forceShadow > body > #gamePageContainer > .autokittens-dialog,
		html.forceShadowGlobal > body > #gamePageContainer > .dialog,
		html.forceShadowGlobal > body > #gamePageContainer > .help {
			box-shadow: 0 0 0 9999px rgba(0,0,0,0.4); /* 4, chosen by fair dice roll, guaranteed random */
		}
		input[type="button"].autokittens-dispatch-button {
			width: 100%;
			margin-left: 0;
			margin-right: 0;
			padding: 10px;
			font-size: 1.15em;
			margin-top: 10px;
			margin-bottom: 10px;
		}
		#autokittens-checkupdate,
		#autokittens-reset-options {
			margin-top: 25px;
			margin-bottom: 25px;
		}
		#timerTableContainer {
			width: 100%;
			height: 50px;
			position: fixed;
			bottom: 0px;
			background-color: #FFFFFF;
		}
		body.scheme_sleek > #timerTableContainer {
			background-color: #1C1917;
		}
		body.scheme_dark > #timerTableContainer {
			background-color: #201F1D;
		}
		body.scheme_grassy > #timerTableContainer {
			background-color: #C6EBA1;
		}
		html:not(.autokittens-show-timers) #timerTableContainer {
			display: none;
		}
		html.autokittens-show-timers #timerTableContainer {
			display: block;
		}
		html.autokittens-show-timers #game {
			margin-bottom: 50px;
		}
		html.autokittens-show-timers #footerLinks {
			margin-bottom: 60px;
		}
		html.autokittens-show-timers {
			background-position: center bottom 30px;
		}
		.fakelink {
			cursor: pointer;
		}
		.ohshit {
			font-weight: 900;
		}
		.ohshit::before {
			content: "⚠ ";
		}
		.ohshit::after {
			content: " ⚠";
		}
	`.trim());
	$('head')
		.first()
		.append(inlineStylesheet);
}

function starClick() {
	if (autoOptions.autoStar) {
		(document.getElementById("observeBtn") || {
			click: NOP,
		}).click();
	}
}
function autoHunt() {
	if (!autoOptions.autoHunt) {
		return;
	}
	const msgFunc = game.msg;
	if (autoOptions.huntOptions.suppressHuntLog) {
		game.msg = NOP;
	}
	const catpower = game.resPool.get('manpower');
	const leftBeforeCap = (1 - autoOptions.huntOptions.huntLimit) * catpower.maxValue;
	if (
		catpower.value / catpower.maxValue >= autoOptions.huntOptions.huntLimit
		|| autoOptions.huntOptions.huntEarly
		&& catpower.value >= catpower.maxValue - leftBeforeCap - (catpower.maxValue - leftBeforeCap) % 100
	) {
		if (autoOptions.huntOptions.craftParchment && game.workshop.getCraft('parchment').unlocked) {
			game.craftAll('parchment');
		}
		if (autoOptions.huntOptions.craftManuscript && game.workshop.getCraft('manuscript').unlocked) {
			game.craftAll('manuscript');
		}
		if (autoOptions.huntOptions.craftCompendium && game.workshop.getCraft('compedium').unlocked) {
			game.craftAll('compedium');
		}
		if (autoOptions.huntOptions.craftBlueprint && game.workshop.getCraft('blueprint').unlocked) {
			game.craftAll('blueprint');
		}
		if (autoOptions.huntOptions.singleHunts) {
			game.village.huntMultiple(1);
		}
		else {
			game.village.huntAll();
		}
	}
	if (autoOptions.huntOptions.suppressHuntLog) {
		game.msg = msgFunc;
	}
}
function autoCraft() {
	if (!autoOptions.autoCraft) {
		return;
	}
	// To add a new one:
	// 1: add `craft<Thing>` and `<thing>Amount` options in the defaults
	// 2: add the `addAutocraftConfigLine(uiContainer, '<from label>', '<internal to>', pluraliseOutputLabelP)`
	//    line to `rebuildOptionsUI()` above
	// 3: add a `['<result ID>', 'craft<Thing>', '<thing>Amount', '<thing>Interval', condition]` line here
	const resources = [
		[
			"bloodstone",
			"craftBloodstone",
			"bloodstoneAmount",
			"bloodstoneInterval",
			game.science.get('construction').researched,
		],
		[
			"tanker",
			"craftTanker",
			"tankerAmount",
			"tankerInterval",
			game.science.get('construction').researched,
		],
		[
			"ship",
			"craftShip",
			"shipAmount",
			"shipInterval",
			game.science.get('construction').researched,
		],
		[
			"concrate",
			"craftConcrete",
			"concreteAmount",
			"concreteInterval",
			game.science.get('construction').researched,
		],
		[
			"megalith",
			"craftMegalith",
			"megalithAmount",
			"megalithInterval",
			game.science.get('construction').researched,
		],
		[
			"slab",
			"craftSlab",
			"slabAmount",
			"slabInterval",
			game.science.get('construction').researched,
		],
		[
			"gear",
			"craftGear",
			"gearAmount",
			"gearInterval",
			game.science.get('construction').researched,
		],
		[
			"alloy",
			"craftAlloy",
			"alloyAmount",
			"alloyInterval",
			game.science.get('construction').researched,
		],
		[
			"steel",
			"craftSteel",
			"steelAmount",
			"steelInterval",
			game.science.get('construction').researched,
		],
		[
			"plate",
			"craftPlate",
			"plateAmount",
			"plateInterval",
			game.science.get('construction').researched,
		],
		[
			"eludium",
			"craftEludium",
			"eludiumAmount",
			"eludiumInterval",
			game.science.get('construction').researched,
		],
		[
			"kerosene",
			"craftKerosene",
			"keroseneAmount",
			"keroseneInterval",
			game.science.get('construction').researched,
		],
		[
			"thorium",
			"craftThorium",
			"thoriumAmount",
			"thoriumInterval",
			game.science.get('construction').researched,
		],
		[
			"scaffold",
			"craftScaffold",
			"scaffoldAmount",
			"scaffoldInterval",
			game.science.get('construction').researched,
		],
		[
			"beam",
			"craftBeam",
			"beamAmount",
			"beamInterval",
			game.science.get('construction').researched,
		],
		[
			"wood",
			"craftWood",
			"woodAmount",
			"woodInterval",
			true,
		],
		[
			"parchment",
			"craftParchment",
			"parchmentAmount",
			"parchmentInterval",
			game.science.get('construction').researched,
		],
		[
			"manuscript",
			"craftManuscript",
			"manuscriptAmount",
			"manuscriptInterval",
			game.science.get('construction').researched,
		],
		[
			"blueprint",
			"craftBlueprint",
			"blueprintAmount",
			"blueprintInterval",
			game.science.get('construction').researched && autoOptions.craftOptions.blueprintPriority,
		],
		[
			"compedium",
			"craftCompendium",
			"compendiumAmount",
			"compendiumInterval",
			game.science.get('construction').researched,
		],
		[
			"blueprint",
			"craftBlueprint",
			"blueprintAmount",
			"blueprintInterval",
			game.science.get('construction').researched && !autoOptions.craftOptions.blueprintPriority,
		],
	];
	AUTOCRAFT: for (let i = 0; i < resources.length; i++) {
		const craftData = resources[i];
		const [
			product,
			toggleSetting,
			amountSetting,
			intervalSetting,
			consider,
		] = craftData;
		const costs = autoKittensCache.craftingInputs[product];
		const ticksSinceLastCraft = craftingTickTracker[product] || 1;
		if (
			consider
			&& autoOptions.craftOptions[toggleSetting]
			&& ticksSinceLastCraft >= autoOptions.craftOptions[intervalSetting]
			&& game.workshop.getCraft(product).unlocked
		) {
			if (window.AUTOKITTENS_DEBUG_SPAM_ENABLED) {
				console.log(`Attempting to craft ${product}`);
			}
			craftingTickTracker[product] = 0;
			const output = game.resPool.get(product);
			for (const resource in costs) {
				if (ownProp(costs, resource)) {
					if (product == 'steel' && resource == 'iron') {
						continue; // It's a monkey patch, I know - I'm working on a proper fix
					}
					const input = game.resPool.get(resource);
					if (input.value < costs[resource]) {
						continue AUTOCRAFT;
					}
					if (input.maxValue > 0) { // Check by percentage of max value - the original method
						const percentage = input.value / input.maxValue;
						if (percentage < autoOptions.craftOptions.craftLimit) {
							continue AUTOCRAFT;
						}
						continue;
					}
					if (input.value > 0) { // Check by percentage of the PRODUCT'S CURRENT VALUE - uncapped stuff
						const percentage = output.value / input.value;
						// If we have MORE of the OUTPUT than the threshold, skip this entirely
						if (percentage > autoOptions.craftOptions.secondaryCraftLimit) {
							continue AUTOCRAFT;
						}
						continue;
					}
					// Input is uncapped, input <= output, output <= 0, (transitively) input <= 0
					continue AUTOCRAFT;
				}
			}
			tryCraft(product, autoOptions.craftOptions[amountSetting]);
		}
		else if (window.AUTOKITTENS_DEBUG_SPAM_ENABLED) {
			console.log([
				`Haven't crafted ${product} in ${ticksSinceLastCraft} ticks,`,
				`crafting every ${autoOptions.craftOptions[intervalSetting]} ticks`,
			].join(' '));
		}
		craftingTickTracker[product] = ticksSinceLastCraft + 1;
	}
}
function autoPray() {
	if (!autoOptions.autoPray) {
		return;
	}
	const faith = game.resPool.get('faith');
	if (faith.value / faith.maxValue >= autoOptions.prayLimit && faith.value > 0.01) {
		if (autoOptions.autoResetFaith) {
			game.religionTab.resetFaithInternal(1);
		}
		game.religion.praise();
	}
}
function autoTrade() {
	if (!autoOptions.autoTrade || autoOptions.tradeOptions.tradePartner === "") {
		return;
	}
	let race;
	const season = [
		"Spring",
		"Summer",
		"Autumn",
		"Winter",
	][game.calendar.season];
	if (autoOptions.tradeOptions[`tradePartner${season}`]) {
		race = game.diplomacy.get(autoOptions.tradeOptions[`tradePartner${season}`]);
		if (!race.unlocked) {
			autoOptions.tradeOptions[`tradePartner${season}`] = "";
		}
	}
	else {
		race = game.diplomacy.get(autoOptions.tradeOptions.tradePartner);
		if (!race.unlocked) {
			autoOptions.tradeOptions.tradePartner = "";
		}
	}
	if (!race.unlocked) {
		saveAutoOptions();
		return;
	}
	const gold = game.resPool.get('gold');
	if (
		game.resPool.get(race.buys[0].name).value < race.buys[0].val
		|| game.resPool.get("manpower").value < 50
		|| gold.value / gold.maxValue < autoOptions.tradeOptions.tradeLimit
	) {
		return;
	}
	const msgFunc = game.msg;
	if (autoOptions.tradeOptions.suppressTradeLog) {
		game.msg = NOP;
	}
	if (autoOptions.tradeOptions[`trade${season}`]) {
		game.diplomacy.tradeMultiple(race, Math.max(autoOptions.tradeOptions.tradeCount, 1));
	}
	if (autoOptions.tradeOptions.suppressTradeLog) {
		game.msg = msgFunc;
	}
}
function autoBlackcoin() {
	if (!autoOptions.tradeOptions.playMarket) {
		return;
	}
	// From the wiki:
	// > After researching Antimatter the leviathan info box will list a thing called Blackcoin
	// > Once you've researched Blackchain (or if you already have blackcoins),
	// > blackcoins can be bought with relics.
	if (
		!game.science.get('antimatter').researched
		|| !(
			game.resPool.resourceMap.blackcoin.unlocked
			|| game.science.get('blackchain').researched
		)
	) {
		return;
	}
	if (!game.diplomacy.get('leviathans').unlocked) {
		return;
	}
	const curPrice = game.calendar.cryptoPrice;
	const maxPrice = game.calendar.cryptoPriceMax;
	const relics = game.resPool.get("relic");
	const coins = game.resPool.get("blackcoin");
	if (relics.value > 0 && curPrice <= autoOptions.tradeOptions.buyBlackcoinBelow) {
		const amt = relics.value / curPrice;
		coins.value += amt;
		relics.value = 0;
	}
	else if (coins.value > 0 && (maxPrice - curPrice) < 5) {
		const amt = relics.value * curPrice;
		relics.value += amt;
		coins.value = 0;
	}
}
function processAutoKittens() {
	starClick();
	autoHunt();
	autoCraft();
	autoTrade();
	autoPray();
	autoBlackcoin();
	fillTable();
	updateCalculators();
}

(() => {
	// The internal cache of things we need that WON'T change over time
	let internalCache;
	const rebuildAutoKittensCache = function rebuildAutoKittensCache() {
		const temporaryCache = {
			unicornUpgrades: [],
			craftingInputs: {},
		};
		for (let i = 0; i < game.workshop.upgrades.length; i++) {
			if ('unicornsGlobalRatio' in (game.workshop.upgrades[i].effects || {})) {
				temporaryCache.unicornUpgrades.push(game.workshop.upgrades[i]);
			}
		}
		Object.freeze(temporaryCache.unicornUpgrades);
		for (let i = 0; i < game.workshop.crafts.length; i++) {
			const product = game.workshop.crafts[i].name;
			const costs = {};
			game.workshop.crafts[i].prices.forEach(price => {
				costs[price.name] = price.val;
			});
			temporaryCache.craftingInputs[product] = Object.freeze(costs);
		}
		Object.freeze(temporaryCache.craftingInputs);
		internalCache = Object.freeze(temporaryCache);
	};
	rebuildAutoKittensCache();
	// Keep the cache (semi-)regularly updated, every ten minutes
	setInterval(rebuildAutoKittensCache, 1000 * 60 * 10);
	// The magic "cache" of commonly desired game data
	const gameDataMap = Object.create(null);
	[
		'catnip',
		'wood',
		'minerals',
		'coal',
		'iron',
		'titanium',
		'gold',
		'oil',
		'uranium',
		'unobtainium',
		'antimatter',
		'science',
		'culture',
		'faith',
		'kittens',
		'zebras',
		'temporalFlux',
		'gflops',
		'hashrates',
		'furs',
		'ivory',
		'spice',
		'unicorns',
		'tears',
		'karma',
		'paragon',
		'burnedParagon',
		'sorrow',
		'void',
		'elderBox',
		'wrappingPaper',
		'blackcoin',
		'steel',
		'alloy',
		'eludium',
		'kerosene',
		'parchment',
		'thorium',
	].forEach(id => {
		Object.defineProperty(gameDataMap, id, {
			enumerable: true,
			get: () => game.resPool.get(id),
		});
	});
	[
		'starchart',
		'alicorn',
		'necrocorn',
		'timeCrystal',
		'relic',
		'bloodstone',
		'beam',
		'slab',
		'plate',
		'gear',
		'scaffold',
		'ship',
		'tanker',
		'manuscript',
		'blueprint',
		'megalith',
	].forEach(id => {
		Object.defineProperty(gameDataMap, `${id}s`, {
			enumerable: true,
			get: () => game.resPool.get(id),
		});
	});
	Object.defineProperties(gameDataMap, iterateObject({
		flux: {
			get: () => gameDataMap.temporalFlux,
		},
		gigaflops: {
			get: () => gameDataMap.gflops,
		},
		hashes: {
			get: () => gameDataMap.hashrates,
		},
		elderBoxes: {
			get: () => gameDataMap.elderBox,
		},
		boxes: {
			get: () => gameDataMap.elderBox,
		},
		concrete: {
			get: () => game.resPool.get('concrate'),
		},
		compendiums: {
			get: () => game.resPool.get('compedium'),
		},
		aiLevel: {
			get: () => Math.round(Math.log(gameDataMap.gigaflops)) || 0,
		},
		gigaflopsToNextLevel: {
			get: () => Math.exp(gameDataMap.aiLevel + 0.5) - gameDataMap.gigaflops.value,
		},
		hashLevel: {
			get: () => Math.floor(Math.log(gameDataMap.hashrates / 1000) / Math.log(1.6)) || 0,
		},
		hashesToNextLevel: {
			get: () => 1000 * Math.pow(1.6, gameDataMap.hashLevel + 1),
		},
	}, descrip => {
		descrip.enumerable = true;
	}));
	// Inject things into the global namespace as read-only values
	Object.defineProperties(window, iterateObject({
		gameData: {
			value: Object.freeze(gameDataMap),
		},
		autoKittensCache: {
			get: () => internalCache,
		},
		rebuildAutoKittensCache: {
			value: rebuildAutoKittensCache,
		},
	}, descrip => {
		descrip.enumerable = true;
	}));
	// Set the unload-guard
	const unloadGuard = function unloadGuard(evt) { // eslint-disable-line consistent-return
		if (autoOptions.warnOnLeave) {
			const warning = 'Are you sure you want to leave?';
			evt.preventDefault();
			evt.returnValue = warning;
			return warning;
		}
	};
	window.addEventListener('beforeunload', unloadGuard, {
		capture: true,
		once: false,
	});
	// Cheese the leader's effect checks (when autoOptions.perfectLeadership)
	// Credit to patsy#5684/160499684744364032 on the discord for the initial code
	// Practical differences: doesn't care if you even HAVE a leader, doesn't care about the current leader's trait
	// Internal differences: uses Reflect.apply instead of relying on Function.prototype.apply
	const realGetEffectLeader = game.village.getEffectLeader;
	// eslint-disable-next-line func-name-matching
	game.village.getEffectLeader = function cheesyGetEffectLeader(trait, ...rest) {
		const realLeader = this.leader;
		if (
			autoOptions.perfectLeadership
			&& game.challenges.currentChallenge != 'anarchy'
			&& game.science.get('civil').researched
			&& this.traits
			&& this.traits.some(t => t.name == trait)
		) {
			this.leader = {
				trait: {
					name: trait,
				},
			};
		}
		const value = Reflect.apply(realGetEffectLeader, this, [
			trait,
			...rest,
		]);
		this.leader = realLeader;
		return value;
	};
	// Inject the script's core function
	if (game.worker) {
		const runOriginalGameTick = dojo.hitch(game, gameTickFunc);
		game.tick = function runAutoKittensHijackedGameTick() { // eslint-disable-line func-name-matching
			runOriginalGameTick();
			processAutoKittens();
		};
	}
	else {
		window.autoKittensTimer = setInterval(processAutoKittens, checkInterval);
	}
	// Make the UI changes
	if (!document.getElementById('timerTable')) {
		buildUI();
		$('.autokittens-dialog').hide();
		rebuildOptionsPaneTrading();
		rebuildOptionsPaneGeneralUI();
		rebuildOptionsPaneCrafting();
	}
})();

