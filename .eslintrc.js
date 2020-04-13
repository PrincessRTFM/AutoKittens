#!/usr/bin/env node

const {
	spawnSync,
} = require('child_process');

/* eslint-disable sonarjs/no-duplicate-string */
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
		"prefer-spread": "error",
		"max-len": [
			"warn",
			{
				code: 115,
				ignoreRegExpLiterals: false,
				ignoreStrings: false,
				ignoreUrls: false,
				ignoreTemplateLiterals: false,
				ignoreComments: false,
				comments: 115,
			},
		],
		"no-empty": "error",
		"wrap-regex": "error",
		"prefer-numeric-literals": "warn",
		"radix": "error",
		"no-new-object": "error",
		"accessor-pairs": "error",
		"no-else-return": "warn",
		"dot-location": [ "error", "property" ],
		"valid-typeof": "error",
		"space-unary-ops": "error",
		"comma-style": "error",
		"no-extra-bind": "warn",
		"consistent-return": [
			"warn",
			{
				treatUndefinedAsUnspecified: true,
			},
		],
		"no-useless-call": "warn",
		"array-bracket-newline": [
			"error",
			{
				minItems: 2,
				multiline: true,
			},
		],
		"no-dupe-keys": "error",
		"no-return-await": "error",
		"keyword-spacing": "error",
		"consistent-this": [
			"error",
			"that",
			"self",
			"me",
			"executionContext",
		],
		"implicit-arrow-linebreak": "error",
		"space-infix-ops": [
			"error",
			{
				int32Hint: true,
			},
		],
		"brace-style": [ "error", "stroustrup" ],
		"no-implicit-coercion": [
			"error",
			{
				allow: ["!!"],
				string: false,
			},
		],
		"object-curly-newline": [
			"error",
			{
				multiline: true,
				minProperties: 1,
				consistent: true,
			},
		],
		"default-case": "error",
		"no-dupe-class-members": "error",
		"no-lonely-if": "error",
		"no-multi-str": "warn",
		"prefer-const": "error",
		"dot-notation": [
			"error",
			{
				allowPattern: "^_*[a-zA-Z]+(_[A-Za-z]*)*$",
			},
		],
		"no-unreachable": "error",
		"no-eq-null": "error",
		"no-negated-condition": "warn",
		"yoda": "error",
		"no-unused-expressions": [
			"error",
			{
				allowTaggedTemplates: true,
			},
		],
		"no-octal": "warn",
		"no-useless-rename": "error",
		"func-name-matching": [
			"warn",
			"always",
			{
				considerPropertyDescriptor: true,
			},
		],
		"constructor-super": "error",
		"comma-spacing": "error",
		"array-bracket-spacing": [
			"error",
			"always",
			{
				singleValue: false,
			},
		],
		"require-atomic-updates": "error",
		"no-func-assign": "error",
		"guard-for-in": "error",
		"space-before-function-paren": [
			"error",
			{
				asyncArrow: "always",
				anonymous: "never",
				named: "never",
			},
		],
		"no-sparse-arrays": "error",
		"no-mixed-spaces-and-tabs": [ "error", "smart-tabs" ],
		"no-extend-native": [
			"error",
			{
				exceptions: [ "Array", "String" ],
			},
		],
		"no-delete-var": "error",
		"require-yield": "error",
		"no-multiple-empty-lines": "error",
		"no-empty-function": "warn",
		"no-script-url": "warn",
		"func-call-spacing": "error",
		"block-scoped-var": "error",
		"yield-star-spacing": "error",
		"space-in-parens": "error",
		"generator-star-spacing": [ "error", "after" ],
		"no-useless-constructor": "error",
		"array-element-newline": [
			"error",
			{
				multiline: true,
				minItems: 1,
			},
		],
		"semi": "error",
		"prefer-arrow-callback": "error",
		"operator-assignment": "error",
		"no-throw-literal": "warn",
		"no-extra-parens": [
			"error",
			"all",
			{
				enforceForArrowConditionals: false,
				conditionalAssign: false,
				nestedBinaryExpressions: false,
			},
		],
		"linebreak-style": "error",
		"no-class-assign": "error",
		"padded-blocks": [ "error", "never" ],
		"newline-per-chained-call": "error",
		"lines-between-class-members": [ "error", "never" ],
		"quote-props": [ "error", "consistent" ],
		"no-compare-neg-zero": "error",
		"no-global-assign": "error",
		"no-floating-decimal": "error",
		"require-unicode-regexp": "warn",
		"spaced-comment": "error",
		"no-eval": "error",
		"no-invalid-this": "error",
		"no-inner-declarations": "error",
		"template-tag-spacing": "error",
		"operator-linebreak": [ "error", "before" ],
		"no-const-assign": "error",
		"no-empty-character-class": "error",
		"func-names": [ "error", "as-needed" ],
		"indent": [
			"error",
			"tab",
			{
				SwitchCase: 1,
			},
		],
		"no-cond-assign": [ "error", "except-parens" ],
		"no-proto": "error",
		"no-array-constructor": "error",
		"one-var": [ "error", "never" ],
		"key-spacing": "error",
		"no-new-func": "error",
		"multiline-ternary": [ "error", "always-multiline" ],
		"block-spacing": "error",
		"no-unneeded-ternary": "error",
		"no-whitespace-before-property": "error",
		"no-extra-label": "warn",
		"no-undef": [
			"error",
			{
				typeof: true,
			},
		],
		"semi-spacing": [
			"error",
			{
				after: true,
				before: false,
			},
		],
		"object-curly-spacing": [ "error", "always" ],
		"no-obj-calls": "error",
		"for-direction": "error",
		"prefer-template": "error",
		"no-invalid-regexp": "error",
		"semi-style": "error",
		"no-alert": "warn",
		"no-extra-boolean-cast": "warn",
		"no-irregular-whitespace": [
			"error",
			{
				skipStrings: false,
				skipComments: true,
			},
		],
		"use-isnan": "error",
		"no-duplicate-case": "error",
		"no-octal-escape": "error",
		"no-dupe-args": "error",
		"no-unmodified-loop-condition": "error",
		"no-caller": "error",
		"getter-return": "error",
		"eol-last": "error",
		"new-parens": "error",
		"no-self-assign": "error",
		"no-iterator": "error",
		"object-shorthand": "error",
		"no-self-compare": "error",
		"no-constant-condition": [
			"error",
			{
				checkLoops: false,
			},
		],
		"no-undefined": "warn",
		"no-with": "error",
		"no-fallthrough": "error",
		"arrow-parens": [ "error", "as-needed" ],
		"no-tabs": [
			"error",
			{
				allowIndentationTabs: true,
			},
		],
		"no-trailing-spaces": "error",
		"no-var": "error",
		"no-confusing-arrow": [
			"error",
			{
				allowParens: true,
			},
		],
		"no-sequences": "error",
		"no-useless-computed-key": "error",
		"no-prototype-builtins": "warn",
		"no-multi-assign": "error",
		"no-useless-concat": "error",
		"function-paren-newline": [ "error", "multiline-arguments" ],
		"no-redeclare": [
			"error",
			{
				builtinGlobals: true,
			},
		],
		"no-unused-vars": [
			"warn",
			{
				args: "after-used",
				vars: "local",
			},
		],
		"comma-dangle": [
			"error",
			{
				imports: "always-multiline",
				arrays: "always-multiline",
				exports: "always-multiline",
				objects: "always-multiline",
				functions: "never",
			},
		],
		"no-implied-eval": "error",
		"no-use-before-define": "error",
		"no-extra-semi": "warn",
		"arrow-body-style": [ "error", "as-needed" ],
		"prefer-rest-params": "error",
		"no-unused-labels": "error",
		"no-debugger": "error",
		"no-loop-func": "error",
		"computed-property-spacing": "error",
		"no-label-var": "error",
		"arrow-spacing": "error",
		"class-methods-use-this": "warn",
		"prefer-promise-reject-errors": [
			"warn",
			{
				allowEmptyReject: true,
			},
		],
		"symbol-description": "error",
		"no-this-before-super": "error",
		"camelcase": [
			"error",
			{
				allow: ["^INTERNAL_"],
			},
		],
		"no-regex-spaces": "error",
		"no-case-declarations": "error",
		"no-template-curly-in-string": "error",
		"no-useless-catch": "error",
		"no-shadow": "error",
		"no-ex-assign": "error",
		"no-shadow-restricted-names": "error",
		"no-return-assign": "error",
		"rest-spread-spacing": "error",
		"switch-colon-spacing": "error",
		"no-unexpected-multiline": "error",
		"no-useless-escape": "warn",
		"no-unsafe-finally": "error",
		"no-new": "error",
		"no-lone-blocks": "error",
		"object-property-newline": [
			"error",
			{
				allowAllPropertiesOnSameLine: false,
			},
		],
		"no-new-wrappers": "error",
		"no-unsafe-negation": "error",
		"no-new-symbol": "error",
		"wrap-iife": [
			"error",
			"any",
			{
				functionPrototypeMethods: true,
			},
		],
		"array-callback-return": "error",
		"curly": "error",
		"space-before-blocks": "error",
		"template-curly-spacing": "error",
		"no-useless-return": "error",
		"no-misleading-character-class": "error",
		"unicorn/catch-error-name": [
			"error",
			{
				name: "err",
			},
		],
		"unicorn/consistent-function-scoping": "warn",
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
		"import/named": [
			"error",
			{
				commonjs: true,
			},
		],
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
		"sonarjs/no-duplicate-string": "warn",
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
		"import/docstyle": [ 'jsdoc', 'tomdoc' ],
	},
};
config.overrides = [
	{
		files: ["*.webpack.js"],
		parserOptions: {
			sourceType: "module",
		},
		env: {
			commonjs: true,
			node: false,
		},
	},
	{
		files: ["*.browser.js"],
		env: {
			browser: true,
			node: false,
		},
	},
	{
		files: ["jquery.*.js"],
		env: {
			browser: true,
			jquery: true,
			node: false,
		},
	},
	{
		files: ["*.user.js"],
		env: {
			greasemonkey: true,
			browser: true,
			node: false,
		},
	},
];
/* eslint-enable sonarjs/no-duplicate-string */
config.overrides.forEach(override => {
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
		const subProcessArgs = [ 'install', '-D', 'eslint', ...Object.keys(removedPlugins) ];
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
			spawnSync(process.argv[0], [process.argv[1]], {
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
		if (Reflect.apply(Object.prototype.hasOwnProperty, removedPlugins, [plugin])) {
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

