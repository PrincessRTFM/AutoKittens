/*
#include common.h
$PROJECT_NAME - helper script for the Kittens Game (https://kittensgame.com/web/)

Original author: Michael Madsen <michael@birdiesoft.dk>
Current maintainer: $SIGNATURE
Repository: $GITHUB/$PROJECT_NAME/

$BUILD_STAMP

#AULBS:$__UNIXTIME__#
*/
// #comment The power stats calculator is hella broken because the game's a mess.
// #comment Define CALC_POWER if you really want it included anyway.

/* eslint-env browser, jquery */
/* global game, LCstorage, $SCRIPT_OPTS:writable, $SCRIPT_CACHE, $SCRIPT_RESMAP */

/* $CONCAT(eslint, -disable) max-len */

(function setupAutoKittens() {
	// The localstorage key for our saved settings
	const savedConfigKey = "kittensgame.$SCRIPT_OPTS";

	// The class that's applied to all of our dialog popups
	const scriptDialogClass = ".autokittens-dialog";

	// The game's own time formatter, for the UI feature to change how durations are rendered
	const defaultTimeFormat = game.toDisplaySeconds;

	// The original tick function, because we have to call it ourselves after overriding the normal ticker
	const gameTickFunc = game.tick;

	// XXX totally forgot what this is for
	const checkInterval = 200;

	// The calculators that are available in a specific dialog popup
	let calculators = [];

	// The internal cache of things we need that WON'T change (much) over time
	let internalCache;

	// The magic "cache" of commonly desired game data. This is made available in the global window for ease of reference.
	const gameDataMap = Object.create(null);

	// Percentages as labels and values for select options, starting from 1%
	const percentages = [
		[ "1%", 0.01 ],
		[ "5%", 0.05 ],
		[ "10%", 0.1 ],
		[ "20%", 0.2 ],
		[ "25%", 0.25 ],
		[ "30%", 0.3 ],
		[ "40%", 0.4 ],
		[ "50%", 0.5 ],
		[ "60%", 0.6 ],
		[ "70%", 0.7 ],
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

	// Percentages starting from 0% (initially for prayer, now for other things too)
	const finePercentages = [
		[ "0%", 0 ],
		[ "0.1%", 0.001 ],
	].concat(percentages);

	// Visibility options for the timer strip
	const TIMERVIS_NEVER = "never";
	const TIMERVIS_ALWAYS = "always";
	const TIMERVIS_FALLING = "falling";
	const TIMERVIS_NOTFULL = "nonfull";
	const timerVisibility = [
		[ "Never", TIMERVIS_NEVER ],
		[ "Always", TIMERVIS_ALWAYS ],
		[ "When falling,", TIMERVIS_FALLING ],
		[ "When not full,", TIMERVIS_NOTFULL ],
	];

	// Resources that should never show up in the timers (internal names)
	const untimed = new Set([
		// neither produced nor consumed automatically
		"karma",
		"paragon",
		"burnedParagon",
		// modification is handled specially
		"antimatter",
		"kittens",
		"temporalFlux",
		// produced/consumed only by crafting or other special actions
		"alloy",
		"beam",
		"slab",
		"plate",
		"concrate", // [sic]
		"steel",
		"gear",
		"alloy",
		"eludium",
		"scaffold",
		"ship",
		"tanker",
		"kerosene",
		"parchment",
		"manuscript",
		"compedium", // [sic]
		"blueprint",
		"megalith",
		"starchart",
		"timeCrystal",
		"sorrow",
		"relic",
		"hashrates",
		"unicorns",
		"alicorn",
		"necrocorn",
		"tears",
		"elderBox",
		"wrappingPaper",
		"void",
		"bloodstone",
		"tMythril",
		"blackcoin",
		"zebras",
	]);

	// More than APPROXIMATELY this many gigaflops will hit AI level 15, causing the AIpocalypse.
	const gigaflopSafeMax = Math.exp(14.5) - 0.1;

	// The default options for a fresh start, tuned to be viable at the beginning of the game
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
			singleHunts: false, // name is a misnomer since this was updated to a configurable limit
			huntCount: 1,
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
		disablePollution: false,
		lunarOutpostOptions: {
			automate: false,
			useMinimumPowerProd: true,
			activationLimit: 0.9,
			reservedUranium: 0.1,
			active: true, // semi-hidden
		},
	};

	// Inject the options into the global namespace - "default" is a slight misnomer because they're also changable here,
	// but the object above only provides the defaults (and the structure) so... it works well enough.
	window.$SCRIPT_OPTS = defaultOptions;

	// A convenience function because typing out `Object.prototype.hasOwnProperty.call` everywhere is a PITA
	function ownProp(target, prop) {
		return Object.prototype.hasOwnProperty.call(target, prop);
	}

	// Sorta like a cross between Array.prototype.forEach and Array.prototype.map, but for objects
	function iterateObject(obj, callback) {
		for (const key of Object.keys(obj)) {
			callback.call(obj, obj[key], key, obj);
		}
		return obj;
	}

	// NOP: no-operation, for when you specifically want to do nothing at all.
	function NOP() {} // eslint-disable-line no-empty-function

	// Given a string (or array) describing (in dot-notation) the path within an object, set the value at that location
	// Designed to allow using any object, but since it's most commonly used to set a global (window) variable, that's the default
	function setArbitrarilyDeepObject(location, value, target = window) {
		if (Array.isArray(location)) {
			location = location.join(".");
		}
		const segments = location.split(".");
		const lastPoint = segments.pop();
		let nextPoint;
		while ((nextPoint = segments.shift())) {
			if (typeof target[nextPoint] == "undefined" || target[nextPoint] === null) {
				target[nextPoint] = {};
			}
			target = target[nextPoint];
		}
		target[lastPoint] = value;
		if (window.$BASIC_DEBUG_TOGGLE) {
			console.log(`Set ${location}=${value}`);
		}
	}

	// Makes sure that you get a callable function for use as a callback, falling back to NOP (see above) as a last resort,
	// so you don't get a halting error about calling a non-function. Can take a function (will be returned unchanged) or a string,
	// which will be looked for in the global window.
	function wrapCallback(trigger) {
		if (typeof trigger == "function") {
			return trigger;
		}
		if (typeof trigger == "string") {
			trigger = trigger.replace(";", "").replace("()", "");
			if (typeof window[trigger] == "function") {
				return window[trigger];
			}
		}
		return NOP;
	}

	// Given a valid value for `wrapCallback()`, immediately run the function it finds with the provided arguments.
	// Given an INvalid value, do nothing because it'll call NOP.
	function runCallback(callback, ...args) {
		return wrapCallback(callback)(...args);
	}

	// Try to set a dot-notated path on `window` to a float (TODO - rename function?) value pulled from a string,
	// allowing only finite positive values. Zero is not permitted.
	function tryNumericSet(optionName, value) {
		const parsed = parseFloat(value);
		if (!isNaN(parsed) && isFinite(parsed) && parsed > 0) {
			setArbitrarilyDeepObject(optionName, parsed);
		}
	}

	// Almost entirely what it sounds like (a deep copy of an object) but with a hack specific to this project.
	function copyObject(source, target) {
		for (const attrname in source) {
			if (typeof source[attrname] === "object") {
				if (typeof target[attrname] === "undefined") {
					target[attrname] = {};
				}
				copyObject(source[attrname], target[attrname]);
			}
			else if (attrname == "supressHuntLog") {
				// Fixing a typo
				target.suppressHuntLog = source[attrname];
			}
			else {
				target[attrname] = source[attrname];
			}
		}
	}

	// Render the given number of seconds as `[[days:]hours:]minutes:seconds`, instead of ``[[days"d" ]hours"h" ]minutes"m" ]seconds"s"`
	function shortTimeFormat(secondsRaw) {
		const secondsNumeric = parseInt(secondsRaw, 10); // don't forget the second param
		const days = Math.floor(secondsNumeric / 86400);
		const hours = Math.floor((secondsNumeric % 86400) / 3600);
		const minutes = Math.floor((secondsNumeric % 3600) / 60);
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

	// Render the given number of seconds as that number with `s` on the end
	function rawSecondsFormat(secondsRaw) {
		return `${parseInt(secondsRaw, 10)}s`;
	}

	// Check for a script update, assuming you can
	// If update checking is blocked (for instance, the build script was told to output to STDOUT for debugging), then the button label
	// just gets made all-caps. Like it's shouting at you "hey, idiot, you can't do that" or something.
	function checkUpdate() {
		const button = $("#autokittens-checkupdate");
		// #ifdef NO_UPDATE_CHECK
		button.val("$CASE_UPPER($UPDATE_CHECK_LABEL)");
		// #else
		if (window.$BASIC_DEBUG_TOGGLE) {
			console.log("Performing update check...");
		}
		const AULBS = "$__UNIXTIME__";
		const SOURCE = "$UPDATE_URL";
		const onError = (xhr, stat, err) => {
			button.val("Update check failed!");
			console.group("AK Update Check (failure)");
			console.info("Status value:", stat);
			console.info("Error value:", err);
			console.groupEnd();
		};
		const doCheck = (data, stat, xhr) => {
			if (typeof data != "string") {
				return void onError(xhr, stat, data);
			}
			const liveVersion = data.match(/#AULBS:(\d+)#/u);
			if (!liveVersion) {
				return void onError(xhr, "no version string", data);
			}
			const liveStamp = parseInt(liveVersion[1], 10);
			if (liveStamp > parseInt(AULBS, 10)) {
				button.val("Update found!");
			}
			else if (liveStamp < AULBS) {
				button.val("Release behind live");
			}
			else {
				button.val("No update available");
			}
		};
		try {
			button.val("Checking...");
			$.ajax(SOURCE, {
				method: "GET",
				cache: false,
				dataType: "text",
				error: onError,
				success: doCheck,
			});
		}
		catch (err) {
			onError(null, "request failed", err);
		}
	// #endif
	}

	// Save our current options into localstorage
	function saveAutoOptions() {
		LCstorage[savedConfigKey] = JSON.stringify(window.$SCRIPT_OPTS);
	}

	// Load stored settings (if any) into the live options
	function loadAutoOptions() {
		if (LCstorage[savedConfigKey]) {
			copyObject(JSON.parse(LCstorage[savedConfigKey]), window.$SCRIPT_OPTS);
		}
	}

	// Update the hunting/crafting options for fur products (the whole set, all the way to blueprints)
	function changeFurCrafts() {
		const crafts = [
			[ "parchmentMode", "craftParchment" ],
			[ "manuscriptMode", "craftManuscript" ],
			[ "compendiumMode", "craftCompendium" ],
			[ "blueprintMode", "craftBlueprint" ],
		];
		for (const craft of crafts) {
			// Man, I wish I could remember what the fuck I was doing here
			window.$SCRIPT_OPTS.huntOptions[craft[1]] = !!(window.$SCRIPT_OPTS.furOptions[craft[0]] & 1);
			window.$SCRIPT_OPTS.craftOptions[craft[1]] = !!(window.$SCRIPT_OPTS.furOptions[craft[0]] & 2);
		}
		saveAutoOptions();
	}

	// Try to craft the given amount of the given thing. Uses the game's own craft function if the check passes.
	// Returns whether or not the craft succeeded. If you pass an invalid craft target, the craft will fail and return false.
	function tryCraft(craftName, amount) {
		// Really rudimentary "do we have enough stuff to craft this?" check
		// If so, crafts it and returns true for success
		const craft = game.workshop.getCraft(craftName);
		if (!craft) {
			return false;
		}
		const prices = craft.prices;
		for (const price of prices) {
			const res = game.resPool.get(price.name);
			if (res.value < price.val * amount) {
				return false;
			}
		}
		game.craft(craftName, amount);
		return true;
	}

	// Overrides the game's time display function according to the user's selected option
	function changeTimeFormat() {
		const formats = {
			standard: defaultTimeFormat,
			short: shortTimeFormat,
			seconds: rawSecondsFormat,
		};
		game.toDisplaySeconds = formats[$SCRIPT_OPTS.timeDisplay];
	}

	// XXX man, I can barely track my own UI code. I gotta refactor this shit.
	function handleDisplayOptions(obj) {
		for (const o of Object.keys(obj)) {
			const toggle = $(`#$CONCAT($ID_PREFIX, show)${o}`);
			if (toggle.length) {
				// The toggle might not exist yet, since the UI overhaul
				if (window.$BASIC_DEBUG_TOGGLE) {
					console.log(`${toggle[0].id}.checked=${obj[o]}`);
				}
				toggle[0].checked = obj[o];
			}
		}
	}
	// Traverse the provided object (DO NOT provide a stack!) to update settings on the page itself
	// XXX rename this - or better, refactor it out of existence
	function traverseObject(obj, stack = [ "$SCRIPT_OPTS" ]) {
		for (const o of Object.keys(obj)) {
			if (o === "displayOptions") {
				handleDisplayOptions(obj[o]);
			}
			else if (typeof obj[o] === "object") {
				traverseObject(obj[o], stack.concat(o));
			}
			else if (typeof obj[o] === "boolean") {
				const id = `#$ID_PREFIX${stack.concat(o).join("_")}`;
				const elms = $(id);
				if (elms && elms[0]) {
					if (window.$BASIC_DEBUG_TOGGLE) {
						console.log(`${elms[0].id}.checked=${obj[o]}`);
					}
					elms[0].checked = obj[o];
				}
				else if (window.$BASIC_DEBUG_TOGGLE) {
					console.warn(`Couldn't find a node with ID "${id}"`);
				}
			}
			else {
				const id = `#$ID_PREFIX${stack.concat(o).join("_")}`;
				const elms = $(id);
				if (elms && elms[0]) {
					if (window.$BASIC_DEBUG_TOGGLE) {
						console.log(`${elms[0].id}.value=${obj[o]}`);
					}
					elms[0].value = obj[o];
				}
				else if (window.$BASIC_DEBUG_TOGGLE) {
					console.warn(`Couldn't find a node with ID "${id}"`);
				}
			}
		}
	}
	// XXX again, existing UI code is shit
	function updateOptionsUI() {
		const crafts = [
			[ "manuscriptMode", "craftManuscript" ],
			[ "compendiumMode", "craftCompendium" ],
			[ "blueprintMode", "craftBlueprint" ],
		];
		for (const craft of crafts) {
			$SCRIPT_OPTS.furOptions[craft[0]] = Number($SCRIPT_OPTS.huntOptions[craft[1]]) + 2 * $SCRIPT_OPTS.craftOptions[craft[1]];
		}
		traverseObject($SCRIPT_OPTS);
		changeTimeFormat();
	}

	// Resize the three columns based on the current settings
	function adjustColumns() {
		if (window.$BASIC_DEBUG_TOGGLE) {
			console.log("Adjusting column widths");
		}
		$("#midColumn").css("width", $SCRIPT_OPTS.widenUI ? "1000px" : "");
		$("#leftColumn").css("max-width", $SCRIPT_OPTS.widenUI ? "25%" : "");
	}

	// Toggle whether the timers are visible or not
	function adjustTimerBar() {
		if ($SCRIPT_OPTS.showTimerDisplays) {
			$("html").addClass("autokittens-show-timers");
		}
		else {
			$("html").removeClass("autokittens-show-timers");
		}
	}

	// Add a checkbox to a container node for a specific toggle option.
	// When toggled, update the live settings and then run the optional callback.
	function addCheckbox(container, optionName, caption, trigger = NOP) {
		container.append(
			$(`<input id="$ID_PREFIX${optionName.replace(/\./gu, "_")}" type="checkbox" />`).on(
				"input",
				function updateAutoKittensCheckboxSettingOnValueChange() {
					setArbitrarilyDeepObject(optionName, this.checked);
					saveAutoOptions();
					runCallback(trigger);
				}
			),
			$(`<label for="$ID_PREFIX${optionName.replace(/\./gu, "_")}">${caption}</label>`),
			"<br />"
		);
	}

	// Add an external-value checkbox to a container node. The condition determines the initial state, the callback has to handle changes.
	function addExternCheckbox(container, controlName, caption, trigger, condition) {
		const callback = wrapCallback(trigger);
		const checkbox = $(`<input id="$CONCAT($ID_PREFIX, extern)_${controlName}" type="checkbox" />`);
		const label = $(`<label for="$CONCAT($ID_PREFIX, extern)_${controlName}">${caption}</label>`);
		checkbox[0].checked = typeof condition == "function" ? condition() : !!condition;
		checkbox.on("input", () => callback(checkbox[0]));
		if (window.$BASIC_DEBUG_TOGGLE) {
			console.log(`Creating external checkbox ${checkbox[0].id} as ${checkbox[0].checked ? "en" : "dis"}abled`);
		}
		container.append(checkbox, label, "<br />");
	}

	// Add a section heading to a container node
	function addHeading(container, title) {
		container.append(`<h3>${title}</h3>`);
	}

	// Add a dropdown option menu to a container node. Left and right captions may be empty but must be strings.
	// The options should be an array of either two-element arrays as [label, value] or objects with keys `label` and `value`.
	function addOptionMenu(container, optionName, leftCaption, options, rightCaption, trigger = NOP) {
		const select = $(`<select id="$ID_PREFIX${optionName.replace(/\./gu, "_")}"></select>`).on(
			"input",
			function updateAutoKittensDropdownSettingOnValueChange() {
				setArbitrarilyDeepObject(optionName, $(this).val());
				saveAutoOptions();
				runCallback(trigger);
			}
		);
		for (const option of options) {
			if (Array.isArray(option)) {
				select.append(`<option value="${option[1]}">${option[0]}</option>`);
			}
			else {
				select.append(`<option value="${option.value}">${option.label}</option>`);
			}
		}
		if (leftCaption.trim()) {
			leftCaption = `${leftCaption.trim()} `;
		}
		if (rightCaption.trim()) {
			rightCaption = ` ${rightCaption.trim()}`;
		}
		container.append(leftCaption, select, rightCaption, "<br />");
	}

	// Add a button to a container node to do something when clicked, with an optional tooltip hint
	function addButton(container, caption, trigger, hint) {
		const button = $('<input type="button" />')
			.attr("value", caption)
			.on("click", wrapCallback(trigger));
		if (hint) {
			button.attr("title", hint);
		}
		container.append(button, "<br />");
		return button;
	}

	// Add a simple indentation element to a container node
	function addIndent(container) {
		container.append('<span style="width:20px; display:inline-block;"></span>');
	}

	// Add a numeric (floating point, finite, positive non-zero) input box to a container node
	function addInputField(container, optionName, leftCaption, rightCaption) {
		const field = $(`<input id="$ID_PREFIX${optionName.replace(/\./gu, "_")}" size="6" type="text" />`).on(
			"input",
			function updateAutoKittensTextSettingOnValueChanged() {
				tryNumericSet(optionName, this.value);
				saveAutoOptions();
			}
		);
		if (leftCaption.trim()) {
			leftCaption = `${leftCaption.trim()} `;
		}
		if (rightCaption.trim()) {
			rightCaption = ` ${rightCaption.trim()}`;
		}
		container.append(leftCaption, field, rightCaption, "<br />");
	}

	// Prepare a container node for population (XXX - shitty UI code again)
	function prepareContainer(id) {
		let result;
		if (typeof id == "object") {
			result = id;
		}
		else {
			result = $(`#${id}`);
		}
		const containerID = result.attr("id").toLowerCase();
		const closeLink = $('<a class="close" href="#">close</a>').on("click", () => {
			$(scriptDialogClass).hide();
		});
		const backLink = $('<a class="close" href="#">back</a>').on("click", () => {
			$(scriptDialogClass).hide();
			$("#akSettingsMaster").show();
		});
		const linkContainer = $('<span style="top: 10px; right: 15px; position: absolute;"></span>').append(closeLink);
		if (containerID.startsWith("aksettings") && !containerID.endsWith("master")) {
			linkContainer.prepend(backLink, " | ");
		}
		result.empty().append(linkContainer);
		return result;
	}

	// Construct the timer strip
	function fillTable() {
		let contents = "<tr>";
		const tickRate = game.getTicksPerSecondUI();
		const resources = [];
		for (let resIndex = 0; resIndex < game.resPool.resources.length; resIndex++) {
			const r = game.resPool.resources[resIndex];
			if (untimed.has(r.name)) {
				continue;
			}
			const res = {
				name: r.name,
				title: r.title || r.name,
				// Is this the right property name for this? No.
				// Am I willing to refactor all of this to do it right? Also no.
				perTickUI: game.getResourcePerTick(r.name, true),
				value: r.value,
				maxValue: r.name == "gflops" ? gigaflopSafeMax : r.maxValue,
			};
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
		if ($SCRIPT_OPTS.displayOrder == "short") {
			resources.sort((a, b) => a.time - b.time);
		}
		else if ($SCRIPT_OPTS.displayOrder == "long") {
			resources.sort((a, b) => b.time - a.time);
		}
		for (const r of resources) {
			if (typeof $SCRIPT_OPTS.displayOptions[r.name] == "undefined") {
				$SCRIPT_OPTS.displayOptions[r.name] = TIMERVIS_NEVER;
			}
			// Migration from the old on-or-off options
			else if (typeof $SCRIPT_OPTS.displayOptions[r.name] === "boolean") {
				$SCRIPT_OPTS.displayOptions[r.name] = $SCRIPT_OPTS.displayOptions[r.name] ? TIMERVIS_ALWAYS : TIMERVIS_NEVER;
			}
			const displayMode = $SCRIPT_OPTS.displayOptions[r.name];
			const hasMax = r.maxValue > 0;
			const isFalling = r.perTickUI < 0;
			const isRising = r.perTickUI > 0;
			const isChanging = isFalling || isRising;
			const isFull = hasMax && r.value >= r.maxValue;
			const isEmpty = r.value <= 0;
			if (displayMode != TIMERVIS_NEVER) {
				let timeDisplay;
				if (isEmpty) {
					timeDisplay = "Empty";
				}
				else if (isFalling) {
					timeDisplay = `-${game.toDisplaySeconds(-r.value / (r.perTickUI * tickRate))}`;
				}
				else if (isFull) {
					timeDisplay = "Full";
				}
				else if (hasMax && isRising) {
					timeDisplay = game.toDisplaySeconds((r.maxValue - r.value) / (r.perTickUI * tickRate));
				}
				else if (!isChanging) {
					timeDisplay = "No change";
				}
				if (
					displayMode == TIMERVIS_ALWAYS
					|| (displayMode == TIMERVIS_FALLING && isFalling)
					|| (displayMode == TIMERVIS_NOTFULL && !isFull)
				) {
					contents += `<td style="text-align:center">${r.title}<br />${timeDisplay}</td>`;
				}
			}
		}
		contents += "</tr>";
		document.querySelector("#timerTable").innerHTML = contents;
	}

	// The calculator for mint profits - generates the HTML that gets slapped into the calculator window
	function mintCalculator() {
		const hunterRatio = game.getEffect("hunterRatio") + game.village.getEffectLeader("manager", 0);
		const expectedFursFromHunts = 32.5 * (hunterRatio + 1);
		let expectedIvoryFromHunts = 20 * (hunterRatio + 1);
		if (2 * hunterRatio < 55) {
			expectedIvoryFromHunts *= 1 - (55 - 2 * hunterRatio) / 100;
		}
		const mintBuildingData = game.bld.getBuildingExt("mint");
		const mintsRunning = mintBuildingData.get("on");
		const catpower = game.resPool.get("manpower");
		const catpowerRateBase = (catpower.perTickUI || catpower.perTickCached) * game.ticksPerSecond;
		const catpowerRateWithMints
		= ((catpower.perTickUI || catpower.perTickCached)
			+ mintBuildingData.get("effects").manpowerPerTickCon * mintsRunning)
		* game.ticksPerSecond;
		const huntTimeWithoutMint = 100 / catpowerRateBase;
		const huntTimeWithMint = 100 / catpowerRateWithMints;
		const fpsHuntsNoMints = expectedFursFromHunts / huntTimeWithoutMint;
		const ipsHuntsNoMints = expectedIvoryFromHunts / huntTimeWithoutMint;
		let fpsHuntsWithMint = expectedFursFromHunts / huntTimeWithMint;
		let ipsHuntsWithMint = expectedIvoryFromHunts / huntTimeWithMint;
		const fpsFromMint = mintBuildingData.get("effects").fursPerTickProd * mintsRunning * game.ticksPerSecond;
		const ipsFromMint = mintBuildingData.get("effects").ivoryPerTickProd * mintsRunning * game.ticksPerSecond;
		fpsHuntsWithMint += fpsFromMint;
		ipsHuntsWithMint += ipsFromMint;
		const fpsProfitWithMints = fpsFromMint + fpsHuntsWithMint - fpsHuntsNoMints;
		const ipsProfitWithMints = ipsFromMint + ipsHuntsWithMint - ipsHuntsNoMints;
		const mintNoun = `mint${mintsRunning == 1 ? "" : "s"}`;
		const mintString = `${mintsRunning} ${mintNoun}`;
		const fpsLossTag = fpsProfitWithMints < 0 ? " (LOSS)" : "";
		const ipsLossTag = ipsProfitWithMints < 0 ? " (LOSS)" : "";
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

	// As above, but to calculate the AIpocalypse danger
	function aiCalculator() {
		const gflopsRes = $SCRIPT_RESMAP.gigaflops;
		const hashRes = $SCRIPT_RESMAP.hashes;
		const aiCoreData = game.bld.get("aiCore");
		const entanglerData = game.space.getBuilding("entangler");
		const gigaflops = gflopsRes.value;
		const hashes = hashRes.value;
		const hashesPerTick = hashRes.perTickUI || hashRes.perTickCached;
		const hashLevel = $SCRIPT_RESMAP.hashLevel;
		const gigaflopsPerTick = gflopsRes.perTickUI || gflopsRes.perTickCached;
		const gigaflopProdPerTickRaw = aiCoreData.effects.gflopsPerTickBase;
		const gigaflopProdPerTickEffective = gigaflopProdPerTickRaw * aiCoreData.on;
		const gigaflopConsumePerTickRaw = entanglerData.effects.gflopsConsumption;
		const gigaflopConsumePerTickEffective = gigaflopConsumePerTickRaw * entanglerData.on;
		const aiLevel = $SCRIPT_RESMAP.aiLevel;
		const gigaflopsNeeded = $SCRIPT_RESMAP.gigaflopsToNextLevel;
		const hashesNeeded = $SCRIPT_RESMAP.hashesToNextLevel;
		const timeToNextAiLevel = gigaflopsNeeded / (gigaflopsPerTick * game.ticksPerSecond);
		const timeToNextHashLevel = hashesNeeded / (hashesPerTick * game.ticksPerSecond);
		const internalCheckTag
		= gigaflopProdPerTickEffective - gigaflopConsumePerTickEffective == gigaflopsPerTick
			? "checks out"
			: "<b>INTERNAL MATH ERROR!</b>";
		const timeToNextLevelOfAI = isFinite(timeToNextAiLevel)
			? game.toDisplaySeconds(timeToNextAiLevel)
			: "<i>no gigaflops being produced</i>";
		const timeToNextLevelOfHashes = isFinite(timeToNextHashLevel)
			? game.toDisplaySeconds(timeToNextHashLevel)
			: "<i>no hashes being produced</i>";
		const result = [
			`Current gigaflops: ${gigaflops}`,
			`Net gigaflops per tick: ${gigaflopsPerTick} - ${internalCheckTag}`,
			`Current AI level: ${aiLevel}`,
		];
		if (aiLevel > 14) {
			const gigaflopsToLose = gigaflops - gigaflopSafeMax;
			const timeUntilSafetyFromSkynet
			= game.toDisplaySeconds(Math.abs(gigaflopsToLose / (gigaflopsPerTick * game.ticksPerSecond))) || "now";
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
			const timeUntilDangerFromSkynet
			= game.toDisplaySeconds(Math.abs(gigaflopsToHitMax / (gigaflopsPerTick * game.ticksPerSecond))) || "now";
			result.push(
				"The AI apocalypse will not occur yet",
				`Gigaflops needed to reach maximum safe limit: ${gigaflopsToHitMax}`
			);
			if (gigaflopsPerTick > 0) {
				result.push(`Time to reach maximum safe limit: ${timeUntilDangerFromSkynet}`);
			}
			else if (gigaflopsPerTick == 0) {
				result.push("AI Level is steady - AI apocalypse is not possible");
			}
			else {
				result.push("AI Level is falling - AI apocalypse is not possible");
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

	// As above, but for power usage and generation
	function powerCalculator() {
		const sections = [];
		// #ifdef CALC_POWER
		const structures = []
			.concat(game.bld.buildingsData)
			.concat(...game.space.planets.map((p) => p.buildings))
			.concat(...game.time.meta.map((m) => m.meta));
		const generation = [
			"<table>", "<tbody>",
		];
		const consumption = [
			"<table>", "<tbody>",
		];
		let totalProd = 0;
		let totalCons = 0;
		for (const struct of structures) {
			const name = struct.label || struct.stages[struct.stage].label;
			const count = struct.on;
			const effects = struct.effects;
			if (typeof effects == "object" && count > 0) {
				const prod = effects.energyProduction || 0;
				const cons = effects.energyConsumption || 0;
				if (prod) {
					totalProd += prod * count;
					generation.push(
						"<tr>",
						`<td>${name}</td>`,
						`<td>${(prod * count).toFixed(2)}</td>`,
						`<td>(${prod.toFixed(2)} x ${count})</td>`,
						"</tr>"
					);
				}
				if (cons) {
					totalCons += cons * count;
					consumption.push(
						"<tr>",
						`<td>${name}</td>`,
						`<td>${(cons * count).toFixed(2)}</td>`,
						`<td>(${cons.toFixed(2)} x ${count})</td>`,
						"</tr>"
					);
				}
			}
		}
		sections.push(
			consumption.concat(
				"<tr class=\"spacer\">",
				"<td colspan=\"3\"></td>",
				"</tr",
				"<tr>",
				"<td>Total consumption</td>",
				`<td colspan="2">${totalCons}</td>`,
				"</tr>",
				"</tbody>",
				"</table>"
			).join("\n")
		);
		sections.push(
			generation.concat(
				"<tr class=\"spacer\">",
				"<td colspan=\"3\"></td>",
				"</tr",
				"<tr>",
				"<td>Total production</td>",
				`<td colspan="2">${totalProd}</td>`,
				"</tr>",
				"</tbody>",
				"</table>"
			).join("\n")
		);
		// #else
		const lines = [];
		const currentProd = parseFloat(game.resPool.energyProd.toFixed(2));
		const safeUsage = parseFloat(game.resPool.energyWinterProd.toFixed(2));
		const currentUsage = parseFloat(game.resPool.energyCons.toFixed(2));
		lines.push(`Power production: ${currentProd}`);
		if (game.calendar.season != 3) {
			lines.push(`Minimum power production: ${safeUsage}`);
		}
		lines.push(`Power consumption: ${currentUsage}`);
		if (currentUsage < safeUsage) {
			lines.push(`Maximum safe additional usage: ${(safeUsage - currentUsage).toFixed(2)}`);
		}
		else if (currentUsage > currentProd) {
			lines.push(`<b>Usage exceeds current limit by ${(currentUsage - currentProd).toFixed(2)}!</b>`);
		}
		else if (currentUsage > safeUsage) {
			lines.push(`</b>Usage exceeds safe limit by ${(currentUsage - safeUsage).toFixed(2)}!<b>`);
		}
		else {
			lines.push("Power usage is at capacity. Do not draw additional energy.");
		}
		sections.push(lines.join("<br/>\n"));
		// #endif
		return sections;
	}

	// Assemble the UI for a calculator, and shove the details into the calculators array
	function addCalculator(wnd, id, title, calcFunc, subsectionId, subsectionTitle) {
		// container
		// > mainToggle
		// > contents
		// > > mainSection
		// ? > subToggle
		// ? > subSection
		const container = $(`<div id="${id}_container" class="calculator container"></div>`);
		const contents = $(`<div id="${id}_content" class="calculator container"></div>`).hide();
		const mainToggle = $(`<h3 class="fakelink">${title}</h3>`).on("click", () => {
			contents.toggle();
		});
		const mainSection = $(`<div id="${id}" class="calculator section"></div>`);
		const ids = [ id ];
		contents.append(mainSection);
		container.append(mainToggle, contents);
		if (subsectionId && subsectionTitle) {
			const subSection = $(`<div id="${subsectionId}" class="calculator subsection"></div>`).hide();
			const subToggle = $(`<h4 class="fakelink">${subsectionTitle}</h4>`).on("click", () => {
				subSection.toggle();
			});
			contents.append(subToggle, subSection);
			ids.push(subsectionId);
		}
		calculators.push([
			ids, calcFunc,
		]);
		wnd.append(container);
	}
	// Update all of the calculators by calling their function and then writing the returned HTML into the UI
	function updateCalculators() {
		for (const c of calculators) {
			const contents = [].concat(c[1]());
			for (let n = 0; n < c[0].length; n++) {
				document.querySelector(`#kittenCalcs #${c[0][n]}`).innerHTML = contents[n];
			}
		}
	}
	// Completely rebuild the calculator UI by wiping everything and then reassigning the calculators themselves
	function rebuildCalculatorUI() {
		const calcContainer = prepareContainer("kittenCalcs");
		calculators = [];
		addCalculator(calcContainer, "mintCalc", "Mint efficiency calculator", mintCalculator);
		addCalculator(calcContainer, "aiCalc", "AI, gigaflops, and hashes", aiCalculator);
		// #ifdef CALC_POWER
		addCalculator(calcContainer, "powerCalc", "Power stats", powerCalculator, "powerGenerationCalc", "Generation");
		// #else
		addCalculator(calcContainer, "powerCalc", "Power stats", powerCalculator);
	// #endif
	}

	// Toggle whether our script dialogs should be pushed to the right or positioned normally
	function realignSciptDialogs() {
		if ($SCRIPT_OPTS.dialogRight) {
			$("html").addClass("autokittensRight");
		}
		else {
			$("html").removeClass("autokittensRight");
		}
	}
	// Toggle between the three dialog-shadow states (all dialogs, our dialogs, no dialogs)
	function reapplyShadows() {
		if ($SCRIPT_OPTS.forceShadowGlobal) {
			$("html")
				.addClass("forceShadowGlobal")
				.removeClass("forceShadow");
		}
		else if ($SCRIPT_OPTS.forceShadow) {
			$("html")
				.addClass("forceShadow")
				.removeClass("forceShadowGlobal");
		}
		else {
			$("html")
				.removeClass("forceShadow")
				.removeClass("forceShadowGlobal");
		}
	}

	// Unlock the game's UI theme with the given internal name, assuming it's not a default one
	function unlockGameTheme(name) {
		if (game.ui.defaultSchemes.includes(name)) {
			return;
		}
		if (game.ui.allSchemes.includes(name)) {
			if (window.$BASIC_DEBUG_TOGGLE) {
				console.log(`Unlocking game theme ${name}`);
			}
			if (!game.unlockedSchemes.includes(name)) {
				game.unlockedSchemes.push(name);
			}
			$(`#schemeToggle > option[value=${name}]`).removeAttr("disabled");
			(document.querySelector(`input#$CONCAT($ID_PREFIX, extern_theme)_${name}`) || {}).checked = true;
			game.ui.updateOptions();
		}
	}
	// Locks the game's UI theme by the given internal name, unless it's a default one
	function lockGameTheme(name) {
		if (game.ui.defaultSchemes.includes(name)) {
			return;
		}
		if (game.ui.allSchemes.includes(name)) {
			if (window.$BASIC_DEBUG_TOGGLE) {
				console.log(`Locking game theme ${name}`);
			}
			const idx = game.unlockedSchemes.indexOf(name);
			if (idx >= 0) {
				game.unlockedSchemes.splice(idx, 1);
			}
			$(`#schemeToggle > option[value=${name}]`).attr("disabled", "disabled");
			(document.querySelector(`#$CONCAT($ID_PREFIX, extern_theme)_${name}`) || {}).checked = false;
			game.ui.updateOptions();
		}
	}
	// Unlock all non-default UI themes
	function unlockAllGameThemes() {
		for (const scheme of game.ui.allSchemes) {
			unlockGameTheme(scheme);
		}
	}
	// Lock all non-default UI themes
	function lockAllGameThemes() {
		for (const scheme of game.ui.allSchemes) {
			lockGameTheme(scheme);
		}
	}

	// Name's misleading cause it adds THREE lines - toggle, amount, rate - for autocrafting
	// XXX refactor this too during the Grand UI Overhaul(tm)
	function addAutocraftConfigLine(uiContainer, from, to, needsPluralising, labelFix) {
		const internalTo = to.replace(/\s+([a-z])/gu, (m, l) => l.toUpperCase());
		const labelTo = labelFix || internalTo.replace(/([A-Z])/gu, (l) => ` ${l.toLowerCase()}`);
		const questioningSuffix = needsPluralising ? "(s)" : "";
		const certainSuffix = needsPluralising ? "s" : "";
		addCheckbox(
			uiContainer,
			`$SCRIPT_OPTS.craftOptions.craft${internalTo.replace(/^[a-z]/u, (l) => l.toUpperCase())}`,
			`Automatically convert ${from} to ${labelTo + certainSuffix}`
		);
		addIndent(uiContainer);
		addInputField(
			uiContainer,
			`$SCRIPT_OPTS.craftOptions.${internalTo.replace(/^[a-z]/u, (l) => l.toLowerCase())}Amount`,
			"Craft",
			`${labelTo + questioningSuffix} at a time`
		);
		addIndent(uiContainer);
		addInputField(
			uiContainer,
			`$SCRIPT_OPTS.craftOptions.${internalTo.replace(/^[a-z]/u, (l) => l.toLowerCase())}Interval`,
			`Craft ${labelTo + certainSuffix} every`,
			"game tick(s)"
		);
	}

	// Completely rebuilds the entire UI settings pane (XXX - bad)
	function rebuildOptionsPaneGeneralUI() {
		const uiContainer = prepareContainer("akSettingsUi");
		addHeading(uiContainer, "Timer displays");
		addCheckbox(uiContainer, "$SCRIPT_OPTS.showTimerDisplays", "Show timer displays below", adjustTimerBar);
		uiContainer.append("Note: Ordering by time may cause elements near cap to frequently switch places.<br />");
		addOptionMenu(
			uiContainer,
			"$SCRIPT_OPTS.displayOrder",
			"Order time displays by",
			[
				[ "default order", "standard" ],
				[ "shortest first", "short" ],
				[ "longest first", "long" ],
			],
			""
		);
		game.resPool.resources.forEach((r) => {
			if (typeof $SCRIPT_OPTS.displayOptions[r.name] !== "undefined") {
				addOptionMenu(uiContainer, `$SCRIPT_OPTS.displayOptions.${r.name}`, "", timerVisibility, `show ${r.title || r.name}`);
			}
		});
		addHeading(uiContainer, "Game options");
		addCheckbox(uiContainer, "$SCRIPT_OPTS.autoStar", "Automatically witness astronomical events");
		addHeading(uiContainer, "Game themes");
		addButton(uiContainer, "Unlock all", unlockAllGameThemes);
		for (const theme of game.ui.allSchemes) {
			if (!game.ui.defaultSchemes.includes(theme)) {
				addExternCheckbox(
					uiContainer,
					`theme_${theme}`,
					theme.slice(0, 1).toUpperCase() + theme.slice(1),
					(toggle) => {
						if (toggle.checked) {
							unlockGameTheme(theme);
						}
						else {
							lockGameTheme(theme);
						}
					},
					game.unlockedSchemes.includes.bind(game.unlockedSchemes, theme)
				);
			}
		}
		addButton(uiContainer, "Lock all", lockAllGameThemes);
		addHeading(uiContainer, "UI options");
		addCheckbox(uiContainer, "$SCRIPT_OPTS.warnOnLeave", "Warn before leaving the page");
		addCheckbox(
			uiContainer,
			"$SCRIPT_OPTS.widenUI",
			"Make the game use more horizontal space (particularly useful for Grassy theme)",
			adjustColumns
		);
		addCheckbox(
			uiContainer,
			"$SCRIPT_OPTS.dialogRight",
			"Move AK dialogs to the right of the window to improve playability",
			realignSciptDialogs
		);
		addCheckbox(
			uiContainer,
			"$SCRIPT_OPTS.forceShadow",
			"Enable a light shadow on AK dialogs",
			reapplyShadows
		);
		addCheckbox(
			uiContainer,
			"$SCRIPT_OPTS.forceShadowGlobal",
			"Enable a light shadow on ALL dialogs (overrides the above option!)",
			reapplyShadows
		);
		addOptionMenu(
			uiContainer,
			"$SCRIPT_OPTS.timeDisplay",
			"Format time displays as",
			[
				[ "default", "standard" ],
				[ "short", "short" ],
				[ "seconds", "seconds" ],
			],
			"",
			changeTimeFormat
		);
		updateOptionsUI();
	}
	// Completely rebuilds the entire autocrafting settings pane (XXX - bad)
	function rebuildOptionsPaneCrafting() {
		const uiContainer = prepareContainer("akSettingsCraft");
		addHeading(uiContainer, "Crafting");
		addCheckbox(uiContainer, "$SCRIPT_OPTS.autoCraft", "Craft materials when storage is near limit");
		addOptionMenu(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.craftLimit",
			"Craft when storage is",
			percentages,
			"full"
		);
		addOptionMenu(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.secondaryCraftLimit",
			"Keep secondary crafting outputs at least",
			percentages,
			"the amount of the inputs"
		);
		addAutocraftConfigLine(uiContainer, "catnip", "wood");
		addAutocraftConfigLine(uiContainer, "wood", "beam", true);
		addAutocraftConfigLine(uiContainer, "minerals", "slab", true);
		addAutocraftConfigLine(uiContainer, "iron", "plate", true);
		addAutocraftConfigLine(uiContainer, "iron and coal", "steel");
		addAutocraftConfigLine(uiContainer, "slabs and steel", "concrete", false);
		addAutocraftConfigLine(uiContainer, "steel", "gear", true);
		addAutocraftConfigLine(uiContainer, "steel and titanium", "alloy");
		addAutocraftConfigLine(uiContainer, "alloy and unobtainium", "eludium");
		addAutocraftConfigLine(uiContainer, "beams", "scaffold", true);
		addAutocraftConfigLine(uiContainer, "scaffolds, plates, and starcharts", "ship", true);
		addAutocraftConfigLine(uiContainer, "ships, alloy, and blueprints", "tanker", true);
		addAutocraftConfigLine(uiContainer, "oil", "kerosene");
		addAutocraftConfigLine(uiContainer, "uranium", "thorium");
		addAutocraftConfigLine(uiContainer, "slabs, beams, and plates", "megalith", true);
		addAutocraftConfigLine(uiContainer, "time crystals and relics", "bloodstone", true);
		addHeading(uiContainer, "Lunar Outposts");
		addCheckbox(
			uiContainer,
			"$SCRIPT_OPTS.lunarOutpostOptions.automate",
			"Automatically manage Lunar Outposts according to power and uranium supply"
		);
		addCheckbox(
			uiContainer,
			"$SCRIPT_OPTS.lunarOutpostOptions.useMinimumPowerProd",
			"Calculate power according to winter (lowest solar output)"
		);
		addOptionMenu(
			uiContainer,
			"$SCRIPT_OPTS.lunarOutpostOptions.activationLimit",
			"Activate outposts when uranium storage above",
			percentages,
			"full"
		);
		addOptionMenu(
			uiContainer,
			"$SCRIPT_OPTS.lunarOutpostOptions.reservedUranium",
			"Stop all outposts when uranium below",
			finePercentages,
			"storage capacity"
		);
		addButton(
			uiContainer,
			"Recalculate",
			() => {
				$SCRIPT_OPTS.lunarOutpostOptions.active = false;
			},
			"Recheck input storage and shut off outposts if under the threshold. You probably won't ever need this."
		);
		addHeading(uiContainer, "Fur product crafting");
		addOptionMenu(
			uiContainer,
			"$SCRIPT_OPTS.furOptions.parchmentMode",
			"Auto-craft parchment",
			[
				[
					"never", 0,
				],
				[
					"all, before hunting", 1,
				],
				[
					"on full culture storage", 2,
				],
				[
					"both", 3,
				],
			],
			"",
			changeFurCrafts
		);
		addIndent(uiContainer);
		addInputField(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.parchmentAmount",
			"When storage full, craft",
			"parchment at a time"
		);
		addIndent(uiContainer);
		addInputField(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.parchmentInterval",
			"Only craft parchment on full storage every",
			"game tick(s)"
		);
		addOptionMenu(
			uiContainer,
			"$SCRIPT_OPTS.furOptions.manuscriptMode",
			"Auto-craft manuscripts",
			[
				[
					"never", 0,
				],
				[
					"all, before hunting", 1,
				],
				[
					"on full culture storage", 2,
				],
				[
					"both", 3,
				],
			],
			"",
			changeFurCrafts
		);
		addIndent(uiContainer);
		addInputField(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.manuscriptAmount",
			"When storage full, craft",
			"manuscript(s) at a time"
		);
		addIndent(uiContainer);
		addInputField(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.manuscriptInterval",
			"Only craft manuscripts on full storage every",
			"game tick(s)"
		);
		addOptionMenu(
			uiContainer,
			"$SCRIPT_OPTS.furOptions.compendiumMode",
			"Auto-craft compendiums",
			[
				[
					"never", 0,
				],
				[
					"all, before hunting", 1,
				],
				[
					"on full science storage", 2,
				],
				[
					"both", 3,
				],
			],
			"",
			changeFurCrafts
		);
		addIndent(uiContainer);
		addInputField(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.compendiumAmount",
			"When storage full, craft",
			"compendium(s) at a time"
		);
		addIndent(uiContainer);
		addInputField(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.compendiumInterval",
			"Only craft compendiums on full storage every",
			"game tick(s)"
		);
		addOptionMenu(
			uiContainer,
			"$SCRIPT_OPTS.furOptions.blueprintMode",
			"Auto-craft blueprints",
			[
				[
					"never", 0,
				],
				[
					"all, before hunting", 1,
				],
				[
					"on full science storage", 2,
				],
				[
					"both", 3,
				],
			],
			"",
			changeFurCrafts
		);
		addIndent(uiContainer);
		addInputField(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.blueprintAmount",
			"When storage full, craft",
			"blueprints(s) at a time"
		);
		addIndent(uiContainer);
		addInputField(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.blueprintInterval",
			"Only craft blueprints on full storage every",
			"game tick(s)"
		);
		addCheckbox(
			uiContainer,
			"$SCRIPT_OPTS.craftOptions.blueprintPriority",
			"When crafting both from full storage, check blueprints before compendiums"
		);
		updateOptionsUI();
	}
	// Over three hundred lines of UI assembly, but at least it only runs once.
	// / XXX - I don't care if it only runs once, the UI code is still shit and needs to be overhauled.
	function buildUI() {
		const tableContainer = $('<div id="timerTableContainer"></div>');
		tableContainer.html('<table id="timerTable" style="width: 100%; table-layout: fixed;"></table>');
		$("body").append(tableContainer);
		adjustColumns();
		adjustTimerBar();
		reapplyShadows();
		realignSciptDialogs();
		const akDialogClasses = "dialog help autokittens-dialog";
		const switchToDialog = (which, pre) => {
			$(scriptDialogClass).hide();
			if (typeof pre == "function") {
				pre();
			}
			which.show();
		};
		const switcher = (...pass) => switchToDialog.bind(null, ...pass);
		const makeContainer = (id) => prepareContainer(
			$(
				`<div class="${akDialogClasses}" id="akSettings${id.replace(/^[a-z]/u, (c) => c.toUpperCase())}"></div>`
			).hide()
		);
		const masterSettingsContainer = makeContainer("master");
		const prayerSettingsContainer = makeContainer("prayer");
		const tradeSettingsContainer = makeContainer("trade");
		const craftSettingsContainer = makeContainer("craft");
		const huntSettingsContainer = makeContainer("hunt");
		const uiSettingsContainer = makeContainer("ui");
		const miscSettingsContainer = makeContainer("misc");
		// The master panel, from here you have override toggles and the other panels
		addButton(masterSettingsContainer, "Prayer Settings", switcher(prayerSettingsContainer))
			.addClass("autokittens-dispatch-button");
		addButton(masterSettingsContainer, "Trading Settings", switcher(tradeSettingsContainer))
			.addClass("autokittens-dispatch-button");
		addButton(masterSettingsContainer, "Crafting Settings", switcher(craftSettingsContainer, rebuildOptionsPaneCrafting))
			.addClass("autokittens-dispatch-button");
		addButton(masterSettingsContainer, "Hunting Settings", switcher(huntSettingsContainer))
			.addClass("autokittens-dispatch-button");
		addButton(masterSettingsContainer, "UI Settings", switcher(uiSettingsContainer, rebuildOptionsPaneGeneralUI))
			.addClass("autokittens-dispatch-button");
		addButton(masterSettingsContainer, "Miscellaneous Settings", switcher(miscSettingsContainer))
			.addClass("autokittens-dispatch-button");
		addButton(masterSettingsContainer, "$UPDATE_CHECK_LABEL", checkUpdate)
			.addClass("autokittens-dispatch-button")
			.attr("id", "autokittens-checkupdate");
		addButton(
			masterSettingsContainer,
			"Reset options",
			() => {
				$SCRIPT_OPTS = defaultOptions;
				saveAutoOptions();
				updateOptionsUI();
			},
			"DANGER! This CANNOT be undone!"
		)
			.addClass("autokittens-dispatch-button")
			.attr("id", "autokittens-reset-options");
		// Prayer settings
		addHeading(prayerSettingsContainer, "Prayer");
		addCheckbox(prayerSettingsContainer, "$SCRIPT_OPTS.autoPray", "Praise the sun when faith is near limit");
		addIndent(prayerSettingsContainer);
		addOptionMenu(
			prayerSettingsContainer,
			"$SCRIPT_OPTS.prayLimit",
			"Pray when faith is",
			finePercentages,
			"full"
		);
		addIndent(prayerSettingsContainer);
		addCheckbox(
			prayerSettingsContainer,
			"$SCRIPT_OPTS.autoResetFaith",
			"Perform an apocrypha reset just before praising the sun"
		);
		// Trading settings
		addHeading(tradeSettingsContainer, "Trading");
		const races = [
			[
				"No one", "",
			],
		];
		game.diplomacy.races.forEach((r) => {
			races.push([
				r.title || r.name, r.name,
			]);
		});
		addCheckbox(tradeSettingsContainer, "$SCRIPT_OPTS.autoTrade", "Trade when gold is near limit");
		addIndent(tradeSettingsContainer);
		addOptionMenu(
			tradeSettingsContainer,
			"$SCRIPT_OPTS.tradeOptions.tradeLimit",
			"Trade when gold is",
			percentages,
			"full"
		);
		addOptionMenu(
			tradeSettingsContainer,
			"$SCRIPT_OPTS.tradeOptions.tradePartner",
			"Trade with",
			races,
			"by default"
		);
		addCheckbox(
			tradeSettingsContainer,
			"$SCRIPT_OPTS.tradeOptions.suppressTradeLog",
			"Hide log messages when auto-trading"
		);
		races[0][0] = "Default selection";
		addIndent(tradeSettingsContainer);
		addInputField(tradeSettingsContainer, "$SCRIPT_OPTS.tradeOptions.tradeCount", "Send", "caravans at a time");
		addCheckbox(tradeSettingsContainer, "$SCRIPT_OPTS.tradeOptions.tradeSpring", "Allow trading in spring");
		addIndent(tradeSettingsContainer);
		addOptionMenu(
			tradeSettingsContainer,
			"$SCRIPT_OPTS.tradeOptions.tradePartnerSpring",
			"Trade with",
			races,
			" in spring"
		);
		addCheckbox(tradeSettingsContainer, "$SCRIPT_OPTS.tradeOptions.tradeSummer", "Allow trading in summer");
		addIndent(tradeSettingsContainer);
		addOptionMenu(
			tradeSettingsContainer,
			"$SCRIPT_OPTS.tradeOptions.tradePartnerSummer",
			"Trade with",
			races,
			" in summer"
		);
		addCheckbox(tradeSettingsContainer, "$SCRIPT_OPTS.tradeOptions.tradeAutumn", "Allow trading in autumn");
		addIndent(tradeSettingsContainer);
		addOptionMenu(
			tradeSettingsContainer,
			"$SCRIPT_OPTS.tradeOptions.tradePartnerAutumn",
			"Trade with",
			races,
			" in autumn"
		);
		addCheckbox(tradeSettingsContainer, "$SCRIPT_OPTS.tradeOptions.tradeWinter", "Allow trading in winter");
		addIndent(tradeSettingsContainer);
		addOptionMenu(
			tradeSettingsContainer,
			"$SCRIPT_OPTS.tradeOptions.tradePartnerWinter",
			"Trade with",
			races,
			" in winter"
		);
		addCheckbox(
			tradeSettingsContainer,
			"$SCRIPT_OPTS.tradeOptions.playMarket",
			"Play the blackcoin market like a cheap fiddle"
		);
		addIndent(tradeSettingsContainer);
		addInputField(
			tradeSettingsContainer,
			"$SCRIPT_OPTS.tradeOptions.buyBlackcoinBelow",
			"Buy blackcoin for at most",
			"relics"
		);
		// Hunting settings
		addHeading(huntSettingsContainer, "Hunting");
		addCheckbox(huntSettingsContainer, "$SCRIPT_OPTS.autoHunt", "Hunt when catpower is near limit");
		addOptionMenu(
			huntSettingsContainer,
			"$SCRIPT_OPTS.huntOptions.huntLimit",
			"Hunt when catpower is",
			percentages,
			"full"
		);
		addCheckbox(
			huntSettingsContainer,
			"$SCRIPT_OPTS.huntOptions.suppressHuntLog",
			"Hide log messages when auto-hunting (includes hunt-triggered crafts)"
		);
		addCheckbox(
			huntSettingsContainer,
			"$SCRIPT_OPTS.huntOptions.singleHunts",
			"Limit the number of hunts sent out at once"
		);
		addIndent(huntSettingsContainer);
		addInputField(huntSettingsContainer, "$SCRIPT_OPTS.huntOptions.huntCount", "Send out", "hunts at once");
		addCheckbox(
			huntSettingsContainer,
			"$SCRIPT_OPTS.huntOptions.huntEarly",
			"Hunt as soon as the maximum number of hunts is reached (relative to the limit)"
		);
		// Miscellaneous settings
		addHeading(miscSettingsContainer, "Miscellaneous");
		addCheckbox(
			miscSettingsContainer,
			"$SCRIPT_OPTS.perfectLeadership",
			"Pretend that your leader is perfect at everything",
			"If only we could do this in the real world..."
		);
		addHeading(miscSettingsContainer, "Pollution");
		addCheckbox(miscSettingsContainer, "$SCRIPT_OPTS.disablePollution", "Actually disable pollution, for real");
		addButton(
			miscSettingsContainer,
			"Reset pollution level",
			() => {
				game.bld.cathPollution = 0;
			},
			"Remove all existing pollution WITHOUT locking it so you that you can keep generating more. For some reason."
		);
		// The rest of the settings panels are dynamic, so they have `rebuildOptionsPane<Purpose>()`
		// functions above instead of being in here
		const calcContainer = $(`<div class="${akDialogClasses}" id="kittenCalcs"></div>`).hide();
		$("#gamePageContainer").append([
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
		const optLink = $('<a id="autokittens-optlink" href="#">AK</a>')
			.on("click", switcher(masterSettingsContainer));
		const calcLink = $('<a id="autokittens-calclink" href="#">Calcs</a>')
			.attr("title", "According to my catculations...")
			.on("click", switcher(calcContainer, rebuildCalculatorUI));
		$("#devModeButton").parent()
			.prepend(optLink, " | ", calcLink, " | ");
		// Inject our stylesheet, because trying to manage inline styles with
		// this sort of logic/selection criteria is /not/ happening
		const inlineStylesheet = $('<style type="text/css"></style>');
		inlineStylesheet.text(`
		html.autokittensUpdateCheckDisabled #autokittens-checkupdate {
			color: red;
		}
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
			background-color: #000000;
			color: #ffffff;
		}
		#powerCalc_content > .calculator > table {
			table-layout: fixed;
			width: 100%;
		}
		#powerCalc_content > .calculator > table td {
			padding: 2px;
		}
		#powerCalc_content > .calculator > table tr.spacer {
			height: 10px;
		}
		#powerCalc_content > .calculator > table td:nth-child(1) {
			width: 40%;
		}
		#powerCalc_content > .calculator > table td:nth-child(2) {
			width: 25%;
		}
		#powerCalc_content > .calculator > table td:nth-child(3) {
			width: 35%;
		}
		body.scheme_minimalist > #timerTableContainer {
			background-color: #0C0D10;
			background-image: linear-gradient(
				90deg,
				#0C0D10 0%,
				#0C0D10 20%,
				#101115 35%,
				#181920 55%,
				#252732 100%
			);
		}
		body.scheme_sleek > #timerTableContainer {
			background-color: #1c1917;
		}
		body.scheme_dark > #timerTableContainer {
			background-color: #201f1d;
		}
		body.scheme_grassy > #timerTableContainer {
			background-color: #c6eba1;
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
		$("head").append(inlineStylesheet);
		// #ifdef NO_UPDATE_CHECK
		$("html").addClass("autokittensUpdateCheckDisabled");
	// #endif
	}

	// This is used by the "warn before leaving" setting
	function unloadGuard(evt) { // eslint-disable-line consistent-return
		if ($SCRIPT_OPTS.warnOnLeave) {
			const warning = "Are you sure you want to leave?";
			evt.preventDefault();
			evt.returnValue = warning;
			return warning;
		}
	}

	// Click on astronomical events
	function starClick() {
		if ($SCRIPT_OPTS.autoStar) {
			(document.querySelector("#observeBtn") || {
				click: NOP,
			}).click();
		}
	}
	// DEPLOY THE HUNT
	function autoHunt() {
		if (!$SCRIPT_OPTS.autoHunt) {
			return;
		}
		const msgFunc = game.msg;
		if ($SCRIPT_OPTS.huntOptions.suppressHuntLog) {
			game.msg = NOP;
		}
		const catpower = game.resPool.get("manpower");
		const leftBeforeCap = (1 - $SCRIPT_OPTS.huntOptions.huntLimit) * catpower.maxValue;
		if (
			catpower.value / catpower.maxValue >= $SCRIPT_OPTS.huntOptions.huntLimit
		|| (
			$SCRIPT_OPTS.huntOptions.huntEarly
			&& catpower.value >= catpower.maxValue - leftBeforeCap - ((catpower.maxValue - leftBeforeCap) % 100)
		)
		) {
			if ($SCRIPT_OPTS.huntOptions.craftParchment && game.workshop.getCraft("parchment").unlocked) {
				game.craftAll("parchment");
			}
			if ($SCRIPT_OPTS.huntOptions.craftManuscript && game.workshop.getCraft("manuscript").unlocked) {
				game.craftAll("manuscript");
			}
			if ($SCRIPT_OPTS.huntOptions.craftCompendium && game.workshop.getCraft("compedium").unlocked) {
				game.craftAll("compedium");
			}
			if ($SCRIPT_OPTS.huntOptions.craftBlueprint && game.workshop.getCraft("blueprint").unlocked) {
				game.craftAll("blueprint");
			}
			if ($SCRIPT_OPTS.huntOptions.singleHunts) {
				const squads = Math.floor($SCRIPT_OPTS.huntOptions.huntCount);
				if (squads >= 1) {
					const cost = squads * 100;
					if (game.resPool.get("manpower").value >= cost) {
						game.resPool.addResEvent("manpower", -cost);
						game.village.gainHuntRes(squads);
					}
				}
			}
			else {
				game.village.huntAll();
			}
		}
		if ($SCRIPT_OPTS.huntOptions.suppressHuntLog) {
			game.msg = msgFunc;
		}
	}
	// Craft things
	function autoCraft() {
		if (!$SCRIPT_OPTS.autoCraft) {
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
				game.science.get("construction").researched,
			],
			[
				"tanker",
				"craftTanker",
				"tankerAmount",
				"tankerInterval",
				game.science.get("construction").researched,
			],
			[
				"ship",
				"craftShip",
				"shipAmount",
				"shipInterval",
				game.science.get("construction").researched,
			],
			[
				"concrate",
				"craftConcrete",
				"concreteAmount",
				"concreteInterval",
				game.science.get("construction").researched,
			],
			[
				"megalith",
				"craftMegalith",
				"megalithAmount",
				"megalithInterval",
				game.science.get("construction").researched,
			],
			[
				"slab",
				"craftSlab",
				"slabAmount",
				"slabInterval",
				game.science.get("construction").researched,
			],
			[
				"gear",
				"craftGear",
				"gearAmount",
				"gearInterval",
				game.science.get("construction").researched,
			],
			[
				"alloy",
				"craftAlloy",
				"alloyAmount",
				"alloyInterval",
				game.science.get("construction").researched,
			],
			[
				"steel",
				"craftSteel",
				"steelAmount",
				"steelInterval",
				game.science.get("construction").researched,
			],
			[
				"plate",
				"craftPlate",
				"plateAmount",
				"plateInterval",
				game.science.get("construction").researched,
			],
			[
				"eludium",
				"craftEludium",
				"eludiumAmount",
				"eludiumInterval",
				game.science.get("construction").researched,
			],
			[
				"kerosene",
				"craftKerosene",
				"keroseneAmount",
				"keroseneInterval",
				game.science.get("construction").researched,
			],
			[
				"thorium",
				"craftThorium",
				"thoriumAmount",
				"thoriumInterval",
				game.science.get("construction").researched,
			],
			[
				"scaffold",
				"craftScaffold",
				"scaffoldAmount",
				"scaffoldInterval",
				game.science.get("construction").researched,
			],
			[
				"beam",
				"craftBeam",
				"beamAmount",
				"beamInterval",
				game.science.get("construction").researched,
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
				game.science.get("construction").researched,
			],
			[
				"manuscript",
				"craftManuscript",
				"manuscriptAmount",
				"manuscriptInterval",
				game.science.get("construction").researched,
			],
			[
				"blueprint",
				"craftBlueprint",
				"blueprintAmount",
				"blueprintInterval",
				game.science.get("construction").researched && $SCRIPT_OPTS.craftOptions.blueprintPriority,
			],
			[
				"compedium",
				"craftCompendium",
				"compendiumAmount",
				"compendiumInterval",
				game.science.get("construction").researched,
			],
			[
				"blueprint",
				"craftBlueprint",
				"blueprintAmount",
				"blueprintInterval",
				game.science.get("construction").researched && !$SCRIPT_OPTS.craftOptions.blueprintPriority,
			],
		];
		AUTOCRAFT: for (const craftData of resources) {
			const [
				product,
				toggleSetting,
				amountSetting,
				intervalSetting,
				consider,
			] = craftData;
			const costs = $SCRIPT_CACHE.craftingInputs[product];
			if (
				consider
				&& $SCRIPT_OPTS.craftOptions[toggleSetting]
				&& game.ticks % $SCRIPT_OPTS.craftOptions[intervalSetting] == 0
				&& game.workshop.getCraft(product).unlocked
			) {
				if (window.$NOISY_DEBUG_TOGGLE) {
					console.log(`Attempting to craft ${product}`);
				}
				const output = game.resPool.get(product);
				for (const resource in costs) {
					if (ownProp(costs, resource)) {
						if (product == "steel" && resource == "iron") {
						// It's a monkey patch, I know - I'm working on a proper fix
						// update 2022-08-31: how long has it even been?
							continue;
						}
						const input = game.resPool.get(resource);
						if (input.value < costs[resource]) {
							continue AUTOCRAFT;
						}
						if (input.maxValue > 0) {
						// Check by percentage of max value - the original method
							const percentage = input.value / input.maxValue;
							if (percentage < $SCRIPT_OPTS.craftOptions.craftLimit) {
								continue AUTOCRAFT;
							}
							continue;
						}
						if (input.value > 0) {
						// Check by percentage of the PRODUCT'S CURRENT VALUE - uncapped stuff
							const percentage = output.value / input.value;
							// If we have MORE of the OUTPUT than the threshold, skip this entirely
							if (percentage > $SCRIPT_OPTS.craftOptions.secondaryCraftLimit) {
								continue AUTOCRAFT;
							}
							continue;
						}
						// Input is uncapped, input <= output, output <= 0, (transitively) input <= 0
						continue AUTOCRAFT;
					}
				}
				tryCraft(product, $SCRIPT_OPTS.craftOptions[amountSetting]);
			}
		}
	}
	// Pray to ceiling cat (who is watching you)
	function autoPray() {
		if (!$SCRIPT_OPTS.autoPray) {
			return;
		}
		const faith = game.resPool.get("faith");
		if (faith.value / faith.maxValue >= $SCRIPT_OPTS.prayLimit && faith.value > 0.01) {
			if ($SCRIPT_OPTS.autoResetFaith) {
				game.religion._resetFaithInternal(1.01); // dunno why the source uses 1.01, but it does
			}
			game.religion.praise();
		}
	}
	// Trade with other civilisations
	function autoTrade() {
		if (!$SCRIPT_OPTS.autoTrade || $SCRIPT_OPTS.tradeOptions.tradePartner === "") {
			return;
		}
		let race;
		const season = [
			"Spring",
			"Summer",
			"Autumn",
			"Winter",
		][game.calendar.season];
		if ($SCRIPT_OPTS.tradeOptions[`tradePartner${season}`]) {
			race = game.diplomacy.get($SCRIPT_OPTS.tradeOptions[`tradePartner${season}`]);
		}
		else {
			race = game.diplomacy.get($SCRIPT_OPTS.tradeOptions.tradePartner);
		}
		if (!race.unlocked) {
			return;
		}
		const gold = game.resPool.get("gold");
		if (
			game.resPool.get(race.buys[0].name).value < race.buys[0].val
		|| game.resPool.get("manpower").value < 50
			|| gold.value / gold.maxValue < $SCRIPT_OPTS.tradeOptions.tradeLimit
		) {
			return;
		}
		const msgFunc = game.msg;
		if ($SCRIPT_OPTS.tradeOptions.suppressTradeLog) {
			game.msg = NOP;
		}
		if ($SCRIPT_OPTS.tradeOptions[`trade${season}`]) {
			game.diplomacy.tradeMultiple(race, Math.max($SCRIPT_OPTS.tradeOptions.tradeCount, 1));
		}
		if ($SCRIPT_OPTS.tradeOptions.suppressTradeLog) {
			game.msg = msgFunc;
		}
	}
	// Play the crypto market as if it actually works (which, tbf, it does in the game)
	function autoBlackcoin() {
		if (!$SCRIPT_OPTS.tradeOptions.playMarket) {
			return;
		}
		// From the wiki:
		// > After researching Antimatter the leviathan info box will list a thing called Blackcoin
		// > Once you've researched Blackchain (or if you already have blackcoins),
		// > blackcoins can be bought with relics.
		if (
			!game.science.get("antimatter").researched
		|| !(game.resPool.resourceMap.blackcoin.unlocked || game.science.get("blackchain").researched)
		) {
			return;
		}
		if (!game.diplomacy.get("leviathans").unlocked) {
			return;
		}
		const curPrice = game.calendar.cryptoPrice;
		const maxPrice = game.calendar.cryptoPriceMax;
		const relics = game.resPool.get("relic");
		const coins = game.resPool.get("blackcoin");
		if (relics.value > 0 && curPrice <= $SCRIPT_OPTS.tradeOptions.buyBlackcoinBelow) {
			const amt = relics.value / curPrice;
			coins.value += amt;
			relics.value = 0;
		}
		else if (coins.value > 0 && maxPrice - curPrice <= 1) {
			const amt = coins.value * curPrice;
			relics.value += amt;
			coins.value = 0;
		}
	}
	// Manage your lunar outposts (TODO - the whole algorithm could probably be improved)
	function manageOutposts() {
		if (!$SCRIPT_OPTS.lunarOutpostOptions.automate) {
			return;
		}

		// bad hack to handle a caching bug
		// game.resPool.energyCons is updated every tick, in the original game tick function
		// the replacement tick function we inject calls the original before AK's own functions run, including this one
		// however, sometimes the energy consumption effects that are used in that calculation are out of date
		// it's only by a tick or two, but it's still enough to introduce problems
		// if it stabilised and we had just a tick or two of running an extra outpost, it wouldn't matter
		// unfortunately, something in the timing causes it to flip back and forth indefinitely
		// sadly, there's no discernible reason for that occasional timing glitch, so I can't fix it
		// instead, here's a workaround: only update every five ticks
		if (game.ticks % 5) {
			return;
		}

		const consumed = 0.35;
		const produced = 0.007;

		const bld = game.space.getBuilding("moonOutpost");
		const input = game.resPool.get("uranium");
		const output = game.resPool.get("unobtainium");

		if (input.maxValue <= 0) {
			bld.on = 0;
			return;
		}

		const count = bld.val;
		const active = bld.on;

		const threshold = $SCRIPT_OPTS.lunarOutpostOptions.activationLimit;
		const reserved = $SCRIPT_OPTS.lunarOutpostOptions.reservedUranium * input.maxValue;

		const maxPower = $SCRIPT_OPTS.lunarOutpostOptions.useMinimumPowerProd
			? game.resPool.energyWinterProd
			: game.resPool.energyProd;
		const usage = bld.effects.energyConsumption;
		const basePowerDraw = game.resPool.energyCons - usage * active;
		const leftover = maxPower - basePowerDraw;

		const available = Math.max(input.value - reserved, 0);
		const fullness = available / input.maxValue;

		// this is the most that can be run according to power limitations, and will probably be the limiting factor
		const supportedByPower = Math.floor(leftover / usage);
		// this many outposts can be active for one tick - it's probably vastly higher than we need in MOST cases
		const supportedByInput = Math.floor(available / consumed);
		// ceil because we can overflow by less than one outpost's full output in order to cap
		const supportedByOutput = Math.ceil((output.maxValue - output.value) / produced);
		// this is the most that can be turned on without SOMETHING being overdrawn (including the number available)
		const supported = Math.max(Math.min(supportedByPower, supportedByInput, supportedByOutput, count), 0);

		// if we've passed the UPPER limit, enable outpost activation
		if (fullness >= threshold) {
			$SCRIPT_OPTS.lunarOutpostOptions.active = true;
		}
		// if we've passed the LOWER limit, disable outposts
		else if (!supportedByInput) {
			$SCRIPT_OPTS.lunarOutpostOptions.active = false;
		}

		// if outposts are enabled, set the active number
		if ($SCRIPT_OPTS.lunarOutpostOptions.active) {
			bld.on = supported;
		}
		// otherwise, turn them all off
		else {
			bld.on = 0;
		}
	}
	// Just dispatch all of the different things we do each tick
	function processAutoKittens() {
		starClick();
		autoHunt();
		autoCraft();
		autoTrade();
		autoPray();
		autoBlackcoin();
		manageOutposts();
		fillTable();
		updateCalculators();
	}

	// Rebuild the data cache, which is used in autocrafting (and accessible by other scripts)
	function rebuildAutoKittensCache() {
		const temporaryCache = {
			unicornUpgrades: [],
			craftingInputs: {},
		};
		for (let i = 0; i < game.workshop.upgrades.length; i++) {
			if ("unicornsGlobalRatio" in (game.workshop.upgrades[i].effects || {})) {
				temporaryCache.unicornUpgrades.push(game.workshop.upgrades[i]);
			}
		}
		Object.freeze(temporaryCache.unicornUpgrades);
		for (let i = 0; i < game.workshop.crafts.length; i++) {
			const product = game.workshop.crafts[i].name;
			const costs = {};
			game.workshop.crafts[i].prices.forEach((price) => {
				costs[price.name] = price.val;
			});
			temporaryCache.craftingInputs[product] = Object.freeze(costs);
		}
		Object.freeze(temporaryCache.craftingInputs);
		internalCache = Object.freeze(temporaryCache);
	}

	// Put the resource map together to allow easy reference to all sorts of things
	function constructMagicResourceCache() {
		// These names are used directly
		[
			"catnip",
			"wood",
			"minerals",
			"coal",
			"iron",
			"titanium",
			"gold",
			"oil",
			"uranium",
			"unobtainium",
			"antimatter",
			"science",
			"culture",
			"faith",
			"kittens",
			"zebras",
			"temporalFlux",
			"gflops",
			"hashrates",
			"furs",
			"ivory",
			"spice",
			"unicorns",
			"tears",
			"karma",
			"paragon",
			"burnedParagon",
			"sorrow",
			"void",
			"elderBox",
			"wrappingPaper",
			"blackcoin",
			"steel",
			"alloy",
			"eludium",
			"kerosene",
			"parchment",
			"thorium",
		].forEach((id) => {
			Object.defineProperty(gameDataMap, id, {
				enumerable: true,
				get: () => game.resPool.get(id),
			});
		});
		// These names are all pluralised
		[
			"starchart",
			"alicorn",
			"necrocorn",
			"timeCrystal",
			"relic",
			"bloodstone",
			"beam",
			"slab",
			"plate",
			"gear",
			"scaffold",
			"ship",
			"tanker",
			"manuscript",
			"blueprint",
			"megalith",
		].forEach((id) => {
			Object.defineProperty(gameDataMap, `${id}s`, {
				enumerable: true,
				get: () => game.resPool.get(id),
			});
		});
		// These are all custom aliases
		Object.defineProperties(
			gameDataMap,
			iterateObject(
				{
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
						get: () => game.resPool.get("concrate"),
					},
					compendiums: {
						get: () => game.resPool.get("compedium"),
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
					pollution: {
						get: () => game.bld.cathPollution,
						set: (value) => {
							game.bld.cathPollution = value;
						},
					},
				},
				(descrip) => {
					descrip.enumerable = true;
				}
			)
		);
	}

	// Inject things into the global namespace as read-only values
	function injectGlobalReadOnlyValues() {
		Object.defineProperties(
			window,
			iterateObject(
				{
					$SCRIPT_RESMAP: {
						value: Object.freeze(gameDataMap),
					},
					$SCRIPT_CACHE: {
						get: () => internalCache,
					},
					rebuildAutoKittensCache: {
						value: rebuildAutoKittensCache,
					},
				},
				(descrip) => {
					descrip.enumerable = true;
				}
			)
		);
	}

	function installUnloadGuard() {
		window.addEventListener("beforeunload", unloadGuard, {
			capture: true,
			once: false,
		});
	}

	// Cheese the leader's effect checks (when `perfectLeadership` is enabled)
	// Credit to patsy#5684/160499684744364032 on the discord for the initial code
	// Practical differences: doesn't care if you even HAVE a leader, doesn't care about the current leader's trait
	// Internal differences: uses Reflect.apply instead of relying on Function.prototype.apply
	function hijackLeaderEffectChecks() {
		const realGetEffectLeader = game.village.getEffectLeader;
		game.village.getEffectLeader = function cheesyGetEffectLeader(trait, ...rest) {
			const realLeader = this.leader;
			if (
				$SCRIPT_OPTS.perfectLeadership
				&& game.challenges.currentChallenge != "anarchy"
				&& game.science.get("civil").researched
				&& this.traits
				&& this.traits.some((t) => t.name == trait)
			) {
				this.leader = {
					trait: {
						name: trait,
					},
				};
			}
			const value = Reflect.apply(realGetEffectLeader, this, [
				trait, ...rest,
			]);
			this.leader = realLeader;
			return value;
		};
	}

	// Hijack the pollution level
	function hijackPollutionLevel() {
		let pollution = game.bld.cathPollution;
		Object.defineProperty(game.bld, "cathPollution", {
			enumerable: true,
			get: () => ($SCRIPT_OPTS.disablePollution ? 0 : pollution),
			set: (value) => {
				pollution = $SCRIPT_OPTS.disablePollution ? 0 : value;
			},
		});
	}

	// Inject the script's core function
	function injectScriptCore() {
		if (game.worker) {
			const runOriginalGameTick = gameTickFunc.bind(game);
			game.tick = function runAutoKittensHijackedGameTick() {
				runOriginalGameTick();
				processAutoKittens();
			};
		}
		else {
			window.autoKittensTimer = setInterval(processAutoKittens, checkInterval);
		}
	}

	// Make the UI changes
	function initialiseScriptUI() {
		if (!document.querySelector("#timerTable")) {
			buildUI();
			$(scriptDialogClass).hide();
			rebuildOptionsPaneGeneralUI();
			rebuildOptionsPaneCrafting();
		}
	}

	(function performFinalInitialisation() {
		// Load any saved settings
		loadAutoOptions();
		// Apply the unload guard
		installUnloadGuard();
		// Assemble the magic resource "cache"
		constructMagicResourceCache();
		// Inject our global readonly values into the window
		injectGlobalReadOnlyValues();
		// Intercept leader effect checks
		hijackLeaderEffectChecks();
		// Override pollution
		hijackPollutionLevel();
		// Build the cache on load
		rebuildAutoKittensCache();
		// Prepare the script's UI
		initialiseScriptUI();

		// Start the core script
		injectScriptCore();

		// And keep the cache (semi-)regularly updated, every ten minutes
		setInterval(rebuildAutoKittensCache, 1000 * 60 * 10);
	})();
})();

/* $CONCAT(eslint, -enable) max-len */
