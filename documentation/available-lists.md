# Valid `list` GET-Parameters
This is a collection of brute-forced playlists (HTTP status 200) for a given channel ID.

```
https://www.youtube.com/playlist?list=...
```

Playlists which do not contain any videos, like member-only on some channels
will show a red error box saying `The playlist does not exist.`.

## Videos

### UU | Uploads from...
Contains both videos and shorts

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
Could only see ony my own channel.

## EL | YouTube
**E**mpty **L**ist? It does not show an error when empty unlike all other lists.

# Unidentified links
Valid links (HTTP 200) that could not be verified _yet_ with existing channels.

## UUMS
Presumably members-only shorts, given the MS name, but could not verify with any existing channels.

## CL
> The playlist does not exist.

## Mysterious "unviewable" Lists

### BB
> This playlist type is unviewable.

### MQ
> This playlist type is unviewable.

### PU
> This playlist type is unviewable.

### TT
> This playlist type is unviewable.
