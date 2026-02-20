<div align="center">
<h1>YTPA - Play All For YouTube</h1>
<div>

[![tests](https://github.com/RobertWesner/YouTube-Play-All/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/RobertWesner/YouTube-Play-All/actions/workflows/tests.yml)
[![validation](https://github.com/RobertWesner/YouTube-Play-All/actions/workflows/validation.yml/badge.svg?branch=main)](https://github.com/RobertWesner/YouTube-Play-All/actions/workflows/validation.yml)
![GitHub created_at](https://img.shields.io/github/created-at/RobertWesner/YouTube-Play-All)
![Last commit](https://img.shields.io/github/last-commit/RobertWesner/YouTube-Play-All?label=last%20update)

</div>
<a href="#installation">Installation</a> |
<a href="#usage">Usage</a> |
<a href="#issues">Issues</a> |
<a href="#license">License</a> |
<a href="./PRIVACY.md">Privacy</a>
<p>
<strong>YTPA</strong>: A sophisticated userscript adding the Play-All button back to YouTube.
</p>
<a href="https://forms.gle/UV9icRvkkaxs1Jnn6" aria-label="provide feedback" role="button">
<img src="./readme/button_feedback.png" tabindex="-1" height="32">
</a>
</div>

---

<div align="center">
Get more YouTube scripts on <a href="https://scripts.yt"><img src="https://scripts.yt/favicon.ico" height="10"> scripts.yt</a>
</div>

---

I got frustrated from not being able to binge-watch some YouTube channels. Unable to find a working userscript, I created this. Hopefully, it will be as useful to you as it is to me.

Also **works with YouTube Shorts** and supports the **mobile browser** version of YouTube.

Now with support for **Random Play**!

This project is actively maintained with automated tests and validation to keep it stable as YouTube evolves.

## Installation

1. Install a userscript manager. For example, [Tampermonkey](https://www.tampermonkey.net/):
    - [Firefox](https://addons.mozilla.org/en/firefox/addon/tampermonkey/)<br>
    - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)<br>
    - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)<br>
    - [Opera](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)<br>

2. On **Chrome**, **Edge**, **Opera**, and **OperaGX** make sure to [enable developer mode](https://www.tampermonkey.net/faq.php#Q209).

3. Install this userscript by clicking [this link](../../raw/main/script.user.js).

4. On **Chrome** and **Edge** make sure to [allow user scripts](https://www.tampermonkey.net/faq.php#Q209) if the script does not load.

Available mirrors:
- [Greasy Fork](https://greasyfork.org/en/scripts/490557-youtube-play-all)
- [OpenUserJS](https://openuserjs.org/scripts/RobertWesner/YouTube_Play_All)


## Demo For Latest/Popular Videos/Shorts

<img src="./readme/demo.gif" alt="Short animated demo" height="240">

## Usage

Once installed, you should be able to see the vibrant Play-All button when visiting or navigating to the videos section of a YouTube channel.
Simply clicking it or opening the link in a new tab will send you to the newest video playing inside the "Videos" playlist.

It may take a few seconds for the button to be dynamically added.

![screenshot.png](./readme/screenshot.png)
![screenshot_dark.png](./readme/screenshot_dark.png)


### Playing Sorted By Most Popular

When sorting by most popular, the button will take you to the "Popular videos" playlist.

![popular.png](readme/popular.png)


### Playing Random

It is possible to play all videos in random order by clicking the "Play Random"-button.


### Shorts

Shorts can be played both by latest and most popular.

![shorts.png](./readme/shorts.png)


### Live Streams

![live.png](./readme/live.png)


### Play Random

It is now possible to play by random on desktop devices.

![play_random.png](./readme/play_random.png)

Optionally with custom shuffle priority (select by clicking `▾`).

![play_random_custom.png](./readme/play_random_custom.png)


## Issues

If your current installation does not work, please update it by following the installation steps above before opening issues.

## Contributing and Testing

Contributions are welcome and will be automatically tested by GitHub workflows.
npm
### Basic Tests (easy)

Feel free to use [the testing userscript](https://github.com/RobertWesner/YouTube-Play-All/raw/main/test.user.js) after making a change.

1. Install the testing script.
2. Open your developer tools.
3. Run `YTPATestSuite.test();`.
4. Follow the instructions on screen.

### In-Depth Tests (recommended)

#### Inside A Container

Either use Docker:

```bash
docker run --rm -it "$(docker build -q -f Containerfile .)"
```

Or Podman:

```bash
podman run --rm -it "$(podman build -q -f Containerfile .)"
```

Or your other docker-compatible container environment of choice.

#### Running Tests Outside Of Containers

To run the automated tests directly, you will need the following tools:

- npm `11.6.2`
- spago `0.93.44` (get the npm install `spago@next` instead of AUR or other repository)
- Purescript purs `0.15.15`

Install/Update Chrome
```bash
(cd testing && npm ci && npx puppeteer browsers install chrome)
```

```bash
(cd testing && npm ci && spago run -m Run.Test.All)
```

#### Playground - Forcing A Specific State

These are useful to get a browser instance with the userscript
and a specific state of YouTube (like forcing a new UI).

See: [Playground](./testing/src/Run/Playground)

Keep in mind forcing a UI will only work for ones that
are yet to be deployed fully and asymmetrically released to some users.
It is **not possible** to force a specific UI that no longer is
available from YouTube.
These scripts do not preserve previous UIs,
the simply restart the browser until it has the new one.

```bash
# Change the module to your desired playground
(cd testing && npm ci && spago run -m Run.Playground.Ui.V20260219)
```

## License

This project is licensed under the [MIT License](../../raw/main/LICENSE.txt).
