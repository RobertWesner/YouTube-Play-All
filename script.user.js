// ==UserScript==
// @name            YouTube Play All
// @description     Adds the Play-All-Button to the videos, shorts, and live sections of a YouTube-Channel
// @version         20250620-0
// @author          Robert Wesner (https://robert.wesner.io)
// @license         MIT
// @namespace       http://robert.wesner.io/
// @match           https://*.youtube.com/*
// @icon            https://scripts.yt/favicon.ico
// @grant           GM.xmlHttpRequest
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
            user-select: none;
        }
        
        .ytpa-btn, .ytpa-btn > * {
            text-decoration: none;
            cursor: pointer;
        }
        
        .ytpa-btn-sections {
            padding: 0;
        }
        
        .ytpa-btn-sections > .ytpa-btn-section {
            padding: 0.5em;
            display: inline-block;
        }

        .ytpa-btn-sections > .ytpa-btn-section:first-child {
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
        }

        .ytpa-btn-sections > .ytpa-btn-section:nth-last-child(1 of .ytpa-btn-section) {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
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
        
        .ytpa-random-btn > .ytpa-btn-section, .ytpa-random-badge, .ytpa-random-notice, .ytpa-random-popover > * {
            background-color: #2b66da;
            color: white;
        }

        .ytpa-random-btn > .ytpa-btn-section:hover, .ytpa-random-popover > *:hover {
            background-color: #6192ee;
        }
        
        .ytpa-random-popover {
            position: absolute;
            border-radius: 8px;
            font-size: 1.6rem;
            transform: translate(-100%, 0.4em);
        }
        
        .ytpa-random-popover > * {
            display: block;
            text-decoration: none;
            padding: 0.4em;
        }
        
        .ytpa-random-popover > :first-child {
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }
        
        .ytpa-random-popover > :last-child {
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
        }
    
        .ytpa-random-popover > *:not(:last-child) {
            border-bottom: 1px solid #6e8dbb;
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
            margin-right: 12px;
            padding: 0.4em;
        }
        
        body:has(#secondary ytd-playlist-panel-renderer[ytpa-random]) .ytp-prev-button.ytp-button,
        body:has(#secondary ytd-playlist-panel-renderer[ytpa-random]) .ytp-next-button.ytp-button:not([ytpa-random="applied"]) {
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
        
        .ytpa-playlist-emulator {
            margin-bottom: 1.6rem;
            border-radius: 1rem;
        }
        
        .ytpa-playlist-emulator > .title {
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
            font-size: 2rem;
            background-color: #323232;
            color: white;
            padding: 0.8rem;
        }
        
        .ytpa-playlist-emulator > .information {
            font-size: 1rem;
            background-color: #2b2a2a;
            color: white;
            padding: 0.8rem;
        }
        
        .ytpa-playlist-emulator > .footer {
            border-bottom-left-radius: 1rem;
            border-bottom-right-radius: 1rem;
            background-color: #323232;
            padding: 0.8rem;
        }
        
        .ytpa-playlist-emulator > .items {
            max-height: 500px;
            overflow-y: auto;
            overflow-x: hidden;
        }
        
        .ytpa-playlist-emulator:not([data-failed]) > .items:empty::before {
            content: 'Loading playlist...';
            background-color: #626262;
            padding: 0.8rem;
            color: white;
            font-size: 2rem;
            display: block;
        }
        
        .ytpa-playlist-emulator[data-failed="rejected"] > .items:empty::before {
            content: "Make sure to allow the external API call to ytplaylist.robert.wesner.io to keep viewing playlists that YouTube doesn't natively support!";
            background-color: #491818;
            padding: 0.8rem;
            color: #ff7c7c;
            font-size: 1rem;
            display: block;
        }
        
        .ytpa-playlist-emulator > .items > .item {
            background-color: #2c2c2c;
            padding: 0.8rem;
            border: 1px solid #1b1b1b;
            font-size: 1.6rem;
            color: white;
            min-height: 5rem;
            cursor: pointer;
        }
        
        .ytpa-playlist-emulator > .items > .item:hover {
            background-color: #505050;
        }
        
        .ytpa-playlist-emulator > .items > .item:not(:last-of-type) {
            border-bottom: 0;
        }
        
        .ytpa-playlist-emulator > .items > .item[data-current] {
            background-color: #767676;
        }
        
        body:has(.ytpa-playlist-emulator) .ytp-prev-button.ytp-button,
        body:has(.ytpa-playlist-emulator) .ytp-next-button.ytp-button:not([ytpa-emulation="applied"]) {
            display: none !important;
        }
        
        /* hide when sorting by oldest */
        ytm-feed-filter-chip-bar-renderer > div :nth-child(3).selected ~ .ytpa-btn, ytd-feed-filter-chip-bar-renderer iron-selector#chips :nth-child(3).iron-selected ~ .ytpa-btn {
            display: none;
        }
    </style>`);

    const getVideoId = url => new URLSearchParams(new URL(url).search).get('v');

    /**
     * @return {{ getProgressState: () => { current: number, duration, number }, pauseVideo: () => void, seekTo: (number) => void, isLifaAdPlaying: () => boolean }} player
     */
    const getPlayer = () => document.querySelector('#movie_player');

    const isAdPlaying = () => !!document.querySelector('.ad-interrupting');

    const redirect = (v, list, ytpaRandom = null) => {
        if (location.host === 'm.youtube.com') {
            // TODO: Client side routing on mobile
        } else {
            const redirector = document.createElement('a');
            redirector.className = 'yt-simple-endpoint style-scope ytd-playlist-panel-video-renderer';
            redirector.setAttribute('hidden', '');
            redirector.data = {
                'commandMetadata': {
                    'webCommandMetadata': {
                        'url': `/watch?v=${v}&list=${list}${ytpaRandom !== null ? `&ytpa-random=${ytpaRandom}` : ''}`,
                        'webPageType': 'WEB_PAGE_TYPE_WATCH',
                        'rootVe': 3832, // ??? required though
                    }
                },
                'watchEndpoint': {
                    'videoId': v,
                    'playlistId': list,
                }
            };
            document.querySelector('ytd-playlist-panel-renderer #items').append(redirector);
            redirector.click();
        }
    };

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
            parent.insertAdjacentHTML('beforeend', `
                <span class="ytpa-btn ytpa-random-btn ytpa-btn-sections">
                    <a class="ytpa-btn-section" href="/playlist?list=${allPlaylist}${id}&playnext=1&ytpa-random=random&ytpa-random-initial=1">
                        Play Random
                    </a><!--
                    --><span class="ytpa-btn-section ytpa-random-more-options-btn ytpa-hover-popover">
                        &#x25BE
                    </span>
                </span>
            `);

            document.body.insertAdjacentHTML('beforeend', `
                <div class="ytpa-random-popover" hidden="">
                    <a href="/playlist?list=${allPlaylist}${id}&playnext=1&ytpa-random=prefer-newest">
                        Prefer newest
                    </a>
                    <a href="/playlist?list=${allPlaylist}${id}&playnext=1&ytpa-random=prefer-oldest&ytpa-random-initial=1">
                        Prefer oldest
                    </a>
                </div>
            `);

            const randomMoreOptionsBtn = document.querySelector('.ytpa-random-more-options-btn');
            const randomPopover = document.querySelector('.ytpa-random-popover');
            randomMoreOptionsBtn.addEventListener('click', () => {
                const rect = randomMoreOptionsBtn.getBoundingClientRect();
                randomPopover.style.top = rect.bottom.toString() + 'px';
                randomPopover.style.left = rect.right.toString() + 'px';
                randomPopover.removeAttribute('hidden');
            });
            randomPopover.addEventListener('mouseleave', () => {
                randomPopover.setAttribute('hidden', '');
            });
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

        const html = await (await fetch(location.href)).text();
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
    const removeButton = () => document.querySelectorAll('.ytpa-btn').forEach(element => element.remove());

    if (location.host === 'm.youtube.com') {
        // The "yt-navigate-finish" event does not fire on mobile
        // Unfortunately pushState is triggered before the navigation occurs, so a Proxy is useless
        setInterval(addButton, 1000);
    } else {
        window.addEventListener('yt-navigate-start', removeButton);
        window.addEventListener('yt-navigate-finish', addButton);
    }

    // Fallback playlist emulation
    (() => {
        const getItems = playlist => {
            return new Promise(resolve => {
                GM.xmlHttpRequest({
                    method: 'POST',
                    url: 'https://ytplaylist.robert.wesner.io/api/list',
                    data: JSON.stringify({
                        uri: `https://www.youtube.com/playlist?list=${playlist}`,
                        requestType: `YTPA ${GM_info.script.version}`,
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    onload: response => {
                        resolve(JSON.parse(response.responseText));
                    },
                    onerror: error => {
                        document.querySelector('.ytpa-playlist-emulator').setAttribute('data-failed', 'rejected');
                    },
                });
            });
        };

        const processItems = items => {
            const itemsContainer = document.querySelector('.ytpa-playlist-emulator .items');
            const params = new URLSearchParams(window.location.search);
            const list = params.get('list');

            items.forEach(
                /**
                 * @param {{
                 *  position: number,
                 *  title: string,
                 *  videoId: string,
                 * }} item
                 */
                item => {
                    const element = document.createElement('div');
                    element.className = 'item';
                    element.textContent = item.title;
                    element.setAttribute('data-id', item.videoId);
                    element.addEventListener('click', () => redirect(item.videoId, list));

                    itemsContainer.append(element);
                },
            );

            markCurrentItem(params.get('v'));
        };

        const playNextEmulationItem = () => {
            document.querySelector(`.ytpa-playlist-emulator .items .item[data-current] + .item`)?.click();
        };

        const markCurrentItem = videoId => {
            const existing = document.querySelector(`.ytpa-playlist-emulator .items .item[data-current]`);
            if (existing) {
                existing.removeAttribute('data-current');
            }

            const current = document.querySelector(`.ytpa-playlist-emulator .items .item[data-id="${videoId}"]`)
            if (current) {
                current.setAttribute('data-current', '');
                current.parentElement.scrollTop = current.offsetTop - 12 * parseFloat(getComputedStyle(document.documentElement).fontSize);
            }
        };

        const emulatePlaylist = () => {
            if (!window.location.pathname.endsWith('/watch')) {
                return;
            }

            const params = new URLSearchParams(window.location.search);
            const list = params.get('list');
            if (params.has('ytpa-random')) {
                return;
            }

            // prevent playlist emulation on queue
            // its impossible to fetch that playlist externally anyway
            // https://github.com/RobertWesner/YouTube-Play-All/issues/33
            if (list.startsWith('TLPQ')) {
                return;
            }

            // No user ID in the list, cannot be fetched externally -> no emulation
            if (list.length <= 4) {
                return;
            }

            const existingEmulator = document.querySelector('.ytpa-playlist-emulator');
            if (existingEmulator) {
                if (list === existingEmulator.getAttribute('data-list')) {
                    markCurrentItem(params.get('v'));

                    return;
                } else {
                    // necessary to lose all the client side manipulations like SHIFT + N and the play next button
                    window.location.reload(true);
                }
            }

            if (!(new URLSearchParams(window.location.search).has('list'))) {
                return;
            }

            if (!document.querySelector('#secondary-inner > ytd-playlist-panel-renderer#playlist #items:empty')) {
                return;
            }

            const playlistEmulator = document.createElement('div');
            playlistEmulator.className = 'ytpa-playlist-emulator';
            playlistEmulator.innerHTML = `
                <div class="title">
                    Playlist emulator
                </div>
                <div class="information">
                    It looks like YouTube is unable to handle this large playlist.
                    Playlist emulation is a <b>limited</b> fallback feature of YTPA to enable you to watch even more content. <br>
                </div>
                <div class="items"></div>
                <div class="footer"></div>
            `;
            playlistEmulator.setAttribute('data-list', list);
            document.querySelector('#secondary-inner > ytd-playlist-panel-renderer#playlist').insertAdjacentElement('afterend', playlistEmulator);

            getItems(list).then(response => {
                if (response.status === 'running') {
                    setTimeout(() => getItems(list).then(response => processItems(response.items)), 5000);

                    return;
                }

                processItems(response.items);
            });

            const nextButtonInterval = setInterval(() => {
                const nextButton = document.querySelector('#ytd-player .ytp-next-button.ytp-button:not([ytpa-emulation="applied"])');
                if (nextButton) {
                    clearInterval(nextButtonInterval);

                    // Replace with span to prevent anchor click events
                    const newButton = document.createElement('span');
                    newButton.className = nextButton.className;
                    newButton.innerHTML = nextButton.innerHTML;
                    nextButton.replaceWith(newButton);

                    newButton.setAttribute('ytpa-emulation', 'applied');
                    newButton.addEventListener('click', () => playNextEmulationItem());
                }
            }, 1000);

            document.addEventListener('keydown', event => {
                // SHIFT + N
                if (event.shiftKey && event.key.toLowerCase() === 'n') {
                    event.stopImmediatePropagation();
                    event.preventDefault();

                    playNextEmulationItem();
                }
            }, true);

            setInterval(() => {
                const player = getPlayer();
                const progressState = player.getProgressState();

                // Do not listen for watch progress when watching advertisements
                if (!isAdPlaying()) {
                    // Autoplay random video
                    if (progressState.current >= progressState.duration - 2) {
                        // make sure vanilla autoplay doesnt take over
                        player.pauseVideo();
                        player.seekTo(0);
                        playNextEmulationItem();
                    }
                }
            }, 500);
        };

        if (location.host === 'm.youtube.com') {
            // TODO: mobile playlist emulation
        } else {
            window.addEventListener('yt-navigate-finish', () => setTimeout(emulatePlaylist, 1000));
        }
    })();

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

        /**
         * @type {'random'|'prefer-newest'|'prefer-oldest'}
         */
        const ytpaRandom = urlParams.get('ytpa-random');

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

        const playNextRandom = (reload = false) => {
            getPlayer().pauseVideo()

            const videos = Object.entries(getStorage()).filter(([_, watched]) => !watched);
            const params = new URLSearchParams(window.location.search);

            // Either one fifth or at most the 20 newest.
            const preferenceRange = Math.min(Math.min(videos.length * 0.2, 20))

            let videoIndex;
            switch (ytpaRandom) {
                case 'prefer-newest':
                    // Select between latest 20 videos
                    videoIndex = Math.floor(Math.random() * preferenceRange);

                    break;
                case 'prefer-oldest':
                    // Select between oldest 20 videos
                    videoIndex = videos.length - Math.floor(Math.random() * preferenceRange);

                    break;
                default:
                    videoIndex = Math.floor(Math.random() * videos.length);
            }

            if (reload) {
                params.set('v', videos[videoIndex][0]);
                params.set('ytpa-random', ytpaRandom);
                params.delete('t');
                params.delete('index');
                params.delete('ytpa-random-initial');
                window.location.href = `${window.location.pathname}?${params.toString()}`;
            } else {
                // TODO: refactor to the new redirect() function
                const redirector = document.createElement('a');
                redirector.className = 'yt-simple-endpoint style-scope ytd-playlist-panel-video-renderer';
                redirector.setAttribute('hidden', '');
                redirector.data = {
                    'commandMetadata': {
                        'webCommandMetadata': {
                            'url': `/watch?v=${videos[videoIndex][0]}&list=${params.get('list')}&ytpa-random=${ytpaRandom}`,
                            'webPageType': 'WEB_PAGE_TYPE_WATCH',
                            'rootVe': 3832, // ??? required though
                        }
                    },
                    'watchEndpoint': {
                        'videoId': videos[videoIndex][0],
                        'playlistId': params.get('list'),
                    }
                };
                document.querySelector('ytd-playlist-panel-renderer #items').append(redirector);
                redirector.click();
            }
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

                element.href += '&ytpa-random=' + ytpaRandom;
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

            if (urlParams.get('ytpa-random-initial') === '1' || isWatched(getVideoId(location.href))) {
                playNextRandom();

                return;
            }

            const header = playlistContainer.querySelector('h3 a');
            header.innerHTML += ` <span class="ytpa-badge ytpa-random-badge">${ytpaRandom} <span style="font-size: 2rem; vertical-align: top">&times;</span></span>`;
            header.href = 'javascript:none';
            header.querySelector('.ytpa-random-badge').addEventListener('click', event => {
                event.preventDefault();

                localStorage.removeItem(getStorageKey());

                let params = new URLSearchParams(location.search);
                params.delete('ytpa-random');
                window.location.href = `${window.location.pathname}?${params.toString()}`;
            });

            document.addEventListener('keydown', event => {
                // SHIFT + N
                if (event.shiftKey && event.key.toLowerCase() === 'n') {
                    event.stopImmediatePropagation();
                    event.preventDefault();

                    const videoId = getVideoId(location.href);
                    markWatched(videoId);
                    // Unfortunately there is no workaround to YouTube redirecting to the next in line without a reload
                    playNextRandom(true);
                }
            }, true);

            if (isIntervalSet) {
                return;
            }
            isIntervalSet = true;

            setInterval(() => {
                const videoId = getVideoId(location.href);

                let params = new URLSearchParams(location.search);
                params.set('ytpa-random', ytpaRandom);
                window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);

                const player = getPlayer();
                const progressState = player.getProgressState();

                // Do not listen for watch progress when watching advertisements
                if (!isAdPlaying()) {
                    if (progressState.current / progressState.duration >= 0.9) {
                        markWatched(videoId);
                    }

                    // Autoplay random video
                    if (progressState.current >= progressState.duration - 2) {
                        // make sure vanilla autoplay doesnt take over
                        player.pauseVideo();
                        player.seekTo(0);
                        playNextRandom();
                    }
                }

                const nextButton = document.querySelector('#ytd-player .ytp-next-button.ytp-button:not([ytpa-random="applied"])');
                if (nextButton) {
                    // Replace with span to prevent anchor click events
                    const newButton = document.createElement('span');
                    newButton.className = nextButton.className;
                    newButton.innerHTML = nextButton.innerHTML;
                    nextButton.replaceWith(newButton);

                    newButton.setAttribute('ytpa-random', 'applied');
                    newButton.addEventListener('click', event => {
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
