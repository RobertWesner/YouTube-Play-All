# Valid `list` GET-Parameters
This is a collection of brute-forced playlists (HTTP status 200) for a given channel ID.

```
https://www.youtube.com/playlist?list=...
https://www.youtube.com/watch?v=...&list=...
```

Playlists which do not contain any videos, like member-only on some channels
will show a red error box saying `The playlist does not exist.` without redirect.
Invalid lists (HTTP 404) will return the user to the YouTube homepage.

There do not appear to be any prefixes containing lowercase letters or numbers.

Checked so far (represented by RegEx):
- list=`[A-Z]{2}`
- list=`UU[A-Za-z0-9]{2}`
- list=`[A-Z]{4}`

Needs to be checked:
- list=`[A-Z]{3}`
- list=`[A-Z]{4}UC`
- list=`RD[A-Z]{4}`

Unrealistic to brute force but possibly relevant:
- list=`[A-Z]{5}`
- list=`[A-Z]{6}`

> Actually takes up to 10 years to brute force without a botnet...

## Uploads

### UU | Uploads from \<user name>
Contains both videos and shorts

### PU¹ | Popular uploads
Contains both videos and shorts, sorted by most popular descending

## Videos

### UULF | Videos
Only videos, no shorts

### UULP | Popular videos
Only videos, no shorts, sorted by most popular descending

## Shorts

### UUSH | Short videos
Only shorts

### UUPS | Popular short videos
Only shorts, sorted by most popular descending

## Live streams

### UULV | Live streams
Previously streamed

### UUPV | Popular live streams
Previously streamed, sorted by most popular descending

## Members-only

### UUMF | Members-only videos
Members-only videos

### UUMV | Members-only live streams
Members-only live streams

### UUMO | Members-only videos
Contrary to the name, it contains both members-only videos and live streams

## FL | Favorites
Favorites of a channel.

## LL | Liked videos
Could only see on my own channel.

Is it just the private version of FL?

## EL | YouTube
**E**mpty **L**ist? It does not show an error when empty unlike all other lists.

---

¹ Unviewable playlist: Cannot be directly be viewed in `/playlist` but works in `/watch`

# Unidentified links
Valid links (HTTP 200) that could not be verified _yet_ with existing channels.

## UUMS
Presumably members-only shorts, given the MS name, but could not verify with any existing channels.

## RDCL
>  The playlist does not exist.

## RDTM
>  The playlist does not exist.

## CL
> The playlist does not exist.

## TLGG
> The playlist does not exist.

## TLNI
> The playlist does not exist.

## TLPP
> The playlist does not exist.

## TLSR
> The playlist does not exist.

## Mysterious "unviewable" Lists
Always show this error message when viewed **directly as playlist**:
> This playlist type is unviewable.

Listed here are prefixes that do not work in `/playlist` and `/watch`.

### 2 Letter Prefixes
- BB
- MQ
- TT

### 4 Letter Prefixes
- ASRX
- BBAA to BBZZ (`BB[A-Z]{2}`)
- MLCA
- RDAO
- RDAT
- RDEM
- RDKM
- RDRE
- RDTS
- RLPR
- RLTD

### 6 Letter Prefixes
- RDCMUC
  - Most likely a mix playlist.
  - Possibly relevant: UC is used as channel prefix `https://www.youtube.com/channel/UC<ID>`.
  - Found via: https://www.reddit.com/r/youtubedl/comments/nlttmd/playlist_type_unviewable_anybody_seen_this_before/
