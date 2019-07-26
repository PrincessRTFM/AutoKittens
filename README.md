# AutoKittens v2

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

## Version 2?
The [original AutoKittens script](http://birdiesoft.dk/autokittens.php) (author believed to be Michael Madsen, owner of Birdiesoft and the operator of that site) was a brilliant piece of work, but it is sadly no longer properly functional. The internals were written on what are now thoroughly outdated conventions, and the game has undergone script-breaking changes since. This is an update to modern JS, as well as a fix of the various bugs (internal and visible ones both) that rendered it effectively unusable.

## How do I use it?
You can either copy the contents of the script into your browser console on the game page (not recommended) or we can borrow a page from [ScriptKitties](https://github.com/MaPaul1977/KittensGame) and use a scriptlet bookmark - just save this as a bookmark and click on it (once!) on the game page:

	javascript:(function(){var d=document,s=d.createElement('script');s.src='https://princessrtfm.github.io/AutoKittens/AutoKittens.js';d.body.appendChild(s);})();

Please note, if you use a script blocker (uMatrix, NoScript, etc), you may need to allow script loading from `princessrtfm.github.io` for this to work. If you want to use the update checker feature (a button at the bottom of the options dialog) you will _definitely_ need to allow AJAX/XHR requests (or possibly "other" if those don't work or your blocker doesn't filter them quite right) or it will fail to connect.

If you want to use some other method of injection, the script is available via [Github Pages](https://princessrtfm.github.io/AutoKittens/AutoKittens.js). 

## Update checker?
In the options box, at the very bottom, is a button to check for an update. It loads the script from Github as _text_ - not a script - and looks for a specific marker that indicates whether it's older, newer, or the same as the version you're running the check from. You might need to allow AJAX/XHR from `princessrtfm.github.io` in your script blocker because that's how it loads the script contents to inspect them. Some blockers may also require you to allow loading scripts from `princessrtfm.github.io` because it is still trying to load "a script" even if it's not running it.
