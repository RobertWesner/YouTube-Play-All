// ==UserScript==
// @name            YouTube Play All
// @description     Adds the Play-All-Button to the videos, shorts, and live sections of a YouTube-Channel
// @version         development
// @author          Robert Wesner (https://robert.wesner.io)
// @license         MIT
// @namespace       http://robert.wesner.io/
// @match           https://*.youtube.com/*
// @icon            https://scripts.yt/favicon.ico
// @grant           GM.xmlHttpRequest
// @connect         ytplaylist.robert.wesner.io
// @downloadURL     https://raw.githubusercontent.com/RobertWesner/YouTube-Play-All/main/script.user.js
// @updateURL       https://raw.githubusercontent.com/RobertWesner/YouTube-Play-All/main/script.user.js
// @homepageURL     https://scripts.yt/scripts/ytpa-youtube-play-all-YTPA-Play-All-YouTube-Videos-Of-A-Channel
// @supportURL      https://github.com/RobertWesner/YouTube-Play-All/issues
// ==/UserScript==

// ### SAFETY ###
//
// Using this script will in almost all cases NOT lead to your accounts being suspended
// as it only refers to internal existing YouTube playlists
// and does minor UI/UX changes entirely on the client side.
//
// Keep in mind, this software is provided as is
// and without any guarantees or liability by the author and contributors.
// Refer to the license for more details.
//
// ### PRIVACY ###
//
// 99% of this script is running on your device without any calls to outside of YouTube.
//
// GM.xmlHttpRequest() is only used to retrieve the fallback playlist emulation data in absolute edge cases
// when the playlist exceeds thousands, rather tens of thousands, of items.
//
// The API is open source and hosted by me personally.
//
// GDPR privacy information: https://datenschutz.robertwesner.de/dataprotection
// Source of the API: https://github.com/RobertWesner/youtube-playlist

// TODO: REALLY have to test all of this on mobile, been a while

(G => (async function __ytpa_root_call__(loadModules, loadStyles) {
    'use strict';

    // --- setup ---

    const modules = loadModules();
    Object.entries(modules).forEach(([name, mod]) => {
        if (typeof mod === 'function') {
            // we cant gave compile time errors... because we don't compile
            console.error(`Tell your local dev he "forgot to call the module constructor for ${name}".\nThis script is probably broken now.`);
        }
    });

    const {
        ControlFlow: { _ },
        Fmt,
        HtmlCreation: { $builder, $style },
        Console: console,
        Safety: { handleError, attachSafetyListener, safeTimeout, safeInterval, safeEventListener },
        Versioned,
        Greeter,
        Components,
        ValuesDialogComponent,
        ValuesDialog,
    } = modules;
    attachSafetyListener();

    console.info(`You are using version ${GM.info.script.version} of YTPA!`);
    Greeter.greet({
        time: new Date().toISOString(),
        version: GM.info.script.version,
        userAgent: navigator.userAgentData || navigator.userAgent,
        language: navigator.language,
    });

    const scriptVersion = GM.info.script.version || null;
    if (scriptVersion && /-(alpha|beta|dev|test)$/.test(scriptVersion)) {
        console.info(`Running debug build version ${GM.info.script.version}, watch out for bugs!`);
    }

    Components._init_();
    loadStyles().forEach(([id, css]) => $style(id, css));

    // --- actual code ---

    // TODO: remove/refactor me after testing
    const components = (() => {
        const Component = ValuesDialogComponent;

        return Component
            .collection()
            .set(Component.key('buttonTheme', 'Theme of the "Play All"-button'), Component
                .ofInitial(G.s.ui.button.theme.adaptiveOutline) // TODO: this should be loaded from the soon to come ComponentsStorage
                .asOneOf({
                    [G.s.ui.button.theme.classic]: 'Classic',
                    [G.s.ui.button.theme.adaptive]: 'Adaptive',
                    [G.s.ui.button.theme.adaptiveOutline]: 'Adaptive with outline',
                }),
            )
            // testing things, TODO: remove
            .set(Component.key('dummyText', 'Dummy Text'), Component
                .ofInitial('Hello World!')
                .asText(),
            )
            .set(Component.key('dummyTextarea', 'Dummy Textarea'), Component
                .ofInitial(Fmt.trimIndent(`
A
very
long
thing,
perhaps?
`
                ))
                .asTextarea()
                .withHelp(Fmt.trimIndent( `
                    This is very important!!
                `)),
            )
            .set(Component.key('dummyPassword', 'Dummy Password'), Component
                .ofInitial('')
                .asPassword(),
            )
            .set(Component.key('dummyNumber', 'Dummy Number'), Component
                .ofInitial(0)
                .asNumber(),
            )
            .set(Component.key('dummyToggle', 'Dummy Toggle'), Component
                .ofInitial(false)
                .asToggle()
            )
            .set(Component.key('dummyOneOf', 'Pick your poison'), Component
                .ofInitial(-1)
                .asOneOf({ '0': 'either!', '1': 'or!', '-1': '(none of the above)' }),
            )
            .set(Component.key('dummyAnyOf', 'Ice Cream Flavors'), Component
                .ofInitial(2)
                .asAnyOf({ 'vnll': 'vanilla', 'chclt': 'chocolate', 'strwbrr': 'strawberry', 'bnn': 'banana' }),
            )
        ;
    })();
    unsafeWindow.__debug = () => ValuesDialog.show(components).then(console.log);

    const getVideoId = url => new URLSearchParams(new URL(url).search).get('v');

    /**
     * @return {{ getProgressState: () => { current: number, duration, number }, pauseVideo: () => void, seekTo: (number) => void, isLifaAdPlaying: () => boolean }} player
     */
    const getPlayer = () => document.querySelector('#movie_player');

    const isAdPlaying = () => !!document.querySelector('.ad-interrupting');

    const redirect = (v, list, ytpaRandom = null) => {
        if (location.host === 'm.youtube.com') {
            // TODO: Client side routing on mobile? some day...
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
                    },
                },
                'watchEndpoint': {
                    'videoId': v,
                    'playlistId': list,
                },
            };
            document.querySelector('ytd-playlist-panel-renderer #items').append(redirector);
            redirector.click();
        }
    };

    let id = '';

    // This looks funny, but is currently (2025) the
    // most reliable way to fetch the channelId from within the browser context
    const refreshId = async () => {
        let channelId = '';

        const pass = () => /UC[\w-]+/.test(channelId);

        const tryFetch = async () => {
            try {
                const html = await (await fetch(document.querySelector('#content ytd-rich-item-renderer a')?.href)).text();
                channelId = /var ytInitialData.+?["']channelId["']:["'](UC[\w-]+)["']/.exec(html)?.[1] ?? '';
            } finally {
                // pass
            }
        };

        // try it from the first video/short/stream
        await tryFetch();

        // wait for a bit and try again
        if (!pass()) {
            await new Promise(resolve => {
                safeTimeout(() => {
                    (async () => {
                        await tryFetch();
                        resolve();
                    })();
                }, 1000);
            });
        }

        // unreliable in some cases but better than not trying,
        // getting it from the channel view
        if (!pass()) {
            try {
                const html = await (await fetch(location.href)).text();
                const i = html.indexOf('<link rel="canonical" href="https://www.youtube.com/channel/UC') + 60;
                channelId = html.substring(i, i + 24);
            } finally {
                // pass
            }
        }

        if (!pass()) {
            handleError('Could not determine channelId...');

            return;
        }

        id = channelId.substring(2);
    };

    // 20260802-0 Fixes new YouTube UI not keeping the selected state
    let currentSelection = null;

    const apply = () => {
        const container = document.querySelector('ytm-feed-filter-chip-bar-renderer, ytd-feed-filter-chip-bar-renderer, chip-bar-view-model.ytChipBarViewModelHost');
        let height = 32;
        if (container !== null) {
            const computedStyle = getComputedStyle(container);
            height = container.offsetHeight - parseFloat(computedStyle.paddingTop);
        }
        document.querySelector('#ytpa-height').textContent = `body { --ytpa-height: ${height}px; }`;

        if (id === '') {
            // do not apply prematurely, caused by mutation observer
            return;
        }

        let parent = location.host === 'm.youtube.com'
            // mobile view
            ? document.querySelector('ytm-feed-filter-chip-bar-renderer .chip-bar-contents, ytm-feed-filter-chip-bar-renderer > div')
            // desktop view
            : document.querySelector('ytd-feed-filter-chip-bar-renderer iron-selector#chips, chip-bar-view-model.ytChipBarViewModelHost');

        // 202602 New UI
        if (parent?.tagName?.toLowerCase() === 'chip-bar-view-model') {
            if (currentSelection === null) {
                currentSelection = 1;
            }

            // 20260220-0 See #56
            Versioned.v20260220.getTypeButtons().then(
                elements => elements.forEach((btn, i) => btn.addEventListener('click', () => currentSelection = i + 1)),
            );

            // TODO: refine this into handling "members only"/"popular" for those specific playlists! See documentation
        }

        // #5: add a custom container for buttons if Latest/Popular/Oldest is missing
        if (parent === null) {
            const grid = document.querySelector('ytd-rich-grid-renderer, ytm-rich-grid-renderer, div.ytChipBarViewModelChipWrapper');
            grid.insertAdjacentElement('afterbegin', $builder('div').className('ytpa-button-container').build());
            parent = grid.querySelector('.ytpa-button-container');
        }

        // See: available-lists.md
        const [allPlaylist, popularPlaylist] = window.location.pathname.endsWith('/videos')
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
        if (currentSelection === 2 || parent.querySelector(':nth-child(2).selected, :nth-child(2).iron-selected')) {
            parent.insertAdjacentElement(
                'beforeend',
                $builder(`a.ytpa-btn.ytpa-play-all-btn[role="button"]`)
                    .href(`/playlist?list=${popularPlaylist}${id}&playnext=1`)
                    .onBuildText('Play Popular')
                    .build(),
            );
        } else if (currentSelection === 1 || parent.querySelector(':nth-child(1).selected, :nth-child(1).iron-selected') || parent.classList.contains('ytpa-button-container')) {
            parent.insertAdjacentElement(
                'beforeend',
                $builder('a.ytpa-btn.ytpa-play-all-btn[role="button]')
                    .href(`/playlist?list=${allPlaylist}${id}&playnext=1`)
                    .onBuildText('Play All')
                    .build(),
            );
        } else {
            parent.insertAdjacentElement(
                'beforeend',
                $builder('a.ytpa-btn.ytpa-play-all-btn.ytpa-unsupported[role="button"][target="_blank"][rel="norefferer"]')
                    .href(`https://github.com/RobertWesner/YouTube-Play-All/issues/39`)
                    .onBuildText('No Playlist Found')
                    .build(),
            );
        }

        if (location.host === 'm.youtube.com') {
            // YouTube returns an "invalid response" when using client side routing for playnext=1 on mobile
            document.querySelectorAll('.ytpa-btn').forEach(btn => safeEventListener(btn, 'click', event => {
                event.preventDefault();

                window.location.href = btn.href;
            }));
        } else {
            // Only allow random play in desktop version for now
            parent.insertAdjacentElement(
                'beforeend',
                $builder('span.ytpa-btn.ytpa-random-btn.ytpa-btn-sections')
                    .onBuildAppend(
                        $builder('a.ytpa-btn-section[role="button"]')
                            .href(`/playlist?list=${allPlaylist}${id}&playnext=1&ytpa-random=random&ytpa-random-initial=1`)
                            .onBuildText('Play Random')
                            .build(),
                        $builder('span')
                            .className('ytpa-btn-section ytpa-random-more-options-btn ytpa-hover-popover')
                            .role('button')
                            .tabindex('0')
                            .aria_label('More options for random play')
                            .aria_haspopup('menu')
                            .aria_expanded('false')
                            .onBuildText('▾')
                            .build(),
                        $builder('span.ytpa-random-btn-tab-fix')
                            .tabindex('-1')
                            .aria_hidden('true')
                            .onBuildText('▾')
                            .build(),
                    )
                    .build(),
            );

            document.body.insertAdjacentElement(
                'afterbegin',
                $builder('div')
                    .className('ytpa-random-popover')
                    .role('menu')
                    .aria_label('Random play options')
                    .hidden('')
                    .onBuildAppend(
                        $builder('a[role="menuitem"]')
                            .href(`/playlist?list=${allPlaylist}${id}&playnext=1&ytpa-random=prefer-newest`)
                            .aria_label('Play Random prefer newest')
                            .onBuildText('Prefer newest')
                            .build(),
                        $builder('a[role="menuitem"]')
                            .href(`/playlist?list=${allPlaylist}${id}&playnext=1&ytpa-random=prefer-oldest&ytpa-random-initial=1`)
                            .aria_label('Play Random prefer oldest')
                            .onBuildText('Prefer oldest')
                            .build(),
                    )
                    .build(),
            );

            const randomMoreOptionsBtn = document.querySelector('.ytpa-random-more-options-btn');
            const randomPopover = document.querySelector('.ytpa-random-popover');

            const showPopover = () => {
                const rect = randomMoreOptionsBtn.getBoundingClientRect();
                randomPopover.style.top = rect.bottom.toString() + 'px';
                randomPopover.style.left = rect.right.toString() + 'px';
                randomPopover.removeAttribute('hidden');
                randomPopover.querySelector('a').focus();
                randomMoreOptionsBtn.setAttribute('aria-expanded', 'true');
            };
            const hidePopover = () => {
                randomPopover.setAttribute('hidden', '');
                randomMoreOptionsBtn.setAttribute('aria-expanded', 'false');
                document.querySelector('.ytpa-random-btn-tab-fix').focus();
            };

            safeEventListener(randomMoreOptionsBtn, 'click', showPopover);
            safeEventListener(randomMoreOptionsBtn, 'keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    showPopover();
                }
            });
            safeEventListener(randomPopover, 'mouseleave', hidePopover);
            safeEventListener(randomPopover.querySelector('a:last-of-type'), 'focusout', hidePopover);
        }
    };

    const observer = new MutationObserver(() => {
        // [20250929-0] removeButton first and then apply, not addButton, since we don't need the pathname validation, and we want mobile to also use it
        removeButton();
        apply();
    });

    const addButton = async () => {
        observer.disconnect();

        if (!(window.location.pathname.endsWith('/videos') || window.location.pathname.endsWith('/shorts') || window.location.pathname.endsWith('/streams'))) {
            return;
        }

        // This needs to be this early in the process as otherwise it may use old ids from other channels
        await refreshId();

        currentSelection = null;

        // Regenerate button if switched between Latest and Popular
        if (location.host === 'm.youtube.com') {
            // Mobile needs custom click listeners as mutation observers proved to be unreliable in that UI.
            Array.from(document.querySelectorAll('ytm-feed-filter-chip-bar-renderer ytm-chip-cloud-chip-renderer'))
                .filter(element => !element.hasAttribute('data-ytpa-click-listener-attached'))
                .forEach(
                    element => {
                        element.setAttribute('data-ytpa-click-listener-attached', '');
                        element.addEventListener('click', () => {
                            removeButton();
                            apply();
                        });
                    },
                );
        } else {
            const element = document.querySelector('ytd-browse:not([hidden]) ytd-rich-grid-renderer');
            if (element) {
                observer.observe(element, {
                    attributes: true,
                    childList: false,
                    subtree: false,
                });
            }
        }

        // This check is necessary for the mobile Interval
        if (document.querySelector('.ytpa-play-all-btn')) {
            return;
        }

        // Initially generate button
        apply();
    };

    // Removing the button prevents it from still existing when switching between "Videos", "Shorts", and "Live"
    // This is necessary due to the mobile Interval requiring a check for an already existing button
    const removeButton = () => document.querySelectorAll('.ytpa-btn').forEach(element => element.remove());

    if (location.host === 'm.youtube.com') {
        // The "yt-navigate-finish" event does not fire on mobile
        // Unfortunately pushState is triggered before the navigation occurs, so a Proxy is useless
        safeInterval(addButton, 1000);
    } else {
        safeEventListener(window, 'yt-navigate-start', removeButton);
        safeEventListener(window, 'yt-navigate-finish', addButton);
    }

    // Fallback playlist emulation
    (() => {
        const getItems = playlist => {
            return new Promise(resolve => {
                // Request is only used to fetch the full playlist contents from the YouTube Data API.
                // See comment at the start of the script.
                GM.xmlHttpRequest({
                    method: 'POST',
                    url: 'https://ytplaylist.robert.wesner.io/api/list',
                    data: JSON.stringify({
                        uri: `https://www.youtube.com/playlist?list=${playlist}`,
                        requestType: `YTPA ${GM.info.script.version}`,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
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
                    safeEventListener(element, 'click', () => redirect(item.videoId, list));

                    itemsContainer.append(element);
                },
            );

            markCurrentItem(params.get('v'));
        };

        const playNextEmulationItem = () => {
            // prevent the bug that occurs when clicking on the channel from playlist emulation
            // and then navigating to videos whilst mini-player is still open
            if (window.location.pathname !== '/watch') {
                return;
            }

            document.querySelector(`.ytpa-playlist-emulator .items .item[data-current] + .item`)?.click();
        };

        const markCurrentItem = videoId => {
            const existing = document.querySelector(`.ytpa-playlist-emulator .items .item[data-current]`);
            if (existing) {
                existing.removeAttribute('data-current');
            }

            const current = document.querySelector(`.ytpa-playlist-emulator .items .item[data-id="${videoId}"]`);
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
            if (!params.has('list') || params.has('ytpa-random')) {
                return;
            }

            const list = params.get('list');

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

            document.querySelector('#secondary-inner > ytd-playlist-panel-renderer#playlist')
                .insertAdjacentElement(
                    'afterend',
                    $builder('div')
                        .className('ytpa-playlist-emulator')
                        .data_list(list)
                        .onBuildAppend(
                            $builder('div')
                                .className('title')
                                .onBuildText('Playlist emulator')
                                .build(),
                            $builder('div.information').onBuildText(Fmt.trimIndent(`
                                It looks like YouTube is unable to handle this large playlist.
                                Playlist emulation is a limited fallback feature of YTPA to enable you to watch even more content.
                            `)).build(),
                            $builder('div.items').build(),
                            $builder('footer.footer').build(),
                        )
                        .build(),
                );

            getItems(list).then(response => {
                if (response.status === 'running') {
                    safeTimeout(() => getItems(list).then(response => processItems(response.items)), 5000);

                    return;
                }

                processItems(response.items);
            });

            const nextButtonInterval = safeInterval(() => {
                const nextButton = document.querySelector('#ytd-player .ytp-next-button.ytp-button:not([ytpa-emulation="applied"])');
                if (nextButton) {
                    clearInterval(nextButtonInterval);

                    // Replace with span to prevent anchor click events
                    const newButton = nextButton.cloneNode(true);
                    newButton.href = 'javascript:void(0)';
                    nextButton.replaceWith(newButton);

                    newButton.setAttribute('ytpa-emulation', 'applied');
                    safeEventListener(newButton, 'click', () => playNextEmulationItem());
                }
            }, 1000);

            // TODO: this does not look like it is called on the new UI,
            //       the new UI seems to preserves the GET-parameter on its own.
            safeEventListener(document.body, 'keydown', event => {
                // SHIFT + N
                if (event.shiftKey && event.key.toLowerCase() === 'n') {
                    event.stopImmediatePropagation();
                    event.preventDefault();

                    playNextEmulationItem();
                }
            }, true);

            safeInterval(() => {
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
            safeEventListener(window, 'yt-navigate-finish', () => safeTimeout(emulatePlaylist, 1000));
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
            localStorage.setItem(getStorageKey(), JSON.stringify({ ...getStorage(), [videoId]: true }));
            document.querySelectorAll(`#wc-endpoint[href*="${videoId}"]`).forEach(
                element => element.parentElement.setAttribute('hidden', ''),
            );
        };

        // Storage needs to now be { [videoId]: bool }
        try {
            if (Array.isArray(getStorage())) {
                localStorage.removeItem(getStorageKey());
            }
        } catch {
            localStorage.removeItem(getStorageKey());
        }

        const playNextRandom = (reload = false) => {
            // prevent the bug that occurs when clicking on the channel from random play
            // and then navigating to videos whilst mini-player is still open
            if (window.location.pathname !== '/watch') {
                return;
            }

            getPlayer().pauseVideo();

            const videos = Object.entries(getStorage()).filter(([_, watched]) => !watched);
            const params = new URLSearchParams(window.location.search);

            // Either one fifth or at most the 20 newest.
            const preferenceRange = Math.max(1, Math.min(Math.min(videos.length * 0.2, 20)));

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
                        },
                    },
                    'watchEndpoint': {
                        'videoId': videos[videoIndex][0],
                        'playlistId': params.get('list'),
                    },
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

            const playlistContainer = document.querySelector('#secondary ytd-playlist-panel-renderer, #below ytd-playlist-panel-renderer ');
            if (playlistContainer === null) {
                return;
            }
            if (playlistContainer.hasAttribute('ytpa-random')) {
                return;
            }

            playlistContainer.setAttribute('ytpa-random', 'applied');
            playlistContainer.insertAdjacentElement(
                'afterbegin',
                $builder('div.ytpa-random-notice').onBuildAppend(
                    'This playlist is using random play.',
                    $builder('br').build(),
                    'The videos will ',
                    $builder('strong').onBuildText('not play in the order').build(),
                    ' listed here.',
                ).build(),
            );

            const storage = getStorage();

            // ensure all the links are "corrected" to random play
            const playlistElementsInterval = safeInterval(() => {
                const elements = playlistContainer.querySelectorAll('a#wc-endpoint:not([href*="&ytpa-random="])');
                if (elements.length === 0) {
                    clearInterval(playlistElementsInterval);

                    return;
                }

                elements.forEach(element => {
                    const videoId = (new URLSearchParams(new URL(element.href).searchParams)).get('v');
                    if (!isWatched(videoId)) {
                        storage[videoId] = false;
                    }

                    element.href += '&ytpa-random=' + ytpaRandom;
                    // This bypasses the client side routing
                    safeEventListener(element, 'click', event => {
                        event.preventDefault();

                        window.location.href = element.href;
                    });

                    const entryKey = getVideoId(element.href);
                    if (isWatched(entryKey)) {
                        element.parentElement.setAttribute('hidden', '');
                    }
                });
            }, 1000);
            localStorage.setItem(getStorageKey(), JSON.stringify(storage));

            if (urlParams.get('ytpa-random-initial') === '1' || isWatched(getVideoId(location.href))) {
                playNextRandom();

                return;
            }

            safeEventListener(document, 'keydown', event => {
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

            safeInterval(() => {
                const videoId = getVideoId(location.href);

                const params = new URLSearchParams(location.search);
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
                    if (progressState.current >= progressState.duration - 3) {
                        // make sure vanilla autoplay doesn't take over
                        player.pauseVideo();
                        player.seekTo(0);
                        playNextRandom();
                    }
                }

                const nextButton = document.querySelector('#ytd-player .ytp-next-button.ytp-button:not([ytpa-random="applied"])');
                if (nextButton) {
                    // Replace with span to prevent anchor click events
                    const newButton = nextButton.cloneNode(true);
                    newButton.href = 'javascript:void(0)';
                    nextButton.replaceWith(newButton);

                    newButton.setAttribute('ytpa-random', 'applied');
                    safeEventListener(newButton, 'click', event => {
                        markWatched(videoId);
                        playNextRandom();
                    });
                }
            }, 500);
        };

        safeInterval(applyRandomPlay, 1000);
    })();
})(() => {
    // --- Modules, aka. the big refactor, aka. I spent too much time with Purescript ---

    // This might look absolutely insane, and I agree.
    // But it is the best way to go "enterprise userscript", while keeping it single file.
    // Let's all admit already, this thing is not your average userscript!

    // The best part? Jetbrains-IDEs are smart enough to resolve all of this.

    const Id = (() => {
        const newUuid = () => crypto.randomUUID();

        const namespace = ns => {
            const newHtmlId = () => `ytpa-${ns}-${newUuid()}`;

            return {
                newHtmlId,
            };
        };

        return {
            newUuid,
            namespace,
            default: namespace('default'),
        };
    })();

    const ControlFlow = (() => {
        /**
         * The universal sink.
         * There is nothing it doesn't tolerate!
         *
         * _.x(1)[_ - 10]({ _ })[_._] = '???';
         *
         * If anyone ever, anywhere, needs this, feel free to use, it's MIT.
         * Keep the jsdoc if possible to avoid needing an separate license file.
         *
         * MIT License — Copyright (c) 2026 Robert Wesner
         *
         * Permission is hereby granted, free of charge, to any person obtaining a copy
         * of this software and associated documentation files (the "Software"), to deal
         * in the Software without restriction, including without limitation the rights
         * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
         * copies of the Software, and to permit persons to whom the Software is
         * furnished to do so, subject to the following condition:
         * The above copyright notice and this permission notice shall be included in
         * all copies or substantial portions of the Software.
         * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
         *
         * Godspeed.
         *
         * @type {any}
         *
         * @license MIT
         * @author Robert Wesner
         * @since 2026-02-20 22:20:13
         */
        const _ = new Proxy(() => {}, {
            apply: () => _,
            construct: () => _,
            set: () => true,
            get(target, prop) {
                return {
                    [Symbol.toPrimitive]: () => '',
                    'toString': () => '',
                    'valueOf': () => 0,
                    'then': undefined,
                }[prop] ?? _;
            },
        });

        try {
            // I thought I actually "needed" (= wanted) it to avoid multiple () => {}
            // Then I let it escalate slightly...
            // Until I realized I didn't need the () => {} anymore.
            // My Go & Purescript brain just really wanted that!
            // Anyhow, now its officially part of my own little stdlib.
            // UPDATE: It was very useful indeed.
            (() => _.x(1)[_ - 10]({ _ })[_._])(_)._ = _._('???')._._._._['_'];
        } catch (e) {
            console.error('The hole has failed us.', e);
        }

        const pass = x => x;

        return { _, pass };
    })();

    const Fmt = (() => {
        const trimIndent = string => {
            const lines = string.replace(/^\n/, '').split('\n');

            const indent= Math.min(
                ...lines
                    .filter(line => line.trim())
                    .map(line => line.match(/^(\s*)/)[1].length),
            );

            return lines.map(line => line.slice(indent)).join('\n');
        };

        const ucfirst = text => {
            return String(text).charAt(0).toUpperCase() + String(text).slice(1);
        };

        return { trimIndent, ucfirst };
    })();

    const HtmlCreation = (() => {
        /**
         * Safely dynamically create HTML-Elements.
         *
         * Creates actual DOM Elements, not plain HTML.
         *
         * Example:
         *  $builder('div')
         *      .id('foo')
         *      .className('a b c')
         *      .onBuildText('<b>Test</b>')
         *      .build()
         *
         * Result:
         *  ```
         *  <div id="foo" class="a b c">
         *      &lt;b&gt;Test&lt;/b&gt;
         *  </div>;
         *  ```
         *
         * @return WrappedElementBuilder
         */
        const $builder = query => {
            /**
             * @param {HTMLElement} element
             * @return {HTMLElement&WrappedElementBuilder}
             */
            const proxy = element => {
                let postBuildOperations = [];
                const instance = new Proxy(element, {
                    get(target, prop, _) {
                        const P = operation => (...xs) => {
                            operation(...xs);

                            return instance;
                        };
                        const PBO = operation => P((...xs) => postBuildOperations.push(() => operation(...xs)));

                        switch (prop) {
                            case 'build':
                                return () => {
                                    postBuildOperations.forEach(operation => operation(element));
                                    postBuildOperations = [];

                                    return element;
                                }
                            case 'addClass':
                                return P(x => element.classList.add(x));
                            case 'onBuild':
                                return P(x => postBuildOperations.push(x));
                            case 'onBuildAppend':
                                return PBO((...xs) => element.append(...xs));
                            case 'onBuildText':
                                return PBO(x => element.textContent = x);
                            case 'on':
                                return P((event, handler) => element.addEventListener(event, handler));
                        }

                        const alwaysUseAttributes = ['hidden', 'style'];

                        return value => {
                            if (!alwaysUseAttributes.includes(prop) && prop in element) {
                                element[prop] = value;
                            } else {
                                element.setAttribute(prop.replaceAll('_', '-'), value);
                            }

                            return instance;
                        };
                    },
                });

                return instance;
            };

            /**
             * Does NOT call build().
             * Instead returns a builder instance!
             *
             * Example:
             *  parseQuery(`button#foo.a.b.c[aria-label="${label}"]`)
             *
             * Result:
             *  $builder('button')
             *      .id('foo')
             *      .className('a b c')
             *      .aria_label(`${label}`)
             *
             * @param query
             * @return {any|HTMLElement}
             */
            const parseQuery = query => {
                const match = query.match(/^[a-zA-Z0-9-]+/);
                if (!match) {
                    throw 'Invalid tag supplied to parseQuery.';
                }
                const tag = match[0];

                const builder = proxy(document.createElement(tag));
                if (!query.match(/^[a-zA-Z0-9-]+$/)) {
                    const split = text => text.match(/^[a-zA-Z0-9-]+((?:[#.][a-zA-Z0-9-]+)+)?((?:\[[a-zA-Z0-9-]+(?:=".*?")?])+)?/);

                    const result = split(query);
                    const basic = result[1] ?? '';
                    const attributes = result[2] ?? '';

                    basic.matchAll(/([#.])([a-zA-Z0-9-]+)/g).forEach(([ignore, type, value]) => {
                        ({
                            '#': builder.id,
                            '.': builder.addClass,
                        })[type](value);
                    });

                    attributes.matchAll(/\[([a-zA-Z0-9-]+)(?:="(.*?)")?]/g).forEach(([ignore, key, value]) => {
                        builder[key](value);
                    });
                }

                return builder;
            };

            return parseQuery(query);
        };

        const $style = (id, style) => {
            return document.head.insertAdjacentElement(
                'beforeend',
                $builder(`style#${id}`)
                    .onBuild(element => element.textContent = style)
                    .build(),
            );
        };

        return { $builder, $style };
    })();

    const Console = (() => {
        const templates = {
            default: [
                '%cYTPA - YouTube Play All%c\n',
                'color: #bf4bcc; font-size: 26px; font-weight: bold',
                '',
            ],
            debug: [
                '%cDEBUG%c\n',
                'color: #1aff00; font-size: 48px; font-weight: bold',
                '',
            ],
        };

        const createLogger = (fn, template) => (...messages) => {
            if (typeof messages[0] === "string") {
                fn(template[0] + messages[0], ...template.slice(1), ...messages.slice(1));
            } else {
                fn(...template, ...messages);
            }
        };

        return {
            info: createLogger(console.info, templates.default),
            error: createLogger(console.error, templates.default),
            log: createLogger(console.debug, templates.debug),
        };
    })();

    const Safety = (() => {
        const console = Console;

        const handleError = e => console.error(e);
        const attachSafetyListener = () => {
            window.addEventListener('unhandledrejection', event => {
                const e = event.reason || event;
                const stack = (e && e.stack) || '';

                if (!stack || !stack.includes('__ytpa_root_call__')) {
                    return;
                }

                handleError(e);
            });
        };

        const safeWrapCall = fn => ((...args) => {
            try {
                let result = fn(...args);
                if (result instanceof Promise) {
                    result = result.catch(handleError);
                }

                return result;
            } catch (e) {
                handleError(e);
            }
        });

        const safeTimeout = (fn, duration) => setTimeout(safeWrapCall(fn), duration);
        const safeInterval = (fn, duration) => setInterval(safeWrapCall(fn), duration);
        const safeEventListener = (node, event, fn) => node.addEventListener(event, safeWrapCall(fn));

        return {
            handleError,
            attachSafetyListener,
            safeTimeout,
            safeInterval,
            safeEventListener,
        };
    })();

    const AsyncOperations = (() => {
        const waitForElement = async (selector, { root = document } = {}) => new Promise(resolve => {
            const select = () => root.querySelector(selector), existing = select();
            if (existing) return resolve(existing);

            const observer = new MutationObserver(() => {
                const existing = select();
                if (existing) {
                    observer.disconnect();
                    resolve(existing);
                }
            });

            observer.observe(root, { childList: true, subtree: true });
        });

        return { waitForElement };
    })();

    const Versioned = (() => {
        const { waitForElement } = AsyncOperations;

        const v20260220 = {
            /**
             * Latest / Popular / Oldest
             *
             * Compatible with the new members-only UI.
             */
            getTypeButtons: async () => new Promise((resolve) => {
                const dropdownButton = document.querySelector('chip-bar-view-model.ytChipBarViewModelHost div.ytChipBarViewModelChipWrapper:has(.ytIconWrapperHost.ytChipShapeIconEnd)');
                if (dropdownButton) {
                    dropdownButton.addEventListener('click', () => {
                        waitForElement('tp-yt-iron-dropdown.style-scope.ytd-popup-container:not([hidden], [style*="display: none"]) yt-sheet-view-model')
                            .then(element => resolve(element.querySelectorAll('yt-list-item-view-model')))
                    });
                } else {
                    resolve(document.querySelectorAll('chip-bar-view-model.ytChipBarViewModelHost div.ytChipBarViewModelChipWrapper'));
                }
            }),
        };

        return { v20260220 };
    })();

    const Greeter = (() => {
        const console = Console;

        const style = x => 'font-family: sans-serif; font-size: 16px;' + x;
        const greet = debugObject => console.info(
            Fmt.trimIndent(`
                %cHi there!
                Thank you for using YTPA.
                
                Please report problems at:
                %chttps://rwe.ms/ytpa-issues%c
                
                If you have a free minute, consider answering a few non-intrusive questions:
                %chttps://rwe.ms/ytpa-feedback%c
                
                If anything breaks, make sure to attach this to your issue:
            `) + '%c' + JSON.stringify(debugObject, null, 2),
            style(),
            style('color: aqua'),
            style(),
            style('color: aqua'),
            style(),
            'color: #11ff00',
        );

        return { greet };
    })();

    const Dialog = (() => {
        const { $builder } = HtmlCreation;

        const newDialog = () => {
            /**
             * @var {HTMLDivElement}
             */
            const title = $builder('div.ytpa-dialog-title[role="heading"]').build();
            /**
             * @var {HTMLDivElement}
             */
            const body = $builder('div.ytpa-dialog-body').build();

            const build = () => $builder('dialog.ytpa-dialog').onBuildAppend(
                    $builder('div.ytpa-dialog-head').onBuildAppend(
                        title,
                        $builder('form[method="dialog"]').onBuildAppend(
                            $builder('button').className('ytpa-dialog-close-btn').onBuild(
                                button => button.textContent = '×',
                            ).build(),
                        ).build(),
                    ).build(),
                    body,
                ).build();
            /**
             * @var {HTMLDialogElement}
             */
            const element = build();
            document.querySelector('ytd-app').insertAdjacentElement('beforeend', element);

            return {
                _valid: true,
                title,
                body,
                element,
                ensureValid() {
                    if (!this._valid) throw 'One shall not re-use a removed dialog!';
                },
                setTitle(text) {
                    this.title.textContent = text;
                },
                setContent(...elements) {
                    this.body.textContent = '';
                    this.body.append(...elements);

                    return this;
                },
                show() {
                    this.ensureValid();
                    this.element.showModal();

                    return this;
                },
                hide() {
                    this.ensureValid();
                    this.element.close();

                    return this;
                },
                remove() {
                    this.element.remove();
                    this._valid = false;
                },
                // the fancy stuff
                async done() {
                    return new Promise(resolve => {
                        // listener first to mitigate data race
                        this.element.addEventListener('close', () => resolve());
                        if (!this.element.open) {
                            resolve();
                        }
                    })
                },
                /**
                 * @param {string} title
                 * @param {(push: (HTMLElement) => HTMLElement) => {}} run
                 * @return {Promise}
                 */
                async with(title, run) {
                    return new Promise(resolve => {
                        /** @var {HTMLElement[]} */
                        const elements = [];
                        const push = element => {
                            elements.push(element);

                            return element;
                        };

                        run(push);
                        this.setTitle(title)
                        this.setContent(...elements);
                        this.show();
                        this.done().then(() => {
                            this.hide();
                            resolve();
                        });
                    });
                },
            };
        }

        return { newDialog };
    })();

    const Components = (() => {
        const uiComponentsSlug = 'ytpa-ui-setting';

        /**
         * @param {() => string[]} pull
         * @param {([]) => void} push
         */
        const settingOf = (pull, push) => ({
            list: pull,
            has: x => pull().includes(x),
            add: (...x) => {
                const settings = pull();
                x.forEach(y => settings.includes(y) || settings.push(y));
                push(settings);
            },
            remove: x => {
                const settings = pull();
                const index = settings.indexOf(x);
                if (index <= -1) return;

                settings.splice(index, 1);
                push(settings);
            },
        });

        const settings = {
            ui: settingOf(
                () => document.documentElement.getAttribute(uiComponentsSlug)?.split(' ') ?? [],
                raw => document.documentElement.setAttribute(uiComponentsSlug, raw.join(' ')),
            ),
        };

        const _init_ = () => Object.keys(G.s).forEach(key => settings[key].add(...G.defaults[key]));

        return {...settings, _init_};
    })();

    const ValuesDialogComponent = (() => {
        const { _, pass } = ControlFlow;

        const getDefaultHooks = () => [hookHelp];

        const base = x => ({
            of: x,
            value: null,
            initial: undefined,
            hooked: {},
        });

        // no one can stop me from currying
        const W = key => x => [key, addition => ({
            ...x,
            hooked: { ...x.hooked, [key]: addition },
        })];
        const hookTest = W('test');
        const hookHelp = W('help');

        const S = (marker, hooks = []) => (x = null) => {
            const result = { ...base(x), m: marker};
            [...getDefaultHooks(), ...hooks].forEach(hook => {
                const [key, w] = hook(result);
                result[`with${Fmt.ucfirst(key)}`] = w;
            });

            return result;
        };

        // asX returns a terminal object (no further DSL chaining)
        const DSL = {
            /** @var {_Component_Dsl<ComponentDummy, []>} */
            asDummy: S({ dummy: _ }, [hookTest]),
            /** @var {_Component_Dsl<ComponentText, []>} */
            asText: S({ text: _ }),
            /** @var {_Component_Dsl<ComponentTextarea, []>} */
            asTextarea: S({ textarea: _ }),
            /** @var {_Component_Dsl<ComponentPassword, []>} */
            asPassword: S({ password: _ }),
            /** @var {_Component_Dsl<ComponentNumber, []>} */
            asNumber: S({ number: _ }),
            /** @var {_Component_Dsl<ComponentToggle, []>} */
            asToggle: S({ toggle: _ }),
            /** @var {_Component_Dsl<ComponentOneOf, [_Component_Dsl_Param_ArrayObject]>} */
            asOneOf: S({ oneOf: _ }),
            /** @var {_Component_Dsl<ComponentAnyOf, [_Component_Dsl_Param_ArrayObject]>} */
            asAnyOf: S({ anyOf: _ }),
        };

        const ofInitial = x => {
            const result = Object.create(DSL)
            result.initial = x;

            return result;
        };

        const collection = () => {
            const map = new Map();

            const obj = { map };
            obj.set = (k, v) => {
                map.set(k, v);

                return obj;
            };

            return obj;
        };

        const key = (name, displayText) => ({ name, displayText });

        return {
            ofInitial,
            collection,
            key,
        };
    })();

    const ValuesDialog = (() => {
        const { _ } = ControlFlow;
        const { $builder } = HtmlCreation;
        const { newDialog } = Dialog;

        const ns = 'settings-component';
        const baseClassName = `ytpa-${ns}`;
        const IdNamespace = Id.namespace(ns);

        /**
         * @param {ValueDialogComponents} components
         * @return {HTMLElement[]}
         */
        const createElements = components => components.map.entries().toArray().map(
            /**
             * @param {string} name
             * @param {string} displayText
             * @param {ComponentT} component
             * @param i
             * @return {HTMLElement}
             */
            ([{ name, displayText }, component], i) => $builder(`div.${baseClassName}-container`).onBuild(
                container => {
                    const id = IdNamespace.newHtmlId();
                    const helpId = `${id}-help`;

                    // Purescript brain demands this
                    const init = element => component.initial !== undefined && (
                        component.m.toggle
                            ? (element.checked = !!component.initial)
                            : (element.value = component.initial)
                    );
                    const $b = tag => $builder(tag).className(baseClassName);
                    const build = builder => builder
                        .id(id)
                        .name(name)
                        .data_index(i.toString())
                        .onBuild(init)
                        .build();

                    const has = x => x !== undefined;

                    /** @var {HTMLElement|boolean} */
                    let result = !_
                        || (has(component.m.dummy) && build($b('div').onBuildText('Click me!').on(
                            'click',
                            (event) => event.target.append(component.hooked.test),
                        )))
                        || (has(component.m.text) && build($b('input[type="text"]').on(
                            'input',
                            (event) => component.value = event.target.value,
                        )))
                        || (has(component.m.textarea) && build($b('textarea').on(
                            'input',
                            (event) => component.value = event.target.value,
                        )))
                        || (has(component.m.password) && build($b('input[type="password"]').on(
                            'input',
                            (event) => component.value = event.target.value,
                        )))
                        || (has(component.m.number) && build($b('input[type="number"]').on(
                            'input',
                            (event) => component.value = event.target.value,
                        )))
                        // TODO: finish with radios and checkboxes
                        || (has(component.m.oneOf) && build($b('select')
                            .onBuildAppend(
                                ...Object.entries(component.of).map(
                                    ([k, v]) => {
                                        const option = $builder('option')
                                            .value(k)
                                            .onBuildText(v);
                                        if (k === component.initial) {
                                            option.selected('');
                                        }

                                        return option.build();
                                    }
                                ),
                            )
                        ))
                        || (has(component.m.anyOf) && build($builder('div')
                            .id(id)
                            .name(name)
                            .className(`${baseClassName}-WIP`)
                            .onBuildText('UNIMPLEMENTED')
                            .data_index(i.toString())
                        ));

                    if (typeof result === 'object') {
                        // wrap the stuff into a div with label
                        result = $builder('div').onBuildAppend(
                            $builder('label').for(id).onBuildText(displayText).build(),
                            result,
                        ).build();
                    } else if (has(component.m.toggle)) {
                        // checkboxes are built more custom
                        result = build(
                            $builder('label')
                                .id(id)
                                .name(name)
                                .className(baseClassName)
                                .onBuildAppend(
                                    build($builder('input').type('checkbox')),
                                    displayText,
                                )
                                .on(
                                    'change',
                                    (event) => component.value = event.target.checked,
                                )
                                .data_index(i.toString())
                        );
                    }

                    if (typeof result === 'boolean') {
                        throw 'Could not build ValuesDialog component.';
                    }

                    container.append(result);
                    if (has(component.hooked.help)) {
                        container.append(
                            $builder(`div`)
                                .id(helpId)
                                .className(`${baseClassName}-help`)
                                .onBuildText(component.hooked.help)
                                .build(),
                        );
                        result.setAttribute('aria-describedby', helpId);
                    }
                },
            ).build(),
        );

        /**
         * @param {ValueDialogComponents} components
         * @return {Promise<{ [key: string]: any }>}
         */
        const show = async (components) => newDialog()
            .with('YTPA Components', push => {
                createElements(components).forEach(push);
            })
            .then(() => Object.fromEntries(
                components.map.entries().map(([k, v]) => [k.name, v.value]),
            ));

        return { show };
    })();

    return {
        Id,
        ControlFlow,
        Fmt,
        HtmlCreation,
        Console,
        Safety,
        AsyncOperations,
        Versioned,
        Greeter,
        Dialog,
        Components,
        ValuesDialogComponent,
        ValuesDialog,
    };
}, () => [
    ['ytpa-height', ''],
    ['ytpa-base', /* language=css */ `
        html {
            /* Keep these in mind for UI theming */
            --ytpa-bg-base: var(--yt-spec-base-background);
            --ytpa-bg-raised: var(--yt-spec-raised-background);
            --ytpa-bg-menu: var(--yt-spec-menu-background);
            --ytpa-bg-additive: var(--yt-spec-additive-background);
            --ytpa-bg-additive-inverse: var(--yt-spec-additive-background-inverse);
            --ytpa-fg-primary: var(--yt-spec-text-primary);
            --ytpa-fg-secondary: var(--yt-spec-text-secondary);
            --ytpa-fg-disabled: var(--yt-spec-text-disabled);
            --ytpa-cta: var(--yt-spec-call-to-action);
        }
    `],
    ['ytpa-style', /* language=css */ `
        .ytpa-btn {
            border-radius: 8px;
            font-family: 'Roboto', 'Arial', sans-serif;
            font-size: 1.4rem;
            line-height: 2rem;
            font-weight: 500;
            margin-left: 0.6em; /* this might be obsolet in new UI, see below */
            user-select: none;
            display: inline-flex;
            flex-direction: column;
            justify-content: center;
            vertical-align: top;
            padding: 0 0.5em;
            /*noinspection CssUnresolvedCustomProperty*/
            height: var(--ytpa-height);
        }

        /* 20260220-0 margin seems unnecessary on new UI */
        chip-bar-view-model.ytChipBarViewModelHost:has(div.ytChipBarViewModelChipWrapper) .ytChipBarViewModelChipBarScrollContainer + .ytpa-btn {
            margin-left: 0
        }

        .ytpa-btn, .ytpa-btn > * {
            text-decoration: none;
            cursor: pointer;
        }

        .ytpa-btn-sections {
            padding: 0;
            flex-direction: row;
        }

        .ytpa-btn-sections > .ytpa-btn-section {
            display: flex;
            flex-direction: column;
            justify-content: center;
            vertical-align: top;
            padding: 0 0.5em;
        }

        .ytpa-btn-sections > .ytpa-btn-section:first-child {
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
        }

        .ytpa-btn-sections > .ytpa-btn-section:nth-last-child(1 of .ytpa-btn-section) {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
        }

        .ytpa-play-all-btn.ytpa-unsupported {
            background-color: #828282;
            color: white;
        }

        .ytpa-random-popover {
            position: absolute;
            border-radius: 8px;
            font-size: 1.6rem;
            transform: translate(-100%, 0.4em);
            z-index: 10000;
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
            padding: 0 0.4em;
            display: inline-flex !important;
        }

        body:has(#secondary ytd-playlist-panel-renderer[ytpa-random]) .ytp-prev-button.ytp-button,
        body:has(#secondary ytd-playlist-panel-renderer[ytpa-random]) .ytp-next-button.ytp-button:not([ytpa-random="applied"]),
        body:has(#below ytd-playlist-panel-renderer[ytpa-random]) .ytp-prev-button.ytp-button,
        body:has(#below ytd-playlist-panel-renderer[ytpa-random]) .ytp-next-button.ytp-button:not([ytpa-random="applied"]) {
            display: none !important;
        }

        #secondary ytd-playlist-panel-renderer[ytpa-random] ytd-menu-renderer.ytd-playlist-panel-renderer,
        #below ytd-playlist-panel-renderer[ytpa-random] ytd-menu-renderer.ytd-playlist-panel-renderer {
            height: 1em;
            visibility: hidden;
        }

        #secondary ytd-playlist-panel-renderer[ytpa-random]:not(:hover) ytd-playlist-panel-video-renderer,
        #below ytd-playlist-panel-renderer[ytpa-random]:not(:hover) ytd-playlist-panel-video-renderer {
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
        ytm-feed-filter-chip-bar-renderer > div :nth-child(3).selected ~ .ytpa-btn:not(.ytpa-unsupported), ytd-feed-filter-chip-bar-renderer iron-selector#chips :nth-child(3).iron-selected ~ .ytpa-btn:not(.ytpa-unsupported) {
            display: none;
        }

        .ytpa-random-btn-tab-fix {
            visibility: hidden;
            height: 0;
            width: 0;
        }

        .ytpa-button-container ~ .ytpa-button-container {
            display: none;
        }

        /* [2025-11] Fix for the new UI */
        .ytp-next-button.ytp-button.ytp-playlist-ui[ytpa-random="applied"] {
            border-radius: 100px !important;
            margin-left: 1em !important;
        }
    `],
    ['ytpa-buttons', (() => {
        const s = G.s.ui;

        const ifUi = setting => `html[ytpa-ui-setting~="${setting}"]`;

        /* language=css */
        return `
            .ytpa-play-all-btn {
                --ytpa-playbtn-uniquecolor: #890097;
                --ytpa-playbtn-uniquecolor-hover: #b247cc;
                --ytpa-playbtn-text: white;
            }
            
            .ytpa-random-btn, .ytpa-random-notice, .ytpa-random-popover {
                --ytpa-playbtn-uniquecolor: #2053b8;
                --ytpa-playbtn-uniquecolor-hover: #2b66da;
                --ytpa-playbtn-text: white;
            }
            
            /* CLASSIC */
            ${ifUi(s.button.theme.classic)} :is(.ytpa-play-all-btn, .ytpa-random-btn > .ytpa-btn-section, .ytpa-random-notice, .ytpa-random-popover > *) {
                background-color: var(--ytpa-playbtn-uniquecolor);
                color: var(--ytpa-playbtn-text);
            }

            ${ifUi(s.button.theme.classic)} :is(.ytpa-play-all-btn, .ytpa-random-btn > .ytpa-btn-section, .ytpa-random-notice, .ytpa-random-popover > *):hover {
                background-color: var(--ytpa-playbtn-uniquecolor-hover);
            }

            /* ADAPTIVE */
            ${ifUi(s.button.theme.adaptive)} :is(.ytpa-play-all-btn, .ytpa-random-btn > .ytpa-btn-section, .ytpa-random-notice, .ytpa-random-popover > *) {
                background-color: var(--ytpa-bg-additive);
                color: var(--ytpa-fg-primary);
            }

            /* ADAPTIVE OUTLINE */
            ${ifUi(s.button.theme.adaptiveOutline)} :is(.ytpa-play-all-btn, .ytpa-random-btn > .ytpa-btn-section, .ytpa-random-notice, .ytpa-random-popover > *) {
                background-color: var(--ytpa-bg-additive);
                color: var(--ytpa-fg-primary);
            }

            ${ifUi(s.button.theme.adaptiveOutline)} :is(.ytpa-play-all-btn, .ytpa-random-btn) {
                --thickness: 2px;
                --translate: -2px;
                transform: translate(var(--translate), var(--translate));
                box-sizing: content-box;
                border: var(--thickness) solid var(--ytpa-playbtn-uniquecolor);
            }
        `;
    })()],
    ['ytpa-dialog', /* language=css */ `
        /*
            .ytpa-dialog
                .ytpa-dialog-head
                    .ytpa-dialog-title
                    form
                        .ytpa-dialog-close-btn
                .ytpa-dialog-body
        */

        .ytpa-dialog {
            border: none;
            border-radius: 1rem;
            background-color: var(--ytpa-bg-menu);
            color: var(--ytpa-fg-primary);
            font-size: 24px;
        }
        
        .ytpa-dialog :is(input, button, textarea, select) {
            background-color: var(--ytpa-bg-additive);
        }
        
        .ytpa-dialog :is(input, button, select) {
            cursor: pointer;
        }
        
        .ytpa-dialog .ytpa-dialog-head {
            display: flex;
            gap: 2em;
        }

        .ytpa-dialog .ytpa-dialog-title {
            flex: 1;
            display: inline-block;
            font-size: 1.4em;
            border-bottom: 1px solid color-mix(in srgb, var(--ytpa-fg-primary) 30%, transparent);
            padding-bottom: 0.2em;
            margin-bottom: 0.6em;
        }
        
        .ytpa-dialog .ytpa-dialog-head form {
            display: inline-block;
        }

        .ytpa-dialog .ytpa-dialog-close-btn {
            border: none;
            color: var(--ytpa-fg-primary);
            font-weight: bold;
            font-size: 36px;
            width: 46px;
            height: 46px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-radius: 0.32em;
        }

        .ytpa-dialog {
            width: min(100% - 2rem, 80rem);
        }
        @media (max-width: 400px) {
            /* TODO: there might be an actual world where i'd support mobile settings... maybe... not today though! */
            .ytpa-dialog {
                width: 100vw;
                height: 100vw;
                border-radius: 0;
            }
        }
    `],
    ['ytpa-settings-dialog', /* language=css */ `
        /*
            .ytpa-settings-component-container
                div
                    label
                    .ytpa-settings-component
                .ytpa-settings-component-help

            OR

            .ytpa-settings-component-container
                label.ytpa-settings-component
                .ytpa-settings-component-help
        */

        .ytpa-settings-component-container:not(:last-child) {
            margin-bottom: 1em;
        }

        .ytpa-settings-component-container {
            background-color: red; border: 2px solid darkred; /* TODO: remove */
            display: flex;
            flex-direction: column;
        }

        .ytpa-settings-component {
            background-color: cyan; border: 2px solid darkcyan; /* TODO: remove */
        }

        .ytpa-settings-component-help {
            background-color: lime; border: 2px solid green; /* TODO: remove */
        }
    `],
]))((() => {
    // -- scriptGlobals --

    // where the things live that are needed everywhere, except for the outside world

    const settings = {
        ui: {
            button: {
                theme: {
                    classic: 'button-theme-classic',
                    adaptive: 'button-theme-adaptive',
                    adaptiveOutline: 'button-theme-adaptive-outline',
                },
            },
        },
    };

    const defaults = {
        ui: [settings.ui.button.theme.adaptiveOutline],
    };

    return {
        s: settings,
        defaults,
    };
})());

/**
 * @var {{
 *  xmlHttpRequest: (object) => void,
 *  info: {
 *      script: {
 *          version: string,
 *      },
 *  },
 * }} GM
 */
/**
 * @var {{ userAgentData: any }&Navigator} navigator
 */
/**
 * @template K
 *
 * @typedef {
 *  (
 *      event: K,
 *      handler: (event: GlobalEventHandlersEventMap[K]) => any
 *  ) => WrappedElementBuilder
 * } WrappedElementBuilderOnHandler
 */
/**
 * @typedef {Object} WrappedElementBuilder
 * @property {() => HTMLElement} build
 * @property {(fn: (element: HTMLElement) => void) => WrappedElementBuilder} onBuild
 * @property {(...append: Array<Node|string>) => WrappedElementBuilder} onBuildAppend
 * @property {(text: string) => WrappedElementBuilder} onBuildText
 * @property {WrappedElementBuilderOnHandler<keyof GlobalEventHandlersEventMap>} on
 * @property {(value: string) => WrappedElementBuilder} id
 * @property {(value: string) => WrappedElementBuilder} className
 * @property {(value: string) => WrappedElementBuilder} addClass
 * @property {(value: string) => WrappedElementBuilder} name
 * @property {(value: string) => WrappedElementBuilder} href
 * @property {(value: string) => WrappedElementBuilder} target
 * @property {(value: string) => WrappedElementBuilder} rel
 * @property {(value: string) => WrappedElementBuilder} role
 * @property {(value: string) => WrappedElementBuilder} tabindex
 * @property {(value: string) => WrappedElementBuilder} hidden
 * @property {(value: string) => WrappedElementBuilder} style
 * @property {(value: string) => WrappedElementBuilder} type
 * @property {(value: string) => WrappedElementBuilder} method
 * @property {(value: string) => WrappedElementBuilder} value
 * @property {(value: string) => WrappedElementBuilder} checked
 * @property {(value: string) => WrappedElementBuilder} selected
 * @property {(value: string) => WrappedElementBuilder} for
 * @property {(value: string) => WrappedElementBuilder} aria_label
 * @property {(value: string) => WrappedElementBuilder} aria_haspopup
 * @property {(value: string) => WrappedElementBuilder} aria_expanded
 * @property {(value: string) => WrappedElementBuilder} aria_hidden
 * @property {(value: string) => WrappedElementBuilder} aria_describedby
 * @property {(value: string) => WrappedElementBuilder} data_list
 * @property {(value: string) => WrappedElementBuilder} data_index
 */
// BEWARE, THE BELOW JSDOC IS NOT FOR THE FAINT OF HEART
// This is not unhinged, this isn't even overhinged, we have arrived at extrahinged.
/**
 * @template T
 *
 * @typedef {T & {[key: string]: any}} HookBag
 */
/**
 * @template T
 * @template {any[]} TParams
 *
 * @typedef {(...args: TParams) => T} _Component_Dsl
 */
/** @typedef {any[] | {[key: any]: any}} _Component_Dsl_Param_ArrayObject */
/** @typedef {ComponentWithHookHelp<{}>} _Component_DefaultHook */
// HOOKS
/**
 * @template T
 *
 * @typedef {T&{ withTest: (string) => ComponentWithHookTest<T>, hooked: hooked & { test: string }}} ComponentWithHookTest
 */
/**
 * @template T
 *
 * @typedef {T&{ withHelp: (string) => ComponentWithHookHelp<T>, hooked: hooked & { help: string } }} ComponentWithHookHelp
 */
// VALUES
/** @typedef {{ of: any, value: any, initial: any, m: {}, hooked: HookBag } | _Component_DefaultHook} ComponentBase */
/** @typedef {{ m: { dummy: _ } } & ComponentBase | ComponentWithHookTest} ComponentDummy */
/** @typedef {{ m: { text: _ } } & ComponentBase} ComponentText */
/** @typedef {{ m: { textarea: _ } } & ComponentBase} ComponentTextarea */
/** @typedef {{ m: { password: _ } } & ComponentBase} ComponentPassword */
/** @typedef {{ m: { number: _ } } & ComponentBase} ComponentNumber */
/** @typedef {{m: { toggle: _ }} & ComponentBase} ComponentToggle */
/** @typedef {{ m: { oneOf: _ } } & ComponentBase} ComponentOneOf */
/** @typedef {{ m: { anyOf: _ } } & ComponentBase} ComponentAnyOf */
/**
 * @typedef {
 *  {}
 *  | ComponentDummy
 *  | ComponentText
 *  | ComponentTextarea
 *  | ComponentPassword
 *  | ComponentNumber
 *  | ComponentToggle
 *  | ComponentAnyOf
 *  | ComponentOneOf
 * } ComponentT
 */
/**
 * @typedef {{ map: Map<{ name: string, displayText: string }, ComponentT> }} ValueDialogComponents
 */
