#!/usr/bin/env node

const {
	spawnSync,
} = require('child_process');

const config = {
	root: true,
	env: {
		es2017: true,
		node: true,
	},
	parserOptions: {
		ecmaVersion: 9,
	},
	rules: {
		"accessor-pairs": "error",
		"array-bracket-newline": [
			"error", "consistent",
		],
		"array-bracket-spacing": [
			"error", "always",
		],
		"array-callback-return": "error",
		"array-element-newline": [
			"error", "consistent",
		],
		"arrow-body-style": [
			"error", "as-needed",
		],
		"arrow-parens": [
			"error", "always",
		],
		"arrow-spacing": "error",
		"block-scoped-var": "error",
		"block-spacing": "error",
		"brace-style": [
			"error", "stroustrup",
		],
		"camelcase": [
			"error",
			{
				"allow": [
					"^INTERNAL_",
					"^[gs]et__",
				],
			},
		],
		"class-methods-use-this": "warn",
		"comma-dangle": [
			"error",
			{
				"arrays": "always-multiline",
				"exports": "always-multiline",
				"functions": "never",
				"imports": "always-multiline",
				"objects": "always-multiline",
			},
		],
		"comma-spacing": "error",
		"comma-style": "error",
		"computed-property-spacing": "error",
		"consistent-return": [
			"warn",
			{
				"treatUndefinedAsUnspecified": true,
			},
		],
		"consistent-this": [
			"error",
			"that",
			"self",
			"me",
			"executionContext",
		],
		"constructor-super": "error",
		"curly": "error",
		"default-case": "error",
		"dot-location": [
			"error", "property",
		],
		"dot-notation": [
			"error",
			{
				"allowPattern": "^_*[a-zA-Z]+(_[A-Za-z]*)*$",
			},
		],
		"eol-last": "error",
		"for-direction": "error",
		"func-call-spacing": "error",
		"func-names": [
			"error", "as-needed",
		],
		"function-paren-newline": [
			"error", "multiline-arguments",
		],
		"generator-star-spacing": [
			"error", "after",
		],
		"getter-return": "error",
		"guard-for-in": "error",
		"implicit-arrow-linebreak": "error",
		"indent": [
			"error",
			"tab",
			{
				"SwitchCase": 1,
			},
		],
		"key-spacing": "error",
		"keyword-spacing": "error",
		"linebreak-style": "error",
		"lines-between-class-members": [
			"error", "never",
		],
		"max-len": [
			"warn",
			{
				"code": 140,
				"comments": 140,
				"ignoreComments": false,
				"ignoreRegExpLiterals": false,
				"ignoreStrings": false,
				"ignoreTemplateLiterals": false,
				"ignoreUrls": false,
			},
		],
		"multiline-ternary": [
			"error", "always-multiline",
		],
		"new-parens": "error",
		"newline-per-chained-call": "error",
		"no-alert": "warn",
		"no-array-constructor": "error",
		"no-caller": "error",
		"no-case-declarations": "error",
		"no-class-assign": "error",
		"no-compare-neg-zero": "error",
		"no-cond-assign": [
			"error", "except-parens",
		],
		"no-const-assign": "error",
		"no-constant-condition": [
			"error",
			{
				"checkLoops": false,
			},
		],
		"no-debugger": "error",
		"no-delete-var": "error",
		"no-dupe-args": "error",
		"no-dupe-class-members": "error",
		"no-dupe-keys": "error",
		"no-duplicate-case": "error",
		"no-else-return": "warn",
		"no-empty": "error",
		"no-empty-character-class": "error",
		"no-empty-function": "warn",
		"no-eq-null": "error",
		"no-eval": "error",
		"no-ex-assign": "error",
		"no-extend-native": [
			"error",
			{
				"exceptions": [
					"Array",
					"String",
				],
			},
		],
		"no-extra-bind": "warn",
		"no-extra-boolean-cast": "warn",
		"no-extra-label": "warn",
		"no-extra-parens": [
			"error",
			"all",
			{
				"conditionalAssign": false,
				"enforceForArrowConditionals": false,
				"nestedBinaryExpressions": false,
			},
		],
		"no-extra-semi": "warn",
		"no-fallthrough": "error",
		"no-floating-decimal": "error",
		"no-func-assign": "error",
		"no-global-assign": "error",
		"no-implicit-coercion": [
			"error",
			{
				"allow": [ "!!" ],
				"string": false,
			},
		],
		"no-implied-eval": "error",
		"no-inner-declarations": "error",
		"no-invalid-regexp": "error",
		"no-invalid-this": "error",
		"no-irregular-whitespace": [
			"error",
			{
				"skipComments": true,
				"skipStrings": false,
			},
		],
		"no-iterator": "error",
		"no-label-var": "error",
		"no-lone-blocks": "error",
		"no-lonely-if": "error",
		"no-loop-func": "error",
		"no-misleading-character-class": "error",
		"no-mixed-spaces-and-tabs": [
			"error", "smart-tabs",
		],
		"no-multi-assign": "error",
		"no-multi-str": "warn",
		"no-multiple-empty-lines": "error",
		"no-negated-condition": "warn",
		"no-new": "error",
		"no-new-func": "error",
		"no-new-object": "error",
		"no-new-symbol": "error",
		"no-new-wrappers": "error",
		"no-obj-calls": "error",
		"no-octal": "warn",
		"no-octal-escape": "error",
		"no-proto": "error",
		"no-prototype-builtins": "warn",
		"no-redeclare": [
			"error",
			{
				"builtinGlobals": true,
			},
		],
		"no-regex-spaces": "error",
		"no-return-assign": "error",
		"no-return-await": "error",
		"no-script-url": "warn",
		"no-self-assign": "error",
		"no-self-compare": "error",
		"no-sequences": "error",
		"no-shadow": "error",
		"no-shadow-restricted-names": "error",
		"no-sparse-arrays": "error",
		"no-tabs": [
			"error",
			{
				"allowIndentationTabs": true,
			},
		],
		"no-template-curly-in-string": "error",
		"no-this-before-super": "error",
		"no-throw-literal": "warn",
		"no-trailing-spaces": "error",
		"no-undef": [
			"error",
			{
				"typeof": true,
			},
		],
		"no-undefined": "warn",
		"no-unexpected-multiline": "error",
		"no-unmodified-loop-condition": "error",
		"no-unneeded-ternary": "error",
		"no-unreachable": "error",
		"no-unsafe-finally": "error",
		"no-unsafe-negation": "error",
		"no-unused-expressions": [
			"error",
			{
				"allowTaggedTemplates": true,
			},
		],
		"no-unused-labels": "error",
		"no-unused-vars": [
			"warn",
			{
				"args": "after-used",
				"vars": "local",
			},
		],
		"no-use-before-define": "error",
		"no-useless-call": "warn",
		"no-useless-catch": "error",
		"no-useless-computed-key": "error",
		"no-useless-concat": "error",
		"no-useless-constructor": "error",
		"no-useless-escape": "warn",
		"no-useless-rename": "error",
		"no-useless-return": "error",
		"no-var": "error",
		"no-whitespace-before-property": "error",
		"no-with": "error",
		"object-curly-newline": [
			"error",
			{
				"consistent": true,
				"minProperties": 1,
				"multiline": true,
			},
		],
		"object-curly-spacing": [
			"error", "always",
		],
		"object-property-newline": [
			"error",
			{
				"allowAllPropertiesOnSameLine": false,
			},
		],
		"object-shorthand": "error",
		"one-var": [
			"error", "never",
		],
		"operator-assignment": "error",
		"operator-linebreak": [
			"error", "before",
		],
		"padded-blocks": [
			"error", "never",
		],
		"prefer-arrow-callback": "error",
		"prefer-const": "error",
		"prefer-numeric-literals": "warn",
		"prefer-promise-reject-errors": [
			"warn",
			{
				"allowEmptyReject": true,
			},
		],
		"prefer-rest-params": "error",
		"prefer-spread": "error",
		"prefer-template": "error",
		"quote-props": [
			"error", "consistent",
		],
		"radix": "error",
		"require-unicode-regexp": "warn",
		"require-yield": "error",
		"rest-spread-spacing": "error",
		"semi": "error",
		"semi-spacing": [
			"error",
			{
				"after": true,
				"before": false,
			},
		],
		"semi-style": "error",
		"space-before-blocks": "error",
		"space-before-function-paren": [
			"error",
			{
				"anonymous": "never",
				"asyncArrow": "always",
				"named": "never",
			},
		],
		"space-in-parens": "error",
		"space-infix-ops": [
			"error",
			{
				"int32Hint": true,
			},
		],
		"space-unary-ops": "error",
		"spaced-comment": "error",
		"switch-colon-spacing": "error",
		"symbol-description": "error",
		"template-curly-spacing": "error",
		"template-tag-spacing": "error",
		"use-isnan": "error",
		"valid-typeof": "error",
		"wrap-iife": [
			"error",
			"any",
			{
				"functionPrototypeMethods": true,
			},
		],
		"wrap-regex": "error",
		"yield-star-spacing": "error",
		"yoda": "error",
		"unicorn/catch-error-name": [
			"error",
			{
				name: "err",
			},
		],
		"unicorn/custom-error-definition": "error",
		"unicorn/error-message": "error",
		"unicorn/escape-case": "warn",
		"unicorn/new-for-builtins": "warn",
		"unicorn/no-array-instanceof": "error",
		"unicorn/no-console-spaces": "warn",
		"unicorn/no-fn-reference-in-iterator": "warn",
		"unicorn/no-for-loop": "warn",
		"unicorn/no-hex-escape": "warn",
		"unicorn/no-keyword-prefix": "error",
		"unicorn/no-new-buffer": "error",
		"unicorn/no-process-exit": "warn",
		"unicorn/no-zero-fractions": "warn",
		"unicorn/number-literal-case": "warn",
		"unicorn/prefer-add-event-listener": "error",
		"unicorn/prefer-dataset": "warn",
		"unicorn/prefer-event-key": "warn",
		"unicorn/prefer-exponentiation-operator": "warn",
		"unicorn/prefer-flat-map": "error",
		"unicorn/prefer-includes": "error",
		"unicorn/prefer-node-append": "error",
		"unicorn/prefer-node-remove": "error",
		"unicorn/prefer-starts-ends-with": "error",
		"unicorn/prefer-string-slice": "error",
		"unicorn/prefer-type-error": "error",
		"unicorn/regex-shorthand": "error",
		"unicorn/throw-new-error": "warn",
		"unicorn/prefer-text-content": "error",
		"unicorn/prefer-reflect-apply": "error",
		"unicorn/prefer-query-selector": "error",
		"unicorn/no-abusive-eslint-disable": "error",
		"import/no-unresolved": "error",
		"import/no-absolute-path": "error",
		"import/no-dynamic-require": "warn",
		"import/no-internal-modules": "warn",
		"import/no-webpack-loader-syntax": "error",
		"import/no-self-import": "error",
		"import/no-useless-path-segments": "warn",
		"import/export": "error",
		"import/no-named-as-default": "warn",
		"import/no-named-as-default-member": "warn",
		"import/no-deprecated": "warn",
		"import/no-extraneous-dependencies": "error",
		"import/no-mutable-exports": "warn",
		"import/exports-last": "error",
		"import/newline-after-import": "warn",
		"import/no-unassigned-import": "error",
		"import/no-anonymous-default-export": "warn",
		"sonarjs/no-element-overwrite": "error",
		"sonarjs/no-extra-arguments": "error",
		"sonarjs/no-identical-conditions": "error",
		"sonarjs/no-identical-expressions": "error",
		"sonarjs/no-one-iteration-loop": "error",
		"sonarjs/no-use-of-empty-return-value": "error",
		"sonarjs/no-collapsible-if": "error",
		"sonarjs/no-collection-size-mischeck": "error",
		"sonarjs/no-duplicated-branches": "error",
		"sonarjs/no-identical-functions": "error",
		"sonarjs/no-inverted-boolean-check": "error",
		"sonarjs/no-redundant-boolean": "error",
		"sonarjs/no-redundant-jump": "error",
		"sonarjs/no-same-line-conditional": "error",
		"sonarjs/no-small-switch": "warn",
		"sonarjs/no-unused-collection": "warn",
		"sonarjs/no-useless-catch": "error",
		"sonarjs/prefer-immediate-return": "error",
		"sonarjs/prefer-object-literal": "error",
		"sonarjs/prefer-single-boolean-return": "error",
		"sonarjs/prefer-while": "error",
		"eslint-comments/disable-enable-pair": "error",
		"eslint-comments/no-duplicate-disable": "error",
		"eslint-comments/no-unlimited-disable": "error",
		"eslint-comments/no-unused-enable": "error",
		"promise/catch-or-return": "warn",
		"promise/no-return-wrap": "warn",
		"promise/param-names": "warn",
		"promise/always-return": "warn",
		"promise/no-nesting": "warn",
		"promise/no-new-statics": "error",
		"promise/valid-params": "error",
	},
	settings: {
		"import/docstyle": [
			'jsdoc',
			'tomdoc',
		],
	},
};
config.overrides = [
	{
		files: [ "*.webpack.js" ],
		parserOptions: {
			sourceType: "module",
		},
		env: {
			commonjs: true,
			node: false,
		},
	},
	{
		files: [ "*.lib.js" ],
		env: {
			commonjs: false,
			browser: false,
			node: false,
		},
	},
	{
		files: [ "*.browser.js" ],
		env: {
			browser: true,
			node: false,
		},
	},
	{
		files: [ "jquery.*.js" ],
		env: {
			browser: true,
			jquery: true,
			node: false,
		},
	},
	{
		files: [ "*.user.js" ],
		env: {
			greasemonkey: true,
			browser: true,
			node: false,
		},
	},
];

config.overrides.forEach((override) => {
	if (override.env.greasemonkey) {
		override.rules = override.rules || {};
		override.rules.camelcase = config.rules.camelcase;
		config.rules.camelcase[1].allow.push("^GM_");
	}
});
config.plugins = config.plugins || [];

const rules = Object.keys(config.rules);
const removedRules = [];
const removedPlugins = {};
for (const rule of rules) {
	const slash = rule.indexOf('/');
	if (slash == 0) {
		// That doesn't sound right...
		delete config.rules[rule];
		removedRules.push(rule);
	}
	else if (slash > 0) {
		const plugin = rule.slice(0, slash);
		const pluginFull = `eslint-plugin-${plugin}`;
		try {
			require.resolve(pluginFull);
			config.plugins = config.plugins || [];
			if (!config.plugins.includes(plugin)) {
				config.plugins.push(plugin);
			}
		}
		catch (err) {
			// Failed to load
			delete config.rules[rule];
			removedRules.push(rule);
			if (!removedPlugins[plugin]) {
				removedPlugins[pluginFull] = require.resolve.paths(pluginFull);
			}
		}
	}
}

if (!module.parent) {
	const requestedInstall = (process.argv[2] || '').match(/^-+(i(?:nstall)?|auto(?:-?fix)?|fix)$/iu);
	const missingCount = Object.keys(removedPlugins).length;
	if (missingCount && requestedInstall) {
		console.info("Missing plugins detected, installing via npm...");
		const subProcessArgs = [
			'install',
			'-D',
			'eslint',
			...Object.keys(removedPlugins),
		];
		const npm = spawnSync('npm', subProcessArgs, {
			stdio: 'inherit',
		});
		if (npm.error) {
			console.error(npm.error);
		}
		else if (npm.status) {
			console.warn(`Subprocess npm exited with status ${npm.status}`);
		}
		else {
			spawnSync(process.argv[0], [ process.argv[1] ], {
				stdio: 'inherit',
			});
			process.exit();
		}
	}
	console.log(`Plugins detected: [${config.plugins.length}]`);
	for (const plugin of config.plugins) {
		const fullName = `eslint-plugin-${plugin}`;
		console.log(`- ${plugin} (${fullName}, ${require.resolve(fullName)})`);
	}
	console.log(`Plugins missing: [${missingCount}]`);
	for (const plugin in removedPlugins) {
		if (Reflect.apply(Object.prototype.hasOwnProperty, removedPlugins, [ plugin ])) {
			const searched = removedPlugins[plugin];
			if (Array.isArray(searched)) {
				console.log(`- ${plugin}\n  > ${searched.join("\n  > ")}`);
			}
			else {
				console.log(`- ${plugin} (no resolution paths)`);
			}
		}
	}
	console.log(`Rules removed: [${removedRules.length}]`);
	console.log(`Global rules defined: [${Object.keys(config.rules).length}]`);
	if (missingCount) {
		console.info("Pass -i or --install to automatically install missing plugins via npm");
	}
}

module.exports = config;
