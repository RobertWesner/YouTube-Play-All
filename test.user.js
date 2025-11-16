// ==UserScript==
// @name            YouTube Play All Test Suite
// @description     Tests YTPA to prevent bugs
// @version         20251116-0
// @author          Robert Wesner (https://robert.wesner.io)
// @license         MIT
// @namespace       http://robert.wesner.io/
// @match           https://*.youtube.com/*
// @icon            https://scripts.yt/favicon.ico
// @downloadURL     https://raw.githubusercontent.com/RobertWesner/YouTube-Play-All/main/test.user.js
// @updateURL       https://raw.githubusercontent.com/RobertWesner/YouTube-Play-All/main/test.user.js
// ==/UserScript==

// ### ABOUT ###
//
// This is a supplementary simplified testing script to verify correctness of YTPA when
// pipelines are not available and contributors can't use the Puppeteer-based tests.
//
// .--------------------------------------------------------------------------.
// | Note:                                                                    |
// | This is less complete than scripts within the "testing" directory.       |
// | This script predates those tests and still offer a lot of basic testing. |
// | The automation is strongly preferred; this is the fallback.              |
// '--------------------------------------------------------------------------'
//
// ### USAGE ###
//
// 1. Visit https://www.youtube.com/
// 2. Run: YTPATestSuite.test()
// 3. Follow on-screen instructions

(function () {
    'use strict';

    if (window.hasOwnProperty('trustedTypes') && !window.trustedTypes.defaultPolicy) {
        window.trustedTypes.createPolicy('default', { createHTML: string => string });
    }

    document.head.insertAdjacentHTML('beforeend', `
        <style>
            #ytpa-test-suite {
                position: fixed;
                right: 2rem;
                bottom: 2rem;
                border-radius: 1rem;
                background: #1b1b1b;
                color: white;
                font-size: 14px;
                padding: 1.6rem;
                z-index: 999999;
                max-width: 30vw;
            }
            
            #ytpa-test-suite .ytpa-test-suite-step[data-completed] + .ytpa-test-suite-step:not([data-completed]),
            #ytpa-test-suite .ytpa-test-suite-step:first-of-type:not([data-completed])
            {
                color: #fcfca1;
            }
            
            .ytpa-test-suite-step[data-completed] {
                color: #c0f5c0 !important;
            }
            
            .ytpa-test-suite-step[data-failed] {
                color: #ff3535 !important;
            }
            
            .ytpa-test-suite-step:not(:last-of-type){
                margin-bottom: 0.64rem;
            }
            
            .ytpa-test-suite-step > div {
                padding-left: 1rem;
                opacity: 0.82;
            }
        </style>
    `);

    /**
     * @param {() => boolean} condition
     * @return {Promise}
     */
    const waitFor = condition => {
        return new Promise(resolve => {
            setTimeout(() => {
                const interval = setInterval(() => {
                    if (!condition()) {
                        return;
                    }

                    setTimeout(() => resolve(), 1000);
                    clearInterval(interval);
                }, 100);
            }, 500);
        });
    };

    let suite = null;
    const createSuite = () => {
        suite = document.createElement('div');
        suite.id = 'ytpa-test-suite';
        document.body.append(suite);
    };

    const addStep = (id, title, description) => {
        const step = document.createElement('div');
        step.className = 'ytpa-test-suite-step';
        step.setAttribute('data-step', id);

        const stepTitle = document.createElement('strong');
        stepTitle.textContent = title;
        const stepDescription = document.createElement('div');
        stepDescription.innerHTML = description;
        step.append(stepTitle, stepDescription);

        suite.append(step);
    };

    const completeStep = id => {
        const step = suite.querySelector(`[data-step=${id}]`);
        step.setAttribute('data-completed', '');
    };

    const failStep = id => {
        const step = suite.querySelector(`[data-step=${id}]`);
        step.setAttribute('data-failed', '');

        throw 'FAILURE';
    };

    const getButton = () => document.querySelector('.ytpa-btn.ytpa-play-all-btn:not([data-stale])');
    const markButtonAsStale = () => getButton().setAttribute('data-stale', '');

    const getSearch = () => document.querySelector('.ytSearchboxComponentInput');
    const getSearchButton = () => document.querySelector('.ytSearchboxComponentSearchButton');
    const search = async text => {
        await waitFor(() => !!getSearch());
        getSearch().value = text;
        getSearch().dispatchEvent(new Event('input'));
        getSearchButton().click();
    };

    window.addEventListener('load', () => {
        switch (new URLSearchParams(new URL(window.location.href).search).get('ytpa-test-run')) {
            case 'initial':
                unsafeWindow.YTPATestSuite.test();
                break;
            case 'videos':
                unsafeWindow.YTPATestSuite.testVideosFreshLoad();
                break;
        }
    });

    Object.defineProperty(unsafeWindow, 'YTPATestSuite', {
        configurable: false,
        writable: false,
        value: Object.freeze({
            test: async () => {
                if (document.querySelector('[rel="canonical"]').href !== 'https://www.youtube.com/') {
                    alert('Did not start from a clean base, try again after reloading window.');
                    window.location.href = 'https://www.youtube.com/';
                }

                if (document.querySelector('#ytpa-test-suite')) {
                    alert('Tests already running!');
                }
                createSuite();

                addStep('home', 'Homepage', 'Start in homepage.');
                addStep('channel', '@TechnologyConnections', 'Navigate to @TechnologyConnections.');
                addStep('videos', 'Videos', 'Click on <strong>Videos</strong>.');
                addStep('latest', 'Latest Videos', 'Checking for correct URL.');
                addStep('popular', 'Popular Videos', 'Checking for correct URL.');
                addStep('latest-repeat', 'Latest Videos (again)', 'Checking for correct URL.');
                addStep('popular-repeat', 'Popular Videos (again)', 'Checking for correct URL.');
                addStep('refresh', 'Refresh', 'Refreshing page and running more tests.');

                await waitFor(() => window.location.href.endsWith('.youtube.com/'));
                completeStep('home');

                await search('TechnologyConnections')
                await waitFor(() => !!document.querySelector('[href="/@TechnologyConnections"]'));
                document.querySelector('[href="/@TechnologyConnections"]').click();
                await waitFor(() => window.location.href.endsWith('.youtube.com/@TechnologyConnections'));
                completeStep('channel');

                await waitFor(() => !!document.querySelector('[tab-title="Videos"]'));
                document.querySelector('[tab-title="Videos"]').click();
                await waitFor(() => window.location.href.endsWith('.youtube.com/@TechnologyConnections/videos'));
                completeStep('videos');

                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('latest');
                    markButtonAsStale();
                } else {
                    failStep('latest');
                }

                document.querySelector('#primary #chips > :nth-child(2), #filter-chip-bar > div > :nth-child(2)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('popular');
                    markButtonAsStale();
                } else {
                    failStep('popular');
                }

                document.querySelector('#primary #chips > :nth-child(1), #filter-chip-bar > div > :nth-child(1)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('latest-repeat');
                    markButtonAsStale();
                } else {
                    failStep('latest-repeat');
                }

                document.querySelector('#primary #chips > :nth-child(2), #filter-chip-bar > div > :nth-child(2)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('popular-repeat');
                    markButtonAsStale();
                } else {
                    failStep('popular-repeat');
                }

                document.querySelector('#primary #chips > :nth-child(1), #filter-chip-bar > div > :nth-child(1)').click();
                await waitFor(() => !!getButton());

                window.location.href = '/@TechnologyConnections/videos?ytpa-test-run=videos';
            },
            testVideosFreshLoad: async () => {
                if (document.querySelector('#ytpa-test-suite')) {
                    alert('Tests already running!');
                }
                createSuite();

                addStep('latest', 'Latest Videos', 'Checking for correct URL.');
                addStep('popular', 'Popular Videos', 'Checking for correct URL.');
                addStep('latest-repeat', 'Latest Videos (again)', 'Checking for correct URL.');
                addStep('popular-repeat', 'Popular Videos (again)', 'Checking for correct URL.');
                addStep('crd-videos', 'CRD Videos', 'Checking for correct URL.');
                addStep('crd-shorts', 'CRD Shorts', 'Checking for correct URL.');
                addStep('crd-shorts-popular', 'CRD Latest Shorts', 'Checking for correct URL.');
                addStep('success', 'Success', 'All done!');

                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('latest');
                    markButtonAsStale();
                } else {
                    failStep('latest');
                }

                document.querySelector('#primary #chips > :nth-child(2), #filter-chip-bar > div > :nth-child(2)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('popular');
                    markButtonAsStale();
                } else {
                    failStep('popular');
                }

                document.querySelector('#primary #chips > :nth-child(1), #filter-chip-bar > div > :nth-child(1)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('latest-repeat');
                    markButtonAsStale();
                } else {
                    failStep('latest-repeat');
                }

                document.querySelector('#primary #chips > :nth-child(2), #filter-chip-bar > div > :nth-child(2)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('popular-repeat');
                    markButtonAsStale();
                } else {
                    failStep('popular-repeat');
                }

                await search('Cathode Ray Dude CRD');
                await waitFor(() => !!document.querySelector('[href="/@CathodeRayDude"]'));
                document.querySelector('[href="/@CathodeRayDude"]').click();
                await waitFor(() => !!document.querySelector('[tab-title="Videos"]'));
                document.querySelector('[tab-title="Videos"]').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('crd-videos');
                    markButtonAsStale();
                } else {
                    failStep('crd-videos');
                }

                await waitFor(() => !!document.querySelector('[tab-title="Shorts"]'));
                document.querySelector('[tab-title="Shorts"]').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UUSHXnNibvR_YIdyPs8PZIBoEw&playnext=1')) {
                    completeStep('crd-shorts');
                    markButtonAsStale();
                } else {
                    failStep('crd-shorts');
                }

                document.querySelector('#primary #chips > :nth-child(2), #filter-chip-bar > div > :nth-child(2)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UUPSXnNibvR_YIdyPs8PZIBoEw&playnext=1')) {
                    completeStep('crd-shorts-popular');
                    markButtonAsStale();
                } else {
                    failStep('crd-shorts-popular');
                }

                // DONE

                completeStep('success');
                alert('All tests passed!');
                suite.remove();
            },
        }),
    });
})();

/**
 * @var {{ defaultPolicy: any, createPolicy: (string, Object) => void }} window.trustedTypes
 */
