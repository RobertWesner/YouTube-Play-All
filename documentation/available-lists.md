# Valid `list` GET-Parameters
This is a collection of brute-forced playlists (HTTP status 200) for a given channel ID.

```
https://www.youtube.com/playlist?list=...
```

Playlists which do not contain any videos, like member-only on some channels
will show a red error box saying `The playlist does not exist.`.

Checked so far (represented by RegEx):
- list=`[A-Z]{2}`
- list=`UU[A-Za-z0-9]{2}`

Work in progress:
- list=`[A-Z]{4}`

There do not appear to be any prefixes containing lowercase letters or numbers.

## Uploads

### UU | Uploads from...
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
Contains both members-only videos and live streams

## FL | Favorites
Favorites of a channel.

## LL | Liked videos
Could only see on my own channel.

## EL | YouTube
**E**mpty **L**ist? It does not show an error when empty unlike all other lists.

---

¹ Unviewable playlist: Cannot be directly be viewed in `/lists` but works in `/watch`

# Unidentified links
Valid links (HTTP 200) that could not be verified _yet_ with existing channels.

## UUMS
Presumably members-only shorts, given the MS name, but could not verify with any existing channels.

## CL
> The playlist does not exist.

## Mysterious "unviewable" Lists
Always show this error message when viewed **directly as playlist**:
> This playlist type is unviewable.

<!-- https://www.reddit.com/r/youtubedl/comments/nlttmd/playlist_type_unviewable_anybody_seen_this_before/ -->

### BB
Does not work in `/playlist` and `/watch`

### MQ
Does not work in `/playlist` and `/watch`

### TT
Does not work in `/playlist` and `/watch`

### ASRX
Does not work in `/playlist` and `/watch`

### BBAA to BBZZ
