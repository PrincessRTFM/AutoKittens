# AutoKittens v3

[![GitHub last commit](https://img.shields.io/github/last-commit/PrincessRTFM/AutoKittens?logo=github)](https://github.com/PrincessRTFM/AutoKittens/commits/master)
[![GitHub issues](https://img.shields.io/github/issues-raw/PrincessRTFM/AutoKittens?logo=github)](https://github.com/PrincessRTFM/AutoKittens/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc)
[![GitHub closed issues](https://img.shields.io/github/issues-closed-raw/PrincessRTFM/AutoKittens?logo=github)](https://github.com/PrincessRTFM/AutoKittens/issues?q=is%3Aissue+is%3Aclosed+sort%3Aupdated-desc)

## What is it?
AutoKittens is an automation assistant script for the [Kittens Game](http://bloodrizer.ru/games/kittens/#), an addictive click-based browser idle game. It includes a number of features, such as:

- Automatically observing astronomical events
- Crafting configurable amounts when resources are near their limits
- Hunting and praising when near the limits
- Automatic trading when gold is near the limit, configurable per-season
- Fairly detailed control of the `fur -> parchment -> manuscript -> compendium -> blueprint` crafting line
- Resource time-to-cap/time-to-zero timers at the bottom of the page
- Persistent configuration
- Script update checker
- UI tweaks like lighter shadows and different time formats

## Version ~~2~~ 3?
The [original AutoKittens script](http://birdiesoft.dk/autokittens.php) (written by Michael Madsen, owner of Birdiesoft and the operator of that site, [u/Pidgeot14](https://reddit.com/u/Pidgeot14) on reddit) was a brilliant piece of work, but it is sadly no longer properly functional. The internals were written on what are now thoroughly outdated conventions, and the game has undergone script-breaking changes since.

Version 2 (the original of this script) was an update to modern JS, as well as a fix of the various bugs (internal and visible ones both) that rendered it effectively unusable.

Version 3 is an update and minor-to-moderate rewrite of _that_, after about half a year of no development. Some bits were ripped out as "more trouble than they're worth", primarily the most complicated of the calculators.

## How do I use it?
You can either copy the contents of the script into your browser console on the game page (not recommended) or we can borrow a page from [ScriptKitties](https://github.com/MaPaul1977/KittensGame) and use a scriptlet bookmark - just save this as a bookmark and click on it (once!) on the game page:

	javascript:(function(){var d=document,s=d.createElement('script');s.type='text/javascript';s.src='https://princessrtfm.github.io/AutoKittens/AutoKittens.js?nocache';d.body.appendChild(s);})();

Please note, if you use a script blocker (uMatrix, NoScript, etc), you may need to allow script loading from `princessrtfm.github.io` for this to work. If you want to use the update checker feature (a button at the bottom of the options dialog) you will _definitely_ need to allow AJAX/XHR requests (or possibly "other" if those don't work or your blocker doesn't filter them quite right) or it will fail to connect.

If you want to use some other method of injection, the script is available via [Github Pages](https://princessrtfm.github.io/AutoKittens/AutoKittens.js).

## Update checker?
In the options box, at the very bottom, is a button to check for an update. It loads the script from Github as _text_ - not a script - and looks for a specific marker that indicates whether it's older, newer, or the same as the version you're running the check from. You might need to allow AJAX/XHR from `princessrtfm.github.io` in your script blocker because that's how it loads the script contents to inspect them. Some blockers may also require you to allow loading scripts from `princessrtfm.github.io` because it is still trying to load "a script" even if it's not running it.

## Contributing

### I found a bug!

If it's a game-breaker or a script-breaker, please join the [Kittens Game discord](https://discord.gg/2arBf9K) and ping me (`Lilith Song#7246`) in the `#scripts-code` channel. If I'm awake and able, I'll respond to breaking bugs immediately; I consider these to be priority 1.

If it's something that's acting a little funky, you can either ping me there or (preferably) open an issue on the tracker here. I usually check my Github notifications at least once a day and often more.

If it's in one of the calculators, I know they're janky. The math is complicated and the game code is messy in places. Definitely let me know, but don't expect it to be completely fixed soon.

### I have a request!

By all means, let me know! Small things are usually added very quickly, big ones or things that are just incompatible enough to need a larger overhaul update take longer. Entirely new features from scratch will take the longest, but I'm still very much open to ideas.

If it's a little thing, like "can you make _X_ autocraftable too?" then you can just ping me on the discord server and I can probably have it up in ten minutes or so if I'm available at the time. Big requests should probably go on here instead.

### I (fixed a bug / implemented a feature / etc) for you!

You definitely have my gratitude for that, and I hope you open a pull request to send me the code! You're fully allowed to sign your own changed bits in comments too, so you have credit for your work. Just remember to check `CONTRIBUTING.md` for guidelines.

## Contact

You can email me (my email is available through my Github profile), open an issue on here, or ping `Lilith Song#7246` on discord. I don't accept friend requests from people I don't know, especially if we don't even share a server, so please don't send me any.
