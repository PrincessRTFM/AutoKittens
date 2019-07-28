/*
#define PROJECT_NAME AutoKittens
$__OUTPUT_FILE__ - helper script for the Kittens Game (http://bloodrizer.ru/games/kittens/)

Original author: Michael Madsen <michael@birdiesoft.dk>
Current maintainer: $SIGNATURE
Repository: $GITHUB/$PROJECT_NAME/

$BUILD_STAMP

#AULBS:$__UNIXTIME__#
*/

/* global game, LCstorage, resetGameLogHeight, dojo, autoOptions:writable */

const defaultTimeFormat = game.toDisplaySeconds;
const gameTickFunc = game.tick;
const checkInterval = 200;
let calculators = [];

const NOP = function() {
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
function tryNumericParse(value) {
	const newVal = parseFloat(value);
	return !isNaN(newVal) && isFinite(newVal) && newVal > 0 ? newVal : 0;
}
function tryNumericSet(collection, attrName, value) {
	const newVal = parseFloat(value);
	if (!isNaN(newVal) && isFinite(newVal) && newVal > 0) {
		setArbitrarilyDeepObject([ collection, attrName ], newVal);
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

function calcPrice(base, ratio, num) {
	for (let i = 0; i < num; i++) {
		base *= ratio;
	}
	return base;
}
function getBldLabel(a) {
	return a.label || a.stages[a.stage || 0].label;
}
function bldLabelCmp(a, b) {
	return getBldLabel(a).localeCompare(getBldLabel(b));
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
		timeFormated += `${String.prototype.padStart.call(hours, 2, 0)}:`;
	}
	else if (hours) {
		timeFormated += `${hours}:`;
	}
	timeFormated += `${String.prototype.padStart.call(minutes, 2, 0)}:${String.prototype.padStart.call(seconds, 2, 0)}`;
	return timeFormated;
}
function rawSecondsFormat(secondsRaw) {
	return `${parseInt(secondsRaw, 10)}s`;
}

const defaultOptions = {
	warnOnLeave: true,
	autoStar: true,
	autoCraft: false,
	autoHunt: false,
	autoPray: false,
	autoTrade: false,
	autoFestival: false,
	craftOptions: {
		craftLimit: 0.99,
		craftWood: false,
		woodAmount: 10,
		craftBeam: false,
		beamAmount: 1,
		craftSlab: false,
		slabAmount: 1,
		craftSteel: false,
		steelAmount: 1,
		craftPlate: false,
		plateAmount: 1,
		craftAlloy: false,
		alloyAmount: 1,
		craftKerosene: false,
		keroseneAmount: 1,
		craftThorium: false,
		thoriumAmount: 1,
		craftEludium: false,
		eludiumAmount: 1,
		festivalBuffer: false,
		craftParchment: false,
		parchmentAmount: 1,
		craftManuscript: false,
		manuscriptAmount: 1,
		craftCompendium: false,
		compediumAmount: 1,
		craftBlueprint: false,
		blueprintAmount: 1,
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
	},
	showTimerDisplays: true,
};
window.autoOptions = defaultOptions;
if (LCstorage["kittensgame.autoOptions"]) {
	copyObject(JSON.parse(LCstorage["kittensgame.autoOptions"]), window.autoOptions);
}

function checkUpdate() {
	const AULBS = '$__UNIXTIME__';
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
		[ "parchmentMode", "craftParchment" ],
		[ "manuscriptMode", "craftManuscript" ],
		[ "compendiumMode", "craftCompendium" ],
		[ "blueprintMode", "craftBlueprint" ],
	];
	for (let i = 0; i < crafts.length; i++) {
		window.autoOptions.huntOptions[crafts[i][1]] = !!(window.autoOptions.furOptions[crafts[i][0]] & 1);
		window.autoOptions.craftOptions[crafts[i][1]] = !!(window.autoOptions.furOptions[crafts[i][0]] & 2);
	}
	saveAutoOptions();
}

function tryCraft(craftName, amount) {
	const craft = game.workshop.getCraft(craftName);
	const prices = craft.prices;
	for (let i = 0; i < prices.length; i++) {
		const res = game.resPool.get(prices[i].name);
		if (res.value < prices[i].val * amount) {
			return;
		}
	}
	game.craft(craftName, amount);
}
function getZiggurats() {
	return game.bld.getBuildingExt('ziggurat').get('val');
}
function checkUnicornReserves(resNumber, isPasture, currUps, ivoryNeeded) {
	let unicornsLeft = 0;
	if (isPasture) {
		unicornsLeft = resNumber;
	}
	else {
		const tearsLeft = resNumber - game.resPool.get('tears').value;
		unicornsLeft = 2500 * Math.ceil(tearsLeft / getZiggurats());
	}
	unicornsLeft -= game.resPool.get('unicorns').value;
	const ivoryLeft = ivoryNeeded - game.resPool.get('ivory').value;
	if (unicornsLeft > 0) {
		return `You need ${game.getDisplayValueExt(unicornsLeft)} more unicorns (approximately ${game.toDisplaySeconds(unicornsLeft / currUps)}) to build this.`;
	}
	if (ivoryLeft > 0) {
		return "You have enough unicorns, but need more ivory to build this.";
	}
	return "You have enough resources to build this now.";
}
function getTearPrices() { // Get the number of tears required to build one more of each of PASTURE, TOMB, TOWER, CITADEL, PALACE, UTOPIA
	// Credit to Quizer#1465 on the Kittens Game discord for implementing the Utopia handling
	const result = [
		0,
		0,
		0,
		0,
		0,
		0,
	];
	const buildings = [
		game.bld.getBuildingExt('unicornPasture'),
		game.religion.getZU('unicornTomb'),
		game.religion.getZU('ivoryTower'),
		game.religion.getZU('ivoryCitadel'),
		game.religion.getZU('skyPalace'),
		game.religion.getZU('unicornUtopia'),
	];
	const getFrom = (source, thing) => (source.get ? source.get(thing) : source[thing]);
	for (let i = 0; i < buildings.length; i++) {
		const prices = getFrom(buildings[i], 'prices');
		const name = getFrom(buildings[i], 'name');
		const val = getFrom(buildings[i], 'val');
		let priceRatio;
		try {
			priceRatio = game.bld.getPriceRatio(name);
		}
		catch (e) {
			priceRatio = getFrom(buildings[i], 'priceRatio');
		}
		for (let j = 0; j < prices.length; j++) {
			if (prices[j].name == 'unicorns') {
				result[i] = calcPrice(prices[j].val, priceRatio, val) / 2500 * getZiggurats();
			}
			else if (buildings[i].prices[j].name == 'tears') {
				result[i] = calcPrice(prices[j].val, priceRatio, val);
			}
		}
	}
	return result;
}
function getIvoryPrices() {
	// Credit to Quizer#1465 on the Kittens Game discord for implementing the Utopia handling
	const result = [
		0,
		0,
		0,
		0,
		0,
		0,
	];
	const buildings = [
		game.bld.getBuildingExt('unicornPasture'),
		game.religion.getZU('unicornTomb'),
		game.religion.getZU('ivoryTower'),
		game.religion.getZU('ivoryCitadel'),
		game.religion.getZU('skyPalace'),
		game.religion.getZU('unicornUtopia'),
	];
	const getFrom = (source, thing) => (source.get ? source.get(thing) : source[thing]);
	for (let i = 0; i < buildings.length; i++) {
		const prices = getFrom(buildings[i], 'prices');
		const val = getFrom(buildings[i], 'val');
		const priceRatio = getFrom(buildings[i], 'priceRatio');
		for (let j = 0; j < prices.length; j++) {
			if (prices[j].name == 'ivory') {
				result[i] = calcPrice(prices[j].val, priceRatio, val);
			}
		}
	}
	return result;
}
function calculateBaseUps(extras) {
	extras = extras || [];
	const pastures = game.bld.getBuildingExt('unicornPasture').get('val') + (extras[0] || 0);
	const baseUps = pastures * game.bld.getBuildingExt('unicornPasture').get('effects').unicornsPerTickBase * (game.opts.usePerSecondValues ? game.ticksPerSecond : 1);
	const tombs = game.religion.getZU('unicornTomb').val + (extras[1] || 0);
	const towers = game.religion.getZU('ivoryTower').val + (extras[2] || 0);
	const citadels = game.religion.getZU('ivoryCitadel').val + (extras[3] || 0);
	const palaces = game.religion.getZU('skyPalace').val + (extras[4] || 0);
	const utopias = game.religion.getZU('unicornUtopia').val + (extras[5] || 0);
	const tombEffect = game.religion.getZU('unicornTomb').effects.unicornsRatioReligion;
	const towerEffect = game.religion.getZU('ivoryTower').effects.unicornsRatioReligion;
	const citadelEffect = game.religion.getZU('ivoryCitadel').effects.unicornsRatioReligion;
	const palaceEffect = game.religion.getZU('skyPalace').effects.unicornsRatioReligion;
	const utopiaEffect = game.religion.getZU('unicornUtopia').effects.unicornsRatioReligion;
	const bldEffect = 1 + tombEffect * tombs + towerEffect * towers + citadelEffect * citadels + palaceEffect * palaces + utopias * utopiaEffect;
	let faithEffect = 1;
	if (game.religion.getRU("solarRevolution").on) {
		faithEffect += game.religion.getProductionBonus() / 100;
	}
	let paragonRatio = game.resPool.get("paragon").value * 0.01;
	paragonRatio = 1 + game.getHyperbolicEffect(paragonRatio, 2);
	return baseUps * bldEffect * faithEffect * paragonRatio;
}
function calculateRiftUps(extras) {
	extras = extras || [];
	let unicornChanceRatio = 1;
	if (game.prestige.getPerk("unicornmancy").researched) {
		unicornChanceRatio = 1.1;
	}
	return Math.min(500, 0.25 * unicornChanceRatio * (game.religion.getZU('ivoryTower').val + (extras[2] || 0))) * game.calendar.dayPerTick * (game.opts.usePerSecondValues ? game.ticksPerSecond : 1);
}
function calculateEffectiveUps(extras) {
	return calculateBaseUps(extras) + calculateRiftUps(extras);
}
function calculateUnicornBuild() {
	if (game.bld.getBuildingExt('unicornPasture').get('val') == 0) {
		return [ 'You need at least one Unicorn Pasture to use this. Send off some hunters!', 'Without unicorns and ziggurats, nothing can be calculated here.' ];
	}
	const ziggurats = getZiggurats();
	if (ziggurats == 0) {
		return [ 'You need at least one Ziggurat to use this.', 'Until you have ziggurats, nothing can be calculated here.' ];
	}
	const startUps = calculateEffectiveUps();
	const details = [];
	const result = [`Base unicorn production per second: ${game.getDisplayValue(calculateBaseUps())}`];
	result.push(`Rift production per second (amortized): ${game.getDisplayValue(calculateRiftUps())}`);
	result.push(`Current effective unicorn production per second: ${game.getDisplayValue(startUps)}`);
	const buildings = [
		'Unicorn Pasture',
		'Unicorn Tomb',
		'Ivory Tower',
		'Ivory Citadel',
		'Sky Palace',
		'Unicorn Utopia',
	];
	const tears = getTearPrices();
	const ivory = getIvoryPrices();
	const increases = [
		0,
		0,
		0,
		0,
		0,
		0,
	];
	let best = 0;
	let secondBest = 0;
	for (let i = 0; i < buildings.length; i++) {
		const extras = [
			0,
			0,
			0,
			0,
			0,
			0,
		];
		extras[i] = 1;
		increases[i] = calculateEffectiveUps(extras) - startUps;
		if (tears[best] / increases[best] > tears[i] / increases[i]) {
			secondBest = best;
			best = i;
		}
		if (tears[secondBest] / increases[secondBest] > tears[i] / increases[i] && i != best || secondBest == best) {
			secondBest = i;
		}
		details.push(`Unicorn/s increase with 1 more ${buildings[i]}: ${game.getDisplayValue(increases[i])}`);
		if (i > 0) { // NOT unicorn pastures
			let line = `Total unicorns needed: ${game.getDisplayValueExt(Math.ceil(tears[i] / ziggurats) * 2500)}`;
			line += ` (${game.getDisplayValueExt(tears[i])} tears, ${Math.ceil(tears[i] / ziggurats)} sacrifice${Math.ceil(tears[i] / ziggurats) == 1 ? '' : 's'})`;
			details.push(line);
			details.push(checkUnicornReserves(tears[i], false, startUps, ivory[i]));
		}
		else { // ONLY unicorn pastures
			details.push(`Total unicorns needed: ${game.getDisplayValueExt(tears[i] / ziggurats * 2500)}`);
			details.push(checkUnicornReserves(tears[i] / ziggurats * 2500, true, startUps, ivory[i]));
		}
		let line = 'Tears for 1 extra unicorn/s: ';
		if (increases[i]) {
			line += game.getDisplayValueExt(tears[i] / increases[i]); // tears[i] is the tears needed to build another $building, increases[i] is the effective increase in unicorns per second if you had one more $building than you actually do
		}
		else {
			line += '-n/a- (this will not noticeably affect unicorn generation)';
		}
		details.push(line);
		details.push('');
	}
	result.push('');
	result.push(`Best purchase is ${buildings[best]}, by a factor of ${game.getDisplayValue(tears[secondBest] / increases[secondBest] / (tears[best] / increases[best]))}`);
	if (best == 0) {
		result.push(checkUnicornReserves(tears[best] / ziggurats * 2500, true, startUps, ivory[best]));
	}
	else {
		result.push(checkUnicornReserves(tears[best], false, startUps, ivory[best]));
	}
	return [ result.join('<br />'), details.join('<br />') ];
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
		if (Object.prototype.hasOwnProperty.call(obj, o)) {
			$(`#autoKittens_show${o}`)[0].checked = obj[o];
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
		[ "manuscriptMode", "craftManuscript" ],
		[ "compendiumMode", "craftCompendium" ],
		[ "blueprintMode", "craftBlueprint" ],
	];
	for (let i = 0; i < crafts.length; i++) {
		autoOptions.furOptions[crafts[i][0]] = Number(autoOptions.huntOptions[crafts[i][1]]) + 2 * autoOptions.craftOptions[crafts[i][1]];
	}
	traverseObject(autoOptions);
	changeTimeFormat();
}

function adjustColumns() {
	$('#midColumn').css('width', autoOptions.widenUI ? '1000px' : '');
	$('#leftColumn').css('max-width', autoOptions.widenUI ? '25%' : '');
}
function adjustTimerBar() {
	$('html').first()[autoOptions.showTimerDisplays ? 'addClass' : 'removeClass']('autokittens-show-timers');
}

function addTriggerNamedCheckbox(container, prefix, optionName, controlName, caption, trigger) {
	container.append($(`<input id="autoKittens_${controlName}" type="checkbox" />`).on('input', function updateAutoKittensCheckboxSettingOnValueChange() {
		setArbitrarilyDeepObject([ prefix, optionName ], this.checked);
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
	const select = $(`<select id="autoKittens_${optionName}"></select>`).on('input', function updateAutoKittensDropdownSettingOnValueChange() {
		setArbitrarilyDeepObject([ prefix, optionName ], $(this).val());
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
	const button = $('<input type="button" />').attr('value', caption).on('click', wrapCallback(trigger));
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
	const field = $(`<input id="autoKittens_${optionName}" size="6" type="text" />`).on('input', function updateAutoKittensTextSettingOnValueChanged() {
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
	const result = $(`#${id}`);
	const internal = $('<a class="close" style="top: 10px; right: 15px; position: absolute;" href="#">close</a>').on('click', result.hide.bind(result));
	result.empty().append(internal);
	return result;
}

function calculateCraftAmounts() {
	const resources = [
		"wood",
		"beam",
		"slab",
		"steel",
		"plate",
		"alloy",
		"kerosene",
		"parchment",
		"manuscript",
		"blueprint",
		"compedium",
	];
	for (let i = 0; i < resources.length; i++) {
		const craft = game.workshop.getCraft(resources[i]);
		const prices = craft.prices;
		let amount = 1;
		for (let j = 0; j < prices.length; j++) {
			const res = game.resPool.get(prices[j].name);
			// The lesser of (per tick gain) and (max value, falling back to per tick gain)
			// If there is no max value, it uses the per tick gain
			const checkVal = Math.min(
				res.perTickUI || res.perTickCached,
				res.maxValue > 0 ? res.maxValue : res.perTickUI || res.perTickCached
			);
			// If that calculated number (usually per tick gain, you'd have to make more than you can STORE for otherwise) is HIGHER than the price of this item for one craft
			if (checkVal > prices[j].val) {
				// Craft the HIGHER of (1) and (the truncations of (that value divided by the single-craft cost))
				// Always craft at least one, but only craft MORE if you're producing more per tick than one craft would take
				// Final verdict: craft as many per autocraft as possible WITHOUT consuming more per craft (tick) than you MAKE per tick
				amount = Math.max(amount, Math.floor(checkVal / prices[j].val));
			}
		}
		autoOptions.craftOptions[`${resources[i]}Amount`] = amount;
	}
	saveAutoOptions();
	updateOptionsUI();
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
	const tickRate = game.ticksPerSecond;
	const resources = [];
	for (let resIndex = 0; resIndex < game.resPool.resources.length; resIndex++) {
		const r = game.resPool.resources[resIndex];
		const res = {};
		res.name = r.name;
		res.title = r.title || r.name;
		res.perTickUI = game.getResourcePerTick(res.name, true); // Is this the right property name for this? No. Am I willing to refactor all of this to do it right? Also no.
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
					contents += formatTableRow(name, title, game.toDisplaySeconds((r.maxValue - r.value) / (r.perTickUI * tickRate)));
				}
				else if (r.perTickUI < 0) {
					contents += formatTableRow(name, title, `-${game.toDisplaySeconds(-r.value / (r.perTickUI * tickRate))}`);
				}
				else {
					contents += formatTableRow(name, title, "Err1"); // value > 0 && value < maxValue && (perTickUI || perTickCached) == 0
				}
			}
			else if (r.value > 0 && r.perTickUI < 0) {
				contents += formatTableRow(name, title, `-${game.toDisplaySeconds(-r.value / (r.perTickUI * tickRate))}`);
			}
		}
		// else contents += formatTableRow(name, title, "Steady");
	}
	contents += '</tr>';
	document.getElementById('timerTable').innerHTML = contents;
}

function generateBuildingCalculatorUI() {
	let result = '';
	result += '<select id="buildingPriceSelector" oninput="calculateBuildingPrice()">';
	result += '<optgroup label="Buildings">';
	const buildings = game.bld.buildingsData.slice(0);
	buildings.sort(bldLabelCmp);
	for (let i = 0; i < buildings.length; i++) {
		if (buildings[i].unlocked) {
			result += `<option value="bld_${buildings[i].name}">${getBldLabel(buildings[i])}</option>`;
		}
	}
	if (game.religionTab.visible) {
		result += '</optgroup><optgroup label="Religion">';
		const religion = game.religion.religionUpgrades.slice(0);
		religion.sort((a, b) => a.label.localeCompare(b.label));
		for (let i = 0; i < religion.length; i++) {
			if (game.religion.faith >= religion[i].faith && religion[i].upgradable) {
				result += `<option value="RU_${religion[i].name}">${religion[i].label}</option>`;
			}
		}
	}
	if (game.bld.getBuildingExt('ziggurat').get('val') > 0) {
		result += '</optgroup><optgroup label="Ziggurats">';
		const religion = game.religion.zigguratUpgrades.slice(0);
		religion.sort((a, b) => a.label.localeCompare(b.label));
		for (let i = 0; i < religion.length; i++) {
			result += `<option value="ZU_${religion[i].name}">${religion[i].label}</option>`;
		}
	}
	if (game.spaceTab.visible) {
		result += '</optgroup><optgroup label="Space">';
		const space = game.space.programs.slice(0);
		space.sort((a, b) => a.label.localeCompare(b.label));
		for (let i = 0; i < space.length; i++) {
			if (space[i].unlocked && space[i].upgradable) {
				result += `<option value="space_${space[i].name}">${space[i].label}</option>`;
			}
		}
	}
	result += '</optgroup></select><br /><label>Target number of buildings: <input id="buildingPriceNumber" oninput="calculateBuildingPrice();"></label>';
	result += '<div id="buildingPriceHolder"></div>';
	return result;
}
function calculateBuildingPrice() {
	const getFrom = (source, thing) => (source.get ? source.get(thing) : source[thing]);
	const priceContainer = document.getElementById('buildingPriceHolder');
	const bldName = $('#buildingPriceSelector').val().split('_');
	let bld;
	let priceRatio = 1;
	switch (bldName[0]) {
		case 'bld':
			bld = game.bld.getBuildingExt(bldName[1]);
			priceRatio = game.bld.getPriceRatio(bldName[1]);
			break;
		case 'RU':
			bld = game.religion.getRU(bldName[1]);
			priceRatio = bld.priceRatio;
			break;
		case 'ZU':
			bld = game.religion.getZU(bldName[1]);
			priceRatio = bld.priceRatio;
			break;
		case 'space':
			bld = game.space.getProgram(bldName[1]);
			priceRatio = bld.priceRatio;
			break;
		// no default
	}
	let prices;
	if (typeof bld.stages == 'undefined') {
		prices = getFrom(bld, 'prices');
	}
	else {
		prices = getFrom(bld, 'stages')[getFrom(bld, 'stage') || 0].prices;
	}
	const number = Math.floor(tryNumericParse($('#buildingPriceNumber').val()));
	let maxNum = Infinity;
	for (let i = 0; i < prices.length; i++) {
		let resLimit = getFrom(bld, 'val');
		const res = game.resPool.get(prices[i].name);
		if ((res.maxValue || 0) == 0) {
			continue;
		}
		if (bldName[0] == 'space' && (prices[i].name == "oil" || prices[i].name == "rocket")) {
			let reductionRatio = 0;
			if (prices[i].name == "oil") {
				reductionRatio = game.getHyperbolicEffect(game.space.getEffect("oilReductionRatio"), 0.75);
			}
			if (res.maxValue > prices[i].val * (1 - reductionRatio)) {
				resLimit = maxNum;
			}
			else {
				resLimit = 0;
			}
		}
		else {
			for (let j = getFrom(bld, 'val'); ; j++) {
				if (calcPrice(prices[i].val, priceRatio, j) > res.maxValue) {
					resLimit = j;
					break;
				}
			}
		}
		if (resLimit < maxNum) {
			maxNum = resLimit;
		}
	}
	let result = '';
	if (maxNum != Infinity) {
		result += `With your current resource caps, you can build up to ${maxNum} (${maxNum - getFrom(bld, 'val')} more) of this building.<br />`;
	}
	if (number > 0) {
		result += `Price for ${getFrom(bld, 'label') || getFrom(bld, 'title') || getFrom(bld, 'stages')[getFrom(bld, 'stage') || 0].label} #${number} will be:<br />`;
		for (let i = 0; i < prices.length; i++) {
			let finalPrice;
			if (bldName[0] == 'space' && (prices[i].name == "oil" || prices[i].name == "rocket")) {
				let reductionRatio = 0;
				if (prices[i].name == "oil") {
					reductionRatio = game.getHyperbolicEffect(game.space.getEffect("oilReductionRatio"), 0.75);
				}
				finalPrice = prices[i].val * (1 - reductionRatio);
			}
			else {
				finalPrice = calcPrice(prices[i].val, priceRatio, number - 1);
			}
			const res = game.resPool.get(prices[i].name);
			result += `${res.title || res.name}: ${game.getDisplayValueExt(finalPrice)}<br />`;
		}
		if (getFrom(bld, 'val') < number) {
			result += '<br />Cumulative resources required to reach this:<br />';
			for (let i = 0; i < prices.length; i++) {
				let price = 0;
				if (bldName[0] == 'space' && (prices[i].name == "oil" || prices[i].name == "rocket")) {
					let reductionRatio = 0;
					if (prices[i].name == "oil") {
						reductionRatio = game.getHyperbolicEffect(game.space.getEffect("oilReductionRatio"), 0.75);
					}
					price = prices[i].val  * (1 - reductionRatio) * (number - getFrom(bld, 'val'));
				}
				else {
					for (let j = getFrom(bld, 'val'); j < number; j++) {
						price += calcPrice(prices[i].val, priceRatio, j);
					}
				}
				const res = game.resPool.get(prices[i].name);
				result += `${res.title || res.name}: ${game.getDisplayValueExt(price)}<br />`;
			}
		}
	}
	priceContainer.innerHTML = result;
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
	const catpowerRateWithMints = ((catpower.perTickUI || catpower.perTickCached) + mintBuildingData.get('effects').manpowerPerTickCon * mintsRunning) * game.ticksPerSecond;
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
	const result = [];
	result.push(`Average furs per hunt: ${game.getDisplayValue(expectedFursFromHunts)}`);
	result.push(`Average ivory per hunt: ${game.getDisplayValue(expectedIvoryFromHunts)}`);
	result.push(`Average time between hunts (no mints): ${game.getDisplayValue(huntTimeWithoutMint)} sec`);
	result.push(`Approximate furs per second (hunts, no mints): ${game.getDisplayValue(fpsHuntsNoMints)}`);
	result.push(`Approximate ivory per second (hunts, no mints): ${game.getDisplayValue(ipsHuntsNoMints)}`);
	result.push(`Average time between hunts (${mintsRunning} mint${mintsRunning == 1 ? '' : 's'}): ${game.getDisplayValue(huntTimeWithMint)}`);
	result.push(`Approximate furs per second (hunts, ${mintsRunning} mint${mintsRunning == 1 ? '' : 's'}): ${game.getDisplayValue(fpsHuntsWithMint + fpsFromMint)}`);
	result.push(`Approximate ivory per second (hunts, ${mintsRunning} mint${mintsRunning == 1 ? '' : 's'}): ${game.getDisplayValue(ipsHuntsWithMint + ipsFromMint)}`);
	result.push(`<br />Profit from ${mintsRunning} running mint${mintsRunning == 1 ? '' : 's'}:`);
	result.push(`Furs per second: ${game.getDisplayValue(fpsProfitWithMints)}${fpsProfitWithMints < 0 ? ' (LOSS)' : ''}`);
	result.push(`Ivory per second: ${game.getDisplayValue(ipsProfitWithMints)}${ipsProfitWithMints < 0 ? ' (LOSS)' : ''}`);
	return result.join("<br />");
}

function addCalculator(container, id, title, contents, calcFunc, subsectionId, subsectionTitle) {
	if (subsectionId) {
		container.append($(`<h3 class="fakelink">${title} (click to show/hide)</h3>`).on('click', () => {
			$(`#${id}_container`).toggle();
		}));
		if (calcFunc) {
			calculators.push([ [ id, subsectionId ], calcFunc ]);
		}
		const outerDiv = $(`<div id="${id}_container"></div>`).hide();
		const innerDiv = $(`<div id="${id}"></div>`);
		const subDiv = $(`<div id="${subsectionId}"></div>`).hide();
		const subToggle = $(`<h4 class="fakelink">${subsectionTitle} (click to show/hide)</h4>`).on('click', () => {
			subDiv.toggle();
		});
		outerDiv.append(contents, innerDiv, subToggle, subDiv);
		container.append(outerDiv);
	}
	else {
		const sect = $(`<div id="${id}">${contents}</div>`).hide();
		const toggle = $(`<h3 class="fakelink">${title} (click to show/hide)</h3>`).on('click', () => {
			sect.toggle();
		});
		container.append(toggle);
		if (calcFunc) {
			calculators.push([ [id], calcFunc ]);
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
	addCalculator(calcContainer, 'unicornCalc', 'Unicorn structures', '', calculateUnicornBuild, 'unicornDetails', 'Calculation details');
	addCalculator(calcContainer, 'buildingCalc', 'Building price calculator', generateBuildingCalculatorUI());
	addCalculator(calcContainer, 'mintCalc', 'Mint efficiency calculator', '', mintCalculator);
	calculateBuildingPrice();
}

function realignSciptDialogs() {
	if (autoOptions.dialogRight) {
		$('html').first().addClass('autokittensRight');
	}
	else {
		$('html').first().removeClass('autokittensRight');
	}
}
function reapplyShadows() {
	if (autoOptions.forceShadowGlobal) {
		$('html').first().addClass('forceShadowGlobal');
		$('html').first().removeClass('forceShadow');
	}
	else if (autoOptions.forceShadow) {
		$('html').first().addClass('forceShadow');
		$('html').first().removeClass('forceShadowGlobal');
	}
	else {
		$('html').first().removeClass('forceShadow');
		$('html').first().removeClass('forceShadowGlobal');
	}
}

function addAutocraftConfigLine(uiContainer, from, to, needsPluralising) {
	const internalTo = to.replace(/\s+([a-z])/gu, (m, l) => l.toUpperCase());
	const labelTo = internalTo.replace(/([A-Z])/gu, l => ` ${l.toLowerCase()}`);
	const suffix = needsPluralising ? '(s)' : '';
	addCheckbox(uiContainer, 'autoOptions.craftOptions', `craft${internalTo.replace(/^[a-z]/u, l => l.toUpperCase())}`, `Automatically convert ${from} to ${labelTo}`);
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', `${internalTo.replace(/^[a-z]/u, l => l.toLowerCase())}Amount`, 'Craft', `${labelTo + suffix} at a time`);
}

function rebuildOptionsUI() {
	const percentages = [
		[ "1%", 0.01 ],
		[ "5%", 0.05 ],
		[ "10%", 0.1 ],
		[ "25%", 0.25 ],
		[ "50%", 0.5 ],
		[ "75%", 0.75 ],
		[ "80%", 0.8 ],
		[ "90%", 0.9 ],
		[ "95%", 0.95 ],
		[ "98%", 0.98 ],
		[ "99%", 0.99 ],
		[ "99.5%", 0.995 ],
		[ "99.9%", 0.999 ],
		[ "100%", 1 ],
	];
	const faithPercentages = [ [ "0%", 0 ], [ "0.1%", 0.001 ] ].concat(percentages);
	const uiContainer = prepareContainer('autoOptions');
	addCheckbox(uiContainer, 'autoOptions', 'autoStar', 'Automatically witness astronomical events');
	addCheckbox(uiContainer, 'autoOptions', 'autoCraft', 'Craft materials when storage is near limit');
	addCheckbox(uiContainer, 'autoOptions', 'autoHunt', 'Hunt when catpower is near limit');
	addCheckbox(uiContainer, 'autoOptions', 'autoPray', 'Praise the sun when faith is near limit');
	addIndent(uiContainer);
	addOptionMenu(uiContainer, 'autoOptions', 'prayLimit', 'Pray when faith is', faithPercentages, 'full');
	addCheckbox(uiContainer, 'autoOptions', 'autoTrade', 'Trade when gold is near limit');
	addCheckbox(uiContainer, 'autoOptions', 'autoFestival', 'Automatically try to hold festivals');
	addHeading(uiContainer, 'Auto-trading');
	const races = [[ "No one", "" ]];
	game.diplomacy.races.forEach(r => {
		if (r.unlocked) {
			races.push([ r.title || r.name, r.name ]);
		}
	});
	addOptionMenu(uiContainer, 'autoOptions.tradeOptions', 'tradePartner', 'Trade with', races, 'by default');
	addCheckbox(uiContainer, 'autoOptions.tradeOptions', 'suppressTradeLog', 'Hide log messages when auto-trading');
	races[0][0] = "Default selection";
	addOptionMenu(uiContainer, 'autoOptions.tradeOptions', 'tradeLimit', 'Trade when gold is', percentages, 'full');
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.tradeOptions', 'tradeCount', 'Send', 'caravans at a time');
	addCheckbox(uiContainer, 'autoOptions.tradeOptions', 'tradeSpring', 'Allow trading in spring');
	addIndent(uiContainer);
	addOptionMenu(uiContainer, 'autoOptions.tradeOptions', 'tradePartnerSpring', 'Trade with', races, ' in spring');
	addCheckbox(uiContainer, 'autoOptions.tradeOptions', 'tradeSummer', 'Allow trading in summer');
	addIndent(uiContainer);
	addOptionMenu(uiContainer, 'autoOptions.tradeOptions', 'tradePartnerSummer', 'Trade with', races, ' in summer');
	addCheckbox(uiContainer, 'autoOptions.tradeOptions', 'tradeAutumn', 'Allow trading in autumn');
	addIndent(uiContainer);
	addOptionMenu(uiContainer, 'autoOptions.tradeOptions', 'tradePartnerAutumn', 'Trade with', races, ' in autumn');
	addCheckbox(uiContainer, 'autoOptions.tradeOptions', 'tradeWinter', 'Allow trading in winter');
	addIndent(uiContainer);
	addOptionMenu(uiContainer, 'autoOptions.tradeOptions', 'tradePartnerWinter', 'Trade with', races, ' in winter');
	addHeading(uiContainer, 'Auto-crafting');
	addTriggerButton(uiContainer, 'Calculate craft amounts', calculateCraftAmounts, 'Will set the numbers to craft as many per operation as possible WITHOUT consuming more per craft (tick) than you MAKE per tick').after('<br />');
	addOptionMenu(uiContainer, 'autoOptions.craftOptions', 'craftLimit', 'Craft when storage is', percentages, 'full');
	addAutocraftConfigLine(uiContainer, 'catnip', 'wood');
	addAutocraftConfigLine(uiContainer, 'wood', 'beam', true);
	addAutocraftConfigLine(uiContainer, 'minerals', 'slab', true);
	addAutocraftConfigLine(uiContainer, 'coal and iron', 'steel');
	addAutocraftConfigLine(uiContainer, 'iron', 'plate', true);
	addAutocraftConfigLine(uiContainer, 'titanium', 'alloy');
	addAutocraftConfigLine(uiContainer, 'oil', 'kerosene');
	addAutocraftConfigLine(uiContainer, 'uranium', 'thorium');
	addAutocraftConfigLine(uiContainer, 'unobtainium', 'eludium');
	addHeading(uiContainer, 'Fur product crafting');
	addTriggerOptionMenu(uiContainer, 'autoOptions.furOptions', 'parchmentMode', 'Auto-craft parchment', [
		[ 'never', 0 ],
		[ 'all, before hunting', 1 ],
		[ 'on full culture storage', 2 ],
		[ 'both', 3 ],
	], '', changeFurCrafts);
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'parchmentAmount', 'When storage full, craft', 'parchment at a time');
	addTriggerOptionMenu(uiContainer, 'autoOptions.furOptions', 'manuscriptMode', 'Auto-craft manuscripts', [
		[ 'never', 0 ],
		[ 'all, before hunting', 1 ],
		[ 'on full culture storage', 2 ],
		[ 'both', 3 ],
	], '', changeFurCrafts);
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'manuscriptAmount', 'When storage full, craft', 'manuscript(s) at a time');
	addIndent(uiContainer);
	addCheckbox(uiContainer, 'autoOptions.craftOptions', 'festivalBuffer', 'When crafting from full storage, preserve enough parchment to hold a festival');
	addTriggerOptionMenu(uiContainer, 'autoOptions.furOptions', 'compendiumMode', 'Auto-craft compendiums', [
		[ 'never', 0 ],
		[ 'all, before hunting', 1 ],
		[ 'on full science storage', 2 ],
		[ 'both', 3 ],
	], '', changeFurCrafts);
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'compediumAmount', 'When storage full, craft', 'compendium(s) at a time');
	addTriggerOptionMenu(uiContainer, 'autoOptions.furOptions', 'blueprintMode', 'Auto-craft blueprints', [
		[ 'never', 0 ],
		[ 'all, before hunting', 1 ],
		[ 'on full science storage', 2 ],
		[ 'both', 3 ],
	], '', changeFurCrafts);
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'blueprintAmount', 'When storage full, craft', 'blueprints(s) at a time');
	addCheckbox(uiContainer, 'autoOptions.craftOptions', 'blueprintPriority', 'When crafting both from full storage, check blueprints before compendiums');
	addHeading(uiContainer, 'Auto-hunting');
	addOptionMenu(uiContainer, 'autoOptions.huntOptions', 'huntLimit', 'Hunt when catpower is', percentages, 'full');
	addCheckbox(uiContainer, 'autoOptions.huntOptions', 'suppressHuntLog', 'Hide log messages when auto-hunting (includes hunt-triggered crafts)');
	addCheckbox(uiContainer, 'autoOptions.huntOptions', 'singleHunts', 'Only send one hunt at a time');
	addCheckbox(uiContainer, 'autoOptions.huntOptions', 'huntEarly', 'Hunt as soon as the maximum number of hunts is reached (relative to the limit)');
	addHeading(uiContainer, 'Timer displays');
	addTriggerCheckbox(uiContainer, 'autoOptions', 'showTimerDisplays', 'Show timer displays below', 'adjustTimerBar()');
	uiContainer.append('Note: Ordering by time may cause elements near cap to frequently switch places.<br />');
	addOptionMenu(uiContainer, 'autoOptions', 'displayOrder', 'Order time displays by', [
		[ 'default order', 'standard' ],
		[ 'shortest first', 'short' ],
		[ 'longest first', 'long' ],
	], '');
	game.resPool.resources.forEach(r => {
		if (typeof autoOptions.displayOptions[r.name] !== 'undefined') {
			addNamedCheckbox(uiContainer, 'autoOptions.displayOptions', r.name, `show${r.name}`, `Show ${r.title || r.name}`);
		}
	});
	addHeading(uiContainer, 'UI options');
	addCheckbox(uiContainer, 'autoOptions', 'warnOnLeave', 'Warn before leaving the page');
	addTriggerCheckbox(uiContainer, 'autoOptions', 'widenUI', 'Make the game use more horizontal space (particularly useful for Grassy theme)', adjustColumns);
	addTriggerCheckbox(uiContainer, 'autoOptions', 'dialogRight', "Move AK dialogs to the right of the window to improve playability", realignSciptDialogs);
	addTriggerCheckbox(uiContainer, 'autoOptions', 'forceShadow', "Enable a light shadow on AK dialogs", reapplyShadows);
	addTriggerCheckbox(uiContainer, 'autoOptions', 'forceShadowGlobal', "Enable a light shadow on ALL dialogs (overrides the above option!)", reapplyShadows);
	addTriggerOptionMenu(uiContainer, 'autoOptions', 'timeDisplay', 'Format time displays as', [
		[ "default", "standard" ],
		[ "short", "short" ],
		[ "seconds", "seconds" ],
	], '', changeTimeFormat);
	addTriggerButton(uiContainer, 'Check for script update', checkUpdate).attr('id', 'autokittens-checkupdate');
	addHeading(uiContainer, 'Reset options');
	uiContainer.append($('<a href="#">Reset options</a>').on('click', () => {
		autoOptions = defaultOptions;
		saveAutoOptions();
		updateOptionsUI();
	}));
	updateOptionsUI();
}
function buildUI() {
	const tableContainer = $('<div id="timerTableContainer"></div>');
	tableContainer.html('<table id="timerTable" style="width: 100%; table-layout: fixed;"></table>');
	$('body').first().append(tableContainer);
	adjustColumns();
	adjustTimerBar();
	realignSciptDialogs();
	$(resetGameLogHeight);
	const optLink = $('<a id="autokittens-optlink" href="#">AutoKittens</a>').on('click', () => {
		rebuildOptionsUI();
		$('#autoOptions').toggle();
	});
	const calcLink = $('<a id="autokittens-calclink" href="#" title="According to my catculations...">Calculators</a>').on('click', () => {
		rebuildCalculatorUI();
		$('#kittenCalcs').toggle();
	});
	$('#headerLinks').append(' | ', optLink, ' | ', calcLink);
	const uiContainer = $('<div class="dialog help autokittens-dialog" id="autoOptions"></div>').hide();
	const calcContainer = $('<div class="dialog help autokittens-dialog" id="kittenCalcs"></div>').hide();
	$('#gamePageContainer').append(uiContainer, calcContainer);
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
		#autokittens-checkupdate {
			width: 100%;
			margin-left: 0;
			margin-right: 0;
			margin-top: 20px;
			margin-bottom: 20px;
			padding: 8px;
			font-size: 1.1em;
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
	`.trim());
	$('head').first().append(inlineStylesheet);
}

function starClick() {
	if (autoOptions.autoStar) {
		(document.getElementById("observeBtn") || {click: NOP}).click();
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
		catpower.value / catpower.maxValue >= autoOptions.huntOptions.huntLimit ||
		autoOptions.huntOptions.huntEarly && catpower.value >= catpower.maxValue - leftBeforeCap - (catpower.maxValue - leftBeforeCap) % 100
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
	// 2: add the `addAutocraftConfigLine(uiContainer, '<from label>', '<internal to>', pluraliseOutputLabelP)` line to `rebuildOptionsUI()` above
	// 3: add a `['<source ID>', '<result ID>', 'craft<Thing>', condition]` line here
	const resources = [
		[
			"catnip",
			"wood",
			"craftWood",
			true,
		],
		[
			"wood",
			"beam",
			"craftBeam",
			game.science.get('construction').researched,
		],
		[
			"minerals",
			"slab",
			"craftSlab",
			game.science.get('construction').researched,
		],
		[
			"coal",
			"steel",
			"craftSteel",
			game.science.get('construction').researched,
		],
		[
			"iron",
			"plate",
			"craftPlate",
			game.science.get('construction').researched,
		],
		[
			"titanium",
			"alloy",
			"craftAlloy",
			game.science.get('construction').researched,
		],
		[
			"oil",
			"kerosene",
			"craftKerosene",
			game.science.get('construction').researched,
		], // Unlocked by Oil Processing tech, but the loop checks craft.unlocked so we don't need to look for the specific tech, just for crafting capability
		[
			"uranium",
			"thorium",
			"craftThorium",
			game.science.get('construction').researched,
		], // Unlocked by Thorium tech
		[
			"unobtainium",
			"eludium",
			"craftEludium",
			game.science.get('construction').researched,
		],
		[
			"culture",
			"parchment",
			"craftParchment",
			game.science.get('construction').researched,
		],
		[
			"culture",
			"manuscript",
			"craftManuscript",
			game.science.get('construction').researched && (!autoOptions.craftOptions.festivalBuffer || game.resPool.get('parchment').value > 2500 + 25 * autoOptions.craftOptions.manuscriptAmount),
		],
		[
			"science",
			"blueprint",
			"craftBlueprint",
			game.science.get('construction').researched && autoOptions.craftOptions.blueprintPriority,
		],
		[
			"science",
			"compedium",
			"craftCompendium",
			game.science.get('construction').researched,
		],
		[
			"science",
			"blueprint",
			"craftBlueprint",
			game.science.get('construction').researched && !autoOptions.craftOptions.blueprintPriority,
		],
	];
	for (let i = 0; i < resources.length; i++) {
		const curRes = game.resPool.get(resources[i][0]);
		if (curRes.maxValue == 0) {
			continue;
		}
		if (
			resources[i][3] &&
			autoOptions.craftOptions[resources[i][2]] &&
			curRes.value / curRes.maxValue >= autoOptions.craftOptions.craftLimit &&
			game.workshop.getCraft(resources[i][1]).unlocked
		) {
			tryCraft(resources[i][1], autoOptions.craftOptions[`${resources[i][1]}Amount`]);
		}
	}
}
function autoPray() {
	if (!autoOptions.autoPray) {
		return;
	}
	const faith = game.resPool.get('faith');
	if (faith.value / faith.maxValue >= autoOptions.prayLimit && faith.value > 0.01) {
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
		game.resPool.get(race.buys[0].name).value < race.buys[0].val ||
		game.resPool.get("manpower").value < 50 ||
		gold.value / gold.maxValue < autoOptions.tradeOptions.tradeLimit
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
function autoFestival() { // FIXME this is not a good implementation (UPDATE: it's causing major fuckery if you can't hold a festival)
	if (game.calendar.festivalDays || !autoOptions.autoFestival || !game.science.get('drama').researched) {
		return;
	}
	const origTab = game.activeTabId;
	if (!(game.villageTab.festivalBtn && game.villageTab.festivalBtn.onClick && game.villageTab.festivalBtn.visible)) {
		game.activeTabId = game.villageTab.tabId;
		game.render();
	}
	if (game.villageTab.festivalBtn.hasResources()) {
		game.villageTab.festivalBtn.onClick();
	}
	if (origTab != game.activeTabId) {
		game.activeTabId = origTab;
		game.render();
	}
}
function processAutoKittens() {
	starClick();
	autoHunt();
	autoCraft();
	autoTrade();
	autoPray();
	autoFestival();
	fillTable();
	updateCalculators();
}

window.addEventListener('beforeunload', () => {
	if (autoOptions.warnOnLeave) {
		return 'Are you sure you want to leave?';
	}
	return false; // If you don't return a STRING then it just goes right on ahead and unloads
});
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
if (!document.getElementById('timerTable')) {
	buildUI();
	rebuildOptionsUI();
}