// ==UserScript==
// @name            YouTube Play All
// @description     Adds the Play-All-Button to the videos, shorts, and live sections of a YouTube-Channel
// @version         20241013-2
// @author          Robert Wesner (https://robert.wesner.io)
// @license         MIT
// @namespace       http://robert.wesner.io/
// @match           https://*.youtube.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant           none
// ==/UserScript==

/**
 * @var {{ defaultPolicy: any, createPolicy: (string, Object) => void }} window.trustedTypes
 */
/**
 * @var {{ script: { version: string } }} GM_info
 */

(async function () {
    'use strict';

    const scriptVersion = GM_info.script.version || null;
    if (scriptVersion && /-(alpha|beta|dev|test)$/.test(scriptVersion)) {
        console.log(
            '%cYTPA - YouTube Play All\n',
            'color: #bf4bcc; font-size: 32px; font-weight: bold',
            'You are currently running a test version:',
            scriptVersion,
        );
    }

    if (window.hasOwnProperty('trustedTypes') && !window.trustedTypes.defaultPolicy) {
        window.trustedTypes.createPolicy('default', { createHTML: string => string });
    }

    document.head.insertAdjacentHTML('beforeend', `<style>
        .ytpa-btn {
            border-radius: 8px;
            font-family: 'Roboto', 'Arial', sans-serif;
            font-size: 1.4rem;
            line-height: 2rem;
            font-weight: 500;
            padding: 0.5em;
            margin-left: 0.6em;
            text-decoration: none;
        }
        
        .ytpa-badge {
            border-radius: 8px;
            padding: 0.2em;
            font-size: 0.8em;
            vertical-align: top;
        }

        .ytpa-play-all-btn {
            background-color: #bf4bcc;
            color: white;
        }

        .ytpa-play-all-btn:hover {
            background-color: #d264de;
        }
        
        .ytpa-random-btn, .ytpa-random-badge {
            background-color: #2b66da;
            color: white;
        }

        .ytpa-random-btn:hover {
            background-color: #6192ee;
        }
        
        .ytpa-delete-btn {
            background-color: #e84642;
            color: white;
            padding: 0.5em;
            font-size: 0.8em;
            border-radius: 8px;
            font-size: 0.6em;
        }
        
        .ytpa-delete-btn:hover {
            background-color: #ee6966;
        }
        
        /* fetch() API introduces a race condition. This hides the occasional duplicate buttons */
        .ytpa-play-all-btn ~ .ytpa-play-all-btn {
            display: none;
        }
        
        /* Fix for mobile view */
        ytm-feed-filter-chip-bar-renderer .ytpa-play-all-btn {
            margin-left: 0;
            padding: 0.4em;
        }
        
        body:has(#secondary ytd-playlist-panel-renderer[ytpa-random]) .ytp-prev-button.ytp-button {
            display: none !important;
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
            `
                ${
                    parent.querySelector(':nth-child(2).selected, :nth-child(2).iron-selected')
                        ? `<a class="ytpa-btn ytpa-play-all-btn" href="/playlist?list=${popularPlaylist}${id}&playnext=1">Play Popular</a>`
                        : `<a class="ytpa-btn ytpa-play-all-btn" href="/playlist?list=${allPlaylist}${id}&playnext=1">Play All</a>`
                }
                <a class="ytpa-btn ytpa-random-btn" href="/playlist?list=${allPlaylist}${id}&playnext=1&ytpa-random=1">Play Random</a>
            `,
        );
    };

    const observer = new MutationObserver(apply);
    const addButton = async () => {
        observer.disconnect();

        if (!(window.location.pathname.endsWith('/videos') || window.location.pathname.endsWith('/shorts') || window.location.pathname.endsWith('/streams'))) {
            return;
        }

        // This check is necessary for the mobile Interval
        if (document.querySelector('.ytpa-play-all-btn')) {
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
        const button = document.querySelector('.ytpa-play-all-btn');

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

    (() => {
        const urlParams = new URLSearchParams(window.location.search);

        if (!urlParams.has('ytpa-random') || urlParams.get('ytpa-random') === '0') {
            return;
        }

        const getVideoId = url => new URLSearchParams(new URL(url).search).get('v');

        const getStorageKey = () => `ytpa-random-${urlParams.get('list')}`;
        const getStorage = () => JSON.parse(localStorage.getItem(getStorageKey()) || '[]');
        const markWatched = videoId => {
            localStorage.setItem(getStorageKey(), JSON.stringify([...getStorage(), videoId]));
            document.querySelectorAll('#wc-endpoint[href*=zsA3X40nz9w]').forEach(
                element => element.parentElement.setAttribute('hidden', ''),
            );
        };

        const applyRandomPlay = () => {
            if (!window.location.pathname.endsWith('/watch')) {
                return;
            }

            const playlistContainer = document.querySelector('#secondary ytd-playlist-panel-renderer');
            if (playlistContainer === null) {
                return;
            }

            if (playlistContainer.hasAttribute('ytpa-random')) {
                return;
            }

            playlistContainer.setAttribute('ytpa-random', 'applied');
            playlistContainer.querySelectorAll('#wc-endpoint').forEach(element => {
                element.href += '&ytpa-random=1';

                const entryKey= getVideoId(element.href);
                if (getStorage().includes(entryKey)) {
                    element.parentElement.setAttribute('hidden', '');
                }
            });

            const playNextRandom = () => {
                let videos = playlistContainer.querySelectorAll('ytd-playlist-panel-video-renderer:not([hidden]) #wc-endpoint');
                // fallback to a random already watched video, will redirect again once loaded
                // this happens due to the playlist widget only showing ~100 videos at once. may cause reload loops
                // TODO: it would be a lot better to first fetch all videos and be truly random,
                //       but that can be difficult, since YouTube saves bandwidth.
                if (videos.length === 0) {
                    videos = playlistContainer.querySelectorAll('#wc-endpoint');
                }

                // Due to YouTube providing the range (current - 20 -> current + 80) a pure random
                // would favor going back further and further, this is prevented by limiting to the first 30.
                window.location.href = videos[Math.floor(Math.random() * Math.min(30, videos.length))].href;
            };

            if (getStorage().includes(getVideoId(location.href))) {
                playNextRandom();

                return;
            }


            const header = playlistContainer.querySelector('h3 a');
            header.innerHTML += ' <span class="ytpa-badge ytpa-random-badge">random</span>'
                + ' <span class="ytpa-badge ytpa-delete-btn">🗑️</span>';
            header.href = 'javascript:none';
            header.querySelector('.ytpa-delete-btn').addEventListener('click', event => {
                event.preventDefault();

                localStorage.removeItem(getStorageKey());

                let params = new URLSearchParams(location.search);
                params.delete('ytpa-random');
                window.location.href = `${window.location.pathname}?${params.toString()}`;
            });

            setInterval(() => {
                const videoId = getVideoId(location.href);

                let params = new URLSearchParams(location.search);
                params.set('ytpa-random', '1');
                window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);

                /**
                 * @var {{ getProgressState: () => { current: number, duration, number } }} player
                 */
                const player = document.querySelector('#movie_player');
                const progressState = player.getProgressState();
                if (progressState.current / progressState.duration >= 0.999) {
                    markWatched(videoId);
                    playNextRandom();
                }

                const nextButton = document.querySelector('#ytd-player .ytp-next-button.ytp-button');
                if (nextButton && !nextButton.hasAttribute('ytpa-random')) {
                    nextButton.setAttribute('data-preview', '');
                    nextButton.setAttribute('data-tooltip-text', 'Random');
                    nextButton.setAttribute('ytpa-random', 'applied');
                    // TODO: also listen for SHIFT + N ?
                    nextButton.addEventListener('click', event => {
                        event.preventDefault();
                        markWatched(videoId);

                        playNextRandom();
                    });
                }
            }, 1000);
        };

        setInterval(applyRandomPlay, 1000);
    })();
})();
