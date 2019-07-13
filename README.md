# AutoKittens v2

## What is it?
AutoKittens is an automation assistant script for the [Kittens Game](http://bloodrizer.ru/games/kittens/#), an addictive click-based browser idle game. It includes a number of features, such as:

- Automatically observing astronomical events
- Crafting configurable amounts when resources are near their limits
- Hunting and praising when near the limits
- Automatic trading when gold is near the limit, configurable per-season
- Fairly detailed control of the `fur -> parchment -> manuscript -> compendium -> blueprint` crafting line
- Resource time-to-cap/time-to-zero timers at the bottom of the page
- Persistant configuration

## Version 2?
The [original AutoKittens script](http://birdiesoft.dk/autokittens.php) (author not actually known) was a brilliant piece of work, but it is sadly no longer properly functional. The internals were written on what are now thoroughly outdated conventions, and the game has undergone script-breaking UI changes since. This is an update to modern JS, as well as a fix of the various bugs (internal and visible ones both) that rendered it effectively unusable.

## How do I use it?
You can either copy the contents of the script into your browser console on the game page (not recommended) or we can take a page out from [ScriptKitties](https://github.com/MaPaul1977/KittensGame) and use a [scriptlet bookmark](javascript:(function(){var d=document,s=d.createElement('script');s.src='https://rawgit.com/PrincessRTFM/AutoKittens/master/AutoKittens.js';d.body.appendChild(s);})();) - just save that link as a bookmark and click on it (once!) on the game page.

If you want to use some other method of injection, the script is available via [rawgit](https://rawgit.com/PrincessRTFM/AutoKittens/master/AutoKittens.js). 
