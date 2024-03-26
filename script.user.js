// ==UserScript==
// @name            YouTube Play All
// @description     Adds the Play-All-Button to the videos section of a YouTube-Channel
// @version         2024-03-25
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
        
        ytm-feed-filter-chip-bar-renderer .play-all-button {
            margin-left: 0;
        }
    </style>`);

    setInterval(() => {
        if (!window.location.pathname.endsWith('/videos') || document.querySelector('.play-all-button')) {
            return;
        }

        fetch('.')
            .then(_ => _.text())
            .then(html => {
                const i = html.indexOf('<link rel="canonical" href="https://www.youtube.com/channel/UC') + 60 + 2 /* ID starts with "UC" */;
                const id = html.substring(i, i + 22);

                let parent, latestVideo;
                if (location.host === 'www.youtube.com') {
                    parent = document.querySelector('ytd-feed-filter-chip-bar-renderer iron-selector#chips');
                    latestVideo = document.querySelector('div#primary a#thumbnail').attributes.href.value;
                } else if (location.host === 'm.youtube.com') {
                    parent = document.querySelector('ytm-feed-filter-chip-bar-renderer > div');
                    latestVideo = document.querySelector('ytm-compact-video-renderer a').attributes.href.value;
                }

                // list=UU<ID> adds shorts into the playlist, list=UULF<ID> only has actual videos
                parent.insertAdjacentHTML(
                    'beforeend',
                    `<a class="play-all-button" href="${latestVideo}&list=UULF${id}">Play All</a>`,
                );
            });
    }, 1000);
})();
