// ==UserScript==
// @name            YouTube Play All
// @description     Adds the Play-All-Button to the videos, shorts, and live sections of a YouTube-Channel
// @version         20241029-1-beta
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
        
        .ytpa-random-btn, .ytpa-random-badge, .ytpa-random-notice {
            background-color: #2b66da;
            color: white;
        }

        .ytpa-random-btn:hover {
            background-color: #6192ee;
        }
        
        .ytpa-button-container {
            display: flex;
            width: 100%;
            margin-top: 1em;
            margin-bottom: -1em;
        }

        ytd-rich-grid-renderer .ytpa-button-container > :first-child {
            margin-left: 0;
        }
        
        /* fetch() API introduces a race condition. This hides the occasional duplicate buttons */
        .ytpa-play-all-btn ~ .ytpa-play-all-btn,
        .ytpa-random-btn ~ .ytpa-random-btn {
            display: none;
        }
        
        /* Fix for mobile view */
        ytm-feed-filter-chip-bar-renderer .ytpa-btn {
            margin-left: 0;
            margin-right: 12px;
            padding: 0.4em;
        }
        
        body:has(#secondary ytd-playlist-panel-renderer[ytpa-random]) .ytp-prev-button.ytp-button,
        body:has(#secondary ytd-playlist-panel-renderer[ytpa-random]) .ytp-next-button.ytp-button:not([data-tooltip-text="Random"]) {
            display: none !important;
        }
        
        #secondary ytd-playlist-panel-renderer[ytpa-random] ytd-menu-renderer.ytd-playlist-panel-renderer {
            height: 1em;
            visibility: hidden;
        }
        
        #secondary ytd-playlist-panel-renderer[ytpa-random]:not(:hover) ytd-playlist-panel-video-renderer {
            filter: blur(2em);
        }

        .ytpa-random-notice {
            padding: 1em;
            z-index: 1000;
        }
    </style>`);

    let id;
    const apply = () => {
        let parent = location.host === 'm.youtube.com'
            // mobile view
            ? document.querySelector('ytm-feed-filter-chip-bar-renderer > div')
            // desktop view
            : document.querySelector('ytd-feed-filter-chip-bar-renderer iron-selector#chips');

        // #5: add a custom container for buttons if Latest/Popular/Oldest is missing
        if (parent === null) {
            const grid = document.querySelector('ytd-rich-grid-renderer, ytm-rich-grid-renderer');
            grid.insertAdjacentHTML('afterbegin', '<div class="ytpa-button-container"></div>');
            parent = grid.querySelector('.ytpa-button-container');
        }

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

        // Check if popular videos are displayed
        if (parent.querySelector(':nth-child(2).selected, :nth-child(2).iron-selected')) {
            parent.insertAdjacentHTML(
                'beforeend',
                `<a class="ytpa-btn ytpa-play-all-btn" href="/playlist?list=${popularPlaylist}${id}&playnext=1">Play Popular</a>`
            );
        } else {
            parent.insertAdjacentHTML(
                'beforeend',
                `<a class="ytpa-btn ytpa-play-all-btn" href="/playlist?list=${allPlaylist}${id}&playnext=1">Play All</a>`
            );
        }

        if (location.host === 'm.youtube.com') {
            // YouTube returns an "invalid response" when using client side routing for playnext=1 on mobile
            document.querySelectorAll('.ytpa-btn').forEach(btn => btn.addEventListener('click', event => {
                event.preventDefault();

                window.location.href = btn.href;
            }));
        } else {
            // Only allow random play in desktop version for now
            parent.insertAdjacentHTML(
                'beforeend',
                `<a class="ytpa-btn ytpa-random-btn" href="/playlist?list=${allPlaylist}${id}&playnext=1&ytpa-random=initial">Play Random</a>`
            );
        }
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

    // Random play feature
    (() => {
        // Random play is not supported for mobile devices
        if (location.host === 'm.youtube.com') {
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);

        if (!urlParams.has('ytpa-random') || urlParams.get('ytpa-random') === '0') {
            return;
        }

        const getVideoId = url => new URLSearchParams(new URL(url).search).get('v');

        const getStorageKey = () => `ytpa-random-${urlParams.get('list')}`;
        const getStorage = () => JSON.parse(localStorage.getItem(getStorageKey()) || '{}');

        const isWatched = videoId => getStorage()[videoId] || false;
        const markWatched = videoId => {
            localStorage.setItem(getStorageKey(), JSON.stringify({...getStorage(), [videoId]: true }));
            document.querySelectorAll('#wc-endpoint[href*=zsA3X40nz9w]').forEach(
                element => element.parentElement.setAttribute('hidden', ''),
            );
        };

        // Storage needs to now be { [videoId]: bool }
        try {
            if (Array.isArray(getStorage())) {
                localStorage.removeItem(getStorageKey());
            }
        } catch (e) {
            localStorage.removeItem(getStorageKey());
        }

        const playNextRandom = () => {
            const videos = Object.entries(getStorage()).filter(([_, watched]) => !watched);
            const params = new URLSearchParams(window.location.search);
            params.set('v', videos[Math.floor(Math.random() * videos.length)][0]);
            params.set('ytpa-random', '1');
            params.delete('t');
            params.delete('index');
            window.location.href = `${window.location.pathname}?${params.toString()}`;
        };

        let isIntervalSet = false;

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
            playlistContainer.querySelector('.header').insertAdjacentHTML('afterend', `
                <div class="ytpa-random-notice">
                    This playlist is using random play.<br>
                    The videos will <strong>not be played in the order</strong> listed here.
                </div>
            `)

            const storage = getStorage();
            playlistContainer.querySelectorAll('#wc-endpoint').forEach(element => {
                const videoId = (new URLSearchParams(new URL(element.href).searchParams)).get('v');
                if (!isWatched(videoId)) {
                    storage[videoId] = false;
                }

                element.href += '&ytpa-random=1';
                // This bypasses the client side routing
                element.addEventListener('click', event => {
                    event.preventDefault();

                    window.location.href = element.href;
                });

                const entryKey= getVideoId(element.href);
                if (isWatched(entryKey)) {
                    element.parentElement.setAttribute('hidden', '');
                }
            });
            localStorage.setItem(getStorageKey(), JSON.stringify(storage));

            if (urlParams.get('ytpa-random') === 'initial' || isWatched(getVideoId(location.href))) {
                playNextRandom();

                return;
            }

            const header = playlistContainer.querySelector('h3 a');
            header.innerHTML += ' <span class="ytpa-badge ytpa-random-badge">random <span style="font-size: 2rem; vertical-align: top">&times;</span></span>';
            header.href = 'javascript:none';
            header.querySelector('.ytpa-random-badge').addEventListener('click', event => {
                event.preventDefault();

                localStorage.removeItem(getStorageKey());

                let params = new URLSearchParams(location.search);
                params.delete('ytpa-random');
                window.location.href = `${window.location.pathname}?${params.toString()}`;
            });

            document.addEventListener('keydown', event => {
                if (event.shiftKey && event.key.toLowerCase() === 'n') {
                    event.stopPropagation();
                    event.preventDefault();

                    const videoId = getVideoId(location.href);
                    markWatched(videoId);
                    playNextRandom();
                }
            });

            if (isIntervalSet) {
                return;
            }
            isIntervalSet = true;

            setInterval(() => {
                const videoId = getVideoId(location.href);

                let params = new URLSearchParams(location.search);
                params.set('ytpa-random', '1');
                window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);

                /**
                 * @var {{ getProgressState: () => { current: number, duration, number }, pauseVideo: () => void, isLifaAdPlaying: () => boolean }} player
                 */
                const player = document.querySelector('#movie_player');
                const progressState = player.getProgressState();

                // Do not listen for watch progress when watching advertisements
                if (!player.isLifaAdPlaying()) {
                    if (progressState.current / progressState.duration >= 0.9) {
                        markWatched(videoId);
                    }

                    // Autoplay random video
                    if (progressState.current >= progressState.duration - 2) {
                        // make sure vanilla autoplay doesnt take over
                        player.pauseVideo();
                        playNextRandom();
                    }
                }

                const nextButton = document.querySelector('#ytd-player .ytp-next-button.ytp-button');
                if (nextButton && !nextButton.hasAttribute('ytpa-random')) {
                    nextButton.setAttribute('data-preview', '');
                    nextButton.setAttribute('data-tooltip-text', 'Random');
                    nextButton.setAttribute('ytpa-random', 'applied');
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
})().catch(
    error => console.error(
        '%cYTPA - YouTube Play All\n',
        'color: #bf4bcc; font-size: 32px; font-weight: bold',
        error,
    )
);
