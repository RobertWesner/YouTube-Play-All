# YTPA Privacy

This script treats privacy as necessity, not an afterthought.

## What The Script Does

- Restores the play all button.
- Support Latest/Popular, Videos/Shorts/Streams.
- Adds optional random play.
  - Has options for preferred playing order (`Prefer newest`, `Prefer oldest`).
  - Stores simple "watched" flags per playlist in `localStorage` to avoid repeats.
- Provides playlist emulation; do a fallback call to an open source API when playlists fail to load.
  - Sends `playlist ID` and `script version` in a single request only when necessary.
  - As with any HTTPS request, your browser sends information like IP and user agent information automatically.
  - Receives a simple list of playlist items without any other information.

## What The Script Doesn't

- It does **not** interact with cookies, usernames or passwords.
- It does **not** send other data, personally identifying or otherwise, to the API.
- It does **not** call other external APIs besides the fallback API.
- It does **not** track you with the script or fallback API.
- It does **not** send telemetry data to any party.
- It does **not** require creating an account or authenticating in any way.
- It does **not** modify your YouTube account, subscriptions, playlists, or channel settings.
- It does **not** like videos, subscribe to channels, comment.
- It does **not** download or save videos; all playback still happens in YouTube natively.
- It does **not** inject advertisements, analytics, or third-party trackers.
- It does **not** execute arbitrary code from the fallback API or any other external source.
- It does **not** run on non-youtube domains.
- It does **not** obfuscate or minify its logic; the script is handwritten and meant to be human-readable.
- It does **not** store any local data other than "already watched" videos in random play.
- It does **not** change or block YouTube's recommendations.

## Privacy Policy

For privacy and data collection information related to the fallback playlist API, take a look at:

- [information about data collection/transmission](https://ytplaylist.robert.wesner.io/data)
- [privacy policy](https://datenschutz.robertwesner.de/dataprotection)
- [imprint](https://datenschutz.robertwesner.de/impressum)
