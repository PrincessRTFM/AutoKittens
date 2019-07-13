const NOP = function() {};

function setArbitrarilyDeepObject(location, value, initialTarget) {
	let target = initialTarget || window;
	if (Array.isArray(location)) location = location.join('.');
	let segments = location.split('.');
	let lastPoint = segments.pop();
	let nextPoint;
	while (nextPoint = segments.shift()) {
		if (typeof(target[nextPoint]) == 'undefined' || target[nextPoint] === null) target[nextPoint] = {};
		target = target[nextPoint];
	}
	target[lastPoint] = value;
}
function wrapCallback(trigger) {
	if (typeof(trigger) == 'function') {
		return trigger;
	}
	else if (typeof(trigger) == 'string') {
		trigger = trigger.replace(";", '').replace("()", '');
		if (typeof(window[trigger]) == 'function') {
			return window[trigger];
		}
		else console.error(`"${trigger}" is not a function name - is it still using the old backasswards method, but so badly we can't even correct for the stupidity?`);
	}
	return NOP;
}
function runCallback(callback, ...args) {
	return (wrapCallback(callback))(...args);
}

function buildUI() {
	let tableContainer = $('<div id="timerTableContainer"></div>');
	tableContainer.html('<table id="timerTable" style="width: 100%; table-layout: fixed;"></table>');
	$('body').first().append(tableContainer);
	adjustColumns();
	adjustTimerBar();
	$(resetGameLogHeight);
	let optLink = $('<a id="autokittens-optlink" href="#">AutoKittens</a>').on('click', () => {
		rebuildOptionsUI();
		$('#autoOptions').toggle();
	});
	let calcLink = $('<a id="autokittens-calclink" href="#" title="According to my catculations...">Calculators</a>').on('click', () => {
		rebuildCalculatorUI();
		$('#kittenCalcs').toggle();
	});
	$('#headerLinks').append(' | ', optLink, ' | ', calcLink);
	let uiContainer = $('<div class="dialog help" id="autoOptions"></div>').hide();
	let calcContainer = $('<div class="dialog help" id="kittenCalcs"></div>').hide();
	$('#gamePageContainer').append(uiContainer, calcContainer);
	let inlineStylesheet = $('<style type="text/css"></style>');
	inlineStylesheet.text(`
		body > #timerTableContainer {
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
		#autoOptions, #kittenCalcs {
			top: 25% !important;
			bottom: 15% !important;
			overflow-y: scroll;
		}
		body:not(.autokittens-show-timers) > #timerTableContainer {
			display: none;
		}
		body.autokittens-show-timers > #timerTableContainer {
			display: block;
		}
		body.autokittens-show-timers > #game {
			margin-bottom: 50px;
		}
		body.autokittens-show-timers > #footerLinks {
			margin-bottom: 60px;
		}
		body.autokittens-show-timers {
			background-position: center bottom 30px;
		}
		.fakelink {
			cursor: pointer;
		}
	`.trim());
	$('head').first().append(inlineStylesheet);
}
function adjustColumns() {
	$('#midColumn').css('width', autoOptions.widenUI ? '1000px' : '');
	$('#leftColumn').css('max-width', autoOptions.widenUI ? '25%' : '');
}
function adjustTimerBar() {
	$('body').first()[autoOptions.showTimerDisplays ? 'addClass' : 'removeClass']('autokittens-show-timers');
}
function addCheckbox(container, prefix, optionName, caption) {
	addNamedCheckbox(container, prefix, optionName, optionName, caption);
}
function addTriggerCheckbox(container, prefix, optionName, caption, trigger) {
	addTriggerNamedCheckbox(container, prefix, optionName, optionName, caption, trigger);
}
function addNamedCheckbox(container, prefix, optionName, controlName, caption) {
	addTriggerNamedCheckbox(container, prefix, optionName, controlName, caption, NOP);
}
function addTriggerNamedCheckbox(container, prefix, optionName, controlName, caption, trigger) {
	container.append($(`<input id="autoKittens_${controlName}" type="checkbox" />`).on('input', function() {
		setArbitrarilyDeepObject([prefix, optionName], this.checked);
		saveAutoOptions();
		runCallback(trigger);
	}), $(`<label for="autoKittens_${controlName}">${caption}</label>`), '<br />');
}
function addHeading(container, title) {
	container.append(`<h3>${title}</h3>`);
}
function addOptionMenu(container, prefix, optionName, left_caption, options, right_caption) {
	addTriggerOptionMenu(container, prefix, optionName, left_caption, options, right_caption, NOP);
}
function addTriggerOptionMenu(container, prefix, optionName, left_caption, options, right_caption, trigger) {
	let select = $(`<select id="autoKittens_${optionName}"></select>`).on('input', function() {
		setArbitrarilyDeepObject([prefix, optionName], $(this).val());
		saveAutoOptions();
		runCallback(trigger);
	});
	let arrayLength = options.length;
	for (let i = 0; i < options.length; i++) {
		const option = options[i];
		if (Array.isArray(option)) select.append(`<option value="${options[i][1]}">${options[i][0]}</option>`);
		else select.append(`<option value="${options[i].value}">${options[i].label}</option>`);
	}
	container.append(left_caption, select, right_caption, '<br />');
}
function addTriggerButton(container, caption, trigger) {
	container.append($('<input type="button" />').attr('value', caption).on('click', wrapCallback(trigger)), '<br />');
}
function addIndent(container) {
	container.append('<span style="width:20px; display:inline-block;"></span>');
}
function addInputField(container, prefix, optionName, left_caption, right_caption) {
	let field = $(`<input id="autoKittens_${optionName}" size="6" type="text" />`).on('input', function() {
		tryNumericSet(prefix, optionName, this.value);
		saveAutoOptions();
	});
	container.append(left_caption, ' ', field, ' ', right_caption, '<br />');
}
function tryNumericParse(value) {
	newVal = parseFloat(value);
	return (!isNaN(newVal) && isFinite(newVal) && newVal > 0) ? newVal : 0;
}
function tryNumericSet(collection, attrName, value) {
	newVal = parseFloat(value);
	if (!isNaN(newVal) && isFinite(newVal) && newVal > 0) setArbitrarilyDeepObject([collection, attrName], newVal);
}
function prepareContainer(id) {
	let result = $('#' + id);
	let internal = $('<a class="close" style="top: 10px; right: 15px; position: absolute;" href="#">close</a>').on('click', result.hide.bind(result));
	result.empty().append(internal);
	return result;
}
function rebuildOptionsUI() {
	let percentages = [["1%", 0.01], ["5%", 0.05],["10%", 0.1],["25%", 0.25],["50%", 0.5],["75%", 0.75],["80%", 0.8],["90%", 0.9],["95%", 0.95], ["98%", 0.98], ["99%", 0.99], ["99.5%", 0.995], ["99.9%", 0.999], ["100%", 1]];
	let faithPercentages = [["0%", 0], ["0.1%", 0.001]].concat(percentages);
	let uiContainer = prepareContainer('autoOptions');
	addCheckbox(uiContainer, 'autoOptions', 'warnOnLeave', 'Warn before leaving the page');
	addTriggerCheckbox(uiContainer, 'autoOptions', 'widenUI', 'Make the game use more horizontal space (particularly useful for Grassy theme)', adjustColumns);
	addCheckbox(uiContainer, 'autoOptions', 'autoStar', 'Automatically witness astronomical events');
	addCheckbox(uiContainer, 'autoOptions', 'autoCraft', 'Craft materials when storage is near limit');
	addCheckbox(uiContainer, 'autoOptions', 'autoHunt', 'Hunt when catpower is near limit');
	addCheckbox(uiContainer, 'autoOptions', 'autoPray', 'Praise the sun when faith is near limit');
	addIndent(uiContainer);
	addOptionMenu(uiContainer, 'autoOptions', 'prayLimit', 'Pray when faith is', faithPercentages, 'full');
	addCheckbox(uiContainer, 'autoOptions', 'autoTrade', 'Trade when gold is near limit');
	addTriggerOptionMenu(uiContainer, 'autoOptions', 'timeDisplay', 'Format time displays as', [
		["default", "standard"],
		["short", "short"],
		["seconds", "seconds"],
	], '', changeTimeFormat);
	addCheckbox(uiContainer, 'autoOptions', 'autoFestival', 'Automatically try to hold festivals');
	addHeading(uiContainer, 'Auto-trading')
	races = [["No one", ""]];
	gamePage.diplomacy.races.forEach(r => {
		if (r.unlocked) races.push([r.title || r.name, r.name]);
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
	addTriggerButton(uiContainer, 'Calculate craft amounts', calculateCraftAmounts);
	addOptionMenu(uiContainer, 'autoOptions.craftOptions', 'craftLimit', 'Craft when storage is', percentages, 'full')
	addCheckbox(uiContainer, 'autoOptions.craftOptions', 'craftWood', 'Automatically convert catnip to wood');
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'woodAmount', 'Craft', 'wood at a time');
	addCheckbox(uiContainer, 'autoOptions.craftOptions', 'craftBeam', 'Automatically convert wood to beams');
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'beamAmount', 'Craft', 'beam(s) at a time');
	addCheckbox(uiContainer, 'autoOptions.craftOptions', 'craftSlab', 'Automatically convert minerals to slabs');
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'slabAmount', 'Craft', 'slab(s) at a time');
	addCheckbox(uiContainer, 'autoOptions.craftOptions', 'craftSteel', 'Automatically convert coal to steel');
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'steelAmount', 'Craft', 'steel at a time');
	addCheckbox(uiContainer, 'autoOptions.craftOptions', 'craftPlate', 'Automatically convert iron to plates');
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'plateAmount', 'Craft', 'plate(s) at a time');
	addCheckbox(uiContainer, 'autoOptions.craftOptions', 'craftAlloy', 'Automatically convert titanium to alloy');
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'alloyAmount', 'Craft', 'alloy at a time');
	addHeading(uiContainer, 'Fur product crafting');
	addTriggerOptionMenu(uiContainer, 'autoOptions.furOptions', 'parchmentMode', 'Auto-craft parchment', [
		['never', 0],
		['all, before hunting', 1],
		['on full culture storage', 2],
		['both', 3],
	], '', changeFurCrafts);
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'parchmentAmount', 'When storage full, craft', 'parchment at a time');
	addTriggerOptionMenu(uiContainer, 'autoOptions.furOptions', 'manuscriptMode', 'Auto-craft manuscripts', [
		['never', 0],
		['all, before hunting', 1],
		['on full culture storage', 2],
		['both', 3],
	], '', changeFurCrafts);
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'manuscriptAmount', 'When storage full, craft', 'manuscript(s) at a time');
	addIndent(uiContainer);
	addCheckbox(uiContainer, 'autoOptions.craftOptions', 'festivalBuffer', 'When crafting from full storage, preserve enough parchment to hold a festival');
	addTriggerOptionMenu(uiContainer, 'autoOptions.furOptions', 'compendiumMode', 'Auto-craft compendiums', [
		['never', 0],
		['all, before hunting', 1],
		['on full science storage', 2],
		['both', 3],
	], '', changeFurCrafts);
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'compediumAmount', 'When storage full, craft', 'compendium(s) at a time');
	addTriggerOptionMenu(uiContainer, 'autoOptions.furOptions', 'blueprintMode', 'Auto-craft blueprints', [
		['never', 0],
		['all, before hunting', 1],
		['on full science storage', 2],
		['both', 3],
	], '', changeFurCrafts);
	addIndent(uiContainer);
	addInputField(uiContainer, 'autoOptions.craftOptions', 'blueprintAmount', 'When storage full, craft', 'blueprints(s) at a time');
	addCheckbox(uiContainer, 'autoOptions.craftOptions', 'blueprintPriority', 'When crafting both from full storage, check blueprints before compendiums');
	addHeading(uiContainer, 'Auto-hunting');
	addOptionMenu(uiContainer, 'autoOptions.huntOptions', 'huntLimit', 'Hunt when catpower is', percentages, 'full')
	addCheckbox(uiContainer, 'autoOptions.huntOptions', 'suppressHuntLog', 'Hide log messages when auto-hunting (includes hunt-triggered crafts)');
	addCheckbox(uiContainer, 'autoOptions.huntOptions', 'singleHunts', 'Only send one hunt at a time');
	addCheckbox(uiContainer, 'autoOptions.huntOptions', 'huntEarly', 'Hunt as soon as the maximum number of hunts is reached (relative to the limit)');
	addHeading(uiContainer, 'Timer displays');
	addTriggerCheckbox(uiContainer, 'autoOptions', 'showTimerDisplays', 'Show timer displays below', 'adjustTimerBar()');
	uiContainer.append('Note: Ordering by time may cause elements near cap to frequently switch places.<br />')
	addOptionMenu(uiContainer, 'autoOptions', 'displayOrder', 'Order time displays by', [
		['default order', 'standard'],
		['shortest first', 'short'],
		['longest first', 'long'],
	], '');
	gamePage.resPool.resources.forEach(r => {
		if (typeof autoOptions.displayOptions[r.name] !== 'undefined') {
			addNamedCheckbox(uiContainer, 'autoOptions.displayOptions', r.name, 'show' + r.name, 'Show ' + (r.title || r.name));
		}
	});
	addHeading(uiContainer, 'Reset options');
	uiContainer.append($('<a href="#">Reset options</a>').on('click', () => {
		autoOptions = defaultOptions;
		saveAutoOptions();
		updateOptionsUI();
	}));
	updateOptionsUI();
}
function changeFurCrafts() {
	let crafts = [
		["parchmentMode", "craftParchment"],
		["manuscriptMode", "craftManuscript"],
		["compendiumMode", "craftCompendium"],
		["blueprintMode", "craftBlueprint"],
	];
	for (let i = 0; i < crafts.length; i++) {
		autoOptions.huntOptions[crafts[i][1]] = autoOptions.furOptions[crafts[i][0]] & 1 ? true : false;
		autoOptions.craftOptions[crafts[i][1]] = autoOptions.furOptions[crafts[i][0]] & 2 ? true : false;
	}
	saveAutoOptions();
}
function saveAutoOptions() {
	LCstorage["kittensgame.autoOptions"] = JSON.stringify(autoOptions);
}
function changeTimeFormat() {
	let formats = {
		standard: defaultTimeFormat,
		short: shortTimeFormat,
		seconds: rawSecondsFormat
	};
	gamePage.toDisplaySeconds = formats[autoOptions.timeDisplay];
}
let defaultTimeFormat = gamePage.toDisplaySeconds;
function shortTimeFormat(secondsRaw) {
	let sec_num = parseInt(secondsRaw, 10); // don't forget the second param
	let hours = Math.floor(sec_num / 3600);
	let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	let seconds = sec_num - (hours * 3600) - (minutes * 60);
	let timeFormated = "";
	if (hours) {
		timeFormated = hours + ":";
	}
	timeFormated += (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds + "";
	return timeFormated;
}
function rawSecondsFormat(secondsRaw) {
	return parseInt(secondsRaw, 10) + "s";
}
let defaultOptions = {
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
		festivalBuffer: false,
		craftParchment: false,
		parchmentAmount: 1,
		craftManuscript: false,
		manuscriptAmount: 1,
		craftCompendium: false,
		compediumAmount: 1,
		craftBlueprint: false,
		blueprintAmount: 1,
		blueprintPriority: false
	},
	furOptions: {
		parchmentMode: 0,
		manuscriptMode: 0,
		compendiumMode: 0,
		blueprintMode: 0
	},
	huntOptions: {
		huntLimit: 0.99,
		suppressHuntLog: false,
		huntEarly: true,
		singleHunts: false,
		craftParchment: false,
		craftManuscript: false,
		craftCompendium: false,
		craftBlueprint: false
	},
	prayLimit: 0.99,
	widenUI: false,
	displayOptions: {
	},
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
		tradePartnerWinter: ""
	},
	showTimerDisplays: true,
};
autoOptions = defaultOptions;
if (LCstorage["kittensgame.autoOptions"]) {
	copyObject(JSON.parse(LCstorage["kittensgame.autoOptions"]), autoOptions);
}
function copyObject(source, target) {
	for (let attrname in source) {
		if (typeof source[attrname] === "object") {
			if (typeof target[attrname] === "undefined") {
				target[attrname] = {};
			}
			copyObject(source[attrname], target[attrname]);
		}
		else {
			if (attrname == 'supressHuntLog') //Fixing a typo
				target['suppressHuntLog'] = source[attrname]
			else
				target[attrname] = source[attrname];
		}
	}
}
function updateOptionsUI() {
	let crafts = [
		["manuscriptMode", "craftManuscript"],
		["compendiumMode", "craftCompendium"],
		["blueprintMode", "craftBlueprint"],
	];
	for (let i = 0; i < crafts.length; i++) {
		autoOptions.furOptions[crafts[i][0]] = 1 * autoOptions.huntOptions[crafts[i][1]]  + 2 * autoOptions.craftOptions[crafts[i][1]];
	}
	traverseObject(autoOptions);
	changeTimeFormat();
}
function traverseObject(obj) {
	for (let o in obj) {
		if (o === "displayOptions") {
			handleDisplayOptions(obj[o]);
		}
		else if (typeof obj[o] === "object") {
			traverseObject(obj[o]);
		}
		else if (typeof obj[o] === "boolean") {
			elms = $("#autoKittens_" + o);
			if (elms && elms[0]) {
				elms[0].checked = obj[o];
			}
		}
		else {
			elms = $("#autoKittens_" + o);
			if (elms && elms[0]) {
				elms[0].value = obj[o];
			}
		}
	}
}
function handleDisplayOptions(obj) {
	for (let o in obj) {
		$("#autoKittens_show" + o)[0].checked = obj[o];
	}
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
	let tickRate = gamePage.ticksPerSecond;
	let resources = []
	gamePage.resPool.resources.forEach(r => {
		let res = {};
		res.name = r.name;
		res.title = r.title || r.name;
		res.perTickUI = r.perTickUI || r.perTickCached;
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
					res.time = (r.maxValue - r.value) / (r.perTickUI * tickRate);
				}
				else if (res.perTickUI < 0) {
					res.time = -r.value / (r.perTickUI * tickRate);
				}
			}
			else if (res.value > 0 && res.perTickUI < 0) {
				res.time = -r.value / (r.perTickUI * tickRate);
			}
		}
		resources.push(res)
	});
	if (autoOptions.displayOrder == "short") {
		resources.sort((a, b) => { return a.time - b.time; });
	}
	else if (autoOptions.displayOrder == "long") {
		resources.sort((a, b) => { return b.time - a.time; });
	}
	for (let i = 0; i < resources.length; i++) {
		r = resources[i];
		let name = r.name;
		let title = r.title;
		if (r.perTickUI !== 0) {
			if (r.maxValue > 0) {
				if (r.value <= 0) {
					contents += formatTableRow(name, title, 'Empty');
				}
				else if (r.value >= r.maxValue) {
					contents += formatTableRow(name, title, 'Full');
				}
				else if (r.perTickUI > 0) {
					contents += formatTableRow(name, title, gamePage.toDisplaySeconds((r.maxValue - r.value) / (r.perTickUI * tickRate)));
				}
				else if (r.perTickUI < 0) {
					contents += formatTableRow(name, title, -gamePage.toDisplaySeconds(-r.value / (r.perTickUI * tickRate)));
				}
				else contents += formatTableRow(name, title, "Err1"); // value > 0 && value < maxValue && (perTickUI || perTickCached) == 0
			}
			else if (r.value > 0 && r.perTickUI < 0) {
				contents += formatTableRow(name, title, -gamePage.toDisplaySeconds(-r.value / (r.perTickUI * tickRate)));
			}
		}
		//else contents += formatTableRow(name, title, "Steady");
	}
	contents += '</tr>';
	document.getElementById('timerTable').innerHTML = contents;
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
let gameTickFunc = gamePage.tick;
let checkInterval = 200;
if (gamePage.worker) {
	gamePage.tick = function() {
		dojo.hitch(gamePage, gameTickFunc)();
		processAutoKittens();
	}
}
else {
	autoKittensTimer = setInterval(processAutoKittens, checkInterval);
}
if (!document.getElementById('timerTable')) {
	buildUI();
}
// Based on http://www.reddit.com/r/kittensgame/comments/2eqlt5/a_few_kittens_game_scripts_ive_put_together/
function starClick() {
	if (autoOptions.autoStar) {
		(document.getElementById("observeBtn") || { click: NOP }).click();
	}
}
function autoHunt() {
	if (!autoOptions.autoHunt) return;
	let msgFunc = gamePage.msg;
	if (autoOptions.huntOptions.suppressHuntLog) {
		gamePage.msg = NOP;
	}
	let catpower = gamePage.resPool.get('manpower');
	let leftBeforeCap = (1 - autoOptions.huntOptions.huntLimit) * catpower.maxValue;
	if (catpower.value / catpower.maxValue >= autoOptions.huntOptions.huntLimit || (autoOptions.huntOptions.huntEarly && catpower.value >= (catpower.maxValue - leftBeforeCap) - ((catpower.maxValue - leftBeforeCap) % 100))) {
		if (autoOptions.huntOptions.craftParchment && gamePage.workshop.getCraft('parchment').unlocked) gamePage.craftAll('parchment');
		if (autoOptions.huntOptions.craftManuscript && gamePage.workshop.getCraft('manuscript').unlocked) gamePage.craftAll('manuscript');
		if (autoOptions.huntOptions.craftCompendium && gamePage.workshop.getCraft('compedium').unlocked) gamePage.craftAll('compedium');
		if (autoOptions.huntOptions.craftBlueprint && gamePage.workshop.getCraft('blueprint').unlocked) gamePage.craftAll('blueprint');
		if (autoOptions.huntOptions.singleHunts) {
			gamePage.village.huntMultiple(1);
		}
		else {
			gamePage.village.huntAll();
		}
	}
	if (autoOptions.huntOptions.suppressHuntLog) {
		gamePage.msg = msgFunc;
	}
}
function tryCraft(craftName, amount) {
	craft = gamePage.workshop.getCraft(craftName);
	prices = craft.prices;
	for (let i = 0; i < prices.length; i++) {
		res = gamePage.resPool.get(prices[i].name);
		if (res.value < prices[i].val * amount) return
	}
	gamePage.craft(craftName, amount);
}
function calculateCraftAmounts() {
	let resources = ["wood", "beam", "slab", "steel", "plate", "alloy", "parchment", "manuscript", "blueprint", "compedium"]
	for (let i = 0; i < resources.length; i++) {
		let craft = gamePage.workshop.getCraft(resources[i]);
		let prices = craft.prices;
		let amount = 1;
		for (let j = 0; j < prices.length; j++) {
			let res = gamePage.resPool.get(prices[j].name);
			let checkVal = Math.min(res.perTickUI, res.maxValue != 0 ? res.maxValue : res.perTickUI);
			if (checkVal > prices[j].val) amount = Math.max(amount, Math.floor(checkVal/prices[j].val))
		}
		autoOptions.craftOptions[resources[i]+'Amount'] = amount
	}
	saveAutoOptions();
	updateOptionsUI();
}
function autoCraft() {
	if (!autoOptions.autoCraft) return;
	let resources = [
		["catnip",   "wood" , "craftWood", true],
		["wood",     "beam" , "craftBeam", gamePage.science.get('construction').researched],
		["minerals", "slab" , "craftSlab", gamePage.science.get('construction').researched],
		["coal",     "steel", "craftSteel", gamePage.science.get('construction').researched],
		["iron",     "plate", "craftPlate", gamePage.science.get('construction').researched],
		["titanium", "alloy", "craftAlloy", gamePage.science.get('construction').researched],
		["culture", "parchment", "craftParchment", gamePage.science.get('construction').researched],
		["culture", "manuscript", "craftManuscript", gamePage.science.get('construction').researched && (!autoOptions.craftOptions.festivalBuffer || gamePage.resPool.get('parchment').value > 2500 + 25 * autoOptions.craftOptions.manuscriptAmount)],
		["science", "blueprint", "craftBlueprint", gamePage.science.get('construction').researched && autoOptions.craftOptions.blueprintPriority],
		["science", "compedium", "craftCompendium", gamePage.science.get('construction').researched],
		["science", "blueprint", "craftBlueprint", gamePage.science.get('construction').researched && !autoOptions.craftOptions.blueprintPriority]
	];
	for (let i = 0; i < resources.length; i++) {
		let curRes = gamePage.resPool.get(resources[i][0]);
		if (curRes.maxValue == 0) continue;
		if (resources[i][3] && autoOptions.craftOptions[resources[i][2]] && curRes.value / curRes.maxValue >= autoOptions.craftOptions.craftLimit && gamePage.workshop.getCraft(resources[i][1]).unlocked) {
			tryCraft(resources[i][1], autoOptions.craftOptions[resources[i][1]+'Amount']);
		}
	}
}
window.onbeforeunload = function(){
	if (autoOptions.warnOnLeave) return 'Are you sure you want to leave?';
};
function autoPray() {
	if (!autoOptions.autoPray) return;
	let faith = gamePage.resPool.get('faith');
	if (faith.value / faith.maxValue >= autoOptions.prayLimit && faith.value > 0.01) {
		gamePage.religion.praise();
	}
}
function autoTrade() {
	if (!autoOptions.autoTrade || autoOptions.tradeOptions.tradePartner === "") return;
	let race;
	let season = ["Spring", "Summer", "Autumn", "Winter"][gamePage.calendar.season];
	if (autoOptions.tradeOptions['tradePartner' + season]) {
		race = gamePage.diplomacy.get(autoOptions.tradeOptions['tradePartner' + season]);
		if (!race.unlocked) {
			autoOptions.tradeOptions['tradePartner' + season] = "";
		}
	}
	else {
		race = gamePage.diplomacy.get(autoOptions.tradeOptions.tradePartner);
		if (!race.unlocked) {
			autoOptions.tradeOptions.tradePartner = "";
		}
	}
	if (!race.unlocked) {
		saveAutoOptions();
		return;
	}
	let gold = gamePage.resPool.get('gold');
	if (gamePage.resPool.get(race.buys[0].name).value < race.buys[0].val || gamePage.resPool.get("manpower").value < 50 || gold.value / gold.maxValue < autoOptions.tradeOptions.tradeLimit) {
		return;
	}
	let msgFunc = gamePage.msg;
	if (autoOptions.tradeOptions.suppressTradeLog) {
		gamePage.msg = NOP;
	}
	if (autoOptions.tradeOptions['trade' + season]) {
		gamePage.diplomacy.tradeMultiple(race, Math.max(autoOptions.tradeOptions.tradeCount, 1));
	}
	if (autoOptions.tradeOptions.suppressTradeLog) {
		gamePage.msg = msgFunc;
	}
}
function autoFestival() { // FIXME this is not a good implementation
	if (gamePage.calendar.festivalDays || !autoOptions.autoFestival || !gamePage.science.get('drama').researched) return;
	let origTab = gamePage.activeTabId;
	if (!(gamePage.villageTab.festivalBtn && gamePage.villageTab.festivalBtn.onClick && gamePage.villageTab.festivalBtn.visible))
	{
		gamePage.activeTabId = gamePage.villageTab.tabId; gamePage.render();
	}
	if (gamePage.villageTab.festivalBtn.hasResources()) {
		gamePage.villageTab.festivalBtn.onClick();
	}
	if (origTab != gamePage.activeTabId) {
		gamePage.activeTabId = origTab; gamePage.render();
	}
}
let calculators=[];
// Calculator UI
//
function addCalculator(container, id, title, contents, calc_func, sub_id, sub_title) {
	if (sub_id) {
		container.append($(`<h3 class="fakelink">${title} (click to show/hide)</h3>`).on('click', function() {
			$(`#${id}_container`).toggle();
		}));
		if (calc_func) {
			calculators.push([[id, sub_id], calc_func]);
		}
		let outerDiv = $(`<div id="${id}_container"></div>`).hide();
		let innerDiv = $(`<div id="${id}"></div>`);
		let subDiv = $(`<div id="${sub_id}"></div>`).hide();
		let subToggle = $(`<h4 class="fakelink">${sub_title} (click to show/hide)</h4>`).on('click', function() {
			subDiv.toggle();
		});
		outerDiv.append(contents, innerDiv, subToggle, subDiv);
		container.append(outerDiv);
	}
	else {
		let sect = $(`<div id="${id}">${contents}</div>`).hide();
		let toggle = $(`<h3 class="fakelink">${title} (click to show/hide)</h3>`).on('click', function() {
			sect.toggle();
		});
		container.append(toggle);
		if (calc_func) {
			calculators.push([[id], calc_func]);
		}
		container.append(sect);
	}
}
function updateCalculators() {
	for (let i in calculators) {
		let c = calculators[i];
		let contents = [].concat(c[1]());
		for (let j in c[0]) {
			$('#' + c[0][j]).html(contents[j])
		}
	}
}
function rebuildCalculatorUI() {
	let calcContainer = prepareContainer('kittenCalcs');
	calculators = [];
	addCalculator(calcContainer, 'unicornCalc', 'Unicorn structures', '<h5>(<a href="https://www.reddit.com/r/kittensgame/comments/2iungv/turning_the_sacrificing_of_unicorns_into_an_exact/" target="_blank">Based on spreadsheet by /u/yatima2975</a>)</h5>', calculateUnicornBuild, 'unicornDetails', 'Calculation details');
	addCalculator(calcContainer, 'buildingCalc', 'Building price calculator', buildingCalculator());
	addCalculator(calcContainer, 'mintCalc', 'Mint efficiency calculator', '', mintCalculator);
	calculateBuildingPrice();
}
// Unicorn calculator
function getZiggurats() {
	return gamePage.bld.get('ziggurat').val;
}
function calculateUnicornBuild() {
	if (gamePage.bld.get('unicornPasture').val == 0) return 'You need at least one Unicorn Pasture to use this. Send off some hunters!';
	let ziggurats = getZiggurats();
	if (ziggurats == 0) return 'You need at least one Ziggurat to use this.';
	let startUps = calculateEffectiveUps();
	let details = '';
	let result = 'Base unicorn production per second: ' + gamePage.getDisplayValue(calculateBaseUps());
	result += '<br />Rift production per second (amortized): ' + gamePage.getDisplayValue(calculateRiftUps());
	result += '<br />Current effective unicorn production per second: ' + gamePage.getDisplayValue(startUps);
	let buildings = ['Unicorn Pasture', 'Unicorn Tomb', 'Ivory Tower', 'Ivory Citadel', 'Sky Palace'];
	let tears = getTearPrices();
	let ivory = getIvoryPrices();
	let increases = [0, 0, 0, 0, 0];
	let best = 0;
	let secondBest = 0;
	for (let i = 0; i < 5; i++) {
		extras = [0, 0, 0, 0, 0];
		extras[i] = 1;
		increases[i] = calculateEffectiveUps(extras) - startUps;
		if (tears[best] / increases[best] > tears[i] / increases[i]) {
			secondBest = best;
			best = i;
		}
		if (tears[secondBest] / increases[secondBest] > tears[i] / increases[i] && i != best || secondBest == best) {
			secondBest = i;
		}
		details += 'Unicorn/s increase with 1 more ' + buildings[i] + ': ' + gamePage.getDisplayValue(increases[i]);
		if (i != 0) {
			details += '<br />Total unicorns needed: ' + gamePage.getDisplayValueExt(Math.ceil(tears[i] / ziggurats) * 2500);
			details += ' (' + gamePage.getDisplayValueExt(tears[i]) +' tears, ' + Math.ceil(tears[i] / ziggurats) + ' sacrifice(s))';
			details += '<br />'+checkUnicornReserves(tears[i], false, startUps, ivory[i]);
		}
		else {
			details += '<br />Total unicorns needed: ' + gamePage.getDisplayValueExt(tears[i] / ziggurats * 2500);
			details += '<br />'+checkUnicornReserves(tears[i] / ziggurats * 2500, true, startUps, ivory[i]);
		}
		details += '<br />Tears for 1 extra unicorn/s: ' + gamePage.getDisplayValueExt(tears[i] / increases[i]) + '<br /><br />';
	}
	result += '<br /><br />Best purchase is ' + buildings[best] + ', by a factor of ' + gamePage.getDisplayValue((tears[secondBest] / increases[secondBest]) / (tears[best] / increases[best]));
	if (best != 0) {
		result += '<br />' + checkUnicornReserves(tears[best], false, startUps, ivory[best]);
	}
	else {
		result += '<br />' + checkUnicornReserves(tears[best] / ziggurats * 2500, true, startUps, ivory[best]);
	}
	return [result, details];
}
function checkUnicornReserves(resNumber, isPasture, currUps, ivoryNeeded) {
	let unicornsLeft = 0;
	if (!isPasture) {
		let tearsLeft = resNumber - gamePage.resPool.get('tears').value;
		unicornsLeft = 2500 * Math.ceil(tearsLeft / getZiggurats());
	}
	else {
		unicornsLeft = resNumber;
	}
	unicornsLeft = unicornsLeft - gamePage.resPool.get('unicorns').value;
	let ivoryLeft = ivoryNeeded - gamePage.resPool.get('ivory').value;
	if (unicornsLeft > 0) {
		return `You need ${gamePage.getDisplayValueExt(unicornsLeft)} more unicorns (approximately ${gamePage.toDisplaySeconds(unicornsLeft/currUps)}) to build this.`;
	}
	if (ivoryLeft > 0){
		return "You have enough unicorns, but need more ivory to build this.";
	}
	else {
		return "You have enough resources to build this now.";
	}
}
function getTearPrices() {
	let result = [0, 0, 0, 0, 0];
	let buildings = [gamePage.bld.get('unicornPasture'), gamePage.religion.getZU('unicornTomb'), gamePage.religion.getZU('ivoryTower'), gamePage.religion.getZU('ivoryCitadel'), gamePage.religion.getZU('skyPalace')];
	for (let i = 0; i < 5; i++) {
		for (let j = 0; j < buildings[i].prices.length; j++) {
			if (buildings[i].prices[j].name == 'unicorns') {
				result[i] = calcPrice(buildings[i].prices[j].val, gamePage.bld.getPriceRatio(buildings[i].name), buildings[i].val) / 2500 * getZiggurats();
			}
			else if (buildings[i].prices[j].name == 'tears') {
				result[i] = calcPrice(buildings[i].prices[j].val, buildings[i].priceRatio, buildings[i].val);
			}
		}
	}
	return result;
}
function getIvoryPrices() {
	let result = [0, 0, 0, 0, 0];
	let buildings = [gamePage.bld.get('unicornPasture'), gamePage.religion.getZU('unicornTomb'), gamePage.religion.getZU('ivoryTower'), gamePage.religion.getZU('ivoryCitadel'), gamePage.religion.getZU('skyPalace')];
	for (let i = 0; i < 5; i++) {
		for (let j = 0; j < buildings[i].prices.length; j++) {
			if (buildings[i].prices[j].name == 'ivory') {
				result[i] = calcPrice(buildings[i].prices[j].val, buildings[i].priceRatio, buildings[i].val);
			}
		}
	}
	return result;
}
function calcPrice(base, ratio, num) {
	for (i = 0; i < num; i++) {
		base *= ratio;
	}
	return base;
}
function calculateBaseUps(extras) {
	extras = extras || [];
	let pastures = gamePage.bld.get('unicornPasture').val + (extras[0] || 0);
	let baseUps = pastures * gamePage.bld.get('unicornPasture').effects['unicornsPerTickBase'] * gamePage.rate;
	let tombs = gamePage.religion.getZU('unicornTomb').val + (extras[1] || 0);
	let towers = gamePage.religion.getZU('ivoryTower').val + (extras[2] || 0);
	let citadels = gamePage.religion.getZU('ivoryCitadel').val + (extras[3] || 0);
	let palaces = gamePage.religion.getZU('skyPalace').val + (extras[4] || 0);
	let tombEffect = gamePage.religion.getZU('unicornTomb').effects['unicornsRatio'];
	let towerEffect = gamePage.religion.getZU('ivoryTower').effects['unicornsRatio'];
	let citadelEffect = gamePage.religion.getZU('ivoryCitadel').effects['unicornsRatio'];
	let palaceEffect = gamePage.religion.getZU('skyPalace').effects['unicornsRatio'];
	let bldEffect = 1 + tombEffect * tombs + towerEffect * towers + citadelEffect * citadels + palaceEffect * palaces;
	let faithEffect = 1;
	if (gamePage.religion.getRU("solarRevolution").researched){
		faithEffect += gamePage.religion.getProductionBonus() / 100;
	}
	let paragonRatio = gamePage.resPool.get("paragon").value * 0.01;
	paragonRatio = 1 + gamePage.bld.getHyperbolicEffect(paragonRatio, 2);
	return baseUps * bldEffect * faithEffect * paragonRatio;
}
function calculateRiftUps(extras) {
	extras = extras || [];
	let unicornChanceRatio = 1;
	if (gamePage.prestige.getPerk("unicornmancy").researched) {
		unicornChanceRatio = 1.1;
	}
	return Math.min(500, 0.25 * unicornChanceRatio * (gamePage.religion.getZU('ivoryTower').val + (extras[2] || 0))) * gamePage.calendar.dayPerTick * gamePage.rate;
}
function calculateEffectiveUps(extras) {
	return calculateBaseUps(extras) + calculateRiftUps(extras);
}
// Building price calculator
function getBldLabel(a) {
	return typeof a.label !== 'undefined' ? a.label : a.stages[a.stage || 0].label
}
function bldLabelCmp(a, b) {
	return getBldLabel(a).localeCompare(getBldLabel(b));
}
function buildingCalculator() {
	let result = '';
	result += '<select id="buildingPriceSelector" oninput="calculateBuildingPrice()">';
	result += '<optgroup label="Buildings">';
	let buildings = gamePage.bld.buildingsData.slice(0);
	buildings.sort(bldLabelCmp);
	for (let i = 0; i < buildings.length; i++) {
		if (buildings[i].unlocked) {
			result += '<option value="bld_' + buildings[i].name + '">' + getBldLabel(buildings[i]) + '</option>';
		}
	}
	if (gamePage.religionTab.visible) {
		result += '</optgroup><optgroup label="Religion">';
		let religion = gamePage.religion.religionUpgrades.slice(0);
		religion.sort(function(a, b){return a.label.localeCompare(b.label)});
		for (let i = 0; i < religion.length; i++) {
			if (gamePage.religion.faith >= religion[i].faith && religion[i].upgradable) {
				result += '<option value="RU_' + religion[i].name + '">' + religion[i].label + '</option>';
			}
		}
	}
	if (gamePage.bld.get('ziggurat').val>0) {
		result += '</optgroup><optgroup label="Ziggurats">';
		let religion = gamePage.religion.zigguratUpgrades.slice(0);
		religion.sort(function(a, b){return a.label.localeCompare(b.label)});
		for (let i = 0; i < religion.length; i++) {
			result += '<option value="ZU_' + religion[i].name + '">' + religion[i].label + '</option>';
		}
	}
	if (gamePage.spaceTab.visible) {
		result += '</optgroup><optgroup label="Space">';
		let space = gamePage.space.programs.slice(0);
		space.sort(function(a, b){return a.title.localeCompare(b.title)});
		for (let i = 0; i < space.length; i++) {
			if (space[i].unlocked && space[i].upgradable) {
				result += '<option value="space_' + space[i].name + '">' + space[i].title + '</option>';
			}
		}
	}
	result += '</optgroup></select><br /><label>Target number of buildings: <input id="buildingPriceNumber" oninput="calculateBuildingPrice();"></label>';
	result += '<div id="buildingPriceHolder"></div>'
	return result;
}
function calculateBuildingPrice() {
	let priceContainer = document.getElementById('buildingPriceHolder');
	let bldName = $('#buildingPriceSelector').val().split('_');
	let bld;
	let priceRatio = 1;
	switch (bldName[0]) {
		case 'bld':
			bld = gamePage.bld.get(bldName[1]);
			priceRatio = gamePage.bld.getPriceRatio(bldName[1]);
			break;
		case 'RU':
			bld = gamePage.religion.getRU(bldName[1]);
			priceRatio = bld.priceRatio;
			break;
		case 'ZU':
			bld = gamePage.religion.getZU(bldName[1]);
			priceRatio = bld.priceRatio;
			break;
		case 'space':
			bld = gamePage.space.getProgram(bldName[1]);
			priceRatio = bld.priceRatio;
			break;
	}
	let prices;
	if(typeof(bld.stages) !== 'undefined') prices = bld.stages[bld.stage || 0].prices;
	else prices = bld.prices;
	let number = Math.floor(tryNumericParse($('#buildingPriceNumber').val()));
	let maxNum = Infinity;
	for (let i = 0; i < prices.length; i++) {
		let resLimit = bld.val;
		let res = gamePage.resPool.get(prices[i].name);
		if ((res.maxValue || 0) == 0) continue;
		if (bldName[0] == 'space' && (prices[i].name == "oil" || prices[i].name == "rocket")) {
			let reductionRatio = 0;
			if (prices[i].name == "oil") reductionRatio = gamePage.bld.getHyperbolicEffect(gamePage.space.getEffect("oilReductionRatio"), 0.75);
			if (res.maxValue > prices[i].val * (1 - reductionRatio)) resLimit = maxNum;
			else resLimit = 0;
		}
		else {
			for (let j = bld.val; ; j++) {
				if (calcPrice(prices[i].val, priceRatio, j) > res.maxValue) {
					resLimit = j;
					break;
				}
			}
		}
		if (resLimit < maxNum) maxNum = resLimit;
	}
	let result = '';
	if (maxNum != Infinity) result += `With your current resource caps, you can build up to ${maxNum} (${maxNum-bld.val} more) of this building.<br />`;
	if (number > 0) {
		result += `Price for ${(bld.label || bld.title || bld.stages[bld.stage || 0].label)} #${number} will be:<br />`;
		for (let i = 0; i < prices.length; i++) {
			let finalPrice;
			if (bldName[0] == 'space' && (prices[i].name == "oil" || prices[i].name == "rocket")) {
				let reductionRatio = 0;
				if (prices[i].name == "oil") reductionRatio = gamePage.bld.getHyperbolicEffect(gamePage.space.getEffect("oilReductionRatio"), 0.75);
				finalPrice = prices[i].val * (1 - reductionRatio);
			}
			else finalPrice = calcPrice(prices[i].val, priceRatio, number - 1);
			let res = gamePage.resPool.get(prices[i].name);
			result += (res.title || res.name) + ': ' + gamePage.getDisplayValueExt(finalPrice) + '<br />';
		}
		if (bld.val < number) {
			result += '<br />Cumulative resources required to reach this:<br />';
			for (let i = 0; i < prices.length; i++) {
				let price = 0;
				if (bldName[0] == 'space' && (prices[i].name == "oil" || prices[i].name == "rocket")) {
					let reductionRatio = 0;
					if (prices[i].name == "oil") reductionRatio = gamePage.bld.getHyperbolicEffect(gamePage.space.getEffect("oilReductionRatio"), 0.75);
					price = prices[i].val  * (1 - reductionRatio) * (number - bld.val);
				}
				else {
					for (let j = bld.val; j < number; j++) {
						price += calcPrice(prices[i].val, priceRatio, j);
					}
				}
				let res = gamePage.resPool.get(prices[i].name);
				result += (res.title || res.name) + ': ' + gamePage.getDisplayValueExt(price) + '<br />';
			}
		}
	}
	priceContainer.innerHTML = result;
}
// Mint/hunter efficiency calculator
function mintCalculator() {
	let hunterRatio = gamePage.workshop.getEffect("hunterRatio");
	let expectedFurs = 32.5 * (hunterRatio + 1);
	let expectedIvory = 20 * (hunterRatio + 1);
	if (2 * hunterRatio < 55) {
		expectedIvory *= 1 - (55 - 2 * hunterRatio) / 100;
	}
	let catpower = gamePage.resPool.get("manpower");
	let catpowerRate = catpower.perTickUI * 5;
	let huntTime = 100 / catpowerRate;
	let huntTimeWithMint = 100 / (catpowerRate - 3.75);
	let fpsNormal = expectedFurs / huntTime;
	let ipsNormal = expectedIvory / huntTime;
	let fpsWithMint = expectedFurs / huntTimeWithMint;
	let ipsWithMint = expectedIvory / huntTimeWithMint;
	let cpratio = (catpower.maxValue * gamePage.bld.get("mint").effects["mintEffect"]) / 100;
	let fpsFromMint = cpratio * 1.25 * 5;
	let ipsFromMint = cpratio * 0.3 * 5;
	let mintsRunning = gamePage.bld.get('mint').on;
	fpsNormal += fpsFromMint * mintsRunning;
	ipsNormal += ipsFromMint * mintsRunning;
	fpsWithMint += fpsFromMint * mintsRunning;
	ipsWithMint += ipsFromMint * mintsRunning;
	let result = "";
	result += "Average furs per hunt: " + gamePage.getDisplayValue(expectedFurs);
	result += "<br />Average ivory per hunt: " + gamePage.getDisplayValue(expectedIvory);
	result += "<br />Average time between hunts: " + gamePage.getDisplayValue(huntTime);
	result += "<br />Approximate furs per second: " + gamePage.getDisplayValue(fpsNormal);
	result += "<br />Approximate ivory per second: " + gamePage.getDisplayValue(ipsNormal);
	result += "<br /><br />With extra mint running:<br />Approximate furs per second: " + gamePage.getDisplayValue(fpsWithMint + fpsFromMint);
	result += "<br />Approximate ivory per second: " + gamePage.getDisplayValue(ipsWithMint + ipsFromMint);
	result += "<br /><br />Profit from extra mint:<br />Furs per second: " + gamePage.getDisplayValue(fpsFromMint + fpsWithMint - fpsNormal);
	result += "<br />Ivory per second: " + gamePage.getDisplayValue(ipsFromMint + ipsWithMint - ipsNormal);
	return result;
}
