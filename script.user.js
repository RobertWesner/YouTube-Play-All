// ==UserScript==
// @name         YouTube Play All
// @namespace    http://robert.wesner.io/
// @version      2024-03-21
// @description  Adds the Play-All-Button to the videos section of a YouTube-Channel
// @author       Robert Wesner
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
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
    </style>`);

    setInterval(() => {
        if (!window.location.pathname.endsWith('/videos') || document.querySelector('.play-all-button')) {
            return;
        }

        fetch('.')
            .then(_ => _.text())
            .then(html => {
                const i = html.indexOf('<link rel="canonical"') + 60 + 2 /* ID starts with "UC" */;
                const id = html.substring(i, i + 22);

                // list=UU<ID> adds shorts into the playlist, list=UULF<ID> only has actual videos
                document.querySelector('ytd-feed-filter-chip-bar-renderer').querySelector('iron-selector#chips').insertAdjacentHTML('beforeend', `
                    <a class="play-all-button" href="${
                    document.querySelector('div#primary a#thumbnail').attributes.href.value
                }&list=UULF${id}">Play All</a>
                `);
            });
    }, 5000);
})();