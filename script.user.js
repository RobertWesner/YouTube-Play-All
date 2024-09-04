// ==UserScript==
// @name            YouTube Play All
// @description     Adds the Play-All-Button to the videos, shorts, and live sections of a YouTube-Channel
// @version         2024-09-04.0
// @author          Robert Wesner (https://robert.wesner.io)
// @license         MIT
// @namespace       http://robert.wesner.io/
// @match           https://*.youtube.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant           none
// ==/UserScript==

/**
 * @var {{ createPolicy: (string, Object) => void }} window.trustedTypes
 */

(function () {
    'use strict';

    if (window.hasOwnProperty('trustedTypes')) {
        window.trustedTypes.createPolicy('default', { createHTML: string => string });
    }

    document.head.insertAdjacentHTML('beforeend', `<style>
        .play-all-button {
            border-radius: 8px;
            background-color: #bf4bcc;
            color: white;
            font-family: 'Roboto', 'Arial', sans-serif;
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

    let id;
    const apply = () => {
        let parent = location.host === 'm.youtube.com'
            // mobile view
            ? document.querySelector('ytm-feed-filter-chip-bar-renderer > div')
            // desktop view
            : document.querySelector('ytd-feed-filter-chip-bar-renderer iron-selector#chips');

        // See: available-lists.md
        let [allPlaylist, popularPlaylist] = window.location.pathname.endsWith('/videos')
            // Normal videos
            // list=UULP has the all videos sorted by popular
            // list=UU<ID> adds shorts into the playlist, list=UULF<ID> has videos without shorts
            ? ['UULF', 'UULP']
            // Shorts
            : window.location.pathname.endsWith('/shorts')
                ? ['UUSH', 'UUPS']
                // Live streams
                : ['UULV', 'UUPV'];

        parent.insertAdjacentHTML(
            'beforeend',
            // Check if popular videos are displayed
            parent.querySelector(':nth-child(2).selected, :nth-child(2).iron-selected')
                ? `<a class="play-all-button" href="/playlist?list=${popularPlaylist}${id}&playnext=1">Play Popular</a>`
                : `<a class="play-all-button" href="/playlist?&list=${allPlaylist}${id}&playnext=1">Play All</a>`,
        );
    };

    const observer = new MutationObserver(apply);
    const addButton = async () => {
        observer.disconnect();

        if (!(window.location.pathname.endsWith('/videos') || window.location.pathname.endsWith('/shorts') || window.location.pathname.endsWith('/streams'))) {
            return;
        }

        // This check is necessary for the mobile Interval
        if (document.querySelector('.play-all-button')) {
            return;
        }

        const html = await (await fetch('.')).text();
        const i = html.indexOf('<link rel="canonical" href="https://www.youtube.com/channel/UC') + 60 + 2 /* ID starts with "UC" */;
        id = html.substring(i, i + 22);

        // Initially generate button
        apply();

        // Regenerate button if switched between Latest and Popular
        const element = document.querySelector('ytd-rich-grid-renderer');
        if (!element) {
            return;
        }

        observer.observe(element, {
            attributes: true,
            childList: false,
            subtree: false
        });
    };

    // Removing the button prevents it from still existing when switching between "Videos", "Shorts", and "Live"
    // This is necessary due to the mobile Interval requiring a check for an already existing button
    const removeButton = () => {
        const button = document.querySelector('.play-all-button');

        if (button) {
            button.remove();
        }
    };

    if (location.host === 'm.youtube.com') {
        // The "yt-navigate-finish" event does not fire on mobile
        // Unfortunately pushState is triggered before the navigation occurs, so a Proxy is useless
        setInterval(addButton, 1000);
    } else {
        window.addEventListener('yt-navigate-start', removeButton);
        window.addEventListener('yt-navigate-finish', addButton);
    }
})();
