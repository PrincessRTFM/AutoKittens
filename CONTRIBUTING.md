# Contributing

## The Basics

- Only edit the `.src.js` file.

- You **should** comment-sign your work so you have credit for it if you're comfortable with doing so. I prefer to always give credit to the people who actually did the work.

- Code should be written consistently. You can edit it locally however you want, but this repository will not accept code that does not pass `eslint` using the `.eslintrc.yaml` file included. (TIP: use `eslint --fix` when testing!)

## Credit

When you write code for this repository, you're free to comment-sign your work so that the source lists you as the author of some particular bugfix or feature implementation. I don't care what you write in your own comments either, or how many you have, or where they go. Comments are yours, code is ours. If you'd like to add a comment at the top with your name, email, handle, whatever and listing what you did, that's also perfectly good. The bottom line is that any code you write should be publicly acknowledged as yours, for the work you put in on it.

## Style and Standards

These are very controversial, I know. The included ESLint file is configured to avoid bugs and to maximise readability in the code. Perhaps the most controversial that I expect is that **indentation must be done with tabs** in this repository. **Tabs are for indentation, spaces are for alignment.** You can set your tab width to anything you like for yourself, but using spaces forces your idea of indentation _size_ on everyone else, and not all screens are equal.

I'm open to discussion - open an issue - on the styles and standards that are enforced here, but indentation with tabs is concrete and will not change. You can edit with spaces locally if you prefer and run `eslint --fix` before opening a pull request, but a PR indented with spaces will not be accepted.
