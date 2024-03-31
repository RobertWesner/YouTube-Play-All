// ==UserScript==
// @name            YouTube Play All
// @description     Adds the Play-All-Button to the videos and shorts sections of a YouTube-Channel
// @version         2024-03-31
// @author          Robert Wesner (https://robert.wesner.io)
// @license         MIT
// @namespace       http://robert.wesner.io/
// @match           https://*.youtube.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant           none
// ==/UserScript==

(function() {
    'use strict';

    document.head.insertAdjacentHTML('beforeend', `<style>
        .play-all-button {
            border-radius: 8px;
            background-color: #bf4bcc;
            color: white;
            font-family: 'Roboto','Arial',sans-serif;
	        font-size: 1.4rem;
	        line-height: 2rem;
	        font-weight: 500;
            padding: 0.5em;
            margin-left: 0.6em;
            text-decoration: none;
        }

        .play-all-button:hover {
            background-color: #d264de;
        }
        
        /* fetch() API introduces a race condition. This hides the occasional duplicate buttons */
        .play-all-button ~ .play-all-button {
            display: none;
        }
        
        /* Fix for mobile view */
        ytm-feed-filter-chip-bar-renderer .play-all-button {
            margin-left: 0;
            padding: 0.4em;
        }
    </style>`);

    setInterval(() => {
        if (!(window.location.pathname.endsWith('/videos') || window.location.pathname.endsWith('/shorts'))) {
            return;
        }

        if (document.querySelector('.play-all-button')) {
            return;
        }

        fetch('.')
            .then(_ => _.text())
            .then(html => {
                const i = html.indexOf('<link rel="canonical" href="https://www.youtube.com/channel/UC') + 60 + 2 /* ID starts with "UC" */;
                const id = html.substring(i, i + 22);

                let [parent, latestVideo] =
                    location.host ===
                        'm.youtube.com' ? [
                            // mobile view
                            document.querySelector('ytm-feed-filter-chip-bar-renderer > div'),
                            document.querySelector('ytm-compact-video-renderer a, .reel-item-endpoint'),
                        ] : [
                            // desktop view
                            document.querySelector('ytd-feed-filter-chip-bar-renderer iron-selector#chips'),
                            document.querySelector('div#primary a#thumbnail'),
                        ];

                if (!latestVideo) {
                    // content was not loaded yet, no latest video found -> retry next cycle
                    return;
                }

                // See: available-lists.md
                let allPlaylist, popularPlaylist;
                if (window.location.pathname.endsWith('/videos')) {
                    // Normal videos
                    allPlaylist = 'UULF';
                    popularPlaylist = 'UULP';
                    latestVideo = latestVideo.attributes.href.value;
                } else {
                    // Shorts
                    allPlaylist = 'UUSH';
                    popularPlaylist = 'UUPS';
                    // get just the short ID and play it in regular video mode
                    latestVideo = latestVideo.attributes.href.value.split('/');
                    latestVideo = `/watch?v=${latestVideo[latestVideo.length - 1]}`;
                }

                parent.insertAdjacentHTML(
                    'beforeend',
                    // Check if popular videos are displayed
                    parent.querySelector(':nth-child(2).selected, :nth-child(2).iron-selected')
                        // list=UULP has the all videos sorted by popular
                        ? `<a class="play-all-button" href="${latestVideo}&list=${popularPlaylist}${id}">Play Popular</a>`
                        // list=UU<ID> adds shorts into the playlist, list=UULF<ID> has videos without shorts
                        : `<a class="play-all-button" href="${latestVideo}&list=${allPlaylist}${id}">Play All</a>`,
                );
            }).catch();
    }, 1000);
})();
