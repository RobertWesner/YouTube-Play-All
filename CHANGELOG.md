# YTPA Changelog

## 20260220-0

Strong progress towards improvements for future testing.
Additional fixes for the new UI for channels with members-only content.

* Made testing harness more modular.
* Refactored initial testing to `Run.Test.All` module.
* Added `Run.Playground.Ui.V20260219` module to testing harness.
* [#56](https://github.com/RobertWesner/YouTube-Play-All/issues/56) Added compatibility to the new members-only UI.

## 20260208-0

More stability and cleaner code. A maintenance release without feature changes.
Added automated validation of userscript with [eslint](https://github.com/eslint/eslint) and [semgrep](https://github.com/semgrep/semgrep).

* Applied eslint recommendations.
* Improved reliability of automated testing.
* Added more steps to manual testing script (`test.user.js`).
* Ensure playlist emulation only runs when a playlist is part of the URL.
* Ensure every error within the script is handled properly.
* Remove the need for trusted type bypass by using `$builder()` amd `$populate()` (formerly `safeBuildDynamicHtml`) for all dynamic HTML.
* Increase mobile reliability for switching between Latest and Popular.
* [#51](https://github.com/RobertWesner/YouTube-Play-All/issues/51) [#53](https://github.com/RobertWesner/YouTube-Play-All/issues/53) Improved the regular expression for extracting channelId.
* Compatibility with partially released new YouTube UI elements.

`eslint` and `semgrep` are used to check for risky/insecure code inside the userscript.
This is a measure to build reliability and trust by making it easier to audit the code.


## 20251115-1

Slight improvements to stability in edge cases.
Strong work towards automatic testing. Commands are used to trigger tests.

* Attributes that are not HtmlElement properties are set from safeBuildDynamicHtml.
* Ensure all links in playlist during random play lead to random play.
* Minor UI improvements for random play.
* Made fetching of channelId more reliable when starting at a channel page and navigating to another.

There are now automated testing tools for YTPA, written in [purescript](https://www.purescript.org/) and running [puppeteer](https://pptr.dev/).


## 20251115-0

Improved compatibility for the browser extension wrapper
by replacing `insertAdjacentHTML` with `safeBuildDynamicHtml`.
Also added some reliability improvements when switching between pages.

* Implemented safeBuildDynamicHtml().
* Fixed random-play querySelector issue.
* Removed the redundant badge that was visible on random play.
* Improved reliability when starting in homepage and client-side-navigating to the channel videos.

Deep testing of all features with the modern UI.

Verified working features:

* Basic playlist link generation
* Random play
  * Clicking within playlist preserving random play
  * Clicking "Next" button preserving random play
* Playlist emulation


## 20251114-0

Fixed a small but old bug that lead to failed channelId extraction on a small set of channels.

* [#9](https://github.com/RobertWesner/YouTube-Play-All/issues/9) Improved reliability of channelId extraction.


## 20251113-0

Minor bugfixes and stylistic improvements.
Added support for `#below` (previously used `#secondary`).

* [#42](https://github.com/RobertWesner/YouTube-Play-All/issues/42) Made button sizes more consistent. 
* [#43](https://github.com/RobertWesner/YouTube-Play-All/issues/43) Fixed incorrect and duplicated buttons when chip bar is missing.
* [#41](https://github.com/RobertWesner/YouTube-Play-All/issues/41) Added random play compatibility for new /watch layout. 


## Previous versions

Before maintaining the changelog, the extension started with following features:

* Play All
  * Videos
  * Shorts
  * Streams
* Play Random
  * Prefer newest
  * Prefer oldest
