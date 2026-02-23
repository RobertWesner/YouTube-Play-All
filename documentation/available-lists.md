# Valid `list` GET-Parameters
This is a collection of brute-forced playlists (HTTP status 200) for a given channel ID.

> Thank you to [Bakr-Ali](https://github.com/Bakr-Ali) for pointing me towards [this resource](https://wiki.archiveteam.org/index.php/YouTube/Technical_details#Playlists).
> 
> Initially all the information in this file were just brute forced prefixes. Make sure to take a look at the above link for any additional playlists and information.

```
https://www.youtube.com/playlist?list=...
https://www.youtube.com/watch?v=...&list=...
```

First video of a playlist can be played with the following link.
This will redirect to the appropriate `/watch` page.
```
https://www.youtube.com/playlist?list=...&playnext=1
```

Playlists which do not contain any videos, like member-only on some channels
will show a red error box saying `The playlist does not exist.` without redirect.
Invalid lists (HTTP 404) will return the user to the YouTube homepage.

There do not appear to be any prefixes containing lowercase letters or numbers.

Checked so far (represented by RegEx):
- list=`[A-Z]{1,4}`
- list=`UU[A-Za-z0-9]{2}`

Work in progress:
- list=`[A-Z]{4}UC`

Needs to be checked:
- list=`RD[A-Z]{4}`

Unrealistic to brute force but possibly relevant:
- list=`[A-Z]{5}`
- list=`[A-Z]{6}`

> Actually takes up to 10 years to brute force without a botnet...

## Uploads

### UU | Uploads from \<user name>

Contains videos, shorts, and live streams


### PU² | Popular uploads

Contains videos, shorts, and live streams, sorted by most popular descending

2026 UPDATE: This playlist was previously usable but not directly viewable. It is now no longer usable.


## Videos

### UULF | Videos

Only videos, no shorts, no live streams


### UULP | Popular videos

Only videos, no shorts, no live streams, sorted by most popular descending


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


## UUMS 

Members-only shorts


### UUMO | Members-only videos

Contrary to the name, it contains members-only videos, shorts, and live streams


## FL | Favorites

Favorites of a channel.


## LL | Liked videos

Could only see on my own channel.

Is it just the private version of FL?


## EL | YouTube

**E**mpty **L**ist? It does not show an error when empty unlike all other lists.


---

¹ Unviewable playlist: Cannot be directly be viewed in `/playlist` but works in `/watch`

² Confirmed no longer valid playlist, lost to time

---

# Unidentified links

Valid links (HTTP 200) that could not be verified _yet_ with existing channels.


## RDCL

> The playlist does not exist.


## RDTM

> The playlist does not exist.


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

- MQ
- TT


### 4 Letter Prefixes

- ASRX
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


### n Letter Prefixes

- `BB.*`
  - unviewable
  - any character, even non-alphanumeric can be used after BB
  - does **not** end with ID
  - the only known playlist prefix that behaves this way
  - even with none or 1000+ symbols after `BB` it still does not give HTTP 404
