# circle-scrobbler
![GitHub last commit](https://img.shields.io/github/last-commit/12beesinatrenchcoat/circle-scrobbler?style=flat-square)
![XO code style](https://flat.badgen.net/badge/code%20style/XO/cyan)
![Badge count](https://img.shields.io/badge/badges-too%20many-informational?style=flat-square)

> **Note/Disclaimer/Thing:** No, I'm not associated with ppy, the osu!team, or anyone of the sort. I'm just some random person on the internet.

[osu!](https://osu.ppy.sh) used to have a [Last.fm](https://last.fm) scrobbling function (which is how I found out about last.fm in the first place.) Anyways, the feature no longer exists… so I tried to hack something together myself. I have no idea what I'm doing. **Use at your own risk.**

# How does it work?
1. Fetches a user's recent plays ([osu!api v2](https://osu.ppy.sh/docs/index.html)).
2. Scrobbles said plays (track name, artist name, timestamp, and duration) to last.fm ([Last.fm API](https://www.last.fm/api)).

## Limitations, warnings, and things you should know
- osu!'s "recent plays" section only carries the last 24 hours worth of plays.
- I haven't tested this with large amounts of plays.
- Your Last.fm session key (allows one to scrobble) is stored in `localStorage` because I don't know any better.
- Honestly there's probably just a bajillion things in this that are written poorly, insecure, or just bad. Sorry about that.

# For normal users:
Check out [circle-scrobbler.vercel.app](https://circle-scrobbler.vercel.app).

# If you want to contribute for some reason:
This was built with [Vercel. So you should probably install the CLI.](https://vercel.com/cli)

Still here? Cool, let's start by getting some API keys.
- Create a new OAuth Application in [your osu! account settings](https://osu.ppy.sh/home/account/edit) (it's at the bottom!)
  - The application name and callback URL are unimportant.
  - You'll need both the Client ID and Secret.
- [Create a new API account on Last.fm](https://www.last.fm/api/account/create). Set the Callback URL to whatever you're using (if you're developing locally, `localhost:3000` is probably a good choice.)

Got those keys? Cool, now make a `.env` file in the directory root:
```dotenv
OSU_CLIENT_ID=
OSU_CLIENT_SECRET=
LAST_FM_KEY=
LAST_FM_SECRET=
```
And, y'know, fill those keys in.

Run `npm i`, then `vercel dev`, and go to the link Vercel gives you in your browser of choice.

# License
Code is under the [MIT License](./LICENSE). [Mode icons](./icons) are under [CC-BY-NC 4.0](./icons/LICENSE.md). 
